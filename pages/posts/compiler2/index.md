---
title: 编译元素节点
date: 2025-11-27
updated: 2025-11-27
categories: 手写Vue3源码之编译时
tags:
  - 手写Vue3源码之编译时
top: 1
---

# 编译元素节点
## 1. 元素解析的核心思想

解析元素的关键点在于我们**什么情况下需要开始解析元素，什么时候结束解析元素**。
比如：
```javascript
const template = `<div>hello world</div>`
```

还记得我们状态机吗？当我们遇到 `<` 符号时，说明一个元素开始了，我们需要切换状态去解析标签名；当我们遇
到 `>` 符号时，说明一个开始标签解析完成了，我们可以创建一个元素节点并将其添加到 AST 中；当我们遇
到 `</` 符号时，说明一个结束标签开始了，我们需要切换状态去解析结束标签名；当我们再次遇到` > `符号时，说明
一个结束标签解析完成了，我们可以闭合当前元素节点，在闭合之前元素中所有的内容，都是它的子节点。

```typescript
class Tokenizer {
  // ... 其他代码

  parse(input) {
    this.buffer = input

    while (this.index < this.buffer.length) {
      const str = this.buffer[this.index]

      switch (this.state) {
        case State.Text:
          this.stateText(str)
          break
        case State.BeforeTagName:
          this.stateBeforeTagName(str)
          break
        case State.InTagName:
          this.stateInTagName(str)
          break
        case State.BeforeAttrName:
          this.stateBeforeAttrName(str)
          break
        case State.InClosingTagName:
          this.stateInClosingTagName(str)
          break
      }
      this.index++
    }

    this.cleanup()
  }

  stateInClosingTagName(str) {
    // <div></div>
    if (str === '>') {
      this.cbs.onclosetag(this.sectionStart, this.index)
      // 要从下一个开始解析文本节点不能包含 >
      this.sectionStart = this.index + 1
      this.state = State.Text
    }
  }

  stateBeforeAttrName(str) {
    if (str === '>') {
      // 表示开始标签解析完了
      this.cbs.onopentagend()
      // 要从下一个开始解析文本节点不能包含 >
      this.sectionStart = this.index + 1
      // 继续解析文本 <div>hello world</div>
      this.state = State.Text
    }
  }

  stateInTagName(str) {
    // <div id="123"></div>
    if (str === '>' || str === ' ') {
      // 标签名完事儿了
      this.cbs.onopentagname(this.sectionStart, this.index)
      // 开始解析属性了
      this.state = State.BeforeAttrName
      this.sectionStart = this.index
      this.stateBeforeAttrName(str)
    }
  }
  stateBeforeTagName(str) {
    // <div></div>
    if (isTagStart(str)) {
      // 开始标签
      this.state = State.InTagName
      this.sectionStart = this.index
    } else if (str === '/') {
      this.state = State.InClosingTagName
      // <div></div>，当前正在匹配的字符串是 / 要 +1 从下一个开始
      this.sectionStart = this.index + 1
    } else {
      // 老六乱写的，不是标签
      this.state = State.Text
    }
  }
  stateText(str) {
    if (str === '<') {
      // 证明我要开始解析标签了
      if (this.sectionStart < this.index) {
        // 处理之前的文本内容
        this.cbs.ontext(this.sectionStart, this.index)
      }
      // 切换状态
      this.state = State.BeforeTagName
      // 移动开始位置
      this.sectionStart = this.index
    }
  }
}
```

元素解析最关键的还是处理**嵌套结构**。例如：
```html
<div><span>hello world</span><p>你好啊</p></div>
```

这个模板包含了多层嵌套：
- `div` 元素包含 `span` 和 `p` 两个子元素
- `span` 元素包含文本节点 `hello world`
- `p` 元素包含文本节点 `你好啊`

我们需要使用 **栈结构** 来正确处理这种嵌套关系。

## 2. 栈结构处理嵌套

为什么需要栈？

在解析嵌套的 HTML 标签时，我们需要知道当前正在解析的节点应该添加到哪个父节点下。栈结构天然适合处理这种"后进先出"的嵌套关系。

栈的工作流程：

以 `<div><span>hello world</span><p>你好啊</p></div>` 为例：

