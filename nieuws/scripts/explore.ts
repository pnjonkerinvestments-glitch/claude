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
const variants: Array<[string, string]> = [
  ["DE stock lang:de", "filter=lang:de&filter=market:stock&filter=market_country:DE"],
  ["DE stock lang:en", "filter=lang:en&filter=market:stock&filter=market_country:DE"],
  ["DE stock geen lang", "filter=market:stock&filter=market_country:DE"],
  ["DE,FR,IT stock lang:en", "filter=lang:en&filter=market:stock&filter=market_country:DE,FR,IT"],
  ["FR stock lang:fr", "filter=lang:fr&filter=market:stock&filter=market_country:FR"],
  ["IT stock lang:it", "filter=lang:it&filter=market:stock&filter=market_country:IT"],
  ["SE stock lang:en", "filter=lang:en&filter=market:stock&filter=market_country:SE"],
  ["SE stock lang:sv", "filter=lang:sv&filter=market:stock&filter=market_country:SE"],
  ["GB stock lang:en", "filter=lang:en&filter=market:stock&filter=market_country:GB"],
  ["NL stock lang:nl", "filter=lang:nl&filter=market:stock&filter=market_country:NL"],
  ["stock lang:en (wereld)", "filter=lang:en&filter=market:stock"],
  ["area EUR lang:en", "filter=lang:en&filter=market:stock&filter=area:EUR"],
  ["DE stock lang:de zonder market", "filter=lang:de&filter=market_country:DE"],
];
for (const [label, q] of variants) {
  const { status, body } = await get(base + q);
  summarize(label, status, body);
}

// --- screener ---
const markets = ["germany", "france", "italy", "spain", "portugal", "netherlands", "belgium", "luxembourg", "denmark", "sweden", "norway", "finland", "uk", "switzerland", "austria"];
async function scan(url: string, payload: unknown) {
  const r = await fetch(url, { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  const t = await r.text();
  try { return { status: r.status, body: JSON.parse(t) as any }; } catch { return { status: r.status, body: t.slice(0, 300) as any }; }
}
const columns = ["name", "description", "exchange", "market_cap_basic", "currency", "fundamental_currency_code", "country", "is_primary", "type", "typespecs"];
const filter = [
  { left: "market_cap_basic", operation: "in_range", right: [2.5e6, 5e8] },
  { left: "type", operation: "equal", right: "stock" },
  { left: "is_primary", operation: "equal", right: true },
];
for (const conv of [undefined, { to_currency: "eur" }]) {
  const payload: any = { filter, options: { lang: "en" }, markets, columns, range: [0, 8], sort: { sortBy: "market_cap_basic", sortOrder: "desc" } };
  if (conv) payload.price_conversion = conv;
  const { status, body } = await scan("https://scanner.tradingview.com/global/scan?label-product=screener-stock", payload);
  console.log(`\n## scanner global ${conv ? "EUR" : "zonder conversie"}: HTTP ${status} totalCount=${body?.totalCount}`);
  if (!body?.data) console.log(JSON.stringify(body).slice(0, 400));
  for (const row of body?.data ?? []) console.log(row.s, JSON.stringify(row.d));
}
for (const m of ["uk", "sweden", "switzerland", "germany"]) {
  const payload: any = { filter, options: { lang: "en" }, markets: [m], columns, range: [0, 3], price_conversion: { to_currency: "eur" }, sort: { sortBy: "market_cap_basic", sortOrder: "asc" } };
  const { status, body } = await scan(`https://scanner.tradingview.com/${m}/scan?label-product=screener-stock`, payload);
  console.log(`\n## scanner ${m} EUR kleinste: HTTP ${status} totalCount=${body?.totalCount}`);
  for (const row of body?.data ?? []) console.log(row.s, JSON.stringify(row.d));
}
// per land aantallen
for (const m of markets) {
  const { body } = await scan("https://scanner.tradingview.com/global/scan?label-product=screener-stock", { filter, options: { lang: "en" }, markets: [m], columns: ["name"], range: [0, 1], price_conversion: { to_currency: "eur" } });
  console.log(`aantal ${m}: ${body?.totalCount}`);
}
export {};
