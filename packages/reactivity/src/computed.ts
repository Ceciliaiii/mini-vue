import { isFunction } from "@vue/shared";
import { ReactiveEffect } from "./effect";
import { trackRefValue, triggerRefValue } from "./ref";


class ComputedRefImpl {
    public _value
    public effect
    public dep
    constructor(getter, public setter) {
        // 创建一个effect来管理当前计算属性的dirty属性
        this.effect = new ReactiveEffect(
            () => getter(this._value), 
            () => {
            // 计算属性依赖值变化了，触发渲染effect重新执行
                triggerRefValue(this)   // 触发依赖属性变化后，需要重新渲染，dirty变为true
        })
    }

    get value() {

        // 默认脏，执行一次后不脏
        if(this.effect.dirty) {
            this._value = this.effect.run()

            trackRefValue(this)
            //  若当前在effect中访问了计算属性，计算属性可以收集这个effect

        }
        return this._value
        
    }
    set value(v) {   
        // 这个是ref的setter
        this.setter(v)
    }
}


export function computed(getterOrOptions) {
    let onlyGetter = isFunction(getterOrOptions)

    let getter
    let setter
    if(onlyGetter) {
        getter = getterOrOptions
        setter = () => {}
    }
    else {
        getter = getterOrOptions.get
        setter = getterOrOptions.set
    }

    return new ComputedRefImpl(getter, setter)   // 计算属性 ref
}