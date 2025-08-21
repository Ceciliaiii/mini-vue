import { isFunction, isObject } from "@vue/shared"
import { ReactiveEffect } from "@vue/reactivity/src/effect"
import { isReactive, isRef } from "@vue/reactivity"


export function watch(source, cb, options = {} as any) {
    return doWatch(source, cb, options)
}


export function watchEffect(source, options = {}) {

    // 没有cb
    return doWatch(source, null, options as any)
}


// currentDepth 控制 depth 已经遍历到了哪一层
function traverse(source, depth, currentDepth = 0, seen = new Set()) {
    if(!isObject(source)) {
        return source
    }
    if(depth) {
        if(currentDepth >= depth) {
            return source
        }

        currentDepth++   // 根据deep 属性来看是否是深度
    }

    if(seen.has(source)) {
        return source
    }

    for(let key in source) {
        traverse(source[key], depth, currentDepth, seen)
    }

    return source  // 遍历就会触发每个属性的get
}



function doWatch(source, cb, { deep, immediate }) {

    const reactiveGetter = (source) => traverse(source, deep === false ? 1 : undefined)

    // 创建一个可以给ReactiveEffect来使用的getter，需要对这个对象进行遍历取值操作，关联当前的ReactiveEffect

    let getter

    // watch对象必须是reactive
    if(isReactive(source)) {
        getter = () => reactiveGetter(source)
    } 
    // 或者对象属性、变量必须是ref
    else if (isRef(source)) {
        getter = () => source.value
    } 
    // 参数是function
    else if(isFunction(source)) {
        getter = () => source
    } 
   
    let oldValue


    let clean
    const onCleanup = (fn) => {
        clean = () => {
            fn()

            clean = undefined
        }

    }

    const job = () => {

        if(cb) {
            const newValue = effect.run()

            if(clean) {
                clean()   // 在执行回调前，先调用上一次的清理操作进行清理
            }
            cb(newValue, oldValue, onCleanup)

            oldValue = newValue
        }
        else {
            effect.run()   // watchEffect
        }
        
    }

    const effect = new ReactiveEffect(getter, job)


    if(cb) {
            if(immediate) {   // 立即先执行一次用户的回调，传递新值和老值
                    job()
                }
                else {
                    oldValue = effect.run()
                }

    }
    else {
        // watchEffect
        effect.run()  // 直接执行
    }
   

    const unwatch = () => {
        effect.stop()
    }

    return unwatch()
}