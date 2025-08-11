---
title: 手写常见js代码
date: 2025-04-21
updated: 2025-08-11
categories: js手写
tags:
  - js手写
top: 1
---

### 模拟接口请求失败并实现递增间隔的重试机制
请编写一个 JavaScript 函数 retryFetchWithDelay，模拟一个会失败的接口请求，并实现递增间隔的重试机制。具体要求如下：
1. 接口模拟：函数内部使用 fetchData 函数模拟接口请求
2. 重试策略：首次请求失败后，依次以 1 秒、2 秒、3 秒的间隔进行重试
3. 成功处理：任何一次请求成功后，立即返回成功结果
4. 失败处理：若三次重试后仍失败，返回错误提示 "请求已达最大重试次数"
```js
// 模拟一个接口请求函数，成功概率 50%
function fetchData() {
  return new Promise((resolve, reject) => {
    const isSuccess = Math.random() > 0.5; // 随机决定请求是否成功
    setTimeout(() => {
      if (isSuccess) {
        resolve("请求成功");  // 请求成功，返回结果
      } else {
        reject("请求失败");  // 请求失败，抛出错误
      }
    }, 1000);  // 模拟接口请求的延迟
  });
}

// 定义重试函数
async function retryFetchWithDelay(retryCount = 3) {
  let attempt = 0;

  // 使用一个循环尝试请求，最多重试 retryCount 次
  while (attempt < retryCount) {
    attempt++;  // 递增尝试次数
    try {
      // 尝试调用接口请求
      const result = await fetchData();
      return result;  // 请求成功，返回结果
    } catch (error) {
      console.log(`第 ${attempt} 次请求失败，原因: ${error}`);

      // 如果已经是最后一次重试，返回失败提示
      if (attempt === retryCount) {
        return "请求已达最大重试次数";
      }

      // 如果请求失败，按照递增间隔（1, 2, 3秒）等待后重试
      const delay = attempt * 1000;
      console.log(`等待 ${delay} 毫秒后重试...`);
      await new Promise(resolve => setTimeout(resolve, delay));  // 等待相应的时间
    }
  }
}

retryFetchWithDelay().then(console.log).catch(console.log)
```

### 判断一个对象是否存在循环引用
```js
const obj = {
  a: {
    b: 1
  },
  c: {
    d: 2
  }
}
obj.e = obj
// 判断是否为对象且不为 null
function isObject(obj) {
  return typeof obj === 'object' && obj !== null
}

// 检查对象是否有循环引用
function hasCircRef(obj, set = new Set()) {
  if (!isObject(obj)) return false // 不是对象直接返回 false
  if (set.has(obj)) return true    // 已经遍历过，说明有环
  set.add(obj)                     // 记录当前对象
  // 递归检查所有属性值，传递 set 的副本，互不影响
  return Object.values(obj).some(val => hasCircRef(val, new Set(set)))
}
hasCircRef(obj)
```

### 手写findTreeNode

```js
const tree = {
  id: 1,
  name: 'root',
  children: [
    {
      id: 2,
      name: 'child1',
      children: [
        {
          id: 3,
          name: 'child2',
          children: [
            {
              id: 4,
              name: 'child3',
              children: [
                {
                  id: 5,
                  name: 'child4',
                  children: []
                }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 6,
      name: 'child6',
      children: [
        {
          id: 7,
          name: 'child7',
          children: [
            {
              id: 8,
              name: 'child8',
              children: []
            }
          ]
        }
      ]
    }
  ],
}

/**
 * 使用迭代的深度优先搜索（DFS）在树结构中查找指定 id 的节点
 *
 * @param {Object} tree - 要查找的树的根节点
 * @param {number|string} id - 要查找的节点的唯一标识
 * @returns {Object|null} 匹配 id 的节点对象，未找到返回 null
 */
function findTreeNode(tree, id) {
  // 初始化栈，存放待遍历的节点，初始为根节点
  const stack = [tree];
  // 当栈不为空时循环
  while (stack.length) {
    // 弹出栈顶节点
    const node = stack.pop();
    // 判断当前节点 id 是否等于目标 id
    if (node.id === id) {
      // 找到目标节点，返回该节点
      return node;
    }
    // 如果当前节点有子节点，则将所有子节点压入栈中
    if (node.children && node.children.length) {
      stack.push(...node.children);
    }
  }
  // 遍历完整棵树未找到目标节点，返回 null
  return null;
}

console.log(findTreeNode(tree, 8));


// 使用cb
function findTreeNode(tree, cb) {
  const queue = [tree];
  while (queue.length) {
    const node = queue.pop();
    if(cb(node)) {
      return node
    }
    if(node.children?.length) {
      queue.push(...node.children);
    }
  }
  return null;
}
console.log(findTreeNode(tree, (node) => node.id === 8));
console.log(findTreeNode(tree, (node) => node.key === 8));
```

