---
title: 手写常见js代码
date: 2025-04-21
updated: 2025-04-21
categories: js手写
tags:
  - js手写
top: 1
---

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

function blue() {
  console.log("蓝色");
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
      return light(blue);
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

```

### 手写 compose 函数

compose 函数是函数式编程中的一个重要概念，它将多个函数组合成一个函数，从右到左执行。

```js

```

### 手写一个 LRU 缓存

```js

```

### 使用 Vue3 Composable 组合式函数，实现 useCount

```js

```

### 使用 Vue3 Composable 组合式函数，实现 useRequest

```js

```

### 使用 React Hook 实现 useCount

```js

```

### 使用 React Hook 实现 useRequest

```js

```

### 手写 VNode 对象，表示如下 DOM 节点

```html
<div class="container">
  <img src="x1.png" />
  <p>hello</p>
</div>
```

```js

```
