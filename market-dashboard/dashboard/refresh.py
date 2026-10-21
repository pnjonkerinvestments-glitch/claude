"""Fetches every source into SQLite. Each source fails on its own; the rest keeps going."""

from __future__ import annotations

import logging
import threading
import time
from datetime import date, datetime, timedelta

import pandas as pd

from . import derived, frames
from .db import Store
from .sources import cboe, cftc, earnings, fred, prices
from .sources.http import client

log = logging.getLogger("dashboard.refresh")
_lock = threading.Lock()

DAILY_SOURCES = ("prices", "components", "breadth", "cboe_vix", "cboe_pc", "fred", "earnings")
WEEKLY_SOURCES = ("cftc",)


def price_tickers(cfg: dict) -> list[str]:
    """Every non-member ticker the page uses."""
    p = cfg["prices"]
    tickers = [i["ticker"] for i in p["indices"].values()]
    for table in ("us_etfs", "eu_etfs"):
        tickers.append(p[table]["benchmark"])
        tickers += [item[0] for item in p[table]["items"]]
    for group in ("commodities", "crypto", "asia", "dollar", "rates_futures"):
        tickers += [item["ticker"] for item in p[group]]
    tickers.append(p["volatility"]["move"])
    for r in p["ratios"].values():
        tickers += [r["numerator"], r["denominator"]]
    tickers += [a["price"] for a in cfg["cftc"]["assets"] if a.get("price")]
    tickers += cfg["signals"]["rsi_watch"]
    tickers += ["^VIX", "^VIX9D", "^VIX3M"]
    peers, _ = frames.eu_peers()
    tickers += list(peers) + [eu for lst in peers.values() for eu in lst]
    return list(dict.fromkeys(tickers))


def long_history_tickers(cfg: dict) -> set[str]:
    """Tickers fetched with their full history (multi-year and COT charts)."""
    return set(cfg["prices"]["long_history"]) | {
        a["price"] for a in cfg["cftc"]["assets"] if a.get("price")}


def component_tickers(cfg: dict) -> list[str]:
    return list(dict.fromkeys([t for t, _, _ in frames.sp500_members()] + frames.eu_members(cfg)))


def _store_prices(store: Store, cfg: dict, tickers: list[str]) -> list[str]:
    """Download closes (full history on first run) and return the tickers without data."""
    p = cfg["prices"]
    long = long_history_tickers(cfg)
    new = [t for t in tickers if not store.has(f"px:{t}")]
    known = [t for t in tickers if t not in new]
    data = prices.download_closes([t for t in new if t in long], p["long_history_period"])
    data.update(prices.download_closes([t for t in new if t not in long], p["history_period"]))
    data.update(prices.download_closes(known, p["update_period"]))
    for t, points in data.items():
        store.upsert(f"px:{t}", points)
    return [t for t in tickers if t not in data]


def refresh_prices(store: Store, cfg: dict) -> None:
    missing = _store_prices(store, cfg, price_tickers(cfg))
    if missing:
        raise RuntimeError(f"no data for {', '.join(missing)}")


def refresh_components(store: Store, cfg: dict) -> None:
    tickers = component_tickers(cfg)
    missing = _store_prices(store, cfg, tickers)
    if len(missing) > len(tickers) // 2:
        raise RuntimeError(f"no data for {len(missing)} of {len(tickers)} index members")
    if missing:
        log.warning("no data for index members: %s", ", ".join(missing))


def _store_series(store: Store, key: str, s: pd.Series) -> None:
    s = s.dropna()
    store.upsert(key, {d.date().isoformat(): float(v) for d, v in s.items()})


def refresh_breadth(store: Store, cfg: dict) -> None:
    """Breadth series from member closes, stored so the page does not recompute them."""
    b = cfg["breadth"]
    us = frames.frame(store, [t for t, _, _ in frames.sp500_members()])
    eu = frames.frame(store, frames.eu_members(cfg))
    spx = frames.price(store, cfg["prices"]["indices"]["SPX"]["ticker"])
    if us.empty or spx.empty:
        raise RuntimeError("no S&P 500 member prices yet")
    keep = b["chart_days"]
    for name, fr in (("US", us), ("EU", eu)):
        if fr.empty:
            continue
        _store_series(store, f"drv:breadth:{name}:above50", derived.pct_above_ma(fr, 50).iloc[-keep:])
        _store_series(store, f"drv:breadth:{name}:above200", derived.pct_above_ma(fr, 200).iloc[-keep:])
    _store_series(store, "drv:breadth:US:outperform",
                  derived.pct_outperforming(us, spx, b["outperform_days"]).iloc[-keep:])
    mc = derived.mcclellan(us, b["mcclellan_fast"], b["mcclellan_slow"])
    _store_series(store, "drv:breadth:US:mcclellan", mc["oscillator"].iloc[-keep:])
    _store_series(store, "drv:breadth:US:summation", mc["summation"].iloc[-keep:])


def refresh_cboe_vix(store: Store, cfg: dict) -> None:
    """CBOE's own history files; Yahoo's copy of the same index (^VIX etc.) if CBOE fails."""
    c = cfg["cboe"]
    for symbol in c["vix_symbols"]:
        try:
            points = cboe.fetch_index_history(c["index_history_url"], symbol)
        except Exception as exc:
            log.warning("CBOE %s failed (%s); using Yahoo ^%s", symbol, exc, symbol)
            points = dict(store.series(f"px:^{symbol}"))
        if not points:
            raise RuntimeError(f"no {symbol} data from CBOE or Yahoo")
        store.upsert(f"cboe:{symbol}", points)


