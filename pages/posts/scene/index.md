---
title: 场景题
date: 2025-10-22
updated: 2025-10-22
categories: 场景题
tags:
  - 场景题
top: 1
---

# 场景题

## 请求竞态问题
> 假如我们页面上有两个按钮，这两个按钮是调用同一个函数发送请求，但是他们的参数是不一样的，最终页面上只能展示一个请求的结果，
> 如果我们不对它进行限制，那么就会导致请求竞态问题，假设我们点击按钮1，在按钮1发送的请求没回来的时候，我们又点击按钮2，
> 那么我们很难保证按钮2的请求一定会比按钮1的请求先回来，所以是有可能导致按钮2先回来，那么按钮1的请求结果就会覆盖按钮2的请求结果，
> 这样就会导致页面上的结果是错误的，所以我们就需要解决这个问题

```typescript
/**
 * 创建一个可取消的异步任务包装器
 * @param fn 需要被包装的异步函数
 * @returns 返回一个对象， 包含一个 cancel 方法和一个 run 方法
 */
export function createCancelableTask(fn: any) {
    // 定义一个空操作函数，用于重置 resolve 和 reject
    const NOOP = () => { }
    // 初始化取消函数
    let cancel = NOOP

    return {
        // 提供取消当前任务的方法
        cancel: () => cancel(),
        // 执行异步任务的方法，接收与原函数相同的参数
        run: (...args: any[]) => {
            return new Promise((resolve, reject) => {
                // 如果有正在执行的任务，先取消它
                cancel()
                // 重新定义取消函数，将 resolve 和 reject 重置为空操作
                cancel = () => (resolve = reject = NOOP)

                fn(...args)
                    .then(
                        (res: any) => resolve(res), // 当 fn 执行成功时，调用 resolve
                        (err: any) => reject(err), // 当 fn 执行失败时，调用 reject
                    )
            })
        }
    }
}
// 测试用例
console.log("开始防竞态请求测试...");

const { run, cancel } = createCancelableTask(async (num: number) => {
    console.log(`开始请求 ${num}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`请求 ${num} 完成`);
    return `结果 ${num}`;
});

// 连续发送三个请求
run(1).then(result => {
    console.log(`请求1结果: ${result}`);
}).catch(err => {
    console.log(`请求1被取消`);
});

run(2).then(result => {
    console.log(`请求2结果: ${result}`);
}).catch(err => {
    console.log(`请求2被取消`);
});

run(3).then(result => {
    console.log(`请求3结果: ${result}`);
}).catch(err => {
    console.log(`请求3被取消`);
});

console.log("注意: 只有最后一个请求(请求3)会成功完成，前两个会被自动取消");
// 开始防竞态请求测试...
// App.vue:36 开始请求 1
// App.vue:36 开始请求 2
// App.vue:36 开始请求 3
// App.vue:61 注意: 只有最后一个请求(请求3)会成功完成，前两个会被自动取消
// App.vue:38 请求 1 完成
// App.vue:38 请求 2 完成
// App.vue:38 请求 3 完成
// App.vue:56 请求3结果: 结果 3
```

这个函数实现了一个可取消的异步任务包装器，它接收一个异步函数作为参数，并返回一个包含`run` 和 `cancel` 方法的对象。

- `run`方法接收与原函数相同的参数，并返回一个`Promise`,当原函数执行成功时，调用`resolve`,当原函数执行失败时，调用`reject`,,如果上一次请求没有完成，那么会取消上一次请求，并重新发起新的请求
- `cancel`方法用于取消当前正在进行的任务，它会调用原函数的取消函数，并将 `resolve` 和 `reject` 重置为空操作，置空后，无论请求成功还是失败，都不会再执行之前的 `resolve` 和 `reject` ,所以`Promise`的状态不会改变，也就不会触发`then`或者`catch`方法

> 注意，这种方法**只是说我们不再需要响应结果了**，但是请求是已经发出去的，函数也是已经执行的，我们并不能对它已经执行的操作进行回滚


## 并发控制器
```typescript
/**
 * 假设我们要上传一个20GB的大文件，将其分成100个10MB的分片。如果不使用任务调度器，同时发起100个上传请求会导致以下问题： 
 * 1.浏览器的并发请求数量被占满 
 * 2.其他正常业务请求可能无法及时发送 
 * 3.服务器压力过大 
 * 4.网络带宽被占满
 * 那么这个问题我们应该如何解决呢？
 * 我们可以尝试着将所有的任务，都放到一个队列里面去，
 * 这样我们每次最多发送两个请求，如果有一个请求发送完成，那么我们再从这个队列里面取出一个发送请求，
 * 我们只需要保证同时发送的请求不超过两个，这样就可以保证并发数量不被占满，也不会占用过多的带宽，下面我们来实现这个功能
 */

