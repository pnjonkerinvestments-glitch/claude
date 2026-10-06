// Tijdelijk: het hele ochtendoverzicht van begin tot eind tegen de echte TradingView.
import { loadConfig } from "../src/config.ts";
import { localTime, toUnix } from "../src/dates.ts";
import { seed } from "../src/index.ts";
import { runMorningStep } from "../src/morning.ts";
import { eventRecords, findMatches, groupFilters, refreshUniverse } from "../src/screener.ts";
import { MemoryStore } from "../test/helpers.ts";

const config = loadConfig({} as never);
const store = new MemoryStore();
await seed(store, {} as never);
const real = Math.floor(Date.now() / 1000);
for (let i = 0; i < 8 && (await refreshUniverse(store, config, fetch, real)); i++);
console.log("selectie", await store.countUniverse());

const filters = groupFilters(await store.listFilterWords());
const errors: string[] = [];
const { scanned, matches } = await findMatches({ store, fetcher: fetch, config }, filters, real - 7 * 86400, errors);
console.log(`koppen ${scanned}, treffers ${matches.length}`, errors);
const perFilter = new Map<string, string[]>();
for (const m of matches) {
  await store.recordEvents(eventRecords(m), real - 3600);
  for (const h of m.hits) perFilter.set(h.filter, [...(perFilter.get(h.filter) ?? []), `${m.entry ? "✔" : "✘"} ${m.item.symbols.slice(0, 2).join(",")} | ${m.item.title.slice(0, 140)} | "${h.word}"`]);
}
for (const [filter, list] of perFilter) {
  console.log(`\n### ${filter}: ${list.length}`);
  for (const line of list.slice(0, 15)) console.log("   ", line);
}

const today = localTime(real, config.timeZone).date;
const sent: string[] = [];
let steps = 0;
for (let now = toUnix(today, 6 * 60 + 58, config.timeZone); now <= toUnix(today, 8 * 60 + 41, config.timeZone); now += 60) {
  const r = await runMorningStep({ store, config, fetcher: fetch, now, log: console.log }, async (html) => void sent.push(html));
  if (r.step || r.errors.length || r.sent) console.log(new Date(now * 1000).toISOString().slice(11, 16), r);
  steps++;
}
console.log(`\n${steps} minuten, gelezen berichten: ${store.events.filter((e) => e.checked).length}, noteringen ${store.listings.size}`);
console.log("\n=== AGENDA ===");
for (const a of await store.listAgenda(today, "2099-12-31")) console.log(`${a.date} | ${a.kind} | ${a.label} | ${a.symbol} ${a.name} | ${a.title.slice(0, 100)}`);
console.log("\n=== OCHTENDOVERZICHT ===");
for (const html of sent) console.log(html, "\n------", html.length, "tekens");
export {};
