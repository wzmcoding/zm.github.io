---
title: 数组去重
date: 2024-09-02
updated: 2024-09-02
categories: interview
tags:
  - interview
top: 2
---
## filter 实现数组去重
```typescript
interface Item {
  id: number;
  name: string;
}

const items: Item[] = [
  { id: 1, name: "item1" },
  { id: 2, name: "item2" },
  { id: 1, name: "item1" },
  { id: 3, name: "item3" }
];

const uniqueItems = items.filter((item, index, self) =>
  index === self.findIndex((t) => t.id === item.id)
);

console.log(uniqueItems);
```
- self.findIndex((t) => t.id === item.id) 会返回数组中第一个与当前 item.id 匹配的对象的索引。
- 如果当前对象的索引 index 与找到的第一个匹配对象的索引相同，则保留该对象，否则过滤掉重复的对象。
- 这种方法适用于数组中的对象具有唯一标识符的情况（如 id）。如果对象没有唯一标识符，可以基于其他属性组合或者对象的序列化值来进行去重。


## 基于 JSON 序列化去重
```typescript
const uniqueItems = Array.from(
  new Set(items.map((item) => JSON.stringify(item)))
).map((item) => JSON.parse(item));

console.log(uniqueItems);

```
- items.map((item) => JSON.stringify(item))：将每个对象转换为 JSON 字符串。
- new Set(...)：使用 Set 来自动去重，因为 Set 只存储唯一值。
- Array.from(...)：将 Set 转换回数组。
- .map((item) => JSON.parse(item))：将去重后的 JSON 字符串转换回对象。


## 使用嵌套循环进行手动对比
```typescript
const uniqueItems = items.filter((item, index, self) =>
  index === self.findIndex((t) =>
    Object.keys(item).every((key) => item[key] === t[key])
  )
);

console.log(uniqueItems);

```
- self.findIndex((t) => Object.keys(item).every((key) => item[key] === t[key]))：对数组中的每个对象 t，比较其所有属性是否与当前对象 item 的属性相同。
- 如果找到了相同的对象，保留其第一个出现的位置。



## 基于属性值组合生成键
````typescript
const uniqueItems = Array.from(
  new Set(
    items.map((item) =>
      Object.values(item).join('|')
    )
  )
).map(key => {
  const [name, value] = key.split('|');
  return { name, value };
});

console.log(uniqueItems);

````

- Object.values(item).join('|')：获取对象所有属性值并通过 | 连接成字符串。
- Set：使用 Set 去重。
- map：将去重后的键转换回对象。
