---
title: elpis 框架设计理念（领域模型架构建设）
date: 2026-1-22
updated: 2026-1-22
categories: elpis
tags:
  - elpis
top: 1
---

# elpis 是什么？
elpis 是一个基于领域模型架构的全栈开发框架，通过DSL (Domain Specific Language) 与 Schema 设计，解决中后台开发中80%的CRUD问题，也考虑了剩下的20%自定义场景，支持自定义组件、自定义页面等

## 构建 DSL
实现 DSL 需要完成的工作；
1. 设计语法和语义，定义 DSL 中的元素是什么样的，元素代表什么意思；
2. 实现 parser，对 DSL 解析，最终通过解释器来执行

## elpis 中的DSL定义, 模型继承（面向对象）
比如我要描述一个电商系统
```javascript
module.exports = {
  model: "dashbuiness",
  name: '电商系统',
  menu: [{
    key: 'product',
    name: '商品管理',
    menuType: 'module',
    moduleType: 'schema',
    schemaConfig: {
      api: '/api/proj/product',
      schema: {
        type: 'object',
        properties: {
          product_id: {
            type: 'string',
            label: '商品id',
            tableOption: {
              width: 300,
              'show-overflow-tooltip': true,
            },
          },
          product_name: {
            type: 'string',
            label: '商品名称',
            tableOption: {
              width: 200,
            },
            searchOption: {
              comType: 'dynamicSelect',
              api: '/api/proj/product_enum/list',
            }
          },
          price: {
            type: 'number',
            label: '价格',
            tableOption: {
              width: 200,
            },
            searchOption: {
              comType: 'select',
              enumList: [
                {
                  label: '全部',
                  value: -99
                },
                {
                  label: '￥39.9',
                  value: 39.9
                },
                {
                  label: '￥199',
                  value: 199
                },
                {
                  label: '￥699',
                  value: 699
                }
              ]
            }
          },
          inventory: {
            type: 'number',
            label: '库存',
            tableOption: {
              width: 200,
            },
            searchOption: {
              comType: 'input',
            }
          },
          create_time: {
            type: 'string',
            label: '创建时间',
            tableOption: {},
            searchOption: {
              comType: 'dateRange',

            }
          },
        }
      },
      tableConfig: {
        headerButtons: [{
          label: '添加商品',
          eventKey: 'showComponent',
          type: 'primary',
          plain: true,
        }],
        rowButtons: [{
          label: '修改',
          eventKey: 'showComponent',
          type: 'warning'
        }, {
          label: '删除',
          eventKey: 'remove',
          eventOption: {
            params: {
              product_id: 'schema::product_id'
            }
          },
          type: 'danger',
        }],
      },
    }
  }, {
    key: 'order',
    name: '订单管理',
    menuType: 'module',
    moduleType: 'custom',
    customConfig: {
      path: '/todo'
    }
  }, {
    key: 'client',
    name: '客户管理',
    menuType: 'module',
    moduleType: 'custom',
    customConfig: {
      path: '/todo'
    }
  }]
}
```
电商系统的这份配置可以看作是一个基类，可以派生出很多个子类系统，比如拼多多，京东，淘宝等等，这些子系统可以继承基类的配置，
子系统可以覆盖基类中的配置，比如下面是拼多多的配置：
```javascript
module.exports = {
  name: '拼多多',
  desc: 'pdd电商系统',
  homePage: '/schema?proj_key=pdd&key=product',
  menu: [{
    key: 'product',
    name: '商品管理（拼多多）',
    menuType: 'module',
    moduleType: 'custom',
    customConfig: {
      path: '/todo'
    }
  }, {
    key: 'client',
    name: '客户管理（拼多多）',
    menuType: 'module',
    moduleType: 'schema',
    schemaConfig: {
      api: '/api/client',
      schema: {}
    }
  }, {
    key: 'data',
    name: '数据分析（拼多多）',
    menuType: 'module',
    moduleType: 'sider',
    siderConfig: {
      menu: [{
        key: 'analysis',
        name: '电商罗盘',
        menuType: 'module',
        moduleType: 'custom',
        customConfig: {
          path: '/todo'
        }
      }, {
        key: 'sider-search',
        name: '信息查询',
        menuType: 'module',
        moduleType: 'iframe',
        iframeConfig: {
          path: 'https://www.baidu.com'
        }
      },{
        key: 'categories',
        name: '分类数据',
        menuType: 'group',
        subMenu: [{
          key: 'category-1',
          name: '一级分类',
          menuType: 'module',
          moduleType: 'custom',
          customConfig: {
            path: '/todo'
          }
        }, {
          key: 'category-2',
          name: '二级分类',
          menuType: 'module',
          moduleType: 'iframe',
          iframeConfig: {
            path: 'http://www.baidu.com'
          }
        }, {
          key: 'tages',
          name: '标签',
          menuType: 'module',
          moduleType: 'schema',
          schemaConfig: {
            api: '/api/client',
            schema: {}
          }
        }]
      }]
    }
  }, {
    key: 'search',
    name: '信息查询（拼多多）',
    menuType: 'module',
    moduleType: 'iframe',
    iframeConfig: {
      path: 'https://www.baidu.com'
    }
  }]
}
```

