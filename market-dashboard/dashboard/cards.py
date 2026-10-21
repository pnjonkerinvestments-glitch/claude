"""JSON for the overview cards, activity lists, performance tables, flows and seasonality, plus
the detail views the page loads on demand (COT, price charts, streaks)."""

from __future__ import annotations

import numpy as np
import pandas as pd

from . import derived, explain, frames
from .activity import bars
from .blocks import _list, _num, _weekly, perf_rows, section_meta
from .db import Store
from .sources import cftc as cftc_sources


def _dates(idx) -> list[str]:
    return [d.date().isoformat() for d in idx]


def _tail_n(s: pd.Series, n: int) -> pd.Series:
    return s.dropna().iloc[-n:]


def name_of(cfg: dict, ticker: str) -> str:
    p = cfg["prices"]
    for i in p["indices"].values():
        if i["ticker"] == ticker:
            return i["name"]
    for table in ("us_etfs", "country_etfs", "eu_etfs"):
        for t, name in p[table]["items"]:
            if t == ticker:
                return f"{t} · {name}"
    return ticker


# --- overview ---------------------------------------------------------------------------

def markets_card(store: Store, cfg: dict) -> dict:
    rows = []
    for m in cfg["prices"]["markets"]:
        close = frames.price(store, m["ticker"]).dropna()
        if close.empty:
            rows.append({"label": m["label"], "tv": m["tv"], "available": False})
            continue
        row = {"label": m["label"], "tv": m["tv"], "available": True, "unit": m.get("unit", "pct"),
               "last": _num(close.iloc[-1]), "date": close.index[-1].date().isoformat()}
        if m.get("unit") == "bp":    # yields: change in basis points
            prior = close[close.index.year < close.index[-1].year]
            chg = lambda n: _num(100 * (close.iloc[-1] - close.iloc[-1 - n])) if len(close) > n else None
            row.update(d1=chg(1), w1=chg(5),
                       ytd=_num(100 * (close.iloc[-1] - prior.iloc[-1])) if not prior.empty else None)
        else:
            perf = derived.performance(close)
            row.update(d1=_num(perf["d1"]), w1=_num(perf["w1"]), ytd=_num(perf["ytd"]))
        rows.append(row)
    return {"rows": rows, "about": explain.CARDS["markets"]}


def fear_greed_card(store: Store, cfg: dict) -> dict:
    spx = frames.price(store, "^GSPC").dropna()
    spx = spx[spx.index >= spx.index[-1] - pd.DateOffset(years=3)] if not spx.empty else spx
    fg = derived.fear_greed(spx, frames.series(store, "cboe:VIX"),
                            frames.series(store, "drv:breadth:US:above50"), frames.price(store, "SPY"),
                            frames.price(store, "TLT"), frames.series(store, "fred:BAMLH0A0HYM2"))
    fg = fg.dropna(subset=["score"])
    if fg.empty:
        return {"available": False, "about": explain.CARDS["fear_greed"]}
    last = fg.iloc[-1]
    hist = fg["score"].iloc[-130:]
    return {"available": True, "score": _num(last["score"]), "label": derived.fear_greed_label(last["score"]),
            "date": fg.index[-1].date().isoformat(),
            "parts": [{"key": k, "name": explain.FEAR_GREED[k][0], "about": explain.FEAR_GREED[k][1],
                       "score": _num(last[k])} for k in derived.FEAR_GREED_PARTS],
            "history": {"dates": _dates(hist.index), "values": _list(hist, 1)},
            "about": explain.CARDS["fear_greed"]}


def breadth_card(store: Store, cfg: dict) -> dict:
    out = {}
    for region, label in (("US", "S&P 500"), ("EU", "Europe (Euro Stoxx 50, DAX, AEX)")):
        series = {d: frames.series(store, f"drv:breadth:{region}:above{d}").dropna() for d in (20, 50, 200)}
        if any(s.empty for s in series.values()):
            continue
        idx = series[200].index[-252:]
        out[region] = {"label": label, "date": idx[-1].date().isoformat(),
                       "latest": {d: _num(s.iloc[-1]) for d, s in series.items()},
                       "dates": _dates(idx), "series": {d: _list(s.reindex(idx), 1) for d, s in series.items()}}
    return {"regions": out, "about": explain.CARDS["breadth"]}


def vix_card(store: Store, cfg: dict) -> dict:
    vix = frames.series(store, "cboe:VIX").dropna()
    if vix.empty:
        return {"available": False}
    v = vix[vix.index >= vix.index[-1] - pd.DateOffset(years=1)]
    return {"available": True, "last": _num(vix.iloc[-1]), "date": vix.index[-1].date().isoformat(),
            "dates": _dates(v.index), "values": _list(v, 2), "lines": [20, 30],
            "pct1y": _num(derived.percentile_of_last(v)), "about": explain.CARDS["vix"]}


