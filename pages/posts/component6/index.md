---
title: 绑定组件的事件
date: 2025-09-22
updated: 2025-09-22
categories: 手写Vue3源码之组件篇
tags:
  - 手写Vue3源码之组件篇
top: 1
---

## 绑定组件的事件
先看下平时使用的事件绑定方式：
```javascript
const Child = {
  setup(props, { emit }) {
    return () => {
      return h(
        'button',
        {
          onClick() {
            // 💡 触发父组件传递的事件
            emit('foo', 1, 2, 3)
          }
        },
        '我是子组件的按钮'
      )
    }
  }
}
const Comp = {
  setup() {
    return () => {
      return h('div', [
        h(Child, {
          // 💡 传递事件
          onFoo(a, b, c) {
            console.log('我是父组件传递的事件', a, b, c)
          }
        })
      ])
    }
  }
}
```
这种情况下，我们需要在 `Child`，组件中触发 `Comp` 组件传递的事件，此时我们应该怎么做？我们想想一下，
在 `Comp` 组件中，我们是通过 `h(Child, { onFoo: () => {} })` 的方式传递事件的，那么在 `Child` 组件
中，我们应该怎么获取到这个事件呢？首先我们能确定的是，这个 `onFoo` 在 `Child` 这个组件对应的
`vnode.props` 中肯定是存在的，所以我们只需要通过 `vnode.props.onFoo` 的方式就可以获取到这个事件了：
```javascript
/**
 * 处理组件传递的事件
 */
function emit(instance, event, ...args) {
  /**
   * 把这个事件名转换一下
   * foo => onFoo
   * bar => onBar
   */
  const eventName = `on${event[0].toUpperCase() + event.slice(1)}`
  // 拿到事件处理函数
  const handler = instance.vnode.props[eventName]
  // 如果是一个函数，就调用它
  if (isFunction(handler)) {
    handler(...args)
  }
}
```
没错，就是这么简单，我们只需要在 `emit` 函数中将事件名转换一下，然后通过 `instance.vnode.props` 获取
到事件处理函数，最后调用它就可以了。这样我们就实现了组件之间的事件传递，最后我们在 `setupContext` 中
设置一下 `emit`:
```javascript
/**
 * 创建 setupContext
 */
function createSetupContext(instance) {
  return {
    // setup(props,{ attrs })
    get attrs() {
      return instance.attrs
    },
    // setup(props,{ emit })
    emit(event, ...args) {
      emit(instance, event, ...args)
    }
  }
}
```
