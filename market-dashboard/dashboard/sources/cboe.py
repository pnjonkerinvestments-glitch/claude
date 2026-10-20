"""CBOE: VIX-family index history (CSV) and daily put/call ratios (JSON)."""

from __future__ import annotations

import csv
import io
from datetime import datetime

from .http import client

DATE_FORMATS = ("%m/%d/%Y", "%Y-%m-%d")


def _iso(text: str) -> str | None:
    for fmt in DATE_FORMATS:
        try:
            return datetime.strptime(text.strip(), fmt).date().isoformat()
        except ValueError:
            pass
    return None


def parse_index_csv(text: str) -> dict[str, float]:
    """Parse a CBOE *_History.csv: DATE plus CLOSE (or, if absent, the last column)."""
    reader = csv.reader(io.StringIO(text.strip()))
    header = [h.strip().upper() for h in next(reader)]
    col = header.index("CLOSE") if "CLOSE" in header else len(header) - 1
    out = {}
    for row in reader:
        if len(row) <= col:
            continue
        day = _iso(row[0])
        try:
            if day:
                out[day] = float(row[col])
        except ValueError:
            continue
    return out


def fetch_index_history(url_template: str, symbol: str) -> dict[str, float]:
    with client() as http:
        resp = http.get(url_template.format(symbol=symbol))
        resp.raise_for_status()
        return parse_index_csv(resp.text)


def parse_put_call(payload: dict) -> dict[str, float]:
    """Extract equity/index/total ratios from CBOE's daily market statistics JSON."""
    out = {}
    for item in payload.get("ratios", []):
        name = str(item.get("name", "")).upper()
        try:
            value = float(item.get("value"))
        except (TypeError, ValueError):
            continue
        if name.startswith("EQUITY PUT/CALL"):
            out["equity"] = value
        elif name.startswith("INDEX PUT/CALL"):
            out["index"] = value
        elif name.startswith("TOTAL PUT/CALL"):
            out["total"] = value
    return out


def fetch_put_call(url_template: str, day: str, http=None) -> dict[str, float] | None:
    """Ratios for one trading day; None when CBOE has no file (weekend, holiday, not yet out)."""
    own = http is None
    http = http or client()
    try:
        resp = http.get(url_template.format(date=day))
        if resp.status_code in (403, 404):
            return None
        resp.raise_for_status()
        return parse_put_call(resp.json()) or None
    finally:
        if own:
            http.close()
