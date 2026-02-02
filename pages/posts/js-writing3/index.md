---
title: 手写常见js代码
date: 2026-2-2
updated: 2026-2-2
categories: js手写
tags:
  - js手写
top: 1
---

## 实现数组 map 方法
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
