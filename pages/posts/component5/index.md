---
title: 组件的属性更新
date: 2025-09-22
updated: 2025-09-22
categories: 手写Vue3源码之组件篇
tags:
  - 手写Vue3源码之组件篇
top: 1
---

## 组件的属性更新
先看案例：
```javascript
const Child = {
  // 接受了父组件传递的 age
  props: ['age'],
  setup(props) {
    return () => {
      return h('div', ['我是子组件', '我的年龄是：', props.age])
    }
  }
}
const Comp = {
  setup(props, { attrs }) {
    const age = ref(0)
    function onClick() {
      // 点击按钮时更新 age
      age.value++
    }
    return () => {
      return h('div', [
        h('button', { onClick }, '增加年龄'),
        // 将 age 传递给子组件
        h(Child, { age: age.value })
      ])
    }
  }
}
```
根据上面的案例我们可以看到，父组件通过 `h(Child, { age: age.value })` 将 `age` 属性传递给子组件 `Child`。
当点击按钮时，`age` 的值会增加，此时 `Comp` 组件会重新渲染，子组件 `Child` 也会接收到新的 `age` 值，
当然我们现在还没有处理它的更新逻辑，接下来我们就来完善这部分的功能：
- `- /packages/runtime-core/src/renderer.ts`
```javascript
const processComponent = (n1, n2, container, anchor) => {
  if (n1 == null) {
    // 挂载

    mountComponent(n2, container, anchor)
  } else {
    // 💡 更新，父组件传递的属性发生变化，会走这边
    updateComponent(n1, n2)
  }
}

/**
 * 组件更新的时候，会调用这个函数
 */
const updateComponent = (n1, n2) => {
  // 复用组件的实例
  const instance = (n2.component = n1.component)
  /**
   * 该更新：props 或者 slots 发生了变化
   * 不该更新：啥都没变
   * 通过 shouldUpdateComponent 来判断
   */
  if (shouldUpdateComponent(n1, n2)) {
    // 该更新：props 或者 slots 发生了变化
    // 绑定新的虚拟节点到 instance 上面，更新的时候会用到
    instance.next = n2
    // 调用 update 方法，更新组件
    instance.update()
  } else {
    /**
     * 不该更新：啥都没变
     * 没有任何属性发生变化，不需要更新，但是需要复用元素，更新虚拟节点
     */
    // 复用元素
    n2.el = n1.el
    // 更新虚拟节点
    instance.vnode = n2
  }
}
```
- `packages/runtime-core/src/componentRenderUtils.ts`
```javascript
function hasPropsChanged(prevProps, nextProps) {
  const nextKeys = Object.keys(nextProps)
  /**
   * prevProps = { msg:'hello', count:0 } 2
   * nextProps = { msg:'hello' } 1
   */
  if (nextKeys.length !== Object.keys(prevProps).length) {
    return true
  }

  /**
   * prevProps = { msg:'hello', count:0 }
   * nextProps = { msg:'hello', count:1 }
   */
  for (const key of nextKeys) {
    if (nextKeys[key] !== prevProps[key]) {
      return true
    }
  }
  /**
   * 遍历完了，全部一致，不需要更新
   */
  return false
}

export function shouldUpdateComponent(n1, n2) {
  const { props: prevProps, children: prevChildren } = n1
  const { props: nextProps, children: nextChildren } = n2

  /**
   * 任意一个有插槽，就需要更新
   */
  if (prevChildren || nextChildren) {
    return true
  }

  if (!prevProps) {
    // 老的没有，新的有，需要更新
    // 老的没有，新的也没有，不需要更新
    return !!nextProps
  }

  if (!nextProps) {
    // 老的有，新的没有，需要更新
    return true
  }

  /**
   * 老的有，新的也有
   */
  return hasPropsChanged(prevProps, nextProps)
}
```

接下来我们回到 `renderer.ts` 中， 当我们调用 `instance.update` 时，会进入到 `componentUpdateFn` 这个函数中：
```javascript
const componentUpdateFn = () => {
  /**
   * 区分挂载和更新
   */
  if (!instance.isMounted) {
    // 省略挂载的逻辑...
  } else {
    let { vnode, render, next } = instance

    if (next) {
      // 💡 父组件传递的属性触发的更新，会走这里，调用 updateComponentPreRender，这个函数会更新 props 和 slots
      updateComponentPreRender(instance, next)
    } else {
      // 自身属性触发的更新，会走这边
      next = vnode
    }

    const prevSubTree = instance.subTree
    // 调用 render 拿到 subTree，this 指向 setupState
    const subTree = render.call(instance.proxy)
    // 将 subTree 挂载到页面
    patch(prevSubTree, subTree, container, anchor)
    // 组件的 vnode 的 el，会指向 subTree 的 el，它们是相同的
    next.el = subTree.el
    // 保存这一次的 subTree
    instance.subTree = subTree
  }
}
```
来看一下 `updateComponentPreRender` 这个函数：
```javascript
const updateComponentPreRender = (instance, nextVNode) => {
  /**
   * 更新 props
   * 更新 slots
   */
  // 更新虚拟节点
  instance.vnode = nextVNode
  // 移除 next 属性
  instance.next = null
  /**
   * 更新组件的属性
   */
  updateProps(instance, nextVNode)
}
```
- `packages/runtime-core/src/componentProps.ts`
`updateProps` 函数会更新组件的 props 和 attrs：
```javascript
/**
 * 更新组件的属性
 */
export function updateProps(instance, nextVNode) {
  const { props, attrs } = instance
  /**
   * props = {msg:'hello',age:0}
   * rawProps = {age:0}
   */
  const rawProps = nextVNode.props

  /**
   * 设置所有的
   */
  setFullProps(instance, rawProps, props, attrs)

  /**
   * props = {msg:'hello',age:0}
   * rawProps = {age:0}
   * 删除之前有，现在没有的
   */
  for (const key in props) {
    if (!hasOwn(rawProps, key)) {
      delete props[key]
    }
  }

  /**
   * props = {msg:'hello',age:0}
   * rawProps = {age:0}
   * 删除之前有，现在没有的
   */
  for (const key in attrs) {
    if (!hasOwn(rawProps, key)) {
      delete attrs[key]
    }
  }
}
```
`props` 和 `attrs` 更新完成后，会重新调用 `render` 函数，拿到最新的 `subTree`，最后将 `subTree` 挂载到页面上，至此我们完成了组件的更新逻辑。
