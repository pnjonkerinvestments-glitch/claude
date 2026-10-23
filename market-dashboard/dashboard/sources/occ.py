"""OCC (Options Clearing Corporation) daily cleared option volume per underlying."""

from __future__ import annotations

import csv
import io
import re
from datetime import date, datetime

from .http import client

PARAMS = {"format": "csv", "volumeQueryType": "O", "symbolType": "U", "accountType": "ALL",
          "productKind": "ALL", "porc": "BOTH"}


def parse(text: str) -> dict[str, dict[str, float]]:
    """CSV rows (quantity, underlying, symbol, account type, put/call, exchange, date) ->
    {iso date: {"calls": contracts, "puts": contracts}}, summed over every option root, account
    type and exchange (so both sides of each trade count)."""
    out: dict[str, dict[str, float]] = {}
    for row in list(csv.reader(io.StringIO(text)))[1:]:
        if len(row) < 7 or row[4] not in ("C", "P"):
            continue
        try:
            qty = float(row[0])
            day = datetime.strptime(row[6], "%m/%d/%Y").date().isoformat()
        except ValueError:
            continue
        side = "calls" if row[4] == "C" else "puts"
        out.setdefault(day, {"calls": 0.0, "puts": 0.0})[side] += qty
    return out


def fetch(url: str, symbol: str, report_date: date, report_type: str = "M", http=None) -> dict:
    """One report (D = day, W = week, M = month up to `report_date`). OCC refuses dates after its
    latest report; the error names that date and the request is repeated with it."""
    params = {**PARAMS, "symbol": symbol, "reportType": report_type,
              "reportDate": report_date.strftime("%Y%m%d")}
    own = http is None
    http = http or client(timeout=60)
    try:
        resp = http.get(url, params=params)
        resp.raise_for_status()
        text = resp.text
        late = re.search(r"cannot be greater than (\d\d)/(\d\d)/(\d{4})", text)
        if late:
            m, d, y = map(int, late.groups())
            params["reportDate"] = f"{y:04d}{m:02d}{d:02d}"
            resp = http.get(url, params=params)
            resp.raise_for_status()
            text = resp.text
        return parse(text)
    finally:
        if own:
            http.close()
