"""Chitose - AI VTuber Entry Point.

Usage:
    python main.py dev       # 开发模式
    python main.py connect   # 连接模式
"""

import asyncio
import sys
from pathlib import Path

from dotenv import load_dotenv

from livekit.agents import (
    Agent,
    AgentSession,
    JobContext,
    WorkerOptions,
    cli,
)
from livekit.plugins import openai, elevenlabs, silero, deepgram

# 加载 .env
load_dotenv()

# 导入配置
from chitose.config import ChitoseConfig
from chitose.utils import setup_logging


class ChitoseAgent(Agent):
    """Chitose AI VTuber Agent."""

    def __init__(self, config: ChitoseConfig) -> None:
        super().__init__(
            instructions=config.agent.system_prompt,
        )
        self.config = config

    async def on_enter(self) -> None:
        """Agent 激活时发送开场白。"""
        if self.config.agent.greeting:
            self.session.generate_reply(
                instructions=f"用以下方式打招呼: {self.config.agent.greeting}"
            )


async def entrypoint(ctx: JobContext):
    """LiveKit Agent 入口函数。"""
    logger = setup_logging()
    
    # 加载配置
    config = ChitoseConfig.load("config/default.yaml")
    
    logger.info("Connecting to LiveKit room...")
    await ctx.connect()
    
    # 配置 LLM
    llm_kwargs = {
        "model": config.agent.llm_model,
        "temperature": config.agent.temperature,
    }
    if config.agent.llm_base_url:
        llm_kwargs["base_url"] = config.agent.llm_base_url
    
    # 创建 session
    session = AgentSession(
        stt=deepgram.STT(language="multi"),  # 语音识别 (自动检测语言)
        vad=silero.VAD.load(),
        llm=openai.LLM(**llm_kwargs),
        tts=elevenlabs.TTS(
            voice_id=config.agent.tts_voice,
            model="eleven_multilingual_v2",  # 多语言模型，支持中文
            language="zh",
        ),
    )
    
    # 启动 Agent (启用文字输入)
    from livekit.agents.voice import room_io
    await session.start(
        agent=ChitoseAgent(config),
        room=ctx.room,
        room_options=room_io.RoomOptions(
            audio_input=True,    # 启用语音输入 (Deepgram STT)
            audio_output=True,   # 启用语音输出 (TTS)
            text_input=True,     # 启用文字输入
            text_output=True,    # 启用文字输出
        ),
    )
    
    logger.info("Chitose agent is now active!")


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
