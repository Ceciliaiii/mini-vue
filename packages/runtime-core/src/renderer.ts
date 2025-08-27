import { ShapeFlags } from "@vue/shared"
import { isSameVnode } from "./createVnode"

export function createRenderer(renderOptions) {
    // core中不关心如何渲染

    const {
        insert: hostInsert,
        remove: hostRemove,
        createElement: hostCreateElement,
        createText: hostCreateText,
        setText: hostSetText,
        setElementText: hostSetElementText,
        parentNode: hostParentNode,
        nextSibling: hostNextSibling,
        patchProp: hostPatchProp
    } = renderOptions


    const mountChildren = (children, container) => {
        for(let i = 0; i < children.length; i++) {

            // children[i] 可能是纯文本元素
            patch(null, children[i], container)
        }
    }


    const mountElement = (vnode, container) => {
        const { type, children, props, shapeFlag } = vnode


        // 第一次渲染的时候让虚拟节点和真实dom创建关联  vnode.el = 真实dom
        // 第二次渲染新的vnode，可以和上一次的vnode做对比，更新对应的el元素，可以后续复用dom元素
        let el = (vnode.el = hostCreateElement(type))


        if(props) {
            for(let key in props) {
                hostPatchProp(el, key, null, props[key])
            }
        }


        // 与运算：9 & 8 > 0，说明儿子是文本节点
        if(shapeFlag & ShapeFlags.TEXT_CHILDREN) {
              hostSetElementText(el, children)
        }
        else if(shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            mountChildren(children, el)
        }

        hostInsert(el, container)

    }

    const processElment = (n1, n2, container) => {
         if(n1 == null) {
            // 初始化操作
            mountElement(n2, container)
        }
        else {
            patchElement(n1, n2, container)
        }
    }

    
    // 处理多个属性的方法
    const patchProps = (oldProps, newProps, el) => {

        // 新的要全部生效  没有老的就加上，有老的就覆盖
        for(let key in newProps) {
            hostPatchProp(el, key, oldProps[key], newProps[key])
        }

        for(let key in oldProps) {
            // 老的有 新的没有
            if(!(key in newProps)) {
                hostPatchProp(el, key, oldProps[key], null)
            }
        }
    }


    const unmountChildren = (children) => {
        for (let i = 0; i < children.length; i++) {
            let child = children[i]
        unmount(child)
        }
  }


    const patchChildren = (n1, n2, el) => {
        const c1 = n1.children
        const c2 = n2.children

        const prevShapeFlag = n1.shapeFlag
        const shapeFlag = n2.shapeFlag


        // 1. 新的是文本，老的是数组，移除老的
        // 2. 新的是文本，老的是文本，内容不相同替换
        // 3. 新的是数组，老的是数组，全量diff算法
        // 4. 新的不是数组，老的是数组，移除老的子节点
        // 5. 新的是null，老的是文本
        // 6. 新的是数组，老的是文本

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 新的是文本 老的是数组 移除老的
        unmountChildren(c1)
      }

    //   新的是文本，老的是文本
      if (c1 !== c2) {
        hostSetElementText(el, c2)
      }
    }
    else {
        // 老的是数组
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 新的是数组
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // 全量diff 算法 两个数组比对
            //   6
        }
        // 新的不是数组
        else {
          unmountChildren(c1)
        }
      }
      else {
        // 老的是文本
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          hostSetElementText(el, '')
        }
        // 新的是数组
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          mountChildren(c2, el)
        }
      }
    }
    }

    const patchElement = (n1, n2, container) => {
        // 比较元素差异，需要复用dom元素
        // 比较属性和元素的子节点
        let el = (n2.el = n1.el)   // 对dom元素的复用

        let oldProps = n1.props || {}
        let newProps = n2.props || {}


        // hostPatchProps 只针对某一个属性处理，并不能处理多个属性
        patchProps(oldProps, newProps, el) 

        patchChildren(n1, n2, container)
    }


    // 渲染、更新走这里
    const patch = (n1, n2, container) => {

        if(n1 == n2) {
            // 两次渲染同一个元素，直接跳过
            return
        }

        if(n1 && !isSameVnode(n1, n2)) {
            unmount(n1)
            n1 = null  // 直接移除老dom，执行processElment的if初始化
        }       

        // 对元素进行处理
        processElment(n1, n2, container)    
    }


    const unmount = (vnode) => hostRemove(vnode.el)

    // 多次调用render，会进行虚拟节点比较，再更新
    const render = (vnode, container) => {

        if(vnode == null) {
            // 移除当前dom元素
            if(container._vnode) {
                // 如果渲染过，移除
                unmount(container._vnode)
            }
        }

        // 将虚拟节点vnode变成真实节点进行渲染
        patch(container._vnode || null, vnode, container)

        // 缓存老虚拟节点
        container._vnode = vnode
    }
    return {
        render
    }
}


// 完全不关心api，可以跨平台