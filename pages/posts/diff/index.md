---
title: diff 最长递增子序列
date: 2025-07-21
updated: 2025-07-22
categories: 手写Vue3源码
tags:
  - diff 最长递增子序列
top: 1
---

# diff
## 全量 diff （重要）
全量 diff 主要是针对两个子节点都是数组的情况，我们需要对它所有的子元素进行全量更新，那么这种更新非常消耗性能，
在 vue 中会尝试着尽可能的复用 dom，来进行更新，我们来看这么几种情况

## 双端 diff
### 头部对比
我们先来看一下头部对比的场景，我们假设子节点是通过 `v-for` 渲染出来的，最开始数组为 `[a, b]`，然后我们 `push` 了一个 `c` 进去：
- `c1 = [a, b]`
- `c2 = [a, b, c]`
  此时我们只需要从头开始进行对比就可以，`c1` 的第一个为 `a`，`c2` 的第一个也是 `a`，他们的 `key` 都是可以对应的上的，
  所以依次对比 `a` 和 `b`，到 `c` 之后，发现 `c1` 里面没有 `c`，那就直接挂载新的子节点就可以了
实现代码：
```typescript
// 开始对比的下标
let i = 0

// 老的子节点的最后一个元素的下标
let e1 = c1.length - 1

// 新的子节点的最后一个元素的下标
let e2 = c2.length - 1

/**
 * * 1.1 头部对比
 * c1 => [a, b]
 * c2 => [a, b, c]
 *
 * 开始时：i = 0, e1 = 1, e2 = 2
 * 结束时：i = 2, e1 = 1, e2 = 2
 *
 */
while (i <= e1 && i <= e2) {
  const n1 = c1[i]
  const n2 = c2[i]

  if (isSameVNodeType(n1, n2)) {
    // 如果 n1 和 n2 是同一个类型的子节点，那就可以更新，更新完了，对比下一个
    patch(n1, n2, container)
  } else {
    break
  }

  i++
}
```
### 尾部对比
当然，我们这里只是列出了头部对比，但是实际工作中，我们不一定只是向尾部添加元素，还有可能往头部添加，比如 `unshift`，那么接下来我们往头部添加一个子节点 `c`：
- `c1 = [a, b]`
- `c2 = [c, a, b]`
  此时很明显头部对比就对比不上了，因为 `c1` 的第一项是 `a`，`c2` 的第一项是 `c`，那么在头部对比的代码中第一次就会被 `break`，
  但是我们会发现，头部虽然对比不上，但是尾部是可以对比的上的，比如 `c1` 的最后一项是 `b`，`c2` 的最后一项也是 `b`，那么我们是不是可以倒着比
实现代码：
```typescript
// 开始对比的下标
let i = 0

// 老的子节点的最后一个元素的下标
let e1 = c1.length - 1

// 新的子节点的最后一个元素的下标
let e2 = c2.length - 1

/* 省略头部对比的代码 */

/**
 * * 1.2 尾部对比
 *
 * c1 => [a, b]
 * c2 => [c, d, a, b]
 * 开始时：i = 0, e1 = 1, e2 = 3
 * 结束时：i = 0，e1 = -1, e2 = 1
 */
while (i <= e1 && i <= e2) {
  const n1 = c1[e1]
  const n2 = c2[e2]

  if (isSameVNodeType(n1, n2)) {
    // 如果 n1 和 n2 是同一个类型的子节点，那就可以更新，更新完了之后，对比上一个
    patch(n1, n2, container)
  } else {
    break
  }

  // 更新尾指针
  e1--
  e2--
}
```
### 结论
当双端 `diff` 完成后，我们可以得出以下结论，当 `i > e1` 的时候，表示新的子节点多，老的子节点少，
所以我们需要插入新的子节点，插入的范围为 `i - e2`，反之当 `i > e2` 的时候，
表示老的多，新的少，需要将老的子节点中多余的卸载掉，代码实现如下：
```typescript
if (i > e1) {
  /**
   * 根据双端对比，得出结论：
   * i > e1 表示老的少，新的多，要挂载新的，挂载的范围是 i - e2
   */
  const nextPos = e2 + 1
  // 由于挂载不一定是追加到父元素的最后面，所以此处需要获取到 anchor，插入到某个元素之前
  const anchor = nextPos < c2.length ? c2[nextPos].el : null
  console.log(anchor)
  while (i <= e2) {
    patch(null, c2[i], container, anchor)
    i++
  }
} else if (i > e2) {
  /**
   * 根据双端对比，得出结果：
   * i > e2 的情况下，表示老的多，新的少，要把老的里面多余的卸载掉，卸载的范围是 i - e1
   */ while (i <= e1) {
    unmount(c1[i])
    i++
  }
}
```
在此处，我们获取到了 `anchor` ，是因为我们每次更新不一定是要插入到元素的最后面，比如：
- `c1 = [a, b]`
- `c2 = [c, a, b]`
  在这种情况下，`c` 肯定是要插入到 `a` 之前，所以我们要想办法拿到 `a`，当对比结束后，`e1` 应该是等于 `c` 的索引，
  那么 `a` 的索引应该为 `e2 + 1`，我们通过索引拿到 `anchor`，将它传递给 `patch`，
  从 `patch` 到 `mountElement` 之间所有的调用将传递 `anchor`，不再一一展示


