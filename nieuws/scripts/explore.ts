// Tijdelijk: welke koersdoel-velden kent de TradingView-screener, en hoe vaak zijn ze gevuld?
import { loadConfig } from "../src/config.ts";
import { scannerPayload } from "../src/screener.ts";
const headers = { Accept: "application/json", Origin: "https://www.tradingview.com", "User-Agent": "Mozilla/5.0", "Content-Type": "application/json" };
const config = loadConfig({} as never);
const url = "https://scanner.tradingview.com/global/scan?label-product=screener-stock";
const fields = ["price_target_high", "price_target_low", "price_target_average", "price_target_median", "price_target_1y",
  "price_target_1y_delta", "recommendation_total", "recommendation_mark", "recommendation_buy", "close", "currency"];
const ok: string[] = [];
for (const f of fields) {
  const p: any = scannerPayload(config, { min: config.capMinEur, max: config.capMaxEur }, 0, 3);
  p.columns = ["description", f];
  delete p.price_conversion;
  const r = await fetch(url, { method: "POST", headers, body: JSON.stringify(p) });
  const t = await r.text();
  console.log(f, r.status, t.slice(0, 160));
  if (r.ok) ok.push(f);
}
// Dekking: hoeveel aandelen in de selectie hebben een hoogste koersdoel?
const p: any = scannerPayload(config, { min: config.capMinEur, max: config.capMaxEur }, 0, 5);
p.columns = ["description", "country", ...ok.filter((f) => f !== "currency")];
p.filter.push({ left: "price_target_high", operation: "nempty" });
delete p.price_conversion;
const r = await fetch(url, { method: "POST", headers, body: JSON.stringify(p) });
const body: any = await r.json();
console.log("\nmet koersdoel:", r.status, body.totalCount, JSON.stringify(body).slice(0, 200));
for (const row of body.data ?? []) console.log(row.s, JSON.stringify(row.d));
// met en zonder conversie, om te zien of koersdoelen meeconverteren
const p2: any = { ...p, range: [0, 5], price_conversion: { to_currency: "eur" } };
const r2 = await fetch(url, { method: "POST", headers, body: JSON.stringify(p2) });
const b2: any = await r2.json();
console.log("\nmet EUR-conversie:");
for (const row of b2.data ?? []) console.log(row.s, JSON.stringify(row.d));
export {};
