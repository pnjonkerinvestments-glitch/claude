"""CFTC Commitments of Traders, Traders in Financial Futures (Socrata API)."""

from __future__ import annotations

from .http import client

FIELDS = ("report_date_as_yyyy_mm_dd", "cftc_contract_market_code", "market_and_exchange_names",
          "lev_money_positions_long", "lev_money_positions_short",
          "asset_mgr_positions_long", "asset_mgr_positions_short")


def parse_rows(rows: list[dict]) -> dict[str, dict[str, dict]]:
    """-> {contract code: {iso date: {"lev": net, "am": net, "name": market name}}}"""
    out: dict[str, dict[str, dict]] = {}
    for r in rows:
        try:
            day = r["report_date_as_yyyy_mm_dd"][:10]
            lev = float(r["lev_money_positions_long"]) - float(r["lev_money_positions_short"])
            am = float(r["asset_mgr_positions_long"]) - float(r["asset_mgr_positions_short"])
        except (KeyError, TypeError, ValueError):
            continue
        code = r.get("cftc_contract_market_code", "").strip()
        out.setdefault(code, {})[day] = {"lev": lev, "am": am,
                                         "name": r.get("market_and_exchange_names", "")}
    return out


def fetch_tff(api_url: str, codes: list[str], since: str) -> list[dict]:
    code_list = ",".join(f"'{c}'" for c in codes)
    params = {
        "$select": ",".join(FIELDS),
        "$where": f"cftc_contract_market_code in({code_list}) "
                  f"AND report_date_as_yyyy_mm_dd >= '{since}T00:00:00.000'",
        "$order": "report_date_as_yyyy_mm_dd",
        "$limit": "50000",
    }
    with client(timeout=60) as http:
        resp = http.get(api_url, params=params)
        resp.raise_for_status()
        return resp.json()
