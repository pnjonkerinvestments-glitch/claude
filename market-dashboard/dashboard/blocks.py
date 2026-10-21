"""Builds the JSON for each dashboard section from the SQLite cache."""

from __future__ import annotations

import math
from datetime import datetime

import numpy as np
import pandas as pd

from . import calc, derived, explain, frames
from .calc import GREEN, NODATA, ORANGE, RED, Indicator
from .db import Store

SECTION_SOURCES = {
    "summary": ("prices", "components", "breadth", "cboe_vix", "cboe_pc", "fred", "cftc"),
    "indexcot": ("cftc", "prices"),
    "today": ("prices", "cboe_vix"),
    "stocks": ("prices", "components", "breadth"),
    "appetite": ("prices",),
    "volatility": ("prices", "cboe_vix", "cboe_pc"),
    "positioning": ("cftc", "prices"),
    "rates": ("fred", "prices"),
    "dollar": ("prices", "cftc"),
    "commodities": ("prices", "cftc"),
    "crypto": ("prices", "cftc"),
    "asia": ("prices",),
}
SOURCE_NAMES = {
    "prices": "Yahoo Finance (prices)",
    "components": "Yahoo Finance (index members)",
    "breadth": "Breadth calculation",
    "cboe_vix": "CBOE (VIX indices)",
    "cboe_pc": "CBOE (put/call ratios)",
    "fred": "FRED",
    "cftc": "CFTC (COT)",
}
COHORT_NAMES = {"am": "Asset managers", "lf": "Leveraged funds", "mm": "Managed money"}


# --- shared helpers -----------------------------------------------------------------

def _fmt_time(stamp: str | None, tz) -> str | None:
    if not stamp:
        return None
    return datetime.fromisoformat(stamp).astimezone(tz).strftime("%a %d %b %H:%M")


def section_meta(store: Store, cfg: dict, section: str) -> dict:
    """'Updated at' plus a warning for every source whose latest refresh failed."""
    tz = cfg["tz"]
    successes, warnings = [], []
    for src in SECTION_SOURCES[section]:
        st = store.status(src)
        if st["last_success"]:
            successes.append(st["last_success"])
        if st["last_error"]:
            last_ok = _fmt_time(st["last_success"], tz)
            fallback = f"showing data stored {last_ok}" if last_ok else "no stored data yet"
            warnings.append(f"{SOURCE_NAMES[src]}: refresh failed {_fmt_time(st['last_attempt'], tz)} "
                            f"({st['last_error']}); {fallback}.")
    return {"updated_at": _fmt_time(max(successes), tz) if successes else None,
            "warnings": warnings, "intro": explain.SECTIONS.get(section)}


def _num(x) -> float | None:
    if x is None:
        return None
    try:
        x = float(x)
    except (TypeError, ValueError):
        return None
    return None if math.isnan(x) or math.isinf(x) else x


def ordinal(x: float) -> str:
    n = int(round(x))
    suffix = "th" if 10 <= n % 100 <= 20 else {1: "st", 2: "nd", 3: "rd"}.get(n % 10, "th")
    return f"{n}{suffix}"


def _signed(x: float, nd: int = 2) -> str:
    return f"{'+' if x > 0 else '−' if x < 0 else '±'}{abs(x):,.{nd}f}"


def _tail(s: pd.Series, days: int) -> pd.Series:
    s = s.dropna()
    return s[s.index > s.index[-1] - pd.Timedelta(days=days)] if len(s) else s


def _weekly(s: pd.Series) -> pd.Series:
    return s.dropna().resample("W-FRI").last().dropna()


def series_spec(label: str, s: pd.Series, role: str = "ind", kind: str = "line") -> dict:
    """role: price (main ink line), ma (thin helper), ind (indicator colour), ref (muted)."""
    return {"label": label, "s": s, "role": role, "kind": kind}


def panel(series: list[dict], hlines: list | None = None, height: float = 1.0,
          fmt: str = "num", bands: list | None = None) -> dict:
    return {"series": series, "hlines": hlines or [], "height": height, "fmt": fmt,
            "bands": bands or []}


def chart(cid: str, title: str, panels: list[dict], subtitle: str | None = None,
          tv: str | None = None, note: str | None = None) -> dict:
    """Align all series on one date axis and emit plain lists for the page."""
    index = None
    for p in panels:
        for s in p["series"]:
            idx = s["s"].dropna().index
            if len(idx) == 0:
                continue
            index = idx if index is None else index.union(idx)
    if index is None or len(index) == 0:
        return {"id": cid, "title": title, "available": False, "subtitle": subtitle, "tv": tv,
                "explain": explain.chart_text(cid)}
    out_panels = []
    for p in panels:
        out_series = []
        for s in p["series"]:
            vals = s["s"].reindex(index)
            out_series.append({"label": s["label"], "role": s["role"], "kind": s["kind"],
                               "values": [_num(v) for v in vals]})
        out_panels.append({**p, "series": out_series})
    return {"id": cid, "title": title, "subtitle": subtitle, "tv": tv, "note": note,
            "explain": explain.chart_text(cid), "available": True, "dates": [d.date().isoformat() for d in index],
            "panels": out_panels}


def perf_rows(store: Store, items: list, bench_ticker: str | None, extra=None) -> list[dict]:
    bench = frames.price(store, bench_ticker) if bench_ticker else None
    rows = []
    for item in items:
        ticker, name = (item[0], item[1]) if isinstance(item, (list, tuple)) else (item["ticker"], item["name"])
        close = frames.price(store, ticker)
        row = {"ticker": ticker, "name": name, "available": not close.empty,
               "tv": item.get("tv", ticker) if isinstance(item, dict) else _tv_for(ticker)}
        if not close.empty:
            row.update({k: _num(v) if not isinstance(v, str) else v
                        for k, v in derived.performance(close, bench).items()})
        if extra:
            row.update(extra(item))
        rows.append(row)
    return rows


def _tv_for(ticker: str) -> str:
    if ticker.endswith(".DE"):
        return f"XETR:{ticker[:-3]}"
    return ticker.replace("^", "")