```text
1. 解析 <div>         → 创建 div 节点，压入栈
   stack = [div]

2. 解析 <span>        → 创建 span 节点，添加到 div.children，压入栈
   stack = [div, span]

3. 解析 hello world   → 创建文本节点，添加到 span.children
   stack = [div, span]

4. 解析 </span>       → span 闭合，从栈中弹出
   stack = [div]

5. 解析 <p>           → 创建 p 节点，添加到 div.children，压入栈
   stack = [div, p]

6. 解析 你好啊        → 创建文本节点，添加到 p.children
   stack = [div, p]

7. 解析 </p>          → p 闭合，从栈中弹出
   stack = [div]

8. 解析 </div>        → div 闭合，从栈中弹出
   stack = []
```

最终生成的 AST 结构：

```typescript
{
  type: 0, // ROOT
  children: [{
    type: 1, // ELEMENT
    tag: 'div',
    children: [
      {
        type: 1, // ELEMENT
        tag: 'span',
        children: [
          { type: 2, content: 'hello world' } // TEXT
        ]
      },
      {
        type: 1, // ELEMENT
        tag: 'p',
        children: [
          { type: 2, content: '你好啊' } // TEXT
        ]
      }
    ]
  }]
}
```

## 3. 新增的状态

为了支持元素解析，我们新增了几个状态：

| 状态 | 说明 | 示例 |
| :--- | :--- | :--- |
| `State.BeforeTagName` | 遇到 `<` 后，准备解析标签名 | `<` div> |
| `State.InTagName` | 正在解析标签名 | < `div` > |
| `State.BeforeAttrName` | 标签名后，准备解析属性或 `>` | \<div `>` hello |
| `State.InClosingTagName` | 正在解析结束标签名 | </ `div` > |

## 4. 实现原理

1. **添加栈结构**

```typescript
// 栈，保存当前已打开未闭合的标签
const stack = []

// 当前正在解析的开始标签
let currentOpenTag
```

2. **addNode 函数 - 添加节点到正确的位置**

```typescript
function addNode(node) {
  const lastNode = stack.at(-1)

  if (lastNode) {
    // 如果栈中有元素，说明当前节点是某个元素的子节点
    lastNode.children.push(node)
  } else {
    // 如果栈为空，说明是根节点的直接子节点
    currentRoot.children.push(node)
  }
}
```

3. **setLocEnd 函数 - 更新位置信息**
```typescript
function setLocEnd(loc, end) {
  // 更新节点的结束位置和内容
  loc.source = getSlice(loc.start.offset, end)
  loc.end = tokenizer.getPos(end)
}
```

4. 新增回调函数

```typescript
const tokenizer = new Tokenizer({
  // 文本节点回调
  ontext(start, end) {
    const content = getSlice(start, end)
    const textNode = {
      content,
      type: NodeTypes.TEXT,
      loc: getLoc(start, end),
    }
    addNode(textNode) // 使用 addNode 而不是直接 push
  },

  // 开始标签名解析完成
  onopentagname(start, end) {
    const tag = getSlice(start, end)
    currentOpenTag = {
      type: NodeTypes.ELEMENT,
      tag,
      children: [],
      loc: getLoc(start - 1, end), // start - 1 包含 <
    }
  },

  // 开始标签解析完成（遇到 >）
  onopentagend() {
    addNode(currentOpenTag) // 添加到父节点
    stack.push(currentOpenTag) // 压入栈
    currentOpenTag = null
  },

  // 结束标签解析完成
  onclosetag(start, end) {
    const name = getSlice(start, end)
    const lastNode = stack.pop() // 从栈中弹出

    if (lastNode.tag === name) {
      // 标签匹配，更新结束位置
      setLocEnd(lastNode.loc, end + 1) // end + 1 包含 >
    } else {
      // 标签不匹配，语法错误
      console.log('有个老六写错了')
    }
  },
})
```

## 5. **完整解析流程**

以 `<div><span>hello world</span></div>` 为例，完整追踪解析过程：

**阶段1：解析 `<div>`**

```text
字符: <
  状态: Text → BeforeTagName
  动作: 无文本需要处理

字符: d
  状态: BeforeTagName → InTagName
  动作: sectionStart = 1

字符: i, v
  状态: InTagName
  动作: 继续扫描

字符: >
  状态: InTagName → BeforeAttrName → Text
  动作:
    1. 调用 onopentagname(1, 4) - 获取标签名 "div"
    2. 创建 div 元素节点
    3. 调用 onopentagend()
    4. addNode(div) - 添加到 root.children
    5. stack.push(div) - 压入栈

  stack = [div]
```

