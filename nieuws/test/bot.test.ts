import { test } from "node:test";
import assert from "node:assert/strict";
import { OWNER_KEY, handleMessage, processUpdates } from "../src/bot.ts";
import { parseWatchlist } from "../src/config.ts";
import { formatNewsMessage } from "../src/telegram.ts";
import { FakeNet, MemoryStore, config, item } from "./helpers.ts";

function deps() {
  const net = new FakeNet();
  const store = new MemoryStore();
  return { net, store, bot: { store, telegram: net.telegram(), fetcher: net.fetch, config } };
}

const msg = (text: string, chatId = "1") => ({ chatId, text, fromName: "Pepijn" });

test("eerste /start maakt de chat eigenaar; anderen worden genegeerd", async () => {
  const { net, store, bot } = deps();
  await handleMessage(bot, msg("/lijst"));
  assert.equal(net.sent.length, 0, "zonder eigenaar alleen /start");
  await handleMessage(bot, msg("/start"));
  assert.equal(await store.getSetting(OWNER_KEY), "1");
  await handleMessage(bot, msg("/start", "2"));
  await handleMessage(bot, msg("/volg SAP", "2"));
  assert.equal(net.sent.length, 1);
  assert.equal(store.watch.length, 0);
});

test("/volg zoekt het symbool op, /stop haalt het weg", async () => {
  const { net, store, bot } = deps();
  await store.setSetting(OWNER_KEY, "1");
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
  await store.setSetting(OWNER_KEY, "1");
  net.search = "geen json-object";
  await handleMessage(bot, msg("/volg tradegate:1inn, XETR:SAP"));
  assert.deepEqual(
    (await store.listWatch()).map((w) => w.symbol),
    ["TRADEGATE:1INN", "XETR:SAP"],
  );
});

test("/laatste stuurt de recentste koppen", async () => {
  const { net, store, bot } = deps();
  await store.setSetting(OWNER_KEY, "1");
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
    { update_id: 10, message: { text: "/start", chat: { id: 5 }, from: { first_name: "P" } } },
    { update_id: 11, message: { sticker: {}, chat: { id: 5 } } },
  ];
  await processUpdates(bot);
  assert.equal(await store.getSetting("telegram_offset"), "12");
  assert.equal(await store.getSetting(OWNER_KEY), "5");
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
