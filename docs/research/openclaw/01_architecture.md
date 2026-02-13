# 1. 架构概览

## OpenClaw 是什么

OpenClaw 是一个自托管的 AI agent gateway，将各种聊天平台（WhatsApp、Telegram、Discord 等）连接到 AI agent。

## 整体架构中的记忆系统

```
聊天平台 (WhatsApp/Telegram/Discord/...)
        │ inbound message
        ▼
    ┌─────────┐
    │ Gateway  │  ← 中央控制面，管理 session、routing、channel
    └────┬────┘
         │ WebSocket RPC
         ▼
    ┌──────────┐
    │  Agent   │  ← AI agent 执行推理和工具调用
    │  System  │
    └──┬───┬───┘
       │   │
       │   │  tool call: memory_search / memory_get
       │   ▼
       │  ┌──────────────────┐
       │  │  Memory System   │  ← 本研究的重点
       │  │                  │
       │  │  - Markdown 文件  │  ← 存储层：MEMORY.md + daily notes
       │  │  - SQLite + vec  │  ← 索引层：embedding + BM25
       │  │  - Hybrid Search │  ← 检索层：向量 + 关键词混合搜索
       │  └──────────────────┘
       │
       ▼
    Channels (outbound reply)
```

## 因果关系

1. **因为** OpenClaw 是多 session、跨平台的 agent gateway → **所以** 需要一个持久化的记忆系统来跨 session 保留上下文
2. **因为** agent 的 context window 有限 → **所以** 不能把所有历史对话塞进 prompt，需要按需检索相关记忆
3. **因为** 记忆内容既有精确术语（代码符号、ID）又有模糊语义 → **所以** 采用 hybrid search（向量相似度 + BM25 关键词）而非单一检索方式

## 记忆系统的三层结构

| 层级 | 职责 | 实现 |
|------|------|------|
| 存储层 | 持久化记忆内容 | Markdown 文件（MEMORY.md + memory/YYYY-MM-DD.md） |
| 索引层 | 将文本转为可搜索的结构 | chunking → embedding → SQLite（sqlite-vec + FTS5） |
| 检索层 | 根据 query 找到相关记忆 | hybrid search → score fusion → 返回 snippets |

Agent 通过 `memory_search(query)` 和 `memory_get(path)` 两个 tool 与记忆系统交互。
