---
title: 文本节点
date: 2025-07-21
updated: 2025-07-22
categories: 手写Vue3源码
tags:
  - 文本节点
top: 1
---

# 文本节点
我们之前一直讲的是使用虚拟 DOM 创建某一个元素节点，渲染到页面中，其实 vue 还支持渲染文本节点，简单来说就是将一个文本节点渲染到真实 DOM 中，我们来看一下怎么使用的：
```typescript
import { h, render, Text } from '../dist/vue.esm.js'
// 创建一个文本节点，内容为 'hello'
const vnode1 = h(Text, null, 'hello')
// 将 vnode1 渲染到 app 元素中
render(vnode1, app)
```
这个功能其实也简单，我们并不需要修改虚拟 `createVNode` 中的代码，我们先来创建这个 `Text` 标记：
- vnode.ts
```typescript
// vnode.ts
/**
 * 文本节点标记
 */
export const Text = Symbol('v-txt')
```
`vnode.ts` 中就做这一件事，其他的我们交给 `renderer.ts` 来处理
```typescript
const patch = (n1, n2, container, anchor = null) => {
  if (n1 === n2) {
    // 如果两次传递了同一个虚拟节点，啥都不干
    return
  }

  if (n1 && !isSameVNodeType(n1, n2)) {
    // 比如说 n1 是 div ，n2 是 span，这俩就不一样，或者 n1 的 key 是1，n2 的 key 是 2，也不一样，都要卸载掉 n1
    // 如果两个节点不是同一个类型，那就卸载 n1 直接挂载 n2
    unmount(n1)
    n1 = null
  }

  /**
   * 文本，元素，组件
   */

  const { shapeFlag, type } = n2

  // 💡 由于我们后面会有其它类型的虚拟节点，比如 组件，元素等，所以我们改造一下之前的代码，写成 switch 语句
  switch (type) {
    case Text:
      // 💡 文本节点走这边
      processText(n1, n2, container, anchor)
      break
    default:
      if (shapeFlag & ShapeFlags.ELEMENT) {
        // 我们将原来处理元素的逻辑放到 processElement 里面去了
        // 处理 dom 元素 div span p h1
        processElement(n1, n2, container, anchor)
      }
  }
}
```
来看一下 `processText`
```typescript
/**
 * 处理文本的挂载和更新
 */
const processText = (n1, n2, container, anchor) => {
  if (n1 == null) {
    // 挂载
    const el = hostCreateText(n2.children)
    // 给 vnode 绑定 el
    n2.el = el
    // 把文本节点插入到 container 中
    hostInsert(el, container, anchor)
  } else {
    // 更新
    // 复用节点
    n2.el = n1.el
    if (n1.children != n2.children) {
      // 如果文本内容变了，就更新
      hostSetText(n2.el, n2.children)
    }
  }
}
```
在 `processText` 中，我们判断 `n1` 是否为 `null`，如果是 `null`，表示是挂载，如果不是，表示是更新，我们通过 `hostCreateText` 创建一个文本节点，然后将它插入到容器中，最后将文本节点的 `el` 赋值给 `n2.el`，这样我们就可以复用这个节点了。
完成这个功能后，我们再来扩展一个功能，比如我们之前渲染虚拟节点的 `children`，如果有多个子节点，我们只能传递 虚拟节点进去：
```typescript
const vnode = h('div', [h('span', 'hello'), h('span', 'world')])
```
之前我们只能写成这种方式，如果有了文本节点，我们还可以写成这种方式：
```typescript
const vnode = h('div', ['hello', 'world'])
```
我们可以写成这样，就不用每次都传虚拟节点进去了，但是这样做，在 `renderer` 内部去挂载的时候还是会把它转换为文本节点，因为字符串是不能挂载的，那我们再挂载的时候将它转换一下：
我们先来写个虚拟节点标准化的函数：
```typescript
// vnode.ts
export function normalizeVNode(vnode) {
  if (isString(vnode) || isNumber(vnode)) {
    // 如果是 string 或者 number 转换成文本节点

    return createVNode(Text, null, String(vnode))
  }
  // 以为是虚拟节点
  return vnode
}
```
这个函数会接受一个参数，如果接受的这个参数是字符串或者是数字，那么就将它转换为文本节点，最后返回一个虚拟节点，如果不是，就直接返回这个虚拟节点。
那么接下来，我们挂载子节点的还是，就可以用这个功能了，如果子节点传递的是字符串，我们就给它转换成文本节点：
```typescript
// renderer.ts
// 挂载子元素
const mountChildren = (children, el) => {
  for (let i = 0; i < children.length; i++) {
    // 进行标准化 vnode
    const child = (children[i] = normalizeVNode(children[i]))
    // 递归挂载子节点
    patch(null, child, el)
  }
}
```
注意，所有挂载子节点的地方都需要这么做，否则将会再更新的时候发生错误：
```typescript
const patchKeyedChildren = (c1, c2, container) => {
  // 省略部分代码...

  while (i <= e1 && i <= e2) {
    const n1 = c1[i]
    // 💡 标准化 childr
    const n2 = (c2[i] = normalizeVNode(c2[i]))

    if (isSameVNodeType(n1, n2)) {
      // 如果 n1 和 n2 是同一个类型的子节点，那就可以更新，更新完了，对比下一个
      patch(n1, n2, container)
    } else {
      break
    }

    i++
  }

  while (i <= e1 && i <= e2) {
    const n1 = c1[e1]
    // 💡 标准化 childr
    const n2 = (c2[e2] = normalizeVNode(c2[e2]))

    if (isSameVNodeType(n1, n2)) {
      // 如果 n1 和 n2 是同一个类型的子节点，那就可以更新，更新完了之后，对比上一个
      patch(n1, n2, container)
    } else {
      break
    }

    // 更新尾指针
    e1--
    e2--
  }

  if (i > e1) {
    /**
     * 根据双端对比，得出结论：
     * i > e1 表示老的少，新的多，要挂载新的，挂载的范围是 i - e2
     */
    // 省略部分代码...
    while (i <= e2) {
      // 💡 标准化 childr
      patch(null, (c2[i] = normalizeVNode(c2[i])), container, anchor)
      i++
    }
  } else if (i > e2) {
    // 省略部分代码...
  } else {
    // 省略部分代码...

    /**
     * 做一份新的子节点的key和index之间的映射关系
     * map = {
     *   c:1,
     *   d:2,
     *   b:3
     * }
     */
    const keyToNewIndexMap = new Map()

    const newIndexToOldIndexMap = new Array(e2 - s2 + 1)
    // -1 代表不需要计算的
    newIndexToOldIndexMap.fill(-1)

    /**
     * 遍历新的 s2 - e2 之间，这些是还没更新的，做一份 key => index map
     */
    for (let j = s2; j <= e2; j++) {
      // 💡 标准化 childr
      const n2 = (c2[j] = normalizeVNode(c2[j]))
      keyToNewIndexMap.set(n2.key, j)
    }

    // 省略后续代码...
  }
}
```
