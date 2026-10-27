"""Daily prices from Yahoo Finance via yfinance."""

from __future__ import annotations

import math

import pandas as pd
import yfinance as yf

FIELDS = ("Open", "High", "Low", "Close", "Volume")


def _clean(v) -> float | None:
    try:
        v = float(v)
    except (TypeError, ValueError):
        return None
    return None if math.isnan(v) or math.isinf(v) else v


def download_ohlcv(tickers: list[str], period: str | None = None, start: str | None = None,
                   chunk: int = 200) -> dict[str, pd.DataFrame]:
    """-> {ticker: DataFrame indexed by date with open/high/low/close/volume}; tickers without
    data are absent. Downloads in chunks so one call never asks Yahoo for hundreds at once."""
    out: dict[str, pd.DataFrame] = {}
    for i in range(0, len(tickers), chunk):
        part = tickers[i:i + chunk]
        frame = yf.download(part, period=None if start else period, start=start, interval="1d",
                            auto_adjust=True, group_by="ticker", progress=False, threads=True)
        if frame is None or frame.empty:
            continue
        for t in part:
            try:
                sub = frame[t] if getattr(frame.columns, "nlevels", 1) > 1 else frame
                sub = sub[[f for f in FIELDS if f in sub.columns]]
            except KeyError:
                continue
            sub = sub.dropna(subset=["Close"])
            if sub.empty:
                continue
            sub.columns = [c.lower() for c in sub.columns]
            sub.index = pd.to_datetime(sub.index).tz_localize(None).normalize()
            out[t] = sub
    return out


def download_closes(tickers: list[str], period: str) -> dict[str, dict[str, float]]:
    """-> {ticker: {iso date: close}}; tickers without data are absent."""
    return {t: {d.date().isoformat(): float(v) for d, v in df["close"].items() if _clean(v) is not None}
            for t, df in download_ohlcv(tickers, period).items()}


def frame_points(df: pd.DataFrame) -> dict[str, dict[str, float]]:
    """DataFrame from download_ohlcv -> {field: {iso date: value}} without missing values."""
    out = {}
    for field in ("open", "high", "low", "close", "volume"):
        if field not in df:
            continue
        out[field] = {d.date().isoformat(): v for d, raw in df[field].items()
                      if (v := _clean(raw)) is not None}
    return out