def ohlc_payload(b: pd.DataFrame, nd: int = 2) -> dict:
    return {"dates": _dates(b.index), "open": _list(b["open"], nd), "high": _list(b["high"], nd),
            "low": _list(b["low"], nd), "close": _list(b["close"], nd)}


def weekly_bars(b: pd.DataFrame) -> pd.DataFrame:
    """Daily bars -> weekly bars ending Friday (dated on the week's last trading day)."""
    b = b.dropna(subset=["close"])
    g = b.groupby(pd.Grouper(freq="W-FRI"))
    out = pd.DataFrame({"open": g["open"].first(), "high": g["high"].max(), "low": g["low"].min(),
                        "close": g["close"].last(), "volume": g["volume"].sum(min_count=1),
                        "day": g.apply(lambda x: x.index[-1] if len(x) else pd.NaT)}).dropna(subset=["close"])
    return out.set_index("day")


def candles(store: Store, ticker: str, daily_n: int = 760, weekly_years: int = 20) -> dict:
    """Daily and weekly candles with 50/200-day and 10/40-week averages."""
    b = bars(store, ticker).dropna(subset=["close"])
    if b.empty:
        return {"available": False, "ticker": ticker}
    b[["open", "high", "low"]] = b[["open", "high", "low"]].fillna(
        pd.DataFrame({c: b["close"] for c in ("open", "high", "low")}))
    nd = 4 if b["close"].iloc[-1] < 10 else 2
    d = b.iloc[-daily_n:]
    ma = {n: b["close"].rolling(n).mean().reindex(d.index) for n in (50, 200)}
    w = weekly_bars(b)
    w = w[w.index >= w.index[-1] - pd.DateOffset(years=weekly_years)]
    wk = weekly_bars(b)["close"]
    wma = {n: wk.rolling(n).mean().reindex(w.index) for n in (10, 40)}
    return {"available": True, "ticker": ticker, "last": _num(b["close"].iloc[-1]),
            "date": b.index[-1].date().isoformat(),
            "daily": ohlc_payload(d, nd) | {"ma": {f"{n}d": _list(s, nd) for n, s in ma.items()}},
            "weekly": ohlc_payload(w, nd) | {"ma": {f"{n}w": _list(s, nd) for n, s in wma.items()}}}


def hyg_card(store: Store, cfg: dict) -> dict:
    c = candles(store, "HYG", daily_n=400, weekly_years=5)
    return c | {"name": "iShares High Yield Corporate Bond ETF (HYG)", "about": explain.CARDS["hyg"]}


SECTORS = ["XLK", "XLC", "XLY", "XLF", "XLV", "XLI", "XLE", "XLB", "XLP", "XLU", "XLRE"]


def sectors_card(store: Store, cfg: dict) -> dict:
    names = dict(cfg["prices"]["us_etfs"]["items"])
    rows = []
    for t in SECTORS:
        close = frames.price(store, t).dropna()
        if close.empty:
            continue
        perf = derived.performance(close)
        rows.append({"ticker": t, "name": names.get(t, t), "d1": _num(perf["d1"]), "w1": _num(perf["w1"]),
                     "m1": _num(perf["m1"]), "ytd": _num(perf["ytd"])})
    return {"rows": rows, "about": explain.CARDS["sectors"]}


def overview_section(store: Store, cfg: dict) -> dict:
    return {**section_meta(store, cfg, "overview"), "markets": markets_card(store, cfg),
            "fear_greed": fear_greed_card(store, cfg), "breadth": breadth_card(store, cfg),
            "vix": vix_card(store, cfg), "hyg": hyg_card(store, cfg), "sectors": sectors_card(store, cfg)}


# --- activity -----------------------------------------------------------------------------

def running_log(book: dict, value: str | None = None) -> dict:
    """{session: {symbol: row}} -> one row per name with the sessions it showed up in."""
    names: dict[str, dict] = {}
    for session in sorted(book):
        for sym, r in book[session].items():
            entry = names.setdefault(sym, {**r, "sessions": [], "best": None})
            entry["sessions"].append(session)
            entry.update({k: v for k, v in r.items() if k not in ("sessions", "best")})
            if value and r.get(value) is not None:
                entry["best"] = r[value] if entry["best"] is None else max(entry["best"], r[value])
    rows = sorted(names.values(), key=lambda r: (r["sessions"][-1], len(r["sessions"])), reverse=True)
    return {"sessions": sorted(book), "rows": rows}


