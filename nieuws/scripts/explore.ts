// Tijdelijk: valuta van dividendvelden, beursfilter en storytekst verkennen.
import { loadConfig } from "../src/config.ts";
import { feedUrl } from "../src/screener.ts";
import { parseNewsResponse, storyApiUrl } from "../src/tradingview.ts";

const headers = { Accept: "application/json", Origin: "https://www.tradingview.com", Referer: "https://www.tradingview.com/", "User-Agent": "Mozilla/5.0" };
const config = loadConfig({} as never);
const SCAN = "https://scanner.tradingview.com/global/scan?label-product=screener-stock";
async function scan(body: unknown): Promise<any> {
  const r = await fetch(SCAN, { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const text = await r.text();
  try {
    return { status: r.status, ...JSON.parse(text) };
  } catch {
    return { status: r.status, text: text.slice(0, 300) };
  }
}
const markets = config.screenMarkets;
const tickers = ["OSL:DVD", "BME:A3M", "LSE:TSCO", "OMXSTO:INDU_A", "SIX:NESN", "OMXCOP:NOVO_B", "XETR:SAP", "LSE:BP."];
const cols = ["close", "currency", "dividend_amount_upcoming", "dividend_amount_recent", "market_cap_basic", "dividends_yield_current", "fundamental_currency_code"];
for (const conv of [undefined, { to_symbol: true }, { to_currency: "usd" }, { to_currency: "eur" }]) {
  const res = await scan({ symbols: { tickers }, columns: cols, ...(conv ? { price_conversion: conv } : {}) });
  console.log(`\n== conversie ${JSON.stringify(conv)}: HTTP ${res.status} ${res.text ?? ""}`);
  for (const r of res.data ?? []) console.log("  ", r.s, JSON.stringify(r.d));
}

// beursfilter met lijst
for (const op of ["in_range", "equal"]) {
  const res = await scan({
    markets,
    filter: [
      { left: "is_primary", operation: "equal", right: false },
      { left: "type", operation: "equal", right: "stock" },
      { left: "exchange", operation: op, right: op === "in_range" ? ["LSE", "XETR", "SIX", "EURONEXT", "MIL", "BME", "OMXSTO", "OMXCOP", "OMXHEX", "OSL", "VIE", "BX", "AQUIS", "NGM", "LUXSE"] : "SIX" },
      { left: "country", operation: "in_range", right: config.screenCountries },
    ],
    columns: ["name", "description", "exchange", "country", "isin", "market_cap_basic"],
    range: [0, 5000],
  });
  console.log(`\n== niet-primair, beurs ${op}: HTTP ${res.status} ${res.text ?? ""} totaal ${res.totalCount}`);
  const counts = new Map<string, number>();
  for (const r of res.data ?? []) counts.set(r.d[2], (counts.get(r.d[2]) ?? 0) + 1);
  console.log([...counts].map(([e, n]) => `${e} ${n}`).join(", "));
  for (const r of (res.data ?? []).filter((r: any) => ["SIX", "EURONEXT", "OMXSTO", "XETR"].includes(r.d[2])).slice(0, 12)) console.log("  ", r.s, JSON.stringify(r.d));
}

// primair alle marktwaarden, met isin
{
  const res = await scan({
    markets,
    filter: [{ left: "is_primary", operation: "equal", right: true }, { left: "type", operation: "equal", right: "stock" }],
    columns: ["description", "exchange", "country", "isin"],
    range: [0, 5],
  });
  console.log(`\n== primair: ${res.status} ${res.totalCount}`, JSON.stringify(res.data?.slice(0, 3)));
  const nofilter = await scan({ markets, filter: [{ left: "is_primary", operation: "equal", right: true }], columns: ["description", "type", "isin"], range: [0, 1] });
  console.log(`primair zonder typefilter: ${nofilter.totalCount}`);
}

// IPO's met status anders dan closed
{
  const res = await scan({
    markets: ["america", ...markets],
    filter: [{ left: "ipo_offer_status", operation: "nempty" }, { left: "ipo_offer_status", operation: "not_in_range", right: ["closed"] }],
    columns: ["name", "description", "exchange", "ipo_offer_date", "ipo_offer_status", "type", "is_primary", "close", "country"],
    range: [0, 20],
  });
  console.log(`\n== IPO's niet closed: ${res.status} ${res.text ?? ""} ${res.totalCount}`);
  for (const r of res.data ?? []) console.log("  ", r.s, JSON.stringify(r.d));
}

// storytekst van EQS/langere berichten
const items: any[] = [];
for (const feed of config.screenFeeds.slice(0, 2)) {
  const r = await fetch(feedUrl(feed), { headers });
  items.push(...parseNewsResponse(await r.json()).map((i) => ({ ...i, lang: feed.lang })));
}
for (const sample of items.filter((i) => /eqs|dpa|globe|pta/i.test(i.provider)).slice(0, 2)) {
  const r = await fetch(storyApiUrl(sample.id, sample.lang), { headers });
  const body: any = await r.json().catch(() => null);
  console.log(`\nstory [${sample.provider}] ${sample.title}: ${r.status} ast ${body?.astDescription ? JSON.stringify(body.astDescription).length : "-"}`);
  console.log(JSON.stringify(body?.astDescription).slice(0, 1500));
}
export {};