# --- COT ------------------------------------------------------------------------------

def cot_frame(store: Store, key: str) -> tuple[pd.Series, pd.Series]:
    return frames.series(store, f"cot:{key}:net"), frames.series(store, f"cot:{key}:oi")


def cot_summary(store: Store, asset: dict) -> dict:
    net, oi = cot_frame(store, asset["key"])
    row = {"key": asset["key"], "label": asset["label"], "group": asset["group"],
           "cohort": COHORT_NAMES[asset["cohort"]], "cohort_short": asset["cohort"].upper(),
           "available": not net.empty}
    if not net.empty:
        row.update({k: _num(v) if not isinstance(v, str) else v
                    for k, v in derived.cot_percentiles(net, oi).items()})
    return row


def cot_chart(store: Store, cfg: dict, key: str, years: int = 10) -> dict:
    asset = next(a for a in cfg["cftc"]["assets"] if a["key"] == key)
    net, oi = cot_frame(store, key)
    if net.empty:
        return {"id": f"cot-{key}", "title": asset["label"], "available": False}
    ratio = net / oi.replace(0, np.nan)
    pct = derived.expanding_percentile(ratio)
    start = pct.index[-1] - pd.DateOffset(years=years)
    panels = []
    if asset.get("price"):
        px = _weekly(frames.price(store, asset["price"]))
        panels.append(panel([series_spec(asset["label"], px[px.index >= start], "price")], height=0.6))
    panels.append(panel([series_spec("Net/OI percentile (since " + ratio.index[0].strftime("%Y") + ")",
                                     pct[pct.index >= start], "ind")],
                        hlines=[(10, "10"), (90, "90")], height=0.4, fmt="pct0",
                        bands=[(0, 10, "low"), (90, 100, "high")]))
    return chart(f"cot-{key}", f"{asset['label']}: price and COT positioning", panels,
                 subtitle=f"{COHORT_NAMES[asset['cohort']]}, net position as share of open interest, "
                          f"percentile of all data up to each week",
                 tv=None)


# --- section: summary (regime tally, key tiles, signals) ------------------------------

def _trend(store, cfg, key) -> Indicator:
    rc = cfg["regime"]["trend"]
    info = cfg["prices"]["indices"][key]
    close = frames.price(store, info["ticker"])
    closes = list(close.values)
    label = f"Trend {info['name']}"
    pos = calc.ma_position(closes, rc["moving_averages"])
    if not closes or any(v is None for v in pos.values()):
        return Indicator(f"trend_{key}", label, NODATA, "no data",
                         "Not enough price history for the moving averages.", "Trend")
    above = sum(pos.values())
    parts = [f"MA{d} {calc.sma(closes, d):,.2f} ({'above' if pos[d] else 'below'})"
             for d in rc["moving_averages"]]
    reason = (f"Close {closes[-1]:,.2f} on {close.index[-1].date()}: " + ", ".join(parts) +
              f". Green when above ≥ {rc['green_min_above']}, orange when above "
              f"≥ {rc['orange_min_above']}, otherwise red.")
    return Indicator(f"trend_{key}", label, calc.trend_color(above, rc["green_min_above"],
                                                             rc["orange_min_above"]),
                     f"above {above}/{len(rc['moving_averages'])} MAs", reason, "Trend")


def _breadth(store, cfg, region: str, label: str, members_note: str) -> Indicator:
    rc = cfg["regime"]["breadth"]
    a50 = frames.series(store, f"drv:breadth:{region}:above50").dropna()
    a200 = frames.series(store, f"drv:breadth:{region}:above200").dropna()
    if a50.empty or a200.empty:
        return Indicator(f"breadth_{region}", label, NODATA, "no data",
                         "Breadth not calculated yet.", "Breadth")
    p50, p200 = a50.iloc[-1], a200.iloc[-1]
    reason = (f"{p50:.0f}% of {members_note} above their 50-day MA, {p200:.0f}% above their "
              f"200-day MA ({a50.index[-1].date()}). Green when both ≥ {rc['green_min_pct']}%, "
              f"red when both ≤ {rc['red_max_pct']}%, otherwise orange.")
    return Indicator(f"breadth_{region}", label,
                     calc.breadth_color(p50, p200, rc["green_min_pct"], rc["red_max_pct"]),
                     f"50d {p50:.0f}% · 200d {p200:.0f}%", reason, "Breadth")


def _vix_level(store, cfg) -> Indicator:
    rc = cfg["regime"]["vix_level"]
    vix = frames.series(store, "cboe:VIX").dropna()
    if vix.empty:
        return Indicator("vix", "VIX level", NODATA, "no data", "No VIX data yet.", "Volatility")
    v = vix.iloc[-1]
    return Indicator("vix", "VIX level", calc.color_band(v, rc["green_below"], rc["red_above"]),
                     f"{v:.2f}", f"VIX {v:.2f} on {vix.index[-1].date()}. Green below "
                     f"{rc['green_below']}, red above {rc['red_above']}, orange in between.",
                     "Volatility")


def _vix_term(store, cfg) -> Indicator:
    rc = cfg["regime"]["vix_term_structure"]
    latest = {}
    for sym in ("VIX9D", "VIX", "VIX3M"):
        s = frames.series(store, f"cboe:{sym}").dropna()
        if s.empty:
            return Indicator("vix_term", "VIX term structure", NODATA, "no data",
                             "Missing VIX9D, VIX or VIX3M data.", "Volatility")
        latest[sym] = s.iloc[-1]
    ratio = latest["VIX"] / latest["VIX3M"]
    state = "contango" if ratio < 1 else "backwardation"
    reason = (f"VIX9D {latest['VIX9D']:.2f} / VIX {latest['VIX']:.2f} / VIX3M {latest['VIX3M']:.2f}. "
              f"VIX/VIX3M = {ratio:.3f} → {state}. Green below {rc['green_below']}, red at "
              f"≥ {rc['red_above']}, orange in between.")
    return Indicator("vix_term", "VIX term structure",
                     calc.term_structure_color(latest["VIX"], latest["VIX3M"], rc["green_below"],
                                               rc["red_above"]),
                     f"{state} ({ratio:.2f})", reason, "Volatility")


