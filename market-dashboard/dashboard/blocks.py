"""Builds the JSON for each dashboard block from the SQLite cache."""

from __future__ import annotations

from datetime import datetime

from . import calc
from .calc import NODATA, Indicator
from .db import Store

BLOCK_SOURCES = {
    "regime": ("prices", "components", "cboe_vix", "cboe_pc", "fred"),
    "today": ("prices", "cboe_vix"),
    "rates": ("fred",),
    "positioning": ("cftc", "cboe_pc", "cboe_vix"),
    "riskonoff": ("prices",),
}
SOURCE_NAMES = {
    "prices": "Yahoo Finance (index and ETF prices)",
    "components": "Yahoo Finance (index members)",
    "cboe_vix": "CBOE (VIX indices)",
    "cboe_pc": "CBOE (put/call ratios)",
    "fred": "FRED",
    "cftc": "CFTC (COT)",
}


def _fmt_time(stamp: str | None, tz) -> str | None:
    if not stamp:
        return None
    return datetime.fromisoformat(stamp).astimezone(tz).strftime("%a %d %b %H:%M")


def block_meta(store: Store, cfg: dict, block: str) -> dict:
    """'Updated at' plus a warning for every source whose latest refresh failed."""
    tz = cfg["tz"]
    successes, warnings = [], []
    for src in BLOCK_SOURCES[block]:
        st = store.status(src)
        if st["last_success"]:
            successes.append(st["last_success"])
        if st["last_error"]:
            when = _fmt_time(st["last_attempt"], tz)
            last_ok = _fmt_time(st["last_success"], tz)
            fallback = (f"showing data stored {last_ok}" if last_ok
                        else "no stored data yet")
            warnings.append(f"{SOURCE_NAMES[src]}: refresh failed {when} "
                            f"({st['last_error']}); {fallback}.")
    return {"updated_at": _fmt_time(max(successes), tz) if successes else None,
            "warnings": warnings}


def _values(store: Store, key: str) -> tuple[list[str], list[float]]:
    rows = store.series(key)
    return [r[0] for r in rows], [r[1] for r in rows]


def _fmt(x: float, nd: int = 2) -> str:
    return f"{x:,.{nd}f}"


def _signed(x: float, nd: int = 2) -> str:
    return f"{'+' if x > 0 else '−' if x < 0 else '±'}{abs(x):,.{nd}f}"


# --- block 1: regime ---------------------------------------------------------------

def _trend(store, cfg, key, info) -> Indicator:
    rc = cfg["regime"]["trend"]
    dates, closes = _values(store, f"px:{info['ticker']}")
    label = f"Trend {info['name']}"
    pos = calc.ma_position(closes, rc["moving_averages"])
    if not closes or any(v is None for v in pos.values()):
        return Indicator(f"trend_{key}", label, NODATA, "no data",
                         "Not enough price history for the moving averages.", "Trend")
    above = sum(pos.values())
    parts = [f"MA{d} {_fmt(calc.sma(closes, d))} ({'above' if pos[d] else 'below'})"
             for d in rc["moving_averages"]]
    reason = (f"Close {_fmt(closes[-1])} on {dates[-1]}: " + ", ".join(parts) +
              f". Green when above ≥ {rc['green_min_above']}, orange when above "
              f"≥ {rc['orange_min_above']}, otherwise red.")
    color = calc.trend_color(above, rc["green_min_above"], rc["orange_min_above"])
    return Indicator(f"trend_{key}", label, color,
                     f"above {above}/{len(rc['moving_averages'])} MAs", reason, "Trend")


def breadth_for(store, members: list[str]) -> tuple[float | None, int, float | None, int]:
    closes = {t: _values(store, f"px:{t}")[1] for t in members}
    p50, n50 = calc.breadth(closes, 50)
    p200, n200 = calc.breadth(closes, 200)
    return p50, n50, p200, n200


