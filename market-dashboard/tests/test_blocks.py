"""Sections built from a temporary SQLite cache, including the failed-source fallback."""

from datetime import date, datetime, timedelta

import pytest
from fastapi.testclient import TestClient

from dashboard import blocks
from dashboard.config import load_config
from dashboard.db import Store
from dashboard.server import create_app


def _days(n, end=date(2026, 10, 19)):
    out, d = [], end
    while len(out) < n:
        if d.weekday() < 5:
            out.append(d.isoformat())
        d -= timedelta(days=1)
    return out[::-1]


@pytest.fixture
def cfg(tmp_path):
    c = load_config()
    c["database"] = str(tmp_path / "test.sqlite")
    c["fred_api_key"] = ""
    return c


@pytest.fixture
def store(cfg):
    s = Store(cfg["database"])
    days = _days(300)
    rising = {d: 100 + i for i, d in enumerate(days)}
    for idx in cfg["prices"]["indices"].values():
        s.upsert(f"px:{idx['ticker']}", rising)
    for t in ("SPY", "QQQ", "SMH", "RSP", "CL=F"):
        s.upsert(f"px:{t}", rising)
    s.upsert("drv:breadth:US:above50", {d: 70.0 for d in days[-50:]})
    s.upsert("drv:breadth:US:above200", {d: 65.0 for d in days[-50:]})
    s.upsert("drv:breadth:EU:above50", {d: 30.0 for d in days[-50:]})
    s.upsert("drv:breadth:EU:above200", {d: 35.0 for d in days[-50:]})
    for sym, level in (("VIX9D", 13.0), ("VIX", 15.0), ("VIX3M", 17.0)):
        s.upsert(f"cboe:{sym}", {d: level for d in days})
    s.upsert("pc:equity", {d: 0.6 + (i % 10) / 100 for i, d in enumerate(days)})
    s.upsert("fred:BAMLH0A0HYM2", {d: 3.0 for d in days})
    s.upsert("fred:T10Y2Y", {d: 0.6 for d in days})
    s.upsert("fred:DGS10", {days[-2]: 4.10, days[-1]: 4.15})
    weeks = [d for d in days if date.fromisoformat(d).weekday() == 1]
    s.upsert("cot:vix:net", {d: -1000.0 * i for i, d in enumerate(weeks)})
    s.upsert("cot:vix:oi", {d: 100000.0 for d in weeks})
    s.upsert("cot:spx:oi", {d: 1000000.0 for d in weeks})
    s.upsert("cot:spx:net", {d: 1000.0 * i for i, d in enumerate(weeks)})
    s.upsert("cot:spx:g:am", {d: 1000.0 * i for i, d in enumerate(weeks)})
    s.upsert("cot:spx:g:lf", {d: -1000.0 * i for i, d in enumerate(weeks)})
    s.upsert("cot:spx:g:dealer", {d: 0.0 for d in weeks})
    return s


def test_regime_tally(store, cfg):
    r = blocks.regime(store, cfg)
    colors = {i["key"]: i["color"] for i in r["indicators"]}
    assert colors["trend_SPX"] == "green"
    assert colors["breadth_US"] == "green" and colors["breadth_EU"] == "red"
    assert colors["vix_term"] == "green"
    assert r["verdict"]["counted"] == len(r["indicators"])
    assert all(i["reason"] for i in r["indicators"])


def test_signals_flag_cot_extreme(store, cfg):
    texts = [s["text"] for s in blocks.signals(store, cfg)]
    assert any(t.startswith("VIX: asset managers net/OI at the 2nd percentile") for t in texts)


def test_today_expected_move(store, cfg):
    m = blocks.today_section(store, cfg)["expected_moves"][0]
    assert m["points"] == pytest.approx(399 * 0.15 / 252 ** 0.5)


