---
title: 前端工程化
date: 2026-1-14
updated: 2026-1-14
categories: elpis
tags:
  - elpis
top: 1
---

# 前端工程化

## 什么是前端工程化？
前端工程化，指的是将前端开发过程标准化、模块化、自动化，以提升开发效率、保障代码质量，并增强项目的可维护性和可扩展性。

主要体现在以下几个方面：

1. 模块化与组件化

通过模块化（如 ES Module、CommonJS）和组件化（如 Vue、React）开发，将页面拆分为独立的功能单元，提高了代码复用性和可维护性。

2. 构建自动化

借助构建工具（如 Webpack、Vite、Rollup）实现代码打包、压缩、转译（Babel）、资源优化（图片压缩、Tree-Shaking等），减少手动操作，提升效率。

3. 开发流程自动化

使用脚手架（如 Vue CLI、Create React App）统一项目结构和规范，配合自动化测试（Jest、Cypress）、CI/CD （如 GitHub Acitons、Jenkins）实现一键打包、测试、部署。

4. 代码规范与质量保障

引入 ESLint、Prettier、Stylelint 等工具统一代码风格；结合 Husky、Commitlint 等进行代码提交拦截，确保每次提交都符合规范。

5. 版本管理与协作规范

使用 Git 进行版本控制，结合 Git Flow 或 trunk-based development 模式，以及代码评审机制，提升团队协作效率。

6. 性能优化体系

工程化工具链支持懒加载、按需加载、缓存策略、首屏优化等手段，从构建层面优化用户体验。

### 为什么要做前端工程化？
1. 提升效率：例如热更新、模块热替换（HMR）能加快开发调试过程；统一的脚手架和自动部署减少重复性工作。

2. 保障质量：静态检查、单元测试、规范提交等手段帮助我们在开发阶段就发现问题，降低线上故障率。

3. 增强可维护性与扩展性：模块化/组件化让代码结构清晰，利于维护；构建系统支持多环境配置、插件扩展，便于应对复杂业务场景。

4. 支撑多人协作与复杂项目开发：当团队规模扩大或项目复杂度提升时，工程化手段能有效降低沟通和协作成本，推动项目有序迭代。

## 多页面构建
### 多页面与单页面应用的区别
- 单页面（spa）
  - 一个页面
  - 共用资源（css、js）
  - 页面局部刷新或修改
  - 首屏加载速度慢、SEO 不友好
  - 页面切换快，用户体验好
- 多页面 (mpa)
  - 多个独立页面
  - 不共用资源（css、js）,每个页面都需要加载
  - 整页刷新
  - 首屏时间快、SEO 友好
  - 页面切换慢，用户体验差

1. 为什么mpa比spa首屏快

> 同样的业务功能来说，spa首屏时会把所有的页面用到的资源都加载一遍，使用路由进行页面切换时只是单纯的组件和视图的切换，不再需要向服务器请求资源。
> 而mpa每个页面切换时都是一个新的html，会加载这个页面用到的对应资源，但是不需要加载其他页面的资源，所以mpa首屏加载的也只是首屏对应的html的资源，肯定比加载全部的资源更快

```js
// app/webpack/config/webpack.base.js
// 动态构造 pageEntries htmlWebpackPluginList
const pageEntries = {};
const htmlWebpackPluginList = [];
// 获取 app/pages 目录下所有入口文件（entry.xx.js）
const entryList = glob.sync(path.resolve(process.cwd(), './app/pages/**/entry.*.js'))

entryList.forEach(file => {
    const entryName = path.basename(file, '.js')
    // 构造 entry
    pageEntries[entryName] = file
    // 构造最终渲染的页面文件
    htmlWebpackPluginList.push(
        // html-webpack-plugin 辅助注入打包后的 bundle 文件到 tpl 文件中
        new HtmlWebpackPlugin({
        // 产物（最终模板）输出路径
        filename: path.resolve(process.cwd(), "./app/public/dist/", `${entryName}.tpl`),
        // 指定要使用的模板文件
        template: path.resolve(process.cwd(), './app/view/entry.tpl'),
        // 要注入的代码块
        chunks: [entryName]
    }))
})

/**
 * webpack 基础配置
 */
module.exports = {
    // 入口配置
    entry: pageEntries,
}
```

## 分包策略
1. 分包策略核心解析

| 分包类型 | 配置项 | 核心作用 | 典型产出文件 |
| --- | --- | --- | --- |
| 第三方库分离 | `cacheGroups.vendor` | 将所有 `node_modules` 中的依赖打包到一起 | `vendor.[hash].js` |
| 公共模块分离 | `cacheGroups.common` | 提取被至少 2 个入口或异步块引用的业务代码 | `common.[hash].js` |
| 运行时代码分离 | `runtimeChunk: true` | 将 Webpack 的模块管理代码独立，利于缓存 | `runtime.[hash].js` |


2. 配置细节与工作原理
- vendor包（优先级20）：通过 test: /[\\/]node_modules[\\/]/ 正则，所有来自node_modules的模块（如vue、axios）都会被集中打包。高优先级（priority: 20）确保它优先被执行。

