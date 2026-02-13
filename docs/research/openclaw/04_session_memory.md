# 4. Session Memory

## 概述

除了手动维护的 Markdown 记忆文件，OpenClaw 还支持将会话记录（session transcript）自动索引为可搜索的记忆。此功能默认关闭，需要显式开启。

```
配置项：agents.defaults.memorySearch.experimental.sessionMemory: true
```

## Session 文件

会话记录存储为 JSONL 格式：`~/.openclaw/agents/<agentId>/sessions/*.jsonl`

每行是一条消息的 JSON 记录，随对话进行不断追加。

## 增量索引机制

Session 文件与 Markdown 记忆文件的索引策略不同——不是每次变更都重建，而是基于阈值的增量索引：

```
session.jsonl 持续追加消息
         │
         ▼
┌─────────────────────────┐
│  updateSessionDelta      │
│                          │
│  累计 deltaBytes += 新增字节数
│  累计 deltaMessages += 新增行数
└────────────┬────────────┘
             │
             ▼
      ┌──────────────┐
      │ 是否超过阈值？ │
      │              │
      │ deltaBytes   │  默认 100,000 bytes (~100KB)
      │     OR       │
      │ deltaMessages│  默认 50 条消息
      └──────┬───────┘
             │
        YES  ▼           NO → 继续累计，不触发索引
┌─────────────────────┐
│ scheduleSessionDirty │
│                      │
│ 加入 sessionPending  │
│ 启动 debounce timer  │
└──────────┬──────────┘
           │ debounce 结束
           ▼
    触发 sync → 重新 chunk + embed + 写入 SQLite
```

## Debounce 机制

当 session 文件被标记为 dirty 后，不会立即索引，而是进入 debounce 等待：

- `scheduleSessionDirty` 将文件加入 `sessionPendingFiles` 集合
- 启动 `setTimeout`，延迟 `SESSION_DIRTY_DEBOUNCE_MS` 毫秒
- 在 debounce 窗口内的多次更新会被合并为一次索引操作
- debounce 结束后才真正触发 sync

这样避免了高频对话时每条消息都触发一次重索引。

## Session Memory Hook（另一种机制）

OpenClaw 还有一个独立的 `session-memory` hook，与上述 sessionMemory 功能不同：

| | experimental.sessionMemory | session-memory hook |
|---|---|---|
| 触发时机 | 自动，基于阈值 | 手动，执行 `/new` 命令时 |
| 索引内容 | 完整 JSONL transcript | LLM 生成的摘要 |
| 输出格式 | SQLite 向量索引 | Markdown 文件 `memory/YYYY-MM-DD-slug.md` |
| 用途 | 机器可搜索的语义索引 | 人类可读的会话摘要 |

## 因果关系

1. **因为** session transcript 是高频追加的（每条消息都写入）→ **所以** 不能像 Markdown 文件那样每次变更都全量重索引，需要阈值控制
2. **因为** 阈值触发后可能短时间内又有新消息 → **所以** 用 debounce 合并多次触发为一次索引
3. **因为** deltaBytes 和 deltaMessages 是 OR 关系 → **所以** 无论是少量长消息还是大量短消息，都能及时触发索引
4. **因为** 自动索引的是原始 transcript（机器友好）→ **所以** 另外提供 hook 生成人类可读的摘要，两者互补
5. **因为** 此功能仍在实验阶段 → **所以** 放在 `experimental` 命名空间下，默认关闭
