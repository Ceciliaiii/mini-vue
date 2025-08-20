# computed
函数形式（只读）
```ts
const count = ref(1)
const doubleCount = computed(() => {
  return count.value * 2
})

console.log(doubleCount.value) // 2
count.value = 2
console.log(doubleCount.value) // 4
```

对象形式（可读可写）
```ts
const fullName = computed({
  get: () => `${firstName.value} ${lastName.value}`,
  set: (newValue) => {
    const [f, l] = newValue.split(' ')
    firstName.value = f
    lastName.value = l
  }
})

fullName.value = 'John Doe' // 触发setter
```
 - 必须通过 `.value` 访问（本质是 ref 类型）
 - 具有缓存特性（依赖不变时不会重新计算）
 - 依赖的数据变化时会自动更新
 - 可定义 setter 实现可写功能
