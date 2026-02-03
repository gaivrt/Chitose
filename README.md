# Chitose 🌸

> 基于 LiveKit Agents 的低延迟 AI 虚拟主播系统

## 特性

- ⚡ **超低延迟** - 基于 LiveKit Agents，端到端延迟 <500ms
- 🔌 **模块可插拔** - LLM、TTS、形象渲染各自独立
- 🎯 **MVP 优先** - 最小可行产品，快速验证核心功能

## 快速开始

### 1. 环境准备

```bash
# 创建并激活虚拟环境
conda activate Chitose_env  # 或你的环境名

# 安装依赖
pip install -e .
```

### 2. 配置

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 填入你的密钥
vim .env
```

需要的密钥：
- **LiveKit**: 从 [LiveKit Cloud](https://cloud.livekit.io/) 获取
- **OpenAI**: 从 [OpenAI Platform](https://platform.openai.com/) 获取
- **ElevenLabs**: 从 [ElevenLabs](https://elevenlabs.io/) 获取

### 3. 运行

```bash
python main.py --config config/default.yaml
```

## 项目结构

```
chitose/
├── chitose/
│   ├── __init__.py       # 包初始化
│   ├── agent.py          # Agent 定义
│   ├── config.py         # 配置管理
│   └── utils.py          # 工具函数
├── config/
│   └── default.yaml      # 默认配置
├── docs/
│   └── TECHNICAL_REVIEW.md  # 技术评审
├── main.py               # 入口
├── pyproject.toml        # 项目配置
└── .env.example          # 环境变量模板
```

## 技术栈

| 模块 | 方案 |
|------|------|
| 实时通信 | LiveKit Agents |
| LLM | OpenAI Compatible API |
| TTS | ElevenLabs |
| VAD | Silero |

## 开发路线

- [x] MVP: 核心语音管道
- [ ] Phase 1: B站弹幕输入
- [ ] Phase 2: Live2D 形象
- [ ] Phase 3: RTMP 推流

## License

MIT
