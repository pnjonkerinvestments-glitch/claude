# Market overview dashboard

A single page that shows where we stand in the market: regime, sentiment, rates,
positioning and today's calendar. It is not for trading or scanning. Our trading
system already does that.

- Backend: Python 3.12 + FastAPI. Fetches data, caches it in SQLite (`data/dashboard.sqlite`)
  and serves the page.
- Frontend: one HTML/CSS/JS page, no build step, Chart.js from a CDN.
- Live quotes, sector heatmap and economic calendar: free TradingView widgets.
- Other data: FRED, CFTC (COT), CBOE (VIX indices, put/call ratios) and Yahoo Finance via
  yfinance (daily closes).
- All times are Europe/Amsterdam.

## Installation

Requires Python 3.12 or newer.

```sh
cd market-dashboard
python3.12 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env        # then fill in FRED_API_KEY
```

### FRED API key

1. Create a free account at <https://fredaccount.stlouisfed.org/login/secure/>.
2. Go to **My Account → API Keys** (<https://fredaccount.stlouisfed.org/apikeys>) and click
   **Request API Key**. Describe the use briefly (e.g. "internal market dashboard").
3. Put the 32-character key in `.env`: `FRED_API_KEY=...`

Without a key, the "Rates & credit" block and the credit and yield-curve indicators show
a warning. Everything else keeps working.

## Starting

One command (creates `.venv` and installs the requirements on the first run):

```sh
./start.sh
```

Or, with the environment already installed: `.venv/bin/python -m dashboard`.

- **Local:** open <http://127.0.0.1:8050>.
- **On an internal server:** bind to all interfaces so colleagues can connect:
  `./start.sh --host 0.0.0.0 --port 8050`, then browse to `http://<server-name>:8050`.
  Host and port can also be set in `config.yaml` (`server:`) or with `DASHBOARD_HOST` /
  `DASHBOARD_PORT` in `.env`. Run a single process: the refresh schedule lives inside it.
  To keep it running, use a systemd service (or similar) that runs `start.sh`.

The first start fetches the history needed for the averages and percentiles:
2 years of daily closes for the indices, ETFs and ~115 index members, a year of
put/call ratios (one CBOE file per trading day, takes about a minute) and 3 years of COT data.
Blocks fill in as each source finishes. Refresh the page after a few minutes.

Check that every source answers: `.venv/bin/python -m dashboard verify`.

Run the tests: `.venv/bin/python -m pytest tests`.

## Refresh schedule

| What | When (Europe/Amsterdam) |
|---|---|
| Prices, trend, breadth, ratios, FRED, CBOE | Mon–Fri at 18:00 (after the European close) and 22:30 (after the US close) |
| COT | Friday 22:00 (CFTC publishes Friday 15:30 New York time) |
| Everything | At every start |

If a source fails, its blocks keep showing the last stored values with a warning that
says when the refresh failed and how old the shown data is. The page reloads its data
every 5 minutes.

## Adjusting the thresholds

All thresholds are in `config.yaml` under `regime:`. Restart the dashboard after editing.
Hover over (or click) an indicator to see its value and the thresholds behind its colour.

The verdict is a plain count: every indicator scores green +1, orange 0, red −1.
Indicators without data are skipped. The score as a percentage of the counted indicators
decides the label: risk-on at ≥ `risk_on_min_pct` (default +33%), risk-off at
≤ `risk_off_max_pct` (default −33%), neutral in between.

| Indicator | Default rule |
|---|---|
| Trend (S&P 500, Nasdaq-100, Euro Stoxx 50, DAX, AEX) | Close above 20/50/200-day MA: all three green, one or two orange, none red |
| Breadth (Euro Stoxx 50, DAX, AEX) | % of members above their 50d and 200d MA: both ≥ 60% green, both ≤ 40% red |
| VIX level | < 18 green, > 25 red |
| VIX term structure | VIX/VIX3M < 0.95 green, ≥ 1.00 (backwardation) red |
| VSTOXX level | < 20 green, > 27 red (only when data is available) |
| Equity put/call | Percentile of the 5-day average within the last year: < 60 green, > 85 red |
| High-yield spread | ≤ 4.0% and not widening over 20 days green; ≥ 5.0% or +50 bp red |
| 2s10s | > +0.50 pp green, < 0 (inverted) red |

Index members for breadth are listed under `breadth_components:` (Yahoo tickers).
Update them after index reviews. TradingView symbols, calendar filter and heatmap
markets are under `tradingview:`.

## Data notes

- **VSTOXX:** Yahoo Finance has no VSTOXX data (`^V2TX` returns nothing), and STOXX
  offers no free download. The VSTOXX indicator and the Euro Stoxx 50 expected move
  therefore show "n/a" and are not counted. If you find a free Yahoo-style ticker, set
  `prices.vstoxx_ticker` and they appear automatically.
- **CBOE VIX history** comes from `cdn.cboe.com`, which redirects to `cdn-api.cboe.com`.
  Behind a strict firewall, allow both.
- **Put/call ratios** come from CBOE's daily market statistics, published the next
  morning. The latest value is therefore always the previous US session.
- **COT** shows positions as of Tuesday, published the following Friday.
  The COT index is the latest net position's place between its 3-year low (0) and high (100).

## TradingView widgets: what is delayed

The widgets are free embeds and follow the exchanges' rules for non-paying viewers.
They are a live glance, not a trading feed.

| Widget / symbol | Data |
|---|---|
| ES, NQ (`CME_MINI:ES1!`, `CME_MINI:NQ1!`) | Delayed ~10 minutes (CME) |
| DAX (`XETR:DAX`) | Delayed ~15 minutes (Xetra) |
| AEX (`EURONEXT:AEX`) | Delayed ~15 minutes (Euronext) |
| Euro Stoxx 50 (`TVC:SX5E`) | Delayed ~15 minutes (STOXX) |
| VIX (`TVC:VIX`) | Delayed ~15 minutes (Cboe) |
| US 10Y, Bund 10Y, Brent, gold (`TVC:` symbols) | TradingView's own indicative feed, near real time |
| EUR/USD (`FX:EURUSD`) | Real time (FX feed) |
| Heatmap, S&P 500 | US stocks near real time (Cboe BZX) |
| Heatmap, Europe | Delayed ~15 minutes (European exchanges) |
| Economic calendar | Not delayed (event data) |

Delays can change. Hovering over a symbol in a widget shows TradingView's own status.
If a symbol shows "only available on TradingView", replace it under
`tradingview.ticker_tape` in `config.yaml` (e.g. `FOREXCOM:SPXUSD` for the S&P 500).
The calendar shows times in the browser's time zone (Amsterdam on our machines).
