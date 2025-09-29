---
title: provide 和 inject
date: 2025-09-28
updated: 2025-09-29
categories: 手写Vue3源码之组件篇
tags:
  - 手写Vue3源码之组件篇
top: 1
---

## provide 和 inject
- `provide` 和 `inject` 允许祖先组件向其所有子孙后代组件注入一个依赖，而不管组件层级有多深。我们一般会用它来进行祖先组件和后代组件之间的通信。
- `provide` 和 `inject` 的实现原理是基于原型链的。
```javascript
const parent = {
  foo: 'foo',
}
const child = Object.create(parent)
console.log(child.foo) // 'foo'
```
上面代码中 `child` 通过 `Object.create` 创建了一个对象，并将 `parent` 作为它的原型对象。这样 `child` 就可以访问到 `parent` 上的属性 `foo`。这就是原型链的基本概念。
但是如果我们在 `child` 上定义一个同名属性 `foo`，会发生什么呢？
```javascript
const parent = {
  foo: 'foo',
}
const child = Object.create(parent)
child.foo = 'bar'
console.log(child.foo) // 'bar'
console.log(parent.foo) // 'foo'
```
上面代码中我们在 `child` 上定义了一个同名属性 `foo`，这时候 `child.foo` 会访问到自己身上的属性，而不是原型对象 `parent` 上的属性。这就是原型链就近原则。
那么假设我们现在有两个对象
```javascript
const grandParent = {
  foo: 'foo from grandParent',
}
const parent = Object.create(grandParent)
parent.foo = 'foo from parent'
const child = Object.create(parent)
console.log(child.foo) // 'foo from parent'
```
上面代码中 `child` 访问 `foo` 属性时会先在自己身上查找，找不到就会去 `parent` 上查找，找到了就返回 `parent` 上的属性值。
如果 `parent` 上也没有这个属性，就会继续去 `grandParent` 上查找，直到找到为止。
这里的 `grandParent` 就是祖先组件，`parent` 是父组件，`child` 是子组件。`provide` 和 `inject` 就是利用了这个原型链的特性来实现祖先组件向后代组件注入依赖的。

## provide
`provide` 用于在祖先组件中提供一个依赖。它接受两个参数，第一个参数是一个字符串，表示依赖的名称，第二个参数是依赖的值。
我们假设所有的组件上都有一个 `provides` 对象，用于存储组件提供的依赖。那么 `provide` 的实现可以如下：

- `component.ts`
```javascript
function createComponentInstance(vnode, parent) {
  const instance = {
    vnode,
    parent,
    provides: Object.create(parent ? parent.provides : null), // 继承父组件的 provides
    // 其他属性省略
  }
  return instance
}
```

```javascript
export function provide(key, value) {
  /**
   * 首次调用的时候，instance.provides 应该等于 parent.provides
   */
  const instance = getCurrentInstance()
  // 拿到父组件的 provides，如果父组件没有，证明是 根组件，我们应该拿 appContext.provides
  const parentProvides = instance.parent
    ? instance.parent.provides
    : instance.appContext.provides
  // 自己的 provides
  let provides = instance.provides

  // 设置属性到 provides 上
  provides[key] = value
}
```

那此时如果我在父组件中调用 `provide`：
```javascript
const Parent = {
  setup() {
    provide('foo', 'foo from parent')
  },
}
```
那么 `Parent` 组件实例的 `provides` 对象上就会有一个属性 `foo`，值为 `foo from parent`。


## inject
`inject` 用于在后代组件中注入一个依赖。它接受两个参数，第一个参数是一个字符串，表示依赖的名称，第二个参数是一个可选的默认值。
```javascript
export function inject(key, defaultValue) {
  const instance = getCurrentInstance()
  // 拿到父组件的 provides，如果父组件没有，证明是 根组件，我们应该拿 appContext.provides
  const parentProvides = instance.parent
    ? instance.parent.provides
    : instance.appContext.provides

  if (key in parentProvides) {
    // 如果父组件的 provides 上面有这个 key，那就返回
    return parentProvides[key]
  }
  // 如果没有，返回默认值
  return defaultValue
}
```

那此时如果我在子组件中调用 `inject`：
```javascript
const Parent = {
  setup() {
    provide('foo', 'foo from parent')
    return () => h(Child)
  },
}

const Child = {
  setup() {
    const foo = inject('foo', 'default foo')
    console.log(foo) // 'foo from parent'
  },
}
```
那么 `Child` 组件实例中 `foo` 的值就会是 `foo from parent`。
如果我们在 `Parent` 组件中没有调用 `provide`，那么 `Child` 组件中 `foo` 的值就会是 `default foo`。

## 总结
`provide` 和 `inject` 允许祖先组件向其所有子孙后代组件注入一个依赖，而不管组件层级有多深。
它们的实现原理是基于原型链的特性，祖先组件通过 `provide` 提供依赖，后代组件通过 `inject` 注入依赖。
这样我们就可以方便地在组件树中进行依赖注入，实现组件之间的通信。
