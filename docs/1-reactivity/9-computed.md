# computed 原理

## 核心类：`ComputedRefImpl`
```ts
class ComputedRefImpl {
  public _value  // 存储计算结果
  public effect  // 管理计算逻辑的effect
  public dep     // 收集依赖计算属性的effect

  constructor(getter, public setter) {
    // 创建effect管理计算逻辑
    this.effect = new ReactiveEffect(
      () => getter(this._value),  // 执行计算的函数  用户的fn
      () => {
        // 依赖变化时触发更新   scheduler
        triggerRefValue(this)
      }
    )
  }

    //  get、set...
}
```


## 缓存机制：dirty 状态控制
通过 `_dirtyLevel` 控制是否需要重新计算：
```ts
// ReactiveEffect 中的状态标记 
export enum DirtyLevels {
  Dirty = 4,     // 需要重新计算
  NoDirty = 0    // 使用缓存值
}


// ComputedRefImpl  访问计算属性时的逻辑
get value() {
  // _dirtyLevel 默认为 Dirty

  // 当状态为脏时，重新执行计算
  if(this.effect.dirty) {
    this._value = this.effect.run()  // 执行计算并缓存结果  此时_dirtyLevel = NoDirty
    trackRefValue(this)  // 收集依赖当前计算属性的effect
  }
  return this._value  // 返回缓存值
}
```
依赖变化时，`triggerEffects()` 重新标记为 Dirty（触发重新计算）
```ts
  for(const effect of dep.keys()) {

    // 当前值是不脏的，但是触发更新后需要变脏
    if(effect._dirtyLevel < DirtyLevels.Dirty) {
      effect._dirtyLevel = DirtyLevels.Dirty
    }

    // scheduler
  }
```


## 依赖追踪 & 更新触发
### 依赖收集
计算属性的 effect 会收集其依赖的响应式数据，当访问计算属性时，会通过 `trackRefValue` 收集访问它的 effect

### 更新触发
当依赖的数据变化时，会触发计算属性的 `scheduler` 调用 `triggerRefValue` 通知依赖它的 effect 重新执行，同时将计算属性标记为 `Dirty`，下次访问时重新计算


## 可写功能实现

方法 `computed( getterOrOptions )` 中定义了**只读**与**可写**逻辑：
```ts
    // getterOrOptions 是否是函数 getter
    let onlyGetter = isFunction(getterOrOptions)

    let getter
    let setter
    // 只读
    if(onlyGetter) {
        getter = getterOrOptions
        setter = () => {}
    }
    // 若 getterOrOptions 是对象{ get{}, set{} }
    // 可写
    else {
        getter = getterOrOptions.get
        setter = getterOrOptions.set
    }

    return new ComputedRefImpl(getter, setter)   // 计算属性 ref
```

通过 `setter` 实现计算属性的修改能力：
```ts
// ComputedRefImpl

set value(v) {
  this.setter(v)  // 执行用户定义的setter逻辑
}
```
 - 当设置 `computed.value = x` 时，会调用构造函数中传入的 `setter`
 - `setter` 通常会修改其他响应式数据，从而触发相关更新


## 数据结构 & 原理总结
name -> 计算属性 `dirty = true` -> 计算属性 `scheduler` -> 触发计算属性收集的effect
```ts
// 示例
const state = reactive({ name: 'czx' })

// 只读
const aliasName = computed(() => {
    return state.name + "真帅"
})

// 可写
const aliasName = computed({
    get(oldValue) {
        return state.name + "真帅"
    }
    set(v) {
        console.log(v)
    }
})


effect(() => {
    console.log(aliasName.value)
})
```
```text
{
    { name: 'czx' }: {
        name: {
            effect: { 计算属性effect }
        }
    }
}


计算属性 = {
    渲染effect
}
```
 - 计算属性就是一个 effect，有一个标识 `dirty = true`，访问的时候会触发 `name` 属性的 `get` 方法（收集依赖）
 - 将 `name` 属性和计算属性做一个映射，稍后 `name` 变化后会触发计算属性的 `scheduler`
 - 当计算属性在 effect 当中使用时，会对当前 effect 进行依赖收集
 - 如果 `name` 属性变化了，会通知计算属性将 `dirty` 变为 `true`（触发计算属性收集的 effect）