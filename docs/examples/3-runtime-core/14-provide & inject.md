# provide & inject
provide 用于 “父组件提供数据”，inject 用于深层子组件获取父组件的数据，跨任意层级（父→子→孙…）；

## 父组件：用 provide 提供数据
```ts
// 父组件（提供数据）
const Parent = {
  setup() {

    // 提供数据：key 为标识，value 为要传递的数据（支持任意类型，包括响应式数据）
    provide('theme', 'dark'); // 普通数据
    provide('userInfo', reactive({ name: 'Vue', version: '3' })); // 响应式数据

    return () => h(Child); // 渲染子组件，无需手动传 props
  }
};
```

## 子组件 -> 孙组件：用 inject 获取数据
```ts
// 子组件（无需处理，直接传递给孙组件）
const Child = {
  setup() {
    return () => h(GrandChild); // 无需接收和传递，直接渲染孙组件
  }
};



// 孙组件（获取父组件提供的数据）
const GrandChild = {
  setup() {

    // 获取数据：第一个参数是 provide 的 key，第二个是默认值（可选）
    const theme = inject('theme', 'light'); // 无匹配时用默认值 'light'
    const userInfo = inject('userInfo'); // 获取响应式数据

    return () => h('div', `主题：${theme}，版本：${userInfo.version}`);
  }
};
```