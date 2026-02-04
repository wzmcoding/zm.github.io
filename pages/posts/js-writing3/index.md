---
title: 你需要知道的JS技巧
date: 2026-2-2
updated: 2026-2-4
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
- bind 返回的函数被 new 调用作为构造函数时，绑定的值会失效并且改为 new 指定的对象
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

  // 定义绑定后函数的 name 和 length 属性（不可枚举）
  const desc = Object.getOwnPropertyDescriptors(fn)
  Object.defineProperties(boundFn, {
    length: desc.length,
    name: Object.assign(desc.name, {
      value: `bound ${desc.name.value}`
    })
  })

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
// fn.bind({ a: 1 }).call({ b: 2 })
// bind 优先级更高
// this = { a: 1 }      value: `bound ${desc.name.value}`
```
> - bind 返回的不是普通函数，而是一种带有内部 [[BoundThis]] 的绑定函数。
> - 在调用时，该内部绑定优先级高于 call / apply，因此无法再被修改。
> - new > bind > call / apply > 隐式绑定(obj.fn) > 默认绑定（window/undefined）

## 实现函数 call 方法
```javascript
Function.prototype.myCall = function (context, ...args) {
  /**
   * this 指向调用 myCall 的函数
   * 例如：fn.myCall(obj)
   * 此时 this === fn
   */
  const fn = this

  /**
   * ❗ this 校验
   * call 只能被函数调用
   * 如果 Function.prototype.myCall.call({}, obj)
   * 那么 this 就不是函数，必须抛错
   */
  if (typeof fn !== 'function') {
    throw new TypeError('this is not a function')
  }

  /**
   * 处理 context 为空的情况
   * 这里使用的是：
   *   context || (context = window)
   *
   * 含义：
   *   - 如果 context 为假值（null / undefined / 0 / '' / false）
   *     就会被替换成 window
   *
   * ⚠️ 注意：
   *   这一步并不完全符合原生 call 行为
   *   原生 call 只会在 null / undefined 时才使用全局对象
   *   0 / '' / false 是合法的 this，会被装箱
   */
  context || (context = window)
  // 规范级写法应是：context = context == null ? window : Object(context)

  /**
   * 使用 Symbol 作为临时属性名
   * 目的：
   *   - 避免覆盖 context 上已有的属性
   *   - 确保属性唯一且不可被外部访问
   */
  const caller = Symbol('caller')

  /**
   * 将函数临时挂载到 context 上
   * 本质：
   *   context.caller = fn
   *
   * 这样在调用时：
   *   context.caller(...)
   * 函数内部的 this 就会指向 context
   */
  context[caller] = fn

  /**
   * 以“对象.方法()”的形式调用函数
   * 从而隐式绑定 this
   *
   * 等价于：
   *   fn.call(context, ...args)
   */
  const res = context[caller](...args)

  /**
   * 清理临时属性
   * 避免污染 context 对象
   */
  delete context[caller]

  /**
   * 返回函数执行结果
   * call 本身是有返回值的
   */
  return res
}
// 测试用例
// this 是否正确绑定
function fn(a, b) {
  return { thisVal: this, sum: a + b }
}
const obj = { x: 1 }
const res = fn.myCall(obj, 2, 3)
console.log(res.thisVal === obj) // true
console.log(res.sum)             // 5
// context 为空的测试（默认绑定）
function showThis() {
  return this
}
console.log(showThis.myCall())          // window（非严格模式）
console.log(showThis.myCall(null))      // window
console.log(showThis.myCall(undefined)) // window
// 返回值测试
function sum(a, b) {
  return a + b
}

