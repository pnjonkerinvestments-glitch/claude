"""Read cached series from SQLite as pandas objects."""

from __future__ import annotations

import csv
from functools import lru_cache
from pathlib import Path

import pandas as pd
import yaml

from .db import Store

UNIVERSE_DIR = Path(__file__).resolve().parent / "universe"


def series(store: Store, key: str) -> pd.Series:
    rows = store.series(key)
    if not rows:
        return pd.Series(dtype=float, index=pd.DatetimeIndex([]), name=key)
    return pd.Series([v for _, v in rows], index=pd.to_datetime([d for d, _ in rows]), name=key)


def price(store: Store, ticker: str) -> pd.Series:
    return series(store, f"px:{ticker}")


def frame(store: Store, tickers: list[str]) -> pd.DataFrame:
    cols = {t: price(store, t) for t in tickers}
    cols = {t: s for t, s in cols.items() if not s.empty}
    return pd.DataFrame(cols).sort_index()


@lru_cache(maxsize=None)
def sp500_members() -> tuple[tuple[str, str, str], ...]:
    """(ticker, name, sector) for every S&P 500 member in universe/sp500.csv."""
    with open(UNIVERSE_DIR / "sp500.csv", encoding="utf-8") as fh:
        rows = csv.DictReader(line for line in fh if not line.startswith("#"))
        return tuple((r["ticker"], r["name"], r["sector"]) for r in rows)


def eu_members(cfg: dict) -> list[str]:
    return list(dict.fromkeys(t for members in cfg["breadth_components"].values() for t in members))


@lru_cache(maxsize=None)
def eu_peers(include_extra: bool = False) -> tuple[dict, dict]:
    """({US ticker: [EU tickers]}, {EU ticker: name}) from universe/eu_peers.yaml."""
    with open(UNIVERSE_DIR / "eu_peers.yaml", encoding="utf-8") as fh:
        data = yaml.safe_load(fh)
    peers = {k: v or [] for k, v in (data.get("peers") or {}).items()}
    if include_extra:
        peers.update({k: v or [] for k, v in (data.get("extra_peers") or {}).items()})
    bad = [k for k, v in peers.items() if not isinstance(k, str) or not all(isinstance(t, str) for t in v)]
    if bad:  # YAML reads ON, NO, YES etc. as booleans unless quoted
        raise ValueError(f"eu_peers.yaml: quote these tickers: {bad}")
    return peers, data.get("eu_names", {})


@lru_cache(maxsize=None)
def sec_ciks() -> dict[str, int]:
    """US ticker -> SEC CIK from universe/eu_peers.yaml."""
    with open(UNIVERSE_DIR / "eu_peers.yaml", encoding="utf-8") as fh:
        return {str(k): int(v) for k, v in (yaml.safe_load(fh).get("sec_cik") or {}).items()}
