---
title: PatchFlags
date: 2025-10-05
updated: 2025-10-05
categories: 手写Vue3源码之组件篇
tags:
  - 手写Vue3源码之组件篇
top: 1
---

## PatchFlags
什么是 PatchFlags？
PatchFlags 是 Vue 3 中用于优化虚拟 DOM 更新的一种机制。
它们是编译器在编译模板时生成的标志，用于指示哪些部分的虚拟 DOM 需要更新，从而减少不必要的 DOM 操作，提高性能。
