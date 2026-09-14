from __future__ import annotations

from ..config import Config, ConfigError
from ..models import Mover
from .polygon import PolygonProvider
from .tradingview import TradingViewProvider

PROVIDERS = {
    "tradingview": TradingViewProvider,
    "polygon": PolygonProvider,
}


def get_provider(config: Config):
    try:
        return PROVIDERS[config.provider](config)
    except KeyError as exc:
        raise ConfigError(f"Onbekende provider {config.provider!r}") from exc


__all__ = ["Mover", "get_provider", "PROVIDERS", "TradingViewProvider", "PolygonProvider"]