## 乱序 diff
前面我们讲了双端 diff，但是并且举了几个例子，但是举的例子都是建立在数据比较理想的情况下，顺序也没有变，这种情况下是比较容易对比的，
那么如果数据的顺序乱了呢？我们再来看一组案例：
```typescript
// c1 => [a, b, c, d, e]
const vnode1 = h('div', [
  h('p', { key: 'a', style: { color: 'blue' } }, 'a'),
  h('p', { key: 'b', style: { color: 'blue' } }, 'b'),
  h('p', { key: 'c', style: { color: 'blue' } }, 'c'),
  h('p', { key: 'd', style: { color: 'blue' } }, 'd'),
  h('p', { key: 'e', style: { color: 'blue' } }, 'e')
])

// c2 => [a, c, d, b, e]
const vnode2 = h('div', [
  h('p', { key: 'a', style: { color: 'red' } }, 'a'),
  h('p', { key: 'c', style: { color: 'red' } }, 'c'),
  h('p', { key: 'd', style: { color: 'red' } }, 'd'),
  h('p', { key: 'b', style: { color: 'red' } }, 'b'),
  h('p', { key: 'e', style: { color: 'red' } }, 'e')
])

render(vnode1, app)

setTimeout(() => {
  render(vnode2, app)
}, 1000)
```
在这组数据中，我们可以看到，数据从 `[a, b, c, d, e]` 变为 `[a, c, d, b, e]`，这样的话顺序就发生了变化，但是这些 `key` 还是在的，所
以我们就需要去找到对应的 `key`，进行 `patch`，此处我们先不考虑顺序的问题
当双端 `diff` 结束后，此时 `i = 1,e1 = 3,e2 = 3`，此时 `i` 既不大于 `e1` 也不小于 `e2`，中间还有三个没有对比完，
但是这些 `key` 还是在的，所以我们需要到 c1 中找到对应 `key` 的虚拟节点，进行 `patch`：
```typescript
// 老的子节点开始查找的位置 s1 - e1 let s1 = i
// 新的子节点开始查找的位置 s2 - e2 let s2 = i

/**
 * 做一份新的子节点的key和index之间的映射关系
 * map = {
 *   c:1,
 *   d:2,
 *   b:3
 *  }
 */
const keyToNewIndexMap = new Map()

/**
 * 遍历新的 s2 - e2 之间，这些是还没更新的，做一份 key => index map
 */
for (let j = s2; j <= e2; j++) {
  const n2 = c2[j]
  keyToNewIndexMap.set(n2.key, j)
}

/**
 * 遍历老的子节点
 */
for (let j = s1; j <= e1; j++) {
  const n1 = c1[j]
  // 看一下这个key在新的里面有没有
  const newIndex = keyToNewIndexMap.get(n1.key)
  if (newIndex != null) {
    // 如果有，就patch
    patch(n1, c2[newIndex], container)
  } else {
    // 如果没有，表示老的有，新的没有，需要卸载
    unmount(n1)
  }
}
```
在这段代码中，我们声明了一个 `keyToNewIndexMap` 用来保存 `c2` 中 `key` 对应的 `index`，
这样我们后续就可以快速的通过这个 `key` 找到对应的虚拟节点进行 `patch`，至此，该更新的就更新完了，
但是目前顺序还是不对，我们需要遍历新的子节点，将每个子节点插入到正确的位置：
```typescript
/**
 * 1. 遍历新的子元素，调整顺序，倒序插入
 * 2. 新的有，老的没有的，我们需要重新挂载
 */
for (let j = e2; j >= s2; j--) {
  /**
   * 倒序插入
   */
  const n2 = c2[j]
  // 拿到它的下一个子元素
  const anchor = c2[j + 1]?.el || null
  if (n2.el) {
    // 依次进行倒序插入，保证顺序的一致性
    hostInsert(n2.el, container, anchor)
  } else {
    // 新的有，老的没有，重新挂载
    patch(null, n2, container, anchor)
  }
}
```
至此，真实 `dom` 更新完毕，顺序也 ok！

