# effect 调度器 `scheduler`
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