"""Activity lists: unusual volume, 200-day taps, record volume and European small-cap movers.

Each list is stored as a JSON document for the latest session plus a running log of earlier
sessions, so names that showed up yesterday stay visible.
"""

from __future__ import annotations

import logging

import pandas as pd

from . import derived, frames
from .db import Store
from .sources import prices, screener

log = logging.getLogger("dashboard.activity")


def us_session(now: pd.Timestamp | None = None) -> str:
    """The US session that Yahoo's 'today' volume belongs to: today from the open on, the
    previous weekday before it."""
    ny = (now or pd.Timestamp.now(tz="America/New_York")).tz_convert("America/New_York")
    day = ny.normalize().tz_localize(None)
    if ny.weekday() >= 5:
        day -= pd.offsets.BDay(1)
    elif ny.hour * 60 + ny.minute < 9 * 60 + 30:
        day -= pd.offsets.BDay(1)
    return day.date().isoformat()


def merge_log(store: Store, key: str, session: str, rows: list[dict], sessions: int,
              rank: str | None = None) -> dict:
    """Add this session's rows to the running log {session: {symbol: row}} and keep the last
    `sessions` sessions. With `rank`, a symbol keeps its row with the highest value of that field."""
    book = store.get_json(key, {})
    today = book.get(session, {})
    for r in rows:
        old = today.get(r["symbol"])
        if old is None or (rank and (r.get(rank) or 0) >= (old.get(rank) or 0)) or not rank:
            today[r["symbol"]] = r
    book[session] = today
    book = {d: book[d] for d in sorted(book)[-sessions:]}
    store.put_json(key, book)
    return book


# --- unusual volume ---------------------------------------------------------------------

def refresh_unusual(store: Store, cfg: dict) -> None:
    u = cfg["activity"]["unusual_volume"]
    stocks = screener.unusual(screener.big_stocks(u["stock_min_market_cap"], u["exchanges"]),
                              u["min_rel_volume"], "stock")
    etfs = screener.unusual(screener.big_etfs(u["etf_min_assets"]), u["min_rel_volume"], "etf")
    if not stocks and not etfs:
        # Before the open Yahoo still shows yesterday's volume; an empty list then is fine,
        # an empty screener result during the session is not.
        log.info("no unusual volume found")
    session = us_session()
    now = pd.Timestamp.now(tz=cfg["tz"]).isoformat(timespec="minutes")
    store.put_json("unusual", {"session": session, "updated": now,
                               "stocks": stocks[: u["max_rows"]], "etfs": etfs[: u["max_rows"]]})
    merge_log(store, "unusual_log", session, stocks + etfs, cfg["activity"]["log_sessions"], "rel")


# --- universe for taps and record volume ------------------------------------------------

def tap_universe(cfg: dict) -> dict[str, tuple[str, str]]:
    """ticker -> (name, type) for S&P 500 members, the ETF tables and the futures list."""
    out = {t: (name, "Stock") for t, name, _ in frames.sp500_members()}
    p = cfg["prices"]
    for table in ("us_etfs", "country_etfs"):
        out.update({t: (name, "ETF") for t, name in p[table]["items"]})
    out.update({t: (name, "Futures") for t, name in p["tap_futures"]})
    return out


def refresh_intraday_bars(store: Store, cfg: dict) -> None:
    """Today's (partial) daily bars for the tap universe, so taps show up during the session."""
    tickers = list(tap_universe(cfg))
    from .refresh import store_ohlcv
    for t, df in prices.download_ohlcv(tickers, "5d").items():
        store_ohlcv(store, t, df)


def bars(store: Store, ticker: str, since: str | None = None) -> pd.DataFrame:
    cols = {}
    for field, prefix in (("open", "op"), ("high", "hi"), ("low", "lo"), ("close", "px"), ("volume", "vo")):
        rows = store.series(f"{prefix}:{ticker}", since)
        cols[field] = pd.Series([v for _, v in rows], index=pd.to_datetime([d for d, _ in rows]), dtype=float)
    return pd.DataFrame(cols).sort_index()


