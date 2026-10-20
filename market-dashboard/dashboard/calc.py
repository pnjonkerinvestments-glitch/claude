"""Pure calculations behind the dashboard. No I/O here, so everything is unit-testable."""

from __future__ import annotations

import math
from dataclasses import dataclass, field

GREEN, ORANGE, RED, NODATA = "green", "orange", "red", "nodata"
SCORES = {GREEN: 1, ORANGE: 0, RED: -1}


def sma(values: list[float], days: int) -> float | None:
    """Simple moving average of the last `days` values, or None with too little history."""
    if days <= 0 or len(values) < days:
        return None
    return sum(values[-days:]) / days


def rolling_mean(values: list[float], days: int) -> list[float | None]:
    """Moving average at each position (None until `days` values are available)."""
    out: list[float | None] = []
    total = 0.0
    for i, v in enumerate(values):
        total += v
        if i >= days:
            total -= values[i - days]
        out.append(total / days if i >= days - 1 else None)
    return out


def percentile_rank(history: list[float], value: float) -> float | None:
    """Share of `history` at or below `value`, in percent (0-100)."""
    if not history:
        return None
    return 100.0 * sum(1 for h in history if h <= value) / len(history)


def cot_index(net_positions: list[float]) -> float | None:
    """COT index: where the latest net position sits between the window's min and max (0-100)."""
    if not net_positions:
        return None
    lo, hi, last = min(net_positions), max(net_positions), net_positions[-1]
    if hi == lo:
        return 50.0
    return 100.0 * (last - lo) / (hi - lo)


def expected_move(price: float, vol_index: float, trading_days: int = 252) -> float:
    """One-day expected move in points: price x (vol / 100) / sqrt(trading days)."""
    return price * (vol_index / 100.0) / math.sqrt(trading_days)


def ma_position(closes: list[float], days_list: list[int]) -> dict[int, bool | None]:
    """For each MA length: is the latest close above that moving average (None = too little history)."""
    out: dict[int, bool | None] = {}
    for d in days_list:
        avg = sma(closes, d)
        out[d] = None if avg is None or not closes else closes[-1] > avg
    return out


def breadth(component_closes: dict[str, list[float]], days: int) -> tuple[float | None, int]:
    """% of components whose latest close is above their own `days`-day average.

    Components without enough history are left out. Returns (percent, number counted).
    """
    flags = [closes[-1] > sma(closes, days) for closes in component_closes.values()
             if closes and sma(closes, days) is not None]
    if not flags:
        return None, 0
    return 100.0 * sum(flags) / len(flags), len(flags)


# --- indicator colouring ----------------------------------------------------------

@dataclass
class Indicator:
    key: str
    label: str
    color: str
    value: str
    reason: str
    group: str = ""


def color_band(value: float, green_below: float, red_above: float) -> str:
    """Lower is better: green below the first threshold, red above the second."""
    if value < green_below:
        return GREEN
    if value > red_above:
        return RED
    return ORANGE


def trend_color(above_count: int, green_min: int, orange_min: int) -> str:
    if above_count >= green_min:
        return GREEN
    if above_count >= orange_min:
        return ORANGE
    return RED


def breadth_color(pct50: float, pct200: float, green_min: float, red_max: float) -> str:
    if pct50 >= green_min and pct200 >= green_min:
        return GREEN
    if pct50 <= red_max and pct200 <= red_max:
        return RED
    return ORANGE


def term_structure_color(vix: float, vix3m: float, green_below: float, red_above: float) -> str:
    ratio = vix / vix3m
    if ratio < green_below:
        return GREEN
    if ratio >= red_above:
        return RED
    return ORANGE


def credit_color(level: float, change_bp: float, cfg: dict) -> str:
    if level >= cfg["red_min_level"] or change_bp >= cfg["red_min_change_bp"]:
        return RED
    if level <= cfg["green_max_level"] and change_bp <= cfg["green_max_change_bp"]:
        return GREEN
    return ORANGE


def curve_color(spread: float, green_above: float, red_below: float) -> str:
    if spread > green_above:
        return GREEN
    if spread < red_below:
        return RED
    return ORANGE


@dataclass
class Verdict:
    label: str            # "Risk-on", "Neutral", "Risk-off" or "No data"
    score: int
    counted: int
    pct: float | None
    counts: dict = field(default_factory=dict)
    explanation: str = ""


def regime_verdict(colors: list[str], risk_on_min_pct: float, risk_off_max_pct: float) -> Verdict:
    """Transparent tally: green +1, orange 0, red -1; indicators without data are skipped."""
    counts = {c: colors.count(c) for c in (GREEN, ORANGE, RED, NODATA)}
    counted = counts[GREEN] + counts[ORANGE] + counts[RED]
    if counted == 0:
        return Verdict("No data", 0, 0, None, counts, "No indicator has data yet.")
    score = counts[GREEN] - counts[RED]
    pct = 100.0 * score / counted
    if pct >= risk_on_min_pct:
        label = "Risk-on"
    elif pct <= risk_off_max_pct:
        label = "Risk-off"
    else:
        label = "Neutral"
    explanation = (
        f"{counts[GREEN]} green (+1), {counts[ORANGE]} orange (0), {counts[RED]} red (−1)"
        f" → score {score:+d} of {counted} = {pct:+.0f}%. "
        f"Risk-on at ≥ {risk_on_min_pct:+g}%, risk-off at ≤ {risk_off_max_pct:+g}%.".replace("-", "−")
    )
    if counts[NODATA]:
        explanation += f" {counts[NODATA]} indicator(s) without data not counted."
    return Verdict(label, score, counted, pct, counts, explanation)
