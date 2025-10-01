---
title: Transition 组件实现原理
date: 2025-09-30
updated: 2025-09-30
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





