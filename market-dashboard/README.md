# Market overview dashboard

One scrolling page in the spirit of a weekly macro chart book: where we stand, what is
stretched, and where positioning is crowded. Roughly 75% US, 25% Europe, plus commodities,
crypto and Asia. It is not for trading or scanning. Our trading system already does that.

## What is on the page

| Section | Contents |
|---|---|
| Positioning (COT): indices & commodities | Pick S&P 500, Nasdaq-100, Russell 2000, Dow, gold, silver, copper, WTI, gasoline or natural gas and a period (1Y–Max). Commodities show managed money, producers & merchants and swap dealers. The index chart (optional 50/200-day averages, log scale) with below it the net positions of asset managers, leveraged funds and dealers, and the chosen group's percentile against all history, 5 years or 1 year. Cards and a headline say in words how long or short each group is |
| Earnings & European peers | Next results of the US companies in our own peer list (`dashboard/universe/eu_peers.yaml`), with the expected release time in Amsterdam time, when European peers can first trade on it (same day before 17:30, otherwise next open), correlation with each peer and how the peer moved after the previous report |
| Where we stand | Regime verdict (transparent tally of 11 indicators), key numbers, and a **Signals** list of current extremes (RSI, COT, breadth, streaks, VIX curve, MOVE, crypto compression) |
| Today | Expected move for the S&P 500, economic calendar, heatmap (S&P 500 / STOXX 600) |
| Stocks & breadth | S&P 500 with % of members beating the index (2M); McClellan summation index (from all 503 members); % above 50d/200d for S&P 500 and Europe; equal-weight vs cap-weight since 2003; QQQ and SMH with RSI; leaders/laggards vs SPY; sortable sector & theme table (US and STOXX 600 sectors) |
| Risk appetite | HYG/IEF, RSP/SPY, SMH/SPY, XLY/XLP with 50-day average |
| Volatility & sentiment | Put/call ratio per index with a period choice (S&P 500 index options, VIX and CBOE totals from CBOE with 3 years of history; Nasdaq-100 and Russell 2000 through QQQ and IWM options from Yahoo, collected from the first run onwards), VIX term structure, MOVE, Nasdaq-100 weekly returns |
| Positioning (COT) | Percentile table for 22 futures (equity indices, VIX, rates, FX, metals, energy, crypto) with the right trader group per market; click a row for price + percentile chart |
| Rates & credit | 2Y/5Y/10Y/30Y, 2s10s, real yield, HY spread with 1D/1W/1M changes; 2Y with MAs; 10Y vs oil with rolling correlation; HY spread; TY futures |
| Dollar | DXY and EUR/USD weekly with 200-week average, USD and EUR positioning |
| Commodities | Gold, silver, gold miners, copper, WTI, gasoline, natural gas: table and weekly charts (their COT is in the positioning chart at the top) |
| Crypto | BTC and ETH with volatility-compression model, ETH/BTC, Bitcoin COT |
| Asia | KOSPI, Nikkei, EWY, FXI; Korea vs US semiconductors |

Every section starts with a one-line explanation, every chart has a **What does this show?**
box, table columns are explained under each table, and the summary tiles explain themselves on
hover. The detail sections (from Stocks down) start folded; **Show/Hide** next to the title opens
them and the page remembers your choice.

Every chart has an **Open in TradingView ↗** link that opens the symbol in your own
TradingView account (with your paid real-time data). Light and dark layout: the toggle at the
top right (follows the system setting until you choose).

How the main indicators are calculated:

- **% beating the index:** share of S&P 500 members whose 42-day return beats the S&P 500's.
- **McClellan summation:** ratio-adjusted: (advancers − decliners) / (advancers + decliners)
  × 1000 per day, oscillator = EMA19 − EMA39, summation = running total.
- **COT percentiles:** net position (long − short) of the chosen trader group divided by open
  interest, ranked against all weeks since 2006 (bitcoin 2018, ether 2021, SOFR 2018), the last
  5 years and the last year. "Nominal" ranks the raw net contracts. Groups follow common
  practice: asset managers for equity indices and VIX, leveraged funds for rates, FX, Russell
  and crypto, managed money for commodities.
- **Volatility compression (crypto):** 90-day realized volatility and the 180-day high/low
  range, each as a percentile of the last four years; both below 20 = compression.

- Backend: Python 3.12 + FastAPI. Fetches data, caches it in SQLite (`data/dashboard.sqlite`)
  and serves the page.
- Frontend: one HTML/CSS/JS page, no build step, Chart.js from a CDN.
- Live quotes, sector heatmap and economic calendar: free TradingView widgets.
- Other data: FRED, CFTC (COT), CBOE (VIX indices, put/call ratios) and Yahoo Finance via
  yfinance (daily closes, including all S&P 500 members for breadth).
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

Without a key, the dashboard uses FRED's public CSV download (the one behind FRED's own
charts) for the same series. That works today, but the API with a key is the supported route.

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

The first start fetches the history needed for the averages and percentiles: full history
for the long-term charts, 2 years for ~90 ETFs/indices and ~600 index members (S&P 500 plus
Euro Stoxx 50, DAX, AEX), a year of put/call ratios and COT data since 2006. That takes about
3–4 minutes; sections fill in as each source finishes. Refresh the page afterwards.

