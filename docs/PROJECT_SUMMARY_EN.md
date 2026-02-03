# Chitose Project Summary 🌸

> **Date**: 2026-02-03  
> **Version**: v0.1 MVP  
> **Type**: AI Virtual Streamer System

---

## Overview

**Chitose (千岁)** is a low-latency AI Virtual Streamer (VTuber) system built on LiveKit Agents framework, designed for real-time interaction with audiences through voice and text.

### Key Features

- ⚡ **Ultra-low latency** - <500ms end-to-end based on LiveKit Agents
- 🔌 **Modular architecture** - Independent LLM, TTS, STT, and Live2D rendering
- 🎯 **MVP approach** - Minimum Viable Product for rapid validation
- 🌏 **Multi-language** - Supports Chinese and multiple languages
- 🎭 **Virtual avatar** - Live2D character rendering with lip-sync capability

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Chitose System                          │
├─────────────────────────────────────────────────────────────┤
│  Input Layer        Processing Layer         Output Layer   │
│                                                              │
│  • Voice (STT)  →   • LLM Dialogue      →   • TTS Synthesis│
│  • Text         →   • Agent Logic       →   • Audio Stream │
│  • Danmaku*     →   • VAD Detection     →   • Live2D       │
│                                                              │
│                     (* = Planned)                           │
└─────────────────────────────────────────────────────────────┘
         ↑                                          ↓
         │                                          │
    ┌────┴─────┐                            ┌──────┴──────┐
    │ LiveKit  │                            │   Web UI    │
    │ Room/RTC │                            │  (Live2D)   │
    └──────────┘                            └─────────────┘
```

---

## Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Framework** | LiveKit Agents | Real-time communication |
| **LLM** | OpenAI Compatible API | Conversational AI |
| **TTS** | ElevenLabs | Speech synthesis |
| **STT** | Deepgram Nova-3 | Speech recognition |
| **VAD** | Silero | Voice activity detection |
| **Live2D** | PixiJS + pixi-live2d-display | Character rendering |

---

## Project Structure

```
Chitose/
├── chitose/              # Core package
│   ├── agent.py         # Agent logic
│   ├── config.py        # Configuration system
│   └── utils.py         # Utilities
├── config/              # Configuration files
│   └── default.yaml    # Default config
├── docs/                # Documentation
│   ├── PROJECT_UNDERSTANDING.md    # Full analysis (Chinese)
│   ├── PROJECT_SUMMARY_EN.md       # This file
│   ├── TECHNICAL_REVIEW.md         # Technical review
│   ├── DEV_LOG.md                  # Development log
│   └── TODO.md                     # Todo list
├── web/                 # Live2D web UI
│   ├── index.html      # Entry page
│   ├── app.js          # Live2D renderer
│   └── lib/            # Third-party libraries
├── main.py              # Entry point
└── pyproject.toml       # Project config
```

---

## Quick Start

### 1. Environment Setup

```bash
# Create virtual environment
conda create -n Chitose_env python=3.10
conda activate Chitose_env

# Install dependencies
pip install -e .
```

### 2. Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit and fill in your API keys
vim .env
```

