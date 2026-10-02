import { test } from "node:test";
import assert from "node:assert/strict";
import { checkNews, pickBatch } from "../src/check.ts";
import { loadConfig } from "../src/config.ts";
import { FakeNet, MemoryStore, config, item } from "./helpers.ts";

const NOW = 1_790_963_200;

async function setup() {
  const net = new FakeNet();
  const store = new MemoryStore();
  await store.addWatch({ symbol: "XETR:1INN", name: "innoscripta SE" });
  const run = (now = NOW) =>
    checkNews({ store, telegram: net.telegram(), fetcher: net.fetch, chatId: "99", config, now });
  return { net, store, run };
}

test("eerste ronde onthoudt bestaand nieuws zonder te melden, daarna alleen nieuwe koppen", async () => {
  const { net, store, run } = await setup();
  net.news.set("XETR:1INN", { items: [item("a", "Oud nieuws", NOW - 3600)] });

  const first = await run();
  assert.equal(first.alerted, 0);
  assert.equal(net.sent.length, 0);
  assert.ok(store.seen.has("a"));

  net.news.set("XETR:1INN", {
    items: [item("b", "innoscripta weist Vorwürfe zurück", NOW + 30), item("a", "Oud nieuws", NOW - 3600)],
  });
  const second = await run(NOW + 60);
  assert.equal(second.alerted, 1);
  assert.equal(net.sent.length, 1);
  assert.equal(net.sent[0].chatId, "99");
  assert.match(net.sent[0].text, /innoscripta weist Vorwürfe zurück/);
  assert.match(net.sent[0].text, /1INN · innoscripta SE/);
  assert.match(net.sent[0].text, /tradingview\.com\/news\/b\//);

  await run(NOW + 120);
  assert.equal(net.sent.length, 1, "zelfde bericht niet nog een keer");
});

test("mislukte Telegram-melding wordt de volgende minuut opnieuw geprobeerd", async () => {
  const { net, store, run } = await setup();
  await run();
  net.news.set("XETR:1INN", { items: [item("c", "Nieuw", NOW)] });
  net.telegramFails = true;
  const failed = await run(NOW + 60);
  assert.equal(failed.errors.length, 1);
  assert.ok(!store.seen.has("c"));

  net.telegramFails = false;
  await run(NOW + 120);
  assert.equal(net.sent.length, 1);
  assert.ok(store.seen.has("c"));
});

test("te oud nieuws wordt stil overgeslagen, een stortvloed beperkt tot één bericht", async () => {
  const { net, store, run } = await setup();
  await run();
  const flood = Array.from({ length: 8 }, (_, i) => item(`f${i}`, `Bericht ${i}`, NOW + i));
  net.news.set("XETR:1INN", { items: [item("old", "Van gisteren", NOW - 2 * 86400), ...flood] });
  const result = await run(NOW + 60);
  assert.equal(net.sent.length, 1);
  const text = net.sent[0].text;
  assert.ok(text.indexOf("Bericht 7") < text.indexOf("Bericht 3"), "nieuwste bovenaan");
  assert.ok(!text.includes("Bericht 2"));
  assert.match(text, /nog 3 oudere/);
  assert.ok(!text.includes("Van gisteren"));
  assert.equal(result.alerted, 5);
  assert.equal(store.seen.size, 9, "alles gezien, ook wat niet getoond is");
  await run(NOW + 120);
  assert.equal(net.sent.length, 1);
});

test("zelfde nieuws in meerdere varianten (echte koppen van 2 okt) wordt één melding", async () => {
  const { net, run } = await setup();
  await run();
  const t = 1790963193;
  net.news.set("XETR:1INN", {
    items: [
      item("tag:reuters.com,2026:newsml_FWN45O0YA:0", "Innoscripta SE Says Search Conducted At Innoscripta Premises In Tutzing And Munich On October 1, 2026", t + 146, { provider: { name: "Reuters" } }),
      item("eqs:5e2f1620d600c:0", "innoscripta SE: Update zu den Ermittlungen der Steuerbehörden – Geschäftsbetrieb läuft weiter", t, {
        link: "https://www.eqs-news.com/news/corporate-news/x_de",
        provider: { name: "EQS" },
      }),
      item("tv:1", "innoscripta SE (1INN) Searched in Tax Probe; Operations Continue", t, { provider: { name: "TradingView" } }),
    ],
  });
  await run(t + 60);
  assert.equal(net.sent.length, 1);
  const text = net.sent[0].text;
  assert.match(text, /^📰 <b>1INN · innoscripta SE<\/b>/);
  assert.match(text, /Geschäftsbetrieb läuft weiter<\/b>\n🕒 vr 2 okt, 19:46 · EQS\n<a href="https:\/\/www\.eqs-news\.com/);
  assert.match(text, /Tax Probe/);
  assert.ok(text.indexOf("Reuters") < text.indexOf("EQS"), "nieuwste bovenaan");
});

test("TradingView onbereikbaar: fout gemeld, niets kapot", async () => {
  const { net, run } = await setup();
  net.newsStatus = 503;
  const result = await run();
  assert.equal(result.checked.length, 0);
  assert.match(result.errors[0], /XETR:1INN/);
});

test("samenvatting en bronlink uit het story-endpoint", async () => {
  const { net, store } = await setup();
  const withDetails = loadConfig({ NEWS_LANGS: "de" } as never);
  const run = (now: number) =>
    checkNews({ store, telegram: net.telegram(), fetcher: net.fetch, chatId: "99", config: withDetails, now });
  await run(NOW);
  net.news.set("XETR:1INN", { items: [item("d", "Kop", NOW)] });
  net.story = {
    shortDescription: "<p>innoscripta SE/ Schlagwort(e): Sonstiges</p><p>Kop</p><p>Het valt <b>mee</b>, de zaak loopt gewoon door.</p>",
    link: "https://www.eqs-news.com/d",
  };
  await run(NOW + 60);
  assert.match(net.sent[0].text, /\n\nHet valt mee , de zaak loopt gewoon door\.\n/);
  assert.ok(!net.sent[0].text.includes("Schlagwort"));
  assert.match(net.sent[0].text, /href="https:\/\/www\.eqs-news\.com\/d">Origineel artikel/);
});

test("lange lijst: elke ronde een ander deel", async () => {
  const store = new MemoryStore();
  const watch = Array.from({ length: 5 }, (_, i) => ({ symbol: `X:S${i}`, name: "" }));
  const small = { ...config, maxRequests: 2 };
  const seen: string[] = [];
  for (let i = 0; i < 3; i++) seen.push(...(await pickBatch(store, watch, small)).map((w) => w.symbol));
  assert.deepEqual(seen, ["X:S0", "X:S1", "X:S2", "X:S3", "X:S4", "X:S0"]);
});
