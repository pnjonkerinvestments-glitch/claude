# Market overview dashboard

One scrolling page in the spirit of a weekly macro chart book: where we stand, what is
stretched, and where positioning is crowded. Roughly 75% US, 25% Europe, plus commodities,
crypto and Asia. It is not for trading or scanning. Our trading system already does that.

## What is on the page

A grid of cards, in the style of a market monitor: a title, one line on what it shows, a big
number and a compact chart.

| Section | Contents |
|---|---|
| Overview | **Markets** (indexes, VIX, dollar, 10Y yield, gold, crude, bitcoin: last, day, week, YTD); **Fear & greed** composite (five signals scored against their past year, with history); **Breadth** (% of S&P 500 or European members above their 20/50/200-day average, 12 months); **VIX** (12 months, 20 and 30 marked); **Where we stand** (regime tally of 11 indicators); **HYG** daily/weekly candles with moving averages; **Sector performance** (SPDR sectors, 1D/1W/1M/YTD); **Signals** (current extremes); **Today** (expected S&P 500 move, economic calendar) |
| Positioning (COT) | One chart per market (22 futures: equity indices, VIX, rates, FX, metals, energy, crypto): a trader group's net position as % of open interest (bars), the weekly price (candles), dotted lines at the window's extremes, and below it the percentile through time against the last 1/3/5/10 years or all history. Toggle the group's longs and shorts and the other groups' net. Next to it a table of every market with its percentiles; click a row to chart it |
| Earnings & European peers | Next results of the US companies in our own peer list (`dashboard/universe/eu_peers.yaml`), with the release time in Amsterdam time (to the minute where SEC filings allow), when European peers can first trade on it, correlation with each peer and how the peer moved after the previous report. Filter: today / next 7 days / all |
| Activity | **Unusual volume** (US stocks ≥ $25B and ETFs ≥ $1B at 2x their 10-day volume, refreshed every 30 minutes in the US session); **200-day SMA taps** (S&P 500 members, ETFs and futures whose range touched the 200-day average); **Record volume** (≥ 90% of the biggest day ever); **European small-cap movers** (up 10%+, under $1B). Each with a running log of the last 10 sessions |
| Performance | US ETF table (sectors, styles, themes, bonds, commodities) and country/region ETFs and STOXX 600 sectors: day, week, 1M, 3M, YTD, 1Y with shading by size, sortable; TradingView heatmap (S&P 500 / STOXX 600) |
| Options & flows | Put/call ratio per index with a period choice; SPY/QQQ/IWM put or call volume cleared at OCC (2 years, rank, vs 50-day average, bars coloured by up/down day); short (inverse) ETF share of SPY/QQQ/IWM family dollar volume since 2021 with price, 10-day average and percentile |
| Price charts | Daily/weekly candles with 50/200-day (10/40-week) averages for the main indexes and ETFs, with an optional breadth panel (% above 20/50/200-day, % beating the index, McClellan summation)
| Seasonality | Average, median or % of years up per calendar month over 10/15/20 years: NQ, ES, DAX, Euro Stoxx 50, gold, silver, crude, ZN, ZB, dollar, EUR/USD, bitcoin |
| More charts (folded) | Risk appetite: equal- vs cap-weight S&P 500 since 2003, HYG/IEF, SMH/SPY, XLY/XLP; volatility (VIX term structure, MOVE, Nasdaq-100 weekly returns); rates & credit; dollar; commodities; crypto; Asia |

Every card and chart explains itself ("What does this show?"). All charts zoom with the mouse
wheel or a pinch, move by dragging, and reset with a double-click. **Open in TradingView ↗**
opens the symbol in your own TradingView account (with your paid real-time data). Light and
dark layout: the toggle at the top right (follows the system setting until you choose).

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
- Frontend: one HTML/CSS/JS page, no build step. Charts: TradingView Lightweight Charts
  (open source, Apache 2.0) from jsdelivr; fonts Inter and Source Serif from Google Fonts.