def _breadth(store, cfg, key, name) -> Indicator:
    rc = cfg["regime"]["breadth"]
    members = cfg["breadth_components"][key]
    p50, n50, p200, n200 = breadth_for(store, members)
    label = f"Breadth {name}"
    if p50 is None or p200 is None:
        return Indicator(f"breadth_{key}", label, NODATA, "no data",
                         "Not enough member price history yet.", "Breadth")
    reason = (f"{p50:.0f}% of {n50} members above their 50-day MA, {p200:.0f}% of {n200} above "
              f"their 200-day MA ({len(members)} members configured). Green when both "
              f"≥ {rc['green_min_pct']}%, red when both ≤ {rc['red_max_pct']}%, otherwise orange.")
    color = calc.breadth_color(p50, p200, rc["green_min_pct"], rc["red_max_pct"])
    return Indicator(f"breadth_{key}", label, color,
                     f"50d {p50:.0f}% · 200d {p200:.0f}%", reason, "Breadth")


def _vix_level(store, cfg) -> Indicator:
    rc = cfg["regime"]["vix_level"]
    dates, vix = _values(store, "cboe:VIX")
    if not vix:
        return Indicator("vix", "VIX level", NODATA, "no data", "No VIX data yet.", "Volatility")
    reason = (f"VIX {vix[-1]:.2f} on {dates[-1]}. Green below {rc['green_below']}, "
              f"red above {rc['red_above']}, orange in between.")
    return Indicator("vix", "VIX level", calc.color_band(vix[-1], rc["green_below"], rc["red_above"]),
                     f"{vix[-1]:.2f}", reason, "Volatility")


def term_structure(store) -> dict | None:
    latest = {}
    for sym in ("VIX9D", "VIX", "VIX3M"):
        dates, vals = _values(store, f"cboe:{sym}")
        if not vals:
            return None
        latest[sym] = (dates[-1], vals[-1])
    return latest


def _vix_term(store, cfg) -> Indicator:
    rc = cfg["regime"]["vix_term_structure"]
    ts = term_structure(store)
    if not ts:
        return Indicator("vix_term", "VIX term structure", NODATA, "no data",
                         "Missing VIX9D, VIX or VIX3M data.", "Volatility")
    v9, v, v3 = ts["VIX9D"][1], ts["VIX"][1], ts["VIX3M"][1]
    ratio = v / v3
    state = "contango" if ratio < 1 else "backwardation"
    reason = (f"VIX9D {v9:.2f} / VIX {v:.2f} / VIX3M {v3:.2f} ({ts['VIX'][0]}). "
              f"VIX/VIX3M = {ratio:.3f} → {state}. Green below {rc['green_below']}, "
              f"red at ≥ {rc['red_above']}, orange in between.")
    color = calc.term_structure_color(v, v3, rc["green_below"], rc["red_above"])
    return Indicator("vix_term", "VIX term structure", color,
                     f"{state} ({ratio:.2f})", reason, "Volatility")


def _vstoxx(store, cfg) -> Indicator:
    rc = cfg["regime"]["vstoxx_level"]
    dates, vals = _values(store, f"px:{cfg['prices'].get('vstoxx_ticker')}")
    if not vals:
        return Indicator("vstoxx", "VSTOXX level", NODATA, "n/a",
                         "No free VSTOXX data from the configured source; not counted.",
                         "Volatility")
    reason = (f"VSTOXX {vals[-1]:.2f} on {dates[-1]}. Green below {rc['green_below']}, "
              f"red above {rc['red_above']}, orange in between.")
    return Indicator("vstoxx", "VSTOXX level",
                     calc.color_band(vals[-1], rc["green_below"], rc["red_above"]),
                     f"{vals[-1]:.2f}", reason, "Volatility")


def put_call_percentile(values: list[float], avg_days: int, lookback: int) -> tuple[float, float] | None:
    """(latest N-day average, its percentile among the N-day averages of the lookback window)."""
    avgs = [a for a in calc.rolling_mean(values, avg_days) if a is not None]
    if not avgs:
        return None
    window = avgs[-lookback:]
    return avgs[-1], calc.percentile_rank(window, avgs[-1])


def _put_call(store, cfg) -> Indicator:
    rc = cfg["regime"]["put_call"]
    dates, vals = _values(store, "pc:equity")
    res = put_call_percentile(vals, rc["average_days"], rc["lookback_days"])
    if not res:
        return Indicator("put_call", "Equity put/call", NODATA, "no data",
                         "No CBOE put/call history yet.", "Sentiment")
    avg, pct = res
    n = min(len(vals), rc["lookback_days"])
    reason = (f"{rc['average_days']}-day average equity P/C {avg:.2f} (latest {vals[-1]:.2f} on "
              f"{dates[-1]}) is at the {pct:.0f}th percentile of the last {n} trading days. "
              f"Green below the {rc['green_below_pct']}th, red above the {rc['red_above_pct']}th "
              f"percentile (high = heavy hedging).")
    color = calc.color_band(pct, rc["green_below_pct"], rc["red_above_pct"])
    return Indicator("put_call", "Equity put/call", color, f"{avg:.2f} (p{pct:.0f})", reason,
                     "Sentiment")