def refresh_taps(store: Store, cfg: dict) -> None:
    tol = cfg["activity"]["taps"]["tolerance_pct"]
    since = (pd.Timestamp.now() - pd.DateOffset(days=420)).date().isoformat()
    universe = tap_universe(cfg)
    latest: dict[str, pd.Timestamp] = {}
    found = []
    for t, (name, kind) in universe.items():
        b = bars(store, t, since).dropna(subset=["high", "low", "close"])
        if len(b) < 201:
            continue
        taps = derived.sma_tap(b, 200, tol)
        ma = b["close"].rolling(200).mean()
        day = b.index[-1]
        latest[kind] = max(latest.get(kind, day), day)
        if not taps.iloc[-1]:
            continue
        found.append({"symbol": t, "name": name, "kind": kind, "date": day.date().isoformat(),
                      "taps10": int(taps.iloc[-10:].sum()), "last": float(b["close"].iloc[-1]),
                      "sma200": float(ma.iloc[-1]),
                      "vs200": float(100 * (b["close"].iloc[-1] / ma.iloc[-1] - 1))})
    if not latest:
        raise RuntimeError("no bars with 200 days of history yet")
    # Each kind's own latest session (futures and Europe trade while US stocks are closed); a
    # ticker whose last bar is older than that (holiday, stale data) is left out.
    rows = [r for r in found if r["date"] == latest[r["kind"]].date().isoformat()]
    session = latest.get("Stock", max(latest.values())).date().isoformat()
    rows.sort(key=lambda r: abs(r["vs200"]))
    now = pd.Timestamp.now(tz=cfg["tz"]).isoformat(timespec="minutes")
    store.put_json("taps", {"session": session, "updated": now, "rows": rows})
    merge_log(store, "taps_log", session, rows, cfg["activity"]["log_sessions"])


# --- record volume ------------------------------------------------------------------------

def record_universe(cfg: dict) -> dict[str, tuple[str, str]]:
    return {t: v for t, v in tap_universe(cfg).items() if v[1] != "Futures"}


def refresh_volume_records(store: Store, cfg: dict) -> None:
    """Biggest volume day of each stock and ETF over its whole history, up to but not including
    the latest session (weekly; downloads every stock's full history)."""
    skip = cfg["activity"]["record_volume"]["ignore_first_days"]
    records = store.get_json("volume_records", {})
    for t, df in prices.download_ohlcv(list(record_universe(cfg)), "max", chunk=100).items():
        rec = derived.record_volume(df["volume"], skip)
        if rec:
            records[t] = list(rec)
    if not records:
        raise RuntimeError("no volume history downloaded")
    store.put_json("volume_records", records)


def refresh_record_volume(store: Store, cfg: dict) -> None:
    """Stocks and ETFs whose latest session traded close to their biggest volume ever."""
    rv = cfg["activity"]["record_volume"]
    records = store.get_json("volume_records", {})
    if not records:
        refresh_volume_records(store, cfg)
        records = store.get_json("volume_records", {})
    since = (pd.Timestamp.now() - pd.DateOffset(days=30)).date().isoformat()
    rows, sessions = [], []
    for t, (name, kind) in record_universe(cfg).items():
        b = bars(store, t, since).dropna(subset=["volume", "close"])
        if len(b) < 2 or t not in records:
            continue
        day, vol = b.index[-1], float(b["volume"].iloc[-1])
        sessions.append(day)
        rec_vol, rec_day = records[t]
        # Days after the record download count as history too.
        prior = b["volume"].iloc[:-1]
        prior = prior[prior.index > pd.Timestamp(rec_day)]
        if len(prior) and prior.max() > rec_vol:
            rec_vol, rec_day = float(prior.max()), prior.idxmax().date().isoformat()
        if rec_day >= day.date().isoformat() or not rec_vol:
            continue
        if vol >= rec_vol * rv["min_pct_of_record"] / 100:
            rows.append({"symbol": t, "name": name, "kind": kind, "date": day.date().isoformat(),
                         "pct": round(100 * vol / rec_vol, 1), "volume": vol, "record": rec_vol,
                         "record_date": rec_day, "last": float(b["close"].iloc[-1])})
    if not sessions:
        raise RuntimeError("no recent volume data")
    session = max(sessions).date().isoformat()
    rows = sorted([r for r in rows if r["date"] == session], key=lambda r: -r["pct"])
    now = pd.Timestamp.now(tz=cfg["tz"]).isoformat(timespec="minutes")
    store.put_json("record_volume", {"session": session, "updated": now, "rows": rows})
    merge_log(store, "record_volume_log", session, rows, cfg["activity"]["log_sessions"], "pct")


# --- European small caps ------------------------------------------------------------------

def refresh_eu_smallcaps(store: Store, cfg: dict) -> None:
    rows = screener.eu_smallcap_movers(cfg["activity"]["eu_smallcaps"])
    now = pd.Timestamp.now(tz=cfg["tz"])
    session = (now.normalize() - pd.offsets.BDay(1) if now.weekday() >= 5 else now.normalize()).date().isoformat()
    store.put_json("eu_smallcaps", {"session": session, "updated": now.isoformat(timespec="minutes"),
                                    "rows": rows})
    merge_log(store, "eu_smallcaps_log", session, rows, cfg["activity"]["log_sessions"], "day")
