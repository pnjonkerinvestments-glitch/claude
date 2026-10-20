"""Daily closes from Yahoo Finance via yfinance."""

from __future__ import annotations

import math

import yfinance as yf


def download_closes(tickers: list[str], period: str) -> dict[str, dict[str, float]]:
    """-> {ticker: {iso date: close}}; tickers without data are absent."""
    if not tickers:
        return {}
    frame = yf.download(tickers, period=period, interval="1d", auto_adjust=True,
                        group_by="ticker", progress=False, threads=True)
    out: dict[str, dict[str, float]] = {}
    for t in tickers:
        try:
            if getattr(frame.columns, "nlevels", 1) > 1:
                closes = frame[t]["Close"]
            else:
                closes = frame["Close"]
        except KeyError:
            continue
        points = {idx.date().isoformat(): float(v) for idx, v in closes.items()
                  if v is not None and not math.isnan(v)}
        if points:
            out[t] = points
    return out