def refresh_cboe_pc(store: Store, cfg: dict, today: date) -> None:
    c = cfg["cboe"]
    stored = store.dates("pc:equity")
    start = (max(date.fromisoformat(max(stored)) + timedelta(days=1),
                 today - timedelta(days=14)) if stored
             else today - timedelta(days=c["put_call_history_days"]))
    with client() as http:
        day = start
        while day <= today:
            if day.weekday() < 5 and day.isoformat() not in stored:
                ratios = cboe.fetch_put_call(c["put_call_url"], day.isoformat(), http)
                if ratios:
                    for name, value in ratios.items():
                        store.upsert(f"pc:{name}", {day.isoformat(): value})
                time.sleep(0.15)
            day += timedelta(days=1)
    latest = max(store.dates("pc:equity"), default=None)
    if latest is None or (today - date.fromisoformat(latest)).days > 6:
        raise RuntimeError(f"no recent put/call data (latest: {latest or 'none'})")


def refresh_fred(store: Store, cfg: dict, today: date) -> None:
    """FRED API with the key from .env; without a key, FRED's public CSV download."""
    f = cfg["fred"]
    errors = []
    for series_id in f["series"]:
        start = (today - timedelta(days=f["history_days"] if not store.has(f"fred:{series_id}")
                                   else 30)).isoformat()
        try:
            if cfg["fred_api_key"]:
                points = fred.fetch_series(f["api_url"], cfg["fred_api_key"], series_id, start)
            else:
                points = fred.fetch_series_csv(f["csv_url"], series_id, start)
            store.upsert(f"fred:{series_id}", points)
        except Exception as exc:  # keep fetching the other series
            errors.append(f"{series_id}: {exc}")
    if errors:
        raise RuntimeError("; ".join(errors))


def refresh_cftc(store: Store, cfg: dict, today: date) -> None:
    c = cfg["cftc"]
    missing = []
    for dataset, url in c["datasets"].items():
        assets = [a for a in c["assets"] if a["dataset"] == dataset]
        if not assets:
            continue
        groups = cftc.DATASET_COHORTS[dataset]
        first = not all(store.has(f"cot:{a['key']}:g:{g}") for a in assets for g in groups)
        since = c["history_start"] if first else (today - timedelta(weeks=6)).isoformat()
        rows = cftc.fetch(url, dataset, [a["code"] for a in assets], since)
        parsed = cftc.parse_rows(rows, {a["code"]: a["cohort"] for a in assets})
        for a in assets:
            by_date = parsed.get(a["code"], {})
            store.upsert(f"cot:{a['key']}:net", {d: v["net"] for d, v in by_date.items()})
            store.upsert(f"cot:{a['key']}:oi", {d: v["oi"] for d, v in by_date.items()})
            for g in groups:
                store.upsert(f"cot:{a['key']}:g:{g}",
                             {d: v["groups"][g] for d, v in by_date.items() if g in v["groups"]})
            if not by_date and not store.has(f"cot:{a['key']}:net"):
                missing.append(f"{a['label']} ({a['code']})")
    if missing:
        raise RuntimeError(f"no COT rows for {', '.join(missing)}")


def refresh_earnings(store: Store, cfg: dict, today: date) -> None:
    """Upcoming earnings of US companies above the market-cap floor."""
    e = cfg["earnings"]
    universe = earnings.fetch_us_universe(e["min_market_cap"])
    if len(universe) < 500:
        raise RuntimeError(f"US company list looks incomplete ({len(universe)} companies)")
    end = today + timedelta(days=e["days_ahead"])
    df = earnings.fetch_calendar(today.isoformat(), end.isoformat(), e["min_market_cap"])
    rows = earnings.parse_calendar(df, universe, e["min_market_cap"])
    if not rows:
        raise RuntimeError("earnings calendar came back empty")
    store.put_json("earnings", {"fetched": today.isoformat(), "rows": rows})


def run_sources(store: Store, cfg: dict, sources: tuple[str, ...]) -> None:
    """Fetch the given sources one by one; record success or failure for each."""
    jobs = {
        "prices": lambda today: refresh_prices(store, cfg),
        "components": lambda today: refresh_components(store, cfg),
        "breadth": lambda today: refresh_breadth(store, cfg),
        "cboe_vix": lambda today: refresh_cboe_vix(store, cfg),
        "cboe_pc": lambda today: refresh_cboe_pc(store, cfg, today),
        "fred": lambda today: refresh_fred(store, cfg, today),
        "cftc": lambda today: refresh_cftc(store, cfg, today),
        "earnings": lambda today: refresh_earnings(store, cfg, today),
    }
    with _lock:
        for name in sources:
            now = datetime.now(cfg["tz"])
            log.info("refreshing %s", name)
            try:
                jobs[name](now.date())
                store.record(name, datetime.now(cfg["tz"]))
            except Exception as exc:
                log.warning("refresh of %s failed: %s", name, exc)
                store.record(name, datetime.now(cfg["tz"]), f"{type(exc).__name__}: {exc}")


def run_all(store: Store, cfg: dict) -> None:
    run_sources(store, cfg, DAILY_SOURCES + WEEKLY_SOURCES)
