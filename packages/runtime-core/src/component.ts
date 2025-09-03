import { proxyRefs, reactive } from "@vue/reactivity"
import { hasOwn, isFunction, ShapeFlags } from "@vue/shared"

export function createComponentInstance(vnode) {
    const instance = {
        data: null,   // 状态
        vnode, // 组件虚拟节点
        subTree: null,  // 子树
        isMounted: false,  // 是否挂载完成
        update: null,    // 组件的更新函数
        props: {},
        attrs: {},
        slots: {},
        propsOptions: vnode.type.props,  // 用户声明的哪些属性是组件的属性
        component: null,
        proxy: null,  // 代理props attrs data，让用户更方便的访问
        setupState: {},

      }

      return instance
}

// 初始化属性
    const initProps = (instance, rawProps) => {

      const props = {}
      const attrs = {}
      const propsOptions = instance.propsOptions || {}   // 组件中定义的

      if(rawProps) {
        for(let key in rawProps) {
          const value = rawProps[key]

          if(key in propsOptions) {
            props[key] = value   // props不需要深度代理，组件不能更改props
          }
          else {
            attrs[key] = value
          }
        }
      }
      instance.attrs = attrs
      instance.props = reactive(props)
    }



      const publicProperty = {
        $attrs: (instance) => instance.attrs,
        $slots: (instance) => instance.slots
        // ...
      }


      
const handler = {
              get(target, key) {
      
                const {data, props, setupState} = target
      
                // proxy.name 代理到 state.name
                if(data && hasOwn(data, key)) {
                  return data[key] 
                }
                else if(props && hasOwn(props, key)) {
                  return props[key]
                }
                else if(setupState && hasOwn(setupState, key)) {
                  return setupState[key]
                }
      
               // 对于一些无法修改的属性 $slots $attrs ...    $attrs => instance.attrs
                const getter = publicProperty[key]
                if(getter) {
                  return getter(target)
                }
      
              },
              set(target, key, value) {
                const {data, props, setupState} = target
      
                if(data && hasOwn(data, key)) {
                  data[key] = value
                }
                else if(props && hasOwn(props, key)) {
                  // props不可改
                  // 用户可以修改属性中的嵌套属性 但是不合法
                  console.warn('props are readonly')
                  return false
                }
                else if(setupState && hasOwn(setupState, key)) {
                  setupState[key] = value;
                }
                return true
              }
            }


export function initSlots(instance, children) {
  if(instance.vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN) {
    instance.slots = children
  }
  else {
    instance.slot = {}
  }
}

            
export function setupComponent(instance) {
    const {vnode} = instance

    // 赋值属性
    initProps(instance, vnode.props)
    initSlots(instance, vnode.children)

    // 赋值代理对象
    instance.proxy = new Proxy(instance, handler)


    const {data = () => {}, render, setup} = vnode.type


    if(setup) {
      const setupContext = {

      }

      const setupResult = setup(instance.props, setupContext)

      if(isFunction(setupResult)) {
        instance.render = setupResult
      }
      else {
        instance.setupState = proxyRefs(setupResult)   // 将返回值做脱ref
      }
    }

    if(!isFunction(data)) {
      console.warn('data option must be a function')
    } 
    else {
           // data中可以拿到props
    instance.data = reactive(data.call(instance.proxy))
    }

    if(!instance.render) {

      // 没有setup 用自己定义的render
      instance.render = render
    }

   
}