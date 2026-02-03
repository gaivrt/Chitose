# 开发日志 / Development Log

## 2026-02-04 01:48 - MVP 核心管道完成

### 完成内容

✅ **项目初始化**
- 基于 LiveKit Agents 框架搭建项目结构
- 配置系统 (`chitose/config.py`) 支持 YAML + 环境变量

✅ **LLM 集成**
- 支持 OpenAI 兼容 API (Gemini, OpenAI 等)
- 可配置 model、temperature、base_url

✅ **TTS 集成**
- ElevenLabs `eleven_multilingual_v2` 模型
- 支持中文语音合成
- 可配置 voice_id

✅ **文字输入**
- 通过 LiveKit Playground Chat 功能输入
- 禁用语音输入 (STT)，简化 MVP

### 技术栈

- **框架**: LiveKit Agents 1.3.12
- **LLM**: OpenAI 兼容 API
- **TTS**: ElevenLabs
- **VAD**: Silero

### 运行方式

```bash
# 激活环境
conda activate Chitose_env

# 运行开发模式
python main.py dev
```

### 下一步

- [ ] 添加 STT (语音识别)
- [ ] 接入 Bilibili 弹幕
- [ ] RTMP 推流
- [ ] Live2D 模型集成

---

## 2026-02-04 02:10 - STT 集成 (Deepgram)

### 完成内容

✅ **语音识别 (STT) 集成**
- 集成 Deepgram `nova-3` 模型
- 使用 `language="multi"` 自动检测语言
- 语音 + 文字双输入模式

### 已知问题

⚠️ **中文识别效果不佳**
- Deepgram 对中文识别准确率较低
- 待优化: 考虑 OpenAI Whisper 或 阿里 FunASR

### 技术栈更新

- **STT**: Deepgram `nova-3` (multi-language)

---

## 2026-02-04 03:25 - Live2D 网页展示

### 完成内容

✅ **Live2D 渲染**
- 使用 `pixi-live2d-display` + PixiJS 7
- 加载 Cubism 4 模型 (芊芊)
- 透明背景，方便 OBS/Spout2 采集

✅ **交互控制**
- 空格 + 拖动：移动模型位置
- Ctrl + 滚轮：缩放模型

✅ **口型同步 API**
- `window.setMouthOpenY(0~1)` 控制嘴巴开合

### 技术栈

- **渲染**: PixiJS 7.4.2 + pixi-live2d-display 0.4.0
- **模型**: Cubism 4 SDK

### 下一步

- [ ] 接入 LiveKit 音频做口型同步

