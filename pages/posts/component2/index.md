---
title: 属性传递（props和attrs）
date: 2025-09-18
updated: 2025-09-18
categories: 手写Vue3源码之组件篇
tags:
  - 手写Vue3源码之组件篇
top: 1
---

# 属性传递（props和attrs）
props和attrs的区别：是否在组件中声明属性，声明了就是props，没有声明就是attrs
```javascript
const Comp = {
  // 用户声明的属性
  props: {
    msg: String
  },
  render() {
    return h('div', 'hello world')
  }
}

createApp(Comp, { msg: 'hello world', count: 0 }).mount('#app')
```
在上面的代码中，用户声明了 msg 属性，count 属性是用户没有声明的属性，所以具体的 props 和 attrs 分别是
- props: `{ msg: 'hello world' }`
- attrs: `{ count: 0 }`

## 处理 props 和 attrs 的传递
先处理 props
```javascript
/**
 * 创建组件实例
 */
export function createComponentInstance(vnode) {
  const { type } = vnode
  const instance = {
    // 省略部分代码...
    // 将 props 进行标准化，不管是数组还是对象都转化为对象
    propsOptions: normalizePropsOptions(type.props)
  }

  return instance
}
```
`packages/runtime-core/src/componentProps.ts`
新建文件处理 `props`
```javascript
// componentProps.ts
export function normalizePropsOptions(props = {}) {
  /**
   * 要把数组转换成对象
   */

  if (isArray(props)) {
    /**
     * 把数组转换成对象
     * ['msg','count']
     * =>
     * { msg:true, count:true }
     */
    return props.reduce((prev, cur) => {
      prev[cur] = {}

      return prev
    }, {})
  }

  return props
}

/**
 * 设置所有的 props 和 attrs
 */
function setFullProps(instance, rawProps, props, attrs) {
  // 拿到 propsOptions
  const propsOptions = instance.propsOptions
  if (rawProps) {
    // 如果用户传递了 props
    for (const key in rawProps) {
      const value = rawProps[key]
      if (hasOwn(propsOptions, key)) {
        // 如果 propsOptions 里面有这个 key，应该放到 props 里面
        props[key] = value
      } else {
        // 否则就是 attrs 里面的
        attrs[key] = value
      }
    }
  }
}

export function initProps(instance) {
  // 初始化 props
  const { vnode } = instance
  // 拿到用户使用组件时传递的 props
  const rawProps = vnode.props

  const props = {}
  const attrs = {}
  setFullProps(instance, rawProps, props, attrs)
  // props 是响应式的，所以需要 reactive
  instance.props = reactive(props)
  // attrs 不是响应式的
  instance.attrs = attrs
}
```
在 `component.ts` 中的 `setupComponent` 函数中初始化 `props`
```javascript
/**
 * 初始化组件
 */
export function setupComponent(instance) {
  /**
   * 初始化属性
   */
  const { type } = instance
  // 💡 初始化 props
  initProps(instance)

  if (isFunction(type.setup)) {
    const setupResult = proxyRefs(type.setup(instance.props))
    // 拿到 setup 返回的状态
    instance.setupState = setupResult
  }

  // 将 render 函数，绑定给 instance
  instance.render = type.render
}
```
至此，`props` 和 `attrs` 的传递就完成了。
