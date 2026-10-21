import numpy as np
import pandas as pd
import pytest

from dashboard import blocks, frames
from dashboard.sources import earnings


def _calendar():
    idx = pd.Index(["AAPL", "TSM", "TINY", "ETN"], name="Symbol")
    return pd.DataFrame({
        "Company": ["Apple Inc.", "TSMC", "Tiny Corp", "Eaton"],
        "Marketcap": [4e12, 1e12, 1.0e9, np.nan],
        "Event Name": ["Q4"] * 4,
        "Event Start Date": pd.to_datetime(["2026-11-02 20:00", "2026-11-02 12:30",
                                            "2026-11-02 12:30", "2026-11-03 12:30"], utc=True),
        "Timing": ["AMC", "BMO", "BMO", "BMO"],
        "EPS Estimate": [1.98, 2.0, np.nan, 3.1],
        "Reported EPS": [np.nan] * 4, "Surprise(%)": [np.nan] * 4}, index=idx)


def test_parse_calendar_keeps_us_companies_above_floor():
    universe = {"AAPL": {"name": "Apple", "market_cap": 4e12},
                "TINY": {"name": "Tiny", "market_cap": 1e9},
                "ETN": {"name": "Eaton", "market_cap": 1.3e11}}
    rows = earnings.parse_calendar(_calendar(), universe, 1.5e9)
    assert [r["symbol"] for r in rows] == ["AAPL", "ETN"]      # TSM: not in US list; TINY: too small
    assert rows[1]["market_cap"] == 1.3e11                      # missing cap taken from the screener
    assert rows[0]["eps_estimate"] == 1.98 and rows[0]["eps_reported"] is None


@pytest.mark.parametrize("utc,timing,date,text", [
    ("2026-10-21T12:30:00+00:00", "BMO", "2026-10-21", "same day, afternoon"),
    ("2026-10-21T20:00:00+00:00", "AMC", "2026-10-22", "Thu at the open"),
    ("2026-10-23T20:00:00+00:00", "AMC", "2026-10-26", "Mon at the open"),   # Friday -> Monday
    ("2026-10-21T04:00:00+00:00", "TNS", "2026-10-21", "time not announced"),
])
def test_eu_reaction(utc, timing, date, text):
    assert blocks.eu_reaction(utc, timing) == {"date": date, "text": text}


def test_weekly_correlation():
    idx = pd.bdate_range("2025-01-01", periods=400)
    a = pd.Series(100 * np.exp(np.cumsum(np.random.default_rng(3).normal(0, 0.01, 400))), index=idx)
    assert blocks.weekly_correlation(a, a * 1.7, 52) == pytest.approx(1)
    assert blocks.weekly_correlation(a, a.iloc[:20], 52) is None   # too little overlap


@pytest.mark.parametrize("ticker,tv", [("SU.PA", "EURONEXT:SU"), ("SAP.DE", "XETR:SAP"),
                                       ("NOVO-B.CO", "OMXCOP:NOVO_B"), ("BATS.L", "LSE:BATS")])
def test_eu_tv_symbol(ticker, tv):
    assert blocks.eu_tv_symbol(ticker) == tv


def test_peer_file_is_consistent():
    peers, names = frames.eu_peers()
    assert "ON" in peers and "ETN" in peers
    missing = {t for lst in peers.values() for t in lst if t not in names}
    assert not missing, f"add names for {missing}"
