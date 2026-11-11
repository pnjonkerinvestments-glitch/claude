"""Plain-language explanations shown next to every indicator, chart and table column."""

from __future__ import annotations

# One line per section: what you learn there.
SECTIONS = {
    "overview": "Markets, sentiment, breadth, volatility, credit and sectors at a glance.",
    "activity": "Where the trading is unusual today: volume far above normal, stocks testing their "
                "200-day average, record volume and big moves in European small caps.",
    "performance": "How sectors, themes, countries and European sectors did over the day, week, month, "
                   "quarter, year to date and year.",
    "flows": "Option hedging and bets on a fall: put/call ratios per index, put and call volume cleared at "
             "OCC, and the share of inverse (short) ETFs in trading volume.",
    "seasonality": "How each market did on average in each calendar month over the last 10, 15 or 20 years.",
    "summary": "The overall picture in one place: a traffic-light tally of trend, breadth, volatility, "
               "sentiment and credit, and a list of anything at an extreme.",
    "earnings": "Next results of the US companies in our peer list, with the release time in Amsterdam "
                "time and when their European peers can first trade on it. A release before 17:30 can be "
                "traded in Europe the same day; after the US close, at the next European open (09:00).",
    "today": "What the options market expects for today's S&P 500 range, the important economic releases, "
             "and a heatmap of today's moves.",
    "appetite": "Ratios between riskier and safer assets. When the riskier side outperforms, investors "
                "are willing to take risk.",
    "volatility": "How nervous the market is: implied volatility, hedging with put options, and sharp "
                  "weekly drops.",
    "positioning": "COT positioning for 22 futures markets in one table, from equity indices to oil and "
                   "bitcoin.",
    "rates": "US Treasury yields and the credit market. Rising yields tighten financial conditions; "
             "widening credit spreads signal stress.",
    "dollar": "The US dollar against a basket and against the euro. A strong dollar tightens global "
              "financial conditions and weighs on commodities and emerging markets.",
    "commodities": "Precious metals, industrial metals and energy, with how speculators are positioned.",
    "crypto": "Bitcoin and ether trend and volatility. Long quiet periods tend to end in large moves.",
    "asia": "Korea and Japan. Korea (Samsung, SK Hynix) often moves first in the chip cycle.",
}

# Regime indicators (summary tiles), keyed by indicator key prefix.
INDICATORS = {
    "trend": "Is the index above its 20-, 50- and 200-day average? Above all three is a healthy uptrend; "
             "below all three a downtrend.",
    "breadth": "Share of the index members trading above their own 50- and 200-day average. High = "
               "broad participation; low = only a few stocks hold the index up.",
    "vix": "The VIX measures the volatility the options market expects for the S&P 500 over the next "
           "30 days. Below ~18 is calm, above ~25 is fear.",
    "vix_term": "VIX compared with 3-month VIX (VIX3M). Normally short-term volatility is lower "
                "(contango). When it rises above (backwardation), traders pay up for protection now: stress.",
    "put_call": "Puts bought per call on US stocks (CBOE). High = heavy hedging and fear, which near "
                "extremes is often contrarian bullish; low = complacency.",
    "credit": "Extra yield investors demand on junk bonds over Treasuries. Rising quickly = credit "
              "stress, which usually hits stocks too.",
    "curve": "10-year minus 2-year Treasury yield. Negative (inverted) has preceded most US recessions.",
}

# Charts, keyed by chart id or its prefix (the part before the first "-").
CHARTS = {
    "rsp-spy": "Equal-weight S&P 500 (every stock the same weight) divided by the normal cap-weighted "
               "index. Falling = the biggest companies outperform the average stock (concentration).",
    "ratio-HYG_IEF": "High-yield bonds (HYG) versus Treasuries (IEF). Rising = investors prefer credit "
                     "risk: risk-on. Falling = flight to safety.",
    "ratio-SMH_SPY": "Semiconductors versus the S&P 500. Rising = the AI/chip trade leads.",
    "ratio-XLY_XLP": "Consumer discretionary versus consumer staples. Rising = investors bet on spending "
                     "and growth; falling = defensive.",
    "vix-term": "Top: VIX9D (9-day), VIX (30-day) and VIX3M (3-month) expected volatility. Bottom: VIX "
                "divided by VIX3M. Above 1 (shaded) = backwardation: short-term fear exceeds long-term.",
    "move": "The MOVE index is the 'VIX of bonds': expected volatility of US Treasury yields. High = "
            "turbulent rates, which often spills over into stocks.",
    "putcall": "Puts traded per call, per index, with 5- and 10-day averages. High = heavy hedging and "
               "fear, which near extremes is often contrarian bullish; low = complacency. Index options "
               "normally sit above 1 because institutions buy index puts as insurance; compare a series "
               "with its own history, not with the others. For the ETFs the open-interest ratio (all "
               "open positions, not just today's trades) is shown too: a slower, positioning-type gauge.",
    "ndx-weekly": "Every bar is one week's change in the Nasdaq-100. Red bars are weeks down 5% or more; "
                  "most of these happened close to a low.",
    "us2y": "The 2-year Treasury yield follows expected Fed policy. Below its averages = the market prices "
            "in rate cuts.",
    "oil-10y": "10-year yield, crude oil and their 60-day correlation. A high positive correlation means "
               "inflation fears from oil are driving bond yields.",
    "hy": "Junk-bond spread over Treasuries. Low = calm credit markets; a quick rise is an early "
          "warning for stocks.",
    "ty": "Price of the 10-year Treasury note future. Price up = yields down. Shown with 50/100/200-day "
          "averages.",
    "wk": "Weekly chart with the 200-week average, a long-term trend line.",
    "crypto": "Top: price with 50/200-day average. Bottom: 90-day volatility and 180-day trading range, "
              "each as a percentile of the last four years. Both in the shaded zone = compression: "
              "unusually quiet, which tends to end in a large move (direction unknown).",
    "eth-btc": "Ether divided by bitcoin. Rising = appetite for the riskier crypto asset.",
    "asia": "Index with 50- and 200-day average.",
    "ewy-smh": "Korea ETF versus US semiconductors. Korea often turns first in the chip cycle.",
}

