# OpenClaw 记忆系统研究

研究对象：https://github.com/openclaw/openclaw 的 Memory System

## 文档结构

1. [架构概览](./01_architecture.md) — 记忆系统在整体架构中的位置和角色
2. [存储与索引](./02_storage_and_indexing.md) — 文件存储、chunking、embedding、SQLite 持久化
3. [搜索与检索](./03_search_and_retrieval.md) — hybrid search（向量 + BM25）、score fusion、工具接口
4. [Session Memory](./04_session_memory.md) — 会话记忆的增量索引、debounce、阈值机制
5. [Embedding Provider](./05_embedding_provider.md) — 自动选择、fallback、各 provider 对比
