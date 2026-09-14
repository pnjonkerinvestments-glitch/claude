"""TradingView-screener als databron.

Gebruikt hetzelfde scanner-endpoint als de Stock Screener op tradingview.com.
Dat endpoint is niet officieel gedocumenteerd: het kan zonder aankondiging
wijzigen, en je hoort het niet vaker te bevragen dan de screener zelf
(een paar keer per minuut is ruim zat). Wil je een gegarandeerd stabiel
contract, gebruik dan PROVIDER=polygon.
"""

from __future__ import annotations

import logging

from ..httpclient import request_json
from ..models import Mover
from .base import Provider

log = logging.getLogger(__name__)

COLUMNS = [
    "name",
    "description",
    "exchange",
    "type",
    "close",
    "premarket_close",
    "premarket_change",
    "premarket_volume",
    "market_cap_basic",
]


class TradingViewProvider(Provider):
    name = "tradingview"

    def build_payload(self) -> dict:
        cfg = self.config
        # Vraag iets onder de drempel op, zodat het resultaat ook bruikbaar is
        # als een lokaal filter (prijs, volume) er nog iets af haalt.
        server_side_floor = max(cfg.threshold_pct - 10.0, 1.0)
        filters: list[dict] = [
            {"left": "premarket_change", "operation": "greater", "right": server_side_floor},
            {"left": "premarket_volume", "operation": "greater", "right": 0},
        ]
        if cfg.min_price > 0:
            filters.append({"left": "premarket_close", "operation": "egreater", "right": cfg.min_price})
        if cfg.max_price > 0:
            filters.append({"left": "premarket_close", "operation": "eless", "right": cfg.max_price})

        return {
            "filter": filters,
            "options": {"lang": "en"},
            "markets": ["america"],
            "symbols": {"query": {"types": []}, "tickers": []},
            "columns": COLUMNS,
            "sort": {"sortBy": "premarket_change", "sortOrder": "desc"},
            "range": [0, max(self.config.max_results * 4, 100)],
        }

    def fetch(self) -> list[Mover]:
        url = self.config.scanner_url
        if "label-product" not in url:
            url += ("&" if "?" in url else "?") + "label-product=screener-stock"

        data = request_json(
            url,
            method="POST",
            payload=self.build_payload(),
            headers={"Origin": "https://www.tradingview.com", "Referer": "https://www.tradingview.com/"},
            timeout=self.config.http_timeout,
        )
        rows = data.get("data") or [] if isinstance(data, dict) else []
        log.info("TradingView-scanner gaf %d rijen terug", len(rows))
        return [m for m in (self._parse_row(row) for row in rows) if m is not None]

    @staticmethod
    def _parse_row(row: dict) -> Mover | None:
        values = row.get("d") or []
        if len(values) < len(COLUMNS):
            return None
        field = dict(zip(COLUMNS, values))

        change_pct = field.get("premarket_change")
        premarket_price = field.get("premarket_close")
        prev_close = field.get("close")
        if change_pct is None or premarket_price is None or not prev_close:
            return None

        ticker = row.get("s", "")
        exchange = field.get("exchange") or (ticker.split(":")[0] if ":" in ticker else "")

        return Mover(
            symbol=field.get("name") or ticker.split(":")[-1],
            exchange=exchange,
            name=field.get("description") or "",
            price=float(premarket_price),
            prev_close=float(prev_close),
            change_pct=float(change_pct),
            volume=int(field.get("premarket_volume") or 0),
            market_cap=field.get("market_cap_basic"),
            instrument_type=(field.get("type") or "stock").lower(),
        )
