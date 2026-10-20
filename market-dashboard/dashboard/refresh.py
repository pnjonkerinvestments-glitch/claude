"""Fetches every source into SQLite. Each source fails on its own; the rest keeps going."""

from __future__ import annotations

import logging
import threading
import time
from datetime import date, datetime, timedelta

from .db import Store
from .sources import cboe, cftc, fred, prices
from .sources.http import client

log = logging.getLogger("dashboard.refresh")
_lock = threading.Lock()

DAILY_SOURCES = ("prices", "components", "cboe_vix", "cboe_pc", "fred")
WEEKLY_SOURCES = ("cftc",)


def price_tickers(cfg: dict) -> list[str]:
    p = cfg["prices"]
    tickers = [i["ticker"] for i in p["indices"].values()]
    if p.get("vstoxx_ticker"):
        tickers.append(p["vstoxx_ticker"])
    for r in p["ratios"].values():
        tickers += [r["numerator"], r["denominator"]]
    return list(dict.fromkeys(tickers))


def component_tickers(cfg: dict) -> list[str]:
    seen: dict[str, None] = {}
    for members in cfg["breadth_components"].values():
        seen.update(dict.fromkeys(members))
    return list(seen)


def _store_prices(store: Store, cfg: dict, tickers: list[str]) -> list[str]:
    """Download closes (full history on first run) and return the tickers without data."""
    new = [t for t in tickers if not store.has(f"px:{t}")]
    known = [t for t in tickers if t not in new]
    data = prices.download_closes(new, cfg["prices"]["history_period"])
    data.update(prices.download_closes(known, cfg["prices"]["update_period"]))
    for t, points in data.items():
        store.upsert(f"px:{t}", points)
    return [t for t in tickers if t not in data]


def refresh_prices(store: Store, cfg: dict) -> None:
    vstoxx = cfg["prices"].get("vstoxx_ticker")
    missing = [t for t in _store_prices(store, cfg, price_tickers(cfg)) if t != vstoxx]
    if missing:
        raise RuntimeError(f"no data for {', '.join(missing)}")


def refresh_components(store: Store, cfg: dict) -> None:
    tickers = component_tickers(cfg)
    missing = _store_prices(store, cfg, tickers)
    if len(missing) > len(tickers) // 2:
        raise RuntimeError(f"no data for {len(missing)} of {len(tickers)} index members")
    if missing:
        log.warning("no data for index members: %s", ", ".join(missing))


def refresh_cboe_vix(store: Store, cfg: dict) -> None:
    """CBOE's own history files; Yahoo's copy of the same index (^VIX etc.) if CBOE fails."""
    c = cfg["cboe"]
    for symbol in c["vix_symbols"]:
        try:
            points = cboe.fetch_index_history(c["index_history_url"], symbol)
        except Exception as exc:
            log.warning("CBOE %s failed (%s); using Yahoo ^%s", symbol, exc, symbol)
            period = cfg["prices"]["update_period" if store.has(f"cboe:{symbol}") else "history_period"]
            points = prices.download_closes([f"^{symbol}"], period).get(f"^{symbol}", {})
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
    codes = list(c["contracts"])
    first = not all(store.has(f"cot:{code}:lev") for code in codes)
    since = today - timedelta(weeks=c["history_weeks"] if first else 6)
    parsed = cftc.parse_rows(cftc.fetch_tff(c["api_url"], codes, since.isoformat()))
    for code, by_date in parsed.items():
        store.upsert(f"cot:{code}:lev", {d: v["lev"] for d, v in by_date.items()})
        store.upsert(f"cot:{code}:am", {d: v["am"] for d, v in by_date.items()})
    missing = [code for code in codes if code not in parsed and not store.has(f"cot:{code}:lev")]
    if missing:
        raise RuntimeError(f"no COT rows for contract code(s) {', '.join(missing)}")


def run_sources(store: Store, cfg: dict, sources: tuple[str, ...]) -> None:
    """Fetch the given sources one by one; record success or failure for each."""
    jobs = {
        "prices": lambda today: refresh_prices(store, cfg),
        "components": lambda today: refresh_components(store, cfg),
        "cboe_vix": lambda today: refresh_cboe_vix(store, cfg),
        "cboe_pc": lambda today: refresh_cboe_pc(store, cfg, today),
        "fred": lambda today: refresh_fred(store, cfg, today),
        "cftc": lambda today: refresh_cftc(store, cfg, today),
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
