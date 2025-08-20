# watchEffect

## 和 `watch` 的关系
`watchEffect` 是 `watch` 的简化版本，通过 `doWatch` 函数实现，核心区别是 没有回调函数（cb 为 null）：
```ts
export function watchEffect(source, options = {}) {

  // 调用doWatch，第二个参数传递null表示没有回调
  return doWatch(source, null, options as any)
}
```

## 执行
在 `doWatch` 函数中，针对 `watchEffect`（cb 为 null）的处理：
```ts
const job = () => {
  if(cb) {
                // watch的处理逻辑（有回调）
  } else {
    effect.run()  // watchEffect直接执行副作用函数
  }
}

// 初始化执行
if(cb) {
                // watch的初始化逻辑
} else {
  // watchEffect：直接执行副作用函数
  effect.run()
}

```

## 依赖收集机制（和 effect 类似）
与 watch 共享依赖收集逻辑，通过 `getter` 函数和 `traverse` 实现：
 - 当 `source` 是函数时，`getter` 直接指向该函数
 - 执行 `effect.run()` 时，执行 `getter`（用户传入的 `source` 函数）
 - 执行过程中访问的响应式数据（ref / reactive）会自动收集当前 effect
 - 数据变化时，触发 `job`，重新执行 `getter`