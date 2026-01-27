---
title: elpis 动态组件扩展设计
date: 2026-1-27
updated: 2026-1-27
categories: elpis
tags:
  - elpis
top: 1
---

# 动态组件扩展设计

## 动态组件DSL设计
```javascript
// schemaConfig.schema.properties[key] 对每一个key 都有对应的配置
// 字段在不同动态 component 中的相关配置，前缀对应 componentConfig 中的键值
// 如： componentConfig.createForm, 这里对应 createFormOption
// 字段在 createForm 中的相关配置
createFormOption: {
    // ...eleComponentConfig, // 标准 el-component 配置
    comType: '', // 控件类型 input/select/input-number
    visible: true, // 是否展示（true/false）, 默认为 true
    disabled: false, // 是否禁用（true/false）, 默认为 false
    default: '', // 默认值
    // commType === 'select' 时生效
    enumList: [], // 枚举列表
}

// tableConfig.headerButtons
// 按钮事件具体配置
eventOption: {
  // 当 eventKey === 'showComponent'
  comName: '' // 组件名称
}

// tableConfig.rowButtons
// 按钮事件具体配置
eventOption: {
    // 当 eventKey === 'showComponent'
    comName: '',// 组件名称

    // 当 eventKey === 'remove'
    params: {
      // paramKey = 参数键
      // rowValueKey = 参数值(格式为 schema::tableKey ，到 table 中找相应的字段, 比如 user_id: schema::user_id)
      paramKey: rowValueKey
    }
},

// 动态组件 相关配置
componentConfig: {
   // create-form 表单相关配置
   createForm: {
       title: '', // 表单标题
       saveBtnText: '', // 保存按钮文案
   }
   // ...支持用户动态扩展
}
```

## useSchema 处理 components 数据
```javascript
export const useSchema = function () {
  const components = ref({});

  // ....

  // 构造 components: { comKey: { schema: {}, config: {} } }
  const { componentConfig } =  sConfig;
  if (componentConfig && Object.keys(componentConfig).length > 0) {
    const dtoComponents = {};
    for (const comName in componentConfig) {
      dtoComponents[comName] = {
        schema: buildDtoSchema(configSchema, comName),
        config: componentConfig[comName]
      }
    }
    components.value = dtoComponents;
  }

}
```

## 处理 required 字段
```javascript
// 通用构建 schema 方法（清除噪音）
const buildDtoSchema = (_schema, comName) => {
  // ...
  // 提取有效 schema 字段信息
  for (const key in _schema.properties) {
    // ...
    // 处理 required 字段
    const { required } = _schema;
    if (required && required.find(pKey => pKey === key)) {
      dtoProps.option.required = true;
    }
  }
}
```

## 动态组件交互
```javascript
// schema-vie/components/组件/组件.vue

// schema-vie/components/component-config.js
import createForm from './create-form/create-form.vue';

const ComponentConfig = {
  createForm: {
    component: createForm
  }
}

export default ComponentConfig;
// 可以在上面的代码中无限拓展组件

// 在 schema-view.vue 中使用
// 向子孙组件提供数据
import ComponentConfig from './components/component-config.js';
const { components } = useSchema();

provide('schemaViewData', {
  components
});

// table 事件映射
const EventHandlerMap = {
  showComponent: showComponent
}
// table 按钮操作映射
const onTableOperate = ({ btnConfig, rowData}) => {
  const { eventKey } = btnConfig;
  if (EventHandlerMap[eventKey]) {
    // 展示动态组件
    EventHandlerMap[eventKey]({ btnConfig, rowData });
  }
}

// showComponent 展示动态组件
function showComponent({ btnConfig, rowData}) {
  const { comName } = btnConfig.eventOption;
  if (!comName) {
    console.error('没配置组件名')
    return;
  }

  const comRef = comListRef.value.find(item => item.name === comName);
  if (!comRef || typeof comRef?.show !== 'function') {
    console.error(`找不到组件：${comName}`)
    return;
  }
  // 显示组件
  comRef?.show(rowData);
}

// 模板中加载动态组件 :is="ComponentConfig[key]?.component"
// <component
//   v-for="(item, key) in components"
//   :key="key"
//   :is="ComponentConfig[key]?.component"
//   ref="comListRef"
//   @command="onComponentCommand"
//   ></component>

// 动态组件暴露的方法
const show = (rowData) => {
  isShow.value = true;
}

//
```

## 动态组件 schema-form
```vue
// widgets/schema-from/schema-form.vue
<script setup>
import { ref, toRefs, provide } from 'vue';
import FormItemConfig from "./form-item-config";

const Ajv = require('ajv');
const ajv = new Ajv();
provide('ajv', ajv);

const props = defineProps({
  /**
   * schema 配置, 结构如下：
   * {
   *   type: 'object',
   *   properties: {
   *       key: {
   *           label: '', // 字段的中文名
   *           type: '', // 字段类型
   *           option: {
   *               // ...eleComponentConfig, // 标准 el-component 配置
   *               comType: '', // 控件类型 input/select/input-number
   *               visible: true, // 是否展示（true/false）, 默认为 true
   *               disabled: false, // 是否禁用（true/false）, 默认为 false
   *               default: '', // 默认值
   *               // commType === 'select' 时生效
   *               enumList: [], // 枚举列表
   *               required: false, // 表单项是否必填，默认 false
   *           },
   *       },
   *       // ...
   *   },
   * }
   */
  schema: Object,

  /**
   * 表单数据
   */
  model: Object
})
const { schema } = toRefs(props);

const formComList = ref([]);

// 表单校验
const validate = () => {
  return formComList.value.every(component => component?.validate());
}
// 获取表单值
const getValue = () => {
  return formComList.value.reduce((dtoObj, component) => {
    return {
      ...dtoObj,
      ...component?.getValue()
    }
}, {});
}

defineExpose({
  validate,
  getValue
});
</script>

<template>
  <el-row
    v-if="schema && schema.properties"
    class="schema-form"
  >
    <template v-for="(itemSchema, key) in schema.properties">
      <component
        v-show="itemSchema.option.visible !== false"
        ref="formComList"
        :is="FormItemConfig[itemSchema.option?.comType]?.component"
        :schema-key="key"
        :schema="itemSchema"
        :model="model ? model[key] : undefined"
        >
      </component>
  </template>
</el-row>
</template>
```

```js
// 在 widgets/schema-form/complex-view/组件/组件名字.vue 中编写组件，如input, input-number, select
// 在 widgets/schema-form/form-item-config.js 中注册组件
import input from './complex-view/input/input.vue';
import inputNumber from './complex-view/input-number/input-number.vue';
import select from './complex-view/select/select.vue';

const FormItemConfig = {
  input: {
    component: input
  },
  inputNumber: {
    component: inputNumber
  },
  select: {
    component: select
  }
}

export default FormItemConfig;
```
可以在这里无限拓展组件
