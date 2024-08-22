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

