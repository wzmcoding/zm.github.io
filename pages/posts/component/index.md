---
title: 组件挂载
date: 2025-09-17
updated: 2025-09-17
categories: 手写Vue3源码之组件篇
tags:
  - 手写Vue3源码之组件篇
top: 1
---

# 组件挂载
使用方式:
```javascript
import { h, ref, createApp } from '../dist/vue.esm.js'
const Comp = {
  render() {
    return h('div', 'hello world')
  }
}
createApp(Comp).mount('#app')
```
我们需要先处理一下 `createVNode` 中的组件类型
```javascript
// vnode.ts

export function createVNode(type, props?, children = null) {
  let shapeFlag = 0

  if (isString(type)) {
    // div span p h1
    shapeFlag = ShapeFlags.ELEMENT
  } else if (isObject(type)) {
    // type 是 一个对象，表示是一个组件
    // 💡 有状态的组件
    shapeFlag = ShapeFlags.STATEFUL_COMPONENT
  }
  const vnode = {

  }

  return vnode
}
```
组件和元素、文本一样，都存在两种情况，挂载和更新：
```javascript
const patch = (n1, n2, container, anchor = null) => {
  const { shapeFlag, type } = n2

  switch (type) {
    case Text:
      processText(n1, n2, container, anchor)
      break
    default:
      if (shapeFlag & ShapeFlags.ELEMENT) {
        // 处理 dom 元素 div span p h1
        processElement(n1, n2, container, anchor)
      } else if (shapeFlag & ShapeFlags.COMPONENT) {
        // 💡 处理组件的逻辑
        processComponent(n1, n2, container, anchor)
      }
  }
}
```
创建一个 `processComponent` 函数来处理组件的挂载和更新：
- processComponent
```javascript
/**
 * 处理组件的挂载和更新
 */
const processComponent = (n1, n2, container, anchor) => {
  if (n1 == null) {
    // 挂载
    // 💡 在这里，我们创建一个 mountComponent 函数，来完成挂载
    mountComponent(n2, container, anchor)
  } else {
    // 更新
  }
}
```
- mountComponent
```javascript
const mountComponent = (vnode, container, anchor) => {
  const { type } = vnode
  /**
   * 1. 创建组件实例
   * 2. 初始化组件的状态
   * 3. 将组件挂载到页面中
   */
  // 创建组件实例
  const instance = {
    // 组件类型
    type: vnode.type,
    // 组件的虚拟节点
    vnode,
    // 组件的 props
    props: {},
    // 组件的 attrs
    attrs: {},
    // 组件是否挂载
    isMounted: false,
    // 组件的子树，就是 render 函数的返回值
    subTree: null
  }

  const componentUpdateFn = () => {
    /**
     * 区分挂载和更新
     */
    if (!instance.isMounted) {
      // 调用 render 拿到 subTree
      const subTree = type.render()
      // 将 subTree 挂载到页面
      patch(null, subTree, container, anchor)
      // 保存子树
      instance.subTree = subTree
      // 挂载完了
      instance.isMounted = true
    } else {
      // 响应式数据变化产生的更新逻辑
      const prevSubTree = instance.subTree
      // 调用 render 拿到 subTree，this 指向 setupState
      const subTree = type.render()
      // 将 subTree 挂载到页面
      patch(prevSubTree, subTree, container, anchor)
      // 保存这一次的 subTree
      instance.subTree = subTree
    }
  }

  // 创建 effect
  const effect = new ReactiveEffect(componentUpdateFn)
  effect.run()
}
```
这样就可以成功挂载了，这里用到了 `ReactiveEffect`，因为我们需要在数据变化时，重新执行 `componentUpdateFn` 函数。
这样写下去比较乱，我们拆分一下逻辑，将创建组件实例的逻辑拆分出来，还有初始化状态，我们需要执行 `setup` 函数，拿到它返回的状态
`packages/runtime-core/src/component.ts`
```javascript
// component.ts
/**
 * 创建组件实例
 */
export function createComponentInstance(vnode) {
  const { type } = vnode
  const instance = {
    type,
    vnode,
    // 渲染函数
    render: null,
    // setup 返回的状态
    setupState: null,
    props: {},
    attrs: {},
    // 子树，就是 render 的返回值
    subTree: null,
    // 是否已经挂载
    isMounted: false
  }

  return instance
}

/**
 * 初始化组件
 */
export function setupComponent(instance) {
  const { type } = instance
  // 使用 proxyRefs 处理 setup 返回值，就不需要 .value 了
  const setupResult = proxyRefs(type.setup())
  // 拿到 setup 返回的状态
  instance.setupState = setupResult
  // 将 render 函数，绑定给 instance
  instance.render = type.render
}
```
来看一下修改后的 `mountComponent` 函数：
```javascript
const mountComponent = (vnode, container, anchor) => {
  /**
   * 1. 创建组件实例
   * 2. 初始化组件的状态
   * 3. 将组件挂载到页面中
   */
  // 创建组件实例
  const instance = createComponentInstance(vnode)

  // 初始化组件的状态
  setupComponent(instance)

  const componentUpdateFn = () => {
    /**
     * 区分挂载和更新
     */
    if (!instance.isMounted) {
      // 调用 render 拿到 subTree，this 指向 setupState
      const subTree = instance.render.call(instance.setupState)
      // 将 subTree 挂载到页面
      patch(null, subTree, container, anchor)
      // 保存子树
      instance.subTree = subTree
      // 挂载完了
      instance.isMounted = true
    } else {
      // 响应式数据变化产生的更新逻辑
      const prevSubTree = instance.subTree
      // 调用 render 拿到 subTree，this 指向 setupState
      const subTree = instance.render.call(instance.setupState)
      // 将 subTree 挂载到页面
      patch(prevSubTree, subTree, container, anchor)
      // 保存这一次的 subTree
      instance.subTree = subTree
    }
  }

  // 创建 effect
  const effect = new ReactiveEffect(componentUpdateFn)
  effect.run()
}
```
这样就完成了组件的挂载逻辑，当数据变化的时候，也会触发更新逻辑。注意这个更新和我们 `processComponent` 中的更新是不同的，
这里是组件的更新，而 `processComponent` 中的是组件的挂载和父组件传递的属性变化导致的更新。
