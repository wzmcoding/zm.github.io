---
title: git rebase合并多个commit
date: 2025-05-27
updated: 2025-08-12
categories: Git
tags:
  - Git
top: 2
---

## git rebase合并多个commit

1. git rebase -i <想合并提交的前一个 commithash>
2. git rebase -i HEAD~5 合并最近5个

- 控制台输入命令打开vim界面
- 按 i 健插入  ctrl + c 退出  :wq 保存退出
- 除了第一个 pick 保留，其他的都改成 s
- git commit --amend -m '修改唯一一个commit的信息'
- git push -f
