# Effect 

## 1. 创建响应式数据
```ts
const obj = reactive({ count: 0 }); // 响应式对象
```

## 2. 创建 effect 副作用
```ts
effect(() => {
  console.log("count 值为：", obj.count); // 使用响应式数据
});
```

## 3. 初始化执行
  - 调用 `effect` 时，`_effect.run()` 立刻执行传入的 `fn`
  - 读取 `obj.count` 触发响应式对象的 `get` 拦截器
  - 拦截器内部调用 `track(obj, 'count')` 进行依赖收集
  - `track` 发现 `activeEffect` 存在，记录 `obj.count` 与当前 effect 的关联映射

## 4. 数据变化时
  - 修改 `obj.count = 1` 触发响应式对象的 `set` 拦截器
  - 找到 `obj.count` 关联的所有 effect
  - 调用这些 effect 的 `scheduler` 进行重新执行
  - 副作用函数 `effect` 自动重新执行，打印更新后的 `count` 值s