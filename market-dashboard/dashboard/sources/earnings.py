"""Upcoming US earnings (Yahoo Finance calendar) limited to US companies above a market cap."""

from __future__ import annotations

import math

import pandas as pd
import yfinance as yf
from yfinance import EquityQuery

US_EXCHANGES = ("NMS", "NYQ", "NGM", "NCM", "ASE")   # Nasdaq (3 tiers), NYSE, NYSE American
TIMING = {"BMO": "before open", "AMC": "after close", "TAS": "during session", "TNS": "time not set"}


def fetch_us_universe(min_cap: float) -> dict[str, dict]:
    """US-listed companies above `min_cap` that report in dollars.

    Yahoo's screener has no country field. Reporting currency removes nearly all foreign
    ADRs (TSMC, ASML, Novo Nordisk); a few foreign dollar reporters (Shell, Teva) stay in.
    """
    query = EquityQuery("and", [EquityQuery("eq", ["region", "us"]),
                                EquityQuery("gte", ["intradaymarketcap", min_cap]),
                                EquityQuery("is-in", ["exchange", *US_EXCHANGES])])
    out, offset = {}, 0
    while True:
        res = yf.screen(query, size=250, offset=offset, sortField="intradaymarketcap", sortAsc=False)
        quotes = res.get("quotes", [])
        for q in quotes:
            if q.get("financialCurrency") == "USD":
                out[q["symbol"]] = {"name": q.get("shortName") or q.get("longName") or q["symbol"],
                                    "market_cap": q.get("marketCap")}
        offset += 250
        if not quotes or offset >= res.get("total", 0):
            return out


def fetch_calendar(start: str, end: str, min_cap: float) -> pd.DataFrame:
    """All earnings events between start and end (end exclusive), paged 100 at a time."""
    frames, offset = [], 0
    while True:
        df = yf.Calendars().get_earnings_calendar(market_cap=min_cap, filter_most_active=False,
                                                  start=start, end=end, limit=100, offset=offset,
                                                  force=True)
        if df is None or df.empty:
            break
        frames.append(df)
        offset += 100
        if len(df) < 100:
            break
    return pd.concat(frames) if frames else pd.DataFrame()


def _num(x) -> float | None:
    try:
        x = float(x)
    except (TypeError, ValueError):
        return None
    return None if math.isnan(x) else x


def parse_calendar(df: pd.DataFrame, universe: dict[str, dict], min_cap: float) -> list[dict]:
    """Rows for US companies in `universe` with a market cap of at least `min_cap`."""
    rows = []
    for symbol, r in df.iterrows():
        if symbol not in universe:
            continue
        cap = r.get("Marketcap")
        cap = universe[symbol].get("market_cap") if cap is None or (isinstance(cap, float) and math.isnan(cap)) else cap
        if not cap or cap < min_cap:
            continue
        when = pd.Timestamp(r["Event Start Date"])
        eps = r.get("EPS Estimate")
        reported, surprise = r.get("Reported EPS"), r.get("Surprise(%)")
        rows.append({"symbol": symbol, "name": r.get("Company") or universe[symbol]["name"],
                     "market_cap": float(cap), "event": r.get("Event Name"),
                     "time_utc": when.tz_convert("UTC").isoformat() if when.tzinfo else when.isoformat(),
                     "timing": r.get("Timing") or "TNS",
                     "eps_estimate": _num(eps), "eps_reported": _num(reported),
                     "surprise_pct": _num(surprise)})
    rows.sort(key=lambda x: (x["time_utc"], -x["market_cap"]))
    return rows
