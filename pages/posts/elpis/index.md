---
title: 基于 webpack5 完成工程化建设
date: 2026-1-13
updated: 2026-1-13
categories: elpis
tags:
  - elpis
top: 1
---

# 基于 webpack5 完成工程化建设

## 1. 控制打包多页面的核心逻辑,多页面与单页面应用的区别
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
### 多页面与单页面应用的区别
- 单页面
  - 一个页面
  - 共用资源（css、js）
  - 页面局部刷新或修改
  - 首屏加载速度慢、SEO 不友好
  - 页面切换快，用户体验好
- 多页面
  - 多个独立页面
  - 不共用资源（css、js）,每个页面都需要加载
  - 整页刷新
  - 首屏时间快、SEO 友好
  - 页面切换慢，用户体验差

1. 为什么mpa比spa首屏快

> 同样的业务功能来说，spa首屏时会把所有的页面用到的资源都加载一遍，使用路由进行页面切换时只是单纯的组件和视图的切换，不再需要向服务器请求资源。
> 而mpa每个页面切换时都是一个新的html，会加载这个页面用到的对应资源，但是不需要加载其他页面的资源，所以mpa首屏加载的也只是首屏对应的html的资源，肯定比加载全部的资源更快



## 2. webpack 会到什么路径下获取 'vue-loader'
```js
// app/webpack/config/webpack.base.js
/**
 * webpack 基础配置
 */
module.exports = {
    // 入口配置
    entry: pageEntries,
    // 模块解析配置（决定了要加载哪些模块，以及用什么样的方式去解析）
    module: {
        rules: [
            {
                test: /\.vue$/,
                use: [
                    {
                        loader: 'vue-loader',
                        options: {
                            compilerOptions: {
                                preserveWhitespace: false
                            }
                        }
                    }
                ]
            },
        ]
    }
}
```
- ./app/webpack/config/node_modules/vue-loader
- ./app/webpack/node_modules/vue-loader
- ./app/node_modules/vue-loader
- ./node_modules/vue-loader (默认)
- 全局安装目录
- NODE_PATH 环境变量

## 3. 这个是分包策略配置的核心，要重点理解 ~~ 里程碑文章也要重点讲这一块
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

## 4. source-map 的配置还有什么
```js
// app/webpack/config/webpack.dev.js
    // 第三方包不作为 entry 入口
    if (v !== 'vendor') {
        baseConfig.entry[v] = [
            // 主入口文件
            baseConfig.entry[v],
            // hmr 更新入口，官方指定的 hmr 路径
            `webpack-hot-middleware/client?path=http://${DEV_SERVER_CONFIG.HOST}:${DEV_SERVER_CONFIG.PORT}/${DEV_SERVER_CONFIG.HMR_PATH}&timeout=${DEV_SERVER_CONFIG.TIMEOUT}`
        ]
    }

const webpackConfig = merge.smart(baseConfig, {
    // 指定开发环境模式
    mode: 'development',
    // source-map 开发工具，呈现代码的映射关系，便于在开发过程中进行代码调试
    devtool: 'eval-cheap-module-source-map',
    output: {
        filename: 'js/[name]_[chunkhash:8].bundle.js',// 输出文件名称
        path: path.resolve(process.cwd(), './app/public/dist/dev/'), // 输出文件路径
        publicPath: `http://${DEV_SERVER_CONFIG.HOST}:${DEV_SERVER_CONFIG.PORT}/public/dist/dev/`, // 外部资源公共路径
        globalObject: 'this'
    },
    plugins: [
        // HMR 热更新
        new webpack.HotModuleReplacementPlugin({
            multiStep: false
        })
    ]
})
```
> 链接： [text](https://www.webpackjs.com/configuration/devtool/#development)

1. 对于开发环境
- eval （构建快，不能正确显示行数）
- eval-source-map （source map 转换为 DataUrl 后添加到 eval() 中，初始化 source map 时比较慢，但是会在重新构建时提供比较快的速度，并且生成实际的文件。行数能够正确映射）
- eval-cheap-source-map （没有生成列映射(column mapping)，只是映射行数。它会忽略源自 loader 的 source map，并且仅显示转译后的代码）
- eval-cheap-module-source-map  （源自 loader 的 source map 会得到更好的处理结果。然而，loader source map 会被简化为每行一个映射(mapping)）

2. 特定场景
- inline-source-map （source map 转换为 DataUrl 后添加到 bundle 中）
- cheap-source-map （没有列映射(column mapping)的 source map，忽略 loader source map）
- inline-cheap-source-map （类似 cheap-source-map，但是 source map 转换为 DataUrl 后添加到 bundle 中）
- cheap-module-source-map （没有列映射(column mapping)的 source map，将 loader source map 简化为每行一个映射(mapping)）
- inline-cheap-module-source-map （类似 cheap-module-source-map，但是 source mapp 转换为 DataUrl 添加到 bundle 中）

3. 生产环境
- source-map （需要完整调试且不担心源码暴露）
- hidden-source-map （仅需错误跟踪，不暴露源码）
- nosources-source-map （需要调试但保护源码）

## 5. 除了 happypack 是否有更好的加速打包工具？
```js
// app/webpack/config/webpack.prod.js
const merge = require('webpack-merge');
const path = require('path');
const os = require('os');
const HappyPack = require('happypack');
```
> 链接 [text](https://www.webpackjs.com/loaders/thread-loader/)
- 除了 HappyPack，目前主流的 Webpack 构建加速方案是 `thread-loader`
- 使用时，需将 `thread-loader` 放置在其他 loader 之前。放置在此 loader 之后的 loader 会在一个独立的 worker 池中运行。
- 每个 worker 都是一个独立的 node.js 进程，其开销大约为 600ms 左右。同时会限制跨进程的数据交换。仅在耗时的操作中使用此 loader！
```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        include: path.resolve('src'),
        use: [
          "thread-loader",
          // 耗时的 loader （例如 babel-loader）
        ],
      },
    ],
  },
};

