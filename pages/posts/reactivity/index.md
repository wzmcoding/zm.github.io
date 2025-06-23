---
title: 响应式
date: 2025-06-15
updated: 2025-06-23
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

#### 响应式数据的伴侣 - ReactiveEffect
##### 构造函数
我们之前的 effect 函数是这样的
- effect
```typescript
export let activeSub = null

// effect 函数用于注册副作用函数
// 执行传入的函数，并在执行期间自动收集依赖
export function effect(fn) {
  // 设置当前活跃的副作用函数，方便在 get 中收集依赖
  activeSub = fn
  // 执行副作用函数，此时会触发依赖收集
  fn()
  // 清空当前活跃的副作用函数
  activeSub = null
}
```
但是实际上，vue 中需要考虑的问题比较多，所以 effect 函数中创建了一个类的实例，这个类就是
`ReactiveEffect`
- effect
```typescript
class ReactiveEffect {
  // 表示当前是否被激活，如果为 false 则不收集依赖
  active = true
  constructor(public fn) {}

  run() {
    // 如果当前的 effect 未激活，那就不收集依赖，直接返回 fn 执行结果
    if (!this.active) {
      return this.fn()
    }
    // 将当前的 effect 保存到全局，以便于收集依赖
    activeSub = this
    try {
      return this.fn()
    } finally {
      // fn 执行完毕后将 activeSub 回收
      activeSub = undefined
    }
  }
}

export function effect(fn) {
  // 创建一个 ReactiveEffect 实例
  const e = new ReactiveEffect(fn)
  e.run() // 执行 fn
}
```
那么此时对应的 propagate 函数中的依赖触发也要修改，因为此时 activeSub 已经变成了一个对象
- system.ts
```typescript
/*
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

  queuedEffect.forEach((effect) => effect.run())
}
```

#### 嵌套effect
接着我们再来看一个案例：
```typescript
const count = ref(0)

// effect1
effect(() => {
  // 🚨 effect2 在 effect1 中执行
  effect(() => {
    console.log('effect2', count.value)
  })
  console.log('effect1', count.value)
})

setTimeout(() => {
  count.value = 1
}, 1000)
```
老规矩，猜一下一秒钟后的打印结果。
答案是：输出 'effect2' 1
这不对啊，我们的预期应该是同时输出：输出 'effect2' 1 和 输出 'effect1' 1
我们来看一下原因
```typescript
class ReactiveEffect {
  // 表示当前是否被激活，如果为 false 则不收集依赖
  active = true
  constructor(public fn) {}

  run() {
    // 如果当前的 effect 未激活，那就不收集依赖，直接返回 fn 执行结果
    if (!this.active) {
      return this.fn()
    }
    // 将当前的 effect 保存到全局，以便于收集依赖
    activeSub = this
    try {
      return this.fn()
    } finally {
      // fn 执行完毕后将 activeSub 回收
      activeSub = undefined // 🚨 fn 执行完毕后，被置空了
    }
  }
}
```
> activeSub = undefined 看一下这行代码，乍一看，似乎没有什么问题，但是，我们回到我们的案例中看一下，当 effect1 执行的时候，activeSub = effect1，然后在 effect1 中又创建了一个 effect2，此时执行 effect2 的 run 方法，然后马上 activeSub 又变成了 effect2，等 effect2 执行完毕后，将 activeSub 设置为 undefined，但是此时我们的 effect1 还没执行完毕对吧？那我后面访问到的 ref 就不会被收集到了，那么我们思考一下这个问题，当一个 effect 执行完毕后，我们是否需要把它设置为 undefined ？在我们这个案例中，肯定是不能的，那我们需要怎么做呢？我们可以考虑这样，我们在 activeSub = this 之前，也就是在 effect2 执行之前，activeSub 是有值的，它在 effect2 执行之前的值是 effect1，我们是不是可以把它保存起来，这样等 activeSub 执行完毕后，我们再把之前保存的值重新赋值给它，于是代码就变成了这样：

