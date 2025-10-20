---
title: 手写常见js代码
date: 2025-10-20
updated: 2025-10-20
categories: js手写
tags:
  - js手写
top: 1
---

## 数组去重
```typescript
// 1. Set
export function unique<T>(...arr: T[]): T[] {
    return [...new Set(arr)]
}

// 2. 使用 include 方法(性能差)  O(n^2)
export function unique2<T>(...arr: T[]): T[] {
    const newArr: T[] = []
    for (const item of arr) {
        // 每个元素都会执行 includes 方法, 如果数组长度为 n, 那么每个元素都会执行 n 次 includes 方法
        if (!newArr.includes(item)) {
            newArr.push(item)
        }
    }
    return newArr
}

// 3. 对象数组根据某个属性去重
export function unique3<T>(arr: T[], key: keyof T): T[] {
    const map = new Map<T[keyof T], T>()

    for (const item of arr) {
        if (!map.has(item[key])) {
            map.set(item[key], item)
        }
    }

    return [...map.values()]
}

// 或者
export const unique4 = <T>(arr: T[], key: keyof T): T[] => {
    const map = new Map<T[keyof T], Boolean>()
    return arr.filter(item => !map.has(item[key]) && map.set(item[key], true))
}

// 更通用的写法
export const unique5 = <T>(arr: T[], fn: (item: T) => T[keyof T]): T[] => {
    const map = new Map<T[keyof T], Boolean>()
    return arr.filter(item => !map.has(fn(item)) && map.set(fn(item), true))
}
```

## 发布订阅
```typescript
export type CB = (...args: any[]) => void

class EventBus {
    events: Record<string, Set<CB>> = {}

    on(eventName: string, cb: CB) {
        // if(!this.events[eventName]) {
        //     this.events[eventName] = new Set()
        // } else {
        //     this.events[eventName] = this.events[eventName].add(cb)
        // }
        (this.events[eventName] ??= new Set()).add(cb)
    }

    emit(eventName: string, ...args: any[]) {
        this.events[eventName]?.forEach((cb: CB) => cb(...args))
    }

    off(eventName: string, cb: CB) {
        this.events[eventName]?.delete(cb)
    }

    once(eventName: string, cb: CB) {
        const handler = (...args: any[]) => {
            cb(...args)
            this.off(eventName, handler)
        }
        this.on(eventName, handler)
    }
}

export const bus = new EventBus()
```

## 函数柯里化
```typescript
export function curry<T = any>(fn: (...args: T[]) => T): any {
    // 获取原函数的形参长度
    const arity = fn.length
    // 递归柯里化函数
    function _curried<T = any>(...args: T[]): any {
        return function (...nextArgs: T[]): any {
            const allArgs = [...args, ...nextArgs] as any[]
            // 如果参数够了，就执行；否则就返回新的柯里化函数
            if (allArgs.length >= arity) {
                return fn.apply(this, allArgs)
            } else {
                return _curried(...allArgs)
            }
        }
    }

    return _curried
}

// 测试用例
console.log(curry(function (a: number, b: number, c: number) {
    return a + b + c
})(1)(2)(3))
// 其它测试用例
console.log(curry(function (a: number, b: number) {
    return a + b
})(1)(2))
```

## 数组转树
```typescript
export function arrayToTree<T = any[]>(arr: T[]) {
    // 用于存储 id -> 节点的映射， O（1）查找任意节点
    const map = new Map<number, any>()
    // 保存根节点引用
    let root: any = null
    // 第一遍： 创建所有节点对象，并挂进map
    arr.forEach((item: any) => {
        // 每个节点初始化 children 数组
        map.set(item.id, { ...item, children: [] })
        // 如果是根节点，记下来
        if (item.parentId === null) {
            root = map.get(item.id)
        }
    })
    // // 第二遍： 建立父子关系
    arr.forEach((item: any) => {
        // 当前节点
        const node = map.get(item.id)
        // 父节点, 可能为 undefined
        const parent = map.get(item.parentId)
        if (parent) {
            // 将当前节点挂到父节点的 children 上
            parent.children.push(node)
        }
    })
    // 返回根节点
    return root
}

// 测试用例1: 标准组织结构数据
export const arr1 = [
    { id: 1, name: '公司', parentId: null },
    { id: 2, name: '技术部', parentId: 1 },
    { id: 3, name: '市场部', parentId: 1 },
    { id: 4, name: '前端组', parentId: 2 },
    { id: 5, name: '后端组', parentId: 2 },
    { id: 6, name: 'UI设计', parentId: 4 },
    { id: 7, name: 'React开发', parentId: 4 },
    { id: 8, name: '数字营销', parentId: 3 },
    { id: 9, name: '品牌推广', parentId: 3 }
];
// 结果
const result =
{
    "id": 1,
    "name": "公司",
    "parentId": null,
    "children": [
        {
            "id": 2,
            "name": "技术部",
            "parentId": 1,
            "children": [
                {
                    "id": 4,
                    "name": "前端组",
                    "parentId": 2,
                    "children": [
                        {
                            "id": 6,
                            "name": "UI设计",
                            "parentId": 4,
                            "children": []
                        },
                        {
                            "id": 7,
                            "name": "React开发",
                            "parentId": 4,
                            "children": []
                        }
                    ]
                },
                {
                    "id": 5,
                    "name": "后端组",
                    "parentId": 2,
                    "children": []
                }
            ]
        },
        {
            "id": 3,
            "name": "市场部",
            "parentId": 1,
            "children": [
                {
                    "id": 8,
                    "name": "数字营销",
                    "parentId": 3,
                    "children": []
                },
                {
                    "id": 9,
                    "name": "品牌推广",
                    "parentId": 3,
                    "children": []
                }
            ]
        }
    ]
}
```

