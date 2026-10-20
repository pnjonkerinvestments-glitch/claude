// Controleert tegen de echte TradingView-endpoints of het nieuws goed binnenkomt.
// Gebruik: npm run probe -- XETR:1INN NASDAQ:AAPL
// Draait in CI; faalt als TradingView wel items stuurt maar de parser er niets van maakt.

import { fetchStory, headlinesUrl, newsFlowUrl, parseNewsResponse, searchSymbol } from "../src/tradingview.ts";
import { formatNewsMessage } from "../src/telegram.ts";
import { DEFAULT_FILTERS, loadConfig } from "../src/config.ts";
import {
  countryName,
  fetchFeeds,
  formatCap,
  formatScreenerMessage,
  groupFilters,
  matchFilters,
  parseScannerRows,
  scannerPayload,
} from "../src/screener.ts";
import type { UniverseEntry } from "../src/store.ts";
import { listingsPayload, parseListings } from "../src/listings.ts";
import { dividendPayload, ipoPayload, parseDividends } from "../src/morning.ts";
import { scanner } from "../src/tradingview.ts";
import { fetchGrowthOslo } from "../src/growth.ts";
import { RIGHTS_EXCHANGES, searchRights } from "../src/rights.ts";
import { fetchQuotes, nodeSocket } from "../src/quotes.ts";

const symbols = process.argv.slice(2).length ? process.argv.slice(2) : ["XETR:1INN"];
const langs = ["de", "en"];
const headers = { Accept: "application/json", Origin: "https://www.tradingview.com", "User-Agent": "Mozilla/5.0" };
let problems = 0;

async function raw(url: string): Promise<{ status: number; body: unknown }> {
  const response = await fetch(url, { headers });
  const text = await response.text();
  try {
    return { status: response.status, body: JSON.parse(text) };
  } catch {
    return { status: response.status, body: text.slice(0, 300) };
  }
}

function rawCount(body: unknown): number {
  if (Array.isArray(body)) return body.length;
  const items = (body as { items?: unknown[] } | null)?.items;
  return Array.isArray(items) ? items.length : 0;
}

for (const symbol of symbols) {
  for (const lang of langs) {
    for (const [label, url] of [
      ["news-flow", newsFlowUrl(symbol, lang)],
      ["headlines", headlinesUrl(symbol, lang)],
    ] as const) {
      const { status, body } = await raw(url);
      const parsed = parseNewsResponse(body);
      console.log(`\n== ${symbol} ${lang} ${label}: HTTP ${status}, ruw ${rawCount(body)}, geparsed ${parsed.length}`);
      const first = Array.isArray(body) ? body[0] : (body as { items?: unknown[] })?.items?.[0];
      if (first) console.log("eerste ruwe item:", JSON.stringify(first).slice(0, 800));
      else if (status !== 200 || !parsed.length) console.log("antwoord:", JSON.stringify(body).slice(0, 300));
      if (rawCount(body) > 0 && parsed.length === 0) {
        console.log("!! TradingView stuurt items maar de parser herkent ze niet");
        problems++;
      }
      for (const item of parsed.slice(0, 3)) {
        console.log(`- ${new Date(item.published * 1000).toISOString()} [${item.provider}] ${item.title}`);
      }
      if (label === "news-flow" && parsed[0]) {
        try {
          const story = await fetchStory(fetch, parsed[0].id, lang);
          console.log("story:", JSON.stringify(story).slice(0, 500));
        } catch (error) {
          console.log("story mislukt:", (error as Error).message);
        }
        console.log("\nvoorbeeldmelding:\n" + formatNewsMessage({
          entry: { symbol, name: "" },
          item: parsed[0],
          timeZone: "Europe/Amsterdam",
        }));
      }
    }
  }
}

for (const query of ["1INN", "innoscripta"]) {
  try {
    const matches = await searchSymbol(fetch, query);
    console.log(`\nzoeken "${query}":`, matches.slice(0, 5).map((m) => `${m.symbol} (${m.name}, ${m.type})`).join("; ") || "niets");
    if (!matches.length) problems++;
  } catch (error) {
    console.log(`\nzoeken "${query}" mislukt:`, (error as Error).message);
    problems++;
  }
}

// ---- screener: selectie, nieuwsstromen en filterwoorden tegen echte data
const config = loadConfig({} as never);
const universe = new Map<string, UniverseEntry>();
let total = 0;
for (let offset = 0; offset === 0 || offset < total; offset += 1000) {
  const response = await fetch("https://scanner.tradingview.com/global/scan?label-product=screener-stock", {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(scannerPayload(config, { min: config.capMinEur, max: config.capMaxEur }, offset)),
  });
  const page = parseScannerRows(await response.json());
  total = page.total;
  for (const row of page.rows) if (config.screenCountries.includes(row.country)) universe.set(row.symbol, row);
  if (!page.rows.length) break;
}
const perCountry = new Map<string, number>();
for (const e of universe.values()) perCountry.set(e.country, (perCountry.get(e.country) ?? 0) + 1);
console.log(`\n== screener: ${universe.size} van ${total} aandelen tussen ${formatCap(config.capMinEur)} en ${formatCap(config.capMaxEur)}`);
console.log([...perCountry].sort((a, b) => b[1] - a[1]).map(([c, n]) => `${countryName(c)} ${n}`).join(", "));
if (universe.size < 1000) {
  console.log("!! selectie verdacht klein");
  problems++;
}

