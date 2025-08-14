# Reactive API

## 响应式标识 `ReactiveFlags`
```ts
// 响应标识符，用于判断是否被代理
export enum ReactiveFlags {
    IS_REACTIVE = '__v_isReactive',
}
```
**作用**：给响应式对象添加一个 "响应标识"，鉴定已经是响应式对象


## 代理处理器 `mutableHandlers` 
```ts
export const mutableHandlers: ProxyHandler<any> = {
    // 拦截属性读取操作
    get(target, key, receiver) {
        // 判断是否在查询"是否为响应式对象"
        if (key === ReactiveFlags.IS_REACTIVE) {
            return true; // 是响应式对象就返回true
        }

        // 这里后续会添加依赖收集逻辑
        // 当读取属性时，记录"谁在读取这个属性"

        // 实际读取属性值
        return Reflect.get(target, key, receiver);
    },

    // 拦截属性修改操作
    set(target, key, value, receiver) {
        // 这里后续会添加更新触发逻辑
        // 当属性修改时，通知"之前记录的那些读取者"重新执行

        // 实际修改属性值
        return Reflect.set(target, key, value, receiver);
    }, 
}
```
**作用**：定义对象被代理后的行为，拦截属性的读写操作

**功能**：
- `get` ：拦截属性读取，未来用于 "记录谁用到了这个属性"
- `set` ：拦截属性修改，未来用于 "通知用到这个属性的地方更新"


## 响应式创建工具 `createReactiveObject`
负责创建响应式对象的核心逻辑
```ts
// 用于缓存已代理的对象，避免重复代理
const reactiveMap = new WeakMap()

function createReactiveObject(target) {
    // 1. 非对象类型不做响应式处理（只有对象能被代理）
    if (!isObject(target)) {
        return target;
    }

    // 2. 检查是否已经是响应式对象（通过"身份标识"判断）
    if (target[ReactiveFlags.IS_REACTIVE]) {
        return target;
    }

    // 3. 检查缓存，如果之前代理过，直接复用结果
    const existingProxy = reactiveMap.get(target);
    if (existingProxy) {
        return existingProxy;
    }

    // 4. 创建代理对象（核心步骤）
    const proxy = new Proxy(target, mutableHandlers);
    
    // 5. 缓存代理结果，方便下次复用
    reactiveMap.set(target, proxy);
    
    return proxy;
}
```
**关键优化**: 
 - 非对象直接返回（节省性能）
 ```ts
 export function isObject(value) {
  return typeof value === 'object' && value !== null
}
```
 - 避免重复代理（标识检查普通对象 、 缓存检查代理对象）
 ```ts
    // 例如：
    const man = {
        age: 18,
        name: wang
    }

    // 1.重复代理
    const state1 = reactive(man)
    const state2 = reactive(man)

    // 2.代理之后再代理
    const state1 = reactive(man)
    const state2 = reactive(state1)
 ```
 - 使用 WeakMap 缓存代理结果（自动垃圾回收，不内存泄漏）


 ## 对外接口 `reactive`
 给用户提供的入口函数
 ```ts
export function reactive(target) {
    return createReactiveObject(target);
}
 ```

 **使用方式**：
 ```ts
 const state = reactive({ count: 0 });
 ```