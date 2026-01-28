---
title: 抽离并发布 elpis npm包
date: 2026-1-28
updated: 2026-1-28
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
1. 不仅要加载 elpis 下的文件，还要加载业务项目文件，例如 middleware 中间件的加载
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


## 自定义SSR页面，抽离业务页面

## 各种定制化钩子能力支持

## npm 包发布
