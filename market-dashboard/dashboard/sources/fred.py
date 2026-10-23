"""FRED (St. Louis Fed) series observations."""

from __future__ import annotations

import csv
import io

from .http import client


def parse_observations(payload: dict) -> dict[str, float]:
    """FRED marks missing days with '.', which are skipped."""
    out = {}
    for obs in payload.get("observations", []):
        try:
            out[obs["date"]] = float(obs["value"])
        except (KeyError, ValueError):
            continue
    return out


def fetch_series(api_url: str, api_key: str, series_id: str, start: str) -> dict[str, float]:
    if not api_key:
        raise RuntimeError("FRED_API_KEY is not set in .env")
    params = {"series_id": series_id, "api_key": api_key, "file_type": "json",
              "observation_start": start}
    with client() as http:
        resp = http.get(api_url, params=params)
        if resp.status_code >= 400:
            try:
                message = resp.json().get("error_message", resp.text[:200])
            except ValueError:
                message = resp.text[:200]
            raise RuntimeError(f"HTTP {resp.status_code}: {message}")
        return parse_observations(resp.json())


def parse_csv(text: str) -> dict[str, float]:
    """fredgraph.csv: a date column and one value column; empty or '.' marks a missing day."""
    reader = csv.reader(io.StringIO(text.strip()))
    next(reader, None)
    out = {}
    for row in reader:
        try:
            out[row[0]] = float(row[1])
        except (IndexError, ValueError):
            continue
    return out


def fetch_series_csv(csv_url: str, series_id: str, start: str) -> dict[str, float]:
    """Keyless fallback: the CSV behind FRED's own charts."""
    with client() as http:
        resp = http.get(csv_url, params={"id": series_id, "cosd": start})
        resp.raise_for_status()
        return parse_csv(resp.text)