# Table column headers.
COLUMNS = {
    "1W": "Change over the last 5 trading days (in %, or in basis points for yields).",
    "1M": "Change over the last 21 trading days (in %, or in basis points for yields).",
    "3M": "Change over the last 63 trading days.",
    "Rel 1M": "1-month return minus the benchmark's. Positive = beat the benchmark.",
    "Rel 3M": "3-month return minus the benchmark's.",
    "vs 50d": "Distance from the 50-day average. Positive = above it (short-term uptrend).",
    "vs 200d": "Distance from the 200-day average. Positive = above it (long-term uptrend).",
    "RSI": "RSI(14), 0-100 momentum. OS = oversold (≤ 30), OB = overbought (≥ 70).",
    "COT %ile": "Speculators' net position as share of open interest, percentile since 2006. "
                "≤ 10 crowded short, ≥ 90 crowded long.",
    "Vol %ile": "90-day realized volatility as percentile of the last four years.",
    "Compression": "Yes when both volatility and trading range are in their lowest 20%.",
    "Net": "Long minus short contracts of this trader group.",
    "1W chg": "Change in the net position since last week's report.",
    "Net/OI": "Net position as a share of all open contracts (open interest).",
    "All-time": "Percentile of Net/OI against all weeks since the data starts (2006 for most).",
    "5Y": "Percentile of Net/OI against the last 5 years.",
    "1Y": "Percentile of Net/OI against the last year.",
    "Nominal": "Percentile of the raw net contracts (not divided by open interest), all-time.",
    "Release (Amsterdam)": "Expected release time in Amsterdam time (≈ = the company's usual time from its last reports). Hover for the source and New York time.",
    "Last time": "How the European peer moved on the day it could first react to the previous report (close to close).",
    "EU can trade": "First moment European peers can trade on the release (Xetra/Euronext 09:00–17:30).",
    "US stock": "When the US stock itself reacts, and how it moved after the previous report.",
    "Market cap": "Company value in billions of dollars.",
    "EPS est.": "Analysts' average earnings-per-share estimate; after the report, the reported EPS and "
                "the surprise versus the estimate.",
    "EU peers": "European companies in the same business (from eu_peers.yaml) with their 1-week "
                "return and correlation with the US company.",
    "Corr": "Correlation of weekly returns over the last year, from −1 to +1. Above ~0.5 = the two "
            "usually move together, so the US report is likely to move the peer.",
    "EU reacts": "When European peers can first trade on the news.",
    "3Y %ile": "Where today's level sits within the last 3 years (100 = highest).",
    "1D": "Change since the previous day, in basis points (0.01 percentage point).",
}

GROUPS = {
    "mm": ("Managed money", "Hedge funds and CTAs trading commodities: the speculators. Their extremes are "
                            "the classic contrarian signal in commodities."),
    "pm": ("Producers & merchants", "Miners, oil companies, refiners and traders hedging their physical "
                                    "business. Usually short; they sell into rallies."),
    "swap": ("Swap dealers", "Banks using futures to hedge commodity swaps and index products sold to clients."),
    "am": ("Asset managers", "Pension funds, insurers, mutual funds. Mostly long-only investors; "
                             "a high percentile means they are fully invested."),
    "lf": ("Leveraged funds", "Hedge funds and CTAs (trend followers). Fast money; often on the other "
                              "side of asset managers through basis trades, and the group most likely "
                              "to be squeezed."),
    "dealer": ("Dealers", "Banks and market makers. They mostly take the other side of client trades, so "
                          "their position mirrors what clients want."),
    "other": ("Other reportables", "Large traders that fit none of the other groups, such as corporate "
                                   "treasuries, smaller funds and family offices."),
}

