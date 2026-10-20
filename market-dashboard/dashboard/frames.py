"""Read cached series from SQLite as pandas objects."""

from __future__ import annotations

import csv
from functools import lru_cache
from pathlib import Path

import pandas as pd

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
