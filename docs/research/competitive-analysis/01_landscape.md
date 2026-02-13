# 竞品格局总览

## 项目定位

| 项目 | 定位 | 一句话描述 |
|------|------|-----------|
| **Luna AI** | 瑞士军刀 | 功能最全，28 LLM + 16 TTS + 12 直播平台，追求覆盖面 |
| **Open-LLM-VTuber** | 社区标准 | 前后端分离，adapter 设计，追求可扩展性 |
| **Chitose** | 低延迟精简 | LiveKit 流式架构，追求延迟和 lip sync 质量 |

## 基础数据对比

| 指标 | Luna AI | Open-LLM-VTuber | Chitose |
|------|---------|-----------------|---------|
| GitHub Stars | ~4266 | ~5883 | — |
| License | MIT | MIT | — |
| 语言 | Python | Python + TypeScript | Python + JavaScript |
| 核心框架 | 自研单体 | FastAPI + WebSocket | LiveKit Agents |
| 代码量 | 大（单文件 4257 行） | 中等 | 小 |
| 测试覆盖 | 无 | 无 | 无 |
| 平台支持 | Windows only | 跨平台 | 跨平台 |

## 技术栈速览

| 能力 | Luna AI | Open-LLM-VTuber | Chitose |
|------|---------|-----------------|---------|
| LLM | 28 providers | 多 provider（adapter） | OpenAI 兼容 API |
| TTS | 16 providers | 多 provider（adapter） | ElevenLabs |
| STT | 多种 | 多种 | Deepgram |
| Lip Sync | 二值开关（说话/不说话） | RMS 音量驱动 | FFT 频率分析 |
| 直播平台 | 12 平台（B站、YouTube 等） | 无（纯 Web） | 无（纯 Web） |
| 虚拟形象 | VTube Studio 联动 | Live2D（前端） | Live2D（pixi-live2d-display） |
| 表情/动作 | VTube Studio 转发 | 基础表情切换 | 31 表情 + 身体参数 + 道具（未接入 AI） |
| 记忆系统 | 基础上下文 | 已移除，计划重做 | 无 |