## Schema 配置

基于 JSON Schema 规范， 描述数据字段， 比如定义 product_id 字段的类型，中文名，表格配置，搜索栏表单配置等等。
这些数据格式的定义不单单可以用于表格，也可以是数据库、表单、搜索栏 等的字段定义

```javascript
schemaConfig: {
  api: '/api/proj/product',
  schema: {
    type: 'object',
      properties: {
        product_id: {
            type: 'string',
            label: '商品id',
            tableOption: {
              width: 300,
              'show-overflow-tooltip': true,
            },
        },
        product_name: {
          type: 'string',
            label: '商品名称',
            tableOption: {
            width: 200,
          },
          searchOption: {
            comType: 'dynamicSelect',
              api: '/api/proj/product_enum/list',
          }
        },
        price: {
          type: 'number',
            label: '价格',
            tableOption: {
            width: 200,
          },
          searchOption: {
            comType: 'select',
              enumList: [
              {
                label: '全部',
                value: -99
              },
              {
                label: '￥39.9',
                value: 39.9
              },
              {
                label: '￥199',
                value: 199
              },
              {
                label: '￥699',
                value: 699
              }
            ]
          }
        },
        inventory: {
          type: 'number',
            label: '库存',
            tableOption: {
            width: 200,
          },
          searchOption: {
            comType: 'input',
          }
        },
        create_time: {
          type: 'string',
            label: '创建时间',
            tableOption: {},
          searchOption: {
            comType: 'dateRange',

          }
        },
    }
  },
  tableConfig: {
    headerButtons: [{
      label: '添加商品',
      eventKey: 'showComponent',
      type: 'primary',
      plain: true,
    }],
      rowButtons: [{
      label: '修改',
      eventKey: 'showComponent',
      type: 'warning'
    }, {
      label: '删除',
      eventKey: 'remove',
      eventOption: {
        params: {
          product_id: 'schema::product_id'
        }
      },
      type: 'danger',
    }],
  },
}
```

## 实现各种解析器
```javascript
schema: {
    type: 'object',
    properties: {
      product_name: {
          type: 'string',
          label: '商品名称',
          tableOption: {},
          searchOption: {},
          comOption: {},
          apiOption: {},
          dbOption: {},
        },
    },
    tableConfig: {},
    searchConfig: {},
    comConfig: {},
    apiConfig: {},
    dbConfig: {},
}
```
- searchBar 解析器 （searchShema + searchConfig）
- table 解析器 （tableSchema + tableConfig）
- 组件 解析器 （comSchema + comConfig）
- API 解析器
- 数据库表 解析器

在hook 中处理 schema (消除噪音，只返回需要的数据)

```javascript
import { ref, watch, onMounted, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { useMenuStore } from '$store/menu.js';

export const useSchema = function () {
    const route = useRoute();
    const menuStore = useMenuStore();

    const api = ref('');
    const tableSchema = ref({});
    const tableConfig = ref({});
    const searchSchema = ref({});
    const searchConfig = ref({});

    // 构造 schemaConfig 相关配置， 输送给 schemaView 解析
    const buildData = function () {
        const { key, sider_key: siderKey } = route.query;

        const mItem = menuStore.findMenuItem({
            key: 'key',
            value: siderKey ?? key
        });

        if (mItem && mItem.schemaConfig) {
            const { schemaConfig: sConfig } = mItem;

            const configSchema = JSON.parse(JSON.stringify(sConfig.schema));

            api.value = sConfig.api ?? '';

            tableSchema.value = {};
            tableConfig.value = undefined;
            searchSchema.value = {};
            searchConfig.value = undefined;
            nextTick(() => {
                // 构造 tableSchema 和 tableConfig
                tableSchema.value = buildDtoSchema(configSchema, 'table');
                tableConfig.value = sConfig.tableConfig;
                // 构造 searchSchema 和 searchConfig
                const dtoSearchSchema = buildDtoSchema(configSchema, 'search');
                for (const key in dtoSearchSchema.properties) {
                    if (route.query[key] !== undefined) {
                        dtoSearchSchema.properties[key].option.default = route.query[key];
                    }
                }
                searchSchema.value = dtoSearchSchema;
                searchConfig.value = sConfig.searchConfig;
            });

        }
    }

    // 通用构建 schema 方法（清除噪音）
    const buildDtoSchema = (_schema, comName) => {
        if (!_schema?.properties) {
            return {};
        }

        const dtoSchema = {
            type: 'object',
            properties: {},
        };

        // 提取有效 schema 字段信息
        for (const key in _schema.properties) {
            const props = _schema.properties[key];
            if (props[`${comName}Option`]) {
                let dtoProps = {};
                // 提取 props 中非 option 的部分，存放到 dtoProps 中
                for (const pKey in props) {
                    if (pKey.indexOf('Option') < 0) {
                        dtoProps[pKey] = props[pKey];
                    }
                }
                // 处理 comName Option
                dtoProps = Object.assign({}, dtoProps, { option: props[`${comName}Option`] });
                dtoSchema.properties[key] = dtoProps;
            }
        }

        return dtoSchema;
    }

    watch([() => route.query.key, () => route.query.sider_key, () => menuStore.menuList], () => {
        buildData();
    }, { deep: true });

    onMounted(() => {
        buildData();
    });

    return {
        api,
        tableSchema,
        tableConfig,
        searchSchema,
        searchConfig,
    }
}
```