## 防抖
```typescript
/**
 * 作用：在一定时间内，多次触发同一个函数，只执行最后一次
 * 适用场景： 搜索框输入、窗口resize等频繁触发的事件
 * @param fn - 需要防抖的函数
 * @param delay - 延迟时间，默认300ms
 * @returns - 防抖后的函数
 */
export function debounce<T = any>(fn: (...args: T[]) => T, delay: number = 300): (...args: T[]) => void {
    let timer: ReturnType<typeof setTimeout> | null = null
    return function (...args: T[]): void {
        if (timer) {
            clearTimeout(timer)
        }
        timer = setTimeout(() => {
            fn.apply(this, args)
        }, delay)
    }
}

// 正常情况，我们是不能拿到防抖函数的返回值的，因为它是异步的，如果需要拿到返回值，可以使用 Promise 包装一下
export function debounceWithPromise<T = any>(fn: (...args: T[]) => T, delay: number = 300): (...args: T[]) => Promise<T> {
    let timer: ReturnType<typeof setTimeout> | null = null
    return function (...args: T[]): Promise<T> {
        if (timer) {
            clearTimeout(timer)
        }
        // 返回一个 Promise 来记录结果
        return new Promise((resolve: any, reject: any) => {
            timer = setTimeout(() => {
                try {
                    const res = fn.apply(this, args)
                    resolve(res) // 执行成功， resolve 函数的返回值
                } catch (error) {
                    reject(error) // 执行期间报错，reject
                }
            }, delay)
        })
    }
}

// 防抖
const debounce = debounceWithPromise(function (a: number, b: number) {
    console.log('debounce->', a, b)
    return a + b
}, 1500)
setTimeout(() => {
    debounce(1, 1)
    debounce(2, 2)
    const res = debounce(1, 2)
    res.then((result: unknown) => {
        console.log('debounce result->', result)
    })
}, 1000)
```

## 节流
```typescript
/**
 * 作用：在一定时间内，多次触发同一个函数，只触发一次
 * 适用场景： 
 * @param fn - 需要节流的函数
 * @param delay - 延迟时间，默认300ms
 * @returns - 节流后的函数
 */
export function throttle<T = any>(fn: (...args: T[]) => T, delay: number = 300): (...args: T[]) => Promise<T> {
    let timer: ReturnType<typeof setTimeout> | null = null
    return function (...args: T[]): Promise<T> {
        return new Promise((resolve, reject) => {
            if (!timer) {
                timer = setTimeout(() => {
                    try {
                        const res = fn.apply(this, args)
                        timer = null
                        resolve(res)
                    } catch (error) {
                        reject(error)
                    }
                }, delay)
            }
        })
    }
}

const throttleFn = throttle(function (a: number, b: number) {
    console.log('throttle->', a, b)
    return a + b
}, 1500)
setTimeout(() => {
    const res = throttleFn(1, 1)
    throttleFn(2, 2)
    throttleFn(1, 2)
    res.then((result: unknown) => {
        console.log('throttle result->', result)
    })
}, 1000)
```

## sleep 函数
```typescript
/**
 * 使用场景： 在异步函数中延迟一段时间再执行
 */
export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fn() {
    await sleep(2000)
    console.log('2秒后执行')
}
```

## 手写instanceof
```typescript
export function myInstanceof(target: any, constructor: any): boolean {
    if (typeof target !== 'object' || target === null) {
        // 检查 target 是否为对象类型且不为 null， 如果不是，则返回 false
        return false
    }
    // 获取 constructor 的原型对象
    const prototype = constructor.prototype
    // 获取 target 的原型对象
    let proto = Object.getPrototypeOf(target)
    // 沿着原型链向上查找
    while (proto) {
        // 找到了 constructor 的原型对象
        if (proto === prototype) {
            return true
        }
        // 继续向上查找
        proto = Object.getPrototypeOf(proto)
    }
    // 到达原型链顶端，返回 false
    return false
}
// 测试用例
class Person { }
class Student extends Person { }
const student = new Student()
console.log('myInstanceof', myInstanceof(student, Student)) // true
console.log('myInstanceof', myInstanceof(student, Person)) // true
console.log('myInstanceof', myInstanceof(student, Array)) // false
```

