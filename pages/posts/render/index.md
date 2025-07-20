---
title: render 中的挂载、更新、卸载
date: 2025-07-20
updated: 2025-07-20
categories: 手写Vue3源码
tags:
  - render 中的挂载、更新、卸载
top: 1
---

# render 中的挂载、更新、卸载
## render 函数
这个 `render` 跟我们组件中的 `render` 不是同一个 `render`，它是用来渲染根组件的
`render` 函数的作用是将虚拟节点（`vnode`）渲染到指定的容器（`container`）中。具体来说，它分为三个步骤：挂载、更新和卸载。
1. 挂载：如果容器中没有之前的虚拟节点（`container._vnode`），则直接将新的虚拟节点挂载到容器中。
2. 更新：如果容器中有之前的虚拟节点，则对比新旧虚拟节点，并进行更新操作。
3. 卸载：如果传入的虚拟节点为 `null`，则卸载容器中现有的虚拟节点。
   函数的具体逻辑如下：
- 如果传入的虚拟节点为 `null`，且容器中有之前的虚拟节点，则调用 `unmount` 函数卸载之前的虚拟节点。
- 否则，调用 `patch` 函数进行挂载或更新操作。
- 最后，将新的虚拟节点保存到容器的 `_vnode` 属性中，以便下次更新时使用。
```typescript
// renderer.ts
const render = (vnode, container) => {
  /**
   * 分三步：
   * 1. 挂载
   * 2. 更新
   * 3. 卸载
   */

  if (vnode == null) {
    if (container._vnode) {
      // 卸载
      unmount(container._vnode)
    }
  } else {
    // 挂载和更新
    patch(container._vnode || null, vnode, container)
  }

  container._vnode = vnode
}
```

## patch 函数
`patch` 函数的作用是用于更新和挂载虚拟节点（`vnode`）。具体来说，它会根据传入的老节点（`n1`）和新节点（`n2`）的情况，决定是进行挂载操作还是更新操作。
函数的逻辑如下：
1. 相同节点检查：如果传入的老节点和新节点是同一个节点，则不进行任何操作。
2. 类型检查：如果老节点存在且老节点和新节点的类型不同，则卸载老节点，并将老节点设为 `null`。
3. 挂载：如果老节点为 `null`，则直接挂载新节点到容器中。
4. 更新：如果老节点存在且类型相同，则进行更新操作。
   总的来说，这个函数通过对比老节点和新节点，决定是进行挂载还是更新，从而实现虚拟节点的高效渲染。
```typescript
/**
 * 更新和挂载，都用这个函数
 * @param n1 老节点，之前的，如果有，表示要和 n2 做 diff，更新，如果没有，表示直接挂载 n2
 * @param n2 新节点
 * @param container 要挂载的容器
 */
const patch = (n1, n2, container) => {
  if (n1 === n2) {
    // 如果两次传递了同一个虚拟节点，啥都不干
    return
  }

  if (n1 && !isSameVNodeType(n1, n2)) {
    // 如果两个节点不是同一个类型，那就卸载 n1 直接挂载 n2    unmount(n1)
    n1 = null
  }

  if (n1 == null) {
    // 挂载元素
    mountElement(n2, container)
  } else {
    // 更新元素
    patchElement(n1, n2)
  }
}
```
这里用到了一个辅助函数 isSameVNodeType 它是用来判断这个节点是否可以服用，逻辑如下：
```typescript
// vnode.ts
export function isSameVNodeType(n1, n2) {
  return n1.type === n2.type && n1.key === n2.key
}
```
可以看到这个判断逻辑中，必须是相同的 type，并且 key 也相同，才可以复用，那就是说，div 和 p 这两个标签，是不能复用的，不同的 key 亦是如此，
但是如果没有传递 key，那就表示 key 是 undefined，两个 undefined 是相同的，所以没传 key，就意味着 key 相等

## unmount 函数
`unmount` 函数会卸载虚拟节点（`vnode`）。具体来说，它会根据虚拟节点的类型和子节点的情况，递归地卸载所有子节点，并最终移除对应的 DOM 元素。
1. 检查子节点类型：如果虚拟节点的子节点是数组类型，则递归卸载所有子节点。
2. 移除 DOM 元素：调用 `hostRemove` 函数移除虚拟节点对应的 DOM 元素。
```typescript
// 卸载子元素
const unmountChildren = (children) => {
  for (let i = 0; i < children.length; i++) {
    unmount(children[i])
  }
}

// 卸载
const unmount = (vnode) => {
  // 卸载

  const { type, shapeFlag, children } = vnode

  if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    // 子节点是数组

    unmountChildren(children)
  }

  // 移除 dom 元素
  hostRemove(vnode.el)
}

// 挂载子元素
const mountChildren = (children, el) => {
  for (let i = 0; i < children.length; i++) {
    const child = children[i]
    // 递归挂载子节点
    patch(null, child, el)
  }
}
```

