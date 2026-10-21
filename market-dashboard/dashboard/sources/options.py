"""Put/call ratios of ETF options from Yahoo's option chains (all expiries, one snapshot)."""

from __future__ import annotations

import yfinance as yf


def etf_put_call(ticker: str) -> dict[str, float] | None:
    """Put/call of the last session's volume and of open interest, summed over all expiries."""
    tk = yf.Ticker(ticker)
    totals = {"cv": 0.0, "pv": 0.0, "coi": 0.0, "poi": 0.0}
    for expiry in tk.options:
        chain = tk.option_chain(expiry)
        totals["cv"] += chain.calls["volume"].fillna(0).sum()
        totals["pv"] += chain.puts["volume"].fillna(0).sum()
        totals["coi"] += chain.calls["openInterest"].fillna(0).sum()
        totals["poi"] += chain.puts["openInterest"].fillna(0).sum()
    if not totals["cv"] or not totals["coi"]:
        return None
    return {"vol": totals["pv"] / totals["cv"], "oi": totals["poi"] / totals["coi"]}
