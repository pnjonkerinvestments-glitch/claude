import numpy as np
import pandas as pd
import pytest

from dashboard import activity, cards, derived
from dashboard.sources import screener


def days(n, start="2025-01-01"):
    return pd.bdate_range(start, periods=n)


def test_fear_greed_scores_each_signal_against_its_past_year():
    idx = days(400)
    rising = pd.Series(100 * 1.002 ** np.arange(400), index=idx)   # steady trend: ratios stay constant
    calm = pd.Series(np.linspace(30, 12, 400), index=idx)       # VIX falling
    fg = derived.fear_greed(rising, calm, pd.Series(np.linspace(20, 80, 400), index=idx),
                            rising, pd.Series(100.0, index=idx), pd.Series(np.linspace(6, 3, 400), index=idx))
    last = fg.dropna().iloc[-1]
    assert last["breadth"] == 100                   # highest breadth of the year
    assert last["junk"] >= 99 and last["volatility"] >= 99   # tightest spread, calmest VIX: greed
    assert 0 <= last["score"] <= 100
    assert last["score"] > 75                       # every signal at its greediest
    assert list(fg.columns) == [*derived.FEAR_GREED_PARTS, "score"]


@pytest.mark.parametrize("score,label", [(10, "Extreme fear"), (29, "Fear"), (50, "Neutral"), (60, "Greed"), (90, "Extreme greed")])
def test_fear_greed_label(score, label):
    assert derived.fear_greed_label(score) == label


def test_monthly_returns_leave_out_the_running_month():
    idx = pd.bdate_range("2025-01-01", "2025-04-15")
    close = pd.Series(np.arange(len(idx), dtype=float) + 100, index=idx)
    rets = derived.monthly_returns(close, pd.Timestamp("2025-04-15"))
    assert [d.month for d in rets.index] == [2, 3]  # January has no prior month, April is running


def test_seasonality_average_median_and_up_share():
    idx = pd.to_datetime(["2023-10-31", "2024-10-31", "2025-10-31", "2025-09-30"])
    rets = pd.Series([2.0, -1.0, 5.0, 1.0], index=idx)
    s = derived.seasonality(rets, 10, pd.Timestamp("2026-10-21"))
    assert s[10]["avg"] == pytest.approx(2.0)
    assert s[10]["median"] == pytest.approx(2.0)
    assert s[10]["up"] == pytest.approx(200 / 3)
    assert s[10]["n"] == 3 and s[1]["n"] == 0 and s[1]["avg"] is None


def test_short_share_uses_dollar_volume():
    idx = days(2)
    closes = pd.DataFrame({"SPY": [500.0, 500.0], "SH": [40.0, 40.0]}, index=idx)
    vols = pd.DataFrame({"SPY": [100.0, 100.0], "SH": [125.0, 625.0]}, index=idx)
    share = derived.short_share(closes, vols, ["SH"])
    assert list(share.round(2)) == [pytest.approx(9.09, abs=0.01), pytest.approx(33.33, abs=0.01)]


def test_sma_tap():
    idx = days(201)
    close = pd.Series(100.0, index=idx)
    bars = pd.DataFrame({"close": close, "high": close + 1, "low": close - 1})
    assert derived.sma_tap(bars, 200).iloc[-1]
    bars.loc[idx[-1], ["low", "high", "close"]] = [102, 104, 103]
    assert not derived.sma_tap(bars, 200).iloc[-1]
    assert not derived.sma_tap(bars, 200).iloc[10]   # no 200-day average yet


def test_record_volume_skips_listing_days_and_the_session_itself():
    vol = pd.Series([900, 800, 10, 10, 10, 10, 50, 40, 999], index=days(9), dtype=float)
    assert derived.record_volume(vol, ignore_first=2) == (50.0, days(9)[6].date().isoformat())
    assert derived.record_volume(vol.iloc[:3], ignore_first=5) is None


def test_weekly_bars():
    idx = days(10, "2026-10-05")    # Mon 5 Oct .. Fri 16 Oct
    b = pd.DataFrame({"open": range(10), "high": [x + 2 for x in range(10)], "low": [x - 1 for x in range(10)],
                      "close": [x + 1 for x in range(10)], "volume": [1.0] * 10}, index=idx, dtype=float)
    w = cards.weekly_bars(b)
    assert [d.date().isoformat() for d in w.index] == ["2026-10-09", "2026-10-16"]
    assert w.iloc[0].tolist() == [0, 6, -1, 5, 5]


