# ref 基础

## 原理
### 核心结构：RefImpl类
 - `RefImpl` 是 ref 响应式的载体，包含三个关键属性：
 - `__v_isRef`：标识当前实例是 ref 类型
 - `_value`：存储经过处理的响应式值（对象会被转为 reactive）
 - `dep`：用于收集依赖当前 ref 的 effect

```ts
class RefImpl {
  public __v_isRef = true  // 标识为ref类型
  public _value  // 存储处理后的值
  public dep  // 依赖集合（收集使用该ref的effect）

  constructor(public rawValue) {
    // 处理值：对象类型转为reactive，基本类型直接存储
    this._value = toReactive(rawValue)
  }

  // 访问.value时触发依赖收集
  get value() {
    trackRefValue(this) // 收集依赖
    return this._value
  }

  // 修改.value时触发更新
  set value(newValue) {
    if (newValue !== this.rawValue) {
      this.rawValue = newValue
      this._value = toReactive(newValue)
      triggerRefValue(this) // 触发更新
    }
  }
}
```

### `trackRefValue`：依赖收集机制
访问 ref.value 时，通过 trackRefValue 收集依赖
```ts
function trackRefValue(ref) {
  if (activeEffect) {
    // 为ref创建 独立的依赖集合dep
    // 并将当前活跃的effect加入其中
    // 检查当前是否有之前收集的依赖，没有再新建映射表
    trackEffect(activeEffect, (ref.dep = ref.dep || createDep(...)))
  }
}
```

### `triggerRefValue`：触发更新机制
修改 ref.value，通过 triggerRefValue 触发更新
```ts
function triggerRefValue(ref) {
  if (ref.dep) {
    // 通知所有依赖的effect重新执行
    triggerEffects(ref.dep)
  }
}
```

### `toReactive`：对象类型的处理
实现对象的响应式转换
```ts
function toReactive(value) {
  return isObject(value) ? reactive(value) : value
}
```
