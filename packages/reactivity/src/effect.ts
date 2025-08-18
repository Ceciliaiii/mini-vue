export function effect(fn, options?) {
  // 创建一个响应式effect  数据变化后可以重新执行

  // 创建一个effect 只要依赖属性变化了就要执行回调
  const _effect = new ReactiveEffect(fn, () => {
    _effect.run();
  });

  _effect.run();


  if(options) {
    Object.assign(_effect, options)  // 用户传递的执行函数覆盖掉原本的scheduler
  }

  // 能让外界获取到执行函数
  const runner = _effect.run.bind(_effect)
  runner.effect = _effect  // 可以在run方法上获取到effect的引用


  return runner;
}

export let activeEffect;

function preCleanEffect(effect) {
  effect._depsLength = 0
  effect._trackId++
}

function postCleanEffect(effect) {
  if(effect.deps.length > effect._depsLength) {
    for(let i = effect._depsLength ; i < effect.deps.length ; i++) {
      cleanDepEffect(effect.deps[i], effect)  // 删除映射表中对应的effect
    }

    effect.deps.length = effect._depsLength  // 更新依赖列表的长度
  }
}

class ReactiveEffect {

  // 用于记录当前effect执行次数
  _trackId = 0
  deps = []
  _depsLength = 0
  _running = 0

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

      // effect重新执行前，需要将上一次的依赖清空  effect.deps
      preCleanEffect(this)
      
      this._running++

      return this.fn(); // 依赖收集
    } finally {
      this._running--
      postCleanEffect(this)
      activeEffect = lastEffect;
    }
  }
  stop() {
    this.active = false
  }
}

function cleanDepEffect(dep, effect) {
  dep.delete(effect)

  if(dep.size == 0) {
      dep.cleanup()  // map为空，则删除旧的映射表
    }
}

 
export function trackEffect(effect, dep) {

  // 重新收集依赖，将不需要的移除掉
  if(dep.get(effect) !== effect._trackId) {
    // 更新effect执行次数
    dep.set(effect, effect._trackId)

    let oldDep = effect.deps[effect._depsLength] 
    // 如果没有存储过依赖
      if(oldDep !== dep) {
        if(oldDep) {
          // 删除掉旧依赖
          cleanDepEffect(oldDep, effect)
        }
        // 添加新依赖
        effect.deps[effect._depsLength++] = dep
      } else {
        effect._depsLength++
      }
    
  }


  dep.set(effect, effect._trackId)

  // effect和dep关联起来
  // effect.deps.push(dep)
  effect.deps[effect._depsLength++] = dep
}


export function triggerEffects(dep) {
  for(const effect of dep.keys()) {

   // 如果不是正在执行，才能执行
  if(!effect._running) {

    if(effect.scheduler) {

        effect.scheduler()
      }

    }
  }
}
