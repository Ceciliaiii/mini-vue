import { track, trigger } from './reactiveEffect'

// 响应标识符，用于判断是否被代理
export enum ReactiveFlags {
    IS_REACTIVE = '__v_isReactive',
}

export const mutableHandlers:ProxyHandler<any> = {
    // 拦截代理
    get(target, key, recevier) {
        // 判断是否已经被代理
        if (key === ReactiveFlags.IS_REACTIVE) {
            return true
        }

        // 当取值的时候 应该让响应式属性 和 effect 映射起来

        // 依赖收集
        track(target, key)   // 收集这个对象上的属性，和effect关联

        return Reflect.get(target, key, recevier)
    },
    set(target, key, value, recevier) {
        // 找到属性 让对应的effect重新执行

        let oldValue = target[key]

        let result = Reflect.set(target, key, value, recevier)

        if(oldValue !== value) {
            // 需要触发页面更新
            trigger(target, key, value , oldValue)
        }
        
        // 触发更新
        return result
    }, 
}