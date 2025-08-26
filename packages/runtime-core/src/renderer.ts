import { ShapeFlags } from "@vue/shared"

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


        let el = hostCreateElement(type)


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


    // 渲染、更新走这里
    const patch = (n1, n2, container) => {

        if(n1 == n2) {
            // 两次渲染同一个元素，直接跳过
            return
        }

        if(n1 == null) {
            // 初始化操作
            mountElement(n2, container)
        }
    }


    // 多次调用render，会进行虚拟节点比较，再更新
    const render = (vnode, container) => {
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