def test_running_log_counts_sessions_per_name():
    book = {"2026-10-19": {"AAA": {"symbol": "AAA", "rel": 2.5}},
            "2026-10-20": {"AAA": {"symbol": "AAA", "rel": 3.1}, "BBB": {"symbol": "BBB", "rel": 2.0}}}
    log = cards.running_log(book, "rel")
    assert log["sessions"] == ["2026-10-19", "2026-10-20"]
    rows = {r["symbol"]: r for r in log["rows"]}
    assert rows["AAA"]["sessions"] == ["2026-10-19", "2026-10-20"] and rows["AAA"]["best"] == 3.1
    assert rows["BBB"]["sessions"] == ["2026-10-20"]


@pytest.mark.parametrize("now,session", [
    ("2026-10-21 10:00", "2026-10-21"),   # during the session
    ("2026-10-21 08:00", "2026-10-20"),   # before the open: yesterday's volume
    ("2026-10-24 12:00", "2026-10-23"),   # Saturday -> Friday
])
def test_us_session(now, session):
    assert activity.us_session(pd.Timestamp(now, tz="America/New_York")) == session


def test_unusual_volume_filter():
    quotes = [
        {"symbol": "AAA", "longName": "A", "regularMarketVolume": 300, "averageDailyVolume10Day": 100, "marketCap": 5e10},
        {"symbol": "BBB", "longName": "B", "regularMarketVolume": 150, "averageDailyVolume10Day": 100, "marketCap": 5e10},
        {"symbol": "AAA-PB", "longName": "A pref", "regularMarketVolume": 900, "averageDailyVolume10Day": 100},
    ]
    rows = screener.unusual(quotes, 2.0, "stock")
    assert [(r["symbol"], r["rel"]) for r in rows] == [("AAA", 3.0)]


def test_scanner_rows_and_payload():
    body = {"data": [{"s": "OMXSTO:ISOFOL", "d": ["ISOFOL", "Isofol Medical AB", "Sweden", 1.11, "SEK", 25.5,
                                                   2.9e7, 7.3e5]}], "totalCount": 1}
    rows = screener.parse_scanner(body)
    assert rows[0]["ticker"] == "ISOFOL" and rows[0]["day"] == 25.5 and rows[0]["currency"] == "SEK"
    payload = screener.eu_smallcap_payload({"min_change_pct": 10, "max_market_cap_usd": 1e9, "min_traded_usd": 1e5,
                                            "markets": ["sweden"]})
    assert payload["price_conversion"] == {"to_currency": "usd"}
    assert {"left": "change", "operation": "egreater", "right": 10} in payload["filter"]


def test_occ_csv_sums_all_roots_account_types_and_exchanges():
    from dashboard.sources import occ
    text = ("quantity,underlying,symbol,actype,porc,exchange,actdate\n"
            "100,SPY,SPY,C,P,CBOE,10/19/2026,\n50,SPY,SPY,M,P,AMEX,10/19/2026,\n"
            "7,SPY,2SPY,F,P,CBOE,10/19/2026,\n30,SPY,SPY,C,C,CBOE,10/19/2026,\n5,SPY,SPY,C,C,ISE,10/20/2026,\n")
    assert occ.parse(text) == {"2026-10-19": {"calls": 30, "puts": 157}, "2026-10-20": {"calls": 5, "puts": 0}}


def test_volume_stats_rank_and_average():
    s = pd.Series([10.0] * 50 + [30.0, 20.0], index=days(52))
    st = cards.volume_stats(s)
    assert st["rank"] == 2 and st["count"] == 52 and st["high"] == 30
    assert st["vs50"] == pytest.approx(20 / ((49 * 10 + 30) / 50))


def test_etf_put_call_comes_from_occ(tmp_path):
    from dashboard import blocks
    from dashboard.db import Store
    store = Store(str(tmp_path / "t.sqlite"))
    store.upsert("occ:QQQ:puts", {"2026-10-19": 300.0, "2026-10-20": 100.0})
    store.upsert("occ:QQQ:calls", {"2026-10-19": 200.0, "2026-10-20": 0.0})
    qqq = next(p for p in blocks.put_call_series(store, {}) if p["key"] == "qqq")
    assert qqq["source"] == "OCC" and qqq["dates"] == ["2026-10-19"] and qqq["values"] == [1.5]
