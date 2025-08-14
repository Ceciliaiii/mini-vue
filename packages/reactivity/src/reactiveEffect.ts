import { activeEffect, trackEffect, triggerEffects } from "./effect";

const targetMap = new WeakMap()  // 存放依赖收集的关系

export const createDep = (cleanup, key) => {
    const dep = new Map() as any
    dep.cleanup = cleanup
    dep.name = key
    return dep
}

export function track(target, key) {
    // activeEffect 有这个属性说明key在effect中访问，否则在effect之外访问的不用收集
    if (activeEffect) {

        let depsMap = targetMap.get(target)
        

        if(!depsMap) {
            // 新增
            targetMap.set(target, (depsMap = new Map()))
        }

        let dep = depsMap.get(key)

        if(!dep) {
            // 后面用于清理不需要的属性
            depsMap.set(key, (dep = createDep(() => depsMap.delete(key), key)))
        }

        // 将当前的effect放入到dep映射表中，后续根据值的变化触发dep中存放的effect
        trackEffect(activeEffect, dep)
    }
}


export function trigger(target, key, newValue, oldValue) {


    const depsMap = targetMap.get(target)

    // 找不到对象
    if(!depsMap) {
        return
    }

    let dep = depsMap.get(key)

    if(dep) {
        // 修改的属性对应effect
        triggerEffects(dep)
    }
}

