# KeepAlive
缓存组件实例和 DOM，激活 / 停用组件时移动 DOM，LRU 策略清理缓存；

## 数据结构：缓存表 & 键集合
`KeepAlive` 组件内部通过两个数据结构管理缓存：
 - `cache`：存储被缓存组件的虚拟节点 `vnode`，包含组件实例 `vnode.component` 和 DOM 结构 `vnode.component.subTree.el`；
 - `keys`：记录缓存键的顺序，用于实现 “最近最少使用（LRU）” 策略 —— 新访问的键移到最后，超出 max 时删除最前面的键。
```ts
setup(props, { slots }) {
    const { max } = props;

    // 记录缓存的键，也是缓存的组件标识（用于 LRU 策略，保持访问顺序）
    const keys = new Set(); 
    // 缓存表：key → 组件虚拟节点（含 DOM 和实例）
    const cache = new Map(); 
    // ...
  }
```

## 首次渲染存入缓存
当组件首次被 `KeepAlive` 包裹渲染时，会被标记为 “需要缓存”，并在挂载 / 更新后存入 `cache`：

### 创建 KeepAlive 实例
`mountComponent` 中赋予 KeepAlive 实例方法：
```ts
if(isKeepAlive(vnode)) {
    instance.ctx.renderer = {
      createElement: hostCreateElement,   // 内部需要创建一个div来缓存dom
      move(vnode, container, anchor) {   // 需要把之前缓存的dom放到div内
        hostInsert(vnode.component.subTree.el, container)
      },
      unmount   // 如果组件切换，需要将现在容器中的元素移除
    }
  }
```

### 监听挂载和更新钩子，触发缓存
```ts
// setup

 const instance = getCurrentInstance(); // 获取 KeepAlive 自身的组件实例

    // 缓存逻辑：在组件挂载/更新后执行
    const cacheSubTree = () => {
      // pendingCacheKey 是当前缓存组件的 key，将其虚拟节点存入 cache
      cache.set(pendingCacheKey, instance.subTree);
    };

    // 监听挂载和更新钩子，触发缓存
    onMounted(cacheSubTree);
    onUpdated(cacheSubTree);
```

### 首次渲染
渲染后，标记组件需要被缓存：
```ts
// return

const vnode = slots.default(); // 获取被包裹的组件虚拟节点
const key = vnode.key == null ? vnode.type : vnode.key; // 生成唯一 key

      // 首次渲染：当前 key 不在缓存中
      if (!cache.has(key)) {
        keys.add(key); // 记录 key
        cache.set(key, vnode); // 存入缓存

        // 若超出 max，删除最久未使用的缓存
        if (max && keys.size > max) {
          const oldestKey = keys.values().next().value; // 取第一个 key（最久未用）
          pruneCacheEntry(oldestKey); // 删除该 key 对应的缓存
        }
      }

      // 标记（避免后续卸载时真的销毁DOM）
      vnode.shapeFlag |= ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE;
      return vnode;
```

### LRU 策略：缓存清理
当缓存数量超出 max 时，`pruneCacheEntry` 会删除最久未使用的缓存（包括其 DOM）：
```ts
 const { unmount: _unmount } = instance.ctx.renderer

function reset(vnode) {
    vnode.shapeFlag &= ~ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE
    vnode.shapeFlag &= ~ShapeFlags.COMPONENT_KEPT_ALIVE
}

function unmount(vnode) {
    reset(vnode) // 重置标识
    _unmount(vnode) // 真正卸载
}

function pruneCacheEntry(key) {
  const cached = cache.get(key);

  // 真正删除 DOM（从临时容器中移除）
  unmount(cached); // 内部会重置标记，执行实际卸载
  keys.delete(key); // 从键集合中移除
  cache.delete(key); // 从缓存表中移除
}
```


## 复用缓存
组件再次被访问时，直接复用缓存中的实例和 DOM：
```ts
const cacheVNode = cache.get(key); // 从缓存中获取

      if (cacheVNode) {
        // 复用缓存的组件实例（避免重新执行 setup、created 等）
        vnode.component = cacheVNode.component;
        // 标记为“已缓存”（告诉渲染逻辑无需初始化，直接激活）
        vnode.shapeFlag |= ShapeFlags.COMPONENT_KEPT_ALIVE;

        // LRU 策略：
        // 当要访问的 key 已经在 cache 时，
        // 将当前 key 移到最后（标记为最近使用）
        keys.delete(key);
        keys.add(key);
      }
```


## 激活 & 停用
停用时，DOM 移到临时容器 div：
```ts
export const KeepAlive = {
  setup(props, { slots }) {
    const { move, createElement } = instance.ctx.renderer;
    // 创建临时容器（内存中的 div，不显示在页面上）
    const storageContent = createElement('div');

    // 组件隐藏时触发
    instance.ctx.deactivate = function (vnode) {
      // 将组件的 DOM 从原容器移到临时容器（不销毁，仅隐藏）
      move(vnode, storageContent, null);
    };
  }
};


// renderer 中的主卸载
// 卸载时触发停用（因标记了 SHOULD_KEEP_ALIVE，不会真的销毁）
const unmount = (vnode, parentComponent) => {
  if (shapeFlag & ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE) {
    // 调用 KeepAlive 的 deactivate 方法，移动 DOM 到临时容器
    parentComponent.ctx.deactivate(vnode);
  }
  // ...
}
```
激活时，DOM 回到原容器
```ts
export const KeepAlive = {
  setup(props, { slots }) {
    const { move } = instance.ctx.renderer;

    // 组件显示时触发
    instance.ctx.activate = function (vnode, container, anchor) {
      // 将组件的 DOM 从临时容器移回目标容器（显示到页面上）
      move(vnode, container, anchor);
    };
  }
};



// renderer 中主渲染
// 渲染时触发激活（因标记了 KEPT_ALIVE，直接复用缓存）
const processComponent = (n1, n2, container, anchor, parentComponent) => {
  if (n1 == null) {

    if (n2.shapeFlag & ShapeFlags.COMPONENT_KEPT_ALIVE) {
      // 调用 KeepAlive 的 activate 方法，移动 DOM 到目标容器
      parentComponent.ctx.activate(n2, container, anchor);
    } 
    else {
      // 首次渲染：正常挂载
      mountComponent(n2, container, anchor, parentComponent);
    }
  }
  // ...
};
```