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


## emit
子组件通过约定的事件名，找到父组件传递的回调函数并执行

### 父组件传递 “事件回调”，子组件调用 emit 触发父组件回调
 - 父组件使用子组件时，会通过 `@事件名`（如 `@MyEvent`）传递回调函数，这些回调会被包装成 `on+首字母大写事件名` 的属性（如 `onMyEvent`），存入子组件的 `vnode.props` 中；  
 - 在子组件 `setup` 中，调用 `emit` 传递事件和参数，最终触发父组件的回调；

### 子组件 setupContext 提供 emit 函数
在 setupContext 中定义 emit 函数，找到父组件的回调并执行：
```ts
if (setup) {
  const setupContext = {
    slots: instance.slots,
    attrs: instance.attrs,

    // 定义 emit 函数：接收事件名（event）和参数（payload）
    emit(event, ...payload) {

      // 事件名格式转换：子组件调用的 change → 父组件 props 中的 'onChange'
      const eventName = `on${event[0].toUpperCase() + event.slice(1)}`;

      // 从子组件 vnode.props 中，找到父组件传递的回调函数（如 onChange）
      const handler = instance.vnode.props[eventName];

      // 执行回调，并传入子组件传递的参数（payload）
      handler(...payload);
    }
  };

  // 将 setupContext 传入 setup
  const setupResult = setup(instance.props, setupContext);
}
```
父组件传递给子组件的所有‘数据 / 事件’，最终都会统一存入子组件的 `vnode.props` 中，是父子组件通信的 “统一载体”