def put_call_percentile(values: list[float], avg_days: int, lookback: int):
    avgs = [a for a in calc.rolling_mean(values, avg_days) if a is not None]
    if not avgs:
        return None
    return avgs[-1], calc.percentile_rank(avgs[-lookback:], avgs[-1])


def _put_call(store, cfg) -> Indicator:
    rc = cfg["regime"]["put_call"]
    pc = frames.series(store, "pc:equity").dropna()
    res = put_call_percentile(list(pc.values), rc["average_days"], rc["lookback_days"])
    if not res:
        return Indicator("put_call", "Equity put/call", NODATA, "no data",
                         "No CBOE put/call history yet.", "Sentiment")
    avg, pct = res
    reason = (f"{rc['average_days']}-day average equity P/C {avg:.2f} (latest {pc.iloc[-1]:.2f} on "
              f"{pc.index[-1].date()}) is at the {ordinal(pct)} percentile of the last "
              f"{min(len(pc), rc['lookback_days'])} trading days. Green below the "
              f"{ordinal(rc['green_below_pct'])}, red above the {ordinal(rc['red_above_pct'])} percentile.")
    return Indicator("put_call", "Equity put/call",
                     calc.color_band(pct, rc["green_below_pct"], rc["red_above_pct"]),
                     f"{avg:.2f} (p{pct:.0f})", reason, "Sentiment")


def _credit(store, cfg) -> Indicator:
    rc = cfg["regime"]["credit"]
    hy = frames.series(store, "fred:BAMLH0A0HYM2").dropna()
    if len(hy) <= rc["change_days"]:
        return Indicator("credit", "High-yield spread", NODATA, "no data",
                         "Not enough FRED high-yield spread history.", "Credit")
    change_bp = (hy.iloc[-1] - hy.iloc[-1 - rc["change_days"]]) * 100
    reason = (f"HY OAS {hy.iloc[-1]:.2f}% on {hy.index[-1].date()}, {_signed(change_bp, 0)} bp over "
              f"{rc['change_days']} days. Green when ≤ {rc['green_max_level']}% and change "
              f"≤ {rc['green_max_change_bp']:+g} bp; red when ≥ {rc['red_min_level']}% or change "
              f"≥ {rc['red_min_change_bp']:+g} bp; otherwise orange.")
    return Indicator("credit", "High-yield spread", calc.credit_color(hy.iloc[-1], change_bp, rc),
                     f"{hy.iloc[-1]:.2f}% ({_signed(change_bp, 0)} bp)", reason, "Credit")


def _curve(store, cfg) -> Indicator:
    rc = cfg["regime"]["yield_curve"]
    s = frames.series(store, "fred:T10Y2Y").dropna()
    if s.empty:
        return Indicator("curve", "Yield curve 2s10s", NODATA, "no data",
                         "No FRED 2s10s data yet.", "Rates")
    v = s.iloc[-1]
    return Indicator("curve", "Yield curve 2s10s", calc.curve_color(v, rc["green_above"], rc["red_below"]),
                     f"{_signed(v)} pp", f"10Y − 2Y = {_signed(v)} pp on {s.index[-1].date()}. "
                     f"Green above {rc['green_above']:+g}, red below {rc['red_below']:+g}, "
                     f"orange in between.", "Rates")


def regime(store: Store, cfg: dict) -> dict:
    indicators = [_trend(store, cfg, k) for k in cfg["regime"]["trend"]["indices"]]
    indicators += [_breadth(store, cfg, "US", "Breadth S&P 500", "S&P 500 members"),
                   _breadth(store, cfg, "EU", "Breadth Europe", "Euro Stoxx 50, DAX and AEX members"),
                   _vix_level(store, cfg), _vix_term(store, cfg), _put_call(store, cfg),
                   _credit(store, cfg), _curve(store, cfg)]
    vc = cfg["regime"]["verdict"]
    verdict = calc.regime_verdict([i.color for i in indicators], vc["risk_on_min_pct"],
                                  vc["risk_off_max_pct"])
    return {"indicators": [i.__dict__ | {"meaning": explain.indicator_text(i.key)} for i in indicators],
            "verdict": verdict.__dict__}


TILE_ABOUT = {
    "S&P 500": "Last close and change over the past week.",
    "Nasdaq-100": "The 100 largest non-financial Nasdaq stocks; last close and 1-week change.",
    "STOXX 600": "600 large European companies; last close and 1-week change.",
    "Dollar index": "The dollar against six major currencies (mostly the euro). Up = stronger dollar.",
    "Gold": "Gold futures price in dollars per ounce.",
    "Bitcoin": "Bitcoin in dollars.",
    "US 10Y": "10-year US Treasury yield; change over the week in basis points (0.01%).",
    "VIX": "Expected 30-day volatility of the S&P 500 ('fear index'); change in points over the week.",
    "S&P members > 50d": "Share of S&P 500 stocks above their own 50-day average: short-term breadth.",
    "S&P days without −1% day": "Trading days since the S&P 500 last fell 1% or more in one day.",
}


def _tile(label, value, change=None, change_label=None, colored=True) -> dict:
    """colored=False for changes that are neither good nor bad (yields, VIX)."""
    return {"label": label, "value": value, "change": _num(change), "change_label": change_label,
            "colored": colored, "about": TILE_ABOUT.get(label)}


