---
title: 手写 watch
date: 2025-07-13
updated: 2025-07-13
categories: 手写Vue3源码
tags:
  - 手写 watch
top: 1
---

## watch
### 1. 利用 effect 实现watch的基本功能
`watch` 的核心原理是利用 `ReactiveEffect` 来追踪响应式数据的变化，当然此处我们利用到了之前讲过的一个功能 `scheduler` 调度器，
我们会把用户传递的 `source` 转换为一个函数，因为 `effect` 需要依赖一个函数来收集依赖：
```typescript
function watch(source, cb, options) {
  // 1. 创建一个 getter 函数，用于获取监听源的值
  let getter
  if (isRef(source)) {
    getter = () => source.value
  } else if (isReactive(source)) {
    getter = () => source
  } else if (isFunction(source)) {
    getter = source
  }

  // 2. 创建 effect 实例
  const effect = new ReactiveEffect(getter)

  // 3. 设置调度器，当依赖变化时触发回调
  effect.scheduler = job

  // 4. 先执行一次，收集依赖
  effect.run()

  function job() {
    const newValue = effect.run()
    cb(newValue, oldValue)
    oldValue = newValue
  }
}
```
- 根据不同的监听源（`ref`、`reactive` 对象或函数）创建对应的 `getter`
- 使用 `ReactiveEffect` 追踪 getter 的执行
- 当 `getter` 依赖的响应式属性发生变化时，通过 `scheduler` 在依赖变化时执行用户传递的回调

### 2. 如何获取到 oldValue
`oldValue` 的实现我们可以在首次执行 `effect` 收集依赖的时候，拿到它：
```typescript
let oldValue
function job() {
  const newValue = effect.run()
  cb(newValue, oldValue) // 将新旧值传给回调
  oldValue = newValue // 更新 oldValue
}

// 4. 先执行一次，收集依赖
oldValue = effect.run()
```
- 首次运行 `effect.run()` 获取初始值并保存为 `oldValue`
- 每次依赖更新时，通过 `effect.run()` 获取新值
- 在回调中传入新旧值，并更新 `oldValue`

### 3. 停止监听功能
- 返回一个 stop 函数
- stop 函数内部调用 effect.stop() 停止响应式追踪
```typescript
function watch(source, cb, options) {
  const effect = new ReactiveEffect(getter)

  function stop() {
    effect.stop()
  }

  return stop
}
```
- `ReactiveEffect`
之前我们没有实现这个功能，现在补一下
```typescript
class ReactiveEffect {
  // 表示当前是否激活
  active = true
  run() {
    if (!this.active) {
      // 如果未激活，则不收集依赖，直接调用 fn
      return this.fn()
    }
    // 后续依赖追踪的代码已省略
  }
  stop() {
    if (this.active) {
      // 开始追踪，会把 depsTail 设置为 undefined
      startTrack(this)
      // 结束追踪，中间没有收集依赖，所以 depsTail 为 true，deps 有，清理所有依赖，依赖清理完成，就不会再被触发了
      endTrack(this)
      this.active = false
    }
  }
}
```

### 4. immediate 功能实现
```typescript
if (immediate) {
  job() // 立即执行一次
} else {
  // 仅在 immediate = false 的情况下，手动执行 effect.run 收集依赖
  oldValue = effect.run()
}
```
- 如果设置了 immediate，立即执行一次 job 函数
- 否则只运行 effect.run() 获取初始值

### 5. once 功能实现
```typescript
if (once) {
  const _cb = cb
  cb = (...args) => {
    _cb(...args) // 执行原回调
    stop() // 执行完立即停止监听
  }
}
```
- 保存原始回调
- 包装新的回调函数，在执行后立即调用 stop

### 6. deep 功能实现
```typescript
if (deep) {
  // 如果 deep 为 true，则调用 traverse 函数，递归触发 getter
  const baseGetter = getter
  // 此处需要考虑递归的层级问题，如果用户传递了层级，根据用户传递的监听层级进行遍历
  const depth = deep === true ? Infinity : deep
  getter = () => traverse(baseGetter(), depth)
}

function traverse(value, depth = Infinity, seen = new Set()) {
  // 如果不是一个对象，或者监听层级到了，直接返回 value
  if (!isObject(value) || depth <= 0) {
    return value
  }

  // 如果之前访问过，那直接返回，防止循环引用栈溢出
  if (seen.has(value)) {
    return value
  }

  // 层级 -1
  depth--
  // 加到 seen 中
  seen.add(value)

  for (const key in value) {
    // 递归触发 getter
    traverse(value[key], depth, seen)
  }
  return value
}
```
- 通过 traverse 函数递归访问对象的所有属性
- 使用 seen Set 防止循环引用
- 支持设置遍历深度

### 7. onCleanup 功能实现
```typescript
let cleanup = null

function onCleanup(cb) {
  cleanup = cb
}

function job() {
  if (cleanup) {
    cleanup()
    cleanup = null
  }

  const newValue = effect.run()
  cb(newValue, oldValue, onCleanup)
}
```

- 提供 onCleanup 函数给用户注册清理函数
- 在每次触发回调前执行清理函数
- 执行完清理函数后重置 cleanup

