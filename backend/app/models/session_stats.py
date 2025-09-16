from __future__ import annotations
from dataclasses import dataclass, field
from datetime import datetime
from typing import List

@dataclass
class Event:
    letter: str
    correct: bool
    ts: int  # client timestamp (ms)

@dataclass
class SessionStats:
    session_id: str
    started_at: datetime
    duration_ms: int
    events: List[Event] = field(default_factory=list)

    @property
    def total(self) -> int:
        return len(self.events)

    @property
    def correct_count(self) -> int:
        return sum(1 for e in self.events if e.correct)

    @property
    def accuracy(self) -> float:
        return self.correct_count / self.total if self.total else 0.0

    def cpm(self, now: datetime | None = None) -> float:
        if not self.events:
            return 0.0
        now_dt = now or datetime.utcnow()
        elapsed_ms = (now_dt - self.started_at).total_seconds() * 1000
        if elapsed_ms <= 0:
            return 0.0
        return self.correct_count / (elapsed_ms / 60000)
