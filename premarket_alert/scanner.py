from __future__ import annotations

import logging

from .config import Config
from .models import Mover

log = logging.getLogger(__name__)


def passes_filters(mover: Mover, config: Config) -> tuple[bool, str]:
    """Voldoet deze mover aan de drempels? Tweede waarde is de reden bij afwijzing."""
    if mover.change_pct < config.threshold_pct:
        return False, f"stijging {mover.change_pct:.1f}% < {config.threshold_pct:.1f}%"
    if mover.price < config.min_price:
        return False, f"koers {mover.price:.2f} < {config.min_price:.2f}"
    if config.max_price > 0 and mover.price > config.max_price:
        return False, f"koers {mover.price:.2f} > {config.max_price:.2f}"
    if mover.volume < config.min_premarket_volume:
        return False, f"volume {mover.volume} < {config.min_premarket_volume}"
    if mover.dollar_volume < config.min_dollar_volume:
        return False, f"omzet ${mover.dollar_volume:,.0f} < ${config.min_dollar_volume:,.0f}"
    if config.exchanges and mover.exchange and mover.exchange.upper() not in {e.upper() for e in config.exchanges}:
        return False, f"beurs {mover.exchange} niet in selectie"
    if config.instrument_types and mover.instrument_type not in config.instrument_types:
        return False, f"type {mover.instrument_type} niet in selectie"
    return True, ""


def select(movers: list[Mover], config: Config) -> list[Mover]:
    """Filter op de drempels en sorteer van hardste stijger naar minste."""
    hits: list[Mover] = []
    for mover in movers:
        ok, reason = passes_filters(mover, config)
        if ok:
            hits.append(mover)
        elif mover.change_pct >= config.threshold_pct:
            log.debug("%s afgewezen: %s", mover.symbol, reason)

    hits.sort(key=lambda m: m.change_pct, reverse=True)
    return hits[: config.max_results]
