---
title: 组件的生命周期
date: 2025-09-23
updated: 2025-09-23
categories: 手写Vue3源码之组件篇
tags:
  - 手写Vue3源码之组件篇
top: 1
---

## 组件的生命周期

## 生命周期的使用
- 在组件 setup 内使用以下 API 注册生命周期：
  - onBeforeMount(fn)：在组件挂载之前调用
  - onMounted(fn)：在组件挂载之后调用
  - onBeforeUpdate(fn)：在组件更新之前调用
  - onUpdated(fn)：在组件更新之后调用
  - onBeforeUnmount(fn)：在组件卸载之前调用
  - onUnmounted(fn)：在组件卸载之后调用

示例:
```javascript
import {
  onBeforeMount,
  onMounted,
  onBeforeUpdate,
  onUpdated,
  onBeforeUnmount,
  onUnmounted
} from 'vue'

export default {
  setup() {
    onBeforeMount(() => {
      console.log('before mount')
    })
    onMounted(() => {
      console.log('mounted')
    })

    onBeforeUpdate(() => {
      console.log('before update')
    })
    onUpdated(() => {
      console.log('updated')
    })

    onBeforeUnmount(() => {
      console.log('before unmount')
    })
    onUnmounted(() => {
      console.log('unmounted')
    })

    return () => h('div', 'Hello Vue Lifecycle')
  }
}
```

- 典型使用：
  - 读写真实 DOM：onMounted
  - 依赖 DOM 的更新后逻辑：onUpdated
  - 资源释放（事件、定时器、订阅）：onBeforeUnmount 或 onUnmounted

## 生命周期是如何绑定到组件实例上的
比如我们需要注册组件挂载的声明周期，如下：
```javascript
const Comp = {
  setup() {
    onMounted(function hook() {
      // 监听挂载
      console.log('Component mounted')
    })
  }
}
```
其实就是我们需要把 `hook` 函数，跟我们的组件实例 `instance` 做一个绑定关系，这样我们就可以在组件挂载完成后，去调用它,
当我们调用 `onMounted` 的时候，注意这里是在 `setup` 中调用，必然是可以拿到 `instance` 的，
这个时候我们让 `instance.m = hook`，假设 `m` 就是挂载完成后要调用的那个函数，那什么时候算是挂载完成呢？我们来找到我们之前写的组件挂载的逻辑：
```javascript
const componentUpdateFn = () => {
  /**
   * 区分挂载和更新
   */
  if (!instance.isMounted) {
    // 这里是挂载
    const { vnode } = instance

    const mounted = instance.m // 挂载完成后要调用的函数
    // 调用 render 拿到 subTree，this 指向 setupState
    const subTree = renderComponentRoot(instance)
    // 将 subTree 挂载到页面
    patch(null, subTree, container, anchor, instance)
    // 组件的 vnode 的 el，会指向 subTree 的 el，它们是相同的
    vnode.el = subTree?.el
    // 保存子树
    instance.subTree = subTree
    // 挂载完了
    instance.isMounted = true
    /**
     * 挂载后，触发 mounted
     */
    mounted() // 这里我们可以调用挂载完成的生命周期
  } else {
    // 更新的逻辑，暂时忽略
  }
}
```
相信到这里，我们就理解了生命周期是如何调用的，它的本质就是在 `setup` 中调用生命周期的时候，将 `hook` 函数
绑定到组件实例的某个属性中，然后在组件不同的阶段，去调用不同的生命周期函数，那么接下来我们来完成它，当然源码中用的是枚举，一一列举出生命周期函数对应的 `key`

