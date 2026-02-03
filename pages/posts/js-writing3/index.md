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

## 实现 es6 的 class 语法
```javascript
function inherit(Child, Parent) {
  /**
   * 1️⃣ 建立「实例 → 父类原型」的原型链
   *
   * 等价于：
   *   Child.prototype.__proto__ === Parent.prototype
   *
   * 作用：
   * - 子类实例可以访问 Parent.prototype 上的方法
   * - 避免 Parent 构造函数被多次调用（区别于 Parent.call + new Parent）
   */
  Child.prototype = Object.create(Parent.prototype, {
    /**
     * 2️⃣ 修正 constructor 指向
     *
     * Object.create 会创建一个全新的对象作为 Child.prototype，
     * 默认 constructor 会丢失，需要手动指回 Child
     *
     * 属性特征设置为：
     * - enumerable: false（符合 class 行为，constructor 不可枚举）
     * - configurable / writable: true（与默认函数一致）
     */
    constructor: {
      enumerable: false,
      configurable: true,
      writable: true,
      value: Child
    }
  })

  /**
   * 3️⃣ 建立「子类构造函数 → 父类构造函数」的原型链（静态继承）
   *
   * 等价于：
   *   Child.__proto__ === Parent
   *
   * 作用：
   * - 子类可以继承父类的静态属性和静态方法
   * - 模拟 ES6：class Child extends Parent {}
   */
  Object.setPrototypeOf(Child, Parent)
}


// 测试用例
function Parent(name) {
  this.name = name
}

Parent.prototype.sayName = function () {
  return `parent name: ${this.name}`
}

Parent.staticMethod = function () {
  return 'static from parent'
}

function Child(name, age) {
  // 模拟 super(name)
  Parent.call(this, name)
  this.age = age
}

// 建立继承关系
inherit(Child, Parent)

// 子类实例方法
Child.prototype.sayAge = function () {
  return `age: ${this.age}`
}

// 子类静态方法
Child.childStatic = function () {
  return 'static from child'
}

// 1. 实例方法继承是否生效
const c = new Child('Tom', 18)

console.log(c.sayName()) // parent name: Tom
console.log(c.sayAge())  // age: 18

// 2. 原型链关系是否正确（核心）
console.log(Object.getPrototypeOf(Child.prototype) === Parent.prototype) // true

console.log(c instanceof Child)  // true
console.log(c instanceof Parent) // true

// 3. constructor 是否指回 Child
console.log(c.constructor === Child) // true

// 4. 静态方法是否继承成功（关键）  Child.__proto__ === Parent 生效, 即 Object.setPrototypeOf(Child, Parent)
console.log(Child.staticMethod()) // static from parent

console.log(Child.childStatic()) // static from child
```
