---
title: 组件的异步更新
date: 2025-09-18
updated: 2025-09-18
categories: 手写Vue3源码之组件篇
tags:
  - 手写Vue3源码之组件篇
top: 1
---

## 组件的异步更新
先看案例
```javascript
import { h, ref, createApp } from '../dist/vue.esm.js'

const Comp = {
  setup(props, { attrs }) {
    const count = ref(0)
    btn.onclick = () => {
      count.value++
      count.value++
      count.value++
      // 在点击事件中更新了三次 count.value
    }

    return () => {
      console.count('render') // 每次点击按钮，会打印三次
      return h('div', { id: 'container' }, count.value)
    }
  }
}

createApp(Comp).mount('#app')
```
当按钮点击时，`count` 的值会增加三次，同时 `render` 函数会被调用三次。因为**响应式是同步的**，
所以 `render` 函数会被立即调用，这样似乎也没什么问题，但是我们虽然改变了三次响应式数据，用户真正能看到的确是最后一次渲染的结果，
所以前面两次渲染是没有必要的，那我们如何避免这种情况呢？我们直接**把渲染函数放到异步队列里面去**，就可以了：
```javascript
const componentUpdateFn = () => {
  // 组件更新和挂载的函数
  // 省略代码...
}

// 创建 effect
const effect = new ReactiveEffect(componentUpdateFn)
const update = effect.run.bind(effect)

// 保存 effect run 到 instance.update
instance.update = update
// 💡 回顾一下 scheduler 的作用，当依赖的响应式数据变化时，scheduler 会被调用
effect.scheduler = () => {
  // queueJob 是一个异步函数
  queueJob(update)
}

update()
```
实现 `queueJob` 函数
`packages/vue/src/runtime-core/scheduler.ts`
```javascript
// scheduler.ts
export function queueJob(job) {
  Promise.resolve().then(() => {
    job()
  })
}
```
这样就完事儿了，我们去异步执行这个函数，就可以只渲染一次了，但是这样会带来一个问题，就是我们如果希望拿到 `dom` 最新的状态，目前这种形势下肯定是拿不到了
```javascript
import { h, ref, createApp } from '../dist/vue.esm.js'

const Comp = {
  setup(props, { attrs }) {
    const count = ref(0)
    btn.onclick = () => {
      count.value++
      count.value++
      count.value++

      const container = document.querySelector('#container')
      console.log(container.textContent) // 打印0
    }

    return () => {
      console.count('render') // 每次点击按钮，会打印一次
      return h('div', { id: 'container' }, count.value)
    }
  }
}

createApp(Comp).mount('#app')
```
由于 `count` 的值是异步更新的，所以我们在点击按钮时，`container` 的值是 0，而不是 3，这就导致了我们拿不到最新的状态。我们可以使用 `nextTick` 来解决这个问题：
`packages/vue/src/runtime-core/scheduler.ts`
```javascript
const resolvedPromise = Promise.resolve()

export function nextTick(fn) {
  // 这里的 fn 就是我们传入的回调函数
  // 这里的 Promise.resolve() 是一个微任务
  return resolvedPromise.then(() => fn.call(this))
}

// scheduler.ts
export function queueJob(job) {
  resolvedPromise.then(() => {
    job()
  })
}
```
这样我们就可以在 `nextTick` 中拿到最新的状态了：
```javascript
import { h, ref, createApp, nextTick } from '../dist/vue.esm.js'

const Comp = {
  setup(props, { attrs }) {
    const count = ref(0)
    btn.onclick = () => {
      count.value++
      count.value++
      count.value++

      nextTick(() => {
        const container = document.querySelector('#container')
        console.log(container.textContent) // 打印 3
      })
    }

    return () => {
      console.count('render') // 每次点击按钮，会打印一次
      return h('div', { id: 'container' }, count.value)
    }
  }
}

createApp(Comp).mount('#app')
```
