"""Indicator maths on pandas series and frames. Pure functions, no I/O."""

from __future__ import annotations

import numpy as np
import pandas as pd


def pct_above_ma(frame: pd.DataFrame, days: int) -> pd.Series:
    """Per date: % of columns whose close is above their own `days`-day average.

    Members without enough history on a date are left out of that date's count.
    """
    ma = frame.rolling(days, min_periods=days).mean()
    valid = ma.notna() & frame.notna()
    above = (frame > ma) & valid
    count = valid.sum(axis=1)
    return (100.0 * above.sum(axis=1) / count).where(count > 0)


def pct_outperforming(frame: pd.DataFrame, index: pd.Series, days: int) -> pd.Series:
    """Per date: % of members whose `days`-day return beats the index's `days`-day return."""
    member_ret = frame / frame.shift(days) - 1
    index_ret = (index / index.shift(days) - 1).reindex(frame.index)
    valid = member_ret.notna() & index_ret.notna().values[:, None]
    beats = member_ret.gt(index_ret, axis=0) & valid
    count = valid.sum(axis=1)
    return (100.0 * beats.sum(axis=1) / count).where(count > 0)


def mcclellan(frame: pd.DataFrame, fast: int = 19, slow: int = 39) -> pd.DataFrame:
    """Ratio-adjusted McClellan oscillator and summation index from member closes.

    Net advances = (advancers - decliners) / (advancers + decliners) x 1000, so the result
    does not depend on how many members have data on a given day.
    """
    change = frame.diff()
    adv = (change > 0).sum(axis=1)
    dec = (change < 0).sum(axis=1)
    total = (adv + dec).replace(0, np.nan)
    net = (1000.0 * (adv - dec) / total).iloc[1:]
    osc = net.ewm(span=fast, adjust=False).mean() - net.ewm(span=slow, adjust=False).mean()
    return pd.DataFrame({"net": net, "oscillator": osc, "summation": osc.cumsum()})


def rsi(close: pd.Series, days: int = 14) -> pd.Series:
    """Wilder's relative strength index."""
    delta = close.diff()
    gain = delta.clip(lower=0).ewm(alpha=1 / days, adjust=False, min_periods=days).mean()
    loss = (-delta.clip(upper=0)).ewm(alpha=1 / days, adjust=False, min_periods=days).mean()
    rs = gain / loss
    return 100 - 100 / (1 + rs)


def decline_streak(close: pd.Series, threshold_pct: float = -1.0) -> pd.Series:
    """Trading days since the last daily change at or below `threshold_pct` percent."""
    hit = (close.pct_change() * 100 <= threshold_pct).to_numpy()
    out, run = [], 0
    for h in hit:
        run = 0 if h else run + 1
        out.append(run)
    return pd.Series(out, index=close.index)


def weekly_returns(close: pd.Series) -> pd.Series:
    """Friday-to-Friday % change (the last week may still be in progress)."""
    weekly = close.resample("W-FRI").last().dropna()
    return weekly.pct_change().dropna() * 100


def rolling_corr(a: pd.Series, b: pd.Series, days: int) -> pd.Series:
    """Rolling correlation of daily changes."""
    joined = pd.concat([a.diff(), b.diff()], axis=1, join="inner").dropna()
    return joined.iloc[:, 0].rolling(days).corr(joined.iloc[:, 1])


def percentile_of_last(values: pd.Series) -> float | None:
    """Percentile (0-100) of the latest value within the series."""
    values = values.dropna()
    if values.empty:
        return None
    return float(100.0 * (values <= values.iloc[-1]).mean())


def expanding_percentile(values: pd.Series, min_periods: int = 52) -> pd.Series:
    """Each point's percentile within all data up to and including it (no look-ahead)."""
    arr = values.to_numpy(dtype=float)
    out = np.full(len(arr), np.nan)
    for i in range(min_periods - 1, len(arr)):
        window = arr[: i + 1]
        window = window[~np.isnan(window)]
        if len(window):
            out[i] = 100.0 * (window <= arr[i]).mean()
    return pd.Series(out, index=values.index)