## mountElement
`mountElement` 函数会将虚拟节点（`vnode`）挂载到指定的容器（`container`）中。具体来说，它分为以下几个步骤：
1. 创建一个 DOM 节点：根据虚拟节点的类型（`type`），创建一个对应的 DOM 元素，并将其赋值给虚拟节点的 el 属性。
2. 设置节点的属性：遍历虚拟节点的属性（`props`），并使用 `hostPatchProp` 函数将这些属性设置到刚创建的 DOM 元素上。
3. 挂载子节点：根据虚拟节点的 `shapeFlag` 判断子节点的类型。如果子节点是文本，则使用 `hostSetElementText` 函数设置文本内容；如果子节点是数组，则递归调用 `mountChildren` 函数挂载每一个子节点。
4. 插入到容器中：最后，将创建好的 DOM 元素插入到指定的容器中。
```typescript
// 挂载节点
const mountElement = (vnode, container) => {
  /**
   * 1. 创建一个 dom 节点
   * 2. 设置它的 props
   * 3. 挂载它的子节点
   */
  const { type, props, children, shapeFlag } = vnode
  // 创建 dom 元素 type = div p span  const el = hostCreateElement(type)
  vnode.el = el
  if (props) {
    for (const key in props) {
      hostPatchProp(el, key, null, props[key])
    }
  }

  // 处理子节点
  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    // 子节点是文本
    hostSetElementText(el, children)
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    // 子节点是数组
    mountChildren(children, el)
  }
  // 把 el 插入到 container 中
  hostInsert(el, container)
}
```

## patchElement
`patchElement` 函数的作用是更新已经存在的 DOM 元素，以便复用现有的 DOM 结构并应用新的属性和子节点。具体来说，它分为以下几个步骤：
1. 复用 DOM 元素：将旧虚拟节点（`n1`）的 DOM 元素（`el`）赋值给新虚拟节点（`n2`），以便复用现有的 DOM 元素。
2. 更新属性（`props`）：调用 `patchProps` 函数，对比旧属性（`oldProps`）和新属性（`newProps`），并应用属性的变化。
3. 更新子节点（`children`）：调用 `patchChildren` 函数，对比旧子节点和新子节点，并应用子节点的变化。
```typescript
const patchElement = (n1, n2) => {
  /**
   * 1. 复用 dom 元素
   * 2. 更新 props
   * 3. 更新 children
   */ // 复用 dom 元素 每次进来，都拿上一次的 el，保存到最新的虚拟节点上 n2.el  const el = (n2.el = n1.el)

  // 更新 props
  const oldProps = n1.props
  const newProps = n2.props
  patchProps(el, oldProps, newProps)

  // 更新 children  patchChildren(n1, n2)
}
```

## patchProp
`patchProp` 函数的作用是更新DOM元素的属性（props）。具体来说，它执行以下操作：
1. 清除旧属性：如果存在旧属性（`oldProps`），它会遍历所有旧属性，并调用`hostPatchProp`函数将每个属性从DOM元素上移除。这是通过将新值设为null来实现的。
2. 设置新属性：如果存在新属性（`newProps`），它会遍历所有新属性，并调用`hostPatchProp`函数将每个属性设置到DOM元素上。这里会传入旧的属性值（如果存在）和新的属性值，以便`hostPatchProp`函数能够进行更智能的更新。
```typescript
const patchProps = (el, oldProps, newProps) => {
  /**
   * 1. 把老的 props 全删掉
   * 2. 把新的 props 全部给它设置上
   */

  if (oldProps) {
    // 把老的 props 全干掉
    for (const key in oldProps) {
      hostPatchProp(el, key, oldProps[key], null)
    }
  }

  if (newProps) {
    for (const key in newProps) {
      hostPatchProp(el, key, oldProps?.[key], newProps[key])
    }
  }
}
```

## patchChildren
`patchChildren` 函数负责更新子元素，由于子元素的情况比较多，我们总结一下他们的情况
- 新的子元素是文本
  - 老节点是数组，卸载老的 `children`，将新的文本设置成 `children`
  - 老的是文本，直接替换
  - 老的是 `null`，不用关心老的，将新的设置成 `children`
- 新的子元素是数组
  - 老的是数组，那就和新的做全量 diff
  - 老的是文本，把老的清空，挂载新的 `children`
  - 老的是 `null`，不用关心老的，直接挂载新的 `children`
- 新的子元素是 `null`
  - 老的是文本，把 `children` 设置成空
  - 老的是数组，卸载老的
  - 老的是 `null`，俩个哥们都是 `null`，不用干活
    来看一下它的实现：

```typescript
const patchChildren = (n1, n2) => {
  const el = n2.el
  /**
   * 1. 新节点它的子节点是 文本
   *   1.1 老的是数组
   *   1.2 老的也是文本
   * 2. 新节点的子节点是 数组 或者 null
   *   2.1 老的是文本
   *   2.2 老的也是数组
   *   2.3 老的可能是 null
   */
  const prevShapeFlag = n1.shapeFlag

  const shapeFlag = n2.shapeFlag

  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    //  新的是文本
    if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      //  老的是数组，把老的children卸载掉
      unmountChildren(n1.children)
    }

    if (n1.children !== n2.children) {
      // 设置文本，如果n1和n2的children不一样
      hostSetElementText(el, n2.children)
    }
  } else {
    // 老的有可能是 数组 或者 null 或者 文本
    // 新的有可能是 数组 或者 null    if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 老的是文本
      // 把老的文本节点干掉
      hostSetElementText(el, '')
      if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 挂载新的节点
        mountChildren(n2.children, el)
      }
    } else {
      // 老的数组 或者 null      // 新的还是 数组 或者 null
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 老的是数组
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // 新的也是数组
          // TODO 全量 diff        } else {
          // 新的不是数组，卸载老的数组
          unmountChildren(n1.children)
        }
      } else {
        // 老的是 null        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // 新的是数组，挂载新的
          mountChildren(n2.children, el)
        }
      }
    }
  }
}
```
