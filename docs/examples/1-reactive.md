# reactive 使用示例

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