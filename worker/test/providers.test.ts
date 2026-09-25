import assert from "node:assert/strict";
import { test } from "node:test";
import { fetchPolygon, parseTicker } from "../src/providers/polygon.ts";
import { buildPayload, COLUMNS, fetchTradingView, parseRow } from "../src/providers/tradingview.ts";
import { requestJson } from "../src/http.ts";
import { config } from "./helpers.ts";

function fakeFetch(responses: (Response | Error)[], calls: { url: string; init?: RequestInit }[] = []) {
  return (async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    const next = responses.shift();
    if (!next) throw new Error("geen antwoord meer");
    if (next instanceof Error) throw next;
    return next;
  }) as typeof fetch;
}

const noSleep = async () => {};
const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

const tvRow = (values: Partial<Record<(typeof COLUMNS)[number], unknown>>, s = "NASDAQ:ABCD") => ({
  s,
  d: COLUMNS.map((c) => values[c] ?? null),
});

test("TradingView: payload vraagt iets onder de drempel", () => {
  const payload = buildPayload(config({ thresholdPct: 50 })) as { filter: { left: string; right: number }[] };
  assert.equal(payload.filter[0]!.right, 40);
  assert.ok(payload.filter.some((f) => f.left === "premarket_close"));
});

test("TradingView: rijen parsen en onbruikbare overslaan", () => {
  const m = parseRow(
    tvRow({
      name: "ABCD",
      description: "Testbedrijf Inc",
      exchange: "NASDAQ",
      type: "stock",
      close: 3.2,
      premarket_close: 6,
      premarket_change: 87.5,
      premarket_volume: 500000,
      market_cap_basic: 120e6,
    }),
  );
  assert.deepEqual(m, {
    symbol: "ABCD",
    exchange: "NASDAQ",
    name: "Testbedrijf Inc",
    price: 6,
    prevClose: 3.2,
    changePct: 87.5,
    volume: 500000,
    marketCap: 120e6,
    instrumentType: "stock",
  });
  assert.equal(parseRow(tvRow({ name: "X", close: 3, premarket_close: null, premarket_change: 80 })), null);
  assert.equal(parseRow({ s: "X", d: [1, 2] }), null);
});

test("TradingView: label-product één keer toevoegen, lege respons oké", async () => {
  const calls: { url: string }[] = [];
  const movers = await fetchTradingView(config(), { fetchImpl: fakeFetch([jsonResponse({ totalCount: 0 })], calls) });
  assert.deepEqual(movers, []);
  assert.equal(calls[0]!.url, "https://scanner.tradingview.com/america/scan?label-product=screener-stock");

  const calls2: { url: string }[] = [];
  const cfg = config({ scannerUrl: "https://x.test/scan?label-product=foo" });
  await fetchTradingView(cfg, { fetchImpl: fakeFetch([jsonResponse({ data: [] })], calls2) });
  assert.equal(calls2[0]!.url, "https://x.test/scan?label-product=foo");
});

test("Polygon: minuutbar, dan laatste trade, anders overslaan", () => {
  const base = { ticker: "ABCD", prevDay: { c: 2 }, day: { c: 0, v: 0 } };
  assert.equal(parseTicker({ ...base, min: { c: 4, av: 90000 } })!.changePct, 100);
  assert.equal(parseTicker({ ...base, min: { c: 4, av: 90000 } })!.volume, 90000);
  assert.equal(parseTicker({ ...base, lastTrade: { p: 3 } })!.price, 3);
  assert.equal(parseTicker({ ticker: "X", prevDay: { c: 0 } }), null);
  assert.equal(parseTicker({ ticker: "X", prevDay: { c: 2 } }), null);
});

test("Polygon: API-sleutel lekt niet in foutmeldingen", async () => {
  const cfg = config({ provider: "polygon", polygonApiKey: "SUPERGEHEIM" });
  await assert.rejects(
    fetchPolygon(cfg, { fetchImpl: fakeFetch([new Response("nope", { status: 403 })]) }),
    (err: Error) => !err.message.includes("SUPERGEHEIM") && err.message.includes("403"),
  );
});

test("http: herhaalt bij 5xx en netwerkfouten, niet bij 4xx", async () => {
  const calls: unknown[] = [];
  const result = await requestJson("https://x.test", {
    fetchImpl: fakeFetch([new Response("down", { status: 503 }), new TypeError("reset"), jsonResponse({ ok: 1 })], calls as never),
    sleep: noSleep,
  });
  assert.deepEqual(result, { ok: 1 });
  assert.equal(calls.length, 3);

  const calls4xx: unknown[] = [];
  await assert.rejects(
    requestJson("https://x.test", { fetchImpl: fakeFetch([new Response("bad", { status: 400 })], calls4xx as never), sleep: noSleep }),
    /HTTP 400/,
  );
  assert.equal(calls4xx.length, 1);

  await assert.rejects(
    requestJson("https://x.test", {
      fetchImpl: fakeFetch([new Response("", { status: 429 }), new Response("", { status: 500 }), new Response("", { status: 502 })]),
      sleep: noSleep,
    }),
    /HTTP 502/,
  );
});
