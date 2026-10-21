"""Put/call ratios of ETF options from Yahoo's option chains (all expiries, one snapshot)."""

from __future__ import annotations

import pandas as pd
import yfinance as yf


def chain_ratios(chains: list[tuple[pd.DataFrame, pd.DataFrame]]) -> dict | None:
    """Put/call of volume and of open interest over (calls, puts) tables of all expiries.

    Yahoo resets open interest to 0 overnight, so the open-interest ratio is only given when
    at least half the contracts carry a value.
    """
    cv = pv = coi = poi = 0.0
    contracts = with_oi = 0
    for calls, puts in chains:
        cv += calls["volume"].fillna(0).sum()
        pv += puts["volume"].fillna(0).sum()
        coi += calls["openInterest"].fillna(0).sum()
        poi += puts["openInterest"].fillna(0).sum()
        for side in (calls, puts):
            contracts += len(side)
            with_oi += int((side["openInterest"].fillna(0) > 0).sum())
    if not cv:
        return None
    oi_ok = contracts and with_oi / contracts >= 0.5 and coi and poi
    return {"vol": pv / cv, "oi": poi / coi if oi_ok else None}


def etf_put_call(ticker: str) -> dict | None:
    tk = yf.Ticker(ticker)
    chains = []
    for expiry in tk.options:
        chain = tk.option_chain(expiry)
        chains.append((chain.calls, chain.puts))
    return chain_ratios(chains)
