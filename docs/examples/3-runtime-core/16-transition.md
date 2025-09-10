# transition

## 基础用法（css 过渡）
通过定义以 `v-` 为前缀的 CSS 类（可通过 `name` 自定义前缀），实现 “进入” 和 “离开” 动画：
```html
<style>
/* 进入动画：初始状态 */
.v-enter-from { opacity: 0; transform: translateX(20px); }
/* 进入动画：过渡中状态 */
.v-enter-active { transition: all 0.3s ease; }
/* 进入动画：结束状态 */
.v-enter-to { opacity: 1; transform: translateX(0); }

/* 离开动画：初始状态 */
.v-leave-from { opacity: 1; transform: translateX(0); }
/* 离开动画：过渡中状态 */
.v-leave-active { transition: all 0.3s ease; }
/* 离开动画：结束状态 */
.v-leave-to { opacity: 0; transform: translateX(20px); }
</style>

<!-- 包裹需要动画的元素 -->
<script>
const App = {
  setup() {
    const show = ref(true); // 控制元素显示/隐藏
    return () => h('div', [
      // 按钮：切换显示状态
      h('button', { onClick: () => show.value = !show.value }, '切换'),

      // Transition 包裹 div
      // show 为 true 时挂载（进入动画），false 时卸载（离开动画）
      h(Transition, null, {
        default: () => show.value ? h('div', '带过渡动画的元素') : null
      })
    ]);
  }
};
</script>
```


## 自定义前缀（name 属性）
```ts
// name 为 fade，CSS 类前缀变为 fade-
h(Transition, { name: 'fade' }, {
  default: () => show.value ? h('div', '自定义前缀的动画') : null
});
```

## 自定义钩子（js 动画）
通过 onBeforeEnter、onEnter、onLeave 等钩子，实现 JS 控制的复杂动画：
```ts
h(Transition, {
  // 进入前触发：初始化动画状态
  onBeforeEnter: (el) => {
    el.style.opacity = 0;
  },

  // 进入时触发：执行动画（done 用于标记动画结束）
  onEnter: (el, done) => {
    setTimeout(() => {
      el.style.transition = 'opacity 0.3s';
      el.style.opacity = 1;
      // 动画结束后调用 done，避免内存泄漏
      el.addEventListener('transitionend', done);
    }, 0);
  },
  
  // 离开时触发：执行离开动画
  onLeave: (el, done) => {
    el.style.opacity = 0;
    el.addEventListener('transitionend', done);
  }
}, {
  default: () => show.value ? h('div', 'JS 控制的动画') : null
});
```