def key_tiles(store: Store, cfg: dict) -> list[dict]:
    tiles = []
    for ticker, label, tv in (("^GSPC", "S&P 500", "SP:SPX"), ("^NDX", "Nasdaq-100", "NASDAQ:NDX"),
                              ("^STOXX", "STOXX 600", "TVC:SXXP"), ("DX-Y.NYB", "Dollar index", "TVC:DXY"),
                              ("GC=F", "Gold", "COMEX:GC1!"), ("BTC-USD", "Bitcoin", "BITSTAMP:BTCUSD")):
        close = frames.price(store, ticker)
        if close.empty:
            continue
        perf = derived.performance(close)
        tiles.append(_tile(label, f"{perf['last']:,.2f}", perf["w1"], "1w %") | {"tv": tv})
    ten = frames.series(store, "fred:DGS10").dropna()
    if len(ten) > 5:
        tiles.append(_tile("US 10Y", f"{ten.iloc[-1]:.2f}%", (ten.iloc[-1] - ten.iloc[-6]) * 100,
                           "1w bp", colored=False) | {"tv": "TVC:US10Y"})
    vix = frames.series(store, "cboe:VIX").dropna()
    if len(vix) > 5:
        tiles.append(_tile("VIX", f"{vix.iloc[-1]:.2f}", vix.iloc[-1] - vix.iloc[-6], "1w pts", colored=False)
                     | {"tv": "CBOE:VIX"})
    a50 = frames.series(store, "drv:breadth:US:above50").dropna()
    if not a50.empty:
        tiles.append(_tile("S&P members > 50d", f"{a50.iloc[-1]:.0f}%",
                           a50.iloc[-1] - a50.iloc[-6] if len(a50) > 5 else None, "1w pts"))
    spx = frames.price(store, "^GSPC")
    if len(spx) > 2:
        streak = derived.decline_streak(spx)
        tiles.append(_tile("S&P days without −1% day", f"{int(streak.iloc[-1])}"))
    return tiles


def signals(store: Store, cfg: dict) -> list[dict]:
    """Plain-language list of the extremes worth a look, most severe first."""
    sc = cfg["signals"]
    out: list[dict] = []

    def add(level: int, area: str, text: str):
        out.append({"level": level, "area": area, "text": text})

    for t in sc["rsi_watch"]:
        close = frames.price(store, t)
        if len(close) < 20:
            continue
        r = derived.rsi(close).iloc[-1]
        name = t.replace("^STOXX", "STOXX 600")
        if r <= sc["rsi_oversold"]:
            add(2, "Stocks", f"{name} RSI(14) {r:.0f}: oversold (≤ {sc['rsi_oversold']}).")
        elif r >= sc["rsi_overbought"]:
            add(1, "Stocks", f"{name} RSI(14) {r:.0f}: overbought (≥ {sc['rsi_overbought']}).")

    for a in cfg["cftc"]["assets"]:
        row = cot_summary(store, a)
        p = row.get("pct_all")
        if p is None:
            continue
        since = row["since"][:4]
        if p <= sc["cot_extreme_low"]:
            add(2 if p <= 3 else 1, "Positioning",
                f"{a['label']}: {row['cohort'].lower()} net/OI at the {ordinal(p)} percentile since "
                f"{since} (crowded short).")
        elif p >= sc["cot_extreme_high"]:
            add(2 if p >= 97 else 1, "Positioning",
                f"{a['label']}: {row['cohort'].lower()} net/OI at the {ordinal(p)} percentile since "
                f"{since} (crowded long).")

    spx = frames.price(store, "^GSPC")
    if len(spx) > 2:
        streak = int(derived.decline_streak(spx).iloc[-1])
        if streak >= sc["streak_alert_days"]:
            add(1, "Stocks", f"S&P 500 has gone {streak} trading days without a 1% decline.")
        elif streak == 0:
            add(1, "Stocks", f"S&P 500 fell {spx.pct_change().iloc[-1] * 100:.1f}% on the last day.")
    out_s = frames.series(store, "drv:breadth:US:outperform").dropna()
    if not out_s.empty:
        v = out_s.iloc[-1]
        if v <= sc["breadth_outperform_low"]:
            add(2, "Stocks", f"Only {v:.0f}% of S&P 500 stocks beat the index over 2 months (narrow market).")
        elif v >= sc["breadth_outperform_high"]:
            add(1, "Stocks", f"{v:.0f}% of S&P 500 stocks beat the index over 2 months (broad participation).")
    ndx = frames.price(store, "^NDX")
    if len(ndx) > 10:
        wk = derived.weekly_returns(ndx)
        if wk.iloc[-1] <= sc["weekly_drop_pct"]:
            add(2, "Stocks", f"Nasdaq-100 down {wk.iloc[-1]:.1f}% this week (≤ {sc['weekly_drop_pct']}%).")
    vix, vix3m = frames.series(store, "cboe:VIX").dropna(), frames.series(store, "cboe:VIX3M").dropna()
    if not vix.empty and not vix3m.empty and vix.iloc[-1] / vix3m.iloc[-1] >= 1:
        add(2, "Volatility", f"VIX curve in backwardation (VIX/VIX3M {vix.iloc[-1] / vix3m.iloc[-1]:.2f}).")
    move = frames.price(store, cfg["prices"]["volatility"]["move"])
    if len(move) > 260:
        p = derived.percentile_of_last(_tail(move, 365 * 3))
        if p is not None and p >= 90:
            add(1, "Rates", f"MOVE index {move.iloc[-1]:.0f}: {ordinal(p)} percentile of 3 years (bond volatility high).")
    rsp, spy = frames.price(store, "RSP"), frames.price(store, "SPY")
    if not rsp.empty and not spy.empty:
        ratio = (rsp / spy).dropna()
        p = derived.percentile_of_last(ratio)
        if p is not None and p <= 5:
            add(1, "Stocks", f"Equal-weight vs cap-weight S&P (RSP/SPY) at the {ordinal(p)} percentile since "
                             f"{ratio.index[0].year}.")
    for item in cfg["prices"]["crypto"][:2]:
        close = frames.price(store, item["ticker"])
        if len(close) > 400:
            vc = derived.vol_compression(close, cfg["crypto"]["rv_days"], cfg["crypto"]["range_days"]).iloc[-1]
            lim = cfg["crypto"]["compression_pct"]
            if vc["rv_pct"] < lim and vc["range_pct"] < lim:
                add(1, "Crypto", f"{item['name']} in a volatility compression (90d vol at p{vc['rv_pct']:.0f}, "
                                 f"180d range at p{vc['range_pct']:.0f}): a large move often follows.")
    out.sort(key=lambda s: -s["level"])
    return out


