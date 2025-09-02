# Vue 组件渲染与更新
将组件的响应式状态，通过 `render` 函数转换为虚拟节点，最终渲染为真实 DOM

## 创建组件虚拟节点
首先通过 `createVnode` 生成 “组件类型的虚拟节点”，代码中通过 `shapeFlag` 标记节点类型：
```ts
export function createVnode(type, props, children?) {

  // 若 type 是对象（组件选项，如 { data, render }），标记为 STATEFUL_COMPONENT
  //   否则是元素
  const shapeFlag = isString(type) ? 
                    ShapeFlags.ELEMENT : isObject(type)? 
                    ShapeFlags.STATEFUL_COMPONENT : 0;
  
  // ... 生成 vnode（包含 type: 组件选项、shapeFlag: 组件标记）
}
```

## `mountComponent`：组件渲染
`reactive(data())` 把组件状态转为响应式，后续状态修改会被监听；通过 `instance` 存储组件状态、子虚拟节点等信息，为后续更新做准备
```ts
const mountComponent = (n2, container, anchor) => {

  // 1. 提取组件选项：data（状态函数）、render（渲染函数）
  const { data = () => {}, render } = n2.type;


  // 2. 把组件状态转为响应式（状态变化会触发重渲染）
  const state = reactive(data());


  // 3. 创建组件实例（存储组件核心信息）
  const instance = {
    state,        //  响应式状态
    vnode: n2,    //  组件虚拟节点
    subTree: null,//  组件渲染出的“子虚拟节点”（即 render 函数返回的 vnode）
    isMounted: false, //  是否首次渲染完成
    update: null  //  组件更新函数
  };

    // ...
};
```
`render.call(state)` 以响应式状态为参数（后续参数换为`instance.proxy`区分`state、props、$attrs`），生成 “子虚拟节点 subTree ”；`patch` 把 subTree 转为真实 DOM，插入容器；
```ts
// 4. 组件渲染/更新 （首次渲染 + 状态变化后更新）
  const componentUpdateFn = () => {
    if (!instance.isMounted) {

      // 首次渲染：执行 render 函数生成子虚拟节点
      // 后续参数改成instance.proxy，区分state、props、$attrs
      const subTree = render.call(state, state);

      // 把 subTree 渲染为真实 DOM（插入 container）
      patch(null, subTree, container, anchor);

      // 更新实例状态：标记已挂载，保存子虚拟节点
      instance.isMounted = true;
      instance.subTree = subTree;
    } 
    else {

      // 状态变化后更新：重新执行 render 生成新 subTree
      // 后续参数改成instance.proxy，区分state、props、$attrs
      const newSubTree = render.call(state, state);  

      // 对比新旧 subTree，只更新差异部分（复用 DOM）
      patch(instance.subTree, newSubTree, container, anchor);

      // 更新子虚拟节点缓存
      instance.subTree = newSubTree;
    }
  };
```
响应式副作用 effect
```ts

  // 5. 创建响应式副作用（状态变化触发更新）
  // ReactiveEffect：监听 state 变化，变化后执行 scheduler（异步队列）
  const effect = new ReactiveEffect(componentUpdateFn, () => queueJob(update));

  // 6. 组件更新函数：触发 effect 重新执行（即调用 componentUpdateFn）
  const update = (instance.update = () => effect.run());

  // 7. 首次执行更新：触发组件首次渲染
  update();
```


## 组件异步更新：批量处理状态变化
当 `data()` 中任意属性变化时，触发 `schduler`，通过 `queueJob` 实现 异步批量更新：
 - 任务去重：多次修改同一属性值，合并为一次更新；
 - `isFlushing`：确保同一时间只存在一个正在执行的微任务；
 - 拷贝队列：避免执行中队列的数据被修改而重新进入queue，打乱顺序；

```ts
const queue: any[] = []; // 存储待执行的更新任务
const resolvePromise = Promise.resolve(); // 利用 Promise 微任务实现异步
let isFlushing = false; // 标记是否正在执行队列（避免重复执行）

export function queueJob(job) {

  // 同一属性的更新任务只加入队列一次
  if (!queue.includes(job)) {
    queue.push(job);
  }


  // 若未在执行队列，触发异步执行
  if (!isFlushing) {
    isFlushing = true;


    // 微任务中执行队列：等待当前同步代码执行完后，再批量处理更新
    // 例如，三次++都执行完成，再批量执行队列里的数值更新，最后清空队列
    resolvePromise.then(() => {
      isFlushing = false; // 重置标记
      const copy = queue.slice(0); // 拷贝队列
      queue.length = 0; // 清空原队列
      copy.forEach((job) => job()); // 批量执行所有更新任务
      copy.length = 0;
    });
  }
}
```
