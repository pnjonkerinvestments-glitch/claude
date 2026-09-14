"""Polygon.io als databron (officieel gedocumenteerde API, betaald abonnement).

Eén snapshot-call levert alle Amerikaanse tickers tegelijk. Tijdens de premarket
staat de reguliere dagbar nog op nul; de laatste koers komt dan uit de minuutbar
of de laatste trade.
"""

from __future__ import annotations

import logging

from ..httpclient import request_json
from ..models import Mover
from .base import Provider

log = logging.getLogger(__name__)

SNAPSHOT_URL = "https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers"


class PolygonProvider(Provider):
    name = "polygon"

    def fetch(self) -> list[Mover]:
        data = request_json(
            f"{SNAPSHOT_URL}?apiKey={self.config.polygon_api_key}",
            timeout=self.config.http_timeout,
        )
        tickers = data.get("tickers") or [] if isinstance(data, dict) else []
        log.info("Polygon-snapshot gaf %d tickers terug", len(tickers))
        return [m for m in (self._parse_ticker(t) for t in tickers) if m is not None]

    @staticmethod
    def _parse_ticker(entry: dict) -> Mover | None:
        prev_close = (entry.get("prevDay") or {}).get("c") or 0.0
        if not prev_close:
            return None

        day = entry.get("day") or {}
        minute = entry.get("min") or {}
        last_trade = entry.get("lastTrade") or {}
        # Volgorde van vers naar oud; day.c is 0 tot de reguliere sessie begint.
        price = minute.get("c") or last_trade.get("p") or day.get("c") or 0.0
        if not price:
            return None

        volume = int(day.get("v") or minute.get("av") or 0)
        return Mover(
            symbol=entry.get("ticker", ""),
            exchange="",
            name="",
            price=float(price),
            prev_close=float(prev_close),
            change_pct=(float(price) / float(prev_close) - 1.0) * 100.0,
            volume=volume,
        )
