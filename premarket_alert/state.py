"""Onthoudt welke tickers al gemeld zijn, zodat elke run niet dezelfde mail stuurt."""

from __future__ import annotations

import json
import logging
import os
import tempfile
from pathlib import Path

from .models import Mover

log = logging.getLogger(__name__)

KEEP_DAYS = 7


class AlertState:
    def __init__(self, path: str | Path) -> None:
        self.path = Path(path)
        self._days: dict[str, dict[str, float]] = {}
        self._load()

    def _load(self) -> None:
        if not self.path.exists():
            return
        try:
            raw = json.loads(self.path.read_text(encoding="utf-8"))
            self._days = {
                str(day): {str(sym): float(pct) for sym, pct in alerts.items()}
                for day, alerts in raw.get("days", {}).items()
            }
        except (OSError, ValueError, AttributeError) as exc:
            # Een kapot statusbestand mag nooit de alert tegenhouden.
            log.warning("Kon %s niet lezen (%s); begin met lege status", self.path, exc)
            self._days = {}

    def save(self) -> None:
        for day in sorted(self._days)[:-KEEP_DAYS]:
            del self._days[day]
        self.path.parent.mkdir(parents=True, exist_ok=True)
        # Atomisch schrijven: een afgebroken run laat geen half bestand achter.
        fd, tmp = tempfile.mkstemp(dir=self.path.parent, suffix=".tmp")
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as handle:
                json.dump({"days": self._days}, handle, indent=2, sort_keys=True)
            os.replace(tmp, self.path)
        except BaseException:
            Path(tmp).unlink(missing_ok=True)
            raise

    def is_new(self, mover: Mover, session_day: str, step_pct: float) -> bool:
        """Nieuw als de ticker vandaag nog niet gemeld is, of sindsdien flink verder steeg."""
        previous = self._days.get(session_day, {}).get(mover.key)
        if previous is None:
            return True
        return mover.change_pct >= previous + step_pct

    def record(self, mover: Mover, session_day: str) -> None:
        day = self._days.setdefault(session_day, {})
        day[mover.key] = max(day.get(mover.key, 0.0), mover.change_pct)

    def filter_new(self, movers: list[Mover], session_day: str, step_pct: float) -> list[Mover]:
        return [m for m in movers if self.is_new(m, session_day, step_pct)]
