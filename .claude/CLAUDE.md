## 项目管理工作流

本项目使用 GitHub Issues + Projects 看板管理任务，采用自认领模式。

### 关键文件
- `docs/TODO.md` — Issues 的人类可读索引，不是主要跟踪工具
- `CONTRIBUTING.md` — 自认领工作流、Issue/PR 规范
- `docs/research/competitive-analysis/05_roadmap.md` — 只读参考，不直接修改

### Labels
- 优先级：`P0`（立即）/ `P1`（近期）/ `P2`（中期）/ `P3`（远期）
- 类型：`feature` / `enhancement` / `infra` / `bug`

### 创建新 Issue 时
- 标题动词开头，简洁明确
- Body 包含：问题描述、方案、验收标准
- 打上优先级 + 类型 label
- 不设 Assignee（自认领模式）
- 同步更新 `docs/TODO.md` 保持索引一致

### 完成 Issue 时
- PR 关联 Issue（`Closes #N`）
- 在 `docs/TODO.md` 中勾选或删除对应条目

## LiveKit Documentation

LiveKit Agents is a fast-evolving project, and the documentation is updated frequently. You should always refer to the latest documentation when working with this project. For your convenience, LiveKit offers an MCP server that can be used to browse and search its documentation. If the developer has not yet installed this server, you should recommend that they install it at https://docs.livekit.io/mcp.