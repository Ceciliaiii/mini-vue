# watch
当被监听的数据源变化时，会触发回调函数，监听的对象有三种：reactive 对象、ref、计算函数
```ts
// 监听响应式对象
// 1. 监听响应式对象（reactive）
const state = reactive({ count: 0 })
watch(state, (newVal, oldVal) => {
  console.log('state变化:', newVal, oldVal)
})

// 2. 监听ref对象
const count = ref(0)
watch(count, (newVal, oldVal) => {
  console.log('count变化:', newVal, oldVal)
})

// 3. 监听函数返回值
watch(
  () => state.count + 1,  // 函数返回需要监听的值
  (newVal, oldVal) => {
    console.log('计算值变化:', newVal, oldVal)
  }
)
```

可通过 `immediate` 配置是否立即执行
```ts
// 立即执行（immediate）
watch(count, (newVal) => {
  console.log('立即执行并监听变化')
}, { immediate: true })  // 初始化时立即执行一次



// 深度监听控制（deep）
watch(obj, () => {}, { deep: false })  // 关闭深度监听
```