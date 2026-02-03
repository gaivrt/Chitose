"""Chitose Agent - Core AI VTuber agent definition."""

from livekit.agents import Agent, AgentSession, RunContext
from livekit.agents.llm import function_tool

from .config import ChitoseConfig


class ChitoseAgent(Agent):
    """Chitose AI VTuber Agent.
    
    A virtual streamer personality powered by LiveKit Agents.
    """

    def __init__(self, config: ChitoseConfig) -> None:
        """Initialize Chitose agent.
        
        Args:
            config: Configuration object containing agent settings.
        """
        super().__init__(
            instructions=config.agent.system_prompt,
            llm=config.agent.llm,
        )
        self.config = config

    async def on_enter(self) -> None:
        """Called when agent becomes active.
        
        Sends an opening greeting to the audience.
        """
        if self.config.agent.greeting:
            self.session.generate_reply(
                instructions=f"用以下方式打招呼: {self.config.agent.greeting}"
            )

    async def on_exit(self) -> None:
        """Called when agent is replaced or session ends."""
        pass

    async def on_user_turn_completed(self, turn_ctx, new_message) -> None:
        """Called after user speaks, before LLM generates response.
        
        Can be used for logging, filtering, or preprocessing.
        """
        # Log user message for debugging
        if new_message and new_message.text_content:
            print(f"[User] {new_message.text_content}")


def create_session(config: ChitoseConfig) -> AgentSession:
    """Create an AgentSession with configured plugins.
    
    Args:
        config: Configuration object.
        
    Returns:
        Configured AgentSession instance.
    """
    from livekit.plugins import openai, elevenlabs, silero
    from livekit.plugins.turn_detector.multilingual import MultilingualModel

    # Configure LLM
    llm = openai.LLM(
        model=config.agent.llm_model,
        temperature=config.agent.temperature,
    )
    
    # Configure OpenAI base URL if provided (for compatible APIs)
    if config.agent.llm_base_url:
        llm = openai.LLM(
            model=config.agent.llm_model,
            temperature=config.agent.temperature,
            base_url=config.agent.llm_base_url,
        )

    # Configure TTS
    tts = elevenlabs.TTS(
        voice=config.agent.tts_voice,
        model=config.agent.tts_model,
    )

    # Configure VAD
    vad = silero.VAD.load()

    # Create session
    session = AgentSession(
        llm=llm,
        tts=tts,
        vad=vad,
        turn_detection=MultilingualModel(),
    )

    return session
