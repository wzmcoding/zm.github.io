---
title: 组件的插槽
date: 2025-09-22
updated: 2025-09-22
categories: 手写Vue3源码之组件篇
tags:
  - 手写Vue3源码之组件篇
top: 1
---

## 组件的插槽
先看使用案例:
```javascript
// 父组件
const Comp = {
  setup() {
    return () => {
      return h('div', [
        h('p', '我是父组件的p标签'),
        h(Child, null, {
          // 具名插槽
          header: () => h('div', '父组件传递的插槽 header'),
          // 默认插槽
          default: () => h('div', '默认插槽'),
          // 作用域插槽
          footer: ({ a }) => h('div', '父组件传递的插槽 footer' + a)
        })
      ])
    }
  }
}

// 子组件
const Child = {
  setup(props, { slots }) {
    return () => {
      return h('div', [
        // 使用具名插槽
        slots.header(),
        // 使用默认插槽
        slots.default(),
        '子组件自己的内容',
        // 使用作用域插槽
        slots.footer({ a: 1 })
      ])
    }
  }
}
```
在这个案例中，我们可以看到，父组件通过 `h` 函数传递了多个插槽给子组件 `Child`，包括具名插槽、默认插槽
和作用域插槽。子组件通过 `slots` 对象来访问这些插槽内容，在这里它们之间都是通过函数的方式进行传递的，
父组件将函数传递给子组件，子组件调用这个函数，所以我们需要知道 **插槽** 的本质就是一个一个的函数，
那么接下来我们来实现一下功能。

## 识别插槽
在之前的实现中，我们只对元素的 `children` 进行了处理，那么如果是组件的话，它的 `children` 就只能是插槽，所以我们需要在 `normalizeChildren` 函数中对插槽进行处理：
`packages/runtime-core/src/vnode.ts`
```javascript
// vnode.ts
function normalizeChildren(vnode, children) {
  let { shapeFlag } = vnode
  // 省略部分代码...
  if (isObject(children)) {
    /**
     * 💡 如果 children 是一个对象，那就有可能是一个插槽
     * children = { header:()=> h('div','hello world') }
     */
    if (shapeFlag & ShapeFlags.COMPONENT) {
      // 💡 如果是个组件，那就是插槽
      shapeFlag |= ShapeFlags.SLOTS_CHILDREN
    }
  } else if (isFunction(children)) {
    /**
     * 💡 如果 children 是一个函数，我们还可以将函数形式的插槽转换为默认插槽，没什么特殊的，
     * 只是单纯的写起来更加方便了，如果只有默认插槽的情况下，在这里我们给它转换成对象的形式
     * h(Child, null, ()=> h('div','hello world'))
     * children = ()=> h('div','hello world')
     */
    if (shapeFlag & ShapeFlags.COMPONENT) {
      // 如果是个组件，那就是插槽
      shapeFlag |= ShapeFlags.SLOTS_CHILDREN
      children = { default: children }
    }
  }
  // 省略部分代码...

  vnode.shapeFlag = shapeFlag
  vnode.children = children
  return children
}
```
在这段代码中，我们对传入的 `children` 进行了判断，如果是一个对象，那就有可能是一个插槽，如果是一个函数，
那就将它转换成默认插槽（只是单纯的写起来更加方便了，如果只有默认插槽的情况下，在这里我们给它转换成对象的形式），
这两种情况只有在 `vnode` 是一个组件的时候才会生效，这样如果 `vnode` 是一个组件的情况下，它的 `children` 就是一个对象，里面保存了插槽，
并且我们给它打了标记 `ShapeFlags.SLOTS_CHILDREN`。

## 初始化插槽
我们在 `component.ts` 中的 `setupComponent` 函数中会调用 `initSlots` 函数来初始化插槽：
`packages/runtime-core/src/component.ts`
```javascript
/**
 * 初始化组件
 */
export function setupComponent(instance) {
  /**
   * 初始化属性
   * 初始化插槽
   * 初始化状态
   */

  // 初始化属性
  initProps(instance)

  // 💡 初始化插槽
  initSlots(instance)

  // 初始化状态
  setupStatefulComponent(instance)
}
```
在 `initSlots` 函数中，我们会将父组件传入的插槽内容保存到子组件实例中：
`packages/runtime-core/src/componentSlots.ts`
```javascript
// componentSlots.ts
export function initSlots(instance) {
  const { slots, vnode } = instance
  if (vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN) {
    // 组件的子元素是
    const { children } = vnode
    /**
     * children = { header:()=> h('div','hello world') }
     * slots = {}
     */
    for (const key in children) {
      slots[key] = children[key]
    }
  }
}
```
这样子组件的实例中，就保存了我们的插槽内容，`slots` 对象的结构如下：
```javascript
slots = {
  header: () => h('div', '父组件传递的插槽 header'),
  default: () => h('div', '默认插槽'),
  footer: ({ a }) => h('div', '父组件传递的插槽 footer' + a)
}
```

## 使用插槽
在子组件的 `setup` 函数中，我们可以通过第二个参数获取到 `slots`，当然我们现在还没有把它送给 `setupContext`，先把 `slots` 给它吧：
```javascript
// component.ts
/**
 * 创建 setupContext
 */
function createSetupContext(instance) {
  return {
    // 省略部分内容...
    // 将插槽传递给 slots
    slots: instance.slots
    // 省略部分内容...
  }
}
```
这样我们就可以拿到 `slots` 了，接下来我们就可以在子组件中使用插槽了：
```javascript
// 子组件
const Child = {
  setup(props, { slots }) {
    return () => {
      return h('div', [
        // 使用具名插槽
        slots.header(),
        // 使用默认插槽
        slots.default(),
        '子组件自己的内容',
        // 使用作用域插槽
        slots.footer({ a: 1 })
      ])
    }
  }
}
```

## 处理插槽更新
插槽在使用的过程中,可能会发生更新，比如父组件传递的插槽内容发生了变化，这时候我们需要更新子组件中的插槽内容。
我们可以在 `componentSlots.ts` 中添加一个 `updateSlots` 函数来处理这个问题：
```javascript
// componentSlots.ts

export function updateSlots(instance, vnode) {
  const { slots } = instance

  if (vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN) {
    // 组件的子元素是插槽

    // 组件的子元素是
    const { children } = vnode
    /**
     * 将最新的全部更新到 slots 中
     * children = { default:()=> h('div','hello world') }
     * slots = { header:()=> h('div','hello world'), footer:()=> h('div','hello world') }
     */
    for (const key in children) {
      slots[key] = children[key]
    }

    /**
     * 把之前 slots 有的，现在没有的，删掉
     * slots = { header:()=> h('div','hello world'), footer:()=> h('div','hello world') }
     * children = { default:()=> h('div','hello world') }
     */
    for (const key in slots) {
      if (children[key] == null) {
        delete slots[key]
      }
    }
  }
}
```
在这里我们处理了两个逻辑：
- 将最新的全部更新到 `slots` 中
- 把之前 `slots` 有的，现在没有的，删掉

这样就完成了更新，那么这个更新的函数在哪儿调用呢，回到我们的 `renderer.ts` 中，找到 `updateComponentPreRender` 函数：
```javascript
// renderer.ts
const updateComponentPreRender = (instance, nextVNode) => {
  /**
   * 更新 props
   * 更新 slots
   */
  // 更新虚拟节点
  instance.vnode = nextVNode
  instance.next = null
  /**
   * 更新组件的属性
   */
  updateProps(instance, nextVNode)

  /**
   * 💡 更新组件的插槽
   */
  updateSlots(instance, nextVNode)
}
```
