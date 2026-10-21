"""Plain-language explanations shown next to every indicator, chart and table column."""

from __future__ import annotations

# One line per section: what you learn there.
SECTIONS = {
    "summary": "The overall picture in one place: a traffic-light tally of trend, breadth, volatility, "
               "sentiment and credit, the key numbers of the week, and a list of anything at an extreme.",
    "indexcot": "Who is long or short the big US stock index futures, and how unusual that is compared "
                "with history. Extremes in positioning often mark turning points, because a crowded "
                "trade has few buyers (or sellers) left.",
    "earnings": "Upcoming results of US companies worth at least $1.5 billion, with their European "
                "peers. A US report often moves its European counterparts too: before the US open "
                "(BMO) Europe reacts the same afternoon, after the US close (AMC) at the next "
                "European open.",
    "today": "What the options market expects for today's S&P 500 range, the important economic releases, "
             "and a heatmap of today's moves.",
    "stocks": "How many stocks take part in the move. A rally carried by a handful of large stocks is "
              "more fragile than one where most stocks rise.",
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
    "outperform": "Top: the S&P 500. Bottom: the share of S&P 500 stocks that did better than the index "
                  "over the last ~2 months. Low values mean a narrow market led by a few giants; turns "
                  "up from very low levels often start a broader rally.",
    "summation": "Built from how many S&P 500 stocks rise versus fall each day (advance/decline). The "
                 "summation index adds up the McClellan oscillator: rising = breadth improving, falling = "
                 "fewer stocks participate. Turns from deep lows often mark bottoms.",
    "above-ma": "Share of stocks above their 50-day (short-term) and 200-day (long-term) average, for the "
                "US and Europe. Above ~70% is strong, below ~30% is washed out.",
    "rsp-spy": "Equal-weight S&P 500 (every stock the same weight) divided by the normal cap-weighted "
               "index. Falling = the biggest companies outperform the average stock (concentration).",
    "streak": "Number of trading days since the S&P 500 last fell 1% or more in a day. Long streaks show "
              "calm; when a long streak ends, volatility often returns for a while.",
    "rsi": "Top: price with 50- and 200-day average. Bottom: RSI(14), a 0-100 momentum gauge. Below 30 = "
           "oversold (selling stretched), above 70 = overbought.",
    "ratio-HYG_IEF": "High-yield bonds (HYG) versus Treasuries (IEF). Rising = investors prefer credit "
                     "risk: risk-on. Falling = flight to safety.",
    "ratio-COPPER_GOLD": "Copper (growth metal) versus gold (safe haven). Rising = growth optimism; it "
                         "often moves with bond yields.",
    "ratio-RSP_SPY": "Equal-weight versus cap-weight S&P 500. Rising = the average stock leads: healthy, "
                     "broad market.",
    "ratio-SMH_SPY": "Semiconductors versus the S&P 500. Rising = the AI/chip trade leads.",
    "ratio-XLY_XLP": "Consumer discretionary versus consumer staples. Rising = investors bet on spending "
                     "and growth; falling = defensive.",
    "vix-term": "Top: VIX9D (9-day), VIX (30-day) and VIX3M (3-month) expected volatility. Bottom: VIX "
                "divided by VIX3M. Above 1 (shaded) = backwardation: short-term fear exceeds long-term.",
    "move": "The MOVE index is the 'VIX of bonds': expected volatility of US Treasury yields. High = "
            "turbulent rates, which often spills over into stocks.",
    "pc-equity": "Puts per call on individual US stocks, with 5- and 10-day averages. Spikes mean fear "
                 "and hedging; near extremes this is often contrarian bullish.",
    "pc-index": "Puts per call on index options (mostly used by institutions to hedge portfolios).",
    "ndx-weekly": "Every bar is one week's change in the Nasdaq-100. Red bars are weeks down 5% or more; "
                  "most of these happened close to a low.",
    "cot": "Top: price. Bottom: how long or short this trader group is versus all history (percentile of "
           "net position divided by open interest). Green zone = crowded short (contrarian bullish), red "
           "zone = crowded long (contrarian bearish).",
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
    "When": "Report date and time in Amsterdam time. BMO = before the US open, AMC = after the US close.",
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
    "am": ("Asset managers", "Pension funds, insurers, mutual funds. Mostly long-only investors; "
                             "a high percentile means they are fully invested."),
    "lf": ("Leveraged funds", "Hedge funds and CTAs (trend followers). Fast money; often on the other "
                              "side of asset managers through basis trades, and the group most likely "
                              "to be squeezed."),
    "dealer": ("Dealers", "Banks and market makers. They mostly take the other side of client trades, so "
                          "their position mirrors what clients want."),
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
