export function effect(fn, options?) {
  // 创建一个响应式effect  数据变化后可以重新执行

  // 创建一个effect 只要依赖属性变化了就要执行回调
  const _effect = new ReactiveEffect(fn, () => {
    _effect.run();
  });

  _effect.run();

  return _effect;
}

export let activeEffect;

class ReactiveEffect {

  // 用于记录当前effect执行次数
  _trackId = 0
  deps = []
  _depsLength = 0

  public active = true; // 创建的effect是响应式的
  // fn 用户编写的函数
  // 如果fn中依赖的数据发生变化后，需要重新调用 -> run()
  constructor(public fn, public scheduler) {}
  run() {
    if (!this.active) {
      // 不是激活的，执行后不做任何事情
      return this.fn();
    }
    let lastEffect = activeEffect;
    try {
      activeEffect = this;
      return this.fn(); // 依赖收集
    } finally {
      activeEffect = lastEffect;
    }
  }
  stop() {
    this.active = false
  }
}

 
export function trackEffect(effect, dep) {
  dep.set(effect, effect._trackId)

  // effect和dep关联起来
  effect.deps[effect._depsLength++] = dep
}


export function triggerEffects(dep) {
  for(const effect of dep.keys()) {
    if(effect.scheduler) {
      effect.scheduler()
    }
  }
}
