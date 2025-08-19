# toRef & toRefs & proxyRefs
所有方法，都使原对象的**属性值**和 ref 相关联

## toRef
通过 `ObjectRefImpl` 类实现，ref 关联原对象的**属性值**
```ts
class ObjectRefImpl {
  public __v_isRef = true  // 标记为ref类型
  constructor(public _object, public _key) {}

  // 访问value时，直接返回原对象的属性值
  get value() {
    return this._object[this._key]
  }

  // 修改value时，直接修改原对象的属性
  set value(newValue) {
    this._object[this._key] = newValue
  }
}


// toRef方法
export function toRef(object, key) {
    return new ObjectRefImpl(object, key)
}

```

## toRefs
遍历对象属性，为每个属性创建 `ObjectRefImpl` 实例
 - 保持原对象结构（仍是普通对象），只是属性变为 ref 类型
 - 原对象的**属性值**与 ref 相关联，修改 ref 会同步到原对象
 - 常用于解构响应式对象时保持响应性（避免解构后失去响应式）
```ts
export function toRefs(object) {
  const res = {}

  // 遍历所有属性，逐个转为ref
  for(let key in object) {
    res[key] = toRef(object, key)
  }
  return res
}

// 用法：
// const refs = toRefs(obj)
// refs.name.value 访问name
// 详细见使用示例
```


## proxyRefs
通过 Proxy 实现自动 "脱 ref"，无需手动处理 `.value`：
 - **get**：访问属性时自动判断是否为 ref，若是则返回 `.value`
 - **set**：修改属性时自动判断是否为 ref，若是则修改其 `.value`
```ts
export function proxyRefs(objWithRef) {
  return new Proxy(objWithRef, {
    get(target, key, receiver) {
      let r = Reflect.get(target, key, receiver)
      // 如果是ref类型，自动返回其.value
      return r.__v_isRef ? r.value : r
    },
    set(target, key, value, receiver) {
      const oldValue = target[key]
      if(oldValue.__v_isRef) {
        // 如果原属性是ref，修改其.value
        oldValue.value = value
      } else {
        // 非ref属性直接赋值
        return Reflect.set(target, key, value, receiver)
      }
    }
  })
}
```