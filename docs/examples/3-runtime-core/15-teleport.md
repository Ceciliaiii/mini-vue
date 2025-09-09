# teleport

Teleport 通过 to 属性指定目标 DOM 节点，内部包裹需要 “传送” 的内容：
```ts
// 将弹窗内容渲染到 <body> 下
const Popup = {
  render() {
    return h(teleport, { to: 'body' }, [
           h('div', { class: 'modal' }, [h('h2', '弹窗标题'), h('p', '这是弹窗内容')])
    ]);
  }
};


// 父组件使用
const App = {
  render() {
    return h('div', { class: 'app' }, [
                h('h1', '主应用'),
                h(Popup) // Popup 中的内容会被"传送"到 body 下
    ]);
  }
};
```
渲染效果如下：
```html
<!-- 父组件 App 本身渲染的 DOM（逻辑上包含 Popup，但物理上不包含其内容） -->
<div class="app">
  <h1>主应用</h1>
</div>

<!-- Teleport 内容被渲染到目标容器 <body> 下（而非 .app 内部） -->
<body>

  <!-- Teleport 传送过来的弹窗内容（来自 Popup 组件） -->
  <div class="modal">
    <h2>弹窗标题</h2>
    <p>这是弹窗内容</p>
  </div>
</body>
```