def activity_section(store: Store, cfg: dict) -> dict:
    def doc(key, log_key, value=None):
        d = store.get_json(key)
        if d is None:
            return {"available": False}
        return {"available": True, **d, "log": running_log(store.get_json(log_key, {}), value)}
    return {**section_meta(store, cfg, "activity"),
            "unusual": doc("unusual", "unusual_log", "rel"),
            "taps": doc("taps", "taps_log"),
            "record_volume": doc("record_volume", "record_volume_log", "pct"),
            "eu_smallcaps": doc("eu_smallcaps", "eu_smallcaps_log", "day"),
            "thresholds": cfg["activity"], "about": explain.ACTIVITY}


# --- performance tables -------------------------------------------------------------------

def perf_table(store: Store, items: list, bench: str) -> list[dict]:
    rows = []
    for r in perf_rows(store, items, bench):
        close = frames.price(store, r["ticker"]).dropna()
        if not close.empty:
            perf = derived.performance(close)
            r.update(d1=_num(perf["d1"]), ytd=_num(perf["ytd"]), y1=_num(perf["y1"]))
        rows.append(r)
    return rows


def performance_section(store: Store, cfg: dict) -> dict:
    p = cfg["prices"]
    return {**section_meta(store, cfg, "performance"),
            "us": perf_table(store, p["us_etfs"]["items"], p["us_etfs"]["benchmark"]),
            "country": perf_table(store, p["country_etfs"]["items"], p["country_etfs"]["benchmark"]),
            "eu": perf_table(store, p["eu_etfs"]["items"], p["eu_etfs"]["benchmark"])}


# --- flows: short ETF volume share --------------------------------------------------------

def short_share_card(store: Store, cfg: dict) -> dict:
    fam = cfg["prices"]["short_etf_families"]
    since = fam["since"]
    out = {}
    for key, f in fam.items():
        if key == "since":
            continue
        tickers = f["long"] + f["short"]
        closes = pd.DataFrame({t: frames.series(store, f"px:{t}") for t in tickers})
        vols = pd.DataFrame({t: frames.series(store, f"vo:{t}") for t in tickers})
        share = derived.short_share(closes, vols, f["short"])
        share = share[share.index >= since]
        if share.empty:
            continue
        avg = share.rolling(10).mean()
        price = frames.price(store, key).reindex(share.index)
        out[key] = {"dates": _dates(share.index), "share": _list(share, 2), "avg10": _list(avg, 2),
                    "price": _list(price, 2), "latest": _num(share.iloc[-1]), "avg_latest": _num(avg.iloc[-1]),
                    "date": share.index[-1].date().isoformat(), "high": _num(share.max()),
                    "high_date": share.idxmax().date().isoformat(),
                    "pct": _num(derived.percentile_of_last(avg.dropna())), "long": f["long"], "short": f["short"]}
    return {"families": out, "since": since, "about": explain.CARDS["short_share"]}


# --- seasonality --------------------------------------------------------------------------

def seasonality_section(store: Store, cfg: dict) -> dict:
    today = pd.Timestamp.now(tz=cfg["tz"]).tz_localize(None).normalize()
    rows = []
    for ticker, label in cfg["prices"]["seasonality"]:
        rets = derived.monthly_returns(frames.price(store, ticker), today)
        if rets.empty:
            continue
        rows.append({"ticker": ticker, "label": label, "first": rets.index[0].strftime("%b %Y"),
                     "windows": {str(y): derived.seasonality(rets, y, today) for y in (10, 15, 20)}})
    return {**section_meta(store, cfg, "seasonality"), "rows": rows, "month": today.month,
            "about": explain.CARDS["seasonality"]}


# --- detail views (loaded on demand) ------------------------------------------------------

def cot_detail(store: Store, cfg: dict, key: str) -> dict:
    """Weekly positions of every trader group (net, longs, shorts as % of open interest) and the
    market's weekly candles."""
    asset = next(a for a in cfg["cftc"]["assets"] if a["key"] == key)
    oi = frames.series(store, f"cot:{key}:oi").dropna()
    out = {"key": key, "label": asset["label"], "group": asset["group"], "default_group": asset["cohort"],
           "available": not oi.empty}
    if oi.empty:
        return out
    groups = {}
    for g in cftc_sources.DATASET_COHORTS[asset["dataset"]]:
        parts = {p: frames.series(store, f"cot:{key}:{p}:{g}").reindex(oi.index) for p in ("g", "gl", "gs")}
        if parts["g"].dropna().empty:
            continue
        name, about = explain.GROUPS[g]
        groups[g] = {"name": name, "about": about,
                     **{label: _list(100 * parts[p] / oi.replace(0, np.nan), 2)
                        for p, label in (("g", "net"), ("gl", "long"), ("gs", "short"))},
                     "net_contracts": _list(parts["g"], 0)}
    out.update(dates=_dates(oi.index), oi=_list(oi, 0), groups=groups,
               order=[g for g in cftc_sources.DATASET_COHORTS[asset["dataset"]] if g in groups])
    if asset.get("price"):
        b = bars(store, asset["price"]).dropna(subset=["close"])
        if not b.empty:
            b[["open", "high", "low"]] = b[["open", "high", "low"]].fillna(
                pd.DataFrame({c: b["close"] for c in ("open", "high", "low")}))
            w = weekly_bars(b[b.index >= oi.index[0] - pd.Timedelta(days=7)])
            # Align each candle with the COT report of that week (report date = Tuesday).
            w.index = w.index - pd.to_timedelta((w.index.weekday - 1) % 7, unit="D")
            nd = 4 if w["close"].iloc[-1] < 10 else 2
            out["price"] = ohlc_payload(w, nd)
    return out