// optiopns
use: [
  {
    loader: "thread-loader",
    // 有同样配置的 loader 会共享一个 worker 池
    options: {
      // 产生的 worker 的数量，默认是 (cpu 核心数 - 1)，或者，
      // 在 require('os').cpus() 是 undefined 时回退至 1
      workers: 2,

      // 一个 worker 进程中并行执行工作的数量
      // 默认为 20
      workerParallelJobs: 50,

      // 额外的 node.js 参数
      workerNodeArgs: ['--max-old-space-size=1024'],

      // 允许重新生成一个僵死的 work 池
      // 这个过程会降低整体编译速度
      // 并且开发环境应该设置为 false
      poolRespawn: false,

      // 闲置时定时删除 worker 进程
      // 默认为 500（ms）
      // 可以设置为无穷大，这样在监视模式(--watch)下可以保持 worker 持续存在
      poolTimeout: 2000,

      // 池分配给 worker 的工作数量
      // 默认为 200
      // 降低这个数值会降低总体的效率，但是会提升工作分布更均一
      poolParallelJobs: 50,

      // 池的名称
      // 可以修改名称来创建其余选项都一样的池
      name: "my-pool"
    },
  },
  // 耗时的 loader（例如 babel-loader）
];
```

## 6. 生产环境和开发环境，有什么不一样的特殊处理？
```js
// app/webpack/config/webpack.prod.js
const CSSMinimizerPlugin = require('css-minimizer-webpack-plugin')
const ClearWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackInjectAttributesPlugin = require('html-webpack-inject-attributes-plugin');
const TerserWebpackPlugin = require('terser-webpack-plugin');

// 多线程 build 设置
const happypackCommonConfig = {
    debug: false,
    threadPool: HappyPack.ThreadPool({ size: os.cpus().length })
}

// 基类配置
const baseConfig = require('./webpack.base.js')

// 生产环境 webpack 配置
const webpackConfig = merge.smart(baseConfig, {
    // 指定生产环境
    mode: 'production',
})
```

```md
生产环境和开发环境在Webpack配置上有以下关键差异：
1. 构建目标与模式
  开发环境：mode: 'development'，注重快速构建和开发体验
  生产环境：mode: 'production'，注重代码优化和性能
2. 调试与Source Map
  开发环境：配置 devtool: 'eval-cheap-module-source-map'，便于源代码调试
  生产环境：未显式设置，使用默认的production模式source map（通常不生成详细映射）
3. 热更新机制
开发环境：
  配置 webpack.HotModuleReplacementPlugin 插件
  entry中添加 webpack-hot-middleware/client 路径实现HMR
生产环境：无HMR相关配置
4. 代码优化处理
  生产环境特有优化：
    使用 MiniCssExtractPlugin 提取CSS到单独文件
    通过 CSSMinimizerPlugin 压缩CSS资源
    使用 TerserWebpackPlugin 压缩JS并移除 console.log
    配置 optimization.minimizer 实现多进程压缩
    启用多线程打包（HappyPack）提升构建速度
5. 资源缓存策略
  生产环境：
  使用内容哈希 [chunkhash:8] 实现长效缓存
  CSS使用 [contenthash:8] 确保内容变更时更新缓存
