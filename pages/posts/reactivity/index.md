---
title: 响应式
date: 2025-06-15
updated: 2025-06-17
categories: 手写Vue3源码
tags:
  - 手写Vue3源码
top: 1
---

# 响应式 —— Reactivity
Vue 的响应式系统核心在于响应式对象的属性与 effect 副作用函数之间建立的依赖关系。让我们通过具体示例来理解这个概念：
- 普通函数访问响应式数据

```typescript
import { ref } from 'vue'

const count = ref(0)

// 普通函数
function fn() {
    console.log(count.value)
}

fn() // 打印 0

setTimeout(() => {
    count.value = 1 // 修改值不会触发 fn 重新执行
}, 1000)

```
在这个例子中，虽然 fn 读取了响应式数据 count.value，但由于它不是在 effect 中执行的，因此当 count.value 发生变化时，该函数不会重新执行。
- effect 中访问响应式数据
```typescript
import { ref, effect } from 'vue'

const count = ref(0)

effect(() => {
    console.log(count.value) // 首次执行打印 0
})

setTimeout(() => {
    count.value = 1 // 触发 effect 重新执行，打印 1
}, 1000)

```
我们平时使用的 computed、watch、watchEffect 包括组件的 render 都是依赖于 effect 函数来收集依赖的
当在 effect 中访问响应式数据时，会发生以下过程：
- 依赖收集：当 effect 中的函数首次执行时，访问 count.value 会触发 ref 的 get，此时系统会自动收集当前 effect 作为依赖。
- 触发更新：当 count.value 被修改时，会触发 ref 的 set，系统会通知之前收集的所有依赖（effect）重新执行。
  这就是为什么在第二个例子中，修改 count.value 会导致 effect 重新执行并打印新值。这种自动追踪依赖和触发更新的机制，正是 Vue 响应式系统的核心特征。

#### 响应式最基础的实现 - ref
那此时我们可以知道，当我们访问某个值的时候，就是我们要知道，谁使用了这个值（也就是某个函数访问了这个值），当我们更新这个数据的时候，
我们需要重新去执行这个函数，也就是之前使用了这个值的函数，我需要让它重新执行，此时这个函数重新执行，就可以获取到最新的值

#### 响应式数据 (Ref)
响应式 `Ref` 是一个包装器对象，它可以让我们追踪简单值的变化。
- get：当我们读取 .value 的时候，触发 get 此时在 get 中会收集依赖，也就是建立响应式数据和 effect 之间的关联关系
- set：当我们重新给 .value 赋值的时候，触发 set，此时在 set 中会找到之前 get 的时候收集的依赖，触发更新
- ref.ts
```typescript
import { activeSub } from './effect'

enum ReactiveFlags {
  // 属性标记，用于表示对象是不是一个ref
  IS_REF = '__v_isRef'
}

/**
 * Ref 的类
 */
class RefImpl {
  // 保存实际的值
  _value;
  // ref 标记，证明是一个 ref
  [ReactiveFlags.IS_REF] = true

  // 保存和 effect 之间的关联关系
  subs
  constructor(value) {
    this._value = value
  }

  get value() {
    // 收集依赖
    if (activeSub) {
      // 如果 activeSub 有，那就保存起来，等我更新的时候，触发
      this.subs = activeSub
    }
    return this._value
  }

  set value(newValue) {
    // 触发更新
    this._value = newValue

    // 通知 effect 重新执行，获取到最新的值
    this.subs?.()
  }
}

export function ref(value) {
    return new RefImpl(value)
}

/**
 * 判断是不是一个 ref
 * @param value
 * @returns {boolean}
 */
export function isRef(value) {
  return !!(value && value[ReactiveFlags.IS_REF])
}
```

#### 副作用函数 (Effect)
副作用是指那些依赖响应式数据的函数，当数据发生变化时，这些函数会自动重新执行。
- effect.ts
```typescript
// 当前正在收集的副作用函数，在模块中导出变量，这个时候当我执行 effect 的时候，我就把当前正在执行的函数，放到 activeSub 中，
// 当然这么做只是为了我们在收集依赖的时候能找到它，如果你还是不理解，那你就把他想象成一个全局变量，
// 这个时候如果执行 effect 那全局变量上就有一个正在执行的函数，就是 activeSub
export let activeSub

// effect 函数用于注册副作用函数
// 执行传入的函数，并在执行期间自动收集依赖
export function effect(fn) {
  // 设置当前活跃的副作用函数，方便在 get 中收集依赖
  activeSub = fn
  // 执行副作用函数，此时会触发依赖收集
  fn()
  // 清空当前活跃的副作用函数
  activeSub = undefined
}
```

