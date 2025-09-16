---
title: createApp
date: 2025-09-16
updated: 2025-09-16
categories: 手写Vue3源码
tags:
  - createApp
top: 1
---

# createApp
平时如何使用：
```typescript
import { h, ref, createApp } from '../dist/vue.esm.js'
// 创建一个组件
const Comp = {
  render() {
    return h('div', 'hello world')
  }
}
// 创建一个应用实例
const app = createApp(Comp)
// 将组件挂载到 id 为 app 的 DOM 元素上
app.mount('#app')
```

- `createApp` 是Vue应用初始化的关键入口,主要作用就是将一个组件挂载到一个DOM节点上，类似之前用的`render`函数
- `render`函数的主要作用就是将一个**虚拟节点**渲染到某个容器中
- 那我们可以直接将这个组件转换成虚拟节点，然后调用`render`函数就可以了

## 核心实现
其实`createAPP`这个函数是由`createRenderer`函数返回的
```javascript
function createRenderer(options) {
  const render = (vnode, container) => {

  }

  return {
    render,
    // 💡 在这里，我们返回了一个 createApp 函数
    createApp: createAppAPI(render)
  }
}
```
在 `createRenderer` 函数中，我们返回了一个 `createApp` 函数，当然这个函数是由 `createAppAPI` 创建出来的，接下来我们来完成 `createAppAPI` 函数的实现。

1. createAppAPI的实现
在 `packages/runtime-core/src/apiCreateApp.ts` 中，我们创建一个 `createAppAPI` 函数，这是整个 createApp 功能的核心实现：
```javascript
export function createAppAPI(render) {
  // 返回一个 createApp 函数
  return function createApp(rootComponent, rootProps) {
    // 创建一个 应用实例
    const app = {
      _container: null,
      mount(container) {
        // mount 方法会接受一个 container，是一个 DOM 元素，也必须是一个 DOM 元素
        // 💡 在 mount 方法中，我们使用 h 函数将组件转换成虚拟节点
        const vnode = h(rootComponent, rootProps)
        // 💡 调用 render 函数将虚拟节点渲染到容器中
        render(vnode, container)
        // 💡 将容器保存到应用实例中
        app._container = container
      },
      unmount() {
        // 卸载组件，卸载就是将虚拟节点渲染成 null
        render(null, app._container)
      }
    }
    return app
  }
}
```
`createApp`函数返回一个应用实例，这个实例有两个方法：`mount`和`unmount`，
`mount`方法会接受一个DOM元素，也就是我们要挂载的容器，在 `mount` 方法中，
我们使用 `h` 函数将组件转换成虚拟节点，然后调用 `render` 函数将虚拟节点渲染到容器中，最后将容器保存到应用实例中。

2. 支持选择器字符串
虽然实现了基本功能，但使用 `mount` 方法时，必须传一个DOM元素，如果传了选择器字符串就会报错，需要对 `mount` 方法进行扩展。
因为我们在 `runtime-core` 中是不能操作 DOM 元素的，我们只能借助于 `runtime-dom` 来实现这个功能。
在 `packages/runtime-dom/src/index.ts` 中，实现面向用户的 `createApp API`：
```javascript
// packages/runtime-dom/src/index.ts

import { nodeOps } from './nodeOps'
import { patchProp } from './patchProp'
import { createRenderer } from '@vue/runtime-core'
import { isString } from '@vue/shared'

export * from '@vue/runtime-core'

const renderOptions = { patchProp, ...nodeOps }

const renderer = createRenderer(renderOptions)

// 💡 创建一个 createApp 函数，内部调用 renderer.createApp
export function createApp(rootComponent, rootProps) {
  // 💡 先创建一个应用实例
  const app = renderer.createApp(rootComponent, rootProps)
  // 保存原始的 mount 方法
  const _mount = app.mount.bind(app)

  // 💡 重写 mount 方法
  function mount(selector) {
    // 默认传入的 selector 是一个 DOM 元素
    let el = selector
    if (isString(selector)) {
      // 💡 如果传入的是字符串，则使用 querySelector 获取 DOM 元素
      el = document.querySelector(selector)
    }
    _mount(el)
  }
  // 💡 将重写的 mount 方法赋值给应用实例
  app.mount = mount

  return app
}

// 省略部分代码...
```

## 总结
至此我们就完成了 `createApp` 的核心功能的实现，实际上 `createApp` 只是一个简单的函数，它的主要作用就是将一个组件挂载到一个 DOM 节点上，
这个过程其实就是将组件转换成虚拟节点，然后调用 `render` 函数将虚拟节点渲染到容器中，
这个过程其实就是我们之前一直在用的 `render` 函数的核心功能，只不过我们在这里做了一些封装而已。
