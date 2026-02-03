---
title: 你需要知道的JS技巧
date: 2026-2-2
updated: 2026-2-3
categories: 你需要知道的JS技巧
tags:
  - 你需要知道的JS技巧
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

## 函数柯里化
柯里化是函数式编程的一个重要技巧，将使用多个参数的一个函数转换成一系列使用一个参数的函数的技术
```javascript
const curry = function (fn) {
  const len = fn.length
  if (len <= 1) return fn
  function curried(...args) {
    return args.length >= len ? fn(...args) : curried.bind(null, ...args)
  }
  return curried
}
// 测试用例
const add = (a, b, c) => a + b + c
const curriedAdd = curry(add)
console.log(curriedAdd(1)(2)(3)) // 6
```

## 函数柯里化（支持占位符）
> 通过占位符能让柯里化更加灵活，实现思路是，每一轮传入的参数先去填充上一轮的占位符，如果当前轮参数含有占位符，则放到内部保存的数组末尾，
> 当前轮的元素不会去填充当前轮参数的占位符，只会填充之前传入的占位符
```javascript
const curry = (fn, placeholder = '_') => {
  curry._placeholder = placeholder
  if (fn.length <= 1) return fn
  const argsList = []
  const curried = function (...args) {
    // 记录了非当前轮最近的一个占位符下标，防止当前轮元素覆盖了当前轮的占位符
    let currentPlaceholderIndex = -1
    args.forEach((arg) => {
      let placeholderIndex = argsList.findIndex((arg) => arg === curry._placeholder)
      if (placeholderIndex < 0) {
        // 如果数组中没有占位符直接往数组末尾放入一个元素
        currentPlaceholderIndex = argsList.push(arg) - 1
      } else if (placeholderIndex !== currentPlaceholderIndex) {
        // 防止将元素填充到当前轮参数的占位符
        // (1, '_')('_',2) 数字 2 应该填充 1 后面的占位符，不能是 2 前面的占位符
        argsList[placeholderIndex] = arg
      } else {
        // 当前元素是占位符的情况
        argsList.push(arg)
      }
    })
    // 过滤出不含占位符的数组
    let realArgsList = argsList.filter((arg) => arg !== curry._placeholder)
    if (realArgsList.length === fn.length) {
      return fn(...argsList)
    } else if (realArgsList.length > fn.length) {
      throw new Error('超出初始函数参数最大值')
    } else {
      return curried
    }
  }
  return curried
}

// 测试用例
const add = (a, b, c, d) => a + b + c + d
const curriedAdd = curry(add)
console.log(curriedAdd('_',6)(5, '_')(7)(8)) // 26  相当于 add(5, 6, 7, 8)

const display = (a, b, c, d, e, f, g, h) => [a, b, c, d, e, f, g, h]
const curriedDisplay = curry(display)
console.log(curriedDisplay('_', 2)(1, '_')(3)(4, '_')('_', 5)(6)(7,8)) // [1, 2, 3, 4, 5, 6, 7, 8]
// 相当于 display(1, 2, 3, 4, 5, 6, 7, 8)
```

## 偏函数
> - 偏函数和柯里化概念类似，个人认为它们区别在于偏函数会固定你传入的几个参数，再一次性接受剩下的参数，而函数柯里化会根据你传入参数不停的返回函数，直到参数个数满足被柯里化前函数的参数个数
> - Function.prototype.bind 函数就是一个偏函数的典型代表，它接受的第二个参数开始，为预先添加到绑定函数的参数列表中的参数，与 bind 不同的是，上面的这个函数同样支持占位符

```javascript
const partialFn = (fn, ...args) => {
  let placeholderNum = 0;
  return (...newArgs) => {
    newArgs.forEach(arg => {
      let index = args.findIndex(v => v === '_')
      if (index < 0) return
      args[index] = arg
      placeholderNum++
    })
    if (placeholderNum < newArgs.length) {
      newArgs = newArgs.slice(placeholderNum, newArgs.length)
    }
    return fn.apply(this, [...args, ...newArgs])
  }
}
// 测试用例
const add = (a, b, c, d) => a + b + c + d
const partialAdd = partialFn(add, '_', 2, '_')
console.log(partialAdd(1, 3, 4)) // 10 相当于 add(1, 2, 3, 4)
```

