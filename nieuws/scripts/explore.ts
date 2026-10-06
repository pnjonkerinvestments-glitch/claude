// Tijdelijk: velden en woorden verkennen voor het ochtendoverzicht.
import { loadConfig } from "../src/config.ts";
import { feedUrl, groupFilters, matchFilters } from "../src/screener.ts";
import { parseNewsResponse, storyApiUrl } from "../src/tradingview.ts";

const headers = { Accept: "application/json", Origin: "https://www.tradingview.com", Referer: "https://www.tradingview.com/", "User-Agent": "Mozilla/5.0" };
const config = loadConfig({} as never);
const SCAN = "https://scanner.tradingview.com/global/scan?label-product=screener-stock";
const now = Math.floor(Date.now() / 1000);

async function scan(body: unknown): Promise<{ status: number; json: any; text: string }> {
  const r = await fetch(SCAN, { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const text = await r.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {}
  return { status: r.status, json, text: text.slice(0, 300) };
}

const iso = (t: unknown) => (typeof t === "number" && t > 1e9 ? new Date(t * 1000).toISOString().slice(0, 16) : t);

// ---- A. velden
console.log("== A. velden");
const fields = [
  "dividend_amount_upcoming", "dividend_ex_date_upcoming", "dividend_payment_date_upcoming", "dividends_yield_current",
  "dividends_yield", "dividend_amount_recent", "dividend_ex_date_recent", "earnings_release_next_date",
  "earnings_release_date", "earnings_release_next_time", "earnings_release_time", "exchange", "isin", "update_mode", "premarket_change",
  "premarket_close", "change", "change_from_open", "gap", "volume", "currency", "fundamental_currency_code", "subtype",
  "typespecs", "ipo_offer_date", "ipo_offer_time", "ipo_announcement_date", "ipo_offer_status", "ipo_offer_price_usd",
  "ipo_deal_amount_usd", "ipo_market_cap_usd", "first_bar_time_1d", "listed_exchange", "type", "is_primary", "description",
  "logoid", "source-logoid", "pricescale", "time",
];
for (const field of fields) {
  const { status, json, text } = await scan({
    markets: ["germany"],
    filter: [{ left: "is_primary", operation: "equal", right: true }, { left: "type", operation: "equal", right: "stock" }],
    columns: ["name", field],
    sort: { sortBy: "market_cap_basic", sortOrder: "desc" },
    range: [0, 3],
  });
  console.log(`${field}: HTTP ${status}`, status === 200 ? JSON.stringify(json.data?.map((r: any) => r.d.map(iso))) : text);
}

const markets = config.screenMarkets;
const primaryStock = [{ left: "is_primary", operation: "equal", right: true }, { left: "type", operation: "equal", right: "stock" }];

// ---- B. dividend ≥ 25%
console.log("\n== B. aangekondigd dividend t.o.v. koers");
{
  const { status, json, text } = await scan({
    markets,
    filter: [...primaryStock, { left: "dividend_amount_upcoming", operation: "greater", right: 0 }],
    columns: ["name", "description", "close", "currency", "dividend_amount_upcoming", "dividend_ex_date_upcoming", "dividend_payment_date_upcoming", "market_cap_basic", "country", "exchange"],
    range: [0, 5000],
  });
  console.log("HTTP", status, status !== 200 ? text : `totaal ${json.totalCount}`);
  if (status === 200) {
    const rows = json.data.map((r: any) => ({ s: r.s, d: r.d, ratio: r.d[4] / r.d[2] })).filter((r: any) => r.d[2] > 0);
    rows.sort((a: any, b: any) => b.ratio - a.ratio);
    for (const r of rows.slice(0, 30)) console.log(`  ${(r.ratio * 100).toFixed(1)}% ${r.s} | ${r.d[1]} | koers ${r.d[2]} ${r.d[3]} div ${r.d[4]} ex ${iso(r.d[5])} pay ${iso(r.d[6])} | ${r.d[8]}`);
    const ex = rows.map((r: any) => r.d[5]).filter((t: any) => typeof t === "number");
    console.log("  ex-datums van", iso(Math.min(...ex)), "tot", iso(Math.max(...ex)));
  }
}

// ---- C. cijfers vandaag
console.log("\n== C. cijfers (earnings_release_next_date) komende 2 dagen");
{
  const { status, json, text } = await scan({
    markets,
    filter: [...primaryStock, { left: "earnings_release_next_date", operation: "in_range", right: [now - 86400, now + 2 * 86400] }],
    columns: ["name", "description", "earnings_release_next_date", "earnings_release_next_time", "earnings_release_date", "market_cap_basic", "country"],
    sort: { sortBy: "earnings_release_next_date", sortOrder: "asc" },
    range: [0, 2000],
  });
  console.log("HTTP", status, status !== 200 ? text : `totaal ${json.totalCount}`);
  if (status === 200) for (const r of json.data.slice(0, 15)) console.log(`  ${r.s} | ${r.d[1]} | ${iso(r.d[2])} | t=${r.d[3]} | vorige ${iso(r.d[4])} | ${r.d[6]}`);
}

// ---- D. beurzen: primaire en andere noteringen
console.log("\n== D. noteringen per beurs");
for (const primary of [true, false]) {
  const counts = new Map<string, number>();
  let total = 0;
  for (let offset = 0; offset === 0 || offset < Math.min(total, 60000); offset += 10000) {
    const { status, json, text } = await scan({
      markets,
      filter: [{ left: "is_primary", operation: "equal", right: primary }, { left: "type", operation: "equal", right: "stock" }],
      columns: ["exchange", "country"],
      range: [offset, offset + 10000],
    });
    if (status !== 200) {
      console.log("HTTP", status, text);
      break;
    }
    total = json.totalCount;
    for (const r of json.data) counts.set(r.d[0], (counts.get(r.d[0]) ?? 0) + 1);
    if (!json.data.length) break;
  }
  console.log(`${primary ? "primair" : "overig"}: totaal ${total}:`, [...counts].sort((a, b) => b[1] - a[1]).map(([e, n]) => `${e} ${n}`).join(", "));
}

// ---- E. Tradegate en L&S: koersen in de ochtend
console.log("\n== E. Tradegate / LS");
for (const exchange of ["TRADEGATE", "LS", "LSX", "GETTEX"]) {
  const { status, json, text } = await scan({
    markets,
    filter: [{ left: "exchange", operation: "equal", right: exchange }, { left: "type", operation: "equal", right: "stock" }, { left: "volume", operation: "greater", right: 0 }],
    columns: ["name", "description", "close", "change", "volume", "update_mode", "country", "market_cap_basic", "currency", "isin"],
    sort: { sortBy: "change", sortOrder: "desc" },
    range: [0, 8],
  });
  console.log(`${exchange}: HTTP ${status}`, status === 200 ? `totaal met volume ${json.totalCount}` : text);
  if (status === 200) for (const r of json.data) console.log("   ", r.s, JSON.stringify(r.d));
}

// ---- F. IPO-kalender
console.log("\n== F. IPO-velden");
{
  const { status, json, text } = await scan({
    markets,
    filter: [{ left: "ipo_offer_date", operation: "in_range", right: [now - 30 * 86400, now + 120 * 86400] }],
    columns: ["name", "description", "exchange", "ipo_offer_date", "ipo_offer_status", "ipo_offer_price_usd", "ipo_market_cap_usd", "country", "type", "is_primary", "close"],
    sort: { sortBy: "ipo_offer_date", sortOrder: "desc" },
    range: [0, 60],
  });
  console.log("HTTP", status, status !== 200 ? text : `totaal ${json.totalCount}`);
  if (status === 200) for (const r of json.data) console.log("   ", r.s, JSON.stringify(r.d.map(iso)));
}

// ---- G. nieuwsstromen + story
const items = new Map<string, ReturnType<typeof parseNewsResponse>[number] & { lang: string }>();
for (const feed of config.screenFeeds) {
  let cursor = "";
  for (let page = 0; page < 12; page++) {
    const r = await fetch(feedUrl(feed) + (cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""), { headers });
    if (!r.ok) break;
    const body: any = await r.json();
    const parsed = parseNewsResponse(body);
    for (const i of parsed) items.set(i.id, { ...i, lang: feed.lang });
    if (!body?.pagination?.cursor || !parsed.length) break;
    cursor = body.pagination.cursor;
  }
}
const all = [...items.values()];
console.log("\n== G. koppen", all.length, "oudste", iso(Math.min(...all.map((i) => i.published))));
for (const sample of all.filter((i) => /offer|angebot|PDUFA|FDA|Annahmefrist|acceptance/i.test(i.title)).slice(0, 3)) {
  const r = await fetch(storyApiUrl(sample.id, sample.lang), { headers });
  const body: any = await r.json().catch(() => null);
  console.log(`story ${sample.title}: HTTP ${r.status} keys ${body ? Object.keys(body).join(",") : "-"}`);
  if (body) {
    for (const [k, v] of Object.entries(body)) {
      const s = typeof v === "string" ? v : JSON.stringify(v);
      console.log(`   ${k} (${s?.length}): ${s?.slice(0, 500)}`);
    }
  }
}

// ---- H. woorden
const lists: Record<string, string[]> = JSON.parse(String(await (await import("node:fs/promises")).readFile("scripts/explore-words.json", "utf8")));
for (const [filter, words] of Object.entries(lists)) {
  console.log(`\n######## ${filter}`);
  for (const word of words) {
    const hits = all.filter((item) => matchFilters(item.title, groupFilters([{ filter: "x", word }])).length);
    console.log(`### "${word}": ${hits.length}`);
    for (const h of hits.slice(0, 6)) console.log("   ", `${h.symbols.slice(0, 2).join(",") || "-"} | ${h.title}`.slice(0, 180));
  }
}
export {};