- Live quotes, sector heatmap and economic calendar: free TradingView widgets.
- Other data: FRED, CFTC (COT), CBOE (VIX indices, put/call ratios), SEC EDGAR (8-K times),
  Yahoo Finance via yfinance (daily bars with volume, including all S&P 500 members; the
  screener for unusual volume) and TradingView's stock screener (European small caps).
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
| Earnings release times, OCC option volume | Mon–Fri 08:00, plus with the 18:00 and 22:30 refreshes |
| Unusual volume, 200-day taps, European small caps | Mon–Fri every 30 minutes from 15:45 to 22:15, plus with the daily refreshes |
| Record volume | With the daily refreshes; the all-time records themselves Saturday 10:00 |
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
  The 08:00 refresh then pins the minute from SEC EDGAR (`data.sec.gov`, free, no key): the
  acceptance time of each past 8-K with item 2.02 (results) that falls in the same hour as the
  Yahoo time. When three of the last four agree within 15 minutes, the median is shown without
  ≈ (e.g. Boeing 07:30, UPS 06:05 New York). Companies that file their 8-K hours after the
  press release (IBM, AT&T and others) keep the hour estimate. CIKs are under `sec_cik` in the
  peer file; `SEC_CONTACT` in `.env` is optional (the SEC asks automated tools to identify
  themselves).
  Suggested extra pairs sit under `extra_peers` in the peer file and are off unless
  `earnings.use_extra_peers: true`. Quote tickers YAML reads as yes/no, such as `"ON"`.
- **Put/call per index:** CBOE publishes daily index figures only for SPX and VIX. Nasdaq-100
  options trade elsewhere, so SPY, QQQ and IWM (ETF) options stand in: puts ÷ calls cleared at
  OCC per day, two years of history.
- **Not included (paid or proprietary):** NAAIM, AAII, BofA Fund Manager Survey, Goldman
  prime-book data, and newsletter models such as a "Core Risk Model" or the Daily Sentiment
  Index. VSTOXX has no free source either, so there is no Euro Stoxx 50 expected move.
- **CBOE VIX history** comes from `cdn.cboe.com`, which redirects to `cdn-api.cboe.com`.
  Behind a strict firewall, allow both. If CBOE cannot be reached, VIX, VIX9D and VIX3M are
  taken from Yahoo (`^VIX`, `^VIX9D`, `^VIX3M`), which carries the same index closes.
- **Put/call ratios** come from CBOE's daily market statistics, published the next
  morning. The latest value is therefore always the previous US session.
- **COT** shows positions as of Tuesday, published the following Friday. The weekly candles in
  the COT chart are aligned to the report's Tuesday.
- **Fear & greed** is our own composite, not CNN's index: momentum (S&P 500 vs its 125-day
  average), volatility (VIX vs its 50-day average), breadth (% above the 50-day), safe-haven
  demand (SPY minus TLT over 20 days) and junk-bond demand (high-yield spread), each as its
  percentile of the past 252 sessions; the score is their average.
- **Unusual volume** uses Yahoo's screener: today's volume ÷ Yahoo's 10-day average volume.
  During the session the day is incomplete. Preferred shares are left out.
- **Record volume** compares the latest session with the biggest day in Yahoo's full history
  (rebuilt every Saturday; the first five trading days after a listing do not count).
- **European small caps** come from TradingView's stock screener (`scanner.tradingview.com`,
  the same source as the news alerts). Market cap and traded value are converted to dollars.
- **OCC option volume** comes from `marketdata.theocc.com` (volume query, monthly reports):
  contracts per day summed over all exchanges, account types and option roots, so both sides
  of each trade count. OCC publishes the previous session in the morning.
- **Short ETF share:** inverse ETFs' share of the family's dollar volume (close × shares):
  SPY, IVV, VOO, SSO, UPRO, SPXL vs SH, SDS, SPXU, SPXS; QQQ, QQQM, QLD, TQQQ vs PSQ, QID,
  SQQQ; IWM, VTWO, UWM, TNA vs RWM, TWM, TZA. Families are under `prices.short_etf_families`.
- **Seasonality:** completed calendar months from Yahoo monthly closes. Futures use the
  continuous front-month contract (not back-adjusted), so a roll month includes the roll gap.

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
`widget-sheriff.tradingview-widget.com`. The charts (Lightweight Charts) load from `cdn.jsdelivr.net`. The backend needs
`scanner.tradingview.com` for the European small-cap list and `marketdata.theocc.com` for the
OCC option volume.
