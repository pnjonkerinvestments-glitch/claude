import { test } from "node:test";
import assert from "node:assert/strict";
import { handleMessage, processUpdates } from "../src/bot.ts";
import { ALERT_CHAT_KEY, LEGACY_OWNER_KEY, OWNER_USER_KEY } from "../src/alerts.ts";
import { parseWatchlist } from "../src/config.ts";
import { formatNewsMessage } from "../src/telegram.ts";
import { FakeNet, MemoryStore, config, item, msg } from "./helpers.ts";

function deps() {
  const net = new FakeNet();
  const store = new MemoryStore();
  return { net, store, bot: { store, telegram: net.telegram(), fetcher: net.fetch, config } };
}


test("eerste /start maakt de chat eigenaar; anderen worden genegeerd", async () => {
  const { net, store, bot } = deps();
  await handleMessage(bot, msg("/lijst"));
  assert.equal(net.sent.length, 0, "zonder eigenaar alleen /start");
  await handleMessage(bot, msg("/start"));
  assert.equal(await store.getSetting(OWNER_USER_KEY), "1");
  assert.equal(await store.getSetting(ALERT_CHAT_KEY), "1");
  await handleMessage(bot, msg("/start", { chatId: "2" }));
  await handleMessage(bot, msg("/volg SAP", { chatId: "2" }));
  assert.equal(net.sent.length, 1);
  assert.equal(store.watch.length, 0);
});

test("/volg zoekt het symbool op, /stop haalt het weg", async () => {
  const { net, store, bot } = deps();
  await store.setSetting(OWNER_USER_KEY, "1");
  net.search = {
    symbols: [
      { symbol: "1INN", description: "innoscripta SE", type: "stock", prefix: "XETR" },
      { symbol: "1INN", description: "innoscripta SE", type: "stock", exchange: "TRADEGATE" },
    ],
  };
  await handleMessage(bot, msg("/volg 1inn"));
  assert.deepEqual(await store.listWatch(), [{ symbol: "XETR:1INN", name: "innoscripta SE" }]);
  assert.match(net.sent[0].text, /✅ XETR:1INN \(innoscripta SE\)/);
  assert.match(net.sent[0].text, /TRADEGATE:1INN/);

  await store.setSetting("primed:XETR:1INN", "1");
  await handleMessage(bot, msg("/stop 1INN"));
  assert.equal(store.watch.length, 0);
  assert.equal(await store.getSetting("primed:XETR:1INN"), null, "opnieuw toevoegen begint schoon");
});

test("/volg met expliciete notering werkt ook als zoeken faalt", async () => {
  const { net, store, bot } = deps();
  await store.setSetting(OWNER_USER_KEY, "1");
  net.search = "geen json-object";
  await handleMessage(bot, msg("/volg tradegate:1inn, XETR:SAP"));
  assert.deepEqual(
    (await store.listWatch()).map((w) => w.symbol),
    ["TRADEGATE:1INN", "XETR:SAP"],
  );
});

test("/laatste stuurt de recentste koppen", async () => {
  const { net, store, bot } = deps();
  await store.setSetting(OWNER_USER_KEY, "1");
  await store.addWatch({ symbol: "XETR:1INN", name: "innoscripta SE" });
  net.news.set("XETR:1INN", { items: [1, 2, 3, 4].map((i) => item(`n${i}`, `Kop ${i}`, 1_790_000_000 + i)) });
  await handleMessage(bot, msg("/laatste 1INN"));
  assert.deepEqual(
    net.sent.map((s) => s.text.match(/Kop \d/)?.[0]),
    ["Kop 2", "Kop 3", "Kop 4"],
  );
});

test("getUpdates-offset wordt bewaard", async () => {
  const { net, store, bot } = deps();
  net.updates = [
    { update_id: 10, message: { text: "/start", chat: { id: 5, type: "private" }, from: { id: 5, first_name: "P" } } },
    { update_id: 11, message: { sticker: {}, chat: { id: 5 } } },
  ];
  await processUpdates(bot);
  assert.equal(await store.getSetting("telegram_offset"), "12");
  assert.equal(await store.getSetting(OWNER_USER_KEY), "5");
});

test("melding escapet HTML en toont Nederlandse tijd", () => {
  const text = formatNewsMessage({
    entry: { symbol: "XETR:1INN", name: "innoscripta <SE>" },
    item: {
      id: "x",
      title: "A & B <script>",
      published: Date.UTC(2026, 9, 2, 17, 46) / 1000,
      provider: "EQS",
      symbols: [],
    },
    timeZone: "Europe/Amsterdam",
  });
  assert.match(text, /A &amp; B &lt;script&gt;/);
  assert.match(text, /innoscripta &lt;SE&gt;/);
  assert.match(text, /19:46/);
});

test("startlijst uit WATCHLIST", () => {
  assert.deepEqual(parseWatchlist("XETR:1INN=innoscripta SE; nasdaq:aapl ;rommel"), [
    { symbol: "XETR:1INN", name: "innoscripta SE" },
    { symbol: "NASDAQ:AAPL", name: "" },
  ]);
});

test("groep: /hier verlegt de meldingen, alleen de eigenaar telt", async () => {
  const { net, store, bot } = deps();
  await store.setSetting(OWNER_USER_KEY, "1");
  const group = { chatId: "-500", chatType: "group" };
  await handleMessage(bot, msg("/hier@NieuwsBot", { ...group, fromId: "7" }));
  await handleMessage(bot, msg("gewoon gepraat", { ...group, fromId: "1" }));
  assert.equal(net.sent.length, 0, "anderen en gewone berichten krijgen geen antwoord");
  assert.equal(await store.getSetting(ALERT_CHAT_KEY), null);

  await handleMessage(bot, msg("/hier@NieuwsBot", { ...group, fromId: "1" }));
  assert.equal(await store.getSetting(ALERT_CHAT_KEY), "-500");
  assert.equal(net.sent[0].chatId, "-500");
  assert.match(net.sent[0].text, /alle meldingen in deze groep/);

});

