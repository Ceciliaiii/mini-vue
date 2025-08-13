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