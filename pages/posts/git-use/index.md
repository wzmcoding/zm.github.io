---
title: git rebase
date: 2024-03-31
updated: 2025-08-12
categories: Git
tags:
  - Git
top: 2
---

## 关于 Git 变基
`git rebase` 命令用于轻松更改一系列提交，修改存储库的历史记录。 可以进行重新排序、编辑提交或将提交压缩到一起。
通常，你会使用 `git rebase`来：
- 编辑之前的提交信息
- 将多个提交合并为一个
- 删除或还原不再必要的提交

### 对分支变基提交
要对另一个分支与当前分支状态之间的所有提交变基，可以在 shell（Windows 的命令提示符或者 Mac 和 Linux 的终端）中输入以下命令：
> `git rebase --interactive OTHER-BRANCH-NAME`

### 对某一时间点变基提交
要变基当前分支中最近的几个提交，可以在 shell 中输入以下命令：
> `git rebase --interactive HEAD~7`

### 变基时可用的命令
变基时有六个命令可用：
`pick`
`pick` 只表示包含提交。 在变基进行时重新排列 `pick` 命令的顺序会更改提交的顺序。 如果选择不包含提交，应删除整行。
`reword`
`reword` 命令类似于 `pick`，但在使用后，变基过程就会暂停，让你有机会改变提交消息。 提交所做的任何更改都不受影响。
`edit`
如果选择 `edit` 提交，你将有机会修订提交，也就是说，可以完全添加或更改提交。 您也可以创建更多提交后再继续变基。 这样您可以将大提交拆分为小提交，或者删除在提交中执行错误更改。
`squash`
此命令可用于将两个或以上的提交合并为一个。 下面的提交压缩到其上面的提交。 Git 让您有机会编写描述两次更改的新提交消息。
`fixup`
这类似于 `squash`，但要合并的提交丢弃了其消息。 提交只是合并到其上面的提交，之前提交的消息用于描述两次更改。
`exec`
这可让您对提交运行任意 shell 命令。

### 使用 git rebase 的示例
无论使用哪个命令，Git 都将启动默认文本编辑器，并且打开一个文件，其中详细说明了所选范围的提交信息。 该文件类似于：
```js
pick 1fc6c95 Patch A
pick 6b2481b Patch B
pick dd1475d something I want to split
pick c619268 A fix for Patch B
pick fa39187 something to add to patch A
pick 4ca2acc i cant' typ goods
pick 7b36971 something to move before patch B

# Rebase 41a72e6..7b36971 onto 41a72e6
#
# Commands:
#  p, pick = use commit
#  r, reword = use commit, but edit the commit message
#  e, edit = use commit, but stop for amending
#  s, squash = use commit, but meld into previous commit
#  f, fixup = like "squash", but discard this commit's log message
#  x, exec = run command (the rest of the line) using shell
#
# If you remove a line here THAT COMMIT WILL BE LOST.
# However, if you remove everything, the rebase will be aborted.
```
从上到下分解此信息，我们可以看出：

列出了七个命令，表示从起点到当前分支状态之间有七处更改。
您选择要变基的提交按最早更改（顶部）到最新更改（底部）的顺序存储。
每行列出一个命令（默认为 `pick`）、提交 SHA 和提交消息。 整个 `git rebase` 过程以这三列的操作为中心。 做出的更改将变基到存储库。
提交后，Git 会告知正在处理的提交范围 (`41a72e6..7b36971`)。
最后，Git 会提供一些帮助，告知在变基提交时可用的命令。

## 在命令行中使用 git rebase
### 使用 Git 变基
在此示例中，我们将介绍除 `exec` 之外的所有可用 `git rebase` 命令。

我们将通过在终端上输入 `git rebase --interactive HEAD~7` 来启动变基。 首选的文本编辑器将显示以下行：
```js
pick 1fc6c95 Patch A
pick 6b2481b Patch B
pick dd1475d something I want to split
pick c619268 A fix for Patch B
pick fa39187 something to add to patch A
pick 4ca2acc i cant' typ goods
pick 7b36971 something to move before patch B
```
在本例中，我们将：

