# ref（结合组件与元素）
通过虚拟节点（vnode）的 `ref` 属性，在渲染 / 更新后将目标（DOM 或组件暴露内容）赋值给对应的响应式 `ref` 对象

## vnode 携带 ref
用户给元素 / 组件的 vnode 设置 `ref` 属性（例如 `{ ref: divRef }`），该属性会被存入新虚拟节点的ref值 `n2.ref`：
```ts
// 关联元素ref
const vnode = h('div', { ref: divRef }, '内容');

// 关联组件ref
const vnode = h(ChildComponent, { ref: divRef })
```
vnode 结构如下：
```md
vnode: { 
    type: 'div', 
    props: { ref: divRef }, 
    ref: divRef, 
    ... 
}
```

## 渲染后触发 `setRef`
在 `patch` 中，在完成元素 / 组件的 DOM 挂载 / 更新后，检查 `n2.ref` 是否存在，存在则调用 `setRef` 赋值：
```ts
const patch = (n1, n2, container, anchor = null) => {
  // ... 省略元素/组件的渲染逻辑（如 processElment、processComponent）...


  // 渲染完成后，若 vnode 有 ref 属性，执行 setRef 赋值
  if (n2.ref !== null) {

    setRef(n2.ref, n2); // 传入 ref 对象（n2.ref）和当前 vnode（n2）
  }
};
```

## `setRef` 确定赋值目标（元素 & 组件）
根据 vnode 类型（元素 / 组件），确定 `ref.value` 要指向的目标：
```ts
function setRef(rawRef, vnode) {
  let value;

  // vnode 是组件
  if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {

    // 优先取组件暴露的内容（vnode.component.exposed）
    // 若未暴露（没调用 expose），则取组件 proxy（能访问 props、data 等）
    value = vnode.component.exposed || vnode.component.proxy;
  } 
  
  // vnode 是普通元素
  else {

    // 取真实 DOM（vnode.el）
    value = vnode.el;
  }

  // 若 rawRef 是响应式 ref 对象（通过 ref() 创建），赋值给 rawRef.value
  if (isRef(rawRef)) {
    rawRef.value = value;
  }
}
```
当 `ref` 赋值真实 DOM 时，浏览器或 Node 环境中打印 `ref.value`，js 引擎会默认将其转换为 “可读性更高的 HTML 字符串”；  
例如 `ref.value.innerHTML = 文本内容`，也可以修改其他 DOM 元素对象：`ref.value.style.color = 文本颜色`