Required API keys:
- **LiveKit**: Get from [LiveKit Cloud](https://cloud.livekit.io/)
- **OpenAI**: Get from [OpenAI Platform](https://platform.openai.com/)
- **ElevenLabs**: Get from [ElevenLabs](https://elevenlabs.io/)
- **Deepgram**: Get from [Deepgram](https://developers.deepgram.com/)

### 3. Run

```bash
# Development mode
python main.py dev

# Then visit LiveKit Playground to test
# https://agents-playground.livekit.io/
```

### 4. Live2D Web UI (Optional)

```bash
# 1. Download Cubism Core SDK from Live2D official site
# Place live2dcubismcore.min.js in web/lib/

# 2. Start local server
cd web
python -m http.server 8080

# 3. Open browser
# http://localhost:8080
```

---

## Core Modules

### 1. Agent Core (`chitose/agent.py`)

Defines the AI VTuber personality and behavior:
- **ChitoseAgent**: Main agent class inheriting from `livekit.agents.Agent`
- **on_enter()**: Sends greeting when agent activates
- **on_user_turn_completed()**: Handles user input callback

### 2. Configuration System (`chitose/config.py`)

Three-tier configuration with priority:
1. Code defaults (dataclass)
2. YAML config file (`config/default.yaml`)
3. Environment variables (`.env`) - **Highest priority**

### 3. Live2D Renderer (`web/app.js`)

Features:
- Model loading and rendering with PixiJS
- Interactive controls (drag with Space, zoom with Ctrl+Scroll)
- Lip-sync API: `window.setMouthOpenY(0~1)`

---

## Development Roadmap

### ✅ MVP (Current Phase)

Core voice dialogue pipeline:
- [x] LiveKit Agents integration
- [x] LLM conversation (OpenAI Compatible)
- [x] TTS synthesis (ElevenLabs)
- [x] STT recognition (Deepgram)
- [x] Text input support
- [x] Live2D rendering
- [x] Configuration management

### 🚧 Phase 1: Live Streaming

- [ ] Bilibili danmaku (bullet comments) integration
- [ ] RTMP streaming output
- [ ] Audio mixing
- [ ] Improve Chinese STT accuracy (switch to Whisper/FunASR)

### 📋 Phase 2: Advanced Features

- [ ] Live2D lip-sync based on audio analysis
- [ ] Expression and motion triggers
- [ ] Spout2 screen sharing (Windows)
- [ ] OBS streaming integration

### 🎯 Phase 3: Automation

- [ ] Scheduled tasks / danmaku triggers
- [ ] Multi-user interaction
- [ ] Performance monitoring
- [ ] Logging and alerting

---

## Known Issues

### High Priority

1. **Deepgram Chinese STT accuracy is low**
   - **Impact**: Poor Chinese voice interaction
   - **Solution**: Switch to OpenAI Whisper or deploy FunASR

2. **Missing Live2D lip-sync**
   - **Impact**: Visual experience not natural
   - **Solution**: Integrate audio analysis and call `setMouthOpenY()`

### Medium Priority

- Bilibili danmaku input
- RTMP streaming
- Audio mixing

### Low Priority

- Hot reload configuration
- Log persistence
- Performance monitoring

---

## Cost Estimation

Monthly cost (assuming 2 hours streaming per day):

| Service | Cost |
|---------|------|
| LiveKit | $0 ~ $50 |
| OpenAI API | $20 ~ $50 |
| ElevenLabs | $22 (Creator Plan) |
| Deepgram | $0 ~ $25 |
| **Total** | **$42 ~ $147 / month** |

---

## Data Flow

### Current MVP Flow

```
User Input (Voice/Text)
    ↓
LiveKit Room
    ↓
STT (Deepgram) → Text
    ↓
LLM (OpenAI) → Response
    ↓
TTS (ElevenLabs) → Audio
    ↓
LiveKit Room Audio Stream
    ↓
User Hears Response
```

### Planned Live Streaming Flow

```
Input Sources                 Agent Processing              Output
  Voice    ┐                      ┌─ STT ─┐                  ┌─ Audio
  Text     ├──→ LiveKit Room ──→  │  LLM  │ ──→ TTS ──→    ├─ Live2D
  Danmaku  ┘                      └─ VAD ─┘                  └─ RTMP Stream
                                                                    ↓
                                                              Bilibili Live
```

---

## Key Technical Details

### AgentSession Initialization (v1.x)

**Correct way**:
```python
from livekit.plugins import openai, elevenlabs, silero, deepgram

session = AgentSession(
    llm=openai.LLM(model="gpt-4o-mini", temperature=0.7),
    tts=elevenlabs.TTS(voice="voice-id", model="eleven_turbo_v2_5"),
    stt=deepgram.STT(language="multi"),
    vad=silero.VAD.load(),
)
```

**Wrong way** (deprecated):
```python
# ❌ Don't use string-based plugin specification
session = AgentSession(
    llm="openai/gpt-4o-mini",
    tts="elevenlabs/voice-id",
)
```

### Configuration Priority

```
Environment Variables (.env) > YAML Config > Code Defaults
```

Example:
1. Code default: `llm_model = "gpt-4o-mini"`
2. YAML override: `llm_model: gpt-3.5-turbo`
3. Env override: `LLM_MODEL=gpt-4`

Result: `gpt-4`

---

## FAQ

**Q: How to change LLM model?**  
A: Edit `.env` or `config/default.yaml`:
```bash
LLM_MODEL=gpt-3.5-turbo
```

**Q: How to customize character personality?**  
A: Edit `system_prompt` in `config/default.yaml`:
```yaml
agent:
  system_prompt: |
    You are a gentle big sister who loves to take care of others...
```

**Q: How to deploy to server?**  
A: Use `python main.py connect` mode (headless).

**Q: Where to get Live2D models?**  
A: 
- Official samples: https://www.live2d.com/en/download/sample-data/
- Third-party: https://github.com/topics/live2d-models

**Q: How to reduce API costs?**  
A:
- LLM: Use Gemini API (larger free tier)
- TTS: Use Edge TTS (completely free)
- STT: Reduce recognition time

---

## Testing

### Test Scripts

```bash
# Test TTS (ElevenLabs)
python test_tts.py

# Test STT (Deepgram)
python test_deepgram.py
```

### Manual Testing

1. Start agent: `python main.py dev`
2. Open LiveKit Playground
3. Join room and test voice/text interaction
4. Check audio output quality

---

## Dependencies

### Required Services

| Service | Purpose | Get API Key |
|---------|---------|-------------|
| LiveKit Cloud | Real-time communication | https://cloud.livekit.io/ |
| OpenAI API | LLM conversation | https://platform.openai.com/ |
| ElevenLabs | TTS synthesis | https://elevenlabs.io/ |
| Deepgram | STT recognition | https://developers.deepgram.com/ |

### Python Packages

```toml
dependencies = [
    "livekit-agents>=1.0.0",
    "livekit-plugins-openai>=1.0.0",
    "livekit-plugins-elevenlabs>=1.0.0",
    "livekit-plugins-silero>=1.0.0",
    "pyyaml>=6.0",
    "python-dotenv>=1.0.0",
]
```

---

## References

### Official Documentation

- [LiveKit Agents Docs](https://docs.livekit.io/agents/)
- [LiveKit Python SDK](https://github.com/livekit/python-sdk)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [ElevenLabs API Docs](https://elevenlabs.io/docs)
- [Deepgram API Docs](https://developers.deepgram.com/)

### Third-party Libraries

- [pixi-live2d-display](https://github.com/guansss/pixi-live2d-display)
- [PixiJS](https://pixijs.com/)
- [blivedm - Bilibili Danmaku](https://github.com/xfgryujk/blivedm)

---

## Project Status

- **Version**: v0.1.0 (MVP)
- **Status**: In Development
- **License**: MIT
- **Maintainer**: GAIVR

### Module Completion

| Module | Status | Completion |
|--------|--------|------------|
| Core Framework | ✅ Done | 100% |
| LLM Dialogue | ✅ Done | 100% |
| TTS Synthesis | ✅ Done | 100% |
| STT Recognition | ⚠️ Needs Optimization | 70% |
| Live2D Rendering | ✅ Done | 90% |
| Danmaku Input | ❌ Not Started | 0% |
| RTMP Streaming | ❌ Not Started | 0% |
| Lip Sync | ❌ Not Started | 0% |

---

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## License

MIT License - see LICENSE file for details

---

**Last Updated**: 2026-02-03  
**Contact**: GitHub Issues