### 手写深拷贝，考虑循环引用

```js
function isObject(target) {
  return target !== null && typeof target === "object";
}

function deepClone(data, map = new WeakMap()) {
  if (!isObject(data)) return data;
  if (map.has(data)) return map.get(data);

  const res = Array.isArray(data) ? [] : {};
  map.set(data, res);

  for (let key in data) {
    if (data.hasOwnProperty(key)) {
      res[key] = deepClone(data[key], map);
    }
  }
  return res;
}

const obj = {
  a: [1, 2, 3],
  b: {
    c: [4, 5, 6],
  },
  d: [{ key1: 7 }],
};
const res = deepClone(obj);
console.log(
  "%c [ res ]-33",
  "font-size:13px; background:pink; color:#bf2c9f;",
  res,
);
```

### 手写 getType 函数，获取详细的变量类型

```js
function getType(data) {
  return Object.prototype.toString.call(data).slice(8, -1).toLowerCase();
}
```

### 手写 class 继承

在某网页中，有三种菜单：button menu，select menu，modal menu。

他们的共同特点：

- 都有 `title` `icon` 属性
- 都有 `isDisabled` 方法（可直接返回 `false`）
- 都有 `exec` 方法，执行菜单的逻辑

他们的不同点：

- button menu，执行 `exec` 时打印 `'hello'`
- select menu，执行 `exec` 时返回一个数组 `['item1', 'item2', 'item3']`
- modal menu，执行 `exec` 时返回一个 DOM Element `<div>modal</div>`

请用 ES6 语法写出这三种菜单的 class

```js
class Common {
  title;
  icon;

  constructor(title, icon) {
    this.title = title;
    this.icon = icon;
  }

  isDisabled() {
    return false;
  }

  exec() {
    console.log("something");
  }
}
class ButtonMenu extends Common {
  constructor(title, icon) {
    super(title, icon);
  }
  exec() {
    console.log("hello");
  }
}
class SelectMenu extends Common {
  constructor(title, icon) {
    super(title, icon);
  }
  exec() {
    return ["item1", "item2", "item3"];
  }
}
class ModalMenu extends Common {
  constructor(title, icon) {
    super(title, icon);
  }
  exec() {
    const div = document.createElement("div");
    div.innerText = "modal";
    return div;
  }
}

const a = new ButtonMenu();
const b = new SelectMenu();
const c = new ModalMenu();
a.exec();
const data = b.exec();
console.log(data);
c.exec();
```

### 手写防抖 Debounce

```js
function debounce(fn, delay, immediate) {
  let timer, result;

  function _debounce(...args) {
    if (timer) clearTimeout(timer);
    if (immediate) {
      const nowExe = !timer;
      timer = setTimeout(() => {
        timer = null;
      }, delay);
      if (nowExe) result = fn.apply(this, args);
    } else {
      timer = setTimeout(() => {
        result = fn.apply(this, args);
      }, delay);
    }
    return result;
  }

  _debounce.cancel = function () {
    clearTimeout(timer);
    timer = null;
  };

  return _debounce;
}

function test(a, b) {
  console.log(a, b);
  return a + b;
}
const fn = debounce(test, 1000, true);
fn(1, 2);
fn(3, 4);
fn(5, 6);
```

### 手写截流 Throttle

```js
function throttle(fn, delay) {
  let timer, result;

  function _throttle(...args) {
    if (!timer) {
      timer = setTimeout(() => {
        result = fn.apply(this, args);
        timer = null;
      }, delay);
    }
    return result;
  }

  return _throttle;
}

function test(a, b) {
  console.log(a, b);
  return a + b;
}

const throttleTest = throttle(test, 1000);
throttleTest(1, 2);
throttleTest(3, 4);
throttleTest(5, 6);
```

### 手写 bind

```js
Function.prototype.myBind = function(thisArg, ...args1) {
    const func = this; // 获取原函数

    // 定义绑定函数
    const bound = function(...args2) {
        // 判断是否通过 new 调用
        const isNew = this instanceof bound;
        // 确定 this 值
        const thisBinding = isNew ? this : thisArg;
        // 合并参数并调用原函数
        return func.apply(thisBinding, args1.concat(args2));
    };

    // 继承原函数的原型链
    bound.prototype = Object.create(func.prototype);
    // 可选：保持原型的 constructor 属性
    bound.prototype.constructor = bound;

    return bound;
};
```

