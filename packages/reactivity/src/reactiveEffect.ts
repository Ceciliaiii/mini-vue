import { activeEffect } from "./effect";

export function track(target, key) {
    // activeEffect 有这个属性说明key在effect中访问，否则在effect之外访问的不用收集
    if (activeEffect) {
        console.log(target,key, activeEffect);
        
    }
}

