import { ref } from "@vue/reactivity"
import { h } from "./h"
import { isFunction, isObject } from "@vue/shared"

export function defineAsyncComponent(options) {

    if(isFunction(options)) {
        options = { loader: options }
    }

    return {
        setup() {
            const { loader, errorComponent, loadingComponent, timeout, delay, onError } = options
            const loaded = ref(false)
            const loading = ref(false)
            const error = ref(false)  // 超时


            let loadingTimer = null
            if(delay) {
                loadingTimer = setTimeout(()=> {
                    loading.value = true
                }, delay)
            }

            let Comp = null

            let attempts = 0
            function loadFunction() {
                return loader().catch(err => {
                    // 手动处理异常
                    if(onError) {
                        return new Promise((resolve, reject) => {
                            const retry = () => resolve(loadFunction())
                            const fail = () => reject(err)
                            onError(err, retry, fail, ++attempts)
                        })
                    }
                    else {
                        throw err  // 将错误继续传递
                    }
                })
            }

            loadFunction()
            .then((comp)=> {
                Comp = comp
                loaded.value = true
            })
            .catch(err => {
                error.value = err
            })
            .finally(() => {
                loading.value = false

                // 无论成功失败，完成后都不需要切换成loading状态
                clearTimeout(loadingTimer)
            })


            if(timeout) {
                setTimeout(() => {
                    error.value = true
                    throw new Error('组件加载失败')
                }, timeout)
            }


            const placeholder = h('div')

            return () => {
                if(loaded.value) {
                    return h(Comp)
                }
                // 若出错 先渲染错误
                else if(error.value && errorComponent) {
                    return h(errorComponent)
                }
                else if(loading.value && loadingComponent) {
                    return h(loadingComponent)
                }
                else {
                    return placeholder
                }
            }
        }
    }
}