def _credit(store, cfg) -> Indicator:
    rc = cfg["regime"]["credit"]
    dates, vals = _values(store, "fred:BAMLH0A0HYM2")
    if len(vals) <= rc["change_days"]:
        return Indicator("credit", "High-yield spread", NODATA, "no data",
                         "Not enough FRED high-yield spread history.", "Credit")
    change_bp = (vals[-1] - vals[-1 - rc["change_days"]]) * 100
    reason = (f"HY OAS {vals[-1]:.2f}% on {dates[-1]}, {_signed(change_bp, 0)} bp over "
              f"{rc['change_days']} days. Green when ≤ {rc['green_max_level']}% and change "
              f"≤ {rc['green_max_change_bp']:+g} bp; red when ≥ {rc['red_min_level']}% or change "
              f"≥ {rc['red_min_change_bp']:+g} bp; otherwise orange.")
    return Indicator("credit", "High-yield spread", calc.credit_color(vals[-1], change_bp, rc),
                     f"{vals[-1]:.2f}% ({_signed(change_bp, 0)} bp)", reason, "Credit")


def _curve(store, cfg) -> Indicator:
    rc = cfg["regime"]["yield_curve"]
    dates, vals = _values(store, "fred:T10Y2Y")
    if not vals:
        return Indicator("curve", "Yield curve 2s10s", NODATA, "no data",
                         "No FRED 2s10s data yet.", "Rates")
    reason = (f"10Y − 2Y = {_signed(vals[-1])} pp on {dates[-1]}. Green above "
              f"{rc['green_above']:+g}, red below {rc['red_below']:+g}, orange in between.")
    return Indicator("curve", "Yield curve 2s10s",
                     calc.curve_color(vals[-1], rc["green_above"], rc["red_below"]),
                     f"{_signed(vals[-1])} pp", reason, "Rates")


def regime_block(store: Store, cfg: dict) -> dict:
    idx = cfg["prices"]["indices"]
    indicators = [_trend(store, cfg, k, v) for k, v in idx.items()]
    indicators += [_breadth(store, cfg, k, idx[k]["name"] if k in idx else k)
                   for k in cfg["breadth_components"]]
    indicators += [_vix_level(store, cfg), _vix_term(store, cfg), _vstoxx(store, cfg),
                   _put_call(store, cfg), _credit(store, cfg), _curve(store, cfg)]
    vc = cfg["regime"]["verdict"]
    verdict = calc.regime_verdict([i.color for i in indicators],
                                  vc["risk_on_min_pct"], vc["risk_off_max_pct"])
    return {**block_meta(store, cfg, "regime"),
            "indicators": [i.__dict__ for i in indicators],
            "verdict": verdict.__dict__}


# --- block 2: today ----------------------------------------------------------------

def _expected(name, price_dates, prices, vol_name, vol_dates, vols) -> dict:
    if not prices or not vols:
        return {"name": name, "available": False,
                "note": f"No {vol_name} data available." if not vols else "No price data."}
    move = calc.expected_move(prices[-1], vols[-1])
    return {"name": name, "available": True, "price": prices[-1], "price_date": price_dates[-1],
            "vol_name": vol_name, "vol": vols[-1], "vol_date": vol_dates[-1],
            "points": move, "pct": 100.0 * move / prices[-1],
            "low": prices[-1] - move, "high": prices[-1] + move}


def today_block(store: Store, cfg: dict) -> dict:
    idx = cfg["prices"]["indices"]
    spx_d, spx = _values(store, f"px:{idx['SPX']['ticker']}")
    vix_d, vix = _values(store, "cboe:VIX")
    sx_d, sx = _values(store, f"px:{idx['SX5E']['ticker']}")
    vs_d, vs = _values(store, f"px:{cfg['prices'].get('vstoxx_ticker')}")
    return {**block_meta(store, cfg, "today"),
            "expected_moves": [_expected("S&P 500", spx_d, spx, "VIX", vix_d, vix),
                               _expected("Euro Stoxx 50", sx_d, sx, "VSTOXX", vs_d, vs)]}


