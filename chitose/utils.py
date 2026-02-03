"""Utility functions for Chitose."""

import logging
from typing import Optional


def setup_logging(level: str = "INFO") -> logging.Logger:
    """Set up logging configuration.
    
    Args:
        level: Logging level (DEBUG, INFO, WARNING, ERROR).
        
    Returns:
        Configured logger instance.
    """
    logging.basicConfig(
        level=getattr(logging, level.upper()),
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    
    logger = logging.getLogger("chitose")
    return logger


def truncate_text(text: str, max_length: int = 50) -> str:
    """Truncate text to specified length with ellipsis.
    
    Args:
        text: Text to truncate.
        max_length: Maximum length including ellipsis.
        
    Returns:
        Truncated text.
    """
    if len(text) <= max_length:
        return text
    return text[: max_length - 3] + "..."
