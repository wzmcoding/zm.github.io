---
title: 抽离并发布 elpis npm包
date: 2026-1-28
updated: 2026-1-29
categories: elpis
tags:
  - elpis
top: 1
---

# 抽离并发布 elpis npm包

## 本地调试 npm 包
- elpis 中执行 `npm link`, 将 `elpis` 软链接到 `node_modules` 目录下（全局）
- 业务项目中执行 `npm link 包名`, 将 `elpis` 软链到业务项目中
- 在业务项目中执行 `npm i`, 会导致链接丢失，需要重新执行 `npm link 包名`

## 对外提供入口
```javascript
// 引入 elpis-core
const ElpisCore = require("./elpis-core");

module.exports = {
  /**
   * 启动 elpis
   * @params options 项目配置，透传到 elpis-core
   */
  serverStart(options = {}) {
    const app = ElpisCore.start(options);
    return app;
  }
}
```

## elpis-core 模块抽离
1. 不仅要加载 elpis 下的文件，还要加载业务项目文件，例如 `middleware` 中间件的加载
```javascript
const middlewares = {}

// 读取 elpis/app/middleware/**/**.js 下所有的文件
const elpisMiddlewarePath = path.resolve(__dirname, `..${sep}..${sep}app${sep}middleware`);
const elpisFileList = glob.sync(path.resolve(elpisMiddlewarePath, `.${sep}**${sep}**.js`));
elpisFileList.forEach(handleFile);

// 读取 业务根目录/app/middleware/**/**.js 下所有的文件
const businessMiddlewarePath = path.resolve(app.businessPath, `.${sep}middleware`);
const businessFileList = glob.sync(path.resolve(businessMiddlewarePath, `.${sep}**${sep}**.js`));
businessFileList.forEach(handleFile);

// 把内容加载到 app.middlewares 下
function handleFile(file) {
  //提取文件名称
  let name = path.resolve(file);
  //截取路径 把 app/middleware/custom-module/custom-middleware.js 改为custom-module/custom-middleware
  name = name.substring(name.lastIndexOf(`middleware${sep}`) + `middleware${sep}`.length,name.lastIndexOf('.'))
  //把'-'改为驼峰式
  name = name.replace(/[_-][a-z]/ig,(s)=>s.substring(1).toUpperCase())
  //挂载 middleware 到内存app对象中
  let tempMiddleware = middlewares;
  const names = name.split(sep);
  for(let i = 0 ,len = names.length; i<len;++i){
    if(i === len -1){
      tempMiddleware[names[i]] = require(path.resolve(file))(app);
    }else{
      if(!tempMiddleware[names[i]]){
        tempMiddleware[names[i]] = {}
      }
      tempMiddleware = tempMiddleware[names[i]]
    }
  }
}
app.middlewares = middlewares
```
2. 其它的，例如 `routerSchema`、`controller`、`service`、`extend` 也是做类似的操作
3. config修改: 业务项目配置覆盖 elpis
```javascript
    // elpis config 目录及相关文件
    const elpisConfigPath = path.resolve(__dirname, `..${sep}..${sep}config`);
    let defaultConfig = require(path.resolve(elpisConfigPath, `.${sep}config.default.js`));

    // 业务 config 目录及相关文件
    const businessConfigPath = path.resolve(process.cwd(), `.${sep}config`);
    try {
        defaultConfig = {
            ...defaultConfig,
            ...require(path.resolve(businessConfigPath, `.${sep}config.default.js`))
        }
    } catch (e) {
        console.log('[exception] there is no default.config file')
    }
    // 获取env.config配置
    let envConfig = {}
    try {
        if (app.env.isLocal()) { //本地环境
            envConfig = require(path.resolve(businessConfigPath, `.${sep}config.local.js`))
        } else if (app.env.isBeta()) { //测试环境
            envConfig = require(path.resolve(businessConfigPath, `.${sep}config.beta.js`))
        } else if (app.env.isProduction()) { //生产环境
            envConfig = require(path.resolve(businessConfigPath, `.${sep}config.prod.js`))
        }
    } catch (e) {
        console.log('[exception] there is no default.config file')
    }

    // 覆盖并加载 config 配置
    app.config = Object.assign({}, defaultConfig, envConfig)
```
## 工程化改造
1. `/app/webpack/dev.js`,`/app/webpack/prod.js` 的导出改成函数

2. 对外暴露工程化构建方法
```javascript
// 引入 前端工程化构建方法
const FEBuildDev = require('./app/webpack/dev.js');
const FEBuildProd = require('./app/webpack/prod.js');

module.exports = {
  /**
   * 编译构建前端工程
   * @param env 环境变量 local/production
   */
  frontendBuild(env) {
    if (env === 'local') {
      FEBuildDev();
    } else if (env === 'production') {
      FEBuildProd();
    }
  }
}
```

