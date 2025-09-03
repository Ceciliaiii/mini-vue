# slots & emit

## slots
让父组件能向子组件传递自定义内容，子组件按约定位置渲染（具体见示例）；


### 插槽类型标记
首先在创建虚拟节点 `createVnode` 时，通过 `shapeFlag` 标记 “子节点是否为插槽”：
```ts
// createVnode

if (children) {
    // 普通数组子节点

    // 若子节点是对象（如 { default: () => h('div') }），标记为插槽子节点
    else if (isObject(children)) {
      vnode.shapeFlag |= ShapeFlags.SLOTS_CHILDREN; 
    } 

    // 文本子节点
  }
```

当父组件为以下示例时，`children` 会是 “插槽名 - 内容” 的对象，触发 `SLOTS_CHILDREN` 标记：
```ts
// 父组件
const parentVnode = h(Child, null, {
  default: () => h('div', '默认插槽内容'), // 默认插槽
  header: () => h('h1', '头部插槽内容')    // 具名插槽
});
```
此时 Child 的 `vnode.children` 是 `{ default: ..., header: ... }`，shapeFlag 含 `SLOTS_CHILDREN`


### `initSlot`：初始化插槽
调用 `initSlots` 将父组件传递的插槽内容，存储到子组件实例的 slots 属性中
```ts
// 初始化插槽
export function initSlots(instance, children) {

  // 判断子组件 vnode 是否标记为“插槽子节点”
  if (instance.vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN) {

    // 直接将 children（插槽对象）赋值给实例的 slots
    instance.slots = children; 
  }
  else {
    // 非插槽内容，初始化空 slots
    instance.slots = {}; 
  }
}

// 触发初始化
export function setupComponent(instance) {
  const { vnode } = instance;
  
  initProps(instance, vnode.props); // 初始化 props
  initSlots(instance, vnode.children); // 初始化 slots

  // ... 后续创建 proxy、执行 setup 等
}
```

### 访问插槽
通过 “Proxy 代理 + 公共属性映射” 实现 `this.$slots` 便捷访问:
```ts
// 公共属性访问器：$slots 指向实例的 slots
const publicProperty = {
  $attrs: (instance) => instance.attrs,
  $slots: (instance) => instance.slots, // $slots 对应 instance.slots
};


// Proxy 代理：让 this.$slots 能访问到 instance.slots
const handler = {
  get(target, key) {
    // ...
    // 访问公共属性（如 $slots）时，调用对应 getter
    const getter = publicProperty[key];
    if (getter) {
      return getter(target); // target 是子组件实例，返回 instance.slots
    }
  },
  // ... set 逻辑 ...
};


// 子组件实例创建 Proxy，确保 this 能访问 $slots
export function setupComponent(instance) {

  // ... 初始化 props、slots 后 ...
  instance.proxy = new Proxy(instance, handler); // 代理实例
}
```