// Controleert tegen de echte TradingView-endpoints of het nieuws goed binnenkomt.
// Gebruik: npm run probe -- XETR:1INN NASDAQ:AAPL
// Draait in CI; faalt als TradingView wel items stuurt maar de parser er niets van maakt.

import { fetchStory, headlinesUrl, newsFlowUrl, parseNewsResponse, searchSymbol } from "../src/tradingview.ts";
import { formatNewsMessage } from "../src/telegram.ts";

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

if (problems) {
  console.error(`\n${problems} probleem/problemen gevonden`);
  process.exit(1);
}