```typescript
class ReactiveEffect {
  // 表示当前是否被激活，如果为 false 则不收集依赖
  active = true
  constructor(public fn) {}

  run() {
    // 💡 保存之前的 activeSub
    const prevSub = activeSub
    // 将当前的 effect 保存到全局，以便于收集依赖
    activeSub = this
    try {
      return this.fn()
    } finally {
      // 💡 fn 执行完毕后将 activeSub 恢复为 prevSub
      activeSub = prevSub
    }
  }
}
```
> 这样我们在执行 activeSub = this 之前，先将它保存起来，等 fn 执行完毕后，再将它重新恢复，这样我们嵌套的问题就解决了，有的兄弟可能会说，那如果没有嵌套怎么办，如果没有嵌套，那第一次执行的时候，prevSub 就是 undefined，并不会影响我们的逻辑
```typescript
const count = ref(0)

// effect1
effect(() => {
  // 🚨 effect2 在 effect1 中执行
  effect(() => {
    console.log('effect2', count.value)
  })
  console.log('effect1', count.value)
})

setTimeout(() => {
  count.value = 1
}, 1000)
```

此时这段代码在定时器修改完后会正常打印出：
'effect2' 1
'effect1' 1

#### 调度器（scheduler）
> 调度器是响应式系统重一个重要的概念，我们默认使用 effect 访问响应式属性的时候，会收集依赖，当然我们修改响应式属性后，这个 effect 的 fn 会重新执行，而 scheduler 的作用是，当响应式数据发生变化的时候，执行 scheduler，而不是重新执行 fn，当然我们在创建 effect 的时候，还是会执行 fn，因为要靠它收集依赖，我们来看一下：

```typescript
const count = ref(0)

effect(
  () => {
    console.log('在 fn 中收集了依赖', count.value)
  },
  {
    scheduler() {
      console.log('scheduler', count.value)
    }
  }
)

setTimeout(() => {
  // ⭐️ 由于传递了 scheduler ，所以我们更新响应式属性的时候，会触发 scheduler
  count.value++ // scheduler
}, 1000)
```
那么我们应该如何实现这个功能呢？其实说困难也困难，说简单也简单，我们来看下区别：
- 默认：effect 在创建时会执行一次 fn，当 fn 中访问的响应式数据发生变化时，它会重新执行，此时无论是初始化，还是数据发生变化，都会重新执行 fn
- 调度器：当我们传递了 scheduler，首次创建 effect 的时候，依然会执行 fn，但是当我们数据发生变化的时候，就会执行 scheduler，也就是说响应式数据触发更新的时候，要换台了，不能执行 fn 了，当然这一切都是建立在我们传递了 scheduler，或者说我们也可以这样，ReactiveEffect 本身就存在 scheduler，这个方法默认会帮我们调用 run 方法，但是如果我们传递了 scheduler，对象本身的 scheduler，这样就完成我们的功能了
  那此时我们就假设 ReactiveEffect 本身的 scheduler 是直接调用 run 方法，

```typescript
class ReactiveEffect {
  constructor(public fn) {}

  run() {
    // 先将当前的 effect 保存起来，用来处理嵌套的逻辑
    const prevSub = activeSub

    // 每次执行 fn 之前，把 this 放到 activeSub 上面
    activeSub = this

    try {
      return this.fn()
    } finally {
      // 执行完成后，恢复之前的 effect
      activeSub = prevSub
    }
  }

  /**
   * 默认调用 run，如果用户传了，那以用户的为主，实例属性的优先级，由于原型属性
   */
  scheduler() {
    this.run()
  }
}

export function effect(fn, options) {
  const e = new ReactiveEffect(fn)
  // 将传递的属性合并到 ReactiveEffect 的实例中
  Object.assign(e, options)
  // 执行 run 方法
  e.run()
}
```
当然此时我们的 propagate 中的执行的方法也需要修改一下，因为我们之前执行的是 run 方法
```typescript
/**
 * 传播更新的函数
 * @param subs
 */
export function propagate(subs) {
  // 省略部分代码...

  // 这里执行的是 run 方法
  queuedEffect.forEach((effect) => effect.run())
}
```
这里我们现在需要触发 scheduler 了，这里我们修改了几次了，我们索性这样，搞一个 notify 方法，我只管调用你的 notify 方法，至于你最终执行那个方法，你自己决定：
```typescript
/**
 * 传播更新的函数
 * @param subs
 */
export function propagate(subs) {
  // 省略部分代码...

  // 这里执行 notify 方法
  queuedEffect.forEach((effect) => effect.notify())
}
```

然后我们在 ReactiveEffect 中再添加一个 notify 方法
```typescript
class ReactiveEffect {
  // 省略部分代码...

  /**
   * 通知更新的方法，如果依赖的数据发生了变化，会调用这个函数
   */
  notify() {
    this.scheduler()
  }

  // 省略部分代码...
}
```
