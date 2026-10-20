"""FRED (St. Louis Fed) series observations."""

from __future__ import annotations

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