```js
Function.prototype.myBind = function (context, ...args) {
  // 1. 检查调用者是否为函数
  if (typeof this !== "function") {
    throw new TypeError(
      "Function.prototype.bind - what is trying to be bound is not callable",
    );
  }

  // 2. 保存原始函数（this指向调用bind的函数）
  const originalFunc = this;

  // 3. 定义返回的绑定函数
  const boundFunc = function (...innerArgs) {
    // 4. 判断是否作为构造函数调用（通过new操作符）
    const isNewOperator = this instanceof boundFunc;

    // 5. 确定执行上下文：如果是new调用，使用新创建的对象，否则使用传入的context
    const thisContext = isNewOperator ? this : context;

    // 6. 执行原始函数并返回结果
    return originalFunc.apply(thisContext, [...args, ...innerArgs]);
  };

  // 7. 维护原型关系（为了new操作符能正常工作）
  if (originalFunc.prototype) {
    // 8. 使用空函数中转避免直接修改boundFunc.prototype影响originalFunc.prototype
    const EmptyFunc = function () {};
    EmptyFunc.prototype = originalFunc.prototype;
    boundFunc.prototype = new EmptyFunc();
  }

  // 9. 返回绑定函数
  return boundFunc;
};

function greet(greeting, punctuation) {
  console.log(greeting + " " + this.name + punctuation);
}

const person = { name: "Alice" };

// 使用原生bind
const boundGreet = greet.bind(person, "Hello");
boundGreet("!"); // 输出: Hello Alice!

// 使用手写myBind
const myBoundGreet = greet.myBind(person, "Hello");
myBoundGreet("!"); // 输出: Hello Alice!

// 测试new操作符
function Person(name) {
  this.name = name;
}
const BoundPerson = Person.myBind(null, "Bob");
const bob = new BoundPerson();
console.log(bob.name); // 输出: Bob
```

### 手写 call 和 apply

```js
Function.prototype.myCall = function (context, ...args) {
  // 1. 检查调用者是否为函数
  if (typeof this !== "function") {
    throw new TypeError(
      "Function.prototype.call - what is trying to be called is not callable",
    );
  }

  // 2. 处理context为null或undefined的情况（非严格模式下会指向全局对象）
  context = context || window;

  // 3. 创建一个唯一的属性键，避免覆盖context原有属性
  const fnKey = Symbol("fn");

  // 4. 将当前函数（this）作为context的方法
  context[fnKey] = this;

  // 5. 调用函数并保存结果
  const result = context[fnKey](...args);

  // 6. 删除临时添加的方法
  delete context[fnKey];

  // 7. 返回函数执行结果
  return result;
};

Function.prototype.myApply = function (context, argsArray) {
  // 1. 检查调用者是否为函数
  if (typeof this !== "function") {
    throw new TypeError(
      "Function.prototype.apply - what is trying to be applied is not callable",
    );
  }

  // 2. 处理context为null或undefined的情况
  context = context || window;

  // 3. 处理argsArray参数（可能为null/undefined）
  argsArray = argsArray || [];

  // 4. 确保argsArray是数组或类数组对象
  if (
    !Array.isArray(argsArray) &&
    !(argsArray instanceof Object && argsArray.length !== undefined)
  ) {
    throw new TypeError("CreateListFromArrayLike called on non-object");
  }

  // 5. 创建一个唯一的属性键
  const fnKey = Symbol("fn");

  // 6. 将当前函数作为context的方法
  context[fnKey] = this;

  // 7. 调用函数并保存结果
  const result = context[fnKey](...argsArray);

  // 8. 删除临时添加的方法
  delete context[fnKey];

  // 9. 返回函数执行结果
  return result;
};

function showInfo(age, profession) {
  console.log(`${this.name}, ${age}, ${profession}`);
}

const person = { name: "Alice" };

// 测试myCall
showInfo.myCall(person, 25, "Engineer"); // 输出: Alice, 25, Engineer

// 测试myApply
showInfo.myApply(person, [25, "Engineer"]); // 输出: Alice, 25, Engineer

// 测试null上下文
function returnThis() {
  return this;
}
console.log(returnThis.myCall(null) === window); // 非严格模式下输出: true
```

