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

- [x] 添加 STT (语音识别)
- [x] 接入 Bilibili 弹幕
- [ ] RTMP 推流
- [x] Live2D 模型集成

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

---

## 2026-02-04 04:00 - LiveKit 网页集成 + 自动口型同步

### 完成内容

✅ **Web 服务器 (`server.py`)**
- 自动生成 LiveKit 访问 token
- 服务 web 静态文件
- API: `GET /api/token?room=<room>&name=<name>`

✅ **LiveKit 客户端集成 (`web/app.js`)**
- 使用 LiveKit Client SDK 2.5.11
- 自动连接到 LiveKit 房间
- 订阅 Agent 的音频流

✅ **自动口型同步**
- 使用 Web Audio API 分析音频
- 实时计算音量
- 自动映射到 Live2D 嘴巴参数

### 工作流程

```
用户输入 → Agent (TTS) → LiveKit Room → Web 页面 → Live2D 口型
```

### 使用方式

```bash
# 终端 1: 启动 Web 服务器
python server.py

# 终端 2: 启动 Agent
python main.py dev

# 浏览器: 访问 http://localhost:8080
```

### 技术细节

- **Token 生成**: 使用 `livekit.api.AccessToken`
- **音频接收**: `Room.on(RoomEvent.TrackSubscribed)`
- **音频分析**: `AnalyserNode.getByteFrequencyData()`
- **口型映射**: 非线性映射 `pow(volume, 0.5) * 1.2`

### 下一步

- [ ] 优化口型同步算法 (添加平滑过渡)
- [ ] 添加连接状态 UI 提示
- [ ] 支持多个观众同时观看