test("groepsleden mogen toevoegen in de meldingengroep, maar niet alles", async () => {
  const { net, store, bot } = deps();
  await store.setSetting(OWNER_USER_KEY, "1");
  await store.setSetting(ALERT_CHAT_KEY, "-500");
  const friend = { chatId: "-500", chatType: "supergroup", fromId: "7" };

  await handleMessage(bot, msg("/woord dividend superdividend", friend));
  assert.deepEqual(store.words, [{ filter: "dividend", word: "superdividend" }]);
  await handleMessage(bot, msg("/volg XETR:SAP", friend));
  assert.deepEqual((await store.listWatch()).map((w) => w.symbol), ["XETR:SAP"]);
  await handleMessage(bot, msg("/marktwaarde", friend));
  assert.match(net.sent.at(-1)!.text, /Nu: €2,5 mln tot €500,0 mln/);

  for (const command of ["/hier", "/filterweg dividend", "/marktwaarde 1 2"]) {
    await handleMessage(bot, msg(command, friend));
    assert.match(net.sent.at(-1)!.text, /alleen de beheerder/);
  }
  assert.equal(await store.getSetting(ALERT_CHAT_KEY), "-500");
  assert.equal(store.words.length, 1);
  assert.equal(await store.getSetting("screen_cap_min"), null);

  const before = net.sent.length;
  await handleMessage(bot, msg("/woord dividend x", { chatId: "-999", chatType: "group", fromId: "7" }));
  await handleMessage(bot, msg("/woord dividend x", { chatId: "7", chatType: "private", fromId: "7" }));
  assert.equal(net.sent.length, before, "in een andere groep of privé: geen reactie");
  assert.equal(store.words.length, 1);
});

test("bestaande installatie: oude eigenaar-sleutel blijft werken", async () => {
  const { net, store, bot } = deps();
  await store.setSetting(LEGACY_OWNER_KEY, "1");
  await handleMessage(bot, msg("/lijst"));
  assert.equal(net.sent.length, 1);
  const { alertChat } = await import("../src/alerts.ts");
  assert.equal(await alertChat(store), "1");
});

test("groep wordt supergroep: meldingen volgen het nieuwe id", async () => {
  const { net, store, bot } = deps();
  await store.setSetting(ALERT_CHAT_KEY, "-500");
  await handleMessage(bot, { ...msg("", { chatId: "-500", chatType: "group" }), migrateTo: "-100500" });
  assert.equal(await store.getSetting(ALERT_CHAT_KEY), "-100500");

  const { AlertSender } = await import("../src/alerts.ts");
  net.migrateFrom = "-100500";
  const sender = new AlertSender(store, net.telegram(), "-100500");
  await sender.send("hallo");
  assert.equal(net.sent[0].chatId, "-100777");
  assert.equal(await store.getSetting(ALERT_CHAT_KEY), "-100777");
});

test("filterwoorden toevoegen, tonen en weghalen", async () => {
  const { net, store, bot } = deps();
  await store.setSetting(OWNER_USER_KEY, "1");
  await handleMessage(bot, msg("/woord Dividend Superdividende"));
  await handleMessage(bot, msg("/woord winst erstmals profitabel"));
  assert.deepEqual(store.words, [
    { filter: "dividend", word: "Superdividende" },
    { filter: "winst", word: "erstmals profitabel" },
  ]);
  await handleMessage(bot, msg("/filters"));
  assert.match(net.sent.at(-1)!.text, /<b>dividend<\/b> \(1 woorden\)\nSuperdividende/);
  await handleMessage(bot, msg("/woordweg dividend superdividende"));
  await handleMessage(bot, msg("/filterweg winst"));
  assert.equal(store.words.length, 0);
  await handleMessage(bot, msg("/woord"));
  assert.match(net.sent.at(-1)!.text, /Gebruik: \/woord/);
});

test("/marktwaarde zet de bandbreedte en ververst de selectie", async () => {
  const { net, store, bot } = deps();
  await store.setSetting(OWNER_USER_KEY, "1");
  await store.setSetting("universe_done", "123");
  await handleMessage(bot, msg("/marktwaarde 2,5 500"));
  assert.equal(await store.getSetting("screen_cap_min"), "2500000");
  assert.equal(await store.getSetting("screen_cap_max"), "500000000");
  assert.equal(await store.getSetting("universe_done"), null);
  assert.match(net.sent[0].text, /€2,5 mln tot €500,0 mln/);
  await handleMessage(bot, msg("/marktwaarde 500 2"));
  assert.match(net.sent[1].text, /Nu: €2,5 mln tot €500,0 mln/);
});

test("/filtertest toont treffers zonder iets te onthouden", async () => {
  const { net, store, bot } = deps();
  await store.setSetting(OWNER_USER_KEY, "1");
  await store.addFilterWord("dividend", "Sonderdividende");
  await store.putUniverse([{ symbol: "XETR:PFSE", name: "Pfisterer Holding SE", capEur: 3.12e8, country: "Germany" }], "b");
  net.feeds.set("de", {
    items: [item("eqs:1", "Pfisterer: Sonderdividende", Math.floor(Date.now() / 1000) - 3600, { relatedSymbols: [{ symbol: "XETR:PFSE" }] })],
  });
  await handleMessage(bot, msg("/filtertest"));
  assert.match(net.sent[0].text, /XETR:PFSE<\/b> Pfisterer Holding SE \(Duitsland, €312,0 mln\)/);
  assert.equal(store.seen.size, 0);
});
