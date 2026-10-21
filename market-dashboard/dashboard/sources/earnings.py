"""Next earnings report of a US company and its expected release time (Yahoo Finance)."""

from __future__ import annotations

import math
from collections import Counter

import pandas as pd
import yfinance as yf

NY = "America/New_York"


def _num(x) -> float | None:
    try:
        x = float(x)
    except (TypeError, ValueError):
        return None
    return None if math.isnan(x) else x


def session(t: pd.Timestamp) -> str:
    """BMO before the US open (9:30 New York), AMC from the close (16:00), DMH in between."""
    minutes = t.hour * 60 + t.minute
    return "BMO" if minutes < 9 * 60 + 30 else "AMC" if minutes >= 16 * 60 else "DMH"


PLACEHOLDERS = {(7, 0), (8, 0), (8, 30), (15, 0)}   # times Yahoo uses before a time is announced


def is_placeholder(t: pd.Timestamp) -> bool:
    return (t.hour, t.minute) in PLACEHOLDERS


def expected_release(upcoming: pd.Timestamp, past: list[pd.Timestamp]) -> tuple[pd.Timestamp | None, str]:
    """Best estimate of the release moment (New York time) and where it comes from.

    Companies keep the same release slot quarter after quarter, and Yahoo's time for an
    upcoming report is often a placeholder. So: the usual time of the last 4 reports when at
    least 3 agree; otherwise Yahoo's time unless it is a placeholder; otherwise the time of
    the most recent report. Yahoo rounds past times to the hour.
    """
    upcoming = upcoming.tz_convert(NY)
    recent = [p.tz_convert(NY) for p in past[:4]]
    at = lambda hour, minute: upcoming.replace(hour=hour, minute=minute)
    if recent:
        (hour, minute), count = Counter((p.hour, p.minute) for p in recent).most_common(1)[0]
        if count >= 3:
            return at(hour, minute), f"usual time ({count} of last {len(recent)} reports)"
    if not is_placeholder(upcoming):
        return upcoming, "time from Yahoo"
    if recent:
        return at(recent[0].hour, recent[0].minute), "same time as last report"
    return None, "time not known yet"


def next_report(ticker: str, now: pd.Timestamp) -> dict | None:
    """Upcoming report of `ticker`: date, expected release time, EPS estimate, past report times."""
    df = yf.Ticker(ticker).get_earnings_dates(limit=12)
    if df is None or df.empty:
        return None
    df = df.sort_index()
    reported = df["Reported EPS"].notna()
    past = list(df.index[reported][::-1])
    upcoming = df[(~reported) & (df.index >= now - pd.Timedelta(hours=12))]
    if upcoming.empty:
        return None
    when = upcoming.index[0]
    release, basis = expected_release(when, past)
    return {"symbol": ticker, "date_ny": when.tz_convert(NY).date().isoformat(),
            "release_utc": release.tz_convert("UTC").isoformat() if release is not None else None,
            "session": session(release if release is not None else when.tz_convert(NY)),
            "basis": basis, "eps_estimate": _num(upcoming.iloc[0].get("EPS Estimate")),
            "past_utc": [p.tz_convert("UTC").isoformat() for p in past[:4]]}


def market_cap(ticker: str) -> float | None:
    try:
        return _num(yf.Ticker(ticker).fast_info["market_cap"])
    except Exception:
        return None
