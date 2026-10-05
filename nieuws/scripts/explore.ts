// Tijdelijk: kandidaat-filterwoorden tegen echte koppen van de afgelopen dagen.
import { loadConfig } from "../src/config.ts";
import { feedUrl, groupFilters, matchFilters, parseScannerRows, scannerPayload, formatCap } from "../src/screener.ts";
import { parseNewsResponse } from "../src/tradingview.ts";
import type { UniverseEntry } from "../src/store.ts";

const headers = { Accept: "application/json", Origin: "https://www.tradingview.com", "User-Agent": "Mozilla/5.0" };
const config = loadConfig({} as never);

const universe = new Map<string, UniverseEntry>();
let total = 0;
for (let offset = 0; offset === 0 || offset < total; offset += 1000) {
  const r = await fetch("https://scanner.tradingview.com/global/scan?label-product=screener-stock", {
    method: "POST", headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(scannerPayload(config, { min: config.capMinEur, max: config.capMaxEur }, offset)),
  });
  const page = parseScannerRows(await r.json());
  total = page.total;
  for (const row of page.rows) if (config.screenCountries.includes(row.country)) universe.set(row.symbol, row);
  if (!page.rows.length) break;
}
console.log("selectie", universe.size);

// Meerdere pagina's per stroom via de cursor.
const items = new Map<string, ReturnType<typeof parseNewsResponse>[number]>();
for (const feed of config.screenFeeds) {
  let cursor = "";
  for (let page = 0; page < 8; page++) {
    const url = feedUrl(feed) + (cursor ? `&cursor=${encodeURIComponent(cursor)}` : "");
    const r = await fetch(url, { headers });
    if (!r.ok) { console.log(feed.lang, "pagina", page, "HTTP", r.status); break; }
    const body: any = await r.json();
    const parsed = parseNewsResponse(body);
    const before = items.size;
    for (const i of parsed) items.set(i.id, i);
    const next = body?.pagination?.cursor;
    if (page === 1) console.log(feed.lang, "pagina 2 nieuw:", items.size - before);
    if (!next || next === cursor || !parsed.length) break;
    cursor = next;
  }
}
const all = [...items.values()];
const pubs = all.map((i) => i.published).filter(Boolean).sort();
console.log("koppen", all.length, "van", new Date(pubs[0] * 1000).toISOString(), "tot", new Date(pubs.at(-1)! * 1000).toISOString());
const inUni = all.filter((i) => i.symbols.some((s) => universe.has(s)));
console.log("binnen selectie", inUni.length);

const candidates: Record<string, string[]> = JSON.parse(process.env.CANDIDATES ?? "{}");
const filters = groupFilters(Object.entries(candidates).flatMap(([filter, words]) => words.map((word) => ({ filter, word }))));
for (const [filter] of filters) {
  const one = new Map([[filter, filters.get(filter)!]]);
  const hitsAll = all.filter((i) => matchFilters(i.title, one).length);
  const hitsUni = hitsAll.filter((i) => i.symbols.some((s) => universe.has(s)));
  console.log(`\n### ${filter}: ${hitsAll.length} koppen totaal, ${hitsUni.length} binnen selectie`);
  for (const i of hitsUni.slice(0, 25)) {
    const e = i.symbols.map((s) => universe.get(s)).find(Boolean)!;
    console.log(`  ✔ ${formatCap(e.capEur)} ${e.symbol} | ${i.title} | "${matchFilters(i.title, one)[0].word}"`);
  }
  for (const i of hitsAll.filter((x) => !hitsUni.includes(x)).slice(0, 8)) console.log(`  ✘ ${i.symbols.slice(0, 2).join(",")} | ${i.title}`);
}

// Losse zoektermen om te zien hoe koersdoel-koppen eruitzien.
for (const term of ["street", "price target", "kursziel", "objectif de cours", "target price", "prezzo obiettivo", "precio objetivo", "kursmål", "tavoitehinta"]) {
  const hits = inUni.filter((i) => i.title.toLowerCase().includes(term));
  console.log(`\n~ "${term}" binnen selectie: ${hits.length}`);
  for (const i of hits.slice(0, 6)) console.log("   ", i.symbols[0], "|", i.title);
}
export {};
