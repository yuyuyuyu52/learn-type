from __future__ import annotations

import os
from flask import Flask
from flask_cors import CORS
from typing import Dict
from .models.session_stats import SessionStats

app = Flask(__name__)
CORS(app)

# In-memory session storage (development only)
sessions_store: Dict[str, SessionStats] = {}

__all__ = ["app", "sessions_store"]

# Import routes (delayed to avoid circular import during type checking)
from . import api  # noqa: E402  # isort:skip