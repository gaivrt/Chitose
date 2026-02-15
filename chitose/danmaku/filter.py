"""Danmaku filtering: blocked words, length limit, dedup."""

import time
from dataclasses import dataclass, field


@dataclass
class DanmakuFilter:
    """Filter danmaku messages by content rules."""

    blocked_words: list[str] = field(default_factory=list)
    max_length: int = 100
    dedup_window: float = 5.0

    def __post_init__(self):
        # key: (username, content) -> timestamp
        self._recent: dict[tuple[str, str], float] = {}

    def should_accept(self, username: str, content: str) -> bool:
        """Return True if the danmaku should be forwarded."""
        # 长度检查
        if len(content) > self.max_length:
            return False

        # 屏蔽词
        content_lower = content.lower()
        for word in self.blocked_words:
            if word.lower() in content_lower:
                return False

        # 去重：同用户同内容在窗口内只保留一条
        now = time.monotonic()
        key = (username, content)
        if key in self._recent and now - self._recent[key] < self.dedup_window:
            return False
        self._recent[key] = now

        # 顺便清理过期条目
        self._cleanup(now)
        return True

    def _cleanup(self, now: float) -> None:
        expired = [
            k for k, t in self._recent.items()
            if now - t >= self.dedup_window
        ]
        for k in expired:
            del self._recent[k]
