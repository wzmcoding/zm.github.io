---
title: 重学TypeScript
date: 2024-08-22
updated: 2024-08-22
categories: TypeScript
tags:
  - TypeScript
top: 2
---

```typescript
interface A {
  [key: string]: string
}
const foo: A = {
  "666": '123',
  11: "xxx",
  [Symbol("ddd")]: 'symbol'
}
```

## 具体的键值类型也需要符合索引签名类型的声明
```typescript
interface StringOrBooleanTypes {
  propA: number;
  propB: boolean;
  [key: string]: number | boolean;
}
```
## 对类型未明确属性的访问
```typescript
interface anyHereType {
  [key: string]: any
}
const fba: anyHereType['zm'] = "any value"
```
## 索引类型查询 keyof    keyof 的产物必定是一个联合类型
## 并不会将数字类型的键名转换为字符串类型字面量，而是仍然保持为数字类型字面量。
```typescript
interface Foo {
  storm: 1,
  666: 2
}
type FooKeys = keyof Foo; // "storm" | 666
```

- keyof Foo 本质上是一个计算类型，它计算并返回对象 Foo 的所有键的联合类型，
- 但它并不立即展开为具体的字符串或数字字面量类型。交叉类型 & {} 通过与空对象类型相交，
- 迫使 TypeScript 对结果进行进一步计算，从而生成一个更具体的类型展示。
type FooKeys2 = keyof Foo & {}; // "storm" | 666
type zm = keyof any; // string | number | symbol

## 索引类型访问
```typescript
interface NumberRecord {
  [key: string]: number;
}
type PropType = NumberRecord[string]; // number
```
// 跟 JavaScript 的区别是这里的访问方式与返回值均是类型

// 更直观的例子是通过字面量类型来进行索引类型访问
```typescript
interface A1 {
  propA: number,
  propB: boolean,
  propC: string
}
type A2 = A1['propA']  // number
type A3 = A1['propB']  // boolean
type A4 = A1['propC']  // string
type A5 = A1[keyof A1]  // string | number | boolean
```
## 索引类型示例
// 如果想要获取一个对象给定属性名的值，为此，我们需要确保我们不会获取 obj 上不存在的属性。所以我们在两个类型之间建立一个约束
```typescript
function getProp<T extends object, K extends keyof T>(obj: T, prop: K): T[K] {
return obj[prop]
}
// 泛型参数声明: <T extends object, K extends keyof T>
// 函数的参数: (obj: T, prop: K)
// 函数的返回值类型: T[K]
const getProp2 = <T extends object, K extends keyof T>(obj: T, key: K): T[K] => obj[key]
const person = {
name: 'wyc',
age: 18
}
const a = getProp2(person, 'name')
console.log('a', a)
const b = getProp2(person, 'age')
console.log('b', b)
```
## 映射类型
- 工具类型会在接收一个对象的时候使用 keyof 获得这个对象类型的键名 组成字面量联合类型，
- 然后通过映射类型（即这里的 in 关键字）将这个联合类型的每一个成员映射 出来，并将其键值类型设置为 string。
```typescript
type Stringify<T> = {
  [K in keyof T]: string;
};
  // 类型查询 用于查询某个变量类型的关键字 typeof
const func = (input: string) => {
  return input.length > 10;
}
type Func = typeof func; // (input: string) => boolean
// 隔离类型层和逻辑层，类型查询操作符后是不允许使用表达式的
const isInputValid = (input: string) => {
  return input.length > 10;
}
// 不允许表达式
// let isValid: typeof isInputValid("xxxx");
```

## 泛型
```typescript
// 类型别名的泛型
// 1.默认值
type Factory<T = boolean> = T | number | string;
// 这样在你调用时就可以不带任何参数了，默认会使用我们声明的默认值来填充。
const fbl: Factory = false;
// 2.约束 extends
// A extends B 意味着 A 是 B 的子类型
// 字面量类型是对应原始类型的子类型   即 'storm' extends string，666 extends number 成立。
type aaaa = 'zm' extends string ? typeof person : number

type ResStatus<ResCode extends number> = ResCode extends 10000 | 10001 | 10002
    ? 'success'
    : 'failure';

// 这个例子会根据传入的请求码判断请求是否成功，这意味着它只能处理数字字面量类型的参数，
// 因此这里我们通过 extends number 来标明其类型约束，如果传入一个不合法的值，就会出现类型错误：
type Res1 = ResStatus<10000>; // "success"
type Res2 = ResStatus<20000>; // "failure"

// type Res3 = ResStatus<'10000'>; // 类型“string”不满足约束“number”。

type Res<code extends number> = code extends 200 | 201 | 203 ? '成功' : '失败'
type res1 = Res<200>

// 对象类型与函数中的泛型
// 基于泛型提供的对类型结构的复用能力，对象类型结构也经常出现泛型的使用，比如响应类型结构的泛型处理：
interface IRes<TData = unknown> {
  code: number;
  error?: string;
  data: TData;
}

// 这个接口描述了一个通用的响应类型结构，
// 预留出了实际响应数据的泛型坑位，然后在你的请求函数中就可以传入特定的响应类型了：
interface IUserProfileRes {
  name: string;
  homepage: string;
  avatar: string;
}

// function fetchUserProfile(): Promise<IRes<IUserProfileRes>> {}
type StatusSucceed = boolean;
// function handleOperation(): Promise<IRes<StatusSucceed>> {}
// 使用泛型就可以很好的进行入参与返回值的类型关联了：
function handle<T>(input: T): T {}
```

## 结构化类型系统
- 结构类型的别称鸭子类型（Duck Typing）
- 核心理念是，如果你看到一只鸟走起来像鸭子，游泳像鸭子，叫得也像鸭子，那么这只鸟就是鸭子。
```typescript
class Cat {
  eat() { }
}

class Dog {
  eat() { }
  bark() { } // 独特方法
}

function feedCat(cat: Cat) { }

feedCat(new Dog())
// 这里实际上是比较 Cat 类型上的属性是否都存在于 Dog 类型上
// 如果为 Dog 加一个独特方法：这个时候不会发生报错这是因为，结构化类型系统认为 Dog 类型完全实现了 Cat 类型。
// 至于额外的方法 bark，可以认为是 Dog 类型继承 Cat 类型后添加的新方法，即此时 Dog 类可以被认为是 Cat 类的子类。
// 同样的，面向对象编程中的里氏替换原则也提到了鸭子测试：如果它看起来像鸭子，叫起来也像鸭子，但是却需要电池才能工作，那么你的抽象很可能出错了。

// 里式替换原则:
// 1.如果S是T的子类，则T的对象可以替换为S的对象，而不会破坏程序。
// 应用程序中任何父类对象出现的地方，我们都可以用其子类的对象来替换，并且可以保证原有程序的逻辑行为和正确性。
```


