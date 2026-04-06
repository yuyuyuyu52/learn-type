from __future__ import annotations

import os
import sys

# Vercel Python serverless entrypoint.
# It adds the sibling `backend/` directory to sys.path, then exposes the
# existing Flask application instance as `app` for request handling.
CURRENT_DIR = os.path.dirname(__file__)
BACKEND_DIR = os.path.abspath(os.path.join(CURRENT_DIR, "..", "backend"))

if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.api import app