## 斐波那契数列及其优化
> 利用函数记忆，将之前运算过的结果保存下来，对于频繁依赖之前结果的计算能够节省大量的时间，例如斐波那契数列，缺点就是闭包中的 obj 对象会额外占用内存
```javascript
let fibonacci = (n) => {
  if (n < 1) throw new Error('参数有误')
  if (n === 1 || n === 2) return 1
  return fibonacci(n - 1) + fibonacci(n - 2)
}

const memory = function (fn) {
  let obj = {}
  return function (n) {
    if (obj[n] === undefined)  obj[n] = fn(n)
    return obj[n]
  }
}

fibonacci = memory(fibonacci)

// 测试用例
console.log(fibonacci(1)) // 1
console.log(fibonacci(2)) // 1
console.log(fibonacci(3)) // 2
console.log(fibonacci(4)) // 3
console.log(fibonacci(5)) // 5
console.log(fibonacci(6)) // 8
console.log(fibonacci(7)) // 13

// 使用动态规划空间复杂度更低
function fibonacci_DP(n) {
  /**
   * 边界条件：
   * 斐波那契第 1、2 项固定为 1
   */
  if (n === 1 || n === 2) return 1

  /**
   * pre 表示 F(n-2)
   * cur 表示 F(n-1)
   * res 表示当前计算得到的 F(n)
   *
   * 初始状态对应：
   * F(1) = 1
   * F(2) = 1
   */
  let pre = 1
  let cur = 1
  let res = 1

  /**
   * 已经有前两项，因此还需要计算 (n - 2) 次
   * 每一轮循环：
   *   res = pre + cur      => 得到新的 F(n)
   *   pre = cur            => 状态前移
   *   cur = res
   */
  n = n - 2
  while (n > 0) {
    res = pre + cur
    pre = cur
    cur = res
    n--
  }

  return res
}

// 更直观版
function fibonacci_DP(n) {
  if (n === 1 || n === 2) return 1

  let pre = 1
  let cur = 1

  for (let i = 3; i <= n; i++) {
    const res = pre + cur
    pre = cur
    cur = res
  }

  return cur
}
console.log(fibonacci_DP(1)) // 1
console.log(fibonacci_DP(2)) // 1
console.log(fibonacci_DP(3)) // 2
console.log(fibonacci_DP(4)) // 3
console.log(fibonacci_DP(5)) // 5
console.log(fibonacci_DP(6)) // 8
console.log(fibonacci_DP(7)) // 13
```

## 实现函数 bind 方法
```javascript
Function.prototype.myBind = function (context, ...bindArgs) {
  if (typeof this !== 'function') {
    throw new TypeError('Bind must be called on a function')
  }

  const fn = this

  function boundFn(...callArgs) {
    const isNew = this instanceof boundFn
    const thisArg = isNew ? this : context

    return fn.apply(thisArg, bindArgs.concat(callArgs))
  }

  /**
   * 维护原型链：
   * new boundFn() instanceof fn === true
   */
  if (fn.prototype) {
    boundFn.prototype = Object.create(fn.prototype)
    boundFn.prototype.constructor = boundFn
  }

  return boundFn
}

// 测试用例
function Person(name) {
  this.name = name
}

Person.prototype.say = function () {
  return this.name
}

const obj = { name: 'obj' }

const Bound = Person.myBind(obj)
q
// 普通调用
console.log(Bound('Tom')) // undefined（构造函数没 return）
console.log(obj.name)     // Tom

// new 调用
const p = new Bound('Jerry')
console.log(p.name)       // Jerry
console.log(p instanceof Person) // true

// 为什么原生 bind 不能再改 this？
function fn() {
  return this
}

const bound = fn.bind({ a: 1 })
console.log(bound.call({ b: 2 })) // { a: 1 }
// bind 返回的是一个全新函数，this 已在闭包里被锁死。
```