`packages/runtime-core/src/apiLifecycle.ts`
```javascript
export enum LifecycleHooks {
  // 挂载 instance.bm
  BEFORE_MOUNT = 'bm', // 挂载前 onBeforeMount
  MOUNTED = 'm', // 挂载后 onMounted

  // 更新
  BEFORE_UPDATE = 'bu', // 更新前 onBeforeUpdate
  UPDATED = 'u', // 更新后 onUpdated

  // 卸载
  BEFORE_UNMOUNT = 'bum', // 卸载前 onBeforeUnmount
  UNMOUNTED = 'um' // 卸载后 onUnmounted
}
```
这些就是每个生命周期，对应的实例属性，接下来我们来实现生命周期函数：

`packages/runtime-core/src/apiLifecycle.ts`
```javascript
function createHook(type) {
  // type 是我们的生命周期对应的 key，这里用闭包锁定，比如 onMounted => LifecycleHooks.MOUNTED
  return (hook, target = getCurrentInstance()) => {
    // 每个生命周期通过这个函数创建，hook 就是我们传递的函数
    injectHook(target, hook, type)
  }
}

/**
 * 注入生命周期
 * @param target 当前组件的实例
 * @param hook 用户传递的回调函数
 * @param type 生命周期的类型 bm um
 */
function injectHook(target, hook, type) {
  // 如果一开始 instance[type] 没有值，我们给它个数组，因为每个生命周期函数，可能会有多个 hook 函数
  if (target[type] == null) {
    target[type] = []
  }
  // 将 hook 放到数组里面去
  target[type].push(hook)
}

// 挂载
export const onBeforeMount = createHook(LifecycleHooks.BEFORE_MOUNT)
export const onMounted = createHook(LifecycleHooks.MOUNTED)
// 更新
export const onBeforeUpdate = createHook(LifecycleHooks.BEFORE_UPDATE)
export const onUpdated = createHook(LifecycleHooks.UPDATED)
// 卸载
export const onBeforeUnmount = createHook(LifecycleHooks.BEFORE_UNMOUNT)
export const onUnmounted = createHook(LifecycleHooks.UNMOUNTED)

/**
 * 触发生命周期钩子
 * @param instance 当前组件的实例
 * @param type 生命周期的类型 bm m bu bum
 */
export function triggerHooks(instance, type) {
  // 拿到生命周期 instance.bm => [fn1,fn2]
  const hooks = instance[type]

  if (hooks) {
    // 执行之前，设置 currentInstance
    setCurrentInstance(instance)
    // 如果有，依次执行
    try {
      hooks.forEach((hook) => hook())
    } finally {
      // 执行完了，清除 currentInstance
      unsetCurrentInstance()
    }
  }
}
```
这样当我们调用 `onMounted(hook)` 的时候，就会将 `hook` 函数绑定到 `instance.m` 上，当组件挂载完成后，
就会调用 `triggerHooks(instance, m)`，从而触发我们传递的生命周期函数，生命周期触发的时机我们在 `renderer.ts` 中实现
- 具体位置：`packages/runtime-core/src/renderer.ts`
- 组件首次挂载分支：
  - 调用组件 `render()` 之前：`onBeforeMount`
  - 完成 `patch(subTree)` 挂载后、标记 `isMounted=true` 之后：`onMounted`
- 组件更新分支：
  - 生成并对比新旧子树之前：`onBeforeUpdate`
  - 完成 `patch(prevSubTree, subTree)` 之后：`onUpdated`
- 组件卸载分支（`unmountComponent`）：
  - 卸载子树之前：`onBeforeUnmount`
  - 卸载子树之后：`onUnmounted`

## 父子组件的生命周期执行顺序
- 挂载阶段：
  - 父：`beforeMount` → 子：`beforeMount` → 子：`mounted` → 父：`mounted`
- 更新阶段：
  - 父：`beforeUpdate` → 子：`beforeUpdate` → 子：`updated` → 父：`updated`
- 卸载阶段：
  - 父：`beforeUnmount` → 子：`beforeUnmount` → 子：`unmounted` → 父：`unmounted`

注意，所有的生命周期都是父组件先开始，子组件先完成，因为只有子组件完成了父组件才算完成
