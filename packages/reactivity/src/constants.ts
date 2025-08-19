// 响应标识符，用于判断是否被代理
export enum ReactiveFlags {
    IS_REACTIVE = '__v_isReactive',
}


export enum DirtyLevels {
    Dirty = 4,  // 脏值，意味着取值要运行计算属性
    NoDirty = 0  // 不脏就用上一次的返回结果
}