console.log(sum.myCall(null, 3, 4)) // 7
```

## 简易的 CO 模块
`co` 函数库是著名程序员 TJ Holowaychuk 于2013年6月发布的一个小工具，用于 `Generator` 函数的自动执行。

比如，有一个 Generator 函数，用于依次读取两个文件。
```javascript
const gen = function* (){
  const f1 = yield readFile('');
  const f2 = yield readFile('');
  console.log(f1.toString());
  console.log(f2.toString());
}
```
co 函数库可以让你不用编写 Generator 函数的执行器。
```javascript
const co = require('co');
co(gen);
```
上面代码中，Generator 函数只要传入 co 函数，就会**自动执行**。

co 函数**返回一个 Promise 对象**，因此可以用 then 方法添加回调函数。
```javascript
co(gen).then(function (){
  console.log('Generator 函数执行完成');
})
```
上面代码中，等到 Generator 函数执行结束，就会输出一行提示。

co 函数具体实现
```javascript
const co = (genFn) => {
  return new Promise((resolve, reject) => {
    // 生成迭代器
    const gen = genFn()

    function next(nextFn, arg) {
      let res
      try {
        // 执行 next / throw
        res = nextFn.call(gen, arg)
      } catch (err) {
        // Generator 内部抛错，直接 reject
        return reject(err)
      }

      const { value, done } = res

      // 判断是否结束
      if (done) {
        return resolve(value)
      }

      // 把 yield 的结果 Promise 化
      Promise.resolve(value).then(
        (val) => next(gen.next, val), // 迭代器继续执行
        (err) => next(gen.throw, err) // 迭代器抛出错误
      )
    }

    // 迭代器开始执行
    next(gen.next)
  })
}

// 测试用例
// 正常 Promise 串行
function* task() {
  const a = yield Promise.resolve(1)
  const b = yield Promise.resolve(a + 1)
  const c = yield Promise.resolve(b + 1)
  return c
}

co(task).then(res => {
  console.log(res) // 3
})
// yield 普通值（co 会自动包 Promise）
function* test() {
  const a = yield 1
  const b = yield a + 1
  return b
}

co(test).then(res => {
  console.log(res) // 2
})
// 错误处理（重点）
function* errorTask() {
  try {
    yield Promise.reject('boom')
  } catch (e) {
    return 'caught: ' + e
  }
}

co(errorTask).then(res => {
  console.log(res) // caught: boom
})
```
和 async / await 的等价关系
```javascript
// co + Generator
co(function* () {
  const a = yield fetchA()
  const b = yield fetchB(a)
  return b
})

// async / await
(async () => {
  const a = await fetchA()
  const b = await fetchB(a)
  return b
})()
```
async/await 本质上就是语言级 co。

## 函数防抖
```javascript
const debounce = (fn, delay, options = { immediate: true, context: null }) => {
  let timer = null
  const _debounce = function (...args) {
    if (timer) {
      clearTimeout(timer)
    }
    if (options.immediate && !timer) {
      timer = setTimeout(null, delay)
      fn.apply(options.context, args)
    } else {
      timer = setTimeout(() => {
        fn.apply(options.context, args)
        timer = null
      }, delay)
    }
  }
  _debounce.cancel = function () {
    clearTimeout(timer)
    timer = null
  }
  return _debounce
}
```
> immediate 为是否在进入时立即执行一次，原理是利用定时器，如果在规定时间内再次触发事件会将上次的定时器清除，即不会执行函数并重新设置一个新的定时器，
> 直到超过规定时间自动触发定时器中的函数
> 同时通过闭包向外暴露了一个 cancel 函数，使得外部能直接清除内部的计数器

## 函数节流
```javascript
// leading：是否首次立即执行
// trailing：是否在停止触发后再执行一次
const throttle = (fn, delay, options = { leading: true, trailing: false, context: null }) => {
  let previous = 0
  let timer

  const _throttle = function (...args) {
    const now = new Date().getTime()
    if (!options.leading) {
      // 首次不执行
      if (timer) return
      timer = setTimeout(() => {
        timer = null
        fn.apply(options.context, args)
      }, delay)
    } else if (now - previous > delay) {
      fn.apply(options.context, args)
      previous = now // 更新上一次执行时间
    } else if (options.trailing) {
      // 停止触发后再执行一次
      clearTimeout(timer)
      timer = setTimeout(() => {
        fn.apply(options.context, args)
      }, delay)
    }
  }

  _throttle.cancel = function () {
    previous = 0
    clearTimeout(timer)
    timer = null
  }

  return _throttle
}
// 测试用例
let count = 0
const fn = () => {
  count++
  console.log('执行次数:', count)
}

