"""Yahoo Finance screener (unusual volume) and TradingView's stock screener (European small caps)."""

from __future__ import annotations

import yfinance as yf
from yfinance import EquityQuery, ETFQuery

from .http import client

PAGE = 250


def _all_quotes(query, sort_field: str) -> list[dict]:
    quotes, offset = [], 0
    while True:
        res = yf.screen(query, size=PAGE, offset=offset, sortField=sort_field, sortAsc=False)
        batch = res.get("quotes", [])
        quotes += batch
        offset += PAGE
        if len(batch) < PAGE or offset >= res.get("total", 0) or offset >= 4000:
            return quotes


def big_stocks(min_cap: float, exchanges: list[str]) -> list[dict]:
    """US-listed stocks with a market cap of at least `min_cap` dollars."""
    q = EquityQuery("and", [EquityQuery("eq", ["region", "us"]),
                            EquityQuery("gte", ["intradaymarketcap", min_cap]),
                            EquityQuery("is-in", ["exchange", *exchanges])])
    return _all_quotes(q, "intradaymarketcap")


def big_etfs(min_assets: float) -> list[dict]:
    """US-listed ETFs with at least `min_assets` dollars under management."""
    q = ETFQuery("and", [ETFQuery("eq", ["region", "us"]), ETFQuery("gte", ["fundnetassets", min_assets])])
    return _all_quotes(q, "fundnetassets")


def unusual(quotes: list[dict], min_rel: float, kind: str) -> list[dict]:
    """Quotes whose volume today is at least `min_rel` times the 10-day average."""
    out = []
    for q in quotes:
        vol, avg = q.get("regularMarketVolume"), q.get("averageDailyVolume10Day")
        size = q.get("marketCap") if kind == "stock" else q.get("netAssets")
        # Preferred shares and other lines without their own market cap ride on the company's.
        if not vol or not avg or not size:
            continue
        rel = vol / avg
        if rel < min_rel:
            continue
        out.append({"symbol": q["symbol"], "name": q.get("longName") or q.get("shortName") or q["symbol"],
                    "kind": kind, "rel": round(rel, 2), "volume": vol, "avg10": avg,
                    "day": q.get("regularMarketChangePercent"), "last": q.get("regularMarketPrice"),
                    "size": size})
    out.sort(key=lambda r: -r["rel"])
    return out


SCANNER_HEADERS = {"Accept": "application/json", "Origin": "https://www.tradingview.com",
                   "Referer": "https://www.tradingview.com/",
                   "User-Agent": "Mozilla/5.0 (compatible; market-dashboard/1.0)"}
SCANNER_COLUMNS = ["name", "description", "country", "close", "currency", "change",
                   "market_cap_basic", "Value.Traded"]


def eu_smallcap_payload(cfg: dict) -> dict:
    return {
        "filter": [
            {"left": "type", "operation": "equal", "right": "stock"},
            {"left": "is_primary", "operation": "equal", "right": True},
            {"left": "change", "operation": "egreater", "right": cfg["min_change_pct"]},
            {"left": "market_cap_basic", "operation": "less", "right": cfg["max_market_cap_usd"]},
            {"left": "Value.Traded", "operation": "greater", "right": cfg["min_traded_usd"]},
        ],
        "options": {"lang": "en"},
        "markets": cfg["markets"],
        "columns": SCANNER_COLUMNS,
        "sort": {"sortBy": "change", "sortOrder": "desc"},
        "range": [0, 100],
        # Market cap and traded value in dollars, also for Swedish, Swiss and other listings.
        "price_conversion": {"to_currency": "usd"},
    }


def parse_scanner(body: dict) -> list[dict]:
    rows = []
    for raw in body.get("data") or []:
        d = raw.get("d") or []
        if len(d) < len(SCANNER_COLUMNS):
            continue
        rec = dict(zip(SCANNER_COLUMNS, d))
        rows.append({"symbol": raw.get("s", ""), "ticker": rec["name"], "name": rec["description"],
                     "country": rec["country"], "last": rec["close"], "currency": rec["currency"],
                     "day": rec["change"], "market_cap": rec["market_cap_basic"],
                     "traded": rec["Value.Traded"]})
    return rows


def eu_smallcap_movers(cfg: dict) -> list[dict]:
    with client(timeout=20) as http:
        resp = http.post(cfg["url"], json=eu_smallcap_payload(cfg), headers=SCANNER_HEADERS)
        resp.raise_for_status()
        return parse_scanner(resp.json())