这段代码实现了一个简单的响应式系统，它能够让我们追踪数据的变化并自动执行相关的更新操作。
```typescript
const count = ref(0)

effect(() => {
    console.log(count.value) // 这个函数会在 count.value 变化时自动重新执行
})

setTimeout(() => {
    count.value = 1
}, 1000)

```
> 当然，这一节我们只是实现了一个最基础的响应式，vue 中的响应式实现远比这个要复杂的多，不要担心，后面我们会慢慢完善它


#### 链表
链表（Linked List）是一种数据结构，它由一系列节点（Node）组成，每个节点存储一个数据值，并且指向下一个节点，它和数组一样，都是线性数据结构。
链表与数组的区别：
- 数组: 查找元素速度快（O(1)），这里指的是通过索引查找，但增删元素需要移动其他元素，效率较低（O(n)）。
- 链表: 增删元素更快（O(1)），但查找元素需要遍历整个链表（O(n)）。

##### 单向链表
在单向链表中，通常会有一个头节点（必须）和尾节点（非必须）
head: 头节点，表示链表的第一个节点，如果我们需要遍历这个链表，需要从它开始
tail: 尾节点，表示链表的最后一个节点
如果链表的 头节点（head） 是 node1，通过 node1 的 next 属性可以访问到 node2，
每个节点都有一个 next 属性，指向下一个节点，直到最后一个节点 node4，如果 node4 是最后一个节点，我们通常称它为尾结点（tail）
链表和数组都属于线性数据结构，它对比数组有什么优势呢？
以下是链表和数组在新增和删除操作时的对比案例：
- 数组
```typescript
const arr = ['a', 'b', 'c', 'd'] // a=>0  b=>1  c=>2  d=>3

// 删除数组的第一项
arr.shift()

console.log(arr) // ['b', 'c', 'd'] b=>0  c=>1  d=>2
```
我们初始化的时候声明了一个数组 arr，然后调用 arr.shift() 删除数组的第一个元素，
此时移除第一个元素后，数组的所有元素的索引都会变动，都需要往前移动一位，这样是比较耗费性能的

- 链表
```typescript
// 头节点是 head
let head = {
  value: 1,
  next: {
    value: 2,
    next: {
      value: 3,
      next: {
        value: 4,
        next: null
      }
    }
  }
}

// 删除链表的第一项
head = head.next // 将头节点指向下一个节点 node2

console.log(head) // 输出新的头节点 [2, 3, 4]
```
node1，只需让 head 指向 head.next，这样 node2 就成为新的头节点，而 node1 会被垃圾回收自动释放。

对比总结
只针对头节点操作，不考虑移除中间节点
- 数组：
  - 新增操作需要移动后续元素，可能导致性能下降（O(n)）。
  - 删除操作同样需要移动后续元素，性能也为O(n)。
- 链表：
  - 新增操作只需修改指针，性能为O(1)。
  - 删除操作也只需修改指针，性能为O(1)。
通过上面的案例我们了解到，链表的节点新增和删除动作，是会比数组要快的，但是我们目前只是删除了头节点，
那如果我要删除某一个中间节点呢？这个时候仅靠单向链表也能做到：
```typescript
// 头节点是 head

let head = { value: 1, next: undefined }

const node2 = { value: 2, next: undefined }

const node3 = { value: 3, next: undefined }

const node4 = { value: 4, next: undefined }

// 建立链表之间的关系
head.next = node2
node2.next = node3
node3.next = node4

// 好，我们忘掉前面的动作，假设现在手里只有 node3

// 现在我们要把 node3 删掉

let current = head
while (current) {
  // 找到 node3 的上一个节点
  if (current.next === node3) {
    // 把 node3 的上一个指向 node3 的下一个
    current.next = node3.next
    break
  }
  current = current.next
}

console.log(head) // 输出新的链表 [1, 2，4]
```

#### 双向链表
上一章我们讲了单向链表，它存在一个问题，就是它不能快速的往前面添加节点，比如在下面这个案例中，
我们在 node3 前面添加一个节点，这个时候我们很难直接通过 node3 把新节点和 node2 关联起来，
当然你可以通过遍历的方式拿到 node2， 但是这样时间复杂度就比较高了，有没有什么快速删除的方式呢？有的
那么我们再来思考一下，我们现在想往 node3 前面添加一个，但是我们必须把这个新节点和 node2 建立关联关系，
如果我们能拿到 node2 就好办了

双向链表的每个节点都有两个指针，一个指向下一个节点（next），一个指向上一个节点（prev）。

