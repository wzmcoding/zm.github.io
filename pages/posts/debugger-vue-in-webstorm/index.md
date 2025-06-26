---
title: WebStorm 如何调试 Vue 项目
date: 2025-06-26
updated: 2025-06-26
categories: work-summary
tags:
  - work-summary
top: 1
---

### 调试前准备
1. 确保 WebStorm 已安装 `JavaScript Debugger`插件。一般情况下，WebStorm 默认已安装此插件。
2. 修改默认浏览器配置：`Settings -> Tools -> Web Browsers and Preview -> Default browser`，选择 Chrome 或 Edge。-> 点击上面的编辑图标
添加选项，`--remote-allow-origins=*` ,**选项必须要添加，否则调试时自动打开的页面是about:blank**,
3. 配置 JavaScript 调试器(一般默认配置好了的，不需要修改): `Settings -> Build, Execution, Deployment -> Debugger`
在 `Built-in server` （内置服务器） 区域中，指定内置 Web 服务器运行的端口。默认情况下，此端口设置为默认 WebStorm 端口 63342，
WebStorm 通过该端口接受来自服务的连接。也可以将端口号设置为从 1024 开始的任何其他值，但非必要无需修改它。
若非要修改，不要改为8080等影响正常业务的端口。如果启动时指定的这个端口被占用，则会自动将端口号加1再启动。

### 调试本地 Vue 项目
1. 配置调试环境： 主菜单选择 `Run/Debug Configurations`，点击左上角的加号，选择 `JavaScript Debug`。
输入配置名称，选择 Chrome 浏览器，URL 填写本地 Vue 项目的地址（如 http://localhost:3300/question-bank-management）。
2. 运行项目并开始调试。从 WebStorm 窗口右上角的列表中选择新创建的配置，然后单击 `Debug` 按钮。
3. 在 JavaScript 代码行左侧点击，之后就会看到一个红色的圆圈，这就是断点。当代码执行到这里时，它会暂停，允许你查看和修改变量值、调用栈等信息。
