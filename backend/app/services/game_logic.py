import random
import string
from datetime import datetime
from typing import Dict, Any
from ..models.session_stats import SessionStats, Event

# NOTE: sessions_store is expected to be a dict[str, SessionStats] provided by api.py

def next_letter(exclude: str | None = None) -> str:
    if exclude:
        # avoid immediate repeat; simple loop (26 letters so fine)
        letter = exclude
        while letter == exclude:
            letter = random.choice(string.ascii_lowercase)
        return letter
    return random.choice(string.ascii_lowercase)


def _get_store() -> Dict[str, SessionStats]:  # helper to fetch injected store
    from .. import api  # local import to avoid cycles
    store = getattr(api, 'sessions_store', None)
    if store is None:
        raise RuntimeError('sessions_store not injected on api module')
    return store  # type: ignore


def ensure_session(session_id: str, duration_ms: int) -> SessionStats:
    store = _get_store()
    if session_id not in store:
        store[session_id] = SessionStats(session_id=session_id, started_at=datetime.utcnow(), duration_ms=duration_ms)
    return store[session_id]


def record_event(session_id: str, letter: str, correct: bool, ts_client: int, duration_ms: int) -> Dict:
    sess = ensure_session(session_id, duration_ms)
    sess.events.append(Event(letter=letter, correct=correct, ts=ts_client))
    return {
        "ok": True,
        "session_id": session_id,
        "total": sess.total,
        "correct": sess.correct_count,
        "accuracy": sess.accuracy,
    }


def get_stats(session_id: str) -> Dict:
    store = _get_store()
    sess = store.get(session_id)
    if not sess:
        return {"error": "not_found"}
    now = datetime.utcnow()
    elapsed_ms = (now - sess.started_at).total_seconds() * 1000
    return {
        "session_id": session_id,
        "elapsedMs": elapsed_ms,
        "total": sess.total,
        "correct": sess.correct_count,
        "accuracy": sess.accuracy,
        "cpm": sess.cpm(now),
    }