## deepClone 支持循环引用
```typescript
/* eslint-disable @typescript-eslint/no-explicit-any */
export function deepClone<T = any>(obj: any, map = new WeakMap()): T {
    // 基本类型或者 null 直接返回
    if (obj === null || typeof obj !== 'object') {
        return obj
    }
    // 如果当前对象已拷贝过，直接返回它的副本， 避免无限递归
    if (map.has(obj)) {
        return map.get(obj)
    }
    let cloneObj: any
    if (obj instanceof Date) {
        cloneObj = new Date(obj)
    } else if (obj instanceof RegExp) {
        cloneObj = new RegExp(obj.source, obj.flags)
    }
    else {
        // 根据被拷贝对象的类型（数组/普通对象）创建对应的容器
        cloneObj = Array.isArray(obj) ? [] : {}
        // 将 [原对象 => 副本] 存入 WeakMap 中，避免循环引用
        map.set(obj, cloneObj)

        // 遍历对象所有自身属性
        Reflect.ownKeys(obj).forEach(key => {
            cloneObj[key] = deepClone(obj[key], map)
        })
    }
    return cloneObj
}

// 测试用例
const obj: any = {
    a: {
        b: {
            c: 1
        },
        d: new Date(),
        e: /abc/g,
    },
}
obj.a['f'] = obj // 创建循环引用
console.log('deepClone', deepClone(obj))
```

## 实现 Promise.allSettled
```typescript
export function allSettled<T>(promises: Promise<T>[] | any): Promise<any> {
    // 先转换为数组，防止传入非数组(如 Set,arguments)
    promises = [...promises]
    // 如果是空数组，立即 resolve 空结果数组
    if (promises.length === 0) {
        return Promise.resolve([])
    }
    return new Promise((resolve) => {
        // 用于统计已处理的 promise 个数， 无论成功还是失败
        let count = 0
        // 存放每个输入对应的结果对象 { status: 'fulfilled' | 'rejected', value | reason  }
        const results: any[] = []

        promises.forEach((p: T, i: number) => {
            // 遍历每个输入，保留原始顺序下标 i
            Promise.resolve(p) // 强制转换为 Promise（防止非 Promise 输入）
                .then(value => {
                    // 成功时， 填充对应位置的结果为 fulfilled
                    results[i] = { status: 'fulfilled', value }
                }).catch(reason => {
                    // 失败时， 填充对应位置的结果为 rejected
                    results[i] = { status: 'rejected', reason }
                }).finally(() => {
                    // 不论成功或失败都会执行
                    count++
                    if (count === promises.length) {
                        resolve(results)
                    }
                })
        })
    })
}

// 测试用例
const promise1 = Promise.resolve(3)
const promise2 = 42
const promise3 = new Promise((resolve) => {
    setTimeout(resolve, 100, 'foo')
})
const promises = [promise1, promise2, promise3]
allSettled(promises).then((results) => {
    console.log('Promise.allSettled->', results)
})
```

## 实现 LazyMan
```typescript

class LazyManImpl {
    tasks: (() => void)[]
    constructor(name: string) {
        this.tasks = [] // 初始化任务队列，用来按顺序执行任务
        const task = () => {
            console.log(`Hi, I am ${name}`)
            this.next()  // 执行完当前任务后，触发下一个任务
        }
        this.tasks.push(task)
        // 异步启动任务队列，确保链式调用的方法已全部入队
        setTimeout(() => { this.next() })
    }
    next() {
        // 获取下一个任务
        const task = this.tasks.shift()
        if (task) {
            task()
        }
    }

    sleep(time: number) {
        const task = () => {
            setTimeout(() => {
                console.log(`睡了${time}秒`)
                this.next()
            }, time * 1000)
        }
        this.tasks.push(task)
        return this
    }

    eat(food: string) {
        const task = () => {
            console.log(`吃${food}`)
            this.next()
        }
        this.tasks.push(task)
        return this
    }

    sleepFirst(time: number) {
        const task = () => {
            setTimeout(() => {
                console.log(`睡了${time}秒`)
                this.next()
            }, time * 1000)
        }
        this.tasks.unshift(task)
        return this
    }
}
export function LazyMan(name: string) {
    return new LazyManImpl(name)
}
// 测试用例
// console.log('LazyMan->', LazyMan('zm').sleep(2).eat('午饭').sleepFirst(1).sleep(3).eat('晚饭'))
```