### 手写 EventBus 自定义事件

```js
class EventBus {
  constructor() {
    // 初始化事件存储对象，用于保存所有事件及其对应的回调函数
    this.events = {};
  }

  on(eventName, callback) {
    // 注册事件：如果事件不存在则创建空数组，然后将回调添加到数组
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(callback);
  }

  emit(eventName, ...args) {
    // 触发事件：执行对应事件的所有回调，并传递参数
    const callbacks = this.events[eventName];
    if (!callbacks) return; // 无注册事件直接返回

    callbacks.forEach((cb) => {
      // 使用try-catch防止单个回调出错影响其他回调执行
      try {
        cb.apply(this, args);
      } catch (e) {
        console.error(`EventBus执行错误: ${eventName}`, e);
      }
    });
  }

  off(eventName, callback) {
    // 移除事件：若传回调则过滤移除，否则删除整个事件
    const callbacks = this.events[eventName];
    if (!callbacks) return;

    if (!callback) {
      delete this.events[eventName]; // 移除整个事件
    } else {
      // 过滤掉要移除的回调函数
      this.events[eventName] = callbacks.filter((cb) => cb !== callback);
    }
  }

  once(eventName, callback) {
    // 创建一次性回调包装函数
    const wrapper = (...args) => {
      callback.apply(this, args); // 执行原始回调
      this.off(eventName, wrapper); // 执行后立即移除
    };
    this.on(eventName, wrapper); // 注册包装函数
  }
}

const bus = new EventBus();

// 常规订阅
bus.on("alert", (msg) => console.log(msg));

// 一次性订阅
bus.once("update", (data) => console.log("Update:", data));

// 触发事件
bus.emit("alert", "常规通知"); // 输出 "常规通知"
bus.emit("update", "数据1"); // 输出 "Update: 数据1"
bus.emit("update", "数据2"); // 无输出（已自动移除）

// 移除监听
const handler = () => console.log("将被移除");
bus.on("test", handler);
bus.off("test", handler);
```

### 手写数组拍平 Array Flatten
```js
function Flatten(arr, depth = 1) {
  if(!arr.length) return;
  return arr.reduce((acc, cur) => {
    return Array.isArray(cur) && depth > 0 ? [...acc, ...Flatten(cur, depth - 1)] : [...acc, cur]
  }, [])
}
const arr = [1, [2, [3, [4, [5]]]]]
console.log(Flatten(arr, 2))
```

```js
function Flatten(arr) {
  if (!arr.length) return;
  return arr.reduce((acc, cur) => {
    return Array.isArray(cur) ? [...acc, ...Flatten(cur)] : [...acc, cur];
  }, []);
}

const arr = [1, [2, 3], [4, [5], 6]];
const res = Flatten(arr);
console.log(res);
```

### 手写解析 URL 参数为 JS 对象

```js
function parseQueryParams(url = window.location.href) {
  const params = {}; // 1. 创建空对象存储结果
  const queryStart = url.indexOf("?"); // 2. 定位问号位置
  const queryString = queryStart === -1 ? "" : url.substr(queryStart + 1); // 3. 提取查询字符串
  const pairs = queryString.split("&"); // 4. 按 & 分割键值对

  for (const pair of pairs) {
    // 5. 遍历键值对
    if (pair === "") continue; // 6. 跳过空字符串

    // 7. 分割键值（处理多个等号情况）
    let [key, ...rest] = pair.split("=");
    const value = rest.join("=");

    // 8. 解码 + 号和 URI 组件
    key = decodeURIComponent(key.replace(/\+/g, " "));
    const decodedValue = decodeURIComponent(value.replace(/\+/g, " "));

    // 9. 处理重复键名
    if (params.hasOwnProperty(key)) {
      params[key] = [].concat(params[key], decodedValue); // 转为数组
    } else {
      params[key] = decodedValue; // 首次出现直接赋值
    }
  }

  return params; // 10. 返回解析结果
}

const params = parseQueryParams(
  "http://example.com?name=John%20Doe&age=25&hobby=编程&hobby=游泳",
);
console.log(params);
/* 输出：
{
  name: "John Doe",
  age: "25",
  hobby: ["编程", "游泳"]
}
*/
```

### 手写数组去重

```js
const unique = (data) => [...new Set(data)];

const unique = (data) => {
  return data.filter((item, index, self) => self.indexOf(item) === index);
};

const unique = (data) => {
  return data.reduce((acc, cur) => {
    return acc.includes(cur) ? [...acc] : [...acc, cur];
  }, []);
};

const arr = [1, 2, 6, 6, 8, 8];
unique(arr);
```

