import { hasOwn, ShapeFlags } from "@vue/shared"
import { createVnode, Fragment, isSameVnode } from "./createVnode"
import getSequence from "./seq"
import { isRef, reactive, ReactiveEffect } from "@vue/reactivity"
import { queueJob } from "./scheduler"
import { createComponentInstance, setupComponent } from "./component"
import { invokeArray } from "./apiLifecycle"
import { isKeepAlive } from "./components/KeepAlive"

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
    
    const normalLize = (children) => {
      for(let i = 0; i < children.length; i++) {
        if(typeof children[i] === 'string' || typeof children[i] === 'number') {
          children[i] = createVnode(Text, null, String(children[i]))
        }
      }
        
      return children
    }


    const mountChildren = (children, container, parentComponent) => {
        normalLize(children)
        for(let i = 0; i < children.length; i++) {

            // children[i] 可能是纯文本元素

              
            patch(null, children[i], container, parentComponent)
        }
    }


    const mountElement = (vnode, container, anchor, parentComponent) => {
        const { type, children, props, shapeFlag, transition } = vnode


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
            mountChildren(children, el, parentComponent)
        }


        if(transition) {
          transition.beforeEnter(el)
        }
        hostInsert(el, container, anchor)

        if(transition) {
          transition.enter(el)
        }

    }

    const processElment = (n1, n2, container, anchor, parentComponent) => {
         if(n1 == null) {
            // 初始化操作
            mountElement(n2, container, anchor, parentComponent)
        }
        else {
            patchElement(n1, n2, container, parentComponent)
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


    const unmountChildren = (children, parentComponent) => {
        for (let i = 0; i < children.length; i++) {
            let child = children[i]
        unmount(child, parentComponent)
        }
  }


//   比较两个儿子的差异，更新dom
  const patchKeyedChildren = (c1, c2, el, parentComponent) => {
    // [a,b,c,e,f,d]
    // [a,b,d,q,f,d]
    // 1. 减少比对范围 先从头开始比 在从尾部开始 确定不一样的范围
    // 2 从头比对 再从尾巴比对 如果又多余的或者新增的直接操作即可

    // [a,b,c]
    // [a,b,d,e]
    let i = 0 // 开始比对的索引
    let e1 = c1.length - 1 // 第一个数组的尾部索引
    let e2 = c2.length - 1 // 第二个数组的尾部索引

    while (i <= e1 && i <= e2) {
      // 有任何一方循环结束 就要终止比较
      const n1 = c1[i]
      const n2 = c2[i]
      if (isSameVnode(n1, n2)) {
        patch(n1, n2, el)
      }
      else {
        break
      }
      i++
    }
    // 到c的位置终止了
    // 到d的位置终止了
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1]
      const n2 = c2[e2]
      // [a,b,c]
      // [d,e,b,c]
      if (isSameVnode(n1, n2)) {
        patch(n1, n2, el)
      }
      else {
        break
      }

      e1--
      e2--
    }

    // 处理增加和删除的特殊情况
    // [a,b] [a,b,c] ; [a,b] [c,a,b]
    // [a,b,c] [a,b] ; [c,a,b] [a,b]

    // a b
    // a b c --> 1 = 2 e1 = 1 e2 = 2 --> i>el && i <= e2

    // a b
    // c a b --> i = 0 e1 = -1 e2 = 0 --> i > e1 && i <= e2 // 新的多老的少
    if (i > e1) {
      // 新的多
      if (i <= e2) {
        // 有插入的部分
        // insert
        const nextPos = e2 + 1 // 看一下当前下一个元素是存在  例如 [a, b] [c, a, b]  anchor = a
        const anchor = c2[nextPos]?.el
        while (i <= e2) {
          patch(null, c2[i], el, anchor)
          i++
        }
      }
    }


    // a,b,c
    // a,b --> i = 2 e1 = 2 e2 = 1 --> i > e2 && i <= e1

    // c,a,b
    // a,b --> i = 0 e1 = 1 e2 = -1 --> i > e2 && i <= e1
    else if (i > e2) {
      if (i <= e1) {
        // remove
        while (i <= e1) {
          unmount(c1[i], parentComponent)
          i++
        }
      }
    }

    else {
      // 以上确认不变化的节点 并且对插入和删除做了处理

      // 后面就是特殊的比对方法
      const s1 = i
      const s2 = i

      const keyToNewIndexMap = new Map() // 用于快速查找 看老的是否在新的里面 没有就删除 有的就更新
      const toBePatched = e2 - s2 + 1 // 要倒序插入的个数
     const newIndexToOldMapIndex = Array.from({ length: toBePatched }).fill(0) // 用于记录新的节点在老的里面的位置


      for (let i = s2; i <= e2; i++) {
        const vnode = c2[i]
        keyToNewIndexMap.set(vnode.key, i)
      }

      for (let i = s1; i <= e1; i++) {
        const vnode = c1[i]
        const newIndex = keyToNewIndexMap.get(vnode.key)   // key一定要是唯一标识，不可是索引
        if (!newIndex) {
          // 如果新的里面找不到
          // 删掉老的
          unmount(vnode, parentComponent) 
        }
        else {
          // 找到了
          // 比较前后节点的差异 更新属性和儿子
        newIndexToOldMapIndex[newIndex - s2] = i + 1 // patch以后+1  ;  0 意味着以前就不存在
          patch(vnode, c2[newIndex], el)
        }
      }    

      // 调整顺序
      // 可以按照新的队列 倒序插入 通过参照物往前插

      // 插入的过程中可能新的元素变多 需要创建


      // 先从索引为3的位置倒叙插入
      for (let i = toBePatched - 1; i >= 0; i--) {
        const newIndex = s2 + i // h 对应的索引 找他的下一个元素作为参照物来进行插入
        const anchor = c2[newIndex + 1]?.el
        const vnode = c2[newIndex]

        if (!vnode.el) {
          // 新增的元素
          patch(null, vnode, el, anchor) // 创建h插入
        }   
        else {
            hostInsert(vnode.el, el, anchor) // 接着倒叙插入
          }
      }

       // 调整顺序
      // 可以按照新的队列 倒序插入 通过参照物往前插

      // 插入的过程中可能新的元素变多 需要创建

      const inCreasingSeq = getSequence(newIndexToOldMapIndex)

      // 先从索引为3的位置倒叙插入
      let j = inCreasingSeq.length - 1 // 索引
      for (let i = toBePatched - 1; i >= 0; i--) {
        const newIndex = s2 + i // h 对应的索引 找他的下一个元素作为参照物来进行插入
        const anchor = c2[newIndex + 1]?.el
        const vnode = c2[newIndex]

        if (!vnode.el) {
          // 新增的元素
          patch(null, vnode, el, anchor) // 创建h插入
        }
        else {
          if (i == inCreasingSeq[j]) {
            // 如果索引相同 跳过
            j--
          }
          else {
            hostInsert(vnode.el, el, anchor) // 接着倒叙插入
          }
        }
      }
    }

  }


    const patchChildren = (n1, n2, el, parentComponent) => {
        const c1 = n1.children
        const c2 = normalLize(n2.children)

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
        unmountChildren(c1, parentComponent)
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

            patchKeyedChildren(c1, c2, el, parentComponent)
        }
        // 新的不是数组
        else {
          unmountChildren(c1, parentComponent)
        }
      }
      else {
        // 老的是文本
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          hostSetElementText(el, '')
        }
        // 新的是数组
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          mountChildren(c2, el, parentComponent)
        }
      }
    }
    }

    const patchElement = (n1, n2, container, parentComponent) => {
        // 比较元素差异，需要复用dom元素
        // 比较属性和元素的子节点
        let el = (n2.el = n1.el)   // 对dom元素的复用

        let oldProps = n1.props || {}
        let newProps = n2.props || {}


        // hostPatchProps 只针对某一个属性处理，并不能处理多个属性
        patchProps(oldProps, newProps, el) 

        patchChildren(n1, n2, container, parentComponent)
    }

    const processText = (n1, n2, container) => {

      // 没有旧文本
      if(n1 == null) {
        hostInsert(n2.el = hostCreateText(n2.children), container)
      }
      else {
        const el = (n2.el = n1.el)
        if(n1.children !== n2.children) {
          hostSetText(el, n2.children)
        }
      }
    }

    const processFragment = (n1, n2, container, parentComponent) => {
      if(n1 == null) {
        mountChildren(n2.children, container, parentComponent)
      }
      else {
        patchChildren(n1, n2, container, parentComponent)
      }
    }

    const updateComponentPreRender = (instance, next) => {
      instance.next = null
      instance.vnode = next

      updateProps(instance, instance.props, next.props)

      // 组件更新  更新插槽
      Object.assign(instance.slots, next.children)
    }

    function renderComponent(instance) {
      const { render, vnode, proxy, props, attrs, slots } = instance

      if(vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
        return render.call(proxy, proxy)
      }
      else {
        // 此写法不使用，vue3没有任何性能优化
        return vnode.type(attrs, { slots })   // 函数式组件
      }
    }


    function setupRenderEffect(instance, container, anchor) {
          // const {render} = instance
          const componentUpdateFn = () => {
                    // 要在这里区分，是第一次还是之后的

                    const {bm, m} = instance
                    if(!instance.isMounted) {


                      if(bm) {
                        invokeArray(bm)
                      }

                      const subTree = renderComponent(instance)
                      patch(null, subTree, container, anchor, instance)
                      instance.isMounted = true
                      instance.subTree = subTree

                      if(m) {
                        invokeArray(m)
                      }
                    }
                    else {

                      const {next, bu, u} = instance

                      if(next) {
                        // 更新属性和插槽
                        updateComponentPreRender(instance, next)
                        
                      }

                      if(bu) {
                        invokeArray(bu)
                      }

                      

                      // 基于状态的组件更新
                      const subTree = renderComponent(instance)
                      patch(instance.subTree, subTree, container, anchor, instance)
                      instance.subTree = subTree

                      if(u) {
                        invokeArray(u)
                      }
                    }
                  }

          const update = (instance.update = () => effect.run())

          const effect = new ReactiveEffect(componentUpdateFn, () => queueJob(update))

          update()
    }
    


    const mountComponent = (vnode, container, anchor, parentComponent) => {

      // 先创建组件实例
      const instance = (vnode.component = createComponentInstance(vnode, parentComponent))

      if(isKeepAlive(vnode)) {
        instance.ctx.renderer = {
          createElement: hostCreateElement,   // 内部需要创建一个div来缓存dom
          move(vnode, container, anchor) {   // 需要把之前缓存的dom放到容器内
            hostInsert(vnode.component.subTree.el, container)
          },
          unmount   // 如果组件切换，需要将现在容器中的元素移除
        }
      }

      // 给实例属性赋值
      setupComponent(instance)
      // 创建一个effect
      setupRenderEffect(instance, container, anchor)
     
    }

    const hasPropsChange = (prevProps, nextProps) => {
      let nKey = Object.keys(nextProps)
      
      if(nKey.length !== Object.keys(prevProps).length) {
        return true
      }

      for(let i = 0; i < nKey.length; i++) {
        const key = nKey[i]

        if(nextProps[key] !== prevProps[key]) {
          return true
        }
      }

      return false
    }

    const updateProps = (instance, prevProps, nextProps) => {

      // 属性是否存在变化
       if(hasPropsChange(prevProps, nextProps)) {

        // 新的 覆盖 老的
        for(let key in nextProps) {
          instance.props[key] = nextProps[key]

        }

        // 删除 多余的老的
        for(let key in instance.props) {
          if(!(key in nextProps)) {
            delete instance.props[key]
          }
        }
       }
    }

    const shouldComponentUpdate = (n1, n2) => {
              const {props: prevProps, children: prevChildren} = n1
              const {props: nextProps, children: nextChildren} = n2

              if(prevChildren || nextChildren) return true   // 有插槽 直接重渲染

              if(prevProps === nextProps) return false

              // 若属性不一致
              return hasPropsChange(prevProps, nextProps)

    }

    const updateComponent = (n1, n2) => {
      const instance = (n2.component = n1.component)  // 复用组件实例

      // 更新逻辑
      if(shouldComponentUpdate(n1, n2)) {
        instance.next = n2
        instance.update()
      }

      
    }

    const processComponent = (n1, n2, container, anchor, parentComponent) => {

      if(n1 == null) {

        if(n2.shapeFlag & ShapeFlags.COMPONENT_KEPT_ALIVE) {
          // 需要走keepalive的激活
          parentComponent.ctx.activate(n2, container, anchor)
        }
        else {

        mountComponent(n2, container, anchor, parentComponent)          
        }

      }
      else {
        // 组件更新
        updateComponent(n1, n2)
      }
    }


    // 渲染、更新走这里
    const patch = (n1, n2, container, anchor = null, parentComponent = null) => {

        if(n1 == n2) {
            // 两次渲染同一个元素，直接跳过
            return
        }

        if(n1 && !isSameVnode(n1, n2)) {
            unmount(n1, parentComponent)
            n1 = null  // 直接移除老dom，执行processElment的if初始化
        }       

        const { type, shapeFlag, ref } = n2
        switch (type) {
          case Text:
            processText(n1, n2, container)
            break;
          case Fragment:
            processFragment(n1, n2, container, parentComponent)
            default: 
            if(shapeFlag & ShapeFlags.ELEMENT )  {
              // 对元素进行处理
            processElment(n1, n2, container, anchor, parentComponent) 
            }
            else if(shapeFlag & ShapeFlags.TELEPORT) {
                type.process(n1, n2, container, anchor, parentComponent, {
                   mountChildren,
                   patchChildren,
                   move(vnode, container, anchor) {
                    hostInsert(vnode.component ? vnode.component.subTree.el : vnode.el,
                    container,
                    anchor
                    )
                   }
                })
               
            }
            else if(shapeFlag & ShapeFlags.COMPONENT) {
              // 对组件的处理 函数式组件 vue3已不使用
              processComponent(n1, n2, container, anchor, parentComponent)
            }
            
               
        }

        if(ref !== null) {

          // n2 是dom 还是组件 还是组件有expose
          setRef(ref, n2) 
        }
    }

    function setRef(rawRef, vnode) {
      let value = vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT ? vnode.component.exposed || vnode.component.proxy : vnode.el

      if(isRef(rawRef)) {
        rawRef.value = value
      }
    }


    const unmount = (vnode, parentComponent) => {

      const {shapeFlag, transition, el} = vnode
      const performRemove = hostRemove(vnode.el)

      if(shapeFlag & ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE) {
        // 需要找keep走失活逻辑
        parentComponent.ctx.deactivate(vnode)
      }
      if(vnode.type === Fragment) {
        unmountChildren(vnode.children, parentComponent)
      }
      else if(shapeFlag & ShapeFlags.COMPONENT) {
        unmount(vnode.component.subTree, parentComponent)
      }
       else if(shapeFlag & ShapeFlags.TELEPORT) {
        vnode.type.remove(vnode, unmountChildren)
      }
      else {

        if(transition) {
          transition.leave(el)
        }
        else {
          performRemove()
        }
      }

    }


    // 多次调用render，会进行虚拟节点比较，再更新
    const render = (vnode, container, parentComponent) => {

        if(vnode == null) {
            // 移除当前dom元素
            if(container._vnode) {
                // 如果渲染过，移除
                unmount(container._vnode, parentComponent)
            }
        }
        else {
         // 将虚拟节点vnode变成真实节点进行渲染
        patch(container._vnode || null, vnode, container)

        // 缓存老虚拟节点
        container._vnode = vnode
        }

       
    }
    return {
        render
    }
}


// 完全不关心api，可以跨平台