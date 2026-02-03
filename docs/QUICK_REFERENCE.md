# Chitose 快速参考指南 / Quick Reference Guide

## 一句话概括 / One-Line Summary

**Chitose** 是一个基于 LiveKit Agents 的低延迟 AI 虚拟主播系统，支持语音/文字互动和 Live2D 虚拟形象。

**Chitose** is a low-latency AI VTuber system built on LiveKit Agents with voice/text interaction and Live2D character support.

---

## 技术栈速查 / Tech Stack at a Glance

| Component | Technology | Version |
|-----------|-----------|---------|
| **框架 / Framework** | LiveKit Agents | ≥1.0.0 |
| **LLM** | OpenAI Compatible API | - |
| **TTS** | ElevenLabs | eleven_multilingual_v2 |
| **STT** | Deepgram | nova-3 |
| **VAD** | Silero | - |
| **Live2D** | PixiJS + pixi-live2d-display | 7.4.2 + 0.4.0 |
| **语言 / Language** | Python | 3.10+ |

---

## 5 分钟快速启动 / 5-Minute Quick Start

```bash
# 1. 克隆并进入项目 / Clone and enter project
git clone https://github.com/gaivrt/Chitose.git
cd Chitose

# 2. 创建环境 / Create environment
conda create -n Chitose_env python=3.10
conda activate Chitose_env

# 3. 安装依赖 / Install dependencies
pip install -e .

# 4. 配置密钥 / Configure API keys
cp .env.example .env
# 编辑 .env 填入你的 API 密钥 / Edit .env and fill in your API keys

# 5. 运行 / Run
python main.py dev
# 访问 LiveKit Playground 测试 / Visit LiveKit Playground to test
```

---

## 核心命令 / Core Commands

```bash
# 开发模式 (本地调试) / Dev mode (local debugging)
python main.py dev

# 连接模式 (服务器运行) / Connect mode (server deployment)
python main.py connect

# 测试 TTS / Test TTS
python test_tts.py

# 测试 STT / Test STT
python test_deepgram.py

# Live2D 网页 / Live2D web UI
cd web && python -m http.server 8080
```

---

## 关键文件位置 / Key File Locations

| 用途 / Purpose | 文件路径 / File Path |
|----------------|----------------------|
| **配置文件** / Config | `config/default.yaml` |
| **环境变量** / Env Vars | `.env` |
| **Agent 逻辑** / Agent Logic | `chitose/agent.py` |
| **配置系统** / Config System | `chitose/config.py` |
| **程序入口** / Entry Point | `main.py` |
| **Live2D 渲染** / Live2D Renderer | `web/app.js` |
| **完整文档** / Full Docs | `docs/PROJECT_UNDERSTANDING.md` |
| **英文摘要** / English Summary | `docs/PROJECT_SUMMARY_EN.md` |

---

## 环境变量速查 / Environment Variables

```bash
# 必需 / Required
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
OPENAI_API_KEY=your-openai-key
ELEVENLABS_API_KEY=your-elevenlabs-key
ELEVENLABS_VOICE_ID=your-voice-id
DEEPGRAM_API_KEY=your-deepgram-key

# 可选 / Optional
OPENAI_BASE_URL=https://api.openai.com/v1  # 自定义 API / Custom API
LLM_MODEL=gpt-4o-mini                       # 模型选择 / Model selection
LLM_TEMPERATURE=0.7                         # 温度参数 / Temperature
```

---

## 项目结构速览 / Project Structure Overview

```
Chitose/
├── 📦 chitose/          # 核心代码 / Core code
├── ⚙️ config/           # 配置文件 / Config files
├── 📚 docs/             # 文档 / Documentation
├── 🎭 web/              # Live2D UI
├── 🚀 main.py           # 入口 / Entry point
└── 📝 pyproject.toml    # 依赖 / Dependencies
```

---

## 功能检查清单 / Feature Checklist

### ✅ 已完成 / Completed

- [x] LiveKit Agents 集成 / Integration
- [x] LLM 对话 / Dialogue
- [x] TTS 语音合成 / Speech synthesis
- [x] STT 语音识别 / Speech recognition
- [x] 文字输入 / Text input
- [x] Live2D 渲染 / Rendering
- [x] 配置管理 / Configuration

### 🚧 进行中 / In Progress

- [ ] STT 中文优化 / Chinese STT optimization
- [ ] Live2D 口型同步 / Lip sync

### 📋 计划中 / Planned

- [ ] Bilibili 弹幕 / Danmaku integration
- [ ] RTMP 推流 / Streaming
- [ ] 音频混流 / Audio mixing

---

## 常见问题快速解答 / Quick FAQ

