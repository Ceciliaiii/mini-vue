import { currentInstance } from "vue";

export function provide(key, value) {

    // 子用父  子新增数据应该和父亲无关

    if(!currentInstance) return   // 建立在组件基础上

    const parentProvide = currentInstance.parent?.provides  // 获取父组件provide

    let provides = currentInstance.provides

    if(parentProvide === provides) {

        // 若在子组件上新增provides 需要拷贝一份全新的
        provides = currentInstance.provides = Object.create(provides)
    }

    provides[key] = value
}



export function inject(key, defaultValue) {
    if(!currentInstance) return

    const provides = currentInstance.parent?.provides

    if(provides && key in provides) {
        return provides[key]   // 直接从provides中取出来使用
    }
    else {
        return defaultValue   // 默认inject
    }
}