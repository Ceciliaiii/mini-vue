# provide & inject
 “数据提供（`provide`）” 和 “数据获取（`inject`）” 两步，依赖 `currentInstance`（当前组件实例）和层级继承。


## 组件实例的 `provides` 继承关系
每个组件实例初始化时，`provides` 属性会默认 “继承父组件的 `provides`”，形成层级继承链（父->子->孙->...）：
```ts
const instance = {

  // ... 其他属性 ...
  parent, // 父组件实例

  // 子组件 provides 默认继承父组件 provides（若有父组件，就用父的；没有就新建空对象）
  provides: parent ? parent.provides : Object.create(null)
};
```
此时深层子组件能通过获取其父组件的 `provide`，直接访问到根父组件的 `provide`。


## `provide`：数据提供
在当前组件实例的 `provides` 中存储数据；  
但为了避免 “子组件新数据 污染父组件数据”，会在首次提供数据时 “拷贝一份新的 `provides`”，断开与父组件的共享：
```ts
export function provide(key, value) {
  // 确保在组件内调用（非组件环境不执行）
  if (!currentInstance) return;

  const parentProvide = currentInstance.parent?.provides;
  // 当前组件的 provides（初始时与父组件 provides 指向同一对象）
  let provides = currentInstance.provides;

  // 首次 provide 时，拷贝新的 provides，避免污染父组件数据
  if (parentProvide === provides) {

    // Object.create(provides)：新建对象
    // 原型指向父组件 provides（保留继承关系）
    provides = currentInstance.provides = Object.create(provides);
  }

  // 存储数据到当前组件的 provides 中
  provides[key] = value;
}
```


## `inject`：数据获取
从当前组件的父组件 `provides` 中向上查找对应 `key` 的数据，找到则返回，没找到则返回默认值：
```ts
export function inject(key, defaultValue) {
  // 确保在组件内调用
  if (!currentInstance) return;

  const provides = currentInstance.parent?.provides;

  // 查找数据：若父组件 provides 存在且有对应 key，返回数据；

  if (provides && key in provides) {
    return provides[key];
  } 
  
  // 否则返回默认值
  else {
    return defaultValue;
  }
}
```


## 支持响应式
当传递的是响应式数据，`provide` 存储的是 “响应式对象的引用”，`inject` 获取的也是同一个引用；  
当响应式数据修改时，所有依赖该数据的组件（包括 inject 的最末尾子组件）都会触发响应式更新，重新渲染视图。