### 手写红绿灯

模拟一个红绿灯变化，红灯 1 秒，绿灯 1 秒，黄灯 1 秒，然后循环

```js
function light(cb, time = 1000) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      cb();
      resolve();
    }, time);
  });
}

function red() {
  console.log("红色");
}

function green() {
  console.log("绿色");
}

function yellow() {
  console.log("黄色");
}

function start() {
  return Promise.resolve()
    .then(() => {
      return light(red);
    })
    .then(() => {
      return light(green);
    })
    .then(() => {
      return light(yellow);
    })
    .finally(() => {
      return start();
    });
}

start();
```

### 手写 Promise

```js
class MyPromise {
  // 构造方法
  constructor(executor) {
    // 初始化值
    this.initValue();
    // 初始化this指向
    this.initBind();
    // 执行传进来的函数
    executor(this.resolve, this.reject);
  }

  initBind() {
    // 初始化this
    this.resolve = this.resolve.bind(this);
    this.reject = this.reject.bind(this);
  }

  initValue() {
    // 初始化值
    this.PromiseResult = null; // 终值
    this.PromiseState = "pending"; // 状态
  }

  resolve(value) {
    // 如果执行resolve，状态变为fulfilled
    this.PromiseState = "fulfilled";
    // 终值为传进来的值
    this.PromiseResult = value;
  }

  reject(reason) {
    // 如果执行reject，状态变为rejected
    this.PromiseState = "rejected";
    // 终值为传进来的reason
    this.PromiseResult = reason;
  }
}
```

### 手写 Promise.all

Promise.all接收一个包含多个Promise的数组，当所有Promise都成功时，返回一个包含所有结果的数组；如果其中一个失败，就立即拒绝

```js
static all(promises) {
  return new MyPromise((resolve, reject) => {
    const result = [];
    let count = 0;

    // 处理空数组情况
    if (promises.length === 0) {
      resolve(result);
      return;
    }

    const processItem = (index, item) => {
      // 处理 thenable 对象（包括所有 Promise 类型）
      if (item && (typeof item === 'object' || typeof item === 'function')) {
        const then = item.then;
        if (typeof then === 'function') {
          then.call(
            item,
            res => processItem(index, res),  // 递归解析可能嵌套的 thenable
            reject
          );
          return;
        }
      }

      // 基础值或非 thenable 对象
      result[index] = item;
      if (++count === promises.length) resolve(result);
    };

    promises.forEach((promise, index) => {
      processItem(index, promise);
    });
  });
}
```

### 手写 Promise.race

Promise.race 接收一个可迭代对象（通常是数组），返回一个新的 Promise，这个 Promise 的状态由第一个完成的 Promise 决定。

```js
static race(promises) {
  // 返回一个新的 Promise 实例
  return new MyPromise((resolve, reject) => {
    // 检查传入的是否是可迭代对象
    if (!promises || typeof promises[Symbol.iterator] !== 'function') {
      // 如果参数不可迭代，立即 reject 并返回
      return reject(new TypeError('Argument is not iterable'));
    }

    // 标记是否已有 Promise 完成
    let isSettled = false;

    // 遍历所有传入的 Promise 或值
    for (const item of promises) {
      // 将每个元素转换为 Promise（兼容普通值和其他 Promise 实现）
      MyPromise.resolve(item).then(
        // 成功回调
        (value) => {
          if (!isSettled) {
            isSettled = true;
            resolve(value); // 第一个成功的 Promise 触发 resolve
          }
        },
        // 失败回调
        (reason) => {
          if (!isSettled) {
            isSettled = true;
            reject(reason); // 第一个失败的 Promise 触发 reject
          }
        }
      );
    }
  });
}
```

### 手写 Promise.allSettled

Promise.allSettled 会等待所有 Promise 完成（无论成功或失败），返回一个包含所有结果的对象数组。

