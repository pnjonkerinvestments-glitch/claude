// Tijdelijk verkenningsscript: welke TradingView-bronnen zijn bruikbaar voor de screener?
const headers = { Accept: "application/json", Origin: "https://www.tradingview.com", Referer: "https://www.tradingview.com/", "User-Agent": "Mozilla/5.0" };

async function get(url: string) {
  const r = await fetch(url, { headers });
  const t = await r.text();
  try { return { status: r.status, body: JSON.parse(t) as any }; } catch { return { status: r.status, body: t.slice(0, 200) as any }; }
}

function summarize(label: string, status: number, body: any) {
  const items: any[] = Array.isArray(body) ? body : body?.items ?? [];
  const pub = items.map((i) => i.published).filter(Boolean).sort();
  const span = pub.length ? ((pub[pub.length - 1] - pub[0]) / 3600).toFixed(1) : "-";
  const exch = new Map<string, number>();
  for (const i of items) for (const s of i.relatedSymbols ?? []) { const e = String(s.symbol).split(":")[0]; exch.set(e, (exch.get(e) ?? 0) + 1); }
  const top = [...exch].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([e, n]) => `${e}:${n}`).join(" ");
  console.log(`\n## ${label}\nHTTP ${status} items=${items.length} span=${span}h keys=${body && typeof body === "object" && !Array.isArray(body) ? Object.keys(body).join(",") : "array"}`);
  if (!items.length) console.log("body:", JSON.stringify(body).slice(0, 300));
  console.log("beurzen:", top);
  for (const i of items.slice(0, 4)) console.log(`- ${new Date(i.published * 1000).toISOString()} [${i.provider?.name ?? i.provider}] ${i.title} | ${(i.relatedSymbols ?? []).map((s: any) => s.symbol).join(",")}`);
  if (body && !Array.isArray(body)) for (const k of Object.keys(body)) if (k !== "items") console.log(`  ${k}:`, JSON.stringify(body[k]).slice(0, 300));
}

const base = "https://news-mediator.tradingview.com/news-flow/v2/news?client=screener&streaming=false&";
const ALL = "AT,BE,CH,DE,DK,ES,FI,FR,GB,IT,LU,NL,NO,PT,SE";
const variants: Array<[string, string]> = [
  ["alle 15 lang:en", `filter=lang:en&filter=market:stock&filter=market_country:${ALL}`],
  ["alle 15 lang:en limit=20", `filter=lang:en&filter=market:stock&filter=market_country:${ALL}&limit=20`],
  ["alle 15 lang:en count=20", `filter=lang:en&filter=market:stock&filter=market_country:${ALL}&count=20`],
  ["AT,CH,DE lang:de", "filter=lang:de&filter=market:stock&filter=market_country:AT,CH,DE"],
  ["BE,CH,FR,LU lang:fr", "filter=lang:fr&filter=market:stock&filter=market_country:BE,CH,FR,LU"],
  ["ES lang:es", "filter=lang:es&filter=market:stock&filter=market_country:ES"],
  ["PT lang:pt", "filter=lang:pt&filter=market:stock&filter=market_country:PT"],
  ["PT lang:en", "filter=lang:en&filter=market:stock&filter=market_country:PT"],
  ["NL,BE lang:en", "filter=lang:en&filter=market:stock&filter=market_country:BE,NL"],
  ["DK,FI,NO,SE lang:en", "filter=lang:en&filter=market:stock&filter=market_country:DK,FI,NO,SE"],
  ["GB lang:en", "filter=lang:en&filter=market:stock&filter=market_country:GB"],
];
for (const [label, q] of variants) {
  const { status, body } = await get(base + q);
  summarize(label, status, body);
  console.log("bytes:", JSON.stringify(body).length);
}

export {};