6. 构建输出配置
  输出路径：
    开发环境：./app/public/dist/dev/
    生产环境：./app/public/dist/prod/
  publicPath：
    开发环境：使用完整URL http://127.0.0.1:9002/public/dist/dev/
    生产环境：使用相对路径 /dist/prod
7. 其他特殊处理
  生产环境：
    每次构建前清理输出目录（ClearWebpackPlugin）
    设置 crossOriginLoading: 'anonymous' 控制跨域资源请求
    仅对业务代码（./app/pages）进行babel处理，提高构建速度
    关闭性能提示（performance: { hints: false }）
```

## 7. 里程碑文章要 重点讲述你对热更新的理解。
```js
// app/webpack/dev.js
const app = express();

// 从 webpack.dev.js 获取 webpackConfig 和 devServer 配置
const {
    webpackConfig,
    DEV_SERVER_CONFIG
} = require('./config/webpack.dev.js')

const compiler = webpack(webpackConfig)

// 指定静态文件目录
app.use(express.static(path.join(__dirname, '../public/dist')))

// 引用 devMiddleware 中间件 （监控文件改动）
app.use(devMiddleware(compiler, {
    // 落地文件
    writeToDisk: (filePath) => filePath.endsWith('.tpl'),
    // 资源路径
    publicPath: webpackConfig.output.publicPath,
    // headers 配置
    headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,PATCH,OPTIONS',
        'Access-Control-Allow-Headers': 'X-Request-With, content-type, Authorization',
    },
    stats: {
        colors: true
    }
}))
```


## 8. 这里的配置是在解决什么问题？ 如果不加这个配置有什么问题？
```js
// app/webpack/dev.js
// 引用 devMiddleware 中间件 （监控文件改动）
app.use(devMiddleware(compiler, {
    // 落地文件
    writeToDisk: (filePath) => filePath.endsWith('.tpl'),
    // 资源路径
    publicPath: webpackConfig.output.publicPath,
    // headers 配置
    headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,PATCH,OPTIONS',
        'Access-Control-Allow-Headers': 'X-Request-With, content-type, Authorization',
    },
    stats: {
        colors: true
    }
}))
```

```md
`devMiddleware`配置主要解决以下关键问题：
1. 模板文件持久化问题
  writeToDisk: (filePath) => filePath.endsWith('.tpl')
  解决了服务器端渲染(SSR)所需的模板文件无法被访问的问题
  默认情况下 webpack-dev-middleware 仅将文件保存在内存中，不写入磁盘
  通过此配置，确保 .tpl 模板文件被写入磁盘，使服务器端代码能够读取这些模板
2. 资源路径匹配问题
  publicPath: webpackConfig.output.publicPath
  确保开发服务器提供的资源路径与 Webpack 配置中定义的路径一致
  避免因路径不匹配导致的资源 404 错误
3. 跨域资源共享问题
  CORS 头配置
  解决了前端页面与开发服务器不同源时的跨域请求问题
  允许浏览器从不同域安全地加载开发服务器提供的资源
4. 构建日志可读性
  stats: { colors: true }
  提高 Webpack 构建过程日志的可读性，便于开发者快速识别问题
  不加此配置会导致的问题
1. 服务器端渲染完全失效
  如果缺少 writeToDisk 配置，.tpl 模板文件仅存在于内存中
  服务器端代码尝试读取这些文件时会报 ENOENT: no such file or directory 错误
  导致 SSR 应用无法正常工作，页面渲染失败
2. 资源加载问题
  缺少 publicPath 配置会导致资源路径不匹配
  浏览器无法正确加载 JavaScript 和 CSS 资源，出现 404 错误
  页面可能呈现为"无样式内容"(FOUC)或完全空白
3. 严重的跨域问题
  缺少 CORS 头配置会导致：
  浏览器阻止从不同域加载资源
  出现 CORS policy 错误
  特别是在 API 与前端服务分离的架构中，会导致功能完全不可用
4. 开发体验下降
  无颜色的日志输出使构建过程中的错误和警告难以识别
  开发者需要花费更多时间排查构建问题

该应用同时包含前端构建(webpack.dev.js)和服务器端代码(dev.js)
服务器端需要访问 Webpack 生成的模板文件进行 SSR
开发服务器需要同时服务前端资源和 API 请求
没有这个配置，整个开发环境将无法正常工作，特别是服务器端渲染功能会完全失效。
```



## 前端工程化

```js
/**
 * 在知乎或掘金社区上写一篇文章，分享你对前端工程化的理解
   着重描述 多页面构建，分包策略、热更新 等工程化原理
   写好整理到 MR 文档上的学习总结部分。
   回答并改好上面的评论建议 && 写好文章后，就合并吧 ~~
 */
```

### 对前端工程化的理解

### 多页面构建

### 分包策略

### 热更新

