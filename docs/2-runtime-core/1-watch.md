# watch
通过 `doWatch` 函数创建一个 `ReactiveEffect`，利用响应式系统的依赖收集机制，实现对数据源的监听。

## 入口
参数接收：数据、用户的回调方法、deep属性
```ts
export function watch(source, cb, options = {} as any) {
    return doWatch(source, cb, options)
}
```

## `traverse`：深度遍历触发依赖收集
递归遍历对象的所有属性，触发它们的 `getter`，所有属性都收集当前 watch 的 effect，支持深度控制和循环引用检测
```ts
function traverse(source, depth, currentDepth = 0, seen = new Set()) {
  if(!isObject(source)) {
    return source
  }
  // 处理深度限制
  if(depth) {
        if(currentDepth >= depth) {
            return source
        }
    return source
    
    currentDepth++
  }

  
  // 避免循环引用导致的无限递归
  if(seen.has(source)) {
    return source
  }
  seen.add(source)
  

  // 遍历对象所有属性，触发getter实现依赖收集
  for(let key in source) {
    traverse(source[key], depth, currentDepth, seen)
  }
  return source
}
```

## `doWatch`：创建监听
 - 遍历过程中触发所有属性的 `getter`，使它们收集当前 effect；
 - 监听的数据发生变化时触发 `job` 调度器，调用用户提供的 `cb` 回调，传入新值和旧值，并且更新旧值，并重新执行effect；
```ts
function doWatch(source, cb, { deep }) {

  // 创建getter函数，用于触发依赖收集
  const reactiveGetter = (source) => traverse(
    source, 
    deep === false ? 1 : undefined  // 控制是否深度监听
  )
  
  let getter = () => reactiveGetter(source)
  let oldValue
  
  // 定义数据变化时的回调逻辑
  const job = () => {
    const newValue = effect.run()  // 获取新值
    cb(newValue, oldValue)         // 执行用户回调
    oldValue = newValue            // 更新旧值
  }
  
  // 创建effect，关联getter和job
  const effect = new ReactiveEffect(getter, job)
  
  // 初始化执行，获取初始值
  oldValue = effect.run()
}
```
**深度监听**：当 `deep` 不为 `false` 时，`traverse` 会无限深度遍历对象，使对象内部所有嵌套属性都收集当前 effect。因此，即使是深层属性变化，也能触发 watch 回调