---
title: jeecg table 组件空数据时自定义内容
date: 2025-06-20
updated: 2025-06-20
categories: work-summary
tags:
  - work-summary
top: 2
---

#### jeecg table 组件空数据时自定义内容
- 在使用 jeecg table 组件时，默认的空数据提示可能不符合需求，可以通过 `locale.emptyText` 属性自定义空数据时的内容。
- 好像不支持 `<div></div>`写法， 可以通过h函数来实现

下面是表格属性配置
```typescript
const { tableContext } = useListPage({
    designScope: 'class-list',
    tableProps: {
      title: '',
      api: list,
      columns: columns,
      formConfig: {
        showAdvancedButton: false,
        showActionButtonGroup: false,
      },
      showIndexColumn: true,
      showTableSetting: false,
      actionColumn: {
        ifShow: true,
        width: 240,
        fixed: 'right',
      },
      // 这个属性可以自定义空数据时的内容
      locale: {
        emptyText: emptyRender(),
      },
    },
});
```
h函数的实现如下：
```typescript
const emptyRender = () => {
    return h(
      'div',
      {
        style: {
          textAlign: 'center',
          padding: '40px',
          color: '#333',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        },
      },
      [
        h('div', { style: { marginBottom: '20px' } }, [
          h(SnippetsOutlined, {
            style: { width: '50px', height: '50px', opacity: '0.3', fontSize: '50px' },
          }),
        ]),
        h(
          'div',
          {
            style: {
              fontSize: '16px',
              marginBottom: '20px',
              fontWeight: 'bold',
            },
          },
          '还没有班级，赶快创建一个吧'
        ),
        h(
          'button',
          {
            style: {
              padding: '5px 10px',
              backgroundColor: '#1890FF',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              color: '#fff',
            },
            onClick: () => {
              // 这里可以调用添加班级的函数
              handleAdd();
            },
          },
          '新建班级'
        ),
      ]
    );
};
```
