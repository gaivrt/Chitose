# Live2D 网页

## 功能说明

这个网页实现了以下功能：
1. **Live2D 模型渲染** - 使用 pixi-live2d-display
2. **LiveKit 集成** - 接收来自 Agent 的音频流
3. **自动口型同步** - 根据音频音量自动控制嘴巴张开

## 快速开始

### 1. 下载 Cubism Core SDK

从 Live2D 官网下载 [Cubism SDK for Web](https://www.live2d.com/en/download/cubism-sdk/download-web/)

解压后找到 `Core/live2dcubismcore.min.js`，复制到 `web/lib/` 目录。

### 2. 安装 Python 依赖

确保已安装 livekit SDK:

```bash
# 如果使用 pip
pip install livekit

# 如果使用项目依赖
pip install -e .
```

### 3. 配置环境变量

确保 `.env` 文件包含 LiveKit 配置:

```bash
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
```

### 4. 启动 Web 服务器

使用新的 `server.py` 启动服务器（自动生成 LiveKit token）:

```bash
python server.py
```

服务器会在 `http://localhost:8080` 启动。

### 5. 启动 LiveKit Agent

在另一个终端启动 Agent:

```bash
python main.py dev
```

### 6. 打开浏览器

访问 http://localhost:8080

网页会自动：
1. 加载 Live2D 模型
2. 连接到 LiveKit 房间
3. 接收 Agent 的音频流
4. 根据音频同步口型

## 工作流程

```
[你的输入] 
    ↓
[LiveKit Agent] (main.py)
    ↓ 音频流
[LiveKit Room]
    ↓ 订阅音频
[Web 页面] (app.js)
    ↓ 音频分析
[Live2D 口型同步]
```

## API 说明

### Token 生成 API

```
GET /api/token?room=<room_name>&name=<participant_name>
```

返回:
```json
{
  "token": "eyJhbGc...",
  "url": "wss://...",
  "room": "test-room",
  "identity": "web-viewer"
}
```

### 口型同步 API (JavaScript)

```javascript
// 手动设置嘴巴张开程度 (0~1)
window.setMouthOpenY(0.5);
```

## 文件结构

```
web/
├── index.html      # 入口页面 (包含 LiveKit SDK)
├── app.js          # 主程序 (Live2D + LiveKit 集成)
├── lib/
│   └── live2dcubismcore.min.js  # Cubism Core (需要手动下载)
└── README.md       # 本文件
```

## 交互控制

- **空格 + 拖动**: 移动模型位置
- **Ctrl + 滚轮**: 缩放模型大小

## 技术栈

- **Live2D 渲染**: pixi-live2d-display 0.4.0 + PixiJS 7.4.2
- **实时通信**: LiveKit Client SDK 2.5.11
- **音频分析**: Web Audio API
- **后端**: Python HTTP Server + LiveKit Token 生成
