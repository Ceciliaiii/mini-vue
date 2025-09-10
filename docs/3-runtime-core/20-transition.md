# transition

## `resolveTransitionProps`：动画配置解析
将用户传入的 name、onBeforeEnter 等 props，转换为统一的 “动画类规则” 和 “钩子函数”：
```ts
const {  
    name = 'v', // 默认前缀为 v-
    // 解析进入动画类（默认拼接 name + 状态）
    enterFromClass = `${name}-enter-from`,
    enterActiveClass = `${name}-enter-active`,
    enterToClass = `${name}-enter-to`,
    // 解析离开动画类
    leaveFromClass = `${name}-leave-from`,
    leaveActiveClass = `${name}-leave-active`,
    leaveToClass = `${name}-leave-to`,
    // 自定义钩子
    onBeforeEnter, 
    onEnter, 
    onLeave 
  } = props;

  return {
    // 钩子逻辑
  }
```
进入前钩子：
```ts
onBeforeEnter(el) {
      onBeforeEnter && onBeforeEnter(el); // 执行用户自定义钩子

        // 添加“初始类”和“过渡类”
      el.classList.add(enterFromClass, enterActiveClass);
    },
```
进入时钩子：
```ts
onEnter(el, done) {

    // 动画结束后的清理逻辑
      const resolve = () => { 
        el.classList.remove(enterToClass, enterActiveClass);
        done && done();
      };

      // 执行用户自定义钩子（传入结束回调）
      onEnter && onEnter(el, resolve); 
      

        // 下一帧执行，确保初始类已生效
      nextFrame(() => { 
        el.classList.remove(enterFromClass); // 移除初始类
        el.classList.add(enterToClass); // 添加结束类（触发过渡）

        // 若用户未自定义钩子，自动监听 transitionend 结束
        if (!onEnter || onEnter.length <= 1) {
          el.addEventListener('transitionend', resolve);
        }
      });
    },
```
离开时钩子：
```ts
 onLeave(el, done) {
      const resolve = () => {
        el.classList.remove(leaveToClass, leaveActiveClass);
        done && done();
      };
      onLeave && onLeave(el, resolve);
      

      el.classList.add(leaveFromClass); // 初始状态
      document.body.offsetHeight; // 强制重绘，确保初始类生效
      el.classList.add(leaveActiveClass);
      
      nextFrame(() => {
        el.classList.remove(leaveFromClass);
        el.classList.add(leaveToClass);
        if (!onLeave || onLeave.length <= 1) {
          el.addEventListener('transitionend', resolve);
        }
      });
    }
```


## `BaseTransitionImpl`：动画虚拟节点
将解析后的动画配置（钩子）绑定到 “被包裹的元素 vnode” 上，让渲染流程能识别并触发动画：
```ts
const BaseTransitionImpl = {
  props: { onBeforeEnter: Function, onEnter: Function, onLeave: Function },
  setup(props, { slots }) {
    return () => {
      // 获取被<transition>包裹的内容
      const vnode = slots.default && slots.default();
      if (!vnode) return null;
      
      // 将动画钩子绑定到 vnode.transition 上
      // 通过 vnode.transition 触发对应钩子
      vnode.transition = {
        beforeEnter: props.onBeforeEnter, // 进入前钩子
        enter: props.onEnter, // 进入时钩子
        leave: props.onLeave // 离开时钩子
      };
      return vnode; // 返回带动画配置的 vnode
    };
  }
};


// Transition 组件
export function Transition(props, { slots }) {

    // vnode      钩子      子节点
  return h(BaseTransitionImpl, resolveTransitionProps(props), slots);
}
```


## 主渲染 / 主卸载时触发动画
动画的触发时机与元素的 “挂载” 和 “卸载” 流程强绑定，分别在 `mountElement` 和 `unmount` 函数中执行：
### 挂载时触发 “进入动画”
```ts
// mountElement

 const { transition } = vnode;

 // 创建真实 DOM 元素
  let el = (vnode.el = hostCreateElement(type));
  // ... 处理属性、子节点 ...

  // 触发进入前钩子（添加初始 CSS 类）
  if (transition) {
    transition.beforeEnter(el);
  }

  // 将 DOM 插入页面
  hostInsert(el, container, anchor);

  // 触发进入时钩子（切换类，触发动画）
  if (transition) {
    transition.enter(el);
  }

```

### 卸载时触发 “离开动画”
```ts
// unmount

 const { shapeFlag, transition, el } = vnode;

  //  若有离开动画，先执行 leave 钩子（触发动画）
  if (transition) {
    transition.leave(el);
  } 
  else {
    // 无动画时，直接移除 DOM
    hostRemove(el);
  }
```