---
title: git rebase
date: 2024-03-31
updated: 2025-08-13
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
1. `pick`
`pick` 只表示包含提交。 在变基进行时重新排列 `pick` 命令的顺序会更改提交的顺序。 如果选择不包含提交，应删除整行。
2. `reword`
`reword` 命令类似于 `pick`，但在使用后，变基过程就会暂停，让你有机会改变提交消息。 提交所做的任何更改都不受影响。
3. `edit`
如果选择 `edit` 提交，你将有机会修订提交，也就是说，可以完全添加或更改提交。 您也可以创建更多提交后再继续变基。 这样您可以将大提交拆分为小提交，或者删除在提交中执行错误更改。
4. `squash`
此命令可用于将两个或以上的提交合并为一个。 下面的提交压缩到其上面的提交。 Git 让您有机会编写描述两次更改的新提交消息。
5. `fixup`
这类似于 `squash`，但要合并的提交丢弃了其消息。 提交只是合并到其上面的提交，之前提交的消息用于描述两次更改。
6. `exec`
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


## git rebase -i 详解
> 交互式变基（git rebase -i）就是“时光手术刀”：把一段提交历史拿出来，逐条重放，同时允许你改刀口——合并、拆分、改信息、调顺序、删提交、顺手跑测试。下面把涉及到的命令与实操全盘梳理一遍，给你一把顺手的“历史整形”工具箱。

### 一、git rebase -i 的本质
- 做什么：把当前分支的一串提交（相对于某个基底）“重放”到新的基底上。重放路线由一个“todo”列表控制。
- 为什么用：清理历史（合并噪音提交、修正文案）、把功能分支对齐主干最新进度、保证线性历史便于 bisect 和审阅。
- 什么时候别用：已经公开共享且被别人基于它继续开发的历史，贸然重写会让同事怀疑人生。

### 二、交互式 todo 文件里的指令（最常用）
打开方式举例：
```bash
# 以最近 5 个提交为手术对象
git rebase -i HEAD~5

# 或者把当前分支变基到 origin/main 之上，同时进入交互
git fetch
git rebase -i origin/main
```
编辑器里会看到类似：
```yaml
pick 1a2b3c4 feat: 用户登录
pick 2b3c4d5 fix: 拼写错误
pick 3c4d5e6 wip: 调试输出
# 以此类推...

```
把前缀改成以下动词即可控制这条提交的命运：

- `pick`：照常保留这条提交（默认）。

- `reword`（或 `r`）：保留代码，**修改提交信息**。

- `edit`（或 `e`）：**停下来**，你可修改代码/分拆提交，然后 `git rebase --continue`。

- `squash`（或 `s`）：把这条提交**与上一条合并**，并**合并提交信息**（会让你编辑最终信息）。

- `fixup`（或 `f`）：和 `squash` 一样合并到上一条，但**丢弃本条提交信息**（更干净）。

- `drop`（或 `d`）：**删除**这条提交。

- `exec`（或 `x`）：在这一步**执行一段命令**（如跑测试）。

**调整顺序**：直接**上下移动**行即可；todo 列表的顺序就是新历史的顺序。

### 三、常见场景的“手术剧本”
1. 合并多个 commit（把“口头禅式”提交压成一条整洁记录）
```bash
git rebase -i HEAD~5
# 把想并到上一条的提交标为 squash / fixup
# 保存退出 -> 如选择了 squash，会要求你编辑合并后的提交信息
```
- 选择 squash vs fixup：若你想保留副提交的描述，选 `squash`；不想保留，选 `fixup`。
- 更丝滑：先用
```bash
git commit --fixup <目标commit哈希>
git rebase -i --autosquash HEAD~5
```
配合 `--autosquash` 自动把 `fixup!/squash!` 提交排好位，省去手工移动。

2. 修改过去某条提交信息
```bash
git rebase -i HEAD~N
# 把那一行改成 reword
# 保存退出 -> Git 会在那一步停下让你编辑 message
```

3. 调整提交顺序
```bash
git rebase -i HEAD~N
# 直接在 todo 文件中把行上下移动
```
> 注意依赖关系：后移一条“使用了前面改动”的提交可能导致冲突，需要按冲突解决流程走。

4. 拆分一个“大杂烩”提交为多条
```bash
git rebase -i HEAD~N
# 把那条改成 edit
# 进入停顿点后：
git reset HEAD^             # 把该提交回退成未暂存改动
git add -p                  # 交互式分块暂存（切片）
git commit -m "切片1"
git add -p
git commit -m "切片2"
# 重复直到切完
git rebase --continue
```

5. 把功能分支对齐主干最新历史
```bash
git fetch
git rebase origin/main
# 发生冲突时：修 -> git add -A -> git rebase --continue
# 不想要这步：git rebase --skip
# 悔棋：git rebase --abort
```

需要保留分支的**合并结构**时，用：
```bash
git rebase --rebase-merges origin/main
```

6. 每一步都跑测试，失败就停
两种方式，二选一：
```bash
# A：命令行参数
git rebase -i --exec "npm test" HEAD~N

# B：在 todo 中对若干条前加
exec npm test
```

7. 从仓库的第一条提交开始“深度洗稿”
```bash
git rebase -i --root
```

8. 推送改写后的历史（安全地 force）
```bash
git push --force-with-lease
# 比 --force 安全，可防止覆盖他人新推送的更新
```

9. 翻车后的自救
```bash
git reflog              # 找回任何“走丢”的提交
git checkout <安全点>
# 或者直接回到 rebase 之前的 HEAD
git reset --hard <reflog里记录的原HEAD>
```

### 四、冲突解决与效率小技巧
- 标准三连：解决冲突 ➜ git add -A ➜ git rebase --continue。
- 重复冲突自动记忆：
```bash
git config --global rerere.enabled true
```
Git 会记住你的解决方式，下一处同类冲突自动套用。
- 自动压合默认开启：
```bash
git config --global rebase.autosquash true
```
- 更好看的指令视图（在 todo 里展示作者/时间等）：
```bash
git config --global rebase.instructionFormat "(%an %ad) %s"
```
- 指定编辑器：
```bash
git config --global core.editor "nvim"     # 或 code --wait / idea64 / vim
```
- 更新引用（分支/轻量 tag 指到被改写的提交时自动迁移；新 Git 有此功能）：
```bash
git rebase --update-refs
```
用前先确认哪些引用会被移动，避免误伤。


### 五、理念：何时该 rebase，何时该 merge
- rebase：强调线性、干净、易读的故事线；适合 feature 开发过程中的自我清理与对齐主干。
- merge：保留时间线真实形状与分支结构；适合把成熟的功能合进主干、或多人协作已公开的历史。

### 六、一个端到端示例（合并+改文案+跑测试）
```bash
# 目标：把最近 6 个提交整理成 3 个、顺序重排、并在每步跑测试
git fetch
git rebase -i --exec "npm test" HEAD~6

# 在编辑器里：
# 1. 移动行，确定顺序
# 2. 把一些小修正标记为 fixup 到对应的主提交上
# 3. 把需要改文案的标记为 reword

# 保存退出 -> 逐步执行；有冲突就解 -> add -> rebase --continue
# 全部通过后：
git push --force-with-lease
```
