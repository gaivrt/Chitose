"""DanmakuSampler: cooldown-based sampling for ordinary danmaku."""

import asyncio
import logging
import random
from collections.abc import Awaitable, Callable

logger = logging.getLogger("chitose.danmaku")


class DanmakuSampler:
    """Buffer ordinary danmaku and forward one random pick every *interval* seconds."""

    def __init__(
        self,
        interval: float,
        forward: Callable[[str], Awaitable[None]],
    ):
        self._interval = interval
        self._forward = forward
        self._buffer: list[str] = []
        self._task: asyncio.Task | None = None

    def submit(self, text: str) -> None:
        """Non-blocking: add a danmaku to the buffer."""
        self._buffer.append(text)

    def start(self) -> None:
        self._task = asyncio.create_task(self._drain_loop())

    async def stop(self) -> None:
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            self._task = None

    async def _drain_loop(self) -> None:
        while True:
            await asyncio.sleep(self._interval)
            if not self._buffer:
                continue
            pick = random.choice(self._buffer)
            dropped = len(self._buffer) - 1
            self._buffer.clear()
            try:
                await self._forward(pick)
                logger.debug("Sampled danmaku: %s (dropped %d)", pick, dropped)
            except Exception:
                logger.exception("Failed to forward sampled danmaku")
