"""Configuration management for Chitose."""

import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

import yaml
from dotenv import load_dotenv


@dataclass
class LiveKitConfig:
    """LiveKit server connection configuration."""
    url: str = ""
    api_key: str = ""
    api_secret: str = ""


@dataclass
class AgentConfig:
    """Agent behavior configuration."""
    # LLM settings
    llm: str = "openai/gpt-4o-mini"
    llm_model: str = "gpt-4o-mini"
    llm_base_url: Optional[str] = None
    temperature: float = 0.7
    
    # TTS settings
    tts_voice: str = ""  # ElevenLabs voice ID
    tts_model: str = "eleven_turbo_v2_5"
    tts_language: str = "zh"
    
    # Personality
    system_prompt: str = """你是 Chitose（千岁），一个 AI 虚拟主播。
你性格活泼可爱，喜欢和观众互动。
回复要简洁自然，每次控制在 50 字以内。
"""
    greeting: str = "大家好，我是千岁~"


@dataclass
class DanmakuConfig:
    """Bilibili danmaku bridge configuration."""
    enabled: bool = False
    platform: str = "bilibili"
    room_id: int = 0
    sessdata: str | None = None
    blocked_words: list[str] = field(default_factory=list)
    max_length: int = 100
    dedup_window: float = 5.0
    sample_interval: float = 10.0


@dataclass
class ChitoseConfig:
    """Main configuration for Chitose."""
    livekit: LiveKitConfig = field(default_factory=LiveKitConfig)
    agent: AgentConfig = field(default_factory=AgentConfig)
    danmaku: DanmakuConfig = field(default_factory=DanmakuConfig)
    
    @classmethod
    def load(cls, config_path: Optional[str] = None) -> "ChitoseConfig":
        """Load configuration from YAML file and environment variables.
        
        Args:
            config_path: Path to YAML config file. If None, uses default.
            
        Returns:
            Loaded configuration object.
        """
        # Load .env file
        load_dotenv()
        
        # Start with default config
        config = cls()
        
        # Load from YAML if provided
        if config_path:
            yaml_path = Path(config_path)
            if yaml_path.exists():
                with open(yaml_path, "r", encoding="utf-8") as f:
                    yaml_data = yaml.safe_load(f) or {}
                config = cls._from_dict(yaml_data)
        
        # Override with environment variables
        config = cls._apply_env_vars(config)
        
        return config
    
    @classmethod
    def _from_dict(cls, data: dict) -> "ChitoseConfig":
        """Create config from dictionary."""
        config = cls()
        
        # LiveKit config
        if "livekit" in data:
            lk = data["livekit"]
            config.livekit.url = lk.get("url", config.livekit.url)
            config.livekit.api_key = lk.get("api_key", config.livekit.api_key)
            config.livekit.api_secret = lk.get("api_secret", config.livekit.api_secret)
        
        # Agent config
        if "agent" in data:
            ag = data["agent"]
            config.agent.llm = ag.get("llm", config.agent.llm)
            config.agent.llm_model = ag.get("llm_model", config.agent.llm_model)
            config.agent.llm_base_url = ag.get("llm_base_url", config.agent.llm_base_url)
            config.agent.temperature = ag.get("temperature", config.agent.temperature)
            config.agent.tts_voice = ag.get("tts_voice", config.agent.tts_voice)
            config.agent.tts_model = ag.get("tts_model", config.agent.tts_model)
            config.agent.tts_language = ag.get("tts_language", config.agent.tts_language)
            config.agent.system_prompt = ag.get("system_prompt", config.agent.system_prompt)
            config.agent.greeting = ag.get("greeting", config.agent.greeting)

        # Danmaku config
        if "danmaku" in data:
            dm = data["danmaku"]
            config.danmaku.enabled = dm.get("enabled", config.danmaku.enabled)
            config.danmaku.platform = dm.get("platform", config.danmaku.platform)
            config.danmaku.room_id = dm.get("room_id", config.danmaku.room_id)
            config.danmaku.sessdata = dm.get("sessdata", config.danmaku.sessdata)
            config.danmaku.blocked_words = dm.get("blocked_words", config.danmaku.blocked_words)
            config.danmaku.max_length = dm.get("max_length", config.danmaku.max_length)
            config.danmaku.dedup_window = dm.get("dedup_window", config.danmaku.dedup_window)
            config.danmaku.sample_interval = dm.get("sample_interval", config.danmaku.sample_interval)

        return config
    
    @classmethod
    def _apply_env_vars(cls, config: "ChitoseConfig") -> "ChitoseConfig":
        """Apply environment variable overrides."""
        # LiveKit
        if url := os.getenv("LIVEKIT_URL"):
            config.livekit.url = url
        if api_key := os.getenv("LIVEKIT_API_KEY"):
            config.livekit.api_key = api_key
        if api_secret := os.getenv("LIVEKIT_API_SECRET"):
            config.livekit.api_secret = api_secret
        
        # OpenAI / LLM
        if base_url := os.getenv("OPENAI_BASE_URL"):
            config.agent.llm_base_url = base_url
        if model := os.getenv("LLM_MODEL"):
            config.agent.llm_model = model
        if temp := os.getenv("LLM_TEMPERATURE"):
            config.agent.temperature = float(temp)
        
        # ElevenLabs
        if voice := os.getenv("ELEVENLABS_VOICE_ID"):
            config.agent.tts_voice = voice
        if tts_model := os.getenv("ELEVENLABS_MODEL"):
            config.agent.tts_model = tts_model

        # Bilibili
        if sessdata := os.getenv("BILI_SESSDATA"):
            config.danmaku.sessdata = sessdata

        return config
