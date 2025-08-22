# `patchProp`：DOM 属性更新工具
`patchProp` 用于处理 DOM 元素的属性更新，主要用于元素属性的新增、修改、移除：
 - 类名（class）的动态更新
 - 内联样式（style）的差异更新
 - 事件监听的绑定与解绑


## 核心
根据属性类型 `key` 分发到不同模块的处理方法，为虚拟 DOM 的属性 diff 提供具体的 DOM 更新实现
```ts
// patchProp 可以是 patchClass || patchStyle || patchEvent || patchAttr 其中之一
export default function patchProp(el, key, prevValue, nextValue) {

  if (key === "class") {
    return patchClass(el, nextValue); // 处理类名
  } 
  else if (key === "style") {
    return patchStyle(el, prevValue, nextValue); // 处理样式
  } 
  else if (/^on[^a-z]/.test(key)) {
    return patchEvent(el, key, nextValue); // 处理事件（on开头且后接大写字母）
  }
  else {
    return patchAttr(el, key, nextValue); // 处理普通属性
  }
}
```

## 各模块
### `patchClass`：类名处理
直接操作元素的 `className` 属性或移除 `class` 属性
```ts
export default function patchClass(el, value) {
    
  if (value == null) {
    el.removeAttribute("class"); // 移除类名
  } 
  else {
    el.className = value; // 设置类名
  }
}
```


### `patchAttr`：普通属性处理
通过 `setAttribute` 和 `removeAttribute` 操作普通 HTML 属性
```ts
export default function patchAttr(el, key, value) {

  if (value === null) {
    el.removeAttribute(key); // 移除属性
  } 
  else {
    el.setAttribute(key, value); // 设置属性
  }
}
```


### `patchEvent`：事件处理
通过 `invoker` 包装事件回调，减少频繁绑定 / 解绑的性能损耗，用 `_vei` 属性缓存绑定过的事件，实现事件复用与动态更新
```ts
function createInvoker(value) {
    
  const invoker = (e) => invoker.value(e); // 包装事件回调
  invoker.value = value; // 存储真实回调，支持动态更新

  return invoker;
}


export default function patchEvent(el, name, nextValue) {

  const invokers = el._vei || (el._vei = {}); // 缓存事件方法
  const eventName = name.slice(2).toLowerCase(); // 提取事件名（如 onClick → click）
  const existingInvokers = invokers[name];

  // 若存在旧事件，需要更新事件
  if (nextValue && existingInvokers) {
    existingInvokers.value = nextValue; // 事件回调更新（复用已有监听）
  } 

  // 若不存在旧事件，直接添加新事件
  else if (nextValue) {
        // 新绑定事件：创建方法并添加监听
        const invoker = (invokers[name] = createInvoker(nextValue));
        el.addEventListener(eventName, invoker);
  } 

  // 只有旧事件，没有新事件
  else if (existingInvokers) {
        // 移除事件：移除监听并清理缓存
        el.removeEventListener(eventName, existingInvokers);
        invokers[name] = undefined;
  }
}
```


### `patchStyle`：样式处理
直接操作元素的 `style` 对象更新样式，对比新旧样式，自动清理不再需要的旧样式属性
```ts
export default function patchStyle(el, prevValue, nextValue) {
  let style = el.style;


  // 应用新样式
  for (let key in nextValue) {
    style[key] = nextValue[key];
  }


  // 清理旧样式中不存在的属性
  if (prevValue) {
    for (let key in prevValue) {
      if (nextValue[key] == null) {
        style[key] = null;
      }
    }
  }
}
```