"""DanmakuBridge: blivedm -> LiveKit room."""

import logging

import aiohttp
import blivedm
import blivedm.models.web as web_models
from livekit import api, rtc

from chitose.danmaku.filter import DanmakuFilter

logger = logging.getLogger("chitose.danmaku")


class DanmakuBridge:
    """Read Bilibili danmaku and forward to a LiveKit room as text chat."""

    def __init__(
        self,
        *,
        room_id: int,
        livekit_url: str,
        livekit_api_key: str,
        livekit_api_secret: str,
        livekit_room_name: str,
        danmaku_filter: DanmakuFilter,
    ):
        self._bili_room_id = room_id
        self._lk_url = livekit_url
        self._lk_api_key = livekit_api_key
        self._lk_api_secret = livekit_api_secret
        self._lk_room_name = livekit_room_name
        self._filter = danmaku_filter

        self._http_session: aiohttp.ClientSession | None = None
        self._bli_client: blivedm.BLiveClient | None = None
        self._lk_room: rtc.Room | None = None

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    async def start(self) -> None:
        """Connect to both Bilibili and LiveKit."""
        # LiveKit: generate token and join as "danmaku-bridge"
        token = (
            api.AccessToken(self._lk_api_key, self._lk_api_secret)
            .with_identity("danmaku-bridge")
            .with_grants(api.VideoGrants(room_join=True, room=self._lk_room_name))
            .to_jwt()
        )
        self._lk_room = rtc.Room()
        await self._lk_room.connect(self._lk_url, token)
        logger.info("Joined LiveKit room %s as danmaku-bridge", self._lk_room_name)

        # Bilibili: start blivedm client
        self._http_session = aiohttp.ClientSession()
        self._bli_client = blivedm.BLiveClient(
            self._bili_room_id, session=self._http_session
        )
        handler = _Handler(self)
        self._bli_client.set_handler(handler)
        self._bli_client.start()
        logger.info("Listening to Bilibili room %d", self._bili_room_id)

    async def stop(self) -> None:
        """Disconnect from both services."""
        if self._bli_client:
            self._bli_client.stop()
            await self._bli_client.join()
            await self._bli_client.stop_and_close()
        if self._http_session:
            await self._http_session.close()
        if self._lk_room:
            await self._lk_room.disconnect()
        logger.info("DanmakuBridge stopped")

    # ------------------------------------------------------------------
    # Internal: forward messages
    # ------------------------------------------------------------------

    async def _forward_danmaku(self, uname: str, msg: str) -> None:
        if not self._filter.should_accept(uname, msg):
            return
        text = f"[{uname}] {msg}"
        await self._lk_room.local_participant.send_text(text, topic="lk.chat")
        logger.debug("Forwarded danmaku: %s", text)

    async def _forward_super_chat(
        self, uname: str, price: int, message: str
    ) -> None:
        if not self._filter.should_accept(uname, message):
            return
        text = f"[SC ¥{price} {uname}] {message}"
        await self._lk_room.local_participant.send_text(text, topic="lk.chat")
        logger.debug("Forwarded SC: %s", text)


class _Handler(blivedm.BaseHandler):
    """blivedm handler that delegates to DanmakuBridge."""

    def __init__(self, bridge: DanmakuBridge):
        super().__init__()
        self._bridge = bridge

    def _on_danmaku(
        self, client: blivedm.BLiveClient, message: web_models.DanmakuMessage
    ):
        return self._bridge._forward_danmaku(message.uname, message.msg)

    def _on_super_chat(
        self, client: blivedm.BLiveClient, message: web_models.SuperChatMessage
    ):
        return self._bridge._forward_super_chat(
            message.uname, message.price, message.message
        )
