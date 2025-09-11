import { currentInstance, setCurrentInstance, unsetCurrentInstance } from "./component"

export const enum LifeCycle {
    BEFORE_MOUNT = 'bm',
    MOUNTED = 'm',
    BEFORE_UPDATE = 'bu',
    UPDATE = 'u'
}


export const onBeforeMount = createHook(LifeCycle.BEFORE_MOUNT)

export const onMounted = createHook(LifeCycle.MOUNTED)

export const onBeforeUpdate = createHook(LifeCycle.BEFORE_UPDATE)

export const onUpdated = createHook(LifeCycle.UPDATE)


function createHook(type) {
    // 将当前实例存在此钩子上
    return (hook, target = currentInstance) => {
        
        if(target) {
            // 当前钩子是在组件中运行的
            // 看当前钩子是否存放，发布订阅
            const hooks = target[type] || (target[type] = [])

            // 让currentInstance存到这个函数内
            const wrapHook = () => {
                // 在钩子执行前，对实例进行校正处理
                setCurrentInstance(target)
                hook.call(target)
                unsetCurrentInstance()
            }

            // 在执行函数内部保证实例更新
            hooks.push(wrapHook)
        }
    }
}

export function invokeArray(fns) {
    for(let i = 0; i < fns.length; i++) {
        fns[i]()
    }
}