from __future__ import annotations

from flask import Flask
from typing import Dict
from .models.session_stats import SessionStats

app = Flask(__name__)

# In-memory session storage (development only)
sessions_store: Dict[str, SessionStats] = {}

__all__ = ["app", "sessions_store"]

# Import routes (delayed to avoid circular import during type checking)
from . import api  # noqa: E402  # isort:skip