Check that every source answers: `.venv/bin/python -m dashboard verify`.

Run the tests: `.venv/bin/python -m pytest tests`.

## Refresh schedule

| What | When (Europe/Amsterdam) |
|---|---|
| Prices, trend, breadth, ratios, FRED, CBOE | Mon–Fri at 18:00 (after the European close) and 22:30 (after the US close) |
| Earnings calendar | With the daily refreshes (18:00 and 22:30) |
| COT | Friday 22:00 (CFTC publishes Friday 15:30 New York time) |
| Everything | At every start |

If a source fails, its sections keep showing the last stored values with a warning that
says when the refresh failed and how old the shown data is. The page reloads its data
every 10 minutes.

## Adjusting the thresholds

All thresholds are in `config.yaml`: `regime:` for the verdict and `signals:` for the
Signals list. Tickers, sector tables, ratios and COT contracts are in the same file.
Restart the dashboard after editing.
Hover over (or click) an indicator to see its value and the thresholds behind its colour.

The verdict is a plain count: every indicator scores green +1, orange 0, red −1.
Indicators without data are skipped. The score as a percentage of the counted indicators
decides the label: risk-on at ≥ `risk_on_min_pct` (default +33%), risk-off at
≤ `risk_off_max_pct` (default −33%), neutral in between.

| Indicator | Default rule |
|---|---|
| Trend (S&P 500, Nasdaq-100, Russell 2000, Euro Stoxx 50) | Close above 20/50/200-day MA: all three green, one or two orange, none red |
| Breadth (S&P 500; Europe = Euro Stoxx 50, DAX, AEX) | % of members above their 50d and 200d MA: both ≥ 60% green, both ≤ 40% red |
| VIX level | < 18 green, > 25 red |
| VIX term structure | VIX/VIX3M < 0.95 green, ≥ 1.00 (backwardation) red |
| Equity put/call | Percentile of the 5-day average within the last year: < 60 green, > 85 red |
| High-yield spread | ≤ 4.0% and not widening over 20 days green; ≥ 5.0% or +50 bp red |
| 2s10s | > +0.50 pp green, < 0 (inverted) red |

Index members for breadth: S&P 500 in `dashboard/universe/sp500.csv`, European indices
under `breadth_components:` in `config.yaml`. Update them after index reviews. TradingView symbols, calendar filter and heatmap
markets are under `tradingview:`.

## Data notes

- **Earnings:** Yahoo Finance per company. Yahoo's time for an upcoming pre-market report is a
  placeholder (7:00, 8:00 or 8:30 New York), so the page uses the company's usual release time
  from its last four reports (shown with ≈; Yahoo rounds past times to the hour). Amsterdam
  times follow both daylight-saving switches (Europe changes a week before the US).
  Suggested extra pairs sit under `extra_peers` in the peer file and are off unless
  `earnings.use_extra_peers: true`. Quote tickers YAML reads as yes/no, such as `"ON"`.
- **Put/call per index:** CBOE publishes daily index figures only for SPX and VIX. Nasdaq-100
  options trade elsewhere, so QQQ and IWM (ETF) options from Yahoo stand in; each refresh
  outside US trading hours stores the last full session, so that history starts at install.
- **Not included (paid or proprietary):** NAAIM, AAII, BofA Fund Manager Survey, Goldman
  prime-book data, and newsletter models such as a "Core Risk Model" or the Daily Sentiment
  Index. VSTOXX has no free source either, so there is no Euro Stoxx 50 expected move.
- **CBOE VIX history** comes from `cdn.cboe.com`, which redirects to `cdn-api.cboe.com`.
  Behind a strict firewall, allow both. If CBOE cannot be reached, VIX, VIX9D and VIX3M are
  taken from Yahoo (`^VIX`, `^VIX9D`, `^VIX3M`), which carries the same index closes.
- **Put/call ratios** come from CBOE's daily market statistics, published the next
  morning. The latest value is therefore always the previous US session.
- **COT** shows positions as of Tuesday, published the following Friday.

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
| Heatmap, STOXX 600 | Delayed ~15 minutes (European exchanges) |
| Bitcoin (`BITSTAMP:BTCUSD`) | Real time (exchange feed) |
| Economic calendar | Not delayed (event data) |

Delays can change. Hovering over a symbol in a widget shows TradingView's own status.
If a symbol shows "only available on TradingView", replace it under
`tradingview.ticker_tape` in `config.yaml` (e.g. `FOREXCOM:SPXUSD` for the S&P 500).
The calendar shows times in the browser's time zone (Amsterdam on our machines).

The heatmap data sets come from TradingView's widget code: `SPX500` for the S&P 500 and
`SXXP` (STOXX 600) for Europe. `SX5E`, `DAX`, `AEX` and `AllEU` also work.

The widgets need these hosts in the browser: `s3.tradingview.com`,
`www.tradingview-widget.com`, `widgetdata.tradingview.com`, `pushstream.tradingview.com`,
`scanner.tradingview.com`, `chartevents-reuters.tradingview.com` and
`widget-sheriff.tradingview-widget.com`. Chart.js loads from `cdn.jsdelivr.net`.