const t = throttle(fn, 1000)

// 连续触发
t()
t()
t()
t()

// 1 秒后再触发
setTimeout(() => {
  t()
}, 1200)
```

## 图片懒加载
```javascript
const imgList = [...document.querySelectorAll('img')]

const lazyLoad = function () {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.intersectionRatio > 0) {
        entry.target.src = entry.target.dataset.src
        observer.unobserve(entry.target)
      }
    })
  })
  imgList.forEach((img) => {
    observer.observe(img)
  })
}
```
> - intersectionObserver 的实现方式，实例化一个 IntersectionObserver ，并使其观察所有 img 标签
> - 当 img 标签进入可视区域时会执行实例化时的回调，同时给回调传入一个 entries 参数，保存着实例观察的所有元素的一些状态，
> 比如每个元素的边界信息，当前元素对应的 DOM 节点，当前元素进入可视区域的比率，每当一个元素进入可视区域，将真正的图片赋值给当前 img 标签，同时解除对其的观察

## new 关键字
对 new Fn(...args)，JS 引擎按顺序干这四件事：
1. 创建一个全新的空对象
2. 把这个对象的 [[Prototype]] 指向 Fn.prototype
3. 用这个对象作为 this，执行构造函数
4. 根据返回值决定最终结果
   - 如果构造函数返回 对象 / 函数 → 用返回值
   - 否则 → 用步骤 1 创建的对象
```javascript
function myNew(Constructor, ...args) {
  // 1. 参数校验
  if (typeof Constructor !== 'function') {
    throw new TypeError('Constructor must be a function')
  }

  // 2. 创建对象，并绑定原型
  const obj = Object.create(Constructor.prototype)

  // 3. 执行构造函数，绑定 this
  const result = Constructor.apply(obj, args)

  // 4. 返回规则（对象优先）
  return (result !== null && (typeof result === 'object' || typeof result === 'function'))
    ? result
    : obj
}

// 测试用例
function Person(name) {
  this.name = name
}
Person.prototype.say = function () {
  return this.name
}
const p = myNew(Person, 'Tom')

console.log(p.name)               // Tom
console.log(p.say())              // Tom
console.log(p instanceof Person)  // true

function Foo() {
  this.a = 1
  return { b: 2 }
}
const f = myNew(Foo)

console.log(f)          // { b: 2 }
console.log(f.a)        // undefined
```

## 实现 Object.assign
```javascript
Object.myAssign = function (target, ...sources) {
  // 1. target 校验
  if (target == null) {
    throw new TypeError('Cannot convert undefined or null to object')
  }

  // 2. 装箱（原生行为）
  const to = Object(target)

  for (let source of sources) {
    // 3. 跳过 null / undefined
    if (source == null) continue

    const from = Object(source)

    // 4. 拷贝字符串键（可枚举）
    for (let key of Object.keys(from)) {
      to[key] = from[key]
    }

    // 5. 拷贝 Symbol 键（可枚举）
    for (let sym of Object.getOwnPropertySymbols(from)) {
      if (Object.prototype.propertyIsEnumerable.call(from, sym)) {
        to[sym] = from[sym]
      }
    }
  }

  return to
}
// 测试用例
const a = { x: 1 }
const b = { y: 2 }

Object.myAssign(a, b)

console.log(a) // { x: 1, y: 2 }

// 浅拷贝验证
const obj = { nested: { x: 1 } }
const res = Object.myAssign({}, obj)

res.nested.x = 99
console.log(obj.nested.x) // 99
```

## 实现 instanceof
> - instanceof 的原理是：
> - 沿着 left 对象的原型链向上查找，逐层将其 [[Prototype]] 与 right.prototype 进行比较
> - 若在原型链中找到相等的引用则返回 true
> - 若查找到原型链终点（null）仍未找到，则返回 false
```javascript
const myInstanceof = function (left, right) {
  let proto = Object.getPrototypeOf(left)
  while (true) {
    if (proto === null) return false
    if (proto === right.prototype) return true
    proto = Object.getPrototypeOf(proto)
  }
}
```