def summary_section(store: Store, cfg: dict) -> dict:
    return {**section_meta(store, cfg, "summary"), **regime(store, cfg),
            "tiles": key_tiles(store, cfg), "signals": signals(store, cfg)}


# --- section: today -------------------------------------------------------------------

def today_section(store: Store, cfg: dict) -> dict:
    spx, vix = frames.price(store, "^GSPC").dropna(), frames.series(store, "cboe:VIX").dropna()
    moves = []
    if not spx.empty and not vix.empty:
        m = calc.expected_move(spx.iloc[-1], vix.iloc[-1])
        moves.append({"name": "S&P 500", "available": True, "price": spx.iloc[-1],
                      "price_date": spx.index[-1].date().isoformat(), "vol_name": "VIX",
                      "vol": vix.iloc[-1], "vol_date": vix.index[-1].date().isoformat(),
                      "points": m, "pct": 100 * m / spx.iloc[-1],
                      "low": spx.iloc[-1] - m, "high": spx.iloc[-1] + m})
    return {**section_meta(store, cfg, "today"), "expected_moves": moves}


# --- section: stocks & breadth --------------------------------------------------------

def price_with_rsi(store: Store, ticker: str, name: str, tv: str, days: int = 730) -> dict:
    close = frames.price(store, ticker)
    if close.empty:
        return {"id": f"rsi-{ticker}", "title": name, "available": False}
    r = derived.rsi(close)
    return chart(f"rsi-{ticker}", f"{name}: price and RSI(14)", [
        panel([series_spec(name, _tail(close, days), "price"),
               series_spec("50d", _tail(close.rolling(50).mean(), days), "ma"),
               series_spec("200d", _tail(close.rolling(200).mean(), days), "ma")], height=0.65),
        panel([series_spec("RSI(14)", _tail(r, days), "ind")], hlines=[(30, "30"), (70, "70")],
              height=0.35, fmt="num0", bands=[(0, 30, "low"), (70, 100, "high")]),
    ], tv=tv)


def stocks_section(store: Store, cfg: dict) -> dict:
    b = cfg["breadth"]
    spx = frames.price(store, "^GSPC")
    days = int(b["chart_days"] * 365 / 252)
    outperform = frames.series(store, "drv:breadth:US:outperform")
    summation = frames.series(store, "drv:breadth:US:summation")
    charts = [
        chart("outperform", "S&P 500 and % of members beating the index (2 months)", [
            panel([series_spec("S&P 500", _tail(spx, days), "price")], height=0.6),
            panel([series_spec("% outperforming", outperform, "ind")],
                  hlines=[(cfg["signals"]["breadth_outperform_low"], ""),
                          (cfg["signals"]["breadth_outperform_high"], "")], height=0.4, fmt="pct0"),
        ], subtitle="Share of S&P 500 members whose 42-day return beats the index. Low = narrow market.",
              tv="SP:SPX"),
        chart("summation", "S&P 500 and McClellan summation index", [
            panel([series_spec("S&P 500", _tail(spx, days), "price")], height=0.6),
            panel([series_spec("Summation", summation, "ind")], hlines=[(0, "")], height=0.4),
        ], subtitle="Cumulative ratio-adjusted McClellan oscillator of the S&P 500 members' "
                    "advances and declines. Rising = broadening participation.", tv="SP:SPX"),
        chart("above-ma", "Members above their 50- and 200-day average", [
            panel([series_spec("S&P 500 > 50d", frames.series(store, "drv:breadth:US:above50"), "ind"),
                   series_spec("S&P 500 > 200d", frames.series(store, "drv:breadth:US:above200"), "ind"),
                   series_spec("Europe > 50d", frames.series(store, "drv:breadth:EU:above50"), "ind"),
                   series_spec("Europe > 200d", frames.series(store, "drv:breadth:EU:above200"), "ind")],
                  hlines=[(50, "")], fmt="pct0"),
        ], subtitle="Europe = Euro Stoxx 50, DAX and AEX members combined."),
    ]
    rsp, spy = frames.price(store, "RSP"), frames.price(store, "SPY")
    if not rsp.empty and not spy.empty:
        ratio = (rsp / spy).dropna()
        p = derived.percentile_of_last(ratio)
        charts.append(chart("rsp-spy", "Equal-weight vs cap-weight S&P 500 (RSP/SPY)", [
            panel([series_spec("RSP/SPY", _weekly(ratio), "ind"),
                   series_spec("40-week avg", _weekly(ratio).rolling(40).mean(), "ma")]),
        ], subtitle=f"Weekly since {ratio.index[0].year}. Latest at the {ordinal(p)} percentile of that history.",
              tv="AMEX:RSP/AMEX:SPY"))
    if not spx.empty:
        streak = derived.decline_streak(spx)
        streak = streak[streak.index >= "2000-01-01"]
        charts.append(chart("streak", "S&P 500: trading days without a 1% decline", [
            panel([series_spec("S&P 500", _weekly(spx[spx.index >= "2000-01-01"]), "price")], height=0.45),
            panel([series_spec("Days without −1%", streak.resample("W-FRI").max(), "ind", "bar")],
                  hlines=[(cfg["signals"]["streak_alert_days"], "")], height=0.55, fmt="num0"),
        ], subtitle=f"Current streak: {int(streak.iloc[-1])} days. Weekly maximum shown.", tv="SP:SPX"))
    charts.append(price_with_rsi(store, "QQQ", "QQQ", "QQQ"))
    charts.append(price_with_rsi(store, "SMH", "SMH (semiconductors)", "SMH"))

    us = cfg["prices"]["us_etfs"]
    eu = cfg["prices"]["eu_etfs"]
    us_rows = perf_rows(store, us["items"], us["benchmark"])
    eu_rows = perf_rows(store, eu["items"], eu["benchmark"])
    leaders = sorted([r for r in us_rows if r.get("rel_m1") is not None and r["ticker"] != "SPY"],
                     key=lambda r: r["rel_m1"], reverse=True)
    return {**section_meta(store, cfg, "stocks"), "charts": charts,
            "tables": {"us": us_rows, "eu": eu_rows},
            "leaders": [{"name": r["name"], "ticker": r["ticker"], "rel_m1": r["rel_m1"],
                         "rel_m3": r.get("rel_m3")} for r in leaders]}


