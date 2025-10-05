---
title: PatchFlags
date: 2025-10-05
updated: 2025-10-05
categories: 手写Vue3源码之组件篇
tags:
  - 手写Vue3源码之组件篇
top: 1
---

## PatchFlags
什么是 PatchFlags？
PatchFlags 是 Vue 3 中用于优化虚拟 DOM 更新的一种机制。
它们是编译器在编译模板时生成的标志，用于指示哪些部分的虚拟 DOM 需要更新，从而减少不必要的 DOM 操作，提高性能。

比如:
```javascript
import { h, ref } from 'vue'

const App = {
  setup() {
    const count = ref(0)
    setInterval(() => {
      count.value++
    }, 1000)
    return () =>
      h('div', { class: 'container', style: { color: 'red' } }, count.value)
  },
}
```

在这段代码中， div 的 class 和 style 属性是静态的，不会随着 count 的变化而变化，只有 div 的 children 是动态的，会随着 count 的变化而变化。
那么在 count 发生变化时，Vue 会对比新旧虚拟 DOM，发现 div 的 class 和 style 没有变化，只有 children 发生了变化，于是只更新 children，
但是在我们看来， div 的 class 和 style 是不需要对比的，因为它们永远不会变，
但是 Vue 还是对它们进行了对比，这就造成了不必要的性能浪费，如果有一种办法能告诉 Vue 哪些属性是静态的，
哪些属性是动态的，那就可以避免这种不必要的对比，从而提升性能，那么恭喜你，你发明了 PatchFlags。


## Block
刚才我们已经使用 patchFlags 优化了 div 的属性对比，但是如果 div 有很多子节点呢？比如：
```javascript
import { h, ref } from 'vue'

const App = {
  setup() {
    const count = ref(0)
    setInterval(() => {
      count.value++
    }, 1000)
    return () =>
      h('div', { class: 'container' }, [
        h('h1', 'Hello, Vue 3!'),
        h('h2', '欢迎学习 Vue 源码'),
        // 以上内容是静态节点
        // ------
        // 以下内容是动态节点
        h('p', count.value),
      ])
  },
}
```
在这个例子中，div 有三个子节点，其中 h1 和 h2 是静态节点， p 的 children 是动态的，那么在 count 变化时，
Vue 会对比新旧虚拟 DOM，发现 h1 和 h2 没有变化，只有 p 发生了变化，于是只更新 p，
但是 Vue 还是会对比 h1 和 h2，这样就造成了不必要的性能浪费，如果有一种办法能告诉 Vue 哪些子节点是静态的，哪些子节点是动态的，
那么我们就可以只对比动态子节点，从而提升性能，那么恭喜你，你发明了 Block。

我们先来实现一下基础的代码，收集动态子节点
```javascript
let currentBlock = null

export function openBlock() {
  // 开启一个新的 block
  currentBlock = []
}

export function closeBlock() {
  // 关闭当前 block
  currentBlock = null
}

function setupBlock(vnode) {
  // 将当前 block 的动态子节点收集到 vnode 上
  vnode.dynamicChildren = currentBlock
  closeBlock()
}

export function createElementBlock(type, props, children, patchFlag) {
  const vnode = createElementVNode(type, props, children, patchFlag)
  setupBlock(vnode)
  return vnode
}
```
