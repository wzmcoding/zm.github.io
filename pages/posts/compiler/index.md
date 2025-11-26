---
title: 编译时 —— compiler-core
date: 2025-10-11
updated: 2025-11-26
categories: 手写Vue3源码之编译时
tags:
  - 手写Vue3源码之编译时
top: 1
---

# **编译时 —— compiler-core**

# 什么是编译时？

将模板编译成 js 的过程，就是编译时

```vue
<div>111</div>
```

把上面这一坨当做一个字符串来解析，解析成 js 文件，这个过程叫做编译时：

1. 把 .vue 文件的内容当做一个字符串，转换成 ast 语法树（ast语法树只是用来描述语法的），它是一个对象
2. 把 ast 语法树，转换成我们运行时的代码 `createElementBlock`、`createElementVNode`、`createVNode`


我们把 `<div>111</div>` 转换为 ast 语法树


```js
const ast = {
  type: 1, // 对应的标记就是1
  tag: 'div',
  children: [
    {
      type: 2,
      content: '111',
    },
  ],
}

// 把上面的 ast 语法树转换成 我们的运行时的代码
const vnode = createElementBlock('div', null, ['111'])
```

https://astexplorer.net/ 可以看到 ast 语法树解析出来的结果


知道了这个概念之后，我们接下来就来完成模板编译成 ast 语法树的过程

## 模板解析

下面的内容是源码中处理编译时的一些枚举声明，我们先拿过来

- ast.ts
```typescript
export enum NodeTypes {
  // 根节点
  ROOT,
  // 元素节点
  ELEMENT,
  // 文本节点
  TEXT,
  // 注释节点
  COMMENT,
  // 简单表达式节点
  SIMPLE_EXPRESSION,
  // 插值节点，例如 {{ value }}
  INTERPOLATION,
  // 属性节点
  ATTRIBUTE,
  // 指令节点，例如 v-if、v-for 等
  DIRECTIVE,
  // 容器节点
  // 复合表达式节点，包含多个子表达式
  COMPOUND_EXPRESSION,
  // if 条件节点
  IF,
  // if 分支节点
  IF_BRANCH,
  // for 循环节点
  FOR,
  // 文本调用节点
  TEXT_CALL,
  // 代码生成相关节点
  // 虚拟节点调用
  VNODE_CALL,
  // 函数调用表达式
  JS_CALL_EXPRESSION,
  // 对象表达式
  JS_OBJECT_EXPRESSION,
  // 对象属性
  JS_PROPERTY,
  // 数组表达式
  JS_ARRAY_EXPRESSION,
  // 函数表达式
  JS_FUNCTION_EXPRESSION,
  // 条件表达式
  JS_CONDITIONAL_EXPRESSION,
  // 缓存表达式
  JS_CACHE_EXPRESSION,
}
```

- 解析器状态

```typescript
export enum State {
  /** 普通文本状态，处理标签和插值表达式之外的内容 */
  Text = 1,

  /** 插值表达式相关状态 */
  InterpolationOpen, // 开始解析插值表达式 {{
  Interpolation, // 解析插值表达式内容
  InterpolationClose, // 结束解析插值表达式 }}

  /** HTML标签相关状态 */
  BeforeTagName, // 遇到<后的状态，准备解析标签名
  InTagName, // 正在解析标签名
  InSelfClosingTag, // 处理自闭合标签 />
  BeforeClosingTagName, // 处理结束标签的开始 </
  InClosingTagName, // 解析结束标签的标签名
  AfterClosingTagName, // 结束标签名后的状态

  /** 属性和指令相关状态 */
  BeforeAttrName, // 准备解析属性名
  InAttrName, // 解析普通属性名
  InDirName, // 解析指令名（v-if, v-for等）
  InDirArg, // 解析指令参数（v-bind:arg）
  InDirDynamicArg, // 解析动态指令参数（v-bind:[arg]）
  InDirModifier, // 解析指令修饰符（v-on:click.prevent）
  AfterAttrName, // 属性名后的状态
  BeforeAttrValue, // 准备解析属性值
  InAttrValueDq, // 双引号属性值 "value"
  InAttrValueSq, // 单引号属性值 'value'
  InAttrValueNq, // 无引号属性值 value

  /** 声明相关状态 */
  BeforeDeclaration, // <!开始的声明
  InDeclaration, // 解析声明内容

  /** 处理指令相关状态 */
  InProcessingInstruction, // 处理XML处理指令 <?xml ?>

  /** 注释和CDATA相关状态 */
  BeforeComment, // 准备解析注释
  CDATASequence, // 解析CDATA序列
  InSpecialComment, // 特殊注释处理
  InCommentLike, // 类注释内容处理

  /** 特殊标签处理状态 */
  BeforeSpecialS, // 处理<script>或<style>
  BeforeSpecialT, // 处理<title>或<textarea>
  SpecialStartSequence, // 特殊标签的开始序列
  InRCDATA, // 处理RCDATA内容（script/style/textarea等）

  /** 实体解析状态 */
  InEntity, // 解析HTML实体（如&amp;）

  /** SFC相关状态 */
  InSFCRootTagName, // 解析单文件组件根标签名
}
```

### 编译文本节点
1. 编译流程
Vue 的模板编译主要经过三个阶段：
```text
模板字符串 → 解析(parse) → AST → 转换(transform) → 代码生成(codegen) → render 函数
```
我们先来处理 parse 阶段，解析模板字符串生成 AST。

