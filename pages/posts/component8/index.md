---
title: 获取组件的实例
date: 2025-09-23
updated: 2025-09-23
categories: 手写Vue3源码之组件篇
tags:
  - 手写Vue3源码之组件篇
top: 1
---

## 获取组件的实例
我们在组件中，一般会通过 `getCurrentInstance` 来获取当前组件的实例，这个 API 主要是为了在 `setup` 函数中获取当前组件的实例。
```javascript
const Comp = {
  setup() {
    // 通过 getCurrentInstance 获取到当前组件的实例
    const vm = getCurrentInstance()
    console.log('vm ==> ', vm)
    return () => {
      return h('div', [h('p', '我是父组件的p标签')])
    }
  }
}
```
这个 `vm` 就是我们使用 `createComponentInstance` 创建出来的那个实例，我们来看实现一下它的功能。
首先我们要明确一点，`getCurrentInstance` 只能在 `setup` 函数或者生命周期函数中使用。
`/packages/runtime-core/src/component.ts`
```javascript
/**
 * 当前组件的实例
 */
let currentInstance = null

/**
 * 设置当前组件的实例
 */
export function setCurrentInstance(instance) {
  currentInstance = instance
}

/**
 * 获取当前的组件实例
 */
export function getCurrentInstance() {
  return currentInstance
}

/**
 * 清除当前组件的实例
 */
export function unsetCurrentInstance() {
  currentInstance = null
}

function setupStatefulComponent(instance) {
  const { type } = instance
  // 省略部分逻辑...
  if (isFunction(type.setup)) {
    setCurrentInstance(instance)
    // 执行 setup 函数
    const setupResult = type.setup(instance.props, setupContext)

    /**
     * 清除当前组件的实例
     */
    unsetCurrentInstance()
  }
  // 省略部分逻辑...
}
```
完事儿了，这个 API 比较简单，有点类似于我们响应式系统中的 `activeSub`，
我们只需要在调用 `setup` 之前设置一下当前组件的实例，然后在 `setup` 执行完成后清除掉就可以了。
