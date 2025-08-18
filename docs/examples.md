# API 使用示例

## reactive 

```ts
// 1. 导入 reactive 函数
import { reactive } from './reactive';

// 2. 创建普通对象
const user = {
    name: '张三',
    age: 20
};

// 3. 转化为响应式对象
const reactiveUser = reactive(user);

// 4. 验证响应式标识
console.log(reactiveUser.__v_isReactive); // true（有响应式标识）
console.log(user.__v_isReactive); // undefined（普通对象没有）

// 5. 验证缓存机制
const reactiveUser2 = reactive(user);
console.log(reactiveUser === reactiveUser2); // true（复用了同一个代理对象）

// 6. 非对象处理
const num = reactive(123);
console.log(num === 123); // true（非对象直接返回原数据）
```


## Effect 

### 1. 创建响应式数据
```ts
const obj = reactive({ count: 0 }); // 响应式对象
```

### 2. 创建 effect 副作用
```ts
effect(() => {
  console.log("count 值为：", obj.count); // 使用响应式数据
});
```

### 3. 初始化执行
  - 调用 `effect` 时，`_effect.run()` 立刻执行传入的 `fn`
  - 读取 `obj.count` 触发响应式对象的 `get` 拦截器
  - 拦截器内部调用 `track(obj, 'count')` 进行依赖收集
  - `track` 发现 `activeEffect` 存在，记录 `obj.count` 与当前 effect 的关联映射

### 4. 数据变化时
  - 修改 `obj.count = 1` 触发响应式对象的 `set` 拦截器
  - 找到 `obj.count` 关联的所有 effect
  - 调用这些 effect 的 `scheduler` 进行重新执行
  - 副作用函数 `effect` 自动重新执行，打印更新后的 `count` 值s


## effect 调度器 `scheduler`
假设我们需要实现 **数据变化后延迟 100ms 执行 effect，且多次变化只执行一次** 的防抖效果：
```ts
// 定义防抖调度器
const debounceScheduler = function() {
  clearTimeout(this.timer);
  this.timer = setTimeout(() => {
    this.run(); // 100ms 后执行真正的 effect
  }, 100);
};

// 创建带自定义调度器的 effect
const runner = effect(() => {
  console.log('数据变化了：', obj.count);
}, { scheduler: debounceScheduler });

// 多次修改数据
obj.count++;
obj.count++;
obj.count++; 
// 最终只会在最后一次修改后 100ms 执行一次 effect
```
每一次修改数据都会重新执行 debounceScheduler，都会清除掉上一次执行的计时器

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