# Live2D 口型同步使用指南

## 概述

Chitose 项目现已完成 LiveKit 音频流与 Live2D 模型的口型同步集成。本指南说明如何使用和测试该功能。

---

## 系统架构

```
┌─────────────────┐
│  LiveKit Agent  │  ← Python 后端（LLM + TTS）
│   (main.py)     │
└────────┬────────┘
         │ LiveKit 音频流
         ↓
┌─────────────────┐
│   Web 浏览器     │
│                 │
│  ┌───────────┐  │
│  │ LiveKit   │  │  ← 接收音频轨道
│  │  Client   │  │
│  └─────┬─────┘  │
│        │        │
│  ┌─────▼─────┐  │
│  │ Web Audio │  │  ← 分析音频音量
│  │  Analyser │  │
│  └─────┬─────┘  │
│        │        │
│  ┌─────▼─────┐  │
│  │  Live2D   │  │  ← 驱动口型
│  │   Model   │  │
│  └───────────┘  │
└─────────────────┘
```

---

## 快速开始

### 1. 启动 LiveKit Agent

```bash
# 激活虚拟环境
conda activate Chitose_env

# 启动开发模式
python main.py dev
```

等待看到：
```
INFO: Chitose agent is now active!
INFO: Visit https://agents-playground.livekit.io to test
```

### 2. 获取 LiveKit Token

访问 [LiveKit Playground](https://agents-playground.livekit.io/)，连接到你的 Agent。

或使用 LiveKit CLI 生成 token：
```bash
livekit-cli token create \
  --api-key YOUR_API_KEY \
  --api-secret YOUR_API_SECRET \
  --room-name test-room \
  --identity web-client
```

### 3. 启动网页服务器

```bash
cd web
python -m http.server 8080
```

### 4. 打开浏览器

#### 方式 A：自动连接（推荐）

```
http://localhost:8080?token=YOUR_LIVEKIT_TOKEN
```

#### 方式 B：手动连接

1. 打开 http://localhost:8080
2. 打开浏览器控制台（F12）
3. 运行：
   ```javascript
   window.connectToLiveKit();
   ```

#### 方式 C：测试模式（不需要 LiveKit）

1. 打开 http://localhost:8080
2. 打开浏览器控制台（F12）
3. 运行：
   ```javascript
   window.testLipSync();
   ```
   这会让口型按正弦波规律张合，用于测试 Live2D 功能。

---

## 使用流程

### 完整工作流

```
1. Agent 启动 → 等待连接
2. 网页连接 → 加载 Live2D 模型
3. 用户输入 → 文字或语音（通过 LiveKit Playground）
4. Agent 处理 → LLM 生成回复
5. TTS 合成 → 生成音频流
6. 网页接收 → 实时播放 + 口型同步
```

### 口型同步流程

```
音频流 → Web Audio Context 
      → AnalyserNode (FFT 256)
      → 频域数据 (0-255)
      → 平均音量计算
      → 映射到 0-1 范围
      → 平滑过渡算法
      → Live2D ParamMouthOpenY
```

---

## 参数调优

### 口型灵敏度

修改 `web/app.js` 中的音量映射：

```javascript
// 原值：average / 100
// 除数越小，口型越夸张
const targetValue = Math.min(average / 80, 1.0);  // 更夸张
const targetValue = Math.min(average / 120, 1.0); // 更保守
```

### 口型平滑度

修改平滑系数：

```javascript
// 原值：0.3
// 值越大，口型越平滑（但延迟也会增加）
let mouthSmoothFactor = 0.5;  // 更平滑
let mouthSmoothFactor = 0.1;  // 更敏锐
```

### FFT 平滑

修改分析器平滑常数：

```javascript
// 原值：0.8
analyser.smoothingTimeConstant = 0.9;  // 更平滑
analyser.smoothingTimeConstant = 0.6;  // 更敏锐
```

---

## 调试技巧

### 检查连接状态

打开浏览器控制台，查看日志：

- ✅ `LiveKit 连接成功!` - 连接正常
- 📢 `收到音频轨道` - 音频流正常
- ✅ `口型同步已启动!` - 功能正常

### 手动测试口型

在控制台运行：

```javascript
// 测试嘴巴张开
window.setMouthOpenY(0);    // 闭嘴
window.setMouthOpenY(0.5);  // 半开
window.setMouthOpenY(1);    // 全开

// 测试动画
window.testLipSync();
```

### 常见问题

**Q: 口型不动？**

1. 检查是否收到音频轨道（看控制台日志）
2. 确认模型参数名称正确（`ParamMouthOpenY`）
3. 尝试手动测试：`window.setMouthOpenY(1)`

**Q: 口型抖动严重？**

增大 `mouthSmoothFactor` 或 `smoothingTimeConstant`

**Q: 口型延迟严重？**

减小 `mouthSmoothFactor` 或 `smoothingTimeConstant`

**Q: 口型幅度太小？**

减小音量映射的除数（如 `average / 80`）

---

## 技术细节

### LiveKit 订阅

```javascript
room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
    if (track.kind === Track.Kind.Audio) {
        handleAudioTrack(track);
    }
});
```

### 音频分析

```javascript
// 创建分析器
analyser = audioContext.createAnalyser();
analyser.fftSize = 256;  // FFT 窗口大小
analyser.smoothingTimeConstant = 0.8;

// 获取频域数据
const audioDataArray = new Uint8Array(analyser.frequencyBinCount);
analyser.getByteFrequencyData(audioDataArray);

// 计算平均音量
const average = audioDataArray.reduce((a, b) => a + b) / audioDataArray.length;
```

### Live2D 控制

```javascript
// 获取 Cubism 4 参数索引
const coreModel = model.internalModel.coreModel;
const paramIndex = coreModel.getParameterIndex('ParamMouthOpenY');

// 设置参数值
coreModel.setParameterValueByIndex(paramIndex, value);  // 0-1
```

---

## 扩展功能

### 呼吸动画

可以添加自动呼吸效果：

```javascript
function addBreathing() {
    let time = 0;
    setInterval(() => {
        time += 0.05;
        const breathValue = (Math.sin(time) + 1) / 2 * 0.3;  // 0-0.3
        // 设置 ParamBreath 参数
    }, 50);
}
```

### 情绪表情

根据对话内容切换表情：

```javascript
function setExpression(emotion) {
    // emotion: 'happy', 'sad', 'angry', 'surprised'
    // 设置对应的 Live2D 表情参数
}
```

---

## 性能优化

### 降低 CPU 使用

1. 减小 FFT 大小：`analyser.fftSize = 128`
2. 降低更新频率：使用 `setTimeout` 代替 `requestAnimationFrame`
3. 减少频域数据处理范围

### 降低网络带宽

LiveKit 自动适配网络状况，但可以手动配置：

```javascript
const room = new Room({
    adaptiveStream: true,  // 自适应
    dynacast: true,        // 动态码率
});
```

---

## 下一步

- [ ] 调优参数以获得最佳效果
- [ ] 添加音频可视化界面
- [ ] 支持多种 Live2D 模型
- [ ] 添加表情控制
- [ ] 集成 Bilibili 弹幕