```js
static allSettled(promises) {
  // 返回一个新的 Promise 实例
  return new MyPromise((resolve, reject) => {
    // 检查传入的是否是可迭代对象
    if (!promises || typeof promises[Symbol.iterator] !== 'function') {
      // 如果参数不可迭代，立即 reject 并返回类型错误
      return reject(new TypeError('Argument is not iterable'));
    }

    // 如果传入空数组，立即 resolve 空数组
    if (promises.length === 0) {
      return resolve([]);
    }

    // 结果数组，保持原始顺序
    const results = new Array(promises.length);
    // 计数器，记录已处理的 Promise 数量
    let settledCount = 0;

    // 处理每个 Promise 的结果
    const processResult = (index, value, status) => {
      // 根据状态构造结果对象
      results[index] = status === 'fulfilled'
        ? { status: 'fulfilled', value }
        : { status: 'rejected', reason: value };

      // 增加计数器
      settledCount++;

      // 当所有 Promise 都处理完毕时 resolve 结果数组
      if (settledCount === promises.length) {
        resolve(results);
      }
    };

    // 遍历所有 Promise
    promises.forEach((promise, index) => {
      // 将值转换为 Promise 以统一处理
      MyPromise.resolve(promise)
        .then(
          // 成功回调
          value => processResult(index, value, 'fulfilled'),
          // 失败回调
          reason => processResult(index, reason, 'rejected')
        );
    });
  });
}
```

### 手写一个 LazyMan 实现 sleep 机制

```js
LazyMan("Tony").eat("breakfast").sleep(3).eat("lunch").sleep(1).eat("dinner");
// 输出:
// Hi I am Tony
// I am eating breakfast
// 等待3秒...
// I am eating lunch
// 等待1秒...
// I am eating dinner
```

```js
function LazyMan(name) {
  // 创建实例对象，维护任务队列
  const instance = {
    tasks: [], // 任务队列，存储待执行的任务函数
  };

  // 初始任务：输出名字，并返回一个已解决的Promise保证链式执行
  const initTask = () => {
    console.log(`Hi I am ${name}`);
    return Promise.resolve();
  };
  instance.tasks.push(initTask); // 将初始任务加入队列

  // 使用setTimeout将任务队列的执行放入事件循环的下一个周期
  // 确保所有同步链式调用的任务都添加到队列后再开始执行
  setTimeout(() => {
    // 通过reduce链式调用Promise，实现任务顺序执行
    instance.tasks.reduce((prevPromise, task) => {
      // 将任务按顺序串联起来，前一个任务完成后再执行下一个
      return prevPromise.then(() => task());
    }, Promise.resolve()); // 初始Promise，开始执行队列
  }, 0);

  // 定义eat方法，接受食物名称并添加到任务队列
  instance.eat = function (food) {
    this.tasks.push(() => {
      console.log(`I am eating ${food}`);
      return Promise.resolve(); // 同步任务立即解决
    });
    return this; // 返回实例，支持链式调用
  };

  // 定义sleep方法，延迟指定时间后继续执行
  instance.sleep = function (seconds) {
    this.tasks.push(() => {
      // 返回一个Promise，在指定时间后解决
      return new Promise((resolve) => {
        setTimeout(() => {
          console.log(`等待${seconds}秒...`);
          resolve(); // 延迟结束后解决Promise，继续后续任务
        }, seconds * 1000); // 转换为毫秒
      });
    });
    return this; // 返回实例，支持链式调用
  };

  // 返回实例对象，使其能够调用方法
  return instance;
}
LazyMan("Tony").eat("breakfast").sleep(3).eat("lunch").sleep(1).eat("dinner");
```

### 手写 curry 函数，实现函数柯里化

```js
/**
 * 函数柯里化封装工具
 * @param {Function} func 需要被柯里化的原函数
 * @returns {Function} 柯里化后的新函数
 */
function curry(func) {
  /**
   * 柯里化包装函数
   * @param {...any} args 累计传入的参数
   */
  return function curried(...args) {
    // 检查已收集的参数是否满足原函数参数个数
    if (args.length >= func.length) {
      // 参数足够：执行原函数并返回结果
      // 使用 apply 以保持正确的 this 指向
      return func.apply(this, args);
    } else {
      // 参数不足：返回新函数继续收集参数
      // 新函数会合并历史参数和新参数
      return function (...args2) {
        // 递归调用 curried 函数，合并参数列表
        // 使用 apply 保持链式调用的 this 上下文
        return curried.apply(this, args.concat(args2));
      };
    }
  };
}

// 原始加法函数
function sum(a, b, c) {
  return a + b + c;
}

// 生成柯里化版本
const curriedSum = curry(sum);

// 典型链式调用
console.log(curriedSum(1)(2)(3)); // 6

// 混合参数调用
console.log(curriedSum(1, 2)(3)); // 6

// 最终立即执行
console.log(curriedSum(1)(2, 3)); // 6
```

### 手写 compose 函数

compose 函数是函数式编程中的一个重要概念，它将多个函数组合成一个函数，从右到左执行。