/**
 * 任务调度器类
 * 用于控制并发任务的执行数量
 * 实现了任务队列和并发限制的功能
 */
export class TaskScheduler {
    // 存储待执行的任务队列
    tasks: any[] = []
    // 当前正在执行的任务数量
    runningCount = 0
    // 最大并发限制数
    limit: number

    constructor(limit: number) {
        this.limit = limit
    }

    /**
     * 执行任务
     * 检查是否可以执行新的任务，并从任务队列中取出任务执行
     * 任务执行完成后会检查队列中是否还有待执行的任务，如果有则继续执行
     */
    run() {
        if (this.runningCount >= this.limit || this.tasks.length <= 0) {
            // 如果当前运行的任务数达到上限或者任务队列为空，则不执行新任务
            return
        }
        this.runningCount++
        // 从队列头部取出一个任务
        const task = this.tasks.shift()
        // 执行任务，任务执行完成后递归执行 run 函数
        task().finally(() => {
            // 减少运行中的任务计数
            this.runningCount--
            // 检查是否还有任务可以执行
            this.run()
        })
    }

    /**
     * 添加新任务到调度器
     * @param task - 要执行的任务函数，必须返回 Promise
     * @returns - 返回一个 Promise，当任务执行完成时 resolve
     */
    addTask(task: any) {
        return new Promise((...args: any[]) => {
            // 将任务包装后添加到队列
            this.tasks.push(() => task().then(...args))
            // 立即执行任务
            this.run()
        })
    }
}

//创建一个最大并发数为2的调度器实例
const scheduler = new TaskScheduler(2)
// 创建一个延迟函数
function delay(time: number) {
    return new Promise(resolve => setTimeout(resolve, time))
}
// 开始计时
console.time('分片1')
console.time('分片2')
console.time('分片3')
console.time('分片4')
console.time('分片5')

// 添加5个任务到调度器
// 由于并发限制为2，这些任务会分批执行：
// 第一批：分片1和2同时执行，1秒后完成
// 第二批：分片3和4同时执行，2秒后完成
// 第三批：分片5单独执行，3秒后完成
scheduler.addTask(() => delay(1000).then(() => console.timeEnd('分片1'))) // 1秒后输出分片1
scheduler.addTask(() => delay(1000).then(() => console.timeEnd('分片2'))) // 1秒后输出分片2
scheduler.addTask(() => delay(2000).then(() => console.timeEnd('分片3'))) // 2秒后输出分片3
scheduler.addTask(() => delay(2000).then(() => console.timeEnd('分片4'))) // 2秒后输出分片4
scheduler.addTask(() => delay(3000).then(() => console.timeEnd('分片5'))) // 3秒后输出分片5
// 打印
// 分片1: 1017.328857421875 ms
// 分片2: 1017.73486328125 ms
// 分片3: 3029.158935546875 ms
// 分片4: 3029.530029296875 ms
// 分片5: 6035.072021484375 ms
```

## 版本更新导致的副作用
场景： 
当我们的项目部署上线后，假设用户正在某个页面填写表单，这个表单比较大，有50个字段，用户在填写的过程中，突然你们发布了新版本，这个新版本导致表单填完之后跳转的页面中js加载错误，原因是重新部署后，之前的文件没了，这个问题怎么解决？

解决方案：
保留上个版本的静态资源，当客户端请求的资源在当前版本中不存在时，通过Nginx的配置自动在历史版本目录中查找文件

Nginx的具体配置流程
1. 目录结构设计
首先，设计合理的目录结构来管理多个版本：
```text
/var/www/static/
├── current/          # 当前版本 -> v2 (软链接)
├── v1/               # 版本1目录
│   ├── js/
│   ├── css/
│   └── assets/
├── v2/               # 版本2目录  
│   ├── js/
│   ├── css/
│   └── assets/
└── v3/               # 版本3目录
    ├── js/
    ├── css/
    └── assets/