3. 路径别名修改
```javascript
resolve: {
  extensions: ['.js', '.vue', '.less', '.css'],
  alias: {
      $pages: path.resolve(process.cwd(), './app/pages'),
      $common: path.resolve(process.cwd(), './app/pages/common'),
      $widgets: path.resolve(process.cwd(), './app/pages/widgets'),
      $store: path.resolve(process.cwd(), './app/pages/store'),
  },
},
// 上面的代码会加载业务项目中的文件，需要修改成加载elpis中的文件
alias: {
    $pages: path.resolve(__dirname, '../../pages'),
    $common: path.resolve(__dirname, '../../pages/common'),
    $widgets: path.resolve(__dirname, '../../pages/widgets'),
    $store: path.resolve(__dirname, '../../pages/store'),
},
// 统一改成前缀 $elpis
```

4. 业务项目中使用 webpack 打包，loader 会从业务目录的 `node_modules` 加载，需要从改成 elpis 的 `node_modules` 目录加载，
使用 `require.resolve(loaderName)` 获取loader路径
```javascript
{
  test: /\.vue$/,
  use: [
    {
      loader: require.resolve('vue-loader'),
    }
  ]
}
```

5. 加载业务 `webpack` 配置
```javascript
let businessWebpackConfig = {};
try {
    businessWebpackConfig = require(`${process.cwd()}/app/webpack.config.js`);
} catch (e) {
    console.log('[exception] there is no webpack.config.js file')
}

module.exports = merge.smart({}, businessWebpackConfig)
```

## 自定义SSR页面，抽离业务页面
1. 除了 elpis 的入口文件需要解析外，还需要解析业务项目中的入口文件
```javascript
// 动态构造 businessPageEntries businessHtmlWebpackPluginList
const businessPageEntries = {};
const businessHtmlWebpackPluginList = [];
// 获取 business/app/pages 目录下所有入口文件（entry.xx.js）
const businessEntryList = glob.sync(path.resolve(process.cwd(), './app/pages/**/entry.*.js'))
businessEntryList.forEach(file => {
  handleFile(file, businessPageEntries, businessHtmlWebpackPluginList)
})

// 动态构造 elpisPageEntries elpisHtmlWebpackPluginList
const elpisPageEntries = {};
const elpisHtmlWebpackPluginList = [];
// 获取 elpis/app/pages 目录下所有入口文件（entry.xx.js）
const elpisEntryList = glob.sync(path.resolve(__dirname, '../../pages/**/entry.*.js'))
elpisEntryList.forEach(file => {
  handleFile(file, elpisPageEntries, elpisHtmlWebpackPluginList)
})

// 构造相关 webpack 处理的数据结构
function handleFile(file, entries = {}, htmlWebpackPluginList = []) {
  const entryName = path.basename(file, '.js')
  // 构造 entry
  entries[entryName] = file
  // 构造最终渲染的页面文件
  htmlWebpackPluginList.push(
    // html-webpack-plugin 辅助注入打包后的 bundle 文件到 tpl 文件中
    new HtmlWebpackPlugin({
      // 产物（最终模板）输出路径
      filename: path.resolve(process.cwd(), "./app/public/dist/", `${entryName}.tpl`),
      // 指定要使用的模板文件
      template: path.resolve(__dirname, '../../view/entry.tpl'),
      // 要注入的代码块
      chunks: [entryName]
    })
  )
}

{
  // 入口配置
  entry: Object.assign({}, elpisPageEntries, businessPageEntries),
}

{
  test: /\.js$/,
    include: [
      // 处理 elpis 目录
      path.resolve(__dirname, '../../pages'),
      // 处理 业务 目录
      path.resolve(process.cwd(), './app/pages')
    ],
    use: {
      loader: require.resolve('babel-loader'),
    },
}

alias: {
    'vue': require.resolve('vue'),
    '@babel/runtime/helpers/toConsumableArray': require.resolve('@babel/runtime/helpers/toConsumableArray'),
    '@babel/runtime/helpers/asyncToGenerator': require.resolve('@babel/runtime/helpers/asyncToGenerator'),
    '@babel/runtime/regenerator': require.resolve('@babel/runtime/regenerator'),
    $elpisPages: path.resolve(__dirname, '../../pages'),
    $elpisCommon: path.resolve(__dirname, '../../pages/common'),
    $elpisCurl: path.resolve(__dirname, '../../pages/common/curl.js'),
    $elpisUtils: path.resolve(__dirname, '../../pages/common/utils.js'),
    $elpisWidgets: path.resolve(__dirname, '../../pages/widgets'),
    $elpisHeaderContainer: path.resolve(__dirname, '../../pages/widgets/header-container/header-container.vue'),
    $elpisSiderContainer: path.resolve(__dirname, '../../pages/widgets/sider-container/sider-container.vue'),
    $elpisSchemaTable: path.resolve(__dirname, '../../pages/widgets/schema-table/schema-table.vue'),
    $elpisSchemaForm: path.resolve(__dirname, '../../pages/widgets/schema-form/schema-form.vue'),
    $elpisSchemaSearchBar: path.resolve(__dirname, '../../pages/widgets/schema-search-bar/schema-search-bar.vue'),
    $elpisStore: path.resolve(__dirname, '../../pages/store'),
    $elpisBoot: path.resolve(__dirname, '../../pages/boot.js'),
}
```