此时每个节点都有一个属性 prev 指向它的上一个节点，如果我需要在 node3 前面添加 node5 ，
那我们是不是可以通过 node3 的 prev 拿到 node2，这个时候我们手里就有三个节点 node2 、node3、node5，
我们只需要把 node2 的 next 指向 node5，node5 的 next 指向 node3，就ok了
```typescript
// 假设链表的头节点是 head

let head = { value: 1, next: undefined, prev: undefined }

const node2 = { value: 2, next: undefined, prev: undefined }

const node3 = { value: 3, next: undefined, prev: undefined }

const node4 = { value: 4, next: undefined, prev: undefined }

// 建立链表之间的关系
head.next = node2
// node2 的上一个节点指向 head
node2.prev = head
// node2 的下一个指向 node3
node2.next = node3
// node3 的上一个节点指向 node2
node3.prev = node2
// node3 的下一个指向 node4
node3.next = node4
// node4 的上一个指向 node3
node4.prev = node3

// 好，我们忘掉前面的动作，假设现在手里只有 node3

// 现在我们要把 node3 删掉

// 如果 node3 有上一个，那就把上一个节点的下一个指向 node3 的下一个
if (node3.prev) {
  node3.prev.next = node3.next
} else {
  head = node3.next
}

if (node3.next) {
  node3.next.prev = node3.prev
}
console.log(head) // 输出新的链表 [1, 2, 4]
```
到此我们讲完了链表相关的知识，接下来我们会在 vue 源码中使用它，再来看一下它到底有多强大

#### 链表应用
把链表应用到我们的响应式系统中来
首先我们创建一个接口 Link
- system.ts
```typescript
interface Link {
  // 保存当前要关联的 effect
  sub: Function
  // 链表的下一个节点
  nextSub: Link
  // 链表的上一个节点
  prevSub: Link
}
```
然后把 RefImpl 中的 subs 结构改成 Link
- ref.ts
```typescript
/**
 * Ref 的类
 */
class RefImpl {
  // 保存实际的值
  _value
  // ref 标记，证明是一个 ref  [ReactiveFlags.IS_REF] = true

  /**
   * 订阅者链表的头节点，理解为我们讲的 head
   */
  subs: Link

  /**
   * 订阅者链表的尾节点，理解为我们讲的 tail
   */
  subsTail: Link

  constructor(value) {
    this._value = value
  }

  get value() {
    // 收集依赖
    if (activeSub) {
      trackRef(this)
    }
    return this._value
  }

  set value(newValue) {
    // 触发更新
    this._value = newValue
    triggerRef(this)
  }
}
```
这里我们添加了一个 subsTail 属性，用来保存尾节点
我们会调用 trackRef 函数收集依赖，调用 triggerRef 函数触发更新
- ref.ts
```typescript
/**
 * 收集依赖，建立 ref 和 effect 之间的链表关系
 * @param dep
 */
export function trackRef(dep) {
  if (activeSub) {
    link(dep, activeSub)
  }
}

/**
 * 触发 ref 关联的 effect 重新执行
 * @param dep
 */
export function triggerRef(dep) {
  if (dep.subs) {
    propagate(dep.subs)
  }
}
```
- system.ts
```typescript
/**
 * 链接链表关系
 * @param dep
 * @param sub
 */
export function link(dep, sub) {
  // 如果 activeSub 有，那就保存起来，等我更新的时候，触发
  const newLink = {
    sub,
    nextSub: undefined,
    prevSub: undefined
  }

  /**
   * 关联链表关系，分两种情况
   * 1. 尾节点有，那就往尾节点后面加
   * 2. 如果尾节点没有，则表示第一次关联，那就往头节点加，头尾相同
   */
  if (dep.subsTail) {
    dep.subsTail.nextSub = newLink
    newLink.prevSub = dep.subsTail
    dep.subsTail = newLink
  } else {
    dep.subs = newLink
    dep.subsTail = newLink
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
    queuedEffect.push(link.sub)
    link = link.nextSub
  }

  queuedEffect.forEach((effect) => effect())
}
```
在这里，我们将关联关系的数据结构，做成双向链表，这样修改后，收集依赖就变成了下面的样子
```typescript
const count = ref(0)

const effect1 = effect(() => {
  count.value
})

const effect2 = effect(() => {
  count.value
})

setTimeout(() => {
  count.value = 1
}, 1000)
```
count 作为一个响应式数据源，如何与两个副作用 effect1 和 effect2 进行关联。
在这张图中，count 表示响应式数据 ref，effect1 和 effect2 表示副作用函数
> count 通过 subs 指向了一个 link1 节点（头节点），这个头节点的 sub 指向了 effect1，这个 link 节点有一个 nextSub 属性，指向链表的下一个节点，link2，link2 的 sub 指向 effect2，当一秒钟后执行 count.value = 1 的时候，会触发 ref 的 set，在 set 中我们会通过 subs 遍历整个链表，找到 effect1 和 effect2 通知它们重新执行，它们在重新执行的过程中，会获取到最新的数据。

