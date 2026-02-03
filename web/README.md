# Live2D 网页

## 快速开始

### 1. 准备 Live2D 模型

本项目需要 Live2D Cubism 4 模型。模型文件**不包含**在仓库中（因为版权和文件大小原因）。

#### 获取模型的方式：

**选项 A: 使用免费样例模型**
1. 访问 [Live2D 官网](https://www.live2d.com/en/download/sample-data/)
2. 下载免费的样例模型（如 Hiyori, Haru 等）
3. 解压并放到项目根目录的 `models/` 文件夹中

**选项 B: 购买或制作自己的模型**
1. 从 [Live2D Marketplace](https://nizima.com/) 购买模型
2. 或使用 Live2D Cubism Editor 制作自己的模型
3. 放到 `models/` 文件夹中

#### 目录结构示例：

```
Chitose/
├── models/               # ← 创建这个目录
│   └── Hiyori/          # ← 你的模型文件夹
│       ├── Hiyori.model3.json
│       ├── Hiyori.moc3
│       ├── Hiyori.physics3.json
│       └── textures/
├── web/
│   ├── index.html
│   └── app.js
└── ...
```

**重要**: `models/` 目录已在 `.gitignore` 中，不会被提交到 Git。

### 2. 下载 Cubism Core SDK

从 Live2D 官网下载 [Cubism SDK for Web](https://www.live2d.com/en/download/cubism-sdk/download-web/)

解压后找到 `Core/live2dcubismcore.min.js`，复制到 `web/lib/` 目录。

### 3. 启动本地服务器

由于浏览器安全限制，需要通过 HTTP 服务器访问：

```bash
# 方式1: Python
cd web
python -m http.server 8080

# 方式2: Node.js
npx serve web -p 8080
```

### 4. 打开浏览器

#### 基础访问（仅显示 Live2D）：

```
http://localhost:8080
```

如果使用自定义模型路径：

```
http://localhost:8080?model=../models/Hiyori/Hiyori.model3.json
```

#### 带 LiveKit 口型同步：

```
http://localhost:8080?token=YOUR_LIVEKIT_TOKEN
```

或指定模型和 token：

```
http://localhost:8080?model=../models/Hiyori/Hiyori.model3.json&token=YOUR_TOKEN
```

---

## LiveKit 口型同步

### 什么是 LiveKit Token？

LiveKit Token 是用于连接 LiveKit 房间的临时凭证，类似于房间的"门票"。

### 获取 Token 的方法

#### 方式 1: LiveKit Playground（推荐，最简单）

1. 启动 Agent：
   ```bash
   python main.py dev
   ```

2. 访问 [LiveKit Playground](https://agents-playground.livekit.io)

3. 按提示连接到你的 Agent

4. 连接成功后，从浏览器地址栏复制完整 URL 中的 `token` 参数

5. 在本网页 URL 添加该 token：
   ```
   http://localhost:8080?token=YOUR_TOKEN
   ```

#### 方式 2: 使用 LiveKit CLI

如果安装了 LiveKit CLI：

```bash
livekit-cli token create \
  --api-key YOUR_API_KEY \
  --api-secret YOUR_API_SECRET \
  --room-name test-room \
  --identity web-client
```

**注意**: `YOUR_API_KEY` 和 `YOUR_API_SECRET` 在你的 `.env` 文件中（`LIVEKIT_API_KEY` 和 `LIVEKIT_API_SECRET`）。

#### 方式 3: 测试模式（不需要 LiveKit）

如果只想测试 Live2D 口型功能，不需要连接 LiveKit：

```javascript
// 在浏览器控制台运行
window.testLipSync();
```

这会让口型按正弦波规律张合。

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

调整平滑系数（在 `app.js` 中找到 `mouthSmoothFactor` 变量）：

```javascript
// 找到这一行：
let mouthSmoothFactor = 0.3;

// 修改值来调整平滑度：
let mouthSmoothFactor = 0.5;  // 增大值（0-1）使口型更平滑
```

### Q: 口型张得不够大？

调整音量映射范围（在 `app.js` 中修改 `handleAudioTrack` 函数内的音量计算部分）：

```javascript
// 找到这一行：
const targetValue = Math.min(average / 100, 1.0);

// 修改除数来调整灵敏度：
const targetValue = Math.min(average / 80, 1.0);  // 减小除数使口型更夸张
```
