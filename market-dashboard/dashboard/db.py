"""SQLite cache: time series plus the outcome of every fetch per source."""

from __future__ import annotations

import sqlite3
import threading
from datetime import datetime
from pathlib import Path

SCHEMA = """
CREATE TABLE IF NOT EXISTS series (
    key   TEXT NOT NULL,
    date  TEXT NOT NULL,
    value REAL NOT NULL,
    PRIMARY KEY (key, date)
);
CREATE TABLE IF NOT EXISTS fetch_status (
    source       TEXT PRIMARY KEY,
    last_success TEXT,
    last_attempt TEXT,
    last_error   TEXT
);
"""


class Store:
    def __init__(self, path: str):
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        self._conn = sqlite3.connect(path, check_same_thread=False)
        self._lock = threading.Lock()
        with self._lock:
            self._conn.executescript(SCHEMA)

    def upsert(self, key: str, points: dict[str, float]) -> None:
        """Store {iso date: value} for one series key."""
        rows = [(key, d, float(v)) for d, v in points.items() if v is not None]
        with self._lock, self._conn:
            self._conn.executemany(
                "INSERT OR REPLACE INTO series (key, date, value) VALUES (?, ?, ?)", rows)

    def series(self, key: str, since: str | None = None) -> list[tuple[str, float]]:
        sql, args = "SELECT date, value FROM series WHERE key = ?", [key]
        if since:
            sql += " AND date >= ?"
            args.append(since)
        with self._lock:
            return self._conn.execute(sql + " ORDER BY date", args).fetchall()

    def dates(self, key: str) -> set[str]:
        with self._lock:
            return {r[0] for r in self._conn.execute(
                "SELECT date FROM series WHERE key = ?", (key,))}

    def has(self, key: str) -> bool:
        with self._lock:
            return self._conn.execute(
                "SELECT 1 FROM series WHERE key = ? LIMIT 1", (key,)).fetchone() is not None

    def record(self, source: str, when: datetime, error: str | None = None) -> None:
        stamp = when.isoformat(timespec="seconds")
        with self._lock, self._conn:
            self._conn.execute(
                "INSERT OR IGNORE INTO fetch_status (source) VALUES (?)", (source,))
            if error is None:
                self._conn.execute(
                    "UPDATE fetch_status SET last_success = ?, last_attempt = ?, last_error = NULL"
                    " WHERE source = ?", (stamp, stamp, source))
            else:
                self._conn.execute(
                    "UPDATE fetch_status SET last_attempt = ?, last_error = ? WHERE source = ?",
                    (stamp, error[:300], source))

    def status(self, source: str) -> dict:
        with self._lock:
            row = self._conn.execute(
                "SELECT last_success, last_attempt, last_error FROM fetch_status WHERE source = ?",
                (source,)).fetchone()
        if not row:
            return {"last_success": None, "last_attempt": None, "last_error": None}
        return dict(zip(("last_success", "last_attempt", "last_error"), row))
