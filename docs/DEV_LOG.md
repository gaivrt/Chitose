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
