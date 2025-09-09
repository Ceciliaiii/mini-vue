# teleport
teleport 对象的 `process` 方法（处理渲染 / 更新）和 `remove` 方法（处理卸载）中，结合虚拟节点的 `shapeFlag` 标记实现特殊处理。

## 类型标记
创建虚拟节点时，Teleport 会被标记为 `ShapeFlags.TELEPORT`，与普通元素、组件区分开。

## patch 主渲染流程
`patch` 中通过识别 teleport 标识，调用 teleport 专属的处理逻辑：
```ts
default:
// 若为 Teleport 节点，调用其 process 方法
      if (shapeFlag & ShapeFlags.TELEPORT) {
        type.process(n1, n2, container, anchor, parentComponent, {
          mountChildren,
          patchChildren,
          move(vnode, container, anchor) {
            // 移动节点到目标容器（组件 or DOM元素）
            hostInsert(
              vnode.component ? vnode.component.subTree.el : vnode.el,
              container,
              anchor
            );
          }
        });
      }
```


## process 渲染
负责 Teleport 内容的 “首次渲染” 和 “更新”，将目标渲染到目标容器，而非当前组组件的 DOM 数中：  
 - 首先设置 Teleport 标识 `__isTeleport = true`；
 - 通过 process 进行首次渲染：
 ```ts
 if (!n1) {
      // 找到目标容器（to 属性指定的 DOM 节点，如 document.querySelector('body')）
      const target = (n2.target = document.querySelector(n2.props.to));
      
      if (target) {
        // 将 Teleport 内部的子节点渲染到目标容器
        mountChildren(n2.children, target, parentComponent);
      }
    } 
 ```
 - 更新（n1 存在）：
 ```ts
else {
      // 若内容有变化，更新子节点（复用普通节点的 patch 逻辑）
      patchChildren(n1, n2, n2.target, parentComponent);

      // 若目标容器变化（to 属性值改变）
      if (n2.props.to !== n1.props.to) {
        const nextTarget = document.querySelector(n2.props.to);

        // 将所有子节点移动到新的目标容器
        n2.children.forEach(child => move(child, nextTarget, anchor));
      }
    }
 ```

## remove 卸载
通过 `teleport.remove` 的逻辑，处理内部子节点：
```ts
remove(vnode, unmountChildren) {
    const { shapeFlag, children } = vnode;

    // 若子节点是数组，递归卸载所有子节点
    if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      unmountChildren(children);
    }
  }
```
在全局 `unmount` 函数中调用：
```ts
const unmount = (vnode) => {
  const { shapeFlag } = vnode;
  // ... 其他节点的卸载逻辑 ...

  else if (shapeFlag & ShapeFlags.TELEPORT) {
    // 调用 Teleport 自身的 remove 方法卸载
    vnode.type.remove(vnode, unmountChildren);
  }
};
```