# 虚拟 DOM 渲染
核心：将虚拟节点（vnode）转换为真实 DOM，并通过跨平台渲染接口解耦核心逻辑与具体平台。

 - 虚拟节点（vnode）：用 js 对象描述真实 DOM 的结构（包含 `type` 标签名、`props` 属性、`children` 子节点、`shapeFlag` 节点类型标记）。
 - 跨平台渲染接口（renderOptions）：由 `runtime-dom` 提供的 DOM 操作能力（如 `nodeOps` 的节点增删、`patchProp` 的属性操作），让 `runtime-core` 不依赖具体平台（浏览器 / 小程序等）。


## 渲染流程
整体渲染入口是 `runtime-dom` 的 `render` 函数，最终通过 `runtime-core` 的 `patch` 逻辑完成 **“虚拟节点 → 真实 DOM”** 的转换。

## `runtime-dom` 入口：创建渲染器并触发渲染
为 `runtime-core` 提供浏览器 DOM 操作的具体实现。
```ts
// index.ts
// runtime-dom 提供 DOM 的节点、属性操作（nodeOps + patchProp）
const renderOptions = Object.assign({ patchProp }, nodeOps);


// 对外暴露的 render 方法：接收虚拟节点（vnode）和容器（container）
export const render = (vnode, container) => {

  // 1. 调用 runtime-core 的 createRenderer，传入 DOM 操作
  // 2. 调用渲染器的 render 方法，开始渲染
  return createRenderer(renderOptions).render(vnode, container);
};
```

## `runtime-core`：核心渲染

### `createRenderer`
跨平台渲染的核心，内部封装了 `patch`（节点对比与更新）、`mountElement`（初始化挂载元素）等逻辑。  

```ts
// render()  渲染入口（缓存旧节点，触发 patch）

const render = (vnode, container) => {

  // 1. 调用 patch 对比：旧虚拟节点（container._vnode） vs  新虚拟节点（vnode）
  // 2. 首次渲染时，旧节点为 null，执行初始化挂载
  patch(container._vnode || null, vnode, container);

  // 3. 缓存新节点，供下次更新时对比
  container._vnode = vnode;
};
```
  
### `patch`
判断渲染场景（首次挂载 / 更新），当前代码只实现「首次挂载」，核心是 `mountElement`。
```ts
// 参数：n1旧节点、n2新节点
const patch = (n1, n2, container) => {
  if (n1 === n2) return; // 新旧节点相同，跳过渲染
  
  if (n1 === null) {
    
    // 场景1：首次渲染（无旧节点）→ 执行挂载
    mountElement(n2, container);
  }
  // （后续会扩展“更新场景”：n1和n2都存在时，对比差异更新）
};
```


### `mountElement`
元素挂载（虚拟节点 -> 真实 DOM）  
创建真实 DOM → 挂载属性 → 处理子节点 → 插入容器，完成 “虚拟节点到真实 DOM” 
```ts
const mountElement = (vnode, container) => {
  const { type, children, props, shapeFlag } = vnode;

  // 1. 用平台接口创建真实 DOM 元素（如 <div>）
  let el = hostCreateElement(type); // 对应 nodeOps.createElement


  // 2. 处理元素属性（如 class、style、onClick）
  if (props) {
    for (const key in props) {
      // 调用平台的属性操作接口（patchProp）
      hostPatchProp(el, key, null, props[key]); 
    }
  }


  // 3. 处理子节点（与运算）
  // 通过 shapeFlag 快速判断子节点类型
  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {

    // 子节点是纯文本（如 <div>hello</div>）
    hostSetElementText(el, children); // 对应 nodeOps.setElementText
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {

    // 子节点是数组（如 <div><span></span><p></p></div>）
    mountChildren(children, el);
  }

  // 4. 将真实 DOM 插入容器中
  hostInsert(el, container); // 对应 nodeOps.insert
};
```


### `mountChildren`
批量挂载子节点，遍历子节点数组，递归执行 patch 实现批量挂载（支持嵌套子节点）
```ts
const mountChildren = (children, container) => {
  for (let i = 0; i < children.length; i++) {

    // 递归调用 patch，逐个挂载子节点（子节点也可能是虚拟节点）
    patch(null, children[i], container);
  }
};
```

## `shared/shapeFlags`：类型判断（识别节点类型）
通过「位运算」高效判断节点类型（与运算：`shapeFlag & ShapeFlags.TEXT_CHILDREN > 0` ，说明子节点是文本）  
而 shapeFlag = 父节点类型 / 子节点类型（或运算）
```ts
// 用位运算标记节点类型（元素/子节点类型）
export enum ShapeFlags {
  ELEMENT = 1,          // 01：标记“元素节点”（如 <div>）
  TEXT_CHILDREN = 1 << 3,// 10：标记“子节点是纯文本”
  ARRAY_CHILDREN = 1 << 4// 100：标记“子节点是数组”
// ...
}
```


## 跨平台
1. `runtime-core`： 只关心 “虚拟节点如何对比、如何调用接口” 等渲染逻辑，不关心具体平台的api。  
2. `runtime-dom`： 提供浏览器平台的具体实现（`nodeOps` 封装 DOM 节点操作，`patchProp` 封装属性操作），通过 `renderOptions` 传递给 `runtime-core`。
3. **扩展性**：若要适配小程序，只需新建 `runtime-mini` 目录，实现小程序平台的 `nodeOps`（如创建小程序节点）和 `patchProp`，即可复用 `runtime-core` 的核心渲染逻辑。