# --- block 3: rates ----------------------------------------------------------------

def rates_block(store: Store, cfg: dict) -> dict:
    f = cfg["fred"]
    rows = []
    for series_id, name in f["series"].items():
        dates, vals = _values(store, f"fred:{series_id}")
        row = {"id": series_id, "name": name, "available": bool(vals)}
        if vals:
            row.update(value=vals[-1], date=dates[-1],
                       change_bp=(vals[-1] - vals[-2]) * 100 if len(vals) > 1 else None,
                       spark_dates=dates[-f["sparkline_days"]:],
                       spark=vals[-f["sparkline_days"]:])
        rows.append(row)
    return {**block_meta(store, cfg, "rates"), "rows": rows}


# --- block 4: positioning ----------------------------------------------------------

def cot_summary(dates: list[str], nets: list[float], index_weeks: int) -> dict:
    return {"net": nets[-1],
            "change": nets[-1] - nets[-2] if len(nets) > 1 else None,
            "cot_index": calc.cot_index(nets[-index_weeks:]),
            "date": dates[-1]}


def _chart_series(dates, vals, days, mas=()) -> dict:
    out = {"dates": dates[-days:], "values": vals[-days:]}
    for m in mas:
        out[f"ma{m}"] = calc.rolling_mean(vals, m)[-days:]
    return out


def positioning_block(store: Store, cfg: dict) -> dict:
    c = cfg["cftc"]
    contracts, report_dates = [], []
    for code, name in c["contracts"].items():
        row = {"code": code, "name": name, "available": False}
        for group in ("lev", "am"):
            dates, nets = _values(store, f"cot:{code}:{group}")
            if nets:
                row[group] = cot_summary(dates, nets, c["index_weeks"])
                row["available"] = True
                report_dates.append(dates[-1])
        contracts.append(row)
    days = cfg["cboe"]["chart_days"]
    put_call = {}
    for kind in ("equity", "index"):
        dates, vals = _values(store, f"pc:{kind}")
        put_call[kind] = _chart_series(dates, vals, days, (5, 10))
    vix = {sym: dict(zip(*_values(store, f"cboe:{sym}"))) for sym in cfg["cboe"]["vix_symbols"]}
    common = sorted(set.intersection(*(set(v) for v in vix.values()))) if vix else []
    common = common[-days:]
    return {**block_meta(store, cfg, "positioning"),
            "report_date": max(report_dates) if report_dates else None,
            "contracts": contracts, "put_call": put_call,
            "vix_term": {"dates": common,
                         **{sym: [vix[sym][d] for d in common] for sym in vix}}}


# --- block 5: risk-on/off ratios ---------------------------------------------------

def ratio_series(num: dict[str, float], den: dict[str, float]) -> tuple[list[str], list[float]]:
    dates = sorted(d for d in set(num) & set(den) if den[d])
    return dates, [num[d] / den[d] for d in dates]


def riskonoff_block(store: Store, cfg: dict) -> dict:
    p = cfg["prices"]
    charts = []
    for key, r in p["ratios"].items():
        num = dict(store.series(f"px:{r['numerator']}"))
        den = dict(store.series(f"px:{r['denominator']}"))
        dates, vals = ratio_series(num, den)
        chart = {"key": key, "name": r["name"], "available": bool(vals),
                 "ma_days": p["ratio_ma_days"]}
        if vals:
            series = _chart_series(dates, vals, p["ratio_chart_days"], (p["ratio_ma_days"],))
            chart.update(dates=series["dates"], values=series["values"],
                         ma=series[f"ma{p['ratio_ma_days']}"])
        charts.append(chart)
    return {**block_meta(store, cfg, "riskonoff"), "charts": charts}


def dashboard(store: Store, cfg: dict) -> dict:
    """All blocks; one failing block never takes down the others."""
    builders = {"regime": regime_block, "today": today_block, "rates": rates_block,
                "positioning": positioning_block, "riskonoff": riskonoff_block}
    out = {"generated_at": datetime.now(cfg["tz"]).strftime("%a %d %b %H:%M")}
    for name, build in builders.items():
        try:
            out[name] = build(store, cfg)
        except Exception as exc:
            out[name] = {"error": f"{type(exc).__name__}: {exc}", "warnings": [], "updated_at": None}
    return out

