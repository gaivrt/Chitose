# 5. Embedding Provider

## 自动选择机制

当 `memorySearch.provider` 设为 `"auto"` 时，`createEmbeddingProvider` 按以下优先级尝试：

```
auto 选择流程：

1. local 配置了 modelPath 且文件存在？ → 使用 local
   │ NO
   ▼
2. 有 OpenAI API key？ → 使用 openai
   │ NO
   ▼
3. 有 Gemini API key？ → 使用 gemini
   │ NO
   ▼
4. 有 Voyage API key？ → 使用 voyage
   │ NO
   ▼
5. 全部失败 → memory search 保持禁用
```

优先 local 的原因：零成本、无网络依赖、数据不出本机。

## Provider 对比

| Provider | 模型 | 运行方式 | 依赖 |
|----------|------|----------|------|
| local | GGUF 模型 | node-llama-cpp 本地推理 | 模型文件（可自动下载） |
| openai | OpenAI embedding API | 远程 API | API key |
| gemini | Gemini embedding API | 远程 API | API key |
| voyage | Voyage embedding API | 远程 API | API key |

## Fallback 机制

配置 `memorySearch.fallback` 可指定备用 provider：

```
主 provider 调用
    │
    ├─ 成功 → 正常返回 embedding
    │
    └─ 失败 → fallback provider 是否配置？
                │
                ├─ 是（且不是 "none"，且不同于主 provider）
                │   → 尝试 fallback provider
                │       │
                │       ├─ 成功 → 返回 embedding
                │       └─ 失败 → 抛出错误（包含两次失败信息）
                │
                └─ 否 → 直接抛出错误
```

典型场景：`provider: "local"` + `fallback: "openai"`，本地模型加载失败时自动切换到 OpenAI。

## 配置示例

```json
{
  "agents": {
    "defaults": {
      "memorySearch": {
        "enabled": true,
        "provider": "auto",
        "fallback": "openai",
        "local": {
          "modelPath": "/path/to/model.gguf",
          "modelCacheDir": "~/.openclaw/models"
        },
        "remote": {
          "baseUrl": null,
          "apiKey": null,
          "batch": { "size": 100 }
        }
      }
    }
  }
}
```

## Embedding Cache

为避免重复 embedding 相同文本，系统内置缓存：

- 未变更的 chunk 不会重新 embedding
- 缓存大小通过 `cache.maxEntries` 配置
- 加速重索引场景（如文件部分修改时，未变更的 chunk 直接命中缓存）

## 因果关系

1. **因为** 不同用户的环境差异大（有的有 GPU 跑本地模型，有的只有 API key）→ **所以** 提供 auto 选择 + 多 provider 支持
2. **因为** local 推理零成本且隐私最好 → **所以** auto 模式下优先选择 local
3. **因为** 单一 provider 可能因网络/配置问题失败 → **所以** 设计 fallback 机制保证可用性
4. **因为** 换 provider/model 后 embedding 维度和语义空间不同 → **所以** 检测到配置变更时自动 reset 全量重建索引
5. **因为** 大部分 chunk 在文件小幅修改后内容不变 → **所以** 用 embedding cache 避免重复计算，节省时间和 API 调用成本