- common包（优先级10）：负责提取业务代码中的公共部分。minChunks: 2 是关键，意味着一个模块（如工具函数、公共组件）被两处及以上引用时，才会被提取。

- 运行时代码分离：runtimeChunk: true 将Webpack用于连接模块的“胶水代码”独立出来。这部分代码很小，但频繁变动，分离后可以避免用户每次更新应用都需要重新下载庞大的vendor包。

3. 打包结果
页面的加载请求链通常是：
1. 首先加载 runtime.js （最小）

2. 然后加载 vendor.js （较大，但变更不频繁，缓存命中率高）

3. 接着加载 common.js （中等）

4. 最后加载页面自身的 [entry].js （较小）

充分利用了浏览器缓存：用户首次访问后，vendor和common文件在缓存有效期内无需重复下载，只有业务代码（入口文件和异步块）会更新。

```js
// app/webpack/config/webpack.base.js
// 配置 webpack 插件
    plugins: [
        // 处理 .vue 文件， 这个插件是必须的
        // 它的作用是将你定义过的其他规则复制并应用到 .vue 文件里
        // 例如，如果有一条匹配规则 /\.js$/ 的规则，那么它会应用到 .vue 文件中的 <script> 板块中
        new VueLoaderPlugin(),
        // 把第三方库暴露到 window context 下
        new webpack.ProvidePlugin({
            Vue: 'vue',
            axios: 'axios',
            _: 'lodash'
        }),
        // 定义全局常量
        new webpack.DefinePlugin({
            __VUE_OPTIONS_API__: true, // 支持 vue 解析 options api
            __VUE_PROD_DEVTOOLS__: false, // 禁用 vue devtools
            __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false, // 禁用生产环境显示“水合”信息
        }),
        // 构造最终渲染的页面模板
        ...htmlWebpackPluginList,
    ],
    // 配置代码打包输出优化（代码分割，模块合并，缓存，TreeShaking,压缩等优化策略）
    optimization: {
        splitChunks: {
            chunks: 'all', // 对同步和异步模块都进行切割
            maxAsyncRequests: 10, // 每次异步加载的最大并行请求数
            maxInitialRequests: 10, // 入口点的最大并行请求数
            cacheGroups: {
                vendor: { // 第三方依赖库
                    test: /[\\/]node_modules[\\/]/, // 打包 node_modules 中的文件
                    name: 'vendor', // 模块名称
                    priority: 20, //优先级，数字越大，优先级越高
                    enforce: true, // 强制执行
                    reuseExistingChunk: true, // 复用已有的chunk
                },
                common: { // 公共模块，
                    name: 'common',// 模块名称
                    minChunks: 2, // 被两处应用即被归为公共模块
                    minSize: 1, //最小分割文件大小（1 byte）
                    priority: 10, //优先级
                    reuseExistingChunk: true, // 复用已有的chunk
                }
            }
        },
        // 将 webpack 运行时生成的代码打包到 runtime.js
        runtimeChunk: true,
    }
```

## 热更新
> Hot Module Replacement，简称HMR，无需完全刷新整个页面的同时，更新模块。

### Webpack热更新的工作原理

Webpack的热更新工作原理如下：

1. 启用HMR：需要在Webpack配置中启用HMR。这通常涉及到添加webpack-dev-server或webpack-hot-middleware插件，以及在Webpack配置中设置hot: true。

2. 监视文件变化：Webpack会监视所有入口模块及其依赖的文件变化。当某个模块发生变化时，Webpack会发出更新信号。

3. 替换更新的模块：当有模块发生变化时，Webpack会使用新的模块替换旧模块，同时保持应用程序的状态。这涉及到替换JavaScript模块、更新样式表或执行其他必要的操作。

4. 通知客户端：Webpack会将热更新的信息传递给浏览器，以便浏览器可以应用更新的代码和资源。这通常涉及到WebSocket或其他通信机制。

5. 应用更新：浏览器会应用更新的代码和资源，从而在不刷新页面的情况下呈现新的效果。这可以包括更新UI、重新渲染组件或执行其他必要的操作。

```js
// webpack.dev.js

Object.keys(baseConfig.entry).forEach((v) => {
  // 第三方包不作为 hmr 的入口
  if (v !== "vendor") {
    baseConfig.entry[v] = [
      // 主入口文件
      baseConfig.entry[v],
      // hmr 更新入口，官方指定的 hmr 路径
      `webpack-hot-middleware/client?path=http://${DEV_SERVER_CONFIG.HOST}:${DEV_SERVER_CONFIG.PORT}/${DEV_SERVER_CONFIG.HMR_PATH}&timeout=${DEV_SERVER_CONFIG.TIMEOUT}`,
    ];
  }
});

// webpack.dev.js
plugins: [
    // HotModuleReplacementPlugin 用于实现热模块替换（Hot Module Replacement，简称 HMR）
    // 模块热替换允许在应用程序运行时替换模块
    // 极大的提升开发效率，因为能让应用程序一直保持运行状态
    new webpack.HotModuleReplacementPlugin({
      multiStep: false,
    }),
  ],
```
