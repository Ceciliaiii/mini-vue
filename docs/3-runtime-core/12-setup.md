# setup
组合式api，将数据和方法写到一起，解决反复横跳问题；setup 可以是 `render` 函数，也可以是对象；


## 初始化实例信息
```ts
const instance = {
        // ...
        setupState: {}
      }
```

## 执行环境
```ts
export function setupComponent(instance) {
  const { vnode } = instance;
  
  // 1. 先初始化 props（为 setup 提供 props 参数）
  initProps(instance, vnode.props);
  
  // 2. 创建 proxy 代理（让 setup 中返回的状态能被 render 访问）
  instance.proxy = new Proxy(instance, handler);
  
  // 3. 从组件选项中获取 setup 函数
  const { setup } = vnode.type;
  
  // ... 执行 setup 逻辑
}
```

## 执行 setup
setup 执行时，`instance` 尚未完全初始化（data、最终 render），所以不能访问 `this`：
```ts
if (setup) {
  // 创建 setup 上下文（包含 attrs、emit 等）
  const setupContext = {};
  

  // 调用 setup 函数，传入两个参数：
  // 1. props：组件接收的属性（响应式）
  // 2. setupContext：上下文对象
  const setupResult = setup(instance.props, setupContext);
  

  // 处理 setup 返回值
  if (isFunction(setupResult)) {
    
    // 若返回函数，将其作为组件的 render 函数
    instance.render = setupResult;
  } 
  else {

    // 若返回对象，将其作为组件状态（并自动脱 ref 处理，访问时无需 .value）
    instance.setupState = proxyRefs(setupResult);
  }
}
```


## 整合 setup 状态与其他组件状态
`setup` 返回的状态会与 `data、props` 等合并，通过 proxy 统一访问：
```ts
const handler = {
  get(target, key) {
    const { data, props, setupState } = target;
    
    // 访问优先级：data > props > setupState
    if (data && hasOwn(data, key)) return data[key];
    else if (props && hasOwn(props, key)) return props[key];
    else if (setupState && hasOwn(setupState, key)) return setupState[key];
    // ... 其他公共属性（如 $attrs）
  },
  set(target, key, value) {
    // state, props修改逻辑 ....

     else if(setupState && hasOwn(setupState, key)) {
            setupState[key] = value;
     }
  }
};
```
在 `render` 中可以用 `this.count` 访问 setup 中返回的 `count`