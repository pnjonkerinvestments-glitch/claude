// Tijdelijk: IPO-woorden testen tegen echte koppen uit de Europese nieuwsstromen (meerdere pagina's).
import { loadConfig } from "../src/config.ts";
import { feedUrl, groupFilters, matchFilters } from "../src/screener.ts";
import { parseNewsResponse } from "../src/tradingview.ts";

const headers = { Accept: "application/json", Origin: "https://www.tradingview.com", "User-Agent": "Mozilla/5.0" };
const config = loadConfig({} as never);
const items = new Map<string, ReturnType<typeof parseNewsResponse>[number]>();
for (const feed of config.screenFeeds) {
  let cursor = "";
  for (let page = 0; page < 10; page++) {
    const r = await fetch(feedUrl(feed) + (cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""), { headers });
    if (!r.ok) break;
    const body: any = await r.json();
    const parsed = parseNewsResponse(body);
    for (const i of parsed) items.set(i.id, i);
    if (!body?.pagination?.cursor || !parsed.length) break;
    cursor = body.pagination.cursor;
  }
}
const all = [...items.values()];
console.log("koppen", all.length);
const words: string[] = JSON.parse(process.env.WORDS ?? "[]");
const perWord = new Map<string, string[]>();
for (const item of all) {
  for (const word of words) {
    if (matchFilters(item.title, groupFilters([{ filter: "x", word }])).length) {
      perWord.set(word, [...(perWord.get(word) ?? []), `${item.symbols.slice(0, 2).join(",") || "-"} | ${item.title}`]);
    }
  }
}
for (const word of words) {
  const hits = perWord.get(word) ?? [];
  console.log(`\n### "${word}": ${hits.length}`);
  for (const h of hits.slice(0, 8)) console.log("   ", h.slice(0, 200));
}
export {};