def rolling_percentile(values: pd.Series, window: int, min_periods: int | None = None) -> pd.Series:
    """Each point's percentile within the trailing `window` observations (including itself)."""
    min_periods = min_periods or max(2, window // 4)
    return values.rolling(window, min_periods=min_periods).apply(
        lambda w: 100.0 * (w[~np.isnan(w)] <= w[-1]).mean(), raw=True)


def positioning_label(pct: float | None) -> str:
    """Words for a positioning percentile, relative to the group's own history."""
    if pct is None or np.isnan(pct):
        return "No data"
    if pct >= 90:
        return "Extremely long"
    if pct >= 70:
        return "Longer than usual"
    if pct > 30:
        return "Normal"
    if pct > 10:
        return "Shorter than usual"
    return "Extremely short"


def cot_percentiles(net: pd.Series, oi: pd.Series) -> dict:
    """Latest COT net position as percentile: net/OI over all history, 5 years and 1 year,
    and the raw net contracts over all history."""
    ratio = (net / oi.replace(0, np.nan)).dropna()
    if ratio.empty:
        return {}
    end = ratio.index[-1]

    def since(years: int) -> pd.Series:
        return ratio[ratio.index > end - pd.DateOffset(years=years)]

    return {
        "net": float(net.iloc[-1]),
        "change": float(net.iloc[-1] - net.iloc[-2]) if len(net) > 1 else None,
        "net_oi_pct": float(100 * ratio.iloc[-1]),
        "pct_all": percentile_of_last(ratio),
        "pct_5y": percentile_of_last(since(5)),
        "pct_1y": percentile_of_last(since(1)),
        "pct_nominal": percentile_of_last(net),
        "since": ratio.index[0].date().isoformat(),
        "date": end.date().isoformat(),
    }


def vol_compression(close: pd.Series, rv_days: int = 90, range_days: int = 180,
                    lookback: int = 1460) -> pd.DataFrame:
    """Realized volatility and trading-range width, each as a trailing percentile.

    A compression regime is when both sit in their lowest percentiles: quiet price action
    that tends to end in a large move (direction unknown).
    """
    logret = np.log(close).diff()
    rv = logret.rolling(rv_days).std() * np.sqrt(365) * 100
    width = (close.rolling(range_days).max() / close.rolling(range_days).min() - 1) * 100

    def trailing_pct(s: pd.Series) -> pd.Series:
        return s.rolling(lookback, min_periods=rv_days).apply(
            lambda w: 100.0 * (w <= w[-1]).mean(), raw=True)

    return pd.DataFrame({"rv": rv, "rv_pct": trailing_pct(rv),
                         "range": width, "range_pct": trailing_pct(width)})


def performance(close: pd.Series, bench: pd.Series | None = None) -> dict:
    """Returns over 1 week / 1 month / 3 months, relative returns vs a benchmark,
    position vs the 50- and 200-day average and RSI."""
    close = close.dropna()
    out: dict = {"last": float(close.iloc[-1]), "date": close.index[-1].date().isoformat()}
    for label, days in (("d1", 1), ("w1", 5), ("m1", 21), ("m3", 63), ("y1", 252)):
        out[label] = (float(100 * (close.iloc[-1] / close.iloc[-1 - days] - 1))
                      if len(close) > days else None)
    prior = close[close.index.year < close.index[-1].year]
    out["ytd"] = float(100 * (close.iloc[-1] / prior.iloc[-1] - 1)) if not prior.empty else None
    if bench is not None:
        bench = bench.dropna()
        for label, days in (("rel_m1", 21), ("rel_m3", 63)):
            if len(bench) > days and out.get(label[4:]) is not None:
                b = 100 * (bench.iloc[-1] / bench.iloc[-1 - days] - 1)
                out[label] = out[label[4:]] - float(b)
            else:
                out[label] = None
    for days in (50, 200):
        ma = close.rolling(days).mean().iloc[-1]
        out[f"vs{days}"] = None if np.isnan(ma) else float(100 * (close.iloc[-1] / ma - 1))
    r = rsi(close).iloc[-1] if len(close) > 15 else np.nan
    out["rsi"] = None if np.isnan(r) else float(r)
    return out


# --- cards on the overview grid -----------------------------------------------------

def trailing_percentile(values: pd.Series, window: int = 252, min_periods: int = 60) -> pd.Series:
    """Percentile of each value within the trailing `window` observations (no look-ahead)."""
    return values.rolling(window, min_periods=min_periods).apply(
        lambda w: 100.0 * (w[~np.isnan(w)] <= w[-1]).mean(), raw=True)


FEAR_GREED_PARTS = ("momentum", "volatility", "breadth", "safe_haven", "junk")


def fear_greed(spx: pd.Series, vix: pd.Series, above50: pd.Series, stocks: pd.Series,
               bonds: pd.Series, hy_oas: pd.Series, window: int = 252) -> pd.DataFrame:
    """Five market signals, each scored 0-100 as its percentile over the past year (0 = most
    fearful reading of the year), and their average.

    momentum   S&P 500 vs its 125-day average
    volatility VIX vs its 50-day average (inverted: high VIX = fear)
    breadth    % of S&P 500 members above their 50-day average
    safe_haven 20-day return of stocks minus bonds (bonds beating stocks = fear)
    junk       high-yield spread (inverted: wider spread = fear)
    """
    idx = spx.dropna().index
    on = lambda s: s.dropna().reindex(idx, method="ffill")
    vix, above50, stocks, bonds, hy_oas = map(on, (vix, above50, stocks, bonds, hy_oas))
    raw = {
        "momentum": spx / spx.rolling(125).mean() - 1,
        "volatility": vix / vix.rolling(50).mean(),
        "breadth": above50,
        "safe_haven": stocks.pct_change(20) - bonds.pct_change(20),
        "junk": hy_oas,
    }
    out = pd.DataFrame({k: trailing_percentile(v.reindex(idx), window) for k, v in raw.items()})
    out["volatility"] = 100 - out["volatility"]
    out["junk"] = 100 - out["junk"]
    out["score"] = out[list(FEAR_GREED_PARTS)].mean(axis=1, skipna=False)
    return out


def fear_greed_label(score: float | None) -> str:
    if score is None or np.isnan(score):
        return "No data"
    for limit, name in ((25, "Extreme fear"), (45, "Fear"), (55, "Neutral"), (75, "Greed")):
        if score < limit:
            return name
    return "Extreme greed"


def monthly_returns(close: pd.Series, today: pd.Timestamp | None = None) -> pd.Series:
    """% return of every completed calendar month (the running month is left out)."""
    close = close.dropna()
    if close.empty:
        return close
    today = today or close.index[-1]
    month_end = close.resample("ME").last()
    ret = month_end.pct_change().dropna() * 100
    return ret[ret.index < today.to_period("M").to_timestamp()]


def seasonality(returns: pd.Series, years: int, today: pd.Timestamp) -> dict:
    """Average, median and % of years up for each calendar month over the last `years` years
    of completed months. -> {month 1-12: {avg, median, up, n}}"""
    start = today.to_period("M").to_timestamp() - pd.DateOffset(years=years)
    r = returns[returns.index >= start]
    out = {}
    for m in range(1, 13):
        v = r[r.index.month == m]
        out[m] = {"avg": float(v.mean()) if len(v) else None,
                  "median": float(v.median()) if len(v) else None,
                  "up": float(100 * (v > 0).mean()) if len(v) else None, "n": int(len(v)),
                  "best": float(v.max()) if len(v) else None, "worst": float(v.min()) if len(v) else None}
    return out


def short_share(closes: pd.DataFrame, volumes: pd.DataFrame, short: list[str]) -> pd.Series:
    """Inverse ETFs' % share of a fund family's daily dollar volume (close x shares)."""
    dollars = (closes * volumes).dropna(how="all")
    total = dollars.sum(axis=1, min_count=1)
    shorts = dollars[[c for c in short if c in dollars]].sum(axis=1, min_count=1)
    return (100 * shorts / total.replace(0, np.nan)).dropna()


def sma_tap(bars: pd.DataFrame, days: int = 200, tolerance_pct: float = 0.0) -> pd.Series:
    """Per session: did the bar's range include the `days`-day average of closes?"""
    ma = bars["close"].rolling(days, min_periods=days).mean()
    lo = ma * (1 - tolerance_pct / 100)
    hi = ma * (1 + tolerance_pct / 100)
    return ((bars["low"] <= hi) & (bars["high"] >= lo)).where(ma.notna(), False)


def record_volume(volume: pd.Series, ignore_first: int = 5) -> tuple[float, str] | None:
    """Biggest daily volume before the latest session, after the first days of trading.
    -> (volume, iso date)"""
    v = volume.dropna().iloc[ignore_first:-1]
    v = v[v > 0]
    if v.empty:
        return None
    return float(v.max()), v.idxmax().date().isoformat()