const errors: string[] = [];
const items = await fetchFeeds(fetch, config.screenFeeds, errors);
console.log(`\n== nieuwsstromen: ${items.length} unieke koppen uit ${config.screenFeeds.length} stromen`, errors.join("; "));
if (!items.length || errors.length) problems++;
const inUniverse = items.filter((i) => i.symbols.some((s) => universe.has(s)));
console.log(`waarvan ${inUniverse.length} over een aandeel in de selectie`);
const filters = groupFilters(DEFAULT_FILTERS.dividend.map((word) => ({ filter: "dividend", word })));
const hits = items.map((item) => ({ item, hits: matchFilters(item.title, filters) })).filter((h) => h.hits.length);
console.log(`dividendwoorden in ${hits.length} koppen (alle marktwaarden):`);
for (const { item, hits: h } of hits.slice(0, 15)) {
  const entry = item.symbols.map((s) => universe.get(s)).find(Boolean);
  console.log(`- ${entry ? "✔ " + formatCap(entry.capEur) : "✘ buiten selectie"} | ${item.symbols.join(",")} | ${item.title} | "${h[0].word}"`);
}
const sample = inUniverse[0];
if (sample) {
  const entry = sample.symbols.map((s) => universe.get(s)).find(Boolean)!;
  console.log("\nvoorbeeld screenermelding:\n" + formatScreenerMessage({
    entry,
    items: [sample],
    hits: [{ filter: "dividend", word: "(voorbeeld)" }],
    timeZone: config.timeZone,
  }));
}

// ---- ochtendoverzicht: alle screener-vragen moeten werken
{
  const today = Math.floor(Date.now() / 86400_000) * 86400;
  const checks: Array<[string, unknown, (rows: Array<{ s: string; d: unknown[] }>) => string]> = [
    ["noteringen (primair)", listingsPayload(config, "primary", 0), (rows) => `${parseListings(rows, true).filter((l) => l.isin).length} met ISIN`],
    ["noteringen (overig)", listingsPayload(config, "other", 0), (rows) => `${rows.length} rijen`],
    [
      "dividend",
      dividendPayload(config, today),
      (rows) => `${rows.length} aangekondigd, ≥25%: ${parseDividends(rows, config).map((d) => `${d.symbol} ${Math.round((d.amount / d.close) * 100)}%`).join(", ") || "geen"}`,
    ],
    ["IPO-kalender", ipoPayload(config, "pending", today), (rows) => rows.map((r) => r.s).join(", ") || "niets gepland"],
    ["IPO's afgelopen week", ipoPayload(config, "recent", today), (rows) => rows.map((r) => r.s).join(", ") || "geen"],
  ];
  console.log("\n== ochtendoverzicht");
  for (const [label, payload, describe] of checks) {
    try {
      const { rows, total } = await scanner(fetch, payload);
      console.log(`  ${label}: ${total} · ${describe(rows)}`);
      if (label.startsWith("noteringen") && rows.length < 100) {
        console.log(`!! ${label}: verdacht weinig`);
        problems++;
      }
    } catch (error) {
      console.log(`!! ${label}: ${(error as Error).message}`);
      problems++;
    }
  }
}

// ---- Euronext Growth Oslo en de rechtenkalender
try {
  const growth = await fetchGrowthOslo(fetch);
  console.log(`\n== Euronext Growth Oslo: ${growth.symbols.length} aandelen, bijv. ${growth.symbols.slice(0, 5).join(", ")}`);
} catch (error) {
  console.log(`!! Euronext Growth Oslo: ${(error as Error).message}`);
  problems++;
}
{
  const all = [];
  for (const exchange of RIGHTS_EXCHANGES) {
    try {
      all.push(...(await searchRights(fetch, exchange)));
    } catch (error) {
      console.log(`!! rechten ${exchange}: ${(error as Error).message}`);
      problems++;
    }
  }
  console.log(`== claimrechten: ${all.length}`, all.slice(0, 8).map((r) => `${r.symbol} ${r.company} ${r.expiry || "?"}`).join(" | "));
  // Koersen van rechten komen via de websocket van TradingView (de screener kent ze niet).
  try {
    const symbols = ["XETR:SAP", ...all.slice(0, 5).map((r) => r.symbol)];
    const quotes = await fetchQuotes(nodeSocket(), symbols);
    console.log(`== koersen: ${quotes.size} van ${symbols.length}`, [...quotes.values()].map((q) => `${q.symbol} ${q.last} ${q.currency}`).join(" | "));
    if (!quotes.get("XETR:SAP")?.last) throw new Error("geen koers voor XETR:SAP");
  } catch (error) {
    console.log(`!! koersen: ${(error as Error).message}`);
    problems++;
  }
}

if (problems) {
  console.error(`\n${problems} probleem/problemen gevonden`);
  process.exit(1);
}
process.exit(0);
