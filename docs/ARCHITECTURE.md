# Chitose 系统架构

> 基于 LiveKit Agents 的低延迟 AI VTuber 系统

## 系统总览

```
┌─────────────────────────────────────────────────────────────┐
│                      Chitose 系统                            │
│                                                             │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────────┐   │
│  │ 弹幕桥接  │───▶│              │    │   Web 前端        │   │
│  │ (danmaku) │    │  LiveKit     │◀──▶│  Live2D + 口型    │   │
│  └──────────┘    │  Server      │    │  同步 + 聊天      │   │
│                  │              │    └──────────────────┘   │
│  ┌──────────┐    │  (WebRTC     │                          │
│  │ 语音输入  │───▶│   实时通信)   │    ┌──────────────────┐   │
│  │ (STT/VAD)│    │              │───▶│   OBS / 直播推流   │   │
│  └──────────┘    └──────┬───────┘    └──────────────────┘   │
│                         │                                   │
│                  ┌──────▼───────┐                           │
│                  │ Agent Core   │                           │
│                  │ (LLM + TTS)  │                           │
│                  └──────────────┘                           │
└─────────────────────────────────────────────────────────────┘
```

## 核心数据流

```
用户输入 ──▶ LiveKit Room ──▶ Agent ──▶ LLM 生成回复 ──▶ TTS 语音合成
  │                                                          │
  ├─ 语音 (WebRTC/STT)                                       │
  ├─ 文字 (Web 聊天框)                                        ▼
  └─ 弹幕 (B站 → Bridge)                          LiveKit Room ──▶ Web 前端
                                                    │            │
                                                    │            ├─ 音频播放
                                                    │            └─ 口型同步
                                                    ▼
                                                  OBS 采集
```

三种输入通道最终都汇聚到同一个 LiveKit Room，Agent 统一处理后通过 TTS 输出语音。

## 模块划分

### 1. Agent Core (`chitose/agent.py`, `main.py`)

系统核心。基于 LiveKit Agents 框架，负责：
- 接收用户输入（语音 / 文字 / 弹幕）
- 调用 LLM 生成回复
- 通过 TTS 输出语音

关键组件：
- `ChitoseAgent(Agent)` — 人设定义、生命周期钩子
- `entrypoint()` — 组装 STT / VAD / LLM / TTS pipeline，启动 session

入口命令：`python main.py dev` 或 `python main.py connect`

### 2. 配置系统 (`chitose/config.py`, `config/`)

三层配置合并：dataclass 默认值 → YAML 文件 → 环境变量覆盖。

```
ChitoseConfig
├── LiveKitConfig    — 服务器连接
├── AgentConfig      — LLM / TTS / 人设
└── DanmakuConfig    — 弹幕桥接开关与过滤规则
```

### 3. 弹幕桥接 (`chitose/danmaku/`)

将 B 站直播弹幕转发到 LiveKit Room，让 Agent 能"看到"弹幕。

```
B站直播间 ──(blivedm)──▶ DanmakuFilter ──▶ DanmakuBridge ──▶ LiveKit Room
                          │                  │
                          ├─ 屏蔽词过滤       ├─ 以 "danmaku-bridge" 身份加入房间
                          ├─ 长度限制         └─ 通过 lk.chat topic 发送文字
                          └─ 同用户去重
```

### 4. Web 前端 (`web/`)

纯静态页面，负责 Live2D 形象渲染和音频口型同步。

技术栈：PixiJS 7 + pixi-live2d-display + LiveKit Client SDK

功能：
- Live2D 模型加载与渲染（透明背景，OBS 可抠像）
- 接收 Agent 音频轨道，通过 Web Audio API 分析音量驱动口型
- 聊天输入框，通过 `lk.chat` topic 发送文字给 Agent
- 空格拖拽 + Ctrl 滚轮缩放

## 技术栈

| 层级 | 技术 | 用途 |
|------|------|------|
| 实时通信 | LiveKit (WebRTC) | 音视频传输、文字消息 |
| Agent 框架 | LiveKit Agents | pipeline 编排、房间管理 |
| LLM | OpenAI Compatible API | 对话生成 |
| TTS | ElevenLabs | 语音合成 |
| STT | Deepgram (multilingual) | 语音识别 |
| VAD | Silero | 语音活动检测 |
| 弹幕 | blivedm | B 站弹幕协议 |
| 前端渲染 | PixiJS + pixi-live2d-display | Live2D 模型 |
| 口型同步 | Web Audio API (频率分析) | 音量 → 嘴型映射 |

## 目录结构

```
Chitose/
├── main.py                  # 入口，组装 pipeline
├── chitose/
│   ├── agent.py             # Agent 定义（人设 + 钩子）
│   ├── config.py            # 配置 dataclass + 加载逻辑
│   ├── utils.py             # 日志、文本截断等工具
│   └── danmaku/
│       ├── bridge.py        # blivedm → LiveKit 转发
│       └── filter.py        # 弹幕过滤（屏蔽词/去重/长度）
├── web/
│   ├── index.html           # Live2D 展示页
│   ├── app.js               # 渲染 + LiveKit 音频 + 口型同步
│   └── lib/                 # Cubism Core SDK
├── config/
│   └── default.yaml         # 默认配置模板
└── docs/                    # 文档
```

## 扩展方向

当前已实现 MVP 核心管道 + B 站弹幕桥接 + Live2D 口型同步。

近期规划（详见 `docs/TODO.md`）：
- 表情 / 动作系统 — LLM 输出情感标签驱动 Live2D 表情预设
- 记忆系统 — hybrid search 跨会话记忆
- 弹幕智能选择 — 过滤 + 优先级队列，挑最值得回的弹幕
- SC / 礼物反应 — 监听礼物事件触发特殊回应
