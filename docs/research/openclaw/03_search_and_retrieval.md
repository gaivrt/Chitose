# 3. 搜索与检索

## Hybrid Search 概览

OpenClaw 采用向量相似度 + BM25 关键词的混合搜索策略，而非单一检索方式。

```
query: "用户的 API key 配置"
         │
         ├──────────────────────┐
         ▼                      ▼
  ┌──────────────┐     ┌──────────────┐
  │ searchVector │     │searchKeyword │
  │              │     │              │
  │ query → embed│     │ query → FTS5 │
  │ → chunks_vec │     │ → chunks_fts │
  │ 余弦相似度    │     │ BM25 排名     │
  └──────┬───────┘     └──────┬───────┘
         │ candidates          │ candidates
         ▼                      ▼
    ┌─────────────────────────────┐
    │     mergeHybridResults      │
    │                             │
    │  1. BM25 rank → 归一化分数   │
    │  2. 按 chunk ID 合并去重     │
    │  3. 加权融合计算 finalScore  │
    │  4. 按 finalScore 降序排列   │
    └──────────────┬──────────────┘
                   │
                   ▼
            过滤 minScore
            截断 maxResults
                   │
                   ▼
            返回 snippets
```

## 向量搜索（searchVector）

1. 将 query 通过 `embedQueryWithTimeout` 生成 embedding
2. 查询 `chunks_vec` 表（sqlite-vec 扩展提供向量距离计算）
3. 如果 sqlite-vec 不可用，fallback 到内存中逐一计算余弦相似度
4. 返回 top `maxResults × candidateMultiplier` 个候选

适合场景：语义相近但措辞不同的查询（如"怎么配置密钥" vs 文档中写的"API key setup"）

## BM25 关键词搜索（searchKeyword）

1. `buildFtsQuery` 将 query 分词，用 AND 连接
2. 查询 FTS5 虚拟表 `chunks_fts`
3. 返回 top `maxResults × candidateMultiplier` 个候选

适合场景：精确匹配代码符号、环境变量名、ID 等

## Score Fusion 算法

```
# BM25 rank 转归一化分数（rank 越小越好，转为 0-1 分数越大越好）
bm25Score = 1 / (1 + max(0, bm25Rank))

# 加权融合
finalScore = vectorWeight × vectorScore + textWeight × textScore

# 默认权重
vectorWeight = 0.7
textWeight   = 0.3
```

两路候选按 chunk ID 合并（union），同一个 chunk 如果同时出现在两路结果中，会同时拥有 vectorScore 和 textScore；只出现在一路的，缺失的那个 score 为 0。

## 工具接口

### memory_search(query)

- 输入：自然语言 query 字符串
- 输出：匹配的 snippets 列表，每条包含：
  - `text` — 匹配的文本片段
  - `filePath` — 来源文件路径
  - `lineRange` — 行范围
  - `score` — 融合后的分数
  - `provider/model` — 使用的 embedding 信息
- 不返回完整文件内容，只返回相关片段

### memory_get(path)

- 输入：workspace 相对路径（限制在 `MEMORY.md` 和 `memory/` 目录下）
- 可选参数：起始行、读取行数
- 输出：指定文件的内容（或部分内容）
- 典型用法：先 `memory_search` 找到相关文件，再 `memory_get` 读取完整上下文

## 因果关系

1. **因为** 语义搜索擅长模糊匹配但对精确 token 不敏感 → **所以** 需要 BM25 补充精确关键词能力
2. **因为** 两种搜索的分数量纲不同（余弦相似度 vs BM25 rank）→ **所以** 需要 `bm25RankToScore` 归一化后才能加权融合
3. **因为** 大多数记忆查询偏语义理解 → **所以** 默认 vectorWeight=0.7 > textWeight=0.3
4. **因为** sqlite-vec 可能在某些环境下不可用 → **所以** 设计了 fallback 到内存计算余弦相似度的降级方案
5. **因为** `memory_search` 只返回 snippet 不返回全文 → **所以** 需要 `memory_get` 作为补充工具来获取完整上下文
