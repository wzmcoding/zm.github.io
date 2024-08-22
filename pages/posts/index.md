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
// 在 VS Code 中悬浮鼠标只能看到 'keyof Foo'
// 看不到其中的实际值，你可以这么做：
/** 原理：
* keyof Foo 本质上是一个计算类型，它计算并返回对象 Foo 的所有键的联合类型，
* 但它并不立即展开为具体的字符串或数字字面量类型。交叉类型 & {} 通过与空对象类型相交，
* 迫使 TypeScript 对结果进行进一步计算，从而生成一个更具体的类型展示。
  */
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


## 类型系统层级
```typescript
// 在代码中判断类型兼容性主要使用条件类型判断，比如：
type Result = 'xxx' extends string ? 1 : 2;
// 也可以通过赋值来进行兼容性检查：
declare let source: string;
declare let anyType: any;
declare let neverType: never;

anyType = source;

// 不能将类型“string”分配给类型“never”。
// neverType = source;
// 如果 a = b 成立，即意味着 <变量 b 的类型> extends <变量 a 的类型>
// 即 b 类型是 a 类型的子类型

// 在 TypeScript 中最底层的类型是 never  它代表了一个根本不存在的类型
// 对于这个类型他是任何类型的子类型，也包括了各种字面量类型：
type Rusult = never extends 'xxx' ? 1 : 2; // 1
type Result111 = never extends string ? true : false // true

// 对于不存在的类型，我们可能会想到一些特殊的类型，比如 null、undefined、void，但在TypeScript 中，
// void、undefined、null 都是切实存在、有实际意义的类型，
// 它们和 string、number、object 并没有什么本质区别。
type Result1 = undefined extends 'xxx' ? 1 : 2; // 2
type Result2 = null extends 'xxx' ? 1 : 2; // 2
type Result3 = void extends 'xxx' ? 1 : 2; // 2
```


## 原始类型与联合类型
- 最底层类型往上就是我们经常接触的原始类型了，
- 一个基础类型和它们对应的字面量类型必定存在父子类型关系，
- 同时对于类型 object，它代表着所有非原始类型的类型，即数组、对象与函数类型。
```typescript
  type Result4 = "xxx" extends string ? 1 : 2; // 1
  type Result5 = 1 extends number ? 1 : 2; // 1
  type Result6 = true extends boolean ? 1 : 2; // 1
  type Result7 = { name: string } extends object ? 1 : 2; // 1
  type Result8 = { name: 'xxx' } extends object ? 1 : 2; // 1
  type Result9 = [] extends object ? 1 : 2; // 1
  type Result10 = string extends string | false | number ? 1 : 2; // 1
  // 如果一个联合类型由同一个基础类型的类型字面量组成，那与该原始类型也存在父子关系：
  type Result11 = 'aa' | 'bb' | 'cc' extends string ? 1 : 2; // 1
  type Result12 = {} | (() => void) | [] extends object ? 1 : 2; // 1
  // 结论：
  // 1. 字面量类型 < 包含此字面量类型的联合类型，原始类型 < 包含此原始类型的联合类型
  // 2. 同一基础类型的字面量联合类型 < 此基础类型。
```


