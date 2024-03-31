---
title: Git 使用
date: 2024-03-31
updated: 2024-03-31
categories: ZM 笔记
tags:
  - Git
top: 2
---

### git rebase介绍
- git rebase是git的一个分支管理命令，它允许你将一个分支的提交历史重写到另一个分支上。
- git rebase命令主要用途：将一个分支的提交历史重写到另一个分支上，以便将一个分支的提交历史重写到另一个分支上。

### git rebase命令的基本语法：
- git rebase [options] [branch]
### git rebase命令的选项：
- --onto：指定重写后的分支的父分支。
- --keep-empty：保留空提交。
- --interactive：交互式重写。
- --continue：继续重写。
### git rebase命令的用法：
- git rebase [options] [branch]：将当前分支的提交历史重写到指定分支上。
- git rebase --onto [branch] [branch]：将当前分支的提交历史重写到指定分支上，并指定重写后的分支的父分支。
- git rebase --keep-empty [branch]：将当前分支的提交历史重写到指定分支上，并保留空提交。
- git rebase --interactive [branch]：将当前分支的提交历史重写到指定分支上，并使用交互式重写。
### git rebase命令的示例：
- git rebase master：将当前分支的提交历史重写到master分支上。
- git rebase --onto master feature：将当前分支的提交历史重写到master分支上，并指定重写后的分支的父分支为feature分支。
- git rebase --keep-empty master：将当前分支的提交历史重写到master分支上，并保留空提交。
### git rebase命令的注意事项：
- git rebase命令只能用于本地分支，不能用于远程分支。
- git rebase命令只能用于当前分支，不能用于其他分支。
### git rebase命令的常见问题：
- Q：git rebase命令重写历史记录后，如何解决冲突？
- A：git rebase命令重写历史记录后，如果出现冲突，可以通过git mergetool命令解决冲突。
