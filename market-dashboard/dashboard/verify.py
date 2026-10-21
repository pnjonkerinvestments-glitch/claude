"""`python -m dashboard verify`: hits every configured source once and reports what came back."""

from __future__ import annotations

from datetime import date, timedelta

from . import refresh
from .sources import cboe, cftc, earnings, fred, prices
from .sources.http import client


def _report(ok: bool, name: str, detail: str) -> bool:
    print(f"[{'OK ' if ok else 'FAIL'}] {name}: {detail}")
    return ok


def _check(name, fn) -> bool:
    try:
        ok, detail = fn()
    except Exception as exc:
        ok, detail = False, f"{type(exc).__name__}: {exc}"
    return _report(ok, name, detail)


def verify(cfg: dict) -> int:
    today = date.today()
    results = []

    def fred_check(series_id):
        def run():
            start = (today - timedelta(days=14)).isoformat()
            if cfg["fred_api_key"]:
                data, via = fred.fetch_series(cfg["fred"]["api_url"], cfg["fred_api_key"],
                                              series_id, start), "API"
            else:
                data, via = fred.fetch_series_csv(cfg["fred"]["csv_url"], series_id, start), "CSV, no key"
            last = max(data) if data else None
            return bool(data), f"{len(data)} obs via {via}, latest {last} = {data.get(last)}"
        return run

    for sid in cfg["fred"]["series"]:
        results.append(_check(f"FRED {sid}", fred_check(sid)))

    def cboe_check(sym):
        def run():
            data = cboe.fetch_index_history(cfg["cboe"]["index_history_url"], sym)
            last = max(data) if data else None
            return bool(data), f"{len(data)} rows, latest {last} = {data.get(last)}"
        return run

    for sym in cfg["cboe"]["vix_symbols"]:
        results.append(_check(f"CBOE {sym}", cboe_check(sym)))

    def pc_check():
        with client() as http:
            for back in range(1, 8):
                day = today - timedelta(days=back)
                if day.weekday() < 5:
                    ratios = cboe.fetch_put_call(cfg["cboe"]["put_call_url"], day.isoformat(), http)
                    if ratios:
                        return "equity" in ratios and "index" in ratios, f"{day}: {ratios}"
        return False, "no put/call file found for the last 7 days"

    results.append(_check("CBOE put/call", pc_check))

    def cftc_check(dataset, url):
        def run():
            assets = [a for a in cfg["cftc"]["assets"] if a["dataset"] == dataset]
            rows = cftc.fetch(url, dataset, [a["code"] for a in assets],
                              (today - timedelta(weeks=4)).isoformat())
            parsed = cftc.parse_rows(rows, {a["code"]: a["cohort"] for a in assets})
            lines = [f"{a['code']} {a['label']}: "
                     + (f"latest {max(parsed[a['code']])}" if a["code"] in parsed else "NO ROWS")
                     for a in assets]
            return all(a["code"] in parsed for a in assets), "\n       " + "\n       ".join(lines)
        return run

    for dataset, url in cfg["cftc"]["datasets"].items():
        results.append(_check(f"CFTC {dataset}", cftc_check(dataset, url)))

    def yahoo_check(tickers, optional=()):
        def run():
            data = prices.download_closes(tickers, "5d")
            missing = [t for t in tickers if t not in data]
            hard = [t for t in missing if t not in optional]
            detail = f"{len(data)}/{len(tickers)} tickers with data"
            if missing:
                detail += f"; missing: {', '.join(missing)}"
            return not hard, detail
        return run

    def earnings_check():
        cap = cfg["earnings"]["min_market_cap"]
        universe = earnings.fetch_us_universe(cap)
        df = earnings.fetch_calendar(today.isoformat(), (today + timedelta(days=7)).isoformat(), cap)
        rows = earnings.parse_calendar(df, universe, cap)
        return len(universe) > 500 and bool(rows), \
            f"{len(universe)} US companies ≥ ${cap / 1e9:g} bn; {len(rows)} reports in the next 7 days"

    results.append(_check("Yahoo earnings calendar", earnings_check))
    results.append(_check("Yahoo indices/ETFs", yahoo_check(refresh.price_tickers(cfg))))
    results.append(_check("Yahoo index members", yahoo_check(refresh.component_tickers(cfg))))

    print(f"\n{sum(results)}/{len(results)} checks passed.")
    return 0 if all(results) else 1