```js
/**
 * 组合多个函数，从右到左执行。例如 compose(f, g, h) 等价于 (...args) => f(g(h(...args)))
 * @param {...Function} fns 要组合的函数列表
 * @returns {Function} 组合后的新函数
 */
const compose = (...fns) => {
  // 边界情况处理：如果没有传入任何函数，返回一个 identity 函数（直接返回参数）
  if (fns.length === 0) {
    return (arg) => arg;
  }

  // 边界情况处理：如果只传入一个函数，直接返回该函数
  if (fns.length === 1) {
    return fns[0];
  }

  /**
   * 核心实现：通过 reduceRight 从右到左遍历函数列表
   * prevFn：已组合的前序函数
   * currentFn：当前遍历到的函数
   * 返回值：一个新的组合函数，将当前函数包裹在外层
   */
  return fns.reduceRight(
    (prevFn, currentFn) =>
      // 每次返回一个新函数，该函数将参数传递给前序函数，再将结果传递给当前函数
      (...args) =>
        currentFn(prevFn(...args)),
    // 初始值为 identity 函数，保证第一个执行的函数（最右侧）能接收原始参数
    (x) => x,
  );
};

// 测试 1：数学计算
const add = (a, b) => a + b;
const square = (x) => x * x;
const double = (x) => x * 2;

const mathComposed = compose(double, square, add);
console.log(mathComposed(2, 3)); // 输出：50（add(5) → square(25) → double(50)）

// 测试 2：字符串处理
const greet = (name) => `Hello, ${name}!`;
const exclaim = (str) => str + "!!!";
const lower = (str) => str.toLowerCase();

const strComposed = compose(lower, exclaim, greet);
console.log(strComposed("Alice")); // 输出："hello, alice!!!!"

// 测试 3：空函数情况
const identity = compose();
console.log(identity(5)); // 输出：5
```

### 使用 Vue3 Composable 组合式函数，实现 useCount
```js
const { count } = useCount() // count 初始值是 0 ，每一秒 count 加 1
```


```js
import { ref, onMounted, onUnmounted } from 'vue'

export function useCount() {
  const count = ref(0)
  let timer = null

  // 开始计数
  const startCount = () => {
    timer = setInterval(() => {
      count.value++
    }, 1000)
  }

  // 组件挂载时开始计数
  onMounted(() => {
    startCount()
  })

  // 组件卸载时清除定时器
  onUnmounted(() => {
    if (timer) {
      clearInterval(timer)
    }
  })

  return {
    count,
  }
}
```

### 使用 Vue3 Composable 组合式函数，实现 useRequest

```js
const { loading, data, error } = useRequest(url) // 可只考虑 get 请求
```

```js
import { ref } from 'vue'

export function useRequest(url) {
  const data = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const fetchData = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      data.value = await response.json()
    } catch (e) {
      error.value = e
    } finally {
      loading.value = false
    }
  }

  // 立即执行请求
  fetchData()

  return {
    data,
    loading,
    error,
  }
}
```

### 使用 React Hook 实现 useCount

```js
// count 从 0 计数，每一秒 +1 （可使用 setInterval）
const { count } = useCount()
```
```js
import { useState, useEffect } from 'react'

function useCount() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCount((prev) => prev + 1)
    }, 1000)

    // 清理函数，组件卸载时清除定时器
    return () => clearInterval(timer)
  }, [])

  return { count }
}

export default useCount
```

### 使用 React Hook 实现 useRequest
```js
const { loading, data, error } = useRequest(url) // 可只考虑 get 请求
```

```js
import { useState, useEffect } from 'react'

function useRequest(url) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const result = await response.json()
        setData(result)
      } catch (e) {
        setError(e)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [url])

  return { data, loading, error }
}

export default useRequest
```

### 手写 VNode 对象，表示如下 DOM 节点

```html
<div class="container">
  <img src="x1.png" />
  <p>hello</p>
</div>
```

```js
const vnode = {
  tag: "div",
  props: {
    class: "container",
  },
  children: [
    {
      tag: "img",
      props: {
        src: "x1.png",
      },
    },
    {
      tag: "p",
      props: {},
      children: ["hello"],
    },
  ],
};
```


### 手写一个 LRU 缓存