### Q: 如何更换 LLM 模型？/ How to change LLM?
```bash
# 编辑 .env / Edit .env
LLM_MODEL=gpt-3.5-turbo
```

### Q: 如何自定义人设？/ How to customize personality?
```yaml
# 编辑 config/default.yaml / Edit config/default.yaml
agent:
  system_prompt: |
    你是一个温柔的大姐姐...
    You are a gentle big sister...
```

### Q: TTS 没声音？/ No TTS sound?
1. 检查 ElevenLabs API Key / Check API key
2. 检查账户余额 / Check account balance
3. 检查 Voice ID 是否正确 / Verify voice ID

### Q: STT 识别不准？/ STT inaccurate?
- 中文识别建议切换到 Whisper / For Chinese, switch to Whisper
- 或部署阿里 FunASR / Or deploy Alibaba FunASR

---

## 成本速算 / Cost Calculator

假设每天直播 2 小时 / Assuming 2 hours streaming per day:

| 服务 / Service | 月成本 / Monthly Cost |
|----------------|------------------------|
| LiveKit | $0 ~ $50 |
| OpenAI API | $20 ~ $50 |
| ElevenLabs | $22 |
| Deepgram | $0 ~ $25 |
| **总计 / Total** | **$42 ~ $147** |

---

## 数据流向 / Data Flow

```
用户语音/文字                Agent 处理              输出
User Voice/Text             Processing            Output

   🎤/💬                      🤖 STT                  🔊 Audio
     ↓                         ↓                       ↑
LiveKit Room  ────────→   🧠 LLM  ────────→    🗣️ TTS
                             ↓                       ↓
                         🎭 Live2D  ────────→   📺 Stream
```

---

## 下一步行动 / Next Steps

### 对于开发者 / For Developers
1. 📖 阅读 [PROJECT_UNDERSTANDING.md](./PROJECT_UNDERSTANDING.md) 了解详细架构
2. 🔧 Fork 项目并提交 PR / Fork and submit PR
3. 🐛 报告 Issues / Report issues

### 对于用户 / For Users
1. ⚡ 快速启动并测试 / Quick start and test
2. 🎨 自定义人设和配置 / Customize personality and config
3. 🎭 添加自己的 Live2D 模型 / Add your own Live2D model

### 优化建议 / Optimization Tips
1. 🇨🇳 切换到 Whisper 改善中文识别 / Switch to Whisper for Chinese
2. 💰 使用 Gemini API 降低成本 / Use Gemini API to reduce cost
3. 🎬 接入 Bilibili 弹幕实现互动 / Integrate Bilibili danmaku

---

## 资源链接 / Resource Links

### 📚 文档 / Documentation
- [完整项目解析 (中文)](./PROJECT_UNDERSTANDING.md)
- [Project Summary (English)](./PROJECT_SUMMARY_EN.md)
- [技术评审](./TECHNICAL_REVIEW.md)
- [开发日志](./DEV_LOG.md)

### 🔗 外部资源 / External Resources
- [LiveKit Agents 文档](https://docs.livekit.io/agents/)
- [ElevenLabs API](https://elevenlabs.io/docs)
- [Deepgram API](https://developers.deepgram.com/)
- [Live2D Cubism SDK](https://www.live2d.com/en/download/cubism-sdk/)

### 🛠️ 相关项目 / Related Projects
- [LiveKit Examples](https://github.com/livekit/agents)
- [pixi-live2d-display](https://github.com/guansss/pixi-live2d-display)
- [blivedm](https://github.com/xfgryujk/blivedm)

---

## 故障排查 / Troubleshooting

| 问题 / Issue | 解决方案 / Solution |
|--------------|---------------------|
| 🔴 无法连接 LiveKit / Can't connect | 检查 `.env` 中的 API Key / Check API key in `.env` |
| 🔇 TTS 无声音 / No TTS audio | 检查 ElevenLabs 余额 / Check ElevenLabs balance |
| 🗣️ STT 识别差 / Poor STT | 切换到 Whisper / Switch to Whisper |
| 🎭 Live2D 不显示 / No Live2D | 下载 Core SDK / Download Core SDK |
| 💸 成本太高 / High cost | 用 Gemini + Edge TTS / Use Gemini + Edge TTS |

---

## 贡献者 / Contributors

欢迎贡献！/ Contributions welcome!

- 💡 提交功能建议 / Submit feature requests
- 🐛 报告 Bug / Report bugs
- 📝 改进文档 / Improve documentation
- 💻 提交代码 / Submit code

---

## License

MIT License

---

**最后更新 / Last Updated**: 2026-02-03  
**维护者 / Maintainer**: GAIVR  
**仓库 / Repository**: https://github.com/gaivrt/Chitose
