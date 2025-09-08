# ref（结合组件与元素）

## 元素 ref（获取真实 DOM）
```ts
const divRef = ref(null);

// 给元素 vnode 设置 ref 属性，关联 divRef
const vnode = h('div', { ref: divRef }, '我是普通元素');

// 渲染后，divRef.value 会自动指向该 div 的真实 DOM
render(vnode, container);

// divRef.value = <div>我是普通元素</div>（真实 DOM）
```
浏览器或 Node 环境中打印 DOM 元素对象时，js 引擎会默认将其转换为 “可读性更高的 HTML 字符串”


## 组件 ref（获取组件 expose 内容）
```ts
// 子组件：通过 expose 暴露指定内容（非暴露内容无法通过 ref 获取）
const Child = {
  setup(_, { expose }) {
    const count = ref(0);
    const add = () => count.value++;

    // 暴露 count 和 add（只有暴露的属性 能被父组件 ref 获取）
    expose({ count, add });
    return () => h('div', `count: ${count.value}`);
  }
};



// 父组件：
const childRef = ref(null);
const parentVnode = h(Child, { ref: childRef }); // 关联 ref

// 渲染后，childRef.value 指向子组件暴露的 { count, add }
render(parentVnode, container);

// childRef.value.count === 0（子组件暴露的响应式数据）

childRef.value.add(); // 调用子组件暴露的方法，count 变为 1
```