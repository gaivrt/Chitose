# Chitose 使用指南

## 📋 前置准备

### 1. 安装依赖

```bash
# 方法 1: 使用 pip 安装开发版
pip install -e .

# 方法 2: 仅安装核心依赖
pip install livekit livekit-agents livekit-plugins-openai livekit-plugins-elevenlabs livekit-plugins-silero livekit-plugins-deepgram pyyaml python-dotenv
```

### 2. 下载 Live2D 模型

1. 从 [Live2D 官网](https://www.live2d.com/en/download/cubism-sdk/download-web/) 下载 **Cubism SDK for Web**
2. 解压后找到 `Core/live2dcubismcore.min.js`
3. 复制到 `web/lib/` 目录

```bash
mkdir -p web/lib
cp /path/to/live2dcubismcore.min.js web/lib/
```

### 3. 准备 Live2D 模型文件

将你的 Live2D 模型放到 `models/` 目录，例如：

```
models/
└── 芊芊/
    ├── 芊芊.model3.json
    ├── 芊芊.moc3
    ├── 芊芊.physics3.json
    └── textures/
```

**注意**: 模型必须是 **Cubism 4** 格式。

### 4. 配置环境变量

```bash
# 复制模板
cp .env.example .env

# 编辑 .env 文件
vim .env
```

必填配置：

```bash
# LiveKit (从 https://cloud.livekit.io/ 获取)
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=APIxxxxxxxxxx
LIVEKIT_API_SECRET=xxxxxxxxxxxxx

# OpenAI (或其他兼容 API)
OPENAI_API_KEY=sk-xxxxxx
# 可选：使用其他 OpenAI 兼容 API
# OPENAI_BASE_URL=https://api.openai.com/v1

# ElevenLabs TTS
ELEVENLABS_API_KEY=xxxxxxxxxxxx
ELEVENLABS_VOICE_ID=your-voice-id

# Deepgram STT (用于语音识别)
DEEPGRAM_API_KEY=xxxxxxxxxxxxx
```

## 🚀 使用方式

### 方式 A: 仅 Agent 运行 (无视觉界面)

适合调试语音对话功能。

```bash
# 启动 Agent
python main.py dev
```

然后访问 [LiveKit Playground](https://cloud.livekit.io/) 进行测试：
1. 进入你的项目
2. 点击 "Playground"
3. 连接到房间 `test-room`
4. 使用麦克风或文字输入与 Agent 对话

### 方式 B: Agent + Live2D 网页 (完整体验)

推荐！可以看到 Live2D 形象和自动口型同步。

**终端 1: 启动 Web 服务器**

```bash
python server.py
```

输出示例：
```
==================================================
🌸 Chitose Web Server Started
==================================================
📍 URL: http://localhost:8080
🔗 LiveKit: wss://your-project.livekit.cloud
📁 Web Root: /path/to/Chitose/web
==================================================
🔑 API Endpoints:
  - GET /api/token?room=<room>&name=<name>
==================================================
```

**终端 2: 启动 Agent**

```bash
python main.py dev
```

输出示例：
```
INFO:chitose:Connecting to LiveKit room...
INFO:chitose:Chitose agent is now active!
```

**浏览器: 访问 http://localhost:8080**

页面会自动：
1. 加载 Live2D 模型
2. 连接到 LiveKit 房间
3. 等待 Agent 的音频流
4. 实时同步口型

## 💬 交互方式

### 1. 语音输入

在 LiveKit Playground 中：
- 点击麦克风按钮
- 说话
- Agent 会识别、回复并朗读

### 2. 文字输入

在 LiveKit Playground 的聊天框：
- 输入文字
- Agent 会生成回复并朗读

## 🎮 Live2D 控制

在网页中：
- **空格 + 鼠标拖动**: 移动模型位置
- **Ctrl + 滚轮**: 缩放模型大小

## 🔧 自定义配置

### 修改模型路径

编辑 `web/app.js`:

```javascript
const CONFIG = {
    modelPath: '../models/你的模型/模型.model3.json',
    // ...
};
```

### 修改 Agent 人设

编辑 `config/default.yaml`:

```yaml
agent:
  system_prompt: |
    你是 XXX，一个 AI 虚拟主播。
    你的性格是...
  
  greeting: "大家好，我是 XXX~"
```

### 修改 TTS 声音

1. 访问 [ElevenLabs](https://elevenlabs.io/)
2. 选择或克隆一个声音
3. 复制 Voice ID
4. 更新 `.env` 中的 `ELEVENLABS_VOICE_ID`

## 🐛 常见问题

### 1. 网页无法加载模型

**错误**: `Failed to fetch model`

**解决**:
- 确保 `web/lib/live2dcubismcore.min.js` 存在
- 检查模型路径是否正确
- 必须通过 HTTP 服务器访问（不能直接打开 `index.html`）

### 2. LiveKit 连接失败

**错误**: `Token request failed: 500`

**解决**:
- 检查 `.env` 中的 LiveKit 配置
- 确保 `LIVEKIT_URL`、`LIVEKIT_API_KEY`、`LIVEKIT_API_SECRET` 正确

### 3. 没有声音

**原因**:
- Agent 未启动
- 浏览器禁用了自动播放

**解决**:
- 确保 Agent 在运行
- 点击页面任意位置以允许音频播放

### 4. 口型不同步

**调试**:
1. 打开浏览器控制台（F12）
2. 查看是否有错误
3. 确认看到 "🔊 开始播放音频并同步口型" 日志

**优化**:
编辑 `web/app.js` 中的映射参数：

```javascript
// 调整这些参数以获得更好的效果
const mouthOpen = Math.pow(volume, 0.5) * 1.2;
//                          ^^^^ 指数   ^^^^ 放大倍数
```

## 📊 系统架构

```
┌─────────────┐
│   用户输入   │ (语音/文字)
└──────┬──────┘
       ↓
┌─────────────┐
│ LiveKit     │
│ Agent       │ (STT → LLM → TTS)
│ (main.py)   │
└──────┬──────┘
       ↓ 音频流
┌─────────────┐
│ LiveKit     │
│ Room        │
└──────┬──────┘
       ↓ 订阅
┌─────────────┐
│ Web 页面    │ (LiveKit Client)
│ (app.js)    │
└──────┬──────┘
       ↓ 音频分析
┌─────────────┐
│ Live2D      │
│ 口型同步     │
└─────────────┘
```

## 🎯 下一步开发

- [ ] B站弹幕接入
- [ ] RTMP 推流到直播平台
- [ ] 表情系统
- [ ] 优化口型同步算法
- [ ] 添加背景音乐

## 📚 参考资料

- [LiveKit 官方文档](https://docs.livekit.io/)
- [Live2D Cubism SDK](https://www.live2d.com/en/sdk/)
- [pixi-live2d-display](https://github.com/guansss/pixi-live2d-display)
- [ElevenLabs API](https://elevenlabs.io/docs)
- [Deepgram API](https://developers.deepgram.com/)