def price_detail(store: Store, cfg: dict, ticker: str) -> dict:
    c = candles(store, ticker)
    c["name"] = name_of(cfg, ticker)
    region = "EU" if ticker in ("^STOXX", "^STOXX50E", "^GDAXI", "^AEX") else "US"
    breadth = {}
    for key, label in (("above20", "% above 20-day"), ("above50", "% above 50-day"),
                       ("above200", "% above 200-day"), ("outperform", "% beating the index (2 months)"),
                       ("summation", "McClellan summation")):
        s = frames.series(store, f"drv:breadth:{region}:{key}").dropna()
        if not s.empty:
            breadth[key] = {"label": label, "dates": _dates(s.index), "values": _list(s, 1)}
    c["breadth"] = breadth
    c["breadth_region"] = "S&P 500 members" if region == "US" else "Euro Stoxx 50, DAX and AEX members"
    return c


def streak_detail(store: Store, cfg: dict, ticker: str) -> dict:
    close = frames.price(store, ticker).dropna()
    if close.empty:
        return {"available": False, "ticker": ticker}
    out = {"available": True, "ticker": ticker, "name": name_of(cfg, ticker),
           "dates": _dates(close.index), "close": _list(close, 2), "first": close.index[0].year}
    change = close.pct_change() * 100
    for direction in ("decline", "gain"):
        streak = derived.move_streak(close, 1.0, direction)
        peaks = derived.streak_peaks(streak, 1)
        current = int(streak.iloc[-1])
        hits = change[change <= -1] if direction == "decline" else change[change >= 1]
        out[direction] = {
            "streak": [int(v) for v in streak.values], "current": current,
            "peaks": {"dates": _dates(peaks.index), "values": [int(v) for v in peaks.values]},
            "record": int(streak.max()), "record_date": streak.idxmax().date().isoformat(),
            "at_least": int((peaks >= max(current, 1)).sum()),
            "last_hit": hits.index[-1].date().isoformat() if not hits.empty else None,
            "last_move": _num(hits.iloc[-1]) if not hits.empty else None}
    return out


DETAILS = {"cot": cot_detail, "price": price_detail, "streak": streak_detail}


def detail_keys(cfg: dict) -> dict[str, list[str]]:
    """Every key the page can ask for, for the static snapshot."""
    return {"cot": [a["key"] for a in cfg["cftc"]["assets"]], "price": cfg["prices"]["price_charts"],
            "streak": cfg["prices"]["streak_indices"]}


COT_TV = {"spx": "CME_MINI:ES1!", "ndx": "CME_MINI:NQ1!", "dow": "CBOT_MINI:YM1!", "rut": "CME_MINI:RTY1!",
          "vix": "CBOE:VX1!", "tu": "CBOT:ZT1!", "fv": "CBOT:ZF1!", "ty": "CBOT:ZN1!", "uxy": "CBOT:TN1!",
          "us": "CBOT:ZB1!", "sofr": "CME:SR31!", "usd": "ICEUS:DX1!", "eur": "CME:6E1!", "jpy": "CME:6J1!",
          "gold": "COMEX:GC1!", "silver": "COMEX:SI1!", "copper": "COMEX:HG1!", "wti": "NYMEX:CL1!",
          "gasoline": "NYMEX:RB1!", "natgas": "NYMEX:NG1!", "bitcoin": "CME:BTC1!", "ether": "CME:ETH1!"}


def tv_symbol(cfg: dict, ticker: str) -> str:
    p = cfg["prices"]
    for item in [*p["indices"].values(), *p["markets"], *p["commodities"], *p["crypto"], *p["dollar"],
                 *p["asia"], *p["rates_futures"]]:
        if item["ticker"] == ticker:
            return item["tv"]
    return ticker.replace("^", "")


def charts_meta(cfg: dict) -> dict:
    p = cfg["prices"]
    tickers = list(dict.fromkeys(p["price_charts"] + p["streak_indices"]))
    names = {t: name_of(cfg, t) for t in tickers}
    return {"price": p["price_charts"], "streak": p["streak_indices"], "names": names,
            "tv": {t: tv_symbol(cfg, t) for t in tickers}}
