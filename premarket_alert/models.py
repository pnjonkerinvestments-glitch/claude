from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Mover:
    """Een aandeel dat in de premarket beweegt."""

    symbol: str
    exchange: str
    name: str
    price: float
    prev_close: float
    change_pct: float
    volume: int
    market_cap: float | None = None
    instrument_type: str = "stock"

    @property
    def key(self) -> str:
        return f"{self.exchange}:{self.symbol}" if self.exchange else self.symbol

    @property
    def chart_url(self) -> str:
        tv = f"{self.exchange}%3A{self.symbol}" if self.exchange else self.symbol
        return f"https://www.tradingview.com/chart/?symbol={tv}"

    @property
    def dollar_volume(self) -> float:
        return self.price * self.volume
