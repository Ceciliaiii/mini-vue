# watchEffect
和 effect 类似，不需要指定监听的数据源，初始化时立刻执行一次，数据变化会重新执行，没有新旧值参数，专注于执行副作用逻辑
```ts
// 监听响应式数据变化并执行副作用
const count = ref(0)

watchEffect(() => {
  console.log(`count的值是: ${count.value}`)
})

// 当count变化时，回调会自动执行
count.value = 1 // 控制台输出: count的值是: 1
count.value = 2 // 控制台输出: count的值是: 2
```
