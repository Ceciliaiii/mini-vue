const queue: any[] = [] // 微任务队列

const resolvePromise = Promise.resolve()
let isFlushing = false

export function queueJob(job) {
  if (!queue.includes(job)) { // 对任务去重 如果是重复的任务则不放入微任务队列中
    queue.push(job)
    // 执行所有的 job

    if(!isFlushing) {
        isFlushing = true
        resolvePromise.then(() => {
        isFlushing = false
        const copy = queue.slice(0)  // 先拷贝再执行
        queue.length = 0
        copy.forEach((job) => job())
        copy.length = 0
 
    })
  }
}

    
}