"""Exact release times from SEC EDGAR: companies file their results press release as an 8-K
(item 2.02), usually within minutes of publishing it."""

from __future__ import annotations

import httpx
import pandas as pd

URL = "https://data.sec.gov/submissions/CIK{cik:010d}.json"


def user_agent(contact: str) -> str:
    """SEC asks automated tools to identify themselves; the contact comes from .env (SEC_CONTACT)."""
    return f"market-dashboard {contact}".strip() if contact else "market-dashboard research tool"


def results_filings(cik: int, contact: str = "") -> list[pd.Timestamp]:
    """Acceptance times (UTC) of 8-K filings with item 2.02 (results), newest first."""
    with httpx.Client(headers={"User-Agent": user_agent(contact)}, timeout=30) as http:
        resp = http.get(URL.format(cik=cik))
        resp.raise_for_status()
        recent = resp.json()["filings"]["recent"]
    return [pd.Timestamp(t) for form, items, t in
            zip(recent["form"], recent["items"], recent["acceptanceDateTime"])
            if form == "8-K" and "2.02" in items]


def pin_to_minutes(past_hours: list[pd.Timestamp], filings: list[pd.Timestamp]) -> list[pd.Timestamp]:
    """Exact times for past reports whose 8-K landed in the same hour as the release.

    Yahoo gives past release times rounded to the hour. Some companies file the 8-K a few
    minutes after the press release (then it pins the minute); others file hours later or the
    evening before (then it says nothing and is ignored). Times are rounded down to 5 minutes:
    a filing at 07:02 belongs to a 07:00 release.
    """
    exact = []
    for p in past_hours:
        p = p.tz_convert("America/New_York")
        for f in filings:
            f = f.tz_convert("America/New_York")
            if p <= f < p + pd.Timedelta(hours=1):
                exact.append(f.floor("5min"))
                break
    return exact
