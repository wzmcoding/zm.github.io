---
title: 手写 computed
date: 2025-07-04
updated: 2025-07-13
categories: 手写Vue3源码
tags:
  - 手写Vue3源码
top: 1
---

### computed 实现原理
#### 1. computed 的双重身份
`computed` 计算属性有一个非常独特的设计 - 它同时具备两个身份：
1. 作为依赖项（Dep）: 可以被其他响应式效果（如effect）订阅
2. 作为订阅者（Sub）: 可以收集自身计算函数中访问的响应式数据
   这种双重身份的设计体现在 `ComputedRefImpl` 类的实现中：
```typescript
class ComputedRefImpl implements Sub, Dependency {
  // 作为 Dependency 的属性
  subs: Link // 订阅者链表头节点
  subsTail: Link // 订阅者链表尾节点

  // 作为 Sub 的属性
  deps: Link // 依赖项链表头节点
  depsTail: Link // 依赖项链表尾节点
}

export function computed(getterOrOptions) {
  let getter, setter

  if (isFunction(getterOrOptions)) {
    // 如果传递了函数，那就是 getter
    getter = getterOrOptions
  } else {
    // 否则就是对象，从对象中获取到 get 和 set
    getter = getterOrOptions.get
    setter = getterOrOptions.set
  }
  // 将 getter 和 setter 传递给 ComputedRefImpl
  return new ComputedRefImpl(getter, setter)
}
```

#### 2. 作为依赖项（Dep）的实现
当其他响应式效果访问计算属性的值时，计算属性需要将这些效果收集为自己的订阅者。这主要体现在 `get value` 中：
```typescript
get value() {
  if (this.dirty) {
    this.update()
  }

  // 如果当前有活跃的订阅者，就建立订阅关系
  if (activeSub) {
    link(this, activeSub)
  }
  return this._value
}
```
这里的 `link` 函数会将当前活跃的订阅者（`activeSub`）与计算属性建立订阅关系，这样当计算属性的值发生变化时，就可以通知这些订阅者进行更新。

#### 3. 作为订阅者（Sub）的实现
计算属性作为订阅者的主要工作发生在 `update` 方法中：
```typescript
update() {
  // 先将当前的 effect 保存起来，用来处理嵌套的逻辑
  const prevSub = activeSub

  // 每次执行 fn 之前，把 this 放到 activeSub 上面
  setActiveSub(this)
  startTrack(this)
  try {
    const oldValue = this._value
    this._value = this.fn()
    // 如果没变，返回false，表示不需要通知更新
    return hasChanged(this._value, oldValue)
  } finally {
    endTrack(this)

    // 执行完成后，恢复之前的 effect    setActiveSub(prevSub)
  }
}
```
这个过程中：
1. startTrack(this) 开始依赖收集
2. 执行计算函数 this.fn()，在这个过程中会自动收集所有访问到的响应式数据
3. endTrack(this) 结束依赖收集

#### 4. 避免不必要的更新
计算属性有一个重要的优化：当计算结果没有变化时，不会触发订阅者的更新。这个优化体现在两个地方：
1. update 方法返回一个布尔值，表示值是否发生变化：
```typescript
update() {
  // ...
  const oldValue = this._value
  this._value = this.fn()
  return hasChanged(this._value, oldValue)
}
```
2. 在触发更新时会判断这个返回值：
```typescript
/**
 * 处理 computed 更新逻辑
 * @param computed
 */
function processComputedUpdate(computed) {
  // 如果 subs 有，并且值变了，通知更新
  if (computed.subs && computed.update()) {
    // 💡 如果 update 返回 true，代表值发生了变化，通知所有 subs 更新
    propagate(computed.subs)
  }
}
/**
 * 传播更新的函数
 * @param subs
 */
export function propagate(subs) {
  let link = subs
  let queuedEffect = []
  while (link) {
    const sub = link.sub
    if (!sub.tracking && !sub.dirty) {
      // 先标记为 脏
      sub.dirty = true
      if ('update' in sub) {
        // 💡 如果是 computed ，交给 processComputedUpdate 处理
        processComputedUpdate(sub)
      } else {
        queuedEffect.push(sub)
      }
    }
    link = link.nextSub
  }

  queuedEffect.forEach((effect) => effect.notify())
}
```
只有当 `update()` 返回 `true`（即值发生变化）时，才会调用 `propagate` 通知订阅者更新。

#### 5. Setter 的实现
计算属性的 setter 实现相对简单：
```typescript
set value(newValue) {
  if (this.setter) {
    this.setter(newValue)
  } else {
    console.warn('我是只读的，你自己别瞎玩')
  }
}
```
创建计算属性时，可以通过两种方式：
```typescript
export function computed(getterOrOptions) {
  let getter, setter

  if (isFunction(getterOrOptions)) {
    getter = getterOrOptions // 只读计算属性
  } else {
    getter = getterOrOptions.get // 可写计算属性
    setter = getterOrOptions.set
  }

  return new ComputedRefImpl(getter, setter)
}
```
如果只传入一个函数，则创建只读计算属性；如果传入一个包含 get 和 set 的对象，则创建可写计算属性。
```typescript
const count = ref(1)
const double = computed(() => count.value * 2)

effect(() => {
  console.log(double.value) // 打印 2
})

setTimeout(() => {
  count.value++ // 一秒钟后 count 变为 2，effect 重新执行打印 4
}, 1000)
```
