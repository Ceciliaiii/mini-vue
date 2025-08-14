# Effect

## 什么是 Effect
当函数内部依赖的响应式数据发生改变时，该函数会自动重新执行。

## 核心结构

### `effect` 函数（创建监工）
在此处，我们将 **副作用** `_effect` 比喻为 **监工**

 - 接收两个参数：函数和选项
 - 创建 `ReactiveEffect` 实例，管理函数执行过程
 - 执行一次初始化（触发首次依赖收集）
 - 返回 `ReactiveEffect` 实例给外部操作

```ts
export function effect(fn, options?) {

  // 创建一个响应式effect，数据变化后触发
  const _effect = new ReactiveEffect(fn, () => {
    _effect.run(); // 数据变了就重新执行
  });

  _effect.run(); // 先执行一次初始化

  return _effect; // 返回这个监工，方便后续控制
}
```

### `ReactiveEffect` 类（监工的具体能力）

**核心机制**：
  - `active`属性：控制副作用是否生效（如停用后数据变化不再触发）
  - `run`方法：
    - 执行用户函数`fn`
    - 执行期间将自身标记为`avtiveEffect`（当前正在工作的监工）
    - 支持嵌套 effect（通过 `try...finally` 恢复上一个工作的监工）
  - `scheduler`：数据变化时的触发逻辑（默认重新执行`run`方法）

  ```ts
    export let activeEffect; // 当前正在工作的监工

    class ReactiveEffect {
    public active = true; // 监工是否"在岗"
    constructor(public fn, public scheduler) {} // fn是要执行的任务，scheduler是触发机制

    run() {
        if (!this.active) { // 如果不在岗，只干活不记录
        return this.fn();
        }
        
        // 核心：记录当前监工
        let lastEffect = activeEffect; // 保存上一个监工
        try {
        activeEffect = this; // 标记自己为当前监工
        return this.fn(); // 执行任务（执行时会触发数据读取，从而收集依赖）
        } finally {
        activeEffect = lastEffect; // 恢复上一个监工
        }
    }
    }
  ```

  ### `track` 函数（收集依赖）
   - 在响应式数据被读取时调用（配合 `baseHandler` 的 `get` 拦截器）
   - 记录：哪个数据（target）的哪个属性（key）被哪个effect（监工）使用了
   - 收集依赖：建立数据与副作用（监工）之间的映射关系，确保 effect 嵌套时的唯一性

```ts
export function track(target, key) {
  // 若存在活跃的 effect，则记录依赖关系
  if (activeEffect) {
    console.log(`记录依赖：${target}的${key}被${activeEffect}使用`);
    // 实际实现中会存储：target -> key -> effect 的映射关系
  }
}
```