## 最长递增子序列
在前面我们经历了双端 diff 和乱序 diff 之后，真实 dom 已经完整的更新好了，然后我们将每个 dom 根据 c2 的顺序进行了倒序插入，
但是这样我们对每个 dom 进行移动操作的时候，实际上是比较耗费性能的，那么我们有没有办法移动较少的元素，也可以让它保证顺序正确呢？我们来看一下：
旧节点 [a, b, c, d, e] 新节点 [a, c, d, b, e],我们其实只需要将 b 移动到 e 的前面，顺序就自然而然的修正了，c 和 d 之间并不需要移动，这样我们就可以节约一部分性能，对吧，这就涉及到最长递增子序列了。
顾名思义它是在一个序列中找到最长的连续递增子序列，很难懂，没关系，我们来列几组数据：
- [1, 5, 3, 4, 7, 8]
- [10, 3, 5, 9, 12, 8, 15, 18]
  我们一眼就可以看出第一组序列中最长的递增子序列是 [1, 3, 4, 7, 8]
  先看 [1, 5, 3, 4, 7, 8] 怎么算，掌握一下概念
- 1：LIS = [1]（空列表直接加入 1）
- 5：LIS = [1, 5]（5 大于 1，直接追加）
- 3：LIS = [1, 3]（3 小于 5，用 3 替换 5）
- 4：LIS = [1, 3, 4]（4 大于 3，追加）
- 7：LIS = [1, 3, 4, 7]（7 大于 4，追加）
- 8：LIS = [1, 3, 4, 7, 8]（8 大于 7，追加）
  由此算出最长递增子序列为 [1, 3, 4, 7, 8]
  第二组 [10, 3, 5, 9, 12, 8, 15, 18]
- 10：LIS = [10]（空列表直接加入 10）
- 3：LIS = [3]（3 小于 10，用 3 替换 10）
- 5：LIS = [3, 5]（5 大于 3，追加）
- 9：LIS = [3, 5, 9]（9 大于 5，追加）
- 12：LIS = [3, 5, 9, 12]（12 大于 9，追加）
- 8：LIS = [3, 5, 8, 12]（8 小于 9，用 8 替换 9）
- 15：LIS = [3, 5, 8, 12, 15]（15 大于 12，追加）
- 18：LIS = [3, 5, 8, 12, 15, 18]（18 大于 15，追加）
  由此算出最长递增子序列为 [3, 5, 8, 12, 15, 18]，但是很遗憾，8 和 12 的顺序似乎出现了错误，没关系，vue3 里面使用了反向追溯的方式，来修正这个最长递增子序列，来看一下
