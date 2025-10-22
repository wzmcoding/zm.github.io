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
console.log("开始防竞态请求测试...");

const { run, cancel } = createCancelableTask(async (num: number) => {
    console.log(`开始请求 ${num}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`请求 ${num} 完成`);
    return `结果 ${num}`;
});

// 连续发送三个请求
run(1).then(result => {
    console.log(`请求1结果: ${result}`);
}).catch(err => {
    console.log(`请求1被取消`);
});

run(2).then(result => {
    console.log(`请求2结果: ${result}`);
}).catch(err => {
    console.log(`请求2被取消`);
});

run(3).then(result => {
    console.log(`请求3结果: ${result}`);
}).catch(err => {
    console.log(`请求3被取消`);
});

console.log("注意: 只有最后一个请求(请求3)会成功完成，前两个会被自动取消");
// 开始防竞态请求测试...
// App.vue:36 开始请求 1
// App.vue:36 开始请求 2
// App.vue:36 开始请求 3
// App.vue:61 注意: 只有最后一个请求(请求3)会成功完成，前两个会被自动取消
// App.vue:38 请求 1 完成
// App.vue:38 请求 2 完成
// App.vue:38 请求 3 完成
// App.vue:56 请求3结果: 结果 3
```

这个函数实现了一个可取消的异步任务包装器，它接收一个异步函数作为参数，并返回一个包含`run` 和 `cancel` 方法的对象。

- `run`方法接收与原函数相同的参数，并返回一个`Promise`,当原函数执行成功时，调用`resolve`,当原函数执行失败时，调用`reject`,,如果上一次请求没有完成，那么会取消上一次请求，并重新发起新的请求
- `cancel`方法用于取消当前正在进行的任务，它会调用原函数的取消函数，并将 `resolve` 和 `reject` 重置为空操作，置空后，无论请求成功还是失败，都不会再执行之前的 `resolve` 和 `reject` ,所以`Promise`的状态不会改变，也就不会触发`then`或者`catch`方法

> 注意，这种方法**只是说我们不再需要响应结果了**，但是请求是已经发出去的，函数也是已经执行的，我们并不能对它已经执行的操作进行回滚

