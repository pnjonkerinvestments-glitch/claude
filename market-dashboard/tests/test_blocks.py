"""Block assembly against a temporary SQLite cache, including the failed-source fallback."""

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
    for members in cfg["breadth_components"].values():
        for t in members:
            s.upsert(f"px:{t}", rising)
    for sym, level in (("VIX9D", 13.0), ("VIX", 15.0), ("VIX3M", 17.0)):
        s.upsert(f"cboe:{sym}", {d: level for d in days})
    s.upsert("pc:equity", {d: 0.6 + (i % 10) / 100 for i, d in enumerate(days)})
    s.upsert("pc:index", {d: 1.1 for d in days})
    s.upsert("fred:BAMLH0A0HYM2", {d: 3.0 for d in days})
    s.upsert("fred:T10Y2Y", {d: 0.6 for d in days})
    s.upsert("fred:DGS10", {days[-2]: 4.10, days[-1]: 4.15})
    weeks = [d for d in days if date.fromisoformat(d).weekday() == 1]
    s.upsert("cot:13874A:lev", {d: -1000 * i for i, d in enumerate(weeks)})
    s.upsert("cot:13874A:am", {d: 500 * i for i, d in enumerate(weeks)})
    for t in ("HYG", "IEF", "HG=F", "GC=F", "RSP", "SPY"):
        s.upsert(f"px:{t}", rising)
    return s


def test_regime_block_all_green_is_risk_on(store, cfg):
    b = blocks.regime_block(store, cfg)
    colors = {i["key"]: i["color"] for i in b["indicators"]}
    assert colors["trend_SPX"] == "green"
    assert colors["breadth_DAX"] == "green"
    assert colors["vix_term"] == "green"
    assert colors["vstoxx"] == "nodata"
    assert b["verdict"]["label"] == "Risk-on"
    assert all(i["reason"] for i in b["indicators"])


def test_today_block_expected_move(store, cfg):
    b = blocks.today_block(store, cfg)
    spx, sx5e = b["expected_moves"]
    assert spx["available"] and spx["points"] == pytest.approx(399 * 0.15 / 252 ** 0.5)
    assert not sx5e["available"]


def test_rates_and_positioning(store, cfg):
    rates = {r["id"]: r for r in blocks.rates_block(store, cfg)["rows"]}
    assert rates["DGS10"]["change_bp"] == pytest.approx(5)
    assert not rates["DGS2"]["available"]
    pos = blocks.positioning_block(store, cfg)
    es = pos["contracts"][0]
    assert es["lev"]["cot_index"] == 0 and es["am"]["cot_index"] == 100
    assert es["lev"]["change"] == -1000
    assert date.fromisoformat(pos["report_date"]).weekday() == 1
    assert len(pos["vix_term"]["dates"]) == cfg["cboe"]["chart_days"]


def test_failed_source_keeps_last_values_with_warning(store, cfg):
    store.record("fred", datetime(2026, 10, 19, 18, 0, tzinfo=cfg["tz"]))
    store.record("fred", datetime(2026, 10, 20, 18, 0, tzinfo=cfg["tz"]), "HTTPError: 500")
    b = blocks.rates_block(store, cfg)
    assert "refresh failed" in b["warnings"][0] and "HTTPError: 500" in b["warnings"][0]
    assert b["updated_at"].startswith("Mon 19 Oct")
    assert any(r["available"] for r in b["rows"])


def test_api_serves_page_and_data(store, cfg):
    with TestClient(create_app(cfg, start_jobs=False)) as client:
        assert client.get("/").status_code == 200
        data = client.get("/api/dashboard").json()
        assert set(data) >= {"regime", "today", "rates", "positioning", "riskonoff"}
        assert client.get("/api/widgets").json()["heatmap"]["us"] == "SPX500"
