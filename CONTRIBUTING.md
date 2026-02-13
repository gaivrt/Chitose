# Contributing to Chitose

## 工作流概览

我们使用 GitHub Issues + Projects 看板管理任务，采用自认领模式。

### 看板列

| 列 | 含义 |
|----|------|
| Todo | 所有待做事项|
| In Progress | 正在进行 |
| Review | PR 已提交，等待 review |
| Done | 已完成 |

### 自认领流程

1. 在看板或 Issues 列表中找到感兴趣的任务
2. 在 Issue 下评论认领（如 "我来做这个"）
3. 将 Issue 移到 In Progress
4. 开分支开发，PR 关联 Issue（`Closes #123`）
5. Review 通过后合并，Issue 自动移到 Done

### WIP 限制

每人同时最多 1-2 个 In Progress 任务。做完一个再拿下一个。

## Issue 规范

好的 Issue 应包含：

- 清晰的标题（动词开头，如 "替换中文 STT 为 FunASR"）
- 问题描述：当前状态和为什么要改
- 方案：大致技术方向
- 验收标准：怎样算做完

## PR 规范

### 分支命名

```
feat/short-description
fix/short-description
infra/short-description
```

### Commit Message

- 简短，动词开头
- 格式：`type: description`
- type: `feat` / `fix` / `refactor` / `docs` / `chore` / `test`

示例：
```
feat: integrate FunASR for Chinese STT
fix: resolve lip sync delay on slow connections
infra: add unit tests for config module
```

### PR 内容

- 标题与 commit message 风格一致
- 描述中说明改了什么、为什么改
- 关联 Issue：`Closes #123`

## Labels

### 优先级
- `P0` — 立即
- `P1` — 近期
- `P2` — 中期
- `P3` — 远期

### 类型
- `feature` — 新功能
- `enhancement` — 现有功能改进
- `infra` — 基础设施/工程
- `bug` — 缺陷修复
