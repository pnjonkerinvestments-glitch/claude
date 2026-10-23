import numpy as np
import pandas as pd
import pytest

from dashboard import derived


def _days(n):
    return pd.bdate_range("2025-01-01", periods=n)


def test_pct_above_ma_counts_only_members_with_history():
    idx = _days(60)
    up = pd.Series(np.arange(60, dtype=float), index=idx)
    frame = pd.DataFrame({"A": up, "B": up, "C": -up, "D": up.where(up > 30)})
    pct = derived.pct_above_ma(frame, 50)
    assert pct.iloc[-1] == pytest.approx(200 / 3)   # D has no 50-day average yet
    assert pct.iloc[:49].isna().all()


def test_pct_outperforming():
    idx = _days(30)
    index = pd.Series(np.linspace(100, 110, 30), index=idx)          # +10%
    frame = pd.DataFrame({"fast": np.linspace(100, 130, 30), "slow": np.linspace(100, 101, 30),
                          "flat": np.full(30, 100.0)}, index=idx)
    assert derived.pct_outperforming(frame, index, 20).iloc[-1] == pytest.approx(100 / 3)


def test_mcclellan_all_advancing_then_declining():
    idx = _days(120)
    rising = pd.DataFrame({c: np.arange(120, dtype=float) + i for i, c in enumerate("ABCD")}, index=idx)
    mc = derived.mcclellan(rising)
    assert (mc["net"] == 1000).all()
    assert mc["oscillator"].iloc[-1] == pytest.approx(0, abs=1e-6)   # constant breadth -> EMAs converge
    falling = rising.copy()
    falling.iloc[60:] = falling.iloc[60:].values[::-1] * 0 + np.arange(60, 0, -1)[:, None]
    mc2 = derived.mcclellan(falling)
    assert mc2["oscillator"].iloc[70] < 0 and mc2["summation"].iloc[-1] < mc2["summation"].iloc[59]


def test_rsi_bounds():
    idx = _days(60)
    assert derived.rsi(pd.Series(np.arange(60, dtype=float), index=idx)).iloc[-1] == pytest.approx(100)
    assert derived.rsi(pd.Series(np.arange(60, 0, -1, dtype=float), index=idx)).iloc[-1] == pytest.approx(0)
    zigzag = pd.Series([100 + (i % 2) for i in range(60)], index=idx, dtype=float)
    assert 40 < derived.rsi(zigzag).iloc[-1] < 60


def test_decline_streak():
    close = pd.Series([100, 101, 102, 100.5, 101, 101.5, 102])   # -1.47% on day 3
    assert list(derived.decline_streak(close)) == [1, 2, 3, 0, 1, 2, 3]


def test_weekly_returns():
    idx = pd.bdate_range("2026-01-05", periods=10)   # two full weeks Mon-Fri
    close = pd.Series([100] * 5 + [90] * 5, index=idx, dtype=float)
    assert derived.weekly_returns(close).iloc[-1] == pytest.approx(-10)


def test_rolling_corr_perfect():
    idx = _days(80)
    a = pd.Series(np.cumsum(np.random.default_rng(1).normal(size=80)), index=idx)
    assert derived.rolling_corr(a, a * 2 + 5, 60).iloc[-1] == pytest.approx(1)


def test_expanding_percentile_has_no_lookahead():
    s = pd.Series([1.0, 2, 3, 4, 0], index=_days(5))
    pct = derived.expanding_percentile(s, min_periods=1)
    assert list(pct) == [100, 100, 100, 100, 20]


def test_cot_percentiles():
    idx = pd.date_range("2015-01-06", periods=600, freq="W-TUE")
    net = pd.Series(np.linspace(-1000, 1000, 600), index=idx)
    oi = pd.Series(10000.0, index=idx)
    r = derived.cot_percentiles(net, oi)
    assert r["pct_all"] == 100 and r["pct_5y"] == 100 and r["pct_1y"] == 100
    assert r["net_oi_pct"] == pytest.approx(10)
    assert r["change"] == pytest.approx(2000 / 599)
    net2 = net.copy()
    net2.iloc[-1] = -5000
    assert derived.cot_percentiles(net2, oi)["pct_all"] == pytest.approx(100 / 600)


def test_vol_compression_detects_quiet_period():
    idx = pd.date_range("2020-01-01", periods=900)
    rng = np.random.default_rng(0)
    noise = np.concatenate([rng.normal(0, 0.04, 700), rng.normal(0, 0.002, 200)])
    close = pd.Series(100 * np.exp(np.cumsum(noise)), index=idx)
    vc = derived.vol_compression(close).iloc[-1]
    assert vc["rv_pct"] < 20 and vc["range_pct"] < 20


def test_performance_relative_and_ma():
    idx = _days(260)
    close = pd.Series(np.linspace(100, 200, 260), index=idx)
    bench = pd.Series(np.linspace(100, 100, 260), index=idx)
    p = derived.performance(close, bench)
    assert p["m1"] == pytest.approx(p["rel_m1"])
    assert p["vs50"] > 0 and p["vs200"] > 0 and p["rsi"] == pytest.approx(100)


def test_rolling_percentile_window():
    s = pd.Series([5.0, 1, 2, 3, 4], index=_days(5))
    pct = derived.rolling_percentile(s, 3, min_periods=1)
    assert list(pct) == [100, 50, 2 / 3 * 100, 100, 100]


@pytest.mark.parametrize("pct,label", [(95, "Extremely long"), (75, "Longer than usual"), (50, "Normal"),
                                       (20, "Shorter than usual"), (5, "Extremely short"), (None, "No data")])
def test_positioning_label(pct, label):
    assert derived.positioning_label(pct) == label
