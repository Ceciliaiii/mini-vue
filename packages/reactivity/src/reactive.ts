import { isObject } from '@vue/shared'
import { mutableHandlers } from './baseHandler'
import { ReactiveFlags } from './constants'


// 用于记录代理后的结果，可以复用
const reactiveMap = new WeakMap()


// 创建响应式对象
function createReactiveObiect(target) {
 // 统一做判断 响应式对象必须是对象才可以
    if (!isObject(target)) {
        return target
    }
// 判断是否已经是响应式对象（已经被代理）
    if(target[ReactiveFlags.IS_REACTIVE]) {
        return target
    }

    // 取缓存 如果有直接返回，避免new两次的性能问题
  const exitsProxy = reactiveMap.get(target)
  if (exitsProxy) {
    return exitsProxy
  }

   let proxy = new Proxy(target, mutableHandlers)
     // 根据对象缓存代理后的结果
    reactiveMap.set(target, proxy)
   return proxy
}


// 最后导出 reactive 函数
export function reactive(target) {
    return createReactiveObiect(target)
}


// 若ref里的数据类型是obj，用回reactive方法
export function toReactive(value) {
  return isObject(value) ? reactive(value) : value
}