INDEX_COT_HOWTO = (
    "COT (Commitments of Traders) is a weekly CFTC report of futures positions as of Tuesday, published on "
    "Friday. Net = long minus short contracts. Because the number of open contracts changes over time, "
    "the percentile uses net divided by open interest and ranks it against history. Read it as a "
    "contrarian gauge at the extremes: when a group is more long than ever (≥ 90th percentile) there are "
    "few buyers left; when it is more short than ever (≤ 10th) a short squeeze can follow. Between the "
    "extremes it says little. Futures only; investors who hold ETFs or stocks are not in it."
)


def chart_text(cid: str) -> str | None:
    if cid in CHARTS:
        return CHARTS[cid]
    return CHARTS.get(cid.split("-", 1)[0])


def indicator_text(key: str) -> str | None:
    if key in INDICATORS:
        return INDICATORS[key]
    return INDICATORS.get(key.split("_", 1)[0])

# --- overview cards and the newer sections -------------------------------------------------

CARDS = {
    "markets": "Indexes, rates, dollar and commodities · day, week (5 sessions) and year-to-date change; "
               "the 10-year yield in basis points",
    "fear_greed": "0 = extreme fear, 100 = extreme greed. Average of five market signals, each scored "
                  "against its own past year: 0 means the most fearful reading of the year, 100 the most "
                  "greedy. Below 25 = extreme fear, 25–45 fear, 45–55 neutral, 55–75 greed, above 75 "
                  "extreme greed. Contrarian at the extremes.",
    "breadth": "Share of index members above their 20-, 50- and 200-day moving averages. Above 80% on the "
               "20-day is short-term stretched, below 20% washed out. A falling 200-day line while the "
               "index rises means fewer stocks carry the rally.",
    "vix": "Expected S&P 500 volatility over 30 days, from option prices. Below 20 is calm, above 30 is "
           "stress. Spikes tend to mark short-term lows.",
    "hyg": "The largest high-yield (junk) bond ETF. Credit usually turns before stocks: HYG falling below "
           "its 50- and 200-day averages while stocks hold up is an early warning.",
    "sectors": "S&P 500 sector ETFs (SPDR), change over the chosen period. Defensives (staples, "
               "utilities, health care) leading means investors are cautious.",
    "short_share": "Inverse (short) ETFs' share of the fund family's daily dollar volume (close × shares). "
                   "A rising share means more traders are buying downside protection or betting on a fall. "
                   "High readings tend to come near lows.",
    "occ": "Daily option contracts cleared at OCC (the Options Clearing Corporation) on the ETF, summed over "
           "all exchanges, account types and option roots, so both sides of each trade count. A put-volume "
           "spike shows a rush for protection; it tends to come near short-term lows, especially on a down day.",
    "seasonality": "Return in each calendar month, completed months only, from Yahoo monthly closes. "
                   "Futures (NQ, ES, ZN, ZB, gold, silver, crude) use the continuous front-month contract, "
                   "which is not back-adjusted, so a month with a contract roll includes the roll gap. "
                   "The outlined column is the current month. Hover a cell for details.",
}

FEAR_GREED = {
    "momentum": ("Momentum", "S&P 500 relative to its 125-day average."),
    "volatility": ("Volatility", "VIX relative to its 50-day average; a high VIX scores as fear."),
    "breadth": ("Breadth", "% of S&P 500 members above their 50-day average."),
    "safe_haven": ("Safe-haven demand", "20-day return of stocks (SPY) minus long Treasuries (TLT); "
                                        "bonds beating stocks scores as fear."),
    "junk": ("Junk-bond demand", "High-yield credit spread (ICE BofA, FRED); a wider spread scores as fear."),
}

ACTIVITY = {
    "unusual": "Today's volume against the 10-day average, for US-listed stocks with a market cap of "
               "$25B or more and ETFs with $1B or more in assets (Yahoo screener, refreshed every half "
               "hour during the US session). During the session the day is incomplete: check after the "
               "close for the full day.",
    "taps": "Stocks (S&P 500), ETFs (both performance tables) and futures whose price range in the latest "
            "session touched the 200-day moving average: low at or below it and high at or above it. "
            "'Taps (10d)' counts the sessions in the last ten that touched it.",
    "record_volume": "Stocks and ETFs whose volume in the latest session reached 90% or more of their biggest "
                     "day ever (whole Yahoo history; the first five trading days after a listing do not "
                     "count). Records are rebuilt every Saturday.",
    "eu_smallcaps": "European stocks up 10% or more today with a market cap under $1B and more than $100K "
                    "traded, primary listings only (TradingView screener).",
}
