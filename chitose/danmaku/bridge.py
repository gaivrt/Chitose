"""DanmakuBridge: Bilibili danmaku listener with callback-based forwarding."""

import asyncio
import http.cookies
import logging
from collections.abc import Awaitable, Callable

import aiohttp
import blivedm
import blivedm.models.web as web_models

from chitose.danmaku.filter import DanmakuFilter
from chitose.danmaku.sampler import DanmakuSampler

logger = logging.getLogger("chitose.danmaku")


class DanmakuBridge:
    """Listen to Bilibili danmaku and forward via callback."""

    def __init__(
        self,
        *,
        room_id: int,
        on_danmaku: Callable[[str], Awaitable[None]],
        danmaku_filter: DanmakuFilter,
        sessdata: str | None = None,
        sample_interval: float = 0,
    ):
        self._bili_room_id = room_id
        self._on_danmaku = on_danmaku
        self._filter = danmaku_filter
        self._sessdata = sessdata
        self._sample_interval = sample_interval

        self._http_session: aiohttp.ClientSession | None = None
        self._bli_client: blivedm.BLiveClient | None = None
        self._sampler: DanmakuSampler | None = None

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    async def start(self) -> None:
        """Connect to Bilibili and start listening."""
        self._http_session = aiohttp.ClientSession()
        if self._sessdata:
            cookies = http.cookies.SimpleCookie()
            cookies["SESSDATA"] = self._sessdata
            cookies["SESSDATA"]["domain"] = "bilibili.com"
            self._http_session.cookie_jar.update_cookies(cookies)
            logger.info("SESSDATA cookie injected")
        else:
            logger.warning("No SESSDATA configured, usernames will be masked")

        self._bli_client = blivedm.BLiveClient(
            self._bili_room_id, session=self._http_session
        )
        handler = _Handler(self)
        self._bli_client.set_handler(handler)
        self._bli_client.start()
        logger.info("Listening to Bilibili room %d", self._bili_room_id)

        # Sampler for rate-limiting ordinary danmaku
        if self._sample_interval > 0:
            self._sampler = DanmakuSampler(
                interval=self._sample_interval,
                forward=self._on_danmaku,
            )
            self._sampler.start()
            logger.info("Danmaku sampler enabled (interval=%.1fs)", self._sample_interval)

    async def stop(self) -> None:
        """Disconnect and clean up."""
        if self._sampler:
            await self._sampler.stop()
        if self._bli_client:
            self._bli_client.stop()
            await self._bli_client.join()
            await self._bli_client.stop_and_close()
        if self._http_session:
            await self._http_session.close()
        logger.info("DanmakuBridge stopped")

    # ------------------------------------------------------------------
    # Internal: forward messages
    # ------------------------------------------------------------------

    async def _forward_danmaku(self, uname: str, msg: str) -> None:
        if not self._filter.should_accept(uname, msg):
            return
        text = f"[{uname}] {msg}"
        if self._sampler:
            self._sampler.submit(text)
        else:
            await self._on_danmaku(text)
            logger.debug("Forwarded danmaku: %s", text)

    async def _forward_super_chat(
        self, uname: str, price: int, message: str
    ) -> None:
        if not self._filter.should_accept(uname, message):
            return
        text = f"[SC ¥{price} {uname}] {message}"
        # SC bypasses sampler, always forward immediately
        await self._on_danmaku(text)
        logger.debug("Forwarded SC: %s", text)


class _Handler(blivedm.BaseHandler):
    """blivedm handler that delegates to DanmakuBridge."""

    def __init__(self, bridge: DanmakuBridge):
        super().__init__()
        self._bridge = bridge

    def _on_danmaku(
        self, client: blivedm.BLiveClient, message: web_models.DanmakuMessage
    ):
        asyncio.create_task(self._bridge._forward_danmaku(message.uname, message.msg))

    def _on_super_chat(
        self, client: blivedm.BLiveClient, message: web_models.SuperChatMessage
    ):
        asyncio.create_task(
            self._bridge._forward_super_chat(
                message.uname, message.price, message.message
            )
        )