## 装箱类型
- 原始类型是其装箱类型的子类型，比如 string 类型会是 String 类型的子类型，同时 String 类型会是 Object 类型的子类型。
```typescript
  type Result13 = String extends {} ? 1 : 2; // 1
  // 需要注意的一点是⚠️：{} 是 object 的字面量类型，从前文我们可知 {} 是 objcet 的子类型，
  // 看起来这就构建起了string < {} < object 这个类型链，但实际上 string extends object 并不成立：
  type Result14 = string extends object ? 1 : 2; // 2

  // 由于结构化类型系统的存在，TypeScript 中存在着一些看着不符合直觉的类型关系：
  type Result15 = {} extends object ? 1 : 2; // 1
  type Result16 = object extends {} ? 1 : 2; // 1

  type Result17 = object extends Object ? 1 : 2; // 1
  type Result18 = Object extends object ? 1 : 2; // 1

  type Result19 = Object extends {} ? 1 : 2; // 1
  type Result20 = {} extends Object ? 1 : 2; // 1

  // 1. {} extends object 和 {} extends Object 意味着， {} 是 object 和 Object 的字面量类型，
  //    是从类型信息的层面出发的，即字面量类型在基础类型之上提供了更详细的类型信息。
  // 2. object extends {} 和 Object extends {} 则是从结构化类型系统的比较出发的，
  //    即 {} 作为一个一无所有的空对象，几乎可以被视作是所有类型的基类，万物的起源。
  // 3. object extends Object 和 Object extends object 这两者的情况就要特殊一些，
  //    它们是因为“系统设定”的问题，Object 包含了所有除 Top Type 以外的类型（基础类型、函数类型等），
  //    object 包含了所有非原始类型的类型，即数组、对象与函数类型，这就导致了你中有我、我中有你的神奇现象。

  // 结论：只关注从类型信息层面出发部分的话，即 原始类型 < 原始类型对应的装箱类型 < Object 类型
```


## 顶层类型
- 再往上就到了类型层级的顶端，在这里只有 any 和 unknow ，
- 这两个类型是系统中设定为Top Type 的两个类型，
- 所有的类型都会是这两个类型的子类型。那么如果他们和其他类型进行比较呢：
```typescript
  type Result21 = any extends Object ? 1 : 2; // 1 | 2
  type Result22 = unknown extends Object ? 1 : 2; // 2

  // 可以看到 any 的比较结果是不太一样的，和其他类型的比较也是：
  type Result23 = any extends 'xxx' ? 1 : 2; // 1 | 2
  type Result24 = any extends string ? 1 : 2; // 1 | 2
  type Result25 = any extends {} ? 1 : 2; // 1 | 2
  type Result26 = any extends never ? 1 : 2; // 1 | 2

  /**
  * any 代表了任何可能的类型，当我们使用 any extends 时，它包含了“让条件成立的一部分”，以及“让条件不成立的一部分”。
  * 而从实现上说，在 TypeScript 内部代码的条件类型处理中，
  * 如果接受判断的是 any，那么会直接返回条件类型结果组成的联合类型。
    */
  // any 类型和 unknown 类型的比较也是互相成立的：
  type Result27 = any extends unknown ? 1 : 2;  // 1
  type Result28 = unknown extends any ? 1 : 2;  // 1

  type ExampleType = Record<'a' | 'b' | 'c', number>;

  const example: ExampleType = {
    a: 1,
    b: 2,
    c: 3
  };
```



## 函数类型：协变与逆变
```typescript
// 函数类型比较
class Animal {
  asPet() { }
}

class Dog007 extends Animal {
  bark() { }
}

class Corgi extends Dog007 {
  cute() { }
}
type DogFactory = (args: Dog007) => Dog007;

function transformDogAndBark(dogFactory: DogFactory) {
  const dog = dogFactory(new Dog007());
  dog.bark();
}
```

- 如果一个值能够被赋值给某个类型的变量，那么可以认为这个值的类型为此变量类型的子类型
- 想要在使用这个函数的时候传入 Dog，那么对于型参类型更宽泛的 Animal 来说，他可以接受传入一个范围更为精准的 Dog
- 在需要返回 Dog 类型的情况下，允许返回基于 Dog 的子类型 Corgi，他也具备 Dog 类型拥有的一切

- 观察以上对比过程后的结论是：
- 参数类型允许为 Dog 的父类型，不允许为 Dog 的子类型。
- 返回值类型允许为 Dog 的子类型，不允许为 Dog 的父类型。

## 协变与逆变

