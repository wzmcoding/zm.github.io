---
title: SKILLS
date: 2026-03-28
updated: 2026-03-28
categories: AI
tags:
  - AI
top: 1
---

# skills

## What are Skills?
Skill 是一个 markdown 文件，它教会 Claude 如何执行特定操作：比如，按照团队标准审查PR，生成偏好格式 commit message。

Agent Skills是扩展Claude功能的模块化能力。每个Skill包含指令，元数据和可选资源（脚本、模板），Claude 在相关时会自动使用这些资源。

比如处理需求需要 a b c 三个方面的处理，那就写3个对应skill，详细写a步骤的skill：是什么？怎么执行？执行条件?，让a成为处理这个事情的专家。

## How Skills work

Skill是按需分阶段加载信息，而不是先预先消耗上下文。通过利用Claude的虚拟机环境， Claude在具有文件系统访问权限的虚拟机中运行，使得Skills可以以目录的形式存在。

## Skill分三种内容类型，三个不同加载级别

### 第I级 元数据 （始终加载）

内容类型就是：指令。提供发现的前置数据（md中的Front Matter）

```text
---
name: pdf-processing
description: 从 PDF 文件中提取文本和表格、填充表单、合并文档。在处理 PDF 文件或用户提及 PDF、表单或文档提取时使用。
---
```

需要明确skill描述信息，description非常重要，因为Claude启动时会加载元数据将其包含在系统提示中。这种方式也可以当你安装许多Skills而不会产生上下文成本； Claude通过元素知道每个Skill的存在以及何时使用它。

### 第II级 指令（触发时加载）

内容类型：指令。SKILL.md 的主题包含程序知识：工作流、最佳实现和指导（md中正文）

# PDF 处理

## 快速入门

使用 pdfplumber 从 PDF 中提取文本：

```python
import pdfplumber

with pdfplumber.open("document.pdf") as pdf:
    text = pdf.pages[0].extract_text()
```

有关高级表单填充，请参阅 [FORMS.md](FORMS.md)。

当请求与Skill描述匹配到内容时，Claude通过bash从文件系统读取SKILL.md。只有这样，此内容才会进入上下文窗口。

### 第III级 资源和代码（按需加载）

内容类型：指令、代码和资源。Skills可以捆绑其他材料：

```text
pdf-skill/
├── SKILL.md (主要指令)
├── FORMS.md (表单填充指南)
├── REFERENCE.md (详细 API 参考)
└── scripts/
    └── fill_form.py (实用脚本)
```

- 指令：包含专业知道工作流和其他markdown文件（FORMS.md、REFERENCE.md）
- 代码：Claude通过bash运行可执行脚本（fill_form.py、validate.py）；脚本提供确定性操作而不是消耗上下文
- 资源：参考资料，如数据库架构、API文档、模板或示例

## Custom Skills

自定义的skill需要放在特定的文件夹中

- Claude: `.claude/skills/`
- Cursor: `.cursor/skills/`