前端封装好对应的组件，然后通过解析器，拿到对应组件的数据，然后渲染到页面上

##  前端封装的 Schema 驱动的组件
- schema-table: 根据 Schema 自动生成表格
- schema-search-bar: 根据 Schema 自动生成搜索栏

`schema-search-bar` 组件封装
```vue
<script setup>
import { ref, toRefs } from 'vue';
import SearchItemConfig from './search-item-config.js';

const props = defineProps({
  /**
   * schema 结构配置如下：
   * {
   *   type: 'object',
   *   properties: {
   *       key: {
   *           // ...schema, // 标准 schema 配置 - 注意：这里需要实际的schema对象
   *           label: '', // 字段的中文名
   *           type: '', // 字段类型
   *           // 字段在 table 中的相关配置
   *           // 字段在 search-bar 中的相关配置
   *           option: {
   *               // ...eleComponentConfig, // 标准 el-component 配置
   *               comType: '', // 配置组件类型 input/select...
   *               default: '', // 默认值
   *           }
   *       },
   *       // ...
   *   }
   * },
   */
  schema: Object
})
const { schema } = toRefs(props);

const emit = defineEmits(['load', 'search', 'reset']);

const searchComList = ref([]);
const handleSearchComList = (el) => {
  searchComList.value.push(el);
}

const getValue = () => {
  let dtoObj = {};
  searchComList.value.forEach(component => {
    dtoObj = {
      ...dtoObj,
      ...component?.getValue()
    }
  });
  return dtoObj;
}

let childComLoadedCount = 0;
const handleChildLoaded = () => {
  childComLoadedCount++;
  if (childComLoadedCount >= Object.keys(schema?.value?.properties).length) {
    emit('load', getValue());
  }
}

const search = () => {
  emit('search', getValue());
}

const reset = () => {
  searchComList.value.forEach(component => {
    component?.reset();
  });
  emit('reset');
}

defineExpose({
  reset,
  getValue
})
</script>

<template>
  <el-form
      v-if="schema && schema.properties"
      :inline="true"
      class="schema-search-bar"
  >
    <!-- 动态组件 -->
    <el-form-item v-for="(schemaItem, key) in schema.properties" :key="key" :label="schemaItem.label">
      <!-- 展示子组件 -->
      <component :ref="handleSearchComList" :is="SearchItemConfig[schemaItem.option?.comType]?.component" :schemaKey="key" :schema="schemaItem" @loaded="handleChildLoaded"></component>
    </el-form-item>
    <!-- 操作区域 -->
    <el-form-item>
      <el-button type="primary" plain class="search-btn" @click="search">搜索</el-button>
      <el-button plain class="reset-btn" @click="reset">重置</el-button>
    </el-form-item>
  </el-form>
</template>

<style lang="less">
.schema-search-bar {
  min-width: 500px;
  .input {
    width: 180px;
  }
  .select {
    width: 180px;
  }
  .dynamic-select {
    width: 180px;
  }
  .search-btn {
    width: 100px;
  }
  .reset-btn {
    width: 100px;
  }
}
</style>
```

### 搜索栏组件扩展
可以无限扩展对应的组件
```javascript
import input from './complex-view/input/input.vue';
import select from './complex-view/select/select.vue';
import dynamicSelect from './complex-view/dynamic-select/dynamic-select.vue';
import dateRange from './complex-view/date-range/date-range.vue';

const SearchItemConfig = {
    input: {
        component: input
    },
    select: {
        component: select
    },
    dynamicSelect: {
        component: dynamicSelect
    },
    dateRange: {
        component: dateRange
    },
}

export default SearchItemConfig;
```
