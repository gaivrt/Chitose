# Chitose 🌸

> 基于 LiveKit Agents 的低延迟 AI 虚拟主播系统

## 特性

- ⚡ **超低延迟** - 基于 LiveKit Agents，端到端延迟 <500ms
- 🔌 **模块可插拔** - LLM、TTS、形象渲染各自独立
- 🎭 **Live2D 集成** - Web 端实时渲染 + 自动口型同步
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
- **Deepgram**: 从 [Deepgram](https://deepgram.com/) 获取

### 3. 运行 (两种模式)

#### 模式 A: 仅 Agent (无 Live2D)

```bash
# 启动 Agent
python main.py dev

# 访问 LiveKit Playground 测试
# https://cloud.livekit.io/ -> 你的项目 -> Playground
```

#### 模式 B: Agent + Live2D 网页 (完整体验)

**终端 1: 启动 Web 服务器**

```bash
# 启动 Web 服务器 (包含 token 生成)
python server.py
```

**终端 2: 启动 Agent**

```bash
# 启动 LiveKit Agent
python main.py dev
```

**浏览器: 访问 http://localhost:8080**

网页会自动连接 LiveKit 并同步口型。

> **注意**: Live2D 模型需要先下载 Cubism Core SDK，详见 [web/README.md](web/README.md)

### 4. 使用方式

1. 在 LiveKit Playground 或网页中说话 (语音输入)
2. 或在 Playground 的聊天框输入文字 (文字输入)
3. Agent 会通过 LLM 生成回复，并用 TTS 朗读
4. 网页会接收音频并实时同步 Live2D 口型

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
│   ├── DEV_LOG.md        # 开发日志
│   ├── TECHNICAL_REVIEW.md  # 技术评审
│   └── TODO.md           # 待办事项
├── web/
│   ├── index.html        # Live2D 网页
│   ├── app.js            # LiveKit + 口型同步
│   └── README.md         # Web 使用说明
├── main.py               # Agent 入口
├── server.py             # Web 服务器 + Token 生成
├── pyproject.toml        # 项目配置
└── .env.example          # 环境变量模板
```

## 技术栈

| 模块 | 方案 |
|------|------|
| 实时通信 | LiveKit Agents + LiveKit Client SDK |
| LLM | OpenAI Compatible API |
| TTS | ElevenLabs |
| STT | Deepgram |
| VAD | Silero |
| Live2D 渲染 | pixi-live2d-display |
| 口型同步 | Web Audio API |

## 开发路线

- [x] MVP: 核心语音管道 (LLM + TTS + STT)
- [x] Live2D 网页渲染
- [x] LiveKit 集成 + 自动口型同步
- [ ] Phase 1: B站弹幕输入
- [ ] Phase 2: RTMP 推流
- [ ] Phase 3: 表情系统

## License

MIT