**阶段2：解析 `<span>`**

```text
字符: <
  状态: Text → BeforeTagName
  动作: 无文本需要处理

字符: s, p, a, n
  状态: BeforeTagName → InTagName
  动作: 扫描标签名

字符: >
  状态: InTagName → BeforeAttrName → Text
  动作:
    1. 调用 onopentagname(6, 10) - 获取标签名 "span"
    2. 创建 span 元素节点
    3. 调用 onopentagend()
    4. addNode(span) - 添加到 div.children (栈顶元素)
    5. stack.push(span) - 压入栈

  stack = [div, span]
```

**阶段3：解析 hello world**

```text
字符: h, e, l, l, o, 空格, w, o, r, l, d
  状态: Text
  动作: 继续扫描文本内容

字符: <
  状态: Text → BeforeTagName
  动作:
    1. 调用 ontext(11, 22) - 获取文本 "hello world"
    2. 创建文本节点
    3. addNode(textNode) - 添加到 span.children (栈顶元素)

  stack = [div, span]
```

**阶段4：解析 `</span>`**

```text
字符: <
  状态: BeforeTagName

字符: /
  状态: BeforeTagName → InClosingTagName
  动作: sectionStart = 24

字符: s, p, a, n
  状态: InClosingTagName
  动作: 继续扫描

字符: >
  状态: InClosingTagName → Text
  动作:
    1. 调用 onclosetag(24, 28) - 获取标签名 "span"
    2. lastNode = stack.pop() - 弹出 span
    3. 验证标签匹配
    4. setLocEnd(span.loc, 29) - 更新结束位置

  stack = [div]
```

**阶段5：解析 `</div>`**

```text
字符: <, /, d, i, v, >
  状态: Text → BeforeTagName → InClosingTagName → Text
  动作:
    1. 调用 onclosetag(31, 34) - 获取标签名 "div"
    2. lastNode = stack.pop() - 弹出 div
    3. 验证标签匹配
    4. setLocEnd(div.loc, 35) - 更新结束位置

  stack = []
```

**最终生成的 AST：**

```javascript
{
  type: 0, // ROOT
  children: [
    {
      type: 1, // ELEMENT
      tag: 'div',
      children: [
        {
          type: 1, // ELEMENT
          tag: 'span',
          children: [
            {
              type: 2, // TEXT
              content: 'hello world',
              loc: { ... }
            }
          ],
          loc: {
            start: { offset: 5, ... },
            end: { offset: 29, ... },
            source: '<span>hello world</span>'
          }
        }
      ],
      loc: {
        start: { offset: 0, ... },
        end: { offset: 35, ... },
        source: '<div><span>hello world</span></div>'
      }
    }
  ],
  type: 0,
  source: '<div><span>hello world</span></div>'
}
```


## 6. 关键点总结
1. 栈的作用

- 压栈时机：遇到开始标签的 `>` 时（`onopentagend`）
- 出栈时机：遇到结束标签的 `>` 时（`onclosetag`）
- 栈顶元素：始终是当前正在解析的元素（未闭合）

2. 节点添加策略
```typescript
function addNode(node) {
  const lastNode = stack.at(-1)

  if (lastNode) {
    // 有栈顶元素 → 添加为栈顶元素的子节点
    lastNode.children.push(node)
  } else {
    // 栈为空 → 添加为根节点的子节点
    currentRoot.children.push(node)
  }
}
```

3. 位置信息的处理

- 开始位置：在创建节点时确定（`onopentagname`）
- 结束位置：在闭合标签时更新（`onclosetag`）
- 为什么需要 `start - 1` 和 `end + 1`：
  - `start - 1`：包含 `<` 符号
  - `end + 1`：包含 `>` 符号

4. 状态转换流程

```text
Text (遇到<)
  ↓
BeforeTagName (判断是开始还是结束标签)
  ↓                    ↓
InTagName           InClosingTagName
  ↓                    ↓
BeforeAttrName       Text (闭合完成)
  ↓
Text (遇到>)
```

5.  错误处理

```typescript
onclosetag(start, end) {
  const name = getSlice(start, end)
  const lastNode = stack.pop()

  if (lastNode.tag === name) {
    // 标签匹配，正常闭合
    setLocEnd(lastNode.loc, end + 1)
  } else {
    // 标签不匹配，如 <div></span>
    console.log('有个老六写错了')
  }
}
```