# --- section: risk appetite ratios -----------------------------------------------------

def appetite_section(store: Store, cfg: dict) -> dict:
    p = cfg["prices"]
    charts = []
    for key, r in p["ratios"].items():
        num, den = frames.price(store, r["numerator"]), frames.price(store, r["denominator"])
        ratio = (num / den).dropna()
        if ratio.empty:
            charts.append({"id": f"ratio-{key}", "title": r["name"], "available": False})
            continue
        ma = ratio.rolling(p["ratio_ma_days"]).mean()
        days = int(p["ratio_chart_days"] * 365 / 252)
        above = ratio.iloc[-1] >= ma.iloc[-1]
        charts.append(chart(f"ratio-{key}", r["name"], [
            panel([series_spec(r["name"].split(" (")[0], _tail(ratio, days), "ind"),
                   series_spec(f"{p['ratio_ma_days']}d avg", _tail(ma, days), "ma")], fmt="sig"),
        ], subtitle=f"{'+ above' if above else '− below'} its {p['ratio_ma_days']}-day average",
              tv=f"{_tv_for(r['numerator'])}/{_tv_for(r['denominator'])}"))
    return {**section_meta(store, cfg, "appetite"), "charts": charts}


# --- section: volatility & sentiment ---------------------------------------------------

def volatility_section(store: Store, cfg: dict) -> dict:
    charts = []
    vix = {s: frames.series(store, f"cboe:{s}") for s in ("VIX9D", "VIX", "VIX3M")}
    if all(not s.empty for s in vix.values()):
        ratio = (vix["VIX"] / vix["VIX3M"]).dropna()
        charts.append(chart("vix-term", "VIX term structure", [
            panel([series_spec(k, _tail(v, 365), "ind") for k, v in vix.items()], height=0.6),
            panel([series_spec("VIX / VIX3M", _tail(ratio, 365), "ind")],
                  hlines=[(1.0, "backwardation above 1")], height=0.4, fmt="num2",
                  bands=[(1.0, 2.0, "high")]),
        ], subtitle="Contango (VIX below VIX3M) is normal; backwardation marks stress.", tv="CBOE:VIX"))
    move = frames.price(store, cfg["prices"]["volatility"]["move"])
    if not move.empty:
        p = derived.percentile_of_last(_tail(move, 365 * 3))
        charts.append(chart("move", "MOVE index (Treasury volatility)", [
            panel([series_spec("MOVE", _tail(move, 730), "ind"),
                   series_spec("50d", _tail(move.rolling(50).mean(), 730), "ma")]),
        ], subtitle=f"Latest {move.iloc[-1]:.0f}, {ordinal(p)} percentile of 3 years.", tv="TVC:MOVE"))
    days = int(cfg["cboe"]["chart_days"] * 365 / 252)
    for kind, title in (("equity", "Equity put/call ratio"), ("index", "Index put/call ratio")):
        pc = frames.series(store, f"pc:{kind}").dropna()
        if pc.empty:
            continue
        p = derived.percentile_of_last(pc.rolling(5).mean().dropna().iloc[-252:])
        charts.append(chart(f"pc-{kind}", title, [
            panel([series_spec("P/C", _tail(pc, days), "ref"),
                   series_spec("5-day avg", _tail(pc.rolling(5).mean(), days), "ind"),
                   series_spec("10-day avg", _tail(pc.rolling(10).mean(), days), "ind")], fmt="num2"),
        ], subtitle=f"5-day average at the {ordinal(p)} percentile of the last year. High = heavy hedging."))
    ndx = frames.price(store, "^NDX")
    if not ndx.empty:
        wk = derived.weekly_returns(ndx[ndx.index >= "2015-01-01"])
        charts.append(chart("ndx-weekly", "Nasdaq-100 weekly returns", [
            panel([series_spec("Nasdaq-100", _weekly(ndx[ndx.index >= "2015-01-01"]), "price")], height=0.5),
            panel([series_spec("Weekly %", wk, "ind", "bar")],
                  hlines=[(cfg["signals"]["weekly_drop_pct"], "")], height=0.5, fmt="pct1"),
        ], subtitle=f"Weeks down 5% or more cluster near lows. This week: {_signed(wk.iloc[-1], 1)}%.",
              tv="NASDAQ:NDX"))
    return {**section_meta(store, cfg, "volatility"), "charts": charts}


# --- section: positioning --------------------------------------------------------------

def positioning_section(store: Store, cfg: dict) -> dict:
    rows = [cot_summary(store, a) for a in cfg["cftc"]["assets"]]
    dates = [r["date"] for r in rows if r.get("date")]
    default = min((r for r in rows if r.get("pct_all") is not None),
                  key=lambda r: min(r["pct_all"], 100 - r["pct_all"]), default=None)
    return {**section_meta(store, cfg, "positioning"), "rows": rows,
            "report_date": max(dates) if dates else None,
            "default_key": default["key"] if default else None,
            "chart": cot_chart(store, cfg, default["key"]) if default else None}


# --- section: rates & credit -----------------------------------------------------------

