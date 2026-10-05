import { test } from "node:test";
import assert from "node:assert/strict";
import { loadConfig } from "../src/config.ts";
import { detectEvents, formatMoney, formatTargetMessage, parseTargetRows, sweepTargets } from "../src/targets.ts";
import { FakeNet, MemoryStore } from "./helpers.ts";

const config = loadConfig({} as never);
const NOW = 1_791_200_000;

// Kolommen: description, country, market_cap_basic, high, low, average (EUR), price_target_1y (eigen munt),
// recommendation_total, close, currency. Waarden uit een echte screener-respons van 5 okt.
const row = (s: string, d: unknown[]) => ({ s, d });
const real = [
  row("XETR:123F", ["123fahrschule SE", "Germany", 1.5e7, 6.1, 5.2, 5.65, 5.65, 2, 2.5, "EUR"]),
  row("LSE:1SN", ["First Tin Plc", "United Kingdom", 4e7, 0.3467481, 0.3467481, 0.3467481, 30, 1, 12.5, "GBX"]),
  row("BX:1Z9", ["SF Urban Properties AG", "Switzerland", 1.6e8, 119.225008, 119.225008, 119.225008, 112, 2, 101.501, "CHF"]),
  row("LSE:US1", ["Amerikaans bedrijf", "United States", 4e7, 1, 1, 1, 1, 1, 1, "GBX"]),
];

test("koersdoelen terug in eigen munt, alleen gekozen landen", () => {
  const { rows, raw } = parseTargetRows({ totalCount: 4, data: real }, config.screenCountries);
  assert.equal(raw, 4);
  assert.deepEqual(rows.map((r) => r.symbol), ["XETR:123F", "LSE:1SN", "BX:1Z9"]);
  const [eur, gbx, chf] = rows;
  assert.equal(eur.high, 6.1);
  assert.equal(eur.low, 5.2);
  assert.ok(Math.abs(gbx.high - 30) < 1e-9, "34,7 eurocent is 30 pence");
  assert.ok(Math.abs(chf.high - 112) < 1e-9);
  assert.equal(chf.currency, "CHF");
});

test("street high en low: alleen echte wijzigingen, niet de wisselkoers", () => {
  const { rows } = parseTargetRows({ data: real }, config.screenCountries);
  const previous = new Map(rows.map((r) => [r.symbol, { ...r }]));

  // Pond 3% sterker: alle euro-bedragen schuiven mee, de doelen in pence blijven 30.
  const fx = real.map((r) => (r.s === "LSE:1SN" ? row(r.s, r.d.map((v, i) => (i >= 3 && i <= 5 ? (v as number) * 1.03 : v))) : r));
  assert.deepEqual(detectEvents(parseTargetRows({ data: fx }, config.screenCountries).rows, previous), []);

  // Een analist verhoogt naar 7,00 (boven 6,10) en een ander verlaagt naar 4,80 (onder 5,20).
  const moved = real.map((r) =>
    r.s === "XETR:123F" ? row(r.s, ["123fahrschule SE", "Germany", 1.5e7, 7, 4.8, 5.9, 5.9, 3, 2.5, "EUR"]) : r,
  );
  const events = detectEvents(parseTargetRows({ data: moved }, config.screenCountries).rows, previous);
  assert.deepEqual(events.map((e) => [e.row.symbol, e.kind, e.previous]), [
    ["XETR:123F", "high", 6.1],
    ["XETR:123F", "low", 5.2],
  ]);

  // Hoogste doel omlaag of laagste omhoog is geen nieuwe street high/low.
  const down = real.map((r) =>
    r.s === "XETR:123F" ? row(r.s, ["123fahrschule SE", "Germany", 1.5e7, 5.9, 5.5, 5.7, 5.7, 2, 2.5, "EUR"]) : r,
  );
  assert.deepEqual(detectEvents(parseTargetRows({ data: down }, config.screenCountries).rows, previous), []);
});

test("melding in eigen munt met opwaarts potentieel", () => {
  const { rows } = parseTargetRows({ data: real }, config.screenCountries);
  const text = formatTargetMessage({ kind: "high", row: { ...rows[1], high: 45 }, previous: 30 });
  assert.match(text, /Nieuw hoogste koersdoel \(street high\)/);
  assert.match(text, /1SN · First Tin Plc/);
  assert.match(text, /Hoogste koersdoel: <b>45,00 GBX<\/b> \(was 30,00 GBX\)/);
  assert.match(text, /Koers 12,50 GBX → \+260% tot dit doel/);
  assert.match(text, /symbols\/LSE-1SN\/forecast/);
  assert.equal(formatMoney(52, "EUR"), "€52,00");
  assert.equal(formatMoney(1250, "SEK"), "1.250 SEK");
});

test("ronde over pagina's: eerste keer alleen vastleggen, daarna melden", async () => {
  const net = new FakeNet();
  const store = new MemoryStore();
  const sent: string[] = [];
  const many = Array.from({ length: 1500 }, (_, i) =>
    row(`XETR:T${i}`, [`Bedrijf ${i}`, "Germany", 2e7, 10, 8, 9, 9, 3, 7, "EUR"]),
  );
  net.targetRows = many;
  const sweep = (now: number) => sweepTargets({ store, config, fetcher: net.fetch, send: async (t) => void sent.push(t), now });

  assert.equal(await sweep(NOW), 0);
  assert.equal(await sweep(NOW + 60), 0);
  assert.equal(store.targets.size, 1500);
  assert.equal(await sweep(NOW + 120), null, "pas na een half uur weer");

  net.targetRows = many.map((r, i) => (i === 1200 ? row(r.s, [`Bedrijf ${i}`, "Germany", 2e7, 12, 8, 9.5, 9.5, 4, 7, "EUR"]) : r));
  assert.equal(await sweep(NOW + 1900), 0, "eerste pagina: niets veranderd");
  assert.equal(await sweep(NOW + 1960), 1);
  assert.match(sent[0], /T1200 · Bedrijf 1200/);
  assert.match(sent[0], /Hoogste koersdoel: <b>€12,00<\/b> \(was €10,00\)/);
  assert.match(sent[0], /4 analisten/);

  await store.setSetting("targets_off", "1");
  assert.equal(await sweep(NOW + 7200), null);
});
