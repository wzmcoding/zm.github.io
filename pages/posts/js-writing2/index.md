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