```js
/**
 * LRU 缓存实现：最近最少使用缓存策略，当缓存满时淘汰最久未使用的数据
 * 使用哈希表（快速查找） + 双向链表（维护访问顺序）实现
 */
class LRUCache {
  constructor(capacity) {
    // 缓存容量限制
    this.capacity = capacity;
    // 哈希表用于O(1)时间复杂度查找键
    this.cacheMap = new Map();
    // 链表虚拟头节点（方便操作）
    this.dummyHead = new Node(null, null);
    // 链表虚拟尾节点
    this.dummyTail = new Node(null, null);
    // 初始化空链表
    this.dummyHead.next = this.dummyTail;
    this.dummyTail.prev = this.dummyHead;
  }

  /**
   * 获取缓存值，并更新节点到链表头部（表示最近使用）
   */
  get(key) {
    if (!this.cacheMap.has(key)) return -1;

    const node = this.cacheMap.get(key);
    // 将节点移动到链表头部
    this.moveToHead(node);
    return node.value;
  }

  /**
   * 添加缓存，如果已存在则更新值并移动到头部
   * 超过容量时删除链表尾节点
   */
  put(key, value) {
    if (this.cacheMap.has(key)) {
      // 存在则更新值并移动
      const node = this.cacheMap.get(key);
      node.value = value;
      this.moveToHead(node);
    } else {
      // 创建新节点并添加到头部
      const newNode = new Node(key, value);
      this.cacheMap.set(key, newNode);
      this.addToHead(newNode);

      // 检查容量，超过则删除尾节点
      if (this.cacheMap.size > this.capacity) {
        const tailNode = this.removeTail();
        this.cacheMap.delete(tailNode.key);
      }
    }
  }

  /**
   * 将节点移动到链表头部（分两步：删除原位置 + 插入头部）
   */
  moveToHead(node) {
    this.removeNode(node);   // 从原位置删除
    this.addToHead(node);    // 插入到头部
  }

  /**
   * 从链表中删除指定节点
   */
  removeNode(node) {
    node.prev.next = node.next; // 前节点的next指向后节点
    node.next.prev = node.prev; // 后节点的prev指向前节点
  }

  /**
   * 在链表头部插入节点（插入到虚拟头节点之后）
   */
  addToHead(node) {
    node.prev = this.dummyHead;      // 新节点prev指向虚拟头
    node.next = this.dummyHead.next; // 新节点next指向原第一个节点
    this.dummyHead.next.prev = node; // 原第一个节点的prev指向新节点
    this.dummyHead.next = node;      // 虚拟头的next指向新节点
  }

  /**
   * 删除链表尾节点（最久未使用的节点）
   */
  removeTail() {
    const tailNode = this.dummyTail.prev; // 获取真实尾节点
    this.removeNode(tailNode);            // 删除节点
    return tailNode;                      // 返回被删除的节点
  }
}

/**
 * 双向链表节点类
 */
class Node {
  constructor(key, value) {
    this.key = key;    // 用于删除尾节点时同步删除Map中的键
    this.value = value; // 存储的值
    this.prev = null;   // 前驱指针
    this.next = null;   // 后继指针
  }
}

/* 实现思路说明：
   1. 数据结构选择：
      - 哈希表：实现O(1)时间复杂度的键值查找
      - 双向链表：维护访问顺序，头部是最新访问的节点，尾部是最久未使用的节点

   2. 关键操作：
      - get操作：通过哈希表快速定位节点，并将节点移动到链表头部
      - put操作：
        a. 已存在：更新值并移动节点到头部
        b. 不存在：创建新节点，添加到链表头部，若超过容量则删除尾节点

   3. 链表操作细节：
      - 使用虚拟头尾节点简化边界条件处理
      - 移动节点时先删除后插入
      - 删除尾节点时同步清理哈希表

   4. 时间复杂度：
      - 所有操作（get/put）都保持O(1)时间复杂度
*/
```
关键点解释：

双向链表维护访问顺序：最近访问的节点始终保持在链表头部，尾节点是最久未使用的

虚拟头尾节点简化链表操作：避免处理null指针等边界情况

哈希表快速定位节点：实现O(1)时间的查找操作

节点移动策略：每次访问（get/put）都将节点移动到头部，保证链表顺序反映访问时间顺序

容量控制：插入新节点时检查容量，超过则删除尾节点并同步清理哈希表

示例使用：
```js
const cache = new LRUCache(2);
cache.put(1, 1);
cache.put(2, 2);
cache.get(1);       // 返回 1，此时键1变为最近使用
cache.put(3, 3);    // 插入键3，容量已满，淘汰最久未使用的键2
cache.get(2);       // 返回 -1（已被淘汰）
```