使用 `squash` 将第五个提交 (`fa39187`) 压缩到 `Patch A` 提交 (`1fc6c95`)。
将最后一次提交 (`7b36971`) 上移到 `Patch B` 提交 (`6b2481b`) 之前，并将其保留为 `pick`。
将 `A fix for Patch B` 提交 (`c619268`) 合并到 `Patch B` 提交 (`6b2481b`)，并使用 `fixup` 忽略提交消息。
使用 `edit` 将第三个提交 (`dd1475d`) 拆分为两个较小的提交。
使用 `reword` 修复拼写错误的提交 (`4ca2acc`) 的提交消息。

首先，我们需要修改文件中的命令，如下所示：
```js
pick 1fc6c95 Patch A
squash fa39187 something to add to patch A
pick 7b36971 something to move before patch B
pick 6b2481b Patch B
fixup c619268 A fix for Patch B
edit dd1475d something I want to split
reword 4ca2acc i cant' typ goods
```
我们已将每一行的命令从 `pick` 更改为我们感兴趣的命令。

现在，保存并关闭编辑器，这将开始交互式变基。

Git 跳过第一条变基命令 `pick 1fc6c95`，因为该命令无需任何操作。 它转到下一个命令 `squash fa39187`。
由于此操作需要您的输入，因此 Git 再次打开您的文本编辑器。 其打开的文件类似如下：
```js
# This is a combination of two commits.
# The first commit's message is:

Patch A

# This is the 2nd commit message:

something to add to patch A

# Please enter the commit message for your changes. Lines starting
# with '#' will be ignored, and an empty message aborts the commit.
# Not currently on any branch.
# Changes to be committed:
#   (use "git reset HEAD <file>..." to unstage)
#
# modified:   a
#
```
这个文件是 Git 的表达方式，“嘿，这就是我要使用这个 `squash` 做的事情。” 它列出了第一个提交的消息 (`Patch A`) 和第二个提交的消息 (`something to add to patch A`)。
如果对这些提交消息感到满意，您可以保存该文件，然后关闭编辑器。 否则，您可选择更改提交消息，只需更改文本即可。
编辑器关闭后，变基继续：
```js
pick 1fc6c95 Patch A
squash fa39187 something to add to patch A
pick 7b36971 something to move before patch B
pick 6b2481b Patch B
fixup c619268 A fix for Patch B
edit dd1475d something I want to split
reword 4ca2acc i cant' typ goods
```
Git 处理两个 `pick` 命令（用于 `pick 7b36971` 和 `pick 6b2481b`）。 它还会处理 `fixup` 命令 (`fixup c619268`)，因为它不需要任何交互。
`fixup` 将来自 `c619268` 的更改合并到位于它之前的提交 (`6b2481b`) 中。 两个更改都将具有相同的提交消息：`Patch B`。

Git 开始 `edit dd1475d` 操作，停止，然后在终端显示以下消息：
```js
You can amend the commit now, with

        git commit --amend

Once you are satisfied with your changes, run

        git rebase --continue
```
然后，Git 开始执行 `reword 4ca2acc` 命令。 它会再次打开您的文本编辑器，并显示以下信息：
```js
i cant' typ goods

# Please enter the commit message for your changes. Lines starting
# with '#' will be ignored, and an empty message aborts the commit.
# Not currently on any branch.
# Changes to be committed:
#   (use "git reset HEAD^1 <file>..." to unstage)
#
# modified:   a
#
```
和以前一样，Git 显示提交消息供您进行编辑。 可以更改文本 (`i cant' typ goods`)、保存文件并关闭编辑器。 Git 将完成变基并将您返回终端。

### 将变基的代码推送到 GitHub
由于你更改了 Git 历史记录，通常的 `git push origin` 不起作用。 您需要通过“强制推送”最新更改来修改命令：
```js
# Don't override changes
$ git push origin main --force-with-lease

# Override changes
$ git push origin main --force
```