def rates_section(store: Store, cfg: dict) -> dict:
    f = cfg["fred"]
    rows = []
    for sid, info in f["series"].items():
        s = frames.series(store, f"fred:{sid}").dropna()
        row = {"id": sid, "name": info["name"], "tv": info.get("tv"), "available": not s.empty}
        if not s.empty:
            def chg(n):
                return _num((s.iloc[-1] - s.iloc[-1 - n]) * 100) if len(s) > n else None
            spark = _tail(s, 92)
            row.update(value=s.iloc[-1], date=s.index[-1].date().isoformat(), d1=chg(1), w1=chg(5),
                       m1=chg(21), pct3y=derived.percentile_of_last(_tail(s, 365 * 3)),
                       spark=[_num(v) for v in spark.values])
        rows.append(row)
    charts = []
    two = frames.series(store, "fred:DGS2").dropna()
    if not two.empty:
        charts.append(chart("us2y", "US 2-year yield with moving averages", [
            panel([series_spec("2Y", _tail(two, 400), "price")] +
                  [series_spec(f"{d}d", _tail(two.rolling(d).mean(), 400), "ma") for d in (20, 50, 200)],
                  fmt="pct2"),
        ], tv="TVC:US02Y"))
    ten, wti = frames.series(store, "fred:DGS10").dropna(), frames.price(store, "CL=F")
    if not ten.empty and not wti.empty:
        corr = derived.rolling_corr(ten, wti, 60)
        charts.append(chart("oil-10y", "US 10Y yield vs WTI crude", [
            panel([series_spec("10Y yield", _tail(ten, 730), "price")], height=0.4, fmt="pct2"),
            panel([series_spec("WTI", _tail(wti, 730), "ind")], height=0.3),
            panel([series_spec("60d correlation of daily changes", _tail(corr, 730), "ind")],
                  hlines=[(0, "")], height=0.3, fmt="num2"),
        ], subtitle="When oil and yields move together, inflation fears drive rates."))
    hy = frames.series(store, "fred:BAMLH0A0HYM2").dropna()
    if not hy.empty:
        p = derived.percentile_of_last(hy)
        charts.append(chart("hy", "US high-yield spread (OAS)", [
            panel([series_spec("HY OAS", hy, "ind"), series_spec("50d", hy.rolling(50).mean(), "ma")],
                  fmt="pct2"),
        ], subtitle=f"{hy.iloc[-1]:.2f}%, {ordinal(p)} percentile of the period shown. Widening = credit stress.",
              tv="FRED:BAMLH0A0HYM2"))
    zn = frames.price(store, "ZN=F")
    if not zn.empty:
        charts.append(chart("ty", "10Y T-Note futures (TY)", [
            panel([series_spec("TY", _tail(zn, 1000), "price")] +
                  [series_spec(f"{d}d", _tail(zn.rolling(d).mean(), 1000), "ma") for d in (50, 100, 200)]),
        ], subtitle="Bond price: up = yields down.", tv="CBOT:ZN1!"))
    return {**section_meta(store, cfg, "rates"), "rows": rows, "charts": charts}


# --- sections: dollar, commodities, crypto, asia ---------------------------------------

def _cot_extra(store, cfg):
    by_key = {a["key"]: a for a in cfg["cftc"]["assets"]}

    def extra(item):
        key = item.get("cot") if isinstance(item, dict) else None
        if not key or key not in by_key:
            return {}
        row = cot_summary(store, by_key[key])
        return {"cot_pct": row.get("pct_all"), "cot_key": key}
    return extra


def weekly_with_ma(store: Store, ticker: str, name: str, tv: str, weeks: int = 200, years: int = 6) -> dict:
    close = frames.price(store, ticker)
    if close.empty:
        return {"id": f"wk-{ticker}", "title": name, "available": False}
    wk = _weekly(close)
    ma = wk.rolling(weeks).mean()
    start = wk.index[-1] - pd.DateOffset(years=years)
    return chart(f"wk-{ticker}", f"{name}, weekly", [
        panel([series_spec(name, wk[wk.index >= start], "price"),
               series_spec(f"{weeks}-week avg", ma[ma.index >= start], "ma")]),
    ], tv=tv)


def dollar_section(store: Store, cfg: dict) -> dict:
    items = cfg["prices"]["dollar"]
    return {**section_meta(store, cfg, "dollar"),
            "rows": perf_rows(store, items, None, _cot_extra(store, cfg)),
            "charts": [weekly_with_ma(store, i["ticker"], i["name"], i["tv"]) for i in items[:2]]
            + [cot_chart(store, cfg, "usd"), cot_chart(store, cfg, "eur")]}


def commodities_section(store: Store, cfg: dict) -> dict:
    items = cfg["prices"]["commodities"]
    return {**section_meta(store, cfg, "commodities"),
            "rows": perf_rows(store, items, None, _cot_extra(store, cfg)),
            "charts": [cot_chart(store, cfg, "gold"), cot_chart(store, cfg, "wti"),
                       cot_chart(store, cfg, "copper"), weekly_with_ma(store, "GDX", "Gold miners (GDX)", "GDX", 40, 3)]}


def crypto_section(store: Store, cfg: dict) -> dict:
    c = cfg["crypto"]
    items = cfg["prices"]["crypto"]
    charts = []

    def extra(item):
        out = _cot_extra(store, cfg)(item)
        close = frames.price(store, item["ticker"])
        if len(close) > 400:
            vc = derived.vol_compression(close, c["rv_days"], c["range_days"]).iloc[-1]
            out.update(rv_pct=_num(vc["rv_pct"]), range_pct=_num(vc["range_pct"]),
                       compression=bool(vc["rv_pct"] < c["compression_pct"]
                                        and vc["range_pct"] < c["compression_pct"]))
        return out

    for item in items[:2]:
        close = frames.price(store, item["ticker"])
        if close.empty:
            continue
        vc = derived.vol_compression(close, c["rv_days"], c["range_days"])
        charts.append(chart(f"crypto-{item['ticker']}", f"{item['name']}: price and volatility compression", [
            panel([series_spec(item["name"], _tail(close, 730), "price"),
                   series_spec("50d", _tail(close.rolling(50).mean(), 730), "ma"),
                   series_spec("200d", _tail(close.rolling(200).mean(), 730), "ma")], height=0.6),
            panel([series_spec(f"{c['rv_days']}d realized vol, percentile", _tail(vc["rv_pct"], 730), "ind"),
                   series_spec(f"{c['range_days']}d range, percentile", _tail(vc["range_pct"], 730), "ind")],
                  hlines=[(c["compression_pct"], "")], height=0.4, fmt="pct0",
                  bands=[(0, c["compression_pct"], "low")]),
        ], subtitle="Compression = both percentiles below the line: quiet markets that tend to end in a big move.",
              tv=item["tv"]))
    eth, btc = frames.price(store, "ETH-USD"), frames.price(store, "BTC-USD")
    if not eth.empty and not btc.empty:
        ratio = (eth / btc).dropna()
        charts.append(chart("eth-btc", "ETH / BTC", [
            panel([series_spec("ETH/BTC", _tail(ratio, 730), "ind"),
                   series_spec("50d", _tail(ratio.rolling(50).mean(), 730), "ma")], fmt="sig"),
        ], tv="BINANCE:ETHBTC"))
    charts.append(cot_chart(store, cfg, "bitcoin", years=8))
    return {**section_meta(store, cfg, "crypto"), "rows": perf_rows(store, items, "SPY", extra),
            "charts": charts}