## 各种定制化钩子能力支持
1. elpis 提供的自定义动态组件需要对外提供 业务拓展，支持定制化页面

2. 例如 `component` 组件 config 配置文件
```javascript
import createForm from './create-form/create-form.vue';

// 业务扩展 component 配置
import BusinessComponentConfig from '$businessComponentConfig';

const ComponentConfig = {
    createForm: {
        component: createForm
    },
    // ...
}

export default {
    ...ComponentConfig,
    ...BusinessComponentConfig
};
```

```javascript
resolve: {
        extensions: ['.js', '.vue', '.less', '.css'],
        alias: (() => {
            const aliasMap = {};
            const blankModulePath = path.resolve(__dirname, '../libs/blank.js');

            // dashboard 路由扩展配置
            const businessDashboardRouterConfig = path.resolve(process.cwd(), './app/pages/dashboard/router.js');
            aliasMap['$businessDashboardRouterConfig'] = fs.existsSync(businessDashboardRouterConfig) ? businessDashboardRouterConfig : blankModulePath;

            // schema-view component 扩展配置
            const businessComponentConfig = path.resolve(process.cwd(), './app/pages/dashboard/complex-view/schema-view/components/component.config.js');
            aliasMap['$businessComponentConfig'] = fs.existsSync(businessComponentConfig) ? businessComponentConfig : blankModulePath;

            // schema-form 扩展配置
            const businessFormItemConfig = path.resolve(process.cwd(), './app/pages/widgets/schema-form/form-item-config.js');
            aliasMap['$businessFormItemConfig'] = fs.existsSync(businessFormItemConfig) ? businessFormItemConfig : blankModulePath;

            // schema-search-bar 扩展配置
            const $businessSearchItemConfig = path.resolve(process.cwd(), './app/pages/widgets/schema-search-bar/search-item-config.js');
            aliasMap['$businessSearchItemConfig'] = fs.existsSync($businessSearchItemConfig) ? $businessSearchItemConfig : blankModulePath;

            return {
                // ...
                ...aliasMap,
            }
        })(),
}
```
如果用户没有配置对应的 `config` 文件，则使用默认的 `blank.js` 防止 webpack 打包时报错

3. 业务拓展路由
```javascript
import boot from '$elpisPages/boot.js'
import dashboard from './dashboard.vue'
import businessDashboardRouterConfig from '$businessDashboardRouterConfig';

const routes = [];

// 头部菜单路由
routes.push({
    path: '/view/dashboard/iframe',
    component: () => import('./complex-view/iframe-view/iframe-view.vue')
});

const siderRoutes = [
    {
        path: 'iframe',
        component: () => import('./complex-view/iframe-view/iframe-view.vue')
    },
    {
        path: 'schema',
        component: () => import('./complex-view/schema-view/schema-view.vue')
    },
]

// 侧边栏菜单路由
routes.push({
    path: '/view/dashboard/sider',
    component: () => import('./complex-view/sider-view/sider-view.vue'),
    children: siderRoutes
})

// 业务拓展路由
if (typeof businessDashboardRouterConfig === 'function') {
    businessDashboardRouterConfig({ routes, siderRoutes });
}

boot(dashboard, { routes });
```

## npm 包发布
- `package.json` 中修改 `name: '@wangzhengmincoder/elpis'`
- 暴露服务端基础配置
```javascript
{
  /**
   * 服务端基础
   */
  Controller: {
    Base: require('./app/controller/base.js'),
  },
  Service: {
    Base: require('./app/service/base.js'),
  },
}
```
- `npm login` 登录
- `npm publish --access public` 发布
- 遇到报错
```text
npm notice Publishing to https://registry.npmjs.org/ with tag latest and public access npm error code E403 npm error 403
 403 Forbidden - PUT https://registry.npmjs.org/@wangzhengmincoder%2felpis
 - Two-factor authentication or granular access token with bypass 2fa enabled is required to publish packages.
 npm error 403 In most cases, you or one of your dependencies are requesting npm error 403 a package version that
  is forbidden by your security policy, or npm error 403 on a server you do not have access to.
  npm error A complete log of this run can be found in: C:\Users\dhswz\AppData\Local\npm-cache\_logs\2026-01-27T08_56_57_750Z-debug-0.log
```
只需要配置一下 `npm` 的 `token`
```javascript
npm config set //registry.npmjs.org/:_authToken=新生成的Token
```
