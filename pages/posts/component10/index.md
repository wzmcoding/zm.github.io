---
title: ref 和 expose
date: 2025-09-25
updated: 2025-09-26
categories: 手写Vue3源码之组件篇
tags:
  - 手写Vue3源码之组件篇
top: 1
---

## ref 和 expose
- expose
我们先来实现一下 `expose`，之前我们完成了 `attrs`、`emit` 和 `slots`，所以我们直接在原来的 `createSetupContext` 代码里面加就行了
```javascript
/**
 * 创建 setupContext
 */
function createSetupContext(instance) {
  return {
    // attrs、emit、slots...
    // 暴漏属性
    expose(exposed) {
      // 💡 这里添加一个 expose
      // 把用户传递的对象，保存到当前实例上
      instance.exposed = exposed
    },
  }
}
```
这样其实 `expose` 也没做什么，就是把你要暴漏的属性，放到 `instance.exposed` 上面去了，也就是说
```javascript
const obj = { a: 1, b: 2 }
expose(obj)
// 等同于
instance.exposed = obj
```


- ref
那么我们先把 `ref` 绑定到 `vnode` 上面去，在 `createVNode` 里面操作一下
`packages/runtime-core/src/vnode.ts`
```javascript

/**
 * 创建虚拟节点的底层方法
 * @param type 节点类型
 * @param props 节点的属性
 * @param children 子节点
 */
export function createVNode(type, props?, children = null) {
  // 省略部分代码...

  const vnode = {
    // 省略其他属性...
    ref: props.ref,
  }

  return vnode
}
```
但是这样不太好操作，所以我们换个思路，我让 `vnode.ref `里面既保存用户传递的 `ref`，又保存当前组件的实例

`packages/runtime-core/src/vnode.ts`
```javascript


/**
 * 创建虚拟节点的底层方法
 * @param type 节点类型
 * @param props 节点的属性
 * @param children 子节点
 */
export function createVNode(type, props?, children = null) {
  // 省略部分代码...

  const vnode = {
    // 省略其他属性...
    ref: normalizeRef(props.ref),
  }

  return vnode
}

// 标准化一下 ref
function normalizeRef(ref) {
  if (ref == null) return
  return {
    // 原始的 ref
    r: ref,
    // 当前正在渲染的组件实例
    i: getCurrentRenderingInstance(), // 这个函数是获取当前正在渲染的组件实例
  }
}
```
来看一下 `getCurrentRenderingInstance`，他的功能是获取当前正在调用 `render` 函数的组件实例，因为虚拟节点是在 `render` 函数里面创建的，
思路和 `getCurrentInstance` 差不多，我们在调用 `render` 之前设置当前的，调用完成后设置为 `null` 就可以

`packages/runtime-core/src/component.ts`
```javascript
/**
 * 当前正在渲染的组件实例
 */
let currentRenderingInstance = null

/**
 * 设置当前正在渲染的组件实例
 * @param instance
 */
export function setCurrentRenderingInstance(instance) {
  currentRenderingInstance = instance
}

/**
 * 清除当前正在渲染的组件实例
 */
export function unsetCurrentRenderingInstance() {
  currentRenderingInstance = null
}

/**
 * 获取当前正在渲染的组件实例
 */
export function getCurrentRenderingInstance() {
  return currentRenderingInstance
}
```
这样等到 `vnode` 挂载完成后，我们来设置一下 `ref`
```javascript
 const patch = (n1, n2, container, anchor = null) => {

    // 省略部分代码...
    const { shapeFlag, type, ref } = n2

    if (ref != null) {
      // 如果有 ref 我们来调用 setRef 操作，将 ref 和 n2 传递过去
      setRef(ref, n2)
    }
  }
```
这样等到 `vnode` 挂载完成后，我们来设置一下 `ref`
```javascript
 const patch = (n1, n2, container, anchor = null) => {

    // 省略部分代码...
    const { shapeFlag, type, ref } = n2

    if (ref != null) {
      // 如果有 ref 我们来调用 setRef 操作，将 ref 和 n2 传递过去
      setRef(ref, n2)
    }
  }
```
来看一下 `setRef` 的一个实现，在 `setRef` 里面如果 `vnode` 是一个组件类型，我们需要将组件的 `exposed` 暴漏出去，
那么我们这里写了一个辅助函数，`getComponentPublicInstance` 来处理这个逻辑
```javascript

export function setRef(ref, vnode) {
  const { r: rawRef, i: instance } = ref
  if (vnode == null) {
    // 卸载了，要清除
    if (isRef(rawRef)) {
      // 如果是 ref，就给它设置成 null
      rawRef.value = null
    } else if (isString(rawRef)) {
      // 字符串 修改 refs[key] = null
      instance.refs[rawRef] = null
    }

    return
  }

  const { shapeFlag } = vnode
  if (isRef(rawRef)) {
    // 如果 ref 是一个 响应式的 Ref

    if (shapeFlag & ShapeFlags.COMPONENT) {
      // vnode 是一个组件类型
      rawRef.value = getComponentPublicInstance(vnode.component)
    } else {
      // vnode 是一个 DOM 元素类型
      rawRef.value = vnode.el
    }
  } else if (isString(rawRef)) {
    // 把 vnode.el 绑定到 instance.$refs[ref] 上面
    if (shapeFlag & ShapeFlags.COMPONENT) {
      // 组件
      instance.refs[rawRef] = getComponentPublicInstance(vnode.component)
    } else {
      // DOM 元素
      instance.refs[rawRef] = vnode.el
    }
  }
}
```
实现 `getComponentPublicInstance`
```javascript
/**
 * 获取到组件公开的属性
 * @param instance
 */
export function getComponentPublicInstance(instance) {
  if (instance.exposed) {
    /**
     * 用户可以访问 exposed 和 publicPropertiesMap
     */
    // 如果有 exposedProxy 就直接返回
    if (instance.exposedProxy) return instance.exposedProxy

    // 创建一个代理对象
    instance.exposedProxy = new Proxy(proxyRefs(instance.exposed), {
      get(target, key) {
        if (key in target) {
          // 用户访问了 exposed 中的属性
          return target[key]
        }

        if (key in publicPropertiesMap) {
          // $el $props $attrs
          return publicPropertiesMap[key](instance)
        }
      },
    })

    return instance.exposedProxy
  } else {
    // 如果没有手动暴漏，返回 proxy
    return instance.proxy
  }
}
```
这个函数就是要获取到这个组件最终暴漏了那些属性，比如如果有 `exposed` 就创建一个代理对象，如果用户访问了 `exposed` 中的属性，就从 `exposed` 中拿，
如果不是，则到 `publicPropertiesMap` 中去获取，如果没有传递 `exposed` 就直接返回 `instance.proxy`
