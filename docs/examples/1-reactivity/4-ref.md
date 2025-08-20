# Ref

## ref
创建与使用
```ts
// 1. 导入ref函数
import { ref } from './ref'

// 2. 创建ref对象（支持基本类型和对象）
const count = ref(0) // 基本类型
const user = ref({ name: '张三' }) // 对象类型

// 3. 访问值（必须通过.value属性）
console.log(count.value) // 0
console.log(user.value.name) // 张三

// 4. 修改值（通过.value属性）
count.value++ // 变为1
user.value.name = '李四' // 修改对象属性
```
在 effect 中使用
```ts
effect(() => {
  // 访问ref值时会自动收集依赖
  console.log(`当前计数: ${count.value}`)
})

// 修改值会触发effect重新执行
count.value = 100 // 控制台会打印更新后的值
```

## toRef
将响应式对象的某个属性转换为 ref 对象，保持与原对象的**关联**：
```ts
const obj = reactive({ name: '张三', age: 18 })

// 将obj的name属性转为ref
const nameRef = toRef(obj, 'name')

// 访问值
console.log(nameRef.value) // 张三

// 修改值 - 会同步影响原对象
nameRef.value = '李四'
console.log(obj.name) // 李四

// 原对象修改也会同步到ref
obj.name = '王五'
console.log(nameRef.value) // 王五
```


## toRefs
将响应式对象的所有属性**批量转换**为 ref 对象，返回包含这些 ref 的普通对象：
```ts
const obj = reactive({ name: '张三', age: 18 })

// 将obj所有属性转为ref
const refs = toRefs(obj)

// refs是普通对象，其属性都是ref
console.log(refs.name.value) // 张三
console.log(refs.age.value) // 18

// 修改ref会同步到原对象
refs.age.value = 19
console.log(obj.age) // 19
```


## proxyRefs
自动处理包含 ref 的对象，访问时无需手动添加 .value：
```ts
const user = {
  name: ref('张三'),
  age: ref(18)
}

// 创建代理
const proxyUser = proxyRefs(user)

// 访问时无需.value
console.log(proxyUser.name) // 张三
console.log(proxyUser.age) // 18

// 修改时也无需.value
proxyUser.name = '李四'
proxyUser.age = 19
console.log(user.name.value) // 李四
```
