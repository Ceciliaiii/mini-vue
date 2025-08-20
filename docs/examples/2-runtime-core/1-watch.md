# watch
当被监听的数据源变化时，会触发回调函数
```ts
// 监听响应式对象
const state = reactive({ count: 0 })

watch(state, (newValue, oldValue) => {
  console.log(`count变化了：${oldValue.count} → ${newValue.count}`)
})

// 监听ref
const count = ref(0)
watch(count, (newValue, oldValue) => {
  console.log(`count变化了：${oldValue} → ${newValue}`)
})

// 深度监听（默认对对象类型会深度监听）
const obj = reactive({ a: { b: 0 } })
watch(obj, (newValue) => {
  console.log(`obj.a.b变化了：${newValue.a.b}`)
})
obj.a.b = 1 // 会触发watch回调
```