- 10：LIS = [10]（空列表直接加入 10，记录 10 的前一个为 null）
- 3：LIS = [3]（3 小于 10，用 3 替换 10，记录 3 的前一个为 null）
- 5：LIS = [3, 5]（5 大于 3，追加，记录 5 的前一个为 3）
- 9：LIS = [3, 5, 9]（9 大于 5，追加，记录 9 的前一个为 5）
- 12：LIS = [3, 5, 9, 12]（12 大于 9，追加，记录 12 的前一个为 9）
- 8：LIS = [3, 5, 8, 12]（8 小于 9，用 8 替换 9，记录 8 的前一个为 5）
- 15：LIS = [3, 5, 8, 12, 15]（15 大于 12，追加，记录 15 的前一个为 12）
- 18：LIS = [3, 5, 8, 12, 15, 18]（18 大于 15，追加，记录 18 的前一个为 15）
  结束以后我们通过最后一个倒序追溯
- 起点：18（最后一个元素）
- 18 的前驱是 → 15
- 15 的前驱是 → 12
- 12 的前驱是 → 9
- 9 的前驱是 → 5
- 5 的前驱是 → 3
  所以 最终正确的 LIS = [3, 5, 9, 12, 15, 18]
  求最长递增子序列的函数：
```typescript
/**
 * 求最长递增子序列
 */
function getSequence(arr) {
  const result = []
  // 记录前驱节点
  const map = new Map()

  for (let i = 0; i < arr.length; i++) {
    const item = arr[i]
    // -1 不在计算范围内
    if (item === -1 || item === undefined) continue

    // 为了忽略第一项是 -1 或者 undefined
    if (result.length === 0) {
      // 如果 result 里面一个都没有，把当前的索引放进去
      result.push(i)
      continue
    }

    const lastIndex = result[result.length - 1]
    const lastItem = arr[lastIndex]

    if (item > lastItem) {
      // 如果当前这一项大于上一个，那么就直接把索引放到 result 中
      result.push(i)
      // 记录前驱节点
      map.set(i, lastIndex)
      continue
    }
    // item 小于 lastItem，开始二分查找
    let left = 0
    let right = result.length - 1

    while (left < right) {
      const mid = Math.floor((left + right) / 2)
      // 拿到中间项
      const midItem = arr[result[mid]]
      if (midItem < item) {
        left = mid + 1
      } else {
        right = mid
      }
    }

    if (arr[result[left]] > item) {
      // 找到最合适的，把索引替换进去
      result[left] = i
      map.set(i, map.get(left))
    }  }

  // 反向追溯
  let l = result.length
  let last = result[l - 1]

  while (l > 0) {
    l--
    // 纠正顺序
    result[l] = last
    // 去前驱节点里面找
    last = map.get(last)
  }
  return result
}
```
注意，此处我们求的是索引值，因此我们会得到一个数组，数组中保存的索引是不用移动的，我们来修改一下代码
```typescript
const patchKeyedChildren = (c1, c2, container) => {
  /* 省略双端 diff */

  /**
   * 2. 乱序
   * c1 => [a, (b, c, d), e]
   * c2 => [a, (c, d, b), e]
   * 开始时：i = 0, e1 = 4, e2 = 4
   * 双端对比完结果：i = 1, e1 = 3, e2 = 3
   *
   * 找到 key 相同的 虚拟节点，让它们 patch 一下
   */

  // 老的子节点开始查找的位置 s1 - e1
  let s1 = i
  // 新的子节点开始查找的位置 s2 - e2
  let s2 = i

  /**
   * 做一份新的子节点的key和index之间的映射关系
   * map = {
   *   c:1,
   *   d:2,
   *   b:3
   * }
   */
  const keyToNewIndexMap = new Map()

  // 💡  保存一份索引，记录的子节点的索引在老的子节点中的位置
  const newIndexToOldIndexMap = new Array(e2 - s2 + 1)
  // 💡  -1 代表不需要计算的
  newIndexToOldIndexMap.fill(-1)

  /**
   * 遍历新的 s2 - e2 之间，这些是还没更新的，做一份 key => index map
   */
  for (let j = s2; j <= e2; j++) {
    const n2 = c2[j]
    keyToNewIndexMap.set(n2.key, j)
  }

  /**
   * 遍历老的子节点
   */
  for (let j = s1; j <= e1; j++) {
    const n1 = c1[j]
    // 看一下这个key在新的里面有没有
    const newIndex = keyToNewIndexMap.get(n1.key)
    if (newIndex != null) {
      // 💡  在这里赋值，记录位置
      newIndexToOldIndexMap[newIndex] = j
      // 如果有，就怕patch
      patch(n1, c2[newIndex], container)
    } else {
      // 如果没有，表示老的有，新的没有，需要卸载
      unmount(n1)
    }
  }
  // 💡 求出最长递增子序列
  const newIndexSequence = getSequence(newIndexToOldIndexMap)
  // 💡 换成 Set 性能好一点
  const sequenceSet = new Set(newIndexSequence)

  /**
   * 1. 遍历新的子元素，调整顺序，倒序插入
   * 2. 新的有，老的没有的，我们需要重新挂载
   */
  for (let j = e2; j >= s2; j--) {
    /**
     * 倒序插入
     */
    const n2 = c2[j]
    // 拿到它的下一个子元素
    const anchor = c2[j + 1]?.el || null
    if (n2.el) {
      // 如果 j 不在最长递增子序列中，表示需要移动
      if (!sequenceSet.has(j)) {
        // 💡 依次进行倒序插入，保证顺序的一致性
        hostInsert(n2.el, container, anchor)
      }
    } else {
      // 新的有，老的没有，重新挂载
      patch(null, n2, container, anchor)
    }
  }
}
```
我们虽然求出了最长递增子序列，但是这样依然比较耗费性能，因为并不是在所有情况下，我们都需要去求最长递增子序列，比如：
- c1 = [a, b, c, d, e]
- c2 = [a, h, b, c, d, g, e]
  在这种情况下，我们不需要求最长递增子序列，因为我们可以直接将 h 和 g 插入到 b 和 e 之间，这样就可以了，
  因为 b、c、d 之间的顺序是不会变的，它们本身就是递增的，所以我们根据这个案例可以得出一个结论，
  如果新的子节点在老的子节点中本身就是连续递增的，那么我们就不需要求最长递增子序列了，所以我们再来修改一下代码：
