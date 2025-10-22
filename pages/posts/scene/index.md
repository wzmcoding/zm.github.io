---
title: 场景题
date: 2025-10-22
updated: 2025-10-22
categories: 场景题
tags:
  - 场景题
top: 1
---

# 场景题

## 请求竞态问题
> 假如我们页面上有两个按钮，这两个按钮是调用同一个函数发送请求，但是他们的参数是不一样的，最终页面上只能展示一个请求的结果，
> 如果我们不对它进行限制，那么就会导致请求竞态问题，假设我们点击按钮1，在按钮1发送的请求没回来的时候，我们又点击按钮2，
> 那么我们很难保证按钮2的请求一定会比按钮1的请求先回来，所以是有可能导致按钮2先回来，那么按钮1的请求结果就会覆盖按钮2的请求结果，
> 这样就会导致页面上的结果是错误的，所以我们就需要解决这个问题

```javascript
/**
 * 创建一个可取消的异步任务包装器
 * @param fn 需要被包装的异步函数
 * @returns 返回一个对象， 包含一个 cancel 方法和一个 run 方法
 */
export function createCancelableTask(fn: any) {
    // 定义一个空操作函数，用于重置 resolve 和 reject
    const NOOP = () => { }
    // 初始化取消函数
    let cancel = NOOP

    return {
        // 提供取消当前任务的方法
        cancel: () => cancel(),
        // 执行异步任务的方法，接收与原函数相同的参数
        run: (...args: any[]) => {
            return new Promise((resolve, reject) => {
                // 如果有正在执行的任务，先取消它
                cancel()
                // 重新定义取消函数，将 resolve 和 reject 重置为空操作
                cancel = () => (resolve = reject = NOOP)

                fn(...args)
                    .then(
                        (res: any) => resolve(res), // 当 fn 执行成功时，调用 resolve
                        (err: any) => reject(err), // 当 fn 执行失败时，调用 reject
                    )
            })
        }
    }
}
// 测试用例
const { run, cancel } = createCancelableTask(async (num: number) => {
    console.log('开始请求', num)
    await new Promise(resolve => setTimeout(resolve, 3000))
})
run(1)
run(2)
run(3)
```
