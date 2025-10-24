---
title: Vue
date: 2025-10-24
updated: 2025-10-24
categories: Vue
tags:
  - Vue
top: 1
---

# Vue
## 1. Vue的响应式原理
```typescript
type EffectFN = () => void

let activeEffect: EffectFN | null

export function effect(fn: EffectFN) {
    // 在 fn 执行之前，将 fn 赋值给 activeEffect， 确保在 get 中可以收集到依赖
    activeEffect = fn
    fn()
    // 执行完 fn 后，将 activeEffect 置为 null, 避免后续的 get 操作收集到错误的依赖
    activeEffect = null
}


class RefImpl<T> {
    _value: T
    // 保存所有的订阅者
    effects = new Set<EffectFN>()
    constructor(val: T) {
        this._value = val
    }

    get value() {
        if (activeEffect) {
            // 如果当前有 activeEffect, 表示有依赖需要收集
            this.effects.add(activeEffect)
        }
        return this._value
    }
    set value(newValue) {
        this._value = newValue
        // 更新完成后，执行所有的订阅者
        this.effects.forEach((effect: EffectFN) => effect())
    }
}


export function ref<T>(val: T) {
    return new RefImpl(val)
}

const count = ref<number>(0)
effect(() => {
    console.log('effect 运行了', count.value)
})

setTimeout(() => {
    count.value++ // 会重新执行 effect
}, 1000)
```

1. 初始化阶段：
  - 创建响应式数据： `const count = ref(0)`, 实例化一个RefImpl对象
  - 此时 `count.effects` 为空

2. 依赖收集阶段：
  - 调用 `effect(() => { console.log('effect 运行了', count.value) })`
  - `effect` 函数将传入的函数赋值给 `activeEffect`
  - 执行 `fn()`，其中访问了 `count.value`
  - 触发 `RefImpl`的 `get value()`访问器
  - 由于此时`activeEffect`存在，将其添加到 `count.effects` 集合中
  - 返回 `_value`值并打印
  - 执行完毕后， `activeEffect` 被重置为 null`

3. 更新触发阶段：
  - 1秒后，执行 `count.value++`
  - 触发 `RefImpl`的 `set value()`访问器
  - 更新 `_value`值
  - 遍历 `count.effects` 集合中的所有函数并执行
  - 再次打印更新后的值

## 2. Vue为什么采用异步更新视图？





### 为什么要异步更新？





### 异步更新的优点




## 3. 组件设计需要考虑哪些？




## 4. 二次封装组件需要考虑哪些？




## 5. 前端路由的工作原理
### 路由模式





## 6. Vue3父子组件生命周期执行顺序



