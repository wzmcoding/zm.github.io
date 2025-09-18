---
title: 组件的代理对象
date: 2025-09-18
updated: 2025-09-18
categories: 手写Vue3源码之组件篇
tags:
  - 手写Vue3源码之组件篇
top: 1
---

## 组件的代理对象
我们在组件中使用 `this` 可以访问到 `setupState、props、attrs、slots、$refs` 等属性，这些属性都是通过代理对象实现的。
组件的代理对象实现：
```javascript
/**
 * 初始化组件
 */
export function setupComponent(instance) {
  /**
   * 初始化属性
   */

  initProps(instance)

  setupStatefulComponent(instance)
}

const publicPropertiesMap = {
  $attrs: (instance) => instance.attrs,
  $slots: (instance) => instance.slots,
  $refs: (instance) => instance.refs,
  $nextTick: (instance) => {
    // TODO nextTick
  }
}

const publicInstanceProxyHandlers = {
  get(target, key) {
    const { _: instance } = target

    const { setupState, props } = instance

    /**
     * 如果访问了某个属性，我先去 setupState 里面找
     * 如果没有，我再去 props 里面找
     */

    // 去 setupState 里面找
    if (hasOwn(setupState, key)) {
      return setupState[key]
    }

    // 去 props 里面找
    if (hasOwn(props, key)) {
      return props[key]
    }

    /**
     * $attrs
     * $slots
     * $refs
     */
    if (hasOwn(publicPropertiesMap, key)) {
      const publicGetter = publicPropertiesMap[key]
      return publicGetter(instance)
    }

    /**
     * 如果实在找不到，只能掀被窝了
     */
    return instance[key]
  },
  set(target, key, value) {
    const { _: instance } = target
    const { setupState } = instance

    if (hasOwn(setupState, key)) {
      /**
       * 修改 setupState
       */
      setupState[key] = value
    }

    return true
  }
}

function setupStatefulComponent(instance) {
  const { type } = instance

  /**
   * 创建代理对象，内部访问 setupState props $attrs $slots 这些
   */
  instance.proxy = new Proxy(instance.ctx, publicInstanceProxyHandlers)

  if (isFunction(type.setup)) {
    const setupContext = createSetupContext(instance)
    // 保存 setupContext
    instance.setupContext = setupContext
    const setupResult = type.setup(instance.props, setupContext)

    handleSetupResult(instance, setupResult)
  }

  if (!instance.render) {
    // 如果上面处理完了，instance 还是 没有 render，那就取组件的配置里面拿
    instance.render = type.render
  }
}

function handleSetupResult(instance, setupResult) {
  if (isFunction(setupResult)) {
    // 如果 setup 返回了函数，就认定为是 render
    instance.render = setupResult
  } else if (isObject(setupResult)) {
    // 如果返回了对象，就是状态
    instance.setupState = proxyRefs(setupResult)
  }
}

/**
 * 创建 setupContext
 */
function createSetupContext(instance) {
  return {
    get attrs() {
      return instance.attrs
    }
  }
}
```
顺便更新一下 `computedUpdateFn`
```javascript
const componentUpdateFn = () => {
  /**
   * 区分挂载和更新
   */
  if (!instance.isMounted) {
    const { vnode, render } = instance
    // 调用 render 拿到 subTree，this 指向 组件的代理对象
    const subTree = render.call(instance.proxy)
    // 将 subTree 挂载到页面
    patch(null, subTree, container, anchor)
    // 组件的 vnode 的 el，会指向 subTree 的 el，它们是相同的
    vnode.el = subTree.el
    // 保存子树
    instance.subTree = subTree
    // 挂载完了
    instance.isMounted = true
  } else {
    let { vnode, render, next } = instance

    if (next) {
      // 父组件传递的属性触发的更新，会走这里
      updateComponentPreRender(instance, next)
    } else {
      // 自身属性触发的更新，会走这边
      next = vnode
    }

    const prevSubTree = instance.subTree
    // 调用 render 拿到 subTree，this 指向 组件的代理对象
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
