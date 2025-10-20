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