// 考虑 Corgi ≼ Dog, 根据上面的比较结果对返回值类型进行替换，有 (T → Corgi) ≼ (T → Dog)，也即是说，
// 在我需要狗狗的地方，柯基都是可用的。即不考虑参数类型的情况，在包装为函数签名的返回值类型后，其子类型层级关系保持一致。我们称之为协变。

// 考虑 Dog ≼ Animal，根据上面的比较结果对参数类型进行替换，则有 (Animal -> T) ≼ (Dog -> T)，也即是说，
// 在我需要条件满足是动物时，狗狗都是可用的。即不考虑返回值类型的情况，在包装为函数签名的参数类型后，其子类型层级关系发生了逆转。我们称为逆变。
// 这就是 TypeScript 中的协变（ covariance） 与逆变（ contravariance ） 在函数签名类型中的表现形式。
// 使用几何学领域的定义去理解就十分形象：随着某一个量的变化，随之变化一致的即称为协变，而变化相反的即称为逆变。

// 用 TypeScript 的思路进行转换，即如果有 A ≼ B ，协变意味着 Wrapper ≼ Wrapper，
// 而逆变意味着 Wrapper ≼ Wrapper。而在这里的示例中，变化（Wrapper）即指从单个类型到函数类型的包装过程、

在 TypeScript 中，由于灵活性等权衡，对于函数参数默认的处理是 双向协变 的。也就是同时允许以下两种情况。
(Dog -> T) ≼ (Corgi -> T)
(Dog -> T) ≼ (Animal -> T)
在开启了 tsconfig 中的 strictFunctionType 后才会严格按照 逆变 来约束赋值关系。
strictFunctionTypes 这一项配置，在文档中的描述相对简略：在比较两个函数类型是否兼容时，
将对函数参数进行更严格的检查（When enabled, this flag causes functions parameters to be checked more correctly），而实际上，
这里的更严格指的即是 对函数参数类型启用逆变检查


## 各类型的逆变协变
- 在 TypeScript 中，协变和逆变主要应用于泛型类型（如数组、Promise、Set、Map、Record等）以及函数类型。下面是这些类型的协变和逆变特性的概述：

  1. 数组 (Array)
     协变：TypeScript中的数组默认是协变的。如果类型 A 是类型 B 的子类型，那么 Array<A> 也可以视为 Array<B> 的子类型。

  2. Promise (Promise)
     协变：Promise同样是协变的。如果类型 A 是类型 B 的子类型，那么 Promise<A> 可以被赋值给 Promise<B> 的引用。

  3. Set (Set)
     协变：Set在TypeScript中也是协变的。如果类型 A 是类型 B 的子类型，那么 Set<A> 可以被视为 Set<B> 的子类型。

  4. Map (Map)
     协变：Map的值 (V) 是协变的，如果类型 V1 是类型 V2 的子类型，那么 Map V1 可以被视为 Map V2 的子类型。
     键 (K) 不是协变也不是逆变的。键必须保持精确匹配，不能以子类型或超类型替代。

  5. Record (Record)
     协变：Record的值 (T) 是协变的。如果类型 A 是类型 B 的子类型，那么 Record<T,A> 可以被视为 Record<T,B> 的子类型。

  6. 函数 (Function)
     参数类型（逆变）：在启用 --strictFunctionTypes 标志时，函数参数是逆变的。如果类型 A 是类型 B 的子类型，那么 (b: B) => void 可以视为 (a: A) => void 的子类型。
     这是因为一个接受更通用类型 B 的函数可以安全地处理类型 A 的实例。

     返回类型（协变）：函数的返回类型是协变的。如果类型 A 是类型 B 的子类型，那么 () => A 可以视为 () => B 的子类型。

- 特别地，对于函数类型，参数位置是逆变的而返回值位置是协变的。这意味着在参数位置上，我们可以使用更通用的（父类型）来替代，而在返回值位置上，我们可以使用更具体的（子类型）来替代。

