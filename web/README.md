# Live2D 网页

## 快速开始

### 1. 下载 Cubism Core SDK

从 Live2D 官网下载 [Cubism SDK for Web](https://www.live2d.com/en/download/cubism-sdk/download-web/)

解压后找到 `Core/live2dcubismcore.min.js`，复制到 `web/lib/` 目录。

### 2. 启动本地服务器

由于浏览器安全限制，需要通过 HTTP 服务器访问：

```bash
# 方式1: Python
cd web
python -m http.server 8080

# 方式2: Node.js
npx serve web -p 8080
```

### 3. 打开浏览器

访问 http://localhost:8080

---

## LiveKit 口型同步

### 自动连接

在 URL 中添加 LiveKit token 参数：

```
http://localhost:8080?token=YOUR_LIVEKIT_TOKEN
```

可选参数：
- `livekit_url`: LiveKit 服务器地址（默认：`ws://localhost:7880`）
- `token`: LiveKit 连接 token（必需）

### 手动连接

打开浏览器控制台，运行：

```javascript
// 连接到 LiveKit
window.connectToLiveKit();
```

### 测试模式

不需要 LiveKit 连接，测试口型动画：

```javascript
// 测试口型同步
window.testLipSync();
```

---

## 口型同步 API

```javascript
// 设置嘴巴张开程度 (0~1)
window.setMouthOpenY(0.5);
```

## 工作原理

1. **LiveKit 连接**：使用 `livekit-client` SDK 连接到房间
2. **音频接收**：订阅 Agent 的音频轨道
3. **音频分析**：使用 Web Audio API 的 AnalyserNode 分析音频频域
4. **音量计算**：计算平均音量（0-255）并映射到 0-1 范围
5. **平滑过渡**：应用平滑系数避免口型抖动
6. **驱动 Live2D**：更新 `ParamMouthOpenY` 参数

---

## 文件结构

```
web/
├── index.html      # 入口页面
├── app.js          # 主程序（含 LiveKit 集成）
└── lib/
    └── live2dcubismcore.min.js  # Cubism Core (需要手动下载)
```

---

## 常见问题

### Q: 口型不动？

1. 检查控制台是否有错误
2. 确认 LiveKit 连接成功（应该看到 "✅ LiveKit 连接成功!"）
3. 确认收到音频轨道（应该看到 "📢 收到音频轨道"）
4. 尝试运行 `testLipSync()` 测试口型功能

### Q: 口型抖动严重？

调整平滑系数（在 `app.js` 中）：

```javascript
let mouthSmoothFactor = 0.5;  // 增大值（0-1）使口型更平滑
```

### Q: 口型张得不够大？

调整音量映射范围（在 `app.js` 中）：

```javascript
const targetValue = Math.min(average / 80, 1.0);  // 减小除数（原为 100）
```