def asia_section(store: Store, cfg: dict) -> dict:
    items = cfg["prices"]["asia"]
    charts = []
    for item in items[:2]:
        close = frames.price(store, item["ticker"])
        if close.empty:
            continue
        charts.append(chart(f"asia-{item['ticker']}", item["name"], [
            panel([series_spec(item["name"], _tail(close, 730), "price"),
                   series_spec("50d", _tail(close.rolling(50).mean(), 730), "ma"),
                   series_spec("200d", _tail(close.rolling(200).mean(), 730), "ma")]),
        ], tv=item["tv"]))
    ewy, smh = frames.price(store, "EWY"), frames.price(store, "SMH")
    if not ewy.empty and not smh.empty:
        ratio = (ewy / smh).dropna()
        charts.append(chart("ewy-smh", "Korea vs US semiconductors (EWY / SMH)", [
            panel([series_spec("EWY/SMH", _tail(ratio, 730), "ind"),
                   series_spec("50d", _tail(ratio.rolling(50).mean(), 730), "ma")], fmt="sig"),
        ], subtitle="Korea (Samsung, SK Hynix) often moves first in the chip cycle.", tv="EWY/SMH"))
    return {**section_meta(store, cfg, "asia"), "rows": perf_rows(store, items, "SPY"),
            "charts": charts}


# --- section: index positioning (COT for the big US stock index futures) ---------------

def _list(s: pd.Series, nd: int | None = None) -> list:
    return [None if v is None or (isinstance(v, float) and math.isnan(v)) else
            (round(float(v), nd) if nd is not None else float(v)) for v in s.values]


def index_cot(store: Store, cfg: dict, asset: dict) -> dict:
    """Daily index price plus weekly net positions and percentiles of every trader group."""
    price = frames.price(store, asset["price"]).dropna()
    price = price[price.index >= cfg["cftc"]["history_start"]]
    ma50, ma200 = price.rolling(50).mean(), price.rolling(200).mean()
    if not price.empty:
        # Daily for the last 3 years, weekly before that: same picture, a third of the data.
        cut = price.index[-1] - pd.DateOffset(years=3)
        price = pd.concat([_weekly(price[price.index < cut]), price[price.index >= cut]])
    oi = frames.series(store, f"cot:{asset['key']}:oi").dropna()
    out = {"key": asset["key"], "label": asset["label"], "default_group": asset["cohort"],
           "tv": next((i["tv"] for i in cfg["prices"]["indices"].values() if i["ticker"] == asset["price"]),
                      asset["price"].replace("^", "")),
           "price": {"dates": [d.date().isoformat() for d in price.index], "close": _list(price, 1),
                     "ma50": _list(ma50.reindex(price.index, method="ffill"), 1),
                     "ma200": _list(ma200.reindex(price.index, method="ffill"), 1)},
           "available": not oi.empty}
    if oi.empty:
        return out
    groups = {}
    for g in ("am", "lf", "dealer"):
        net = frames.series(store, f"cot:{asset['key']}:g:{g}").reindex(oi.index)
        if net.dropna().empty:
            continue
        ratio = net / oi.replace(0, np.nan)
        stats = {k: _num(v) if not isinstance(v, str) else v
                 for k, v in derived.cot_percentiles(net.dropna(), oi).items()}
        stats["change_4w"] = _num(net.iloc[-1] - net.iloc[-5]) if len(net) > 4 else None
        stats["label"] = derived.positioning_label(stats.get("pct_all"))
        name, about = explain.GROUPS[g]
        groups[g] = {"name": name, "about": about, "stats": stats,
                     "net": _list(net, 0),
                     "pct_all": _list(derived.expanding_percentile(ratio), 0),
                     "pct_5y": _list(derived.rolling_percentile(ratio, 260), 0),
                     "pct_1y": _list(derived.rolling_percentile(ratio, 52), 0)}
    out["cot"] = {"dates": [d.date().isoformat() for d in oi.index], "oi": _list(oi, 0), "groups": groups}
    return out


def indexcot_section(store: Store, cfg: dict) -> dict:
    by_key = {a["key"]: a for a in cfg["cftc"]["assets"]}
    indices = [index_cot(store, cfg, by_key[k]) for k in cfg["cftc"]["index_view"]]
    dates = [i["cot"]["dates"][-1] for i in indices if i.get("cot")]
    return {**section_meta(store, cfg, "indexcot"), "indices": indices,
            "report_date": max(dates) if dates else None, "howto": explain.INDEX_COT_HOWTO}


BUILDERS = {
    "summary": summary_section, "indexcot": indexcot_section, "today": today_section, "stocks": stocks_section,
    "appetite": appetite_section, "volatility": volatility_section,
    "positioning": positioning_section, "rates": rates_section, "dollar": dollar_section,
    "commodities": commodities_section, "crypto": crypto_section, "asia": asia_section,
}


def dashboard(store: Store, cfg: dict) -> dict:
    """All sections; one failing section never takes down the others."""
    out = {"generated_at": datetime.now(cfg["tz"]).strftime("%a %d %b %H:%M"),
           "columns": explain.COLUMNS}
    for name, build in BUILDERS.items():
        try:
            out[name] = build(store, cfg)
            for c in out[name].get("charts", []) + [out[name].get("chart") or {}]:
                if c.get("id") and not c.get("explain"):
                    c["explain"] = explain.chart_text(c["id"])
        except Exception as exc:
            out[name] = {"error": f"{type(exc).__name__}: {exc}", "warnings": [], "updated_at": None}
    return out