def test_positioning_and_cot_chart(store, cfg):
    pos = blocks.positioning_section(store, cfg)
    vix = next(r for r in pos["rows"] if r["key"] == "vix")
    weeks = len(store.series("cot:vix:net"))
    assert vix["pct_all"] == pytest.approx(100 / weeks)      # steadily falling: latest is the low
    assert vix["cohort_short"] == "AM"
    extremity = {r["key"]: min(r["pct_all"], 100 - r["pct_all"]) for r in pos["rows"] if r.get("pct_all") is not None}
    assert extremity[pos["default_key"]] == min(extremity.values())   # most extreme row is shown first
    assert pos["tv"]["spx"] == "CME_MINI:ES1!" and "Commitments of Traders" in pos["howto"]


def test_cot_detail(store, cfg):
    from dashboard import cards
    d = cards.cot_detail(store, cfg, "spx")
    assert d["available"] and d["order"][0] == "am"
    n = len(d["dates"])
    for g in d["groups"].values():
        assert len(g["net"]) == len(g["long"]) == len(g["short"]) == n


def test_chart_aligns_series():
    import pandas as pd
    a = pd.Series([1.0, 2.0], index=pd.to_datetime(["2026-01-01", "2026-01-02"]))
    b = pd.Series([5.0], index=pd.to_datetime(["2026-01-02"]))
    c = blocks.chart("x", "X", [blocks.panel([blocks.series_spec("a", a), blocks.series_spec("b", b)])])
    assert c["dates"] == ["2026-01-01", "2026-01-02"]
    assert c["panels"][0]["series"][1]["values"] == [None, 5.0]


def test_failed_source_keeps_last_values_with_warning(store, cfg):
    store.record("fred", datetime(2026, 10, 19, 18, 0, tzinfo=cfg["tz"]))
    store.record("fred", datetime(2026, 10, 20, 18, 0, tzinfo=cfg["tz"]), "HTTPError: 500")
    b = blocks.rates_section(store, cfg)
    assert any("refresh failed" in w and "HTTPError: 500" in w for w in b["warnings"])
    assert any(r["available"] for r in b["rows"])


def test_every_section_builds_and_api_serves(store, cfg):
    with TestClient(create_app(cfg, start_jobs=False)) as client:
        assert client.get("/").status_code == 200
        data = client.get("/api/dashboard").json()
        for name in blocks.BUILDERS:
            assert "error" not in data[name], (name, data[name].get("error"))
        assert client.get("/api/detail/cot/vix").json()["available"]
        assert client.get("/api/detail/cot/nope").status_code == 404
        assert client.get("/api/detail/streak/^GSPC").status_code == 404
        assert client.get("/api/detail/price/^GSPC").status_code == 200


def test_everything_has_an_explanation(store, cfg):
    data = blocks.dashboard(store, cfg)
    for name in blocks.BUILDERS:
        sec = data[name]
        assert sec.get("intro"), name
        for c in sec.get("charts", []):
            assert c.get("explain"), c["id"]
    for ind in data["summary"]["indicators"]:
        assert ind["meaning"], ind["key"]


def test_scheduler_has_morning_earnings_job(store, cfg):
    from dashboard.server import build_scheduler
    sched = build_scheduler(store, cfg)
    jobs = {j.id: j for j in sched.get_jobs()}
    assert {"daily-18:00", "daily-22:30", "morning", "cot", "intraday", "records"} <= set(jobs)
    assert "minute='*/30'" in str(jobs["intraday"].trigger) and "sat" in str(jobs["records"].trigger)
    trigger = str(jobs["morning"].trigger)
    assert "hour='8'" in trigger and "minute='0'" in trigger and "mon-fri" in trigger
    assert "earnings" in jobs["morning"].args[2]


def test_snapshot_is_a_static_page_with_its_data(store, cfg, tmp_path):
    import json
    from dashboard import snapshot
    files = snapshot.build(store, cfg, tmp_path / "snap")
    assert {"market-overview.html", "dashboard.json", "widgets.json", "detail-cot.json", "detail-price.json"} <= set(files)
    page = (tmp_path / "snap" / "market-overview.html").read_text()
    assert 'fetch("dashboard.json")' in page and "fetch(\"/api/" not in page and "/api/detail" not in page
    assert "lightweight-charts@" in page and "Snapshot of the live dashboard" in page
    cot = json.loads((tmp_path / "snap" / "detail-cot.json").read_text())
    assert set(cot) == {a["key"] for a in cfg["cftc"]["assets"]}