```

2. Nginx 配置方案(使用映射表)
```nginx
# 创建版本映射
map $uri $static_version {
    default "current";
    
    # 可以根据文件特征映射到特定版本
    ~*main\.[a-f0-9]{8}\.js$ "v2";
    ~*chunk-\w+\.[a-f0-9]{8}\.js$ "v2";
}

server {
    listen 80;
    server_name your-domain.com;
    
    root /var/www/static;
    
    location / {
        try_files /current/$uri /current/$uri/ /current/index.html;
    }
    
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        # 使用映射的版本，如果找不到则回退查找
        try_files /$static_version/$uri /current/$uri @historical_versions;
        
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    location @historical_versions {
        # 在历史版本中查找
        try_files /v3/$uri /v2/$uri /v1/$uri =404;
        
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header X-Static-Fallback "true";
    }
}
```

3. 部署脚本示例
```bash
#!/bin/bash
# deploy.sh

VERSION="v3"
PREVIOUS_VERSION="v2"
BACKUP_COUNT=3

# 创建新版本目录
mkdir -p /var/www/static/$VERSION

# 复制新版本文件
cp -r ./dist/* /var/www/static/$VERSION/

# 更新当前版本软链接
ln -sfn /var/www/static/$VERSION /var/www/static/current

# 清理旧版本（保留最近3个版本）
cd /var/www/static
ls -d v* | sort -r | tail -n +$((BACKUP_COUNT+1)) | xargs rm -rf

# 重载Nginx
nginx -s reload

echo "Deployed version $VERSION successfully"
```
4. 最佳实践建议
- 版本化资源命名：使用文件hash作为文件名，如 main.a1b2c3d4.js
- 保留策略：根据业务需求保留2-3个历史版本
- 监控告警：监控404错误，及时发现资源缺失
- 渐进式更新：先部署静态资源，再更新HTML入口文件
- CDN配置：如果使用CDN，配置类似的回退策略

5. 验证配置
测试Nginx配置：
```bash
nginx -t
```

重载配置：
```bash
nginx -s reload
```
这样配置后，即使新版本发布，用户正在填写的表单所需的旧版本静态资源仍然可以正常加载，确保用户体验不受影响。

## localStorage 存储 token 的过期时间
在前端登录流程中，后端会返回一个`token`用于用户的身份验证。
如果你把这个`token`存到`localStorage`里，下次用户刷新页面时可以直接使用它去请求接口，但如果`token`永不过期，就会造成安全风险，比如被人盗用。
因此，需要在存到`localStorage`时额外保存一个**过期时间戳**，在取`token`时判断是否过期，过期则跳转到登录页。

> 注意我们正常也可以存到cookie里面，cookie里面是可以设置过期时间的，但是有的同学还是会放到`localStorage`里，这里就介绍一下如何在`localStorage`单存储`token`的过期时间

```javascript
// 存储 token(假设后端返回的 token 有效期是 2 小时)
function setToken(token: string, expireSeconds: number = 7200) {
    const data = {
        token,
        expire: Date.now() + expireSeconds * 1000
    }
    localStorage.setItem('authToken', JSON.stringify(data))
}
// 获取 token
function getToken() {
    const tokentStr = localStorage.getItem('authToken')
    if (!tokentStr) {
        return null
    }
    const tokenData = JSON.parse(tokentStr)
    if (Date.now() > tokenData.expire) {
        localStorage.removeItem('authToken') // 清理过期 token
        return null
    }
    return tokenData.token
}

// 使用 token 
const token = getToken()
if (!token) {
    // token 过期或者不存在，跳转到登录页
    window.location.href = '/login'
}
```