# Effect 调度器 `scheduler`

## 调度核心
调度（scheduler）本质是一个控制 effect 执行时机的函数。默认情况下，当依赖的数据变化时，effect 会立即重新执行；但通过自定义 scheduler，我们可以：

 - 延迟执行（如防抖节流）
 - 批量执行（如收集多次更新后一次性执行）
 - 条件执行（如满足特定条件才执行）

## 调度逻辑
### 调度函数的传递与覆盖
 - 默认调度器：创建 `ReacticeEffect` 时，第二个参数就是默认调度器，直接调用`_effect.run()`
 - 用户自定义调度器：如果传入 `options.scheduler`，会通过 `Object.assign` 覆盖默认调度器，实现自定义逻辑

```ts
export function effect(fn, options?) {
  // 创建 effect 实例，默认调度器是直接重新执行 run 方法
  const _effect = new ReactiveEffect(fn, () => {
    _effect.run(); // 默认调度逻辑：数据变化后立即执行
  });

  // 关键：用用户传入的 options 覆盖默认属性（包括 scheduler）
  if(options) {
    Object.assign(_effect, options); 
  }

  // ... 其他逻辑
}
```
scheduler 传入方法
```ts
effect(() => {
    // fn
}, {
    scheduler: () => {
        // 自定义调度器
    }
})
```

### 触发时机
在之前的 `triggerEffect` 中：
```ts
export function triggerEffects(dep) {
  for(const effect of dep.keys()) {
    if(effect.scheduler) {
      // 有自定义调度器时，执行调度器
      effect.scheduler(); 
    }
  }
}
```
数据变化时不直接执行 effect，而是执行调度器，由调度器决定何时 / 如何执行 effect


### runner 关联 effect
 - `runner` 是暴露给用户的执行函数，调用 `runner()` 等价于手动执行 `effect.run()`
 - 通过 `runner.effect` 可以访问到 effect 实例，便于后续控制（如停止 effect：`runner.effect.stop()`
 
 ```ts
// 创建 runner 函数，绑定 effect 的 run 方法
const runner = _effect.run.bind(_effect);

// 在 runner 上挂载 effect 实例，方便外界访问
runner.effect = _effect;
return runner;
 ```