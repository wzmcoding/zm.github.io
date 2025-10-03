---
title: Transition 组件实现原理
date: 2025-09-30
updated: 2025-10-03
categories: 手写Vue3源码之组件篇
tags:
  - 手写Vue3源码之组件篇
top: 1
---

## Transition 组件实现原理
Transition 是 Vue3 中的内置组件，用于在元素或组件进入和离开 DOM 时添加过渡动画效果。本文将深入分析 Transition 组件的实现原理。

## 1. 基本概念

Transition 组件主要用于处理以下场景：

- 条件渲染 (v-if/v-show)
- 动态组件切换
- 组件根节点过渡
- 列表过渡 (配合 TransitionGroup)

## 2. 核心实现
### 2.1 组件结构
```javascript
export function Transition(props, { slots }) {
  return h(BaseTransition, resolveTransitionProps(props), slots)
}

const BaseTransition = {
  props: ['enter', 'beforeEnter', 'leave', 'appear'],
  setup(props, { slots }) {
    const vm = getCurrentInstance()
    return () => {
      const vnode = slots.default()
      if (!vnode) return

      // 处理过渡属性
      if (props.appear || vm.isMounted) {
        vnode.transition = props
      } else {
        vnode.transition = {
          leave: props.leave,
        }
      }
      return vnode
    }
  },
}
```
主要特点：

- 基于 BaseTransition 实现
- 支持 enter/leave 过渡
- 可配置首次渲染是否执行过渡 (appear)

### 2.2 过渡类名处理
```javascript
function resolveTransitionProps(props) {
  const {
    name = 'v',
    enterFromClass = `${name}-enter-from`,
    enterActiveClass = `${name}-enter-active`,
    enterToClass = `${name}-enter-to`,
    leaveFromClass = `${name}-leave-from`,
    leaveActiveClass = `${name}-leave-active`,
    leaveToClass = `${name}-leave-to`,
    ...rest
  } = props

  return {
    ...rest,
    beforeEnter(el) {
      el.classList.add(enterFromClass)
      el.classList.add(enterActiveClass)
    },
    enter(el) {
      requestAnimationFrame(() => {
        el.classList.remove(enterFromClass)
        el.classList.add(enterToClass)
      })
    },
    leave(el, remove) {
      el.classList.add(leaveFromClass)
      el.classList.add(leaveActiveClass)
      requestAnimationFrame(() => {
        el.classList.remove(leaveFromClass)
        el.classList.add(leaveToClass)
      })
    },
  }
}
```
过渡类名规则：

1. 进入过渡：

- enter-from：初始状态
- enter-active：过渡期间
- enter-to：结束状态

2. 离开过渡：
- leave-from：初始状态
- leave-active：过渡期间
- leave-to：结束状态

## 2.3 过渡状态管理
过渡的生命周期钩子：
```javascript
{
  beforeEnter(el) {
    // 进入过渡前
    el.classList.add(enterFromClass)
    el.classList.add(enterActiveClass)
    onBeforeEnter?.(el)
  },
  enter(el) {
    // 进入过渡中
    const done = () => {
      el.classList.remove(enterToClass)
      el.classList.remove(enterActiveClass)
    }

    requestAnimationFrame(() => {
      el.classList.remove(enterFromClass)
      el.classList.add(enterToClass)
    })

    // 支持用户自定义过渡结束时机
    onEnter?.(el, done)
    if (!onEnter || onEnter.length < 2) {
      el.addEventListener('transitionend', done)
    }
  },
  leave(el, remove) {
    // 离开过渡
    const done = () => {
      el.classList.remove(leaveActiveClass)
      el.classList.remove(leaveToClass)
      remove()
    }
    // ... 类似 enter 的处理
  }
}
```

## 3. 渲染器集成
在Vue3渲染器中的处理
```javascript
const mountElement = (vnode, container, anchor, parentComponent) => {
  const { transition } = vnode

  // 创建和设置元素...

  if (transition) {
    // 执行进入过渡
    transition.beforeEnter?.(el)
  }

  hostInsert(el, container, anchor)

  if (transition) {
    transition.enter?.(el)
  }
}
```
特点：

- 在元素挂载时自动处理过渡效果
- 支持动态过渡属性
- 与 DOM 操作紧密集成

## 4. 实现优势
1. 性能优化：

- 使用 requestAnimationFrame 确保动画流畅
- 智能地处理 CSS 类名添加/删除时机
- 支持动画结束自动清理

2. 灵活性：
- 支持 CSS 过渡和动画
- 可以与 JavaScript 钩子结合
- 支持自定义过渡类名
- 可以与其他动画库集成

## 5. 使用场景
Transition 组件最适合用于：

1. 模态框显示/隐藏
2. 列表项添加/删除
3. 路由切换动画
4. 组件状态变化反馈

## 总结
Vue3 的 Transition 组件通过精心设计的类名切换机制和生命周期钩子，实现了强大而灵活的过渡动画系统。
它通过与渲染器的紧密集成，在保持简单易用的同时，提供了丰富的自定义能力。这使得开发者可以轻松创建流畅的过渡动画，提升用户体验。
