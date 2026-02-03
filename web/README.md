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

### 4. 集成 LiveKit 口型同步（可选）

如果需要与 Chitose Agent 联动实现口型同步：

1. **启动 Chitose Agent**
   ```bash
   python main.py dev
   ```

2. **获取 LiveKit 连接信息**
   - 从 LiveKit Playground 或 Agent 日志获取房间 URL 和 Token

3. **在浏览器中打开网页并添加参数**
   ```
   http://localhost:8080?livekit_url=wss://your-project.livekit.cloud&livekit_token=your-token
   ```

4. **验证连接**
   - 打开浏览器控制台，应该看到 "✅ LiveKit 连接成功!"
   - 输入 `showLiveKitStatus()` 可查看连接状态

## 功能说明

### 手动控制

- **空格 + 拖动**: 移动 Live2D 模型位置
- **Ctrl + 滚轮**: 缩放 Live2D 模型

### 口型同步

#### 方式 1: LiveKit 自动同步（推荐）

当连接到 LiveKit 房间后，系统会自动：
1. 接收 Agent 的 TTS 音频流
2. 实时分析音频音量
3. 根据音量自动驱动嘴巴开合

**配置参数** (在 `livekit-integration.js` 中):
```javascript
const AUDIO_CONFIG = {
    smoothingFactor: 0.7,      // 音量平滑因子 (0-1)
    minVolume: 0.01,           // 最小音量阈值
    maxVolume: 0.3,            // 最大音量（用于归一化）
    mouthOpenScale: 0.8,       // 嘴巴张开缩放比例
    updateInterval: 50,        // 更新间隔 (ms)
};
```

#### 方式 2: 手动 API 控制

```javascript
// 设置嘴巴张开程度 (0~1)
window.setMouthOpenY(0.5);
```

### 调试工具

在浏览器控制台输入以下命令：

```javascript
// 查看 LiveKit 连接状态
showLiveKitStatus();

// 手动测试口型
setMouthOpenY(0.8);  // 张嘴
setMouthOpenY(0);    // 闭嘴
```

## 工作流程

```
Agent (Python)          LiveKit Room          网页 (JavaScript)
      |                      |                       |
      | -- TTS 音频流 -->    |                       |
      |                      | <-- 订阅音频轨道 --   |
      |                      |                       |
      |                      | -- 音频数据 -->       |
      |                      |                       | -- 音量分析
      |                      |                       | -- 更新口型
      |                      |                       | -- Live2D 渲染
```

## 文件结构

```
web/
├── index.html              # 入口页面
├── app.js                  # Live2D 渲染主程序
├── livekit-integration.js  # LiveKit 连接与音频分析
├── README.md               # 本文档
└── lib/
    └── live2dcubismcore.min.js  # Cubism Core (需要手动下载)
```

## 常见问题

### Q: 口型不同步怎么办？

A: 调整 `livekit-integration.js` 中的参数：
- `smoothingFactor`: 增大可使动作更平滑，减小可使反应更灵敏
- `minVolume`: 调整静音阈值
- `maxVolume`: 调整音量归一化范围
- `mouthOpenScale`: 调整嘴巴张开幅度

### Q: 如何调试音频分析？

A: 在 `livekit-integration.js` 的 `analyze()` 函数中取消注释：
```javascript
console.log(`🔊 音量: ${smoothedVolume.toFixed(3)}`);
```

### Q: LiveKit 连接失败？

A: 检查：
1. Agent 是否正在运行
2. URL 和 Token 是否正确
3. 浏览器控制台是否有错误信息
4. 网络连接是否正常

### Q: 听不到声音？

A: `livekit-integration.js` 中 `playAudioStream()` 函数已启用音频播放。
检查浏览器是否静音或阻止了自动播放。

