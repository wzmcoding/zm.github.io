---
title: 手写常见js代码
date: 2026-2-2
updated: 2026-2-2
categories: js手写
tags:
  - js手写
top: 1
---

## 循环实现数组 map 方法
```javascript
const myMap = function (fn, context) {
  const arr = Array.prototype.slice.call(this)
  const res = Array();
  for (let i = 0; i < arr.length; i++) {
    // 判断稀疏数组, 即索引为空，如 [1,,3]
    if (!arr.hasOwnProperty(i))  continue
    res[i] = fn.call(context, arr[i], i, this)
  }
  return res;
}
Array.prototype.myMap = myMap
console.log([1, 2, 3].myMap(item => item * 2))
```

## reduce 实现数组 map 方法
```javascript
const myMap = function (fn, context) {
  const arr = Array.prototype.slice.call(this)
  return arr.reduce((acc, cur, index) => {
    return [...acc, fn.call(context, cur, index, this)]
  }, [])
}
Array.prototype.myMap = myMap
console.log([1, 2, 3].myMap(item => item * 2))
```

## 循环实现数组 filter 方法
```javascript
const myFilter = function (fn, context) {
  const arr = Array.prototype.slice.call(this)
  const res = [];
  for (let i = 0; i < arr.length; i++) {
    if (!arr.hasOwnProperty(i))  continue
    fn.call(context, arr[i], i, this) && res.push(arr[i])
  }
  return res;
}
Array.prototype.myFilter = myFilter
console.log([1, 2, 3].myFilter(item => item > 2))
```

## reduce 实现数组 filter 方法
```javascript
const myFilter = function (fn, context) {
  return this.reduce((acc, cur, index) => {
    return fn.call(context, cur, index, this) ? [...acc, cur] : [...acc]
  }, [])
}
Array.prototype.myFilter = myFilter
console.log([1, 2, 3].myFilter(item => item > 2))
```

## 循环实现数组 some 方法
```javascript
const mySome = function (fn, context) {
  const arr = Array.prototype.slice.call(this)
  if (!arr.length) return false
  for (let i = 0; i < arr.length; i++) {
    if (!arr.hasOwnProperty(i))  continue
    const res = fn.call(context, arr[i], i, this)
    if (res) return true
  }
  return false
}
Array.prototype.mySome = mySome
console.log([1, 2, 3].mySome(item => item > 2))
console.log([1, 2, 3].mySome(item => item > 5))
```

## 循环实现数组 every 方法
```javascript
const myEvery = function (fn, context) {
  const arr = Array.prototype.slice.call(this)
  if (!arr.length) return true
  for (let i = 0; i < arr.length; i++) {
    if (!arr.hasOwnProperty(i))  continue
    const res = fn.call(context, arr[i], i, this)
    if (!res) return false
  }
  return true
```

## 循环实现数组的 reduce 方法
```javascript
const myReduce = function (fn, initialValue) {
  const arr = Array.prototype.slice.call(this)
  let res
  let startIndex
  if (initialValue === undefined) {
    // 没有 initialValue
    for (let i = 0; i < arr.length; i++) {
      // 处理稀疏数组
      if (!arr.hasOwnProperty(i)) continue
      startIndex = i
      res = arr[i]
      break
    }
  } else {
    res = initialValue
  }

  // 如果 startIndex 没有值，说明 initialValue 有值，则从 0 开始
  for (let i = ++startIndex || 0; i < arr.length; i++) {
    if (!arr.hasOwnProperty(i)) continue
    res = fn.call(null, res, arr[i], i, this)
  }
  return res
}
Array.prototype.myReduce = myReduce
console.log([1, 2, 3, 4].myReduce((sum, cur) => sum + cur)) // 10
console.log([1, 2, 3].myReduce((sum, cur) => sum + cur, 10)) // 16
```

## 使用 reduce 实现数组的 flat 方法
```javascript
const myFlat = function (depth = 1) {
  const arr = Array.prototype.slice.call(this)
  if (depth <= 0) return arr
  return arr.reduce((acc, cur) => {
    return acc.concat(Array.isArray(cur) ? cur.myFlat(depth - 1) : cur)
  }, [])
}
Array.prototype.myFlat = myFlat
console.log([1, [2, [3, [4, [5]]]]].myFlat())
```
