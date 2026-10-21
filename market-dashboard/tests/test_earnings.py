import numpy as np
import pandas as pd
import pytest

from dashboard import blocks, frames
from dashboard.refresh import last_completed_session
from dashboard.sources import earnings

NY = "America/New_York"


def ny(s):
    return pd.Timestamp(s, tz=NY)


def test_usual_time_replaces_yahoo_placeholder():
    past = [ny("2026-07-21 06:00"), ny("2026-04-21 06:00"), ny("2026-01-28 06:00"), ny("2025-10-21 06:00")]
    t, basis = earnings.expected_release(ny("2026-10-21 08:00"), past)
    assert (t.hour, t.minute, t.date().isoformat()) == (6, 0, "2026-10-21")
    assert basis == "usual time (4 of last 4 reports)"


def test_inconsistent_history_uses_yahoo_time_when_real():
    past = [ny("2026-07-23 06:00"), ny("2026-04-28 16:00"), ny("2026-02-11 07:00"), ny("2025-10-23 06:00")]
    t, basis = earnings.expected_release(ny("2026-10-28 16:00"), past)
    assert t.hour == 16 and basis == "time from Yahoo"


def test_inconsistent_history_and_placeholder_uses_last_report():
    past = [ny("2026-07-28 07:00"), ny("2026-04-27 06:00"), ny("2026-02-19 07:00"), ny("2025-10-27 06:00")]
    t, basis = earnings.expected_release(ny("2026-11-05 07:00"), past)
    assert t.hour == 7 and basis == "same time as last report"
    assert earnings.expected_release(ny("2026-11-05 08:00"), []) == (None, "time not known yet")


def test_amsterdam_time_follows_both_daylight_saving_switches():
    # Europe switches on 25 Oct 2026, the US on 1 Nov: one week with a 5-hour gap.
    to_ams = lambda s: ny(s).tz_convert("Europe/Amsterdam").strftime("%H:%M")
    assert to_ams("2026-10-21 06:00") == "12:00"
    assert to_ams("2026-10-28 06:00") == "11:00"
    assert to_ams("2026-11-03 06:00") == "12:00"


@pytest.mark.parametrize("t,session", [("06:00", "BMO"), ("09:29", "BMO"), ("12:00", "DMH"), ("16:05", "AMC")])
def test_session(t, session):
    assert earnings.session(ny(f"2026-10-21 {t}")) == session


@pytest.mark.parametrize("release,session,date,text", [
    ("2026-10-21 12:00", "BMO", "2026-10-21", "same day from 12:00"),
    ("2026-10-21 07:30", "BMO", "2026-10-21", "same day from 09:00"),
    ("2026-10-21 22:00", "AMC", "2026-10-22", "Thu 09:00 (next open)"),
    ("2026-10-23 22:00", "AMC", "2026-10-26", "Mon 09:00 (next open)"),     # Friday evening -> Monday
])
def test_eu_reaction(release, session, date, text):
    t = pd.Timestamp(release, tz="Europe/Amsterdam")
    assert blocks.eu_reaction(t, session, date) == {"date": date, "text": text}


def test_eu_reaction_without_time():
    assert blocks.eu_reaction(None, "AMC", "2026-10-23")["date"] == "2026-10-26"
    assert blocks.eu_reaction(None, "BMO", "2026-10-21")["text"] == "same day (time unknown)"


def test_day_move():
    close = pd.Series([100.0, 110.0, 99.0], index=pd.to_datetime(["2026-07-20", "2026-07-21", "2026-07-22"]))
    assert blocks.day_move(close, "2026-07-21") == pytest.approx(10)
    assert blocks.day_move(close, "2026-07-20") is None      # no previous close
    assert blocks.day_move(close, "2026-07-23") is None      # missing day


def test_weekly_correlation():
    idx = pd.bdate_range("2025-01-01", periods=400)
    a = pd.Series(100 * np.exp(np.cumsum(np.random.default_rng(3).normal(0, 0.01, 400))), index=idx)
    assert blocks.weekly_correlation(a, a * 1.7, 52) == pytest.approx(1)
    assert blocks.weekly_correlation(a, a.iloc[:20], 52) is None


@pytest.mark.parametrize("ticker,tv", [("SU.PA", "EURONEXT:SU"), ("SAP.DE", "XETR:SAP"),
                                       ("NOVO-B.CO", "OMXCOP:NOVO_B"), ("BATS.L", "LSE:BATS")])
def test_eu_tv_symbol(ticker, tv):
    assert blocks.eu_tv_symbol(ticker) == tv


@pytest.mark.parametrize("now,session", [
    ("2026-10-24 12:00", "2026-10-23"),   # Saturday -> Friday
    ("2026-10-26 05:00", "2026-10-23"),   # Monday before the open -> Friday
    ("2026-10-21 17:00", "2026-10-21"),   # after the close -> today
    ("2026-10-21 12:00", None),           # during the session: volume incomplete
])
def test_last_completed_session(now, session):
    got = last_completed_session(pd.Timestamp(now))
    assert (got.date().isoformat() if got is not None else None) == session


def test_peer_file_is_consistent():
    own, names = frames.eu_peers()
    assert "ETN" in own and "MSCI" in own and own["MSCI"] == []
    assert "MSFT" not in own                                  # suggestions stay off by default
    every, _ = frames.eu_peers(include_extra=True)
    assert "ON" in every and "MSFT" in every
    missing = {t for lst in every.values() for t in lst if t not in names}
    assert not missing, f"add names for {missing}"
