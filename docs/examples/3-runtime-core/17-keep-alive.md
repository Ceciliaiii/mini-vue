# KeepAlive
KeepAlive 通过包裹动态组件或路由组件，实现组件状态的缓存

## 缓存动态组件
切换组件时，A 和 B 的状态（count 值、input 内容）会被保留，不会重置。
```ts
import { h, ref } from 'vue';

// 定义两个子组件
const A = { 
  setup() {
    const count = ref(0);
    return () => h('div', [
      h('p', `A组件：count = ${count.value}`),
      // 按钮修改 count
      h('button', { onClick: () => count.value++ }, '加1')
    ]);
  }
};

const B = { 
  setup() {
    const msg = ref('Hello');
    return () => h('div', [
      h('p', `B组件：${msg.value}`),
    //   输入框修改 msg.value
      h('input', { 
        onInput: (e) => msg.value = e.target.value 
      })
    ]);
  }
};

// 父组件：使用 KeepAlive 包裹动态组件
const App = {
  setup() {
    const current = ref('A'); // 控制显示哪个组件
    return () => h('div', [
      // 切换按钮
      h('button', { onClick: () => current.value = 'A' }, '显示A'),
      h('button', { onClick: () => current.value = 'B' }, '显示B'),
      
      // KeepAlive 包裹：缓存 A 和 B 组件
      h(KeepAlive, null, {
        default: () => h(current.value === 'A' ? A : B)
      })
    ]);
  }
};
```


## 限制缓存数量（max 属性）
超出 max 则删除最久未使用的组件:
```ts
// 最多缓存 1 个组件，切换时会删除最久未使用的
h(KeepAlive, { max: 1 }, {
  default: () => h(current.value === 'A' ? A : B)
});
```