"""CFTC Commitments of Traders via the Socrata API (Traders in Financial Futures and
Disaggregated reports, futures only)."""

from __future__ import annotations

from .http import client

COHORT_FIELDS = {
    "am": ("asset_mgr_positions_long", "asset_mgr_positions_short"),
    "lf": ("lev_money_positions_long", "lev_money_positions_short"),
    "mm": ("m_money_positions_long_all", "m_money_positions_short_all"),
}
DATASET_COHORTS = {"tff": ("am", "lf"), "disagg": ("mm",)}


def fields_for(dataset: str) -> list[str]:
    fields = ["report_date_as_yyyy_mm_dd", "cftc_contract_market_code", "open_interest_all"]
    for cohort in DATASET_COHORTS[dataset]:
        fields += COHORT_FIELDS[cohort]
    return fields


def parse_rows(rows: list[dict], cohorts: dict[str, str]) -> dict[str, dict[str, dict]]:
    """-> {contract code: {iso date: {"net": cohort long - short, "oi": open interest}}}

    `cohorts` maps contract code to the cohort used for that contract (am, lf or mm).
    """
    out: dict[str, dict[str, dict]] = {}
    for r in rows:
        code = r.get("cftc_contract_market_code", "").strip()
        if code not in cohorts:
            continue
        long_f, short_f = COHORT_FIELDS[cohorts[code]]
        try:
            day = r["report_date_as_yyyy_mm_dd"][:10]
            net = float(r[long_f]) - float(r[short_f])
            oi = float(r["open_interest_all"])
        except (KeyError, TypeError, ValueError):
            continue
        out.setdefault(code, {})[day] = {"net": net, "oi": oi}
    return out


def fetch(api_url: str, dataset: str, codes: list[str], since: str) -> list[dict]:
    code_list = ",".join(f"'{c}'" for c in codes)
    params = {
        "$select": ",".join(fields_for(dataset)),
        "$where": f"cftc_contract_market_code in({code_list}) "
                  f"AND report_date_as_yyyy_mm_dd >= '{since}T00:00:00.000'",
        "$order": "report_date_as_yyyy_mm_dd",
        "$limit": "50000",
    }
    with client(timeout=120) as http:
        resp = http.get(api_url, params=params)
        resp.raise_for_status()
        return resp.json()
