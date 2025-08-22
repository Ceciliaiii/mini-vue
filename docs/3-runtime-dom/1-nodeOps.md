# `nodeOps`：对节点元素的增删改查
`runtime-dom` 是针对浏览器的运行时, 包括 dom 操作和属性操作并导出一个预设的 `render` 函数  
```ts
export const nodeOps = {
  // 插入节点：在parent中插入el，anchor为插入位置参考节点（可选）
  insert: (el, parent, anchor) => parent.insertBefore(el, anchor || null),

  // 移除节点：通过父节点移除当前元素
  remove(el) {
    const parent = el.parentNode;
    parent && parent.removeChild(el); // 存在父节点时才执行移除
  },

  // 创建元素节点：根据标签名创建DOM元素
  createElement: (type) => document.createElement(type),

  // 创建文本节点：创建包含指定文本的文本节点
  createText: (text) => document.createTextNode(text),

  // 设置文本节点内容：修改文本节点的nodeValue
  setText: (node, text) => (node.nodeValue = text),

  // 设置元素文本内容：修改元素的textContent
  setElementText: (el, text) => (el.textContent = text),

  // 获取父节点：返回节点的parentNode
  parentNode: (node) => node.parentNode,

  // 获取下一个兄弟节点：返回节点的nextSibling
  nextSibling: (node) => node.nextSibling
};
```
**作用**：统一 DOM 操作接口，屏蔽不同环境的 DOM API 差异，为上层渲染逻辑（如虚拟 DOM 补丁）提供基础节点操作能力，简化节点增删改查的调用方式