2. 状态机
解析器采用 **状态机** 的设计模式，通过不同的状态来处理不同的模板内容。
状态机是一种设计模式，它在不同的状态下执行不同的逻辑。在模板解析中：
- 当遇到不同的字符时，解析器会切换到对应的状态
- 每个状态负责处理特定类型的内容
- 状态之间可以互相转换
状态机的状态就是我们上面声明的枚举 `State`：

3. 核心实现
1. Tokenizer 类
Tokenizer 是基于状态机实现的解析器，负责逐字符扫描模板字符串。
```typescript
export class Tokenizer {
  // 状态机的当前状态
  state = State.Text

  // 当前正在解析的字符的下标
  index = 0

  // 解析开始的位置（当前状态切换时的初始位置）
  sectionStart = 0

  // 用来保存当前正在解析的字符串
  buffer = ''

  constructor(public cbs) {}

  parse(input) {
    this.buffer = input

    // 遍历每个字符
    while (this.index < this.buffer.length) {
      const str = this.buffer[this.index]

      // 状态机：根据当前状态执行不同的逻辑
      switch (this.state) {
        case State.Text: {
          // 处理文本状态
          if (str === '<') {
            // 遇到 < 标签开始符号
            // 可以切换状态到 BeforeTagName
          }
          break
        }
      }
      this.index++
    }

    // 清理工作
    this.cleanup()
  }

  cleanup() {
    if (this.sectionStart < this.index) {
      // 还有未处理的内容
      if (this.state === State.Text) {
        // 处理剩余的文本节点
        this.cbs.ontext(this.sectionStart, this.index)
        this.sectionStart = this.index
      }
    }
  }

  getPos(index) {
    return {
      column: index + 1, // 列号
      line: 1, // 行号（暂时不考虑换行）
      offset: index, // 偏移量
    }
  }
}
```
属性说明：

- state: 状态机的当前状态
- index: 当前扫描到的字符位置
- sectionStart: 当前节点开始的位置
- buffer: 待解析的模板字符串
- cbs: 回调函数对象，用于通知外部解析结果

2. Parser 解析器

Parser 负责创建 AST 根节点，并协调 Tokenizer 的工作。

```typescript
let currentInput = ''
let currentRoot

function getSlice(start, end) {
  return currentInput.slice(start, end)
}

function getLoc(start, end) {
  return {
    start: tokenizer.getPos(start), // 开始的位置信息
    end: tokenizer.getPos(end), // 结束的位置信息
    source: getSlice(start, end), // 内容
  }
}

const tokenizer = new Tokenizer({
  ontext(start, end) {
    const content = getSlice(start, end)

    const textNode = {
      content,
      type: NodeTypes.TEXT,
      loc: getLoc(start, end),
    }
    currentRoot.children.push(textNode)
  },
})

function createRoot(source) {
  return {
    children: [], // 子节点
    type: NodeTypes.ROOT, // 根节点类型
    source, // 初始化的字符串
  }
}

export function parse(input) {
  // 把当前正在解析的字符串暴露给外部作用域
  currentInput = input
  const root = createRoot(input)
  // 把当前创建的根节点暴露给外部作用域
  currentRoot = root
  // 开始解析 input
  tokenizer.parse(input)
  return root
}
```

3. 解析文本节点的流程
以 `"hello world"` 为例：
```typescript
parse('hello world')
```
1. 初始化

- `state = State.Text`
- `index = 0`
- `sectionStart = 0`

2. 逐字符扫描

- 遍历每个字符：`h`, `e`, `l`, `l`, `o`,`  `, `w`,` o`, `r`,` l`, `d`
- `index` 不断递增，直到字符串结束

3. 清理阶段（cleanup）

- 扫描结束后，`index = 11`，`sectionStart = 0`
- `sectionStart < index` 说明还有未处理的内容
- 调用 `ontext(0, 11)` 回调

4. 创建文本节点

- 通过 `getSlice(0, 11)` 获取内容：`"hello world"`
- 创建文本节点对象：
```typescript
{
  content: "hello world",
  type: NodeTypes.TEXT, // 0
  loc: {
    start: { column: 1, line: 1, offset: 0 },
    end: { column: 12, line: 1, offset: 11 },
    source: "hello world"
  }
}
```
- 将节点添加到 `root.children` 中

5. 返回 AST
```typescript
{
  children: [
    {
      content: "hello world",
      type: 2, // NodeTypes.TEXT
      loc: { ... }
    }
  ],
  type: 0, // NodeTypes.ROOT
  source: "hello world"
}
```

6. 状态机工作原理图解
```text
模板: "hello world"
     ↓
┌─────────────────────┐
│   开始解析           │
│   state = Text      │
│   index = 0         │
│   sectionStart = 0  │
└─────────────────────┘
     ↓
┌─────────────────────┐
│   逐字符扫描         │
│   h → e → l → ...   │
│   index++           │
└─────────────────────┘
     ↓
┌─────────────────────┐
│   扫描结束            │
│   index = 11        │
│   sectionStart = 0  │
└─────────────────────┘
     ↓
┌─────────────────────┐
│   cleanup()         │
│   检测到未处理内容     │
└─────────────────────┘
     ↓
┌─────────────────────┐
│   调用 ontext       │
│   创建文本节点       │
└─────────────────────┘
     ↓
┌─────────────────────┐
│   返回 AST          │
└─────────────────────┘
```
