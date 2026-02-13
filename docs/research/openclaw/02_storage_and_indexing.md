# 2. 存储与索引

## 存储：两种 Markdown 文件

OpenClaw 的记忆以纯 Markdown 文件形式存储在 agent workspace（默认 `~/.openclaw/workspace`）下。

### MEMORY.md — 长期记忆

- 用途：存放经过提炼的持久信息（用户偏好、决策、重要事实）
- 特点：由 agent 主动维护，是"精华"而非"流水账"
- 加载时机：**仅在主私聊 session 中加载**，群聊中不加载（安全考虑，可能含个人信息）

### memory/YYYY-MM-DD.md — 每日笔记

- 用途：append-only 的每日日志，记录当天发生的事
- 特点：原始记录，不做提炼
- 加载时机：**每个 session 启动时加载当天和昨天的笔记**

### 因果关系

1. **因为** agent 的"心理笔记"不会跨 session 持久化 → **所以** 需要写入文件来保留
2. **因为** 长期记忆和日常记录的生命周期不同 → **所以** 分成 MEMORY.md（手动维护）和 daily notes（自动追加）
3. **因为** MEMORY.md 可能包含敏感个人上下文 → **所以** 只在私聊 session 中注入，群聊中排除

## 索引：从 Markdown 到可搜索结构

索引由 `MemoryIndexManager` 类管理，流程如下：

```
Markdown 文件
    │
    ▼
┌─────────────────┐
│  chunkMarkdown   │  ← 按 ~400 token 切块，80 token 重叠
└────────┬────────┘
         │ MemoryChunk[]
         ▼
┌─────────────────────────┐
│  embedChunksInBatches    │  ← 调用 embedding provider 生成向量
└────────┬────────────────┘
         │ chunk + embedding
         ▼
┌─────────────────────────────────────┐
│  SQLite 写入（三张表）                │
│                                     │
│  chunks      → 原文 + embedding JSON │
│  chunks_vec  → sqlite-vec 向量表     │
│  chunks_fts  → FTS5 全文索引表       │
└─────────────────────────────────────┘
```

### Chunking 细节

- 目标大小：~400 tokens
- 重叠：80 tokens（确保跨块边界的内容不丢失语义）
- `enforceEmbeddingMaxInputTokens` 确保 chunk 不超过 provider 的输入上限

### SQLite 存储

数据库位置：`~/.openclaw/memory/<agentId>.sqlite`（每个 agent 独立）

| 表名 | 用途 | 存储内容 |
|------|------|----------|
| `chunks` | 主表 | 原文、文件路径、行范围、embedding（JSON 字符串） |
| `chunks_vec` | 向量索引 | embedding（BLOB），由 sqlite-vec 扩展提供 |
| `chunks_fts` | 全文索引 | chunk 文本，由 FTS5 提供 BM25 关键词搜索 |

写入时先删除该文件的旧条目，再插入新的（全量替换，非增量）。

### 索引触发时机

| 触发条件 | 配置项 | 说明 |
|----------|--------|------|
| 文件变更 | `sync.watch` | file watcher 监听，变更后 debounce 再索引 |
| Session 开始 | `sync.onSessionStart` | 每次新 session 时同步 |
| 搜索时 | `sync.onSearch` | 搜索前先确保索引是最新的 |
| 定时 | `sync.intervalMinutes` | 周期性同步 |

### 索引重置

当以下配置变更时，整个索引自动 reset 并重建：
- embedding provider
- embedding model
- endpoint URL
- chunking 参数（token 数、重叠量）

### 因果关系

1. **因为** 向量搜索需要固定维度的 embedding → **所以** 换 model/provider 后旧 embedding 失效，必须全量重建
2. **因为** Markdown 文件可能被外部编辑 → **所以** 用 file watcher + debounce 来检测变更并触发重索引
3. **因为** 需要同时支持语义搜索和精确关键词搜索 → **所以** 同一份 chunk 同时写入向量表和 FTS 表
4. **因为** chunk 之间可能切断一句话的语义 → **所以** 设置 80 token 的重叠窗口来保持上下文连贯
