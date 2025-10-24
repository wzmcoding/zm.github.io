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
异步更新的主要原因是为了避免数据频繁变化导致的性能问题。
如果每次数据变化都立即更新DOM,在短时间内多次修改相同数据会导致不必要的DOM操作。

### 异步更新的优点
- 将多次数据更新合并成一次DOM更新
- 避免不必要的计算和DOM操作
- 确保所有数据变更完成后再更新视图
- 提供更稳定的DOM更新结果

那如果是异步的，如何获取到更新后的视图状态？

使用 `nextTick` 函数

```typescript
const count = ref(0)

count.value++
nextTick(() => {
  // 此处可以获取到绑定了 count 的最新的 DOM 状态
})
```
异步更新机制就像一个“批处理”系统，它会将一段时间内的所有数据变更缓存起来，然后统一进行处理，这样既保证了性能，又维护了数据的一致性。

## 3. 组件设计需要考虑哪些？
封装一个公用组件时，主要需要考虑以下几点：
1. 通用性：
  - 组件的设计需要足够细致，保证在不同场景下都能通用。
  - 提炼核心功能，避免组件过于特定于某个业务场景。

2. 清晰的 API 设计：
  - 定义明确的 props、事件、插槽等接口，让其他团队成员可以快速理解每个参数的用意。
  - 考虑默认值、类型校验和必要的错误提示，降低使用难度。

3. 可定制性：
  - 提供简洁的扩展接口或者通过样式、插槽等方式允许自定义内部行为和样式。
  - 保证在不修改组件内部实现的前提下，实现自定义效果。

4. 内部逻辑和状态管理：
  - 尽量将组件内部的状态和逻辑封装起来，仅向外暴露必要的接口。
  - 处理好异步数据，事件绑定等问题，防止组件过于臃肿。

5. 兼容性与扩展性：
  - 考虑到版本更新和未来扩展，设计时尽量减少对外部组件的依赖或者耦合。
  - 通过合理的封装模式，方便后续维护和升级。

6. 性能优化：
  - 考虑组件中多次渲染时的性能问题，如合理使用防抖、节流、缓存等。
  - 根据具体需求选择合适的渲染方式，确保组件在复杂场景下依然高效。

7. 可维护性和文档：
  - 提供清晰的文档和使用示例，便于团队成员理解组件逻辑和调用方式。
  - 定期整理代码和注释，确保组件在多人协作环境下易于维护。

## 4. 二次封装组件需要考虑哪些？




## 5. 前端路由的工作原理
### 路由模式





## 6. Vue3父子组件生命周期执行顺序