```typescript
function patchKeyedChildren(n1, n2, container, anchor) {
  /**
   * 省略双端diff
   */

  /**
   * 省略部分乱序 diff
   */
  // 表示新的子节点在老的子节点中本身就是连续递增的
  let pos = -1
  // 是否需要移动
  let moved = false

  /**
   * 遍历老的子节点
   */
  for (let j = s1; j <= e1; j++) {
    const n1 = c1[j]
    // 看一下这个key在新的里面有没有
    const newIndex = keyToNewIndexMap.get(n1.key)
    if (newIndex != null) {
      if (newIndex > pos) {
        // 💡 如果每一次都是比上一次的大，表示就是连续递增的，不需要算
        pos = newIndex
      } else {
        // 💡 如果突然有一天比上一次的小了，表示需要移动了
        moved = true
      }
      newIndexToOldIndexMap[newIndex] = j
      // 如果有，就怕patch
      patch(n1, c2[newIndex], container)
    } else {
      // 如果没有，表示老的有，新的没有，需要卸载
      unmount(n1)
    }
  }
  // 💡 如果 moved 为 false，表示不需要移动，就别算了
  const newIndexSequence = moved ? getSequence(newIndexToOldIndexMap) : []
  // 换成 Set 性能好一点
  const sequenceSet = new Set(newIndexSequence)

  /**
   * 1. 遍历新的子元素，调整顺序，倒序插入
   * 2. 新的有，老的没有的，我们需要重新挂载
   */
  for (let j = e2; j >= s2; j--) {
    /**
     * 倒序插入
     */
    const n2 = c2[j]
    // 拿到它的下一个子元素
    const anchor = c2[j + 1]?.el || null
    if (n2.el) {
      if (moved) {
        // 💡 如果需要移动，再进去
        // 如果 j 不在最长递增子序列中，表示需要移动
        if (!sequenceSet.has(j)) {
          // 依次进行倒序插入，保证顺序的一致性
          hostInsert(n2.el, container, anchor)
        }
      }
    } else {
      // 新的有，老的没有，重新挂载
      patch(null, n2, container, anchor)
    }
  }
}
```
这样我们就优化了一下，如果不需要移动，就不需要去求最长递增子序列了。
