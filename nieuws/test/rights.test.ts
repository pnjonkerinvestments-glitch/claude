import { test } from "node:test";
import assert from "node:assert/strict";
import { handleMessage } from "../src/bot.ts";
import { OWNER_USER_KEY, ALERT_CHAT_KEY } from "../src/alerts.ts";
import { toUnix } from "../src/dates.ts";
import { LISTINGS_DONE_KEY } from "../src/listings.ts";
import { DAY_KEY, RIGHTS_WATCH_KEY, SENT_DATE_KEY, loadTerms, runMorningStep, saveTerms, watchRights } from "../src/morning.ts";
import { fetchQuotes, splitFrames } from "../src/quotes.ts";
import { parseRightsTerms, rightsValue } from "../src/rights.ts";
import { FakeNet, MemoryStore, config, fakeSocket, msg } from "./helpers.ts";

const at = (date: string, time: string) => {
  const [h, m] = time.split(":").map(Number);
  return toUnix(date, h * 60 + m, config.timeZone);
};

test("voorwaarden van claimemissies uit persberichten, in allerlei talen", () => {
  const cases: Array<[string, string, Record<string, unknown>]> = [
    [
      "Italiaans (Unipol)",
      "Unipol, prezzo aumento capitale fissato a 20,56 euro. L'operazione prevede l'emissione di massime 121.582.320 nuove azioni, da offrire in opzione agli azionisti nel rapporto di 10 nuove azioni ogni 59 azioni Unipol detenute. Il prezzo di sottoscrizione incorpora uno sconto pari al 18,75%.",
      { price: 20.56, currency: "EUR", newShares: 10, perRights: 59 },
    ],
    [
      "Frans, warrants tellen niet (Amoéba)",
      "1 DPS pour chaque action détenue. 3 DPS permettront de souscrire à 1 action nouvelle à bon de souscription d'actions (ABSA) au prix unitaire de 0,30 E / action du 8 octobre au 23 octobre inclus. 2 BSA permettront de souscrire à 1 action nouvelle au prix de 0,60 E jusqu'au 31 décembre 2028.",
      { price: 0.3, currency: "EUR", newShares: 1, perRights: 3 },
    ],
    [
      "Engels, units van één aandeel (Realfiction)",
      "Seven (7) unit rights entitle the holder to subscribe for one hundred (100) units. The subscription price amounts to SEK 0.10 per unit, corresponding to SEK 0.10 per share. The exercise price of the warrants amounts to SEK 0.14.",
      { price: 0.1, currency: "SEK", newShares: 100, perRights: 7, units: true, sharesPerUnit: 1 },
    ],
    [
      "Reuters-stijl, unit van vier aandelen (Klaria)",
      "SUBSCRIPTION PRICE IS 2.40 SEK PER UNIT, 0.60 SEK PER SHARE, WARRANT ISSUED FREE",
      { price: 0.6, currency: "SEK", units: true, sharesPerUnit: 4 },
    ],
    [
      "Noors",
      "Hver tegningsrett gir rett til å tegne og få tildelt én (1) ny aksje. Tegningskursen er NOK 1,00 per aksje.",
      { price: 1, currency: "NOK", newShares: 1, perRights: 1 },
    ],
    [
      "Zweeds",
      "Fem (5) teckningsrätter berättigar till teckning av en (1) ny aktie. Teckningskursen är 2,50 SEK per aktie.",
      { price: 2.5, currency: "SEK", newShares: 1, perRights: 5 },
    ],
    ["Duits", "Das Bezugsverhältnis beträgt 7:2. Der Bezugspreis beträgt EUR 12,50 je neuer Aktie.", { price: 12.5, currency: "EUR", newShares: 2, perRights: 7 }],
    [
      "Engels, elk recht",
      "Each subscription right will give the right to subscribe for one (1) new share at a subscription price of EUR 6.19 per share.",
      { price: 6.19, currency: "EUR", newShares: 1, perRights: 1 },
    ],
    ["Spaans", "Se entregará 1 acción nueva por cada 5 derechos de suscripción, a un precio de suscripción de 2,10 euros.", { price: 2.1, currency: "EUR", newShares: 1, perRights: 5 }],
    ["alleen een prijs", "Techstep ASA launches rights issue to raise NOK 83.3-100 million at NOK 1 per share", { price: 1, currency: "NOK" }],
    ["niets", "Unipol: ECB grants authorisation to exceed 20% of share capital", {}],
  ];
  for (const [name, text, expected] of cases) assert.deepEqual(parseRightsTerms(text), expected, name);
});

test("waarde van een recht: Unipol bij het slot van gisteren en bij de opening van vandaag", () => {
  const terms = { price: 20.56, currency: "EUR", newShares: 10, perRights: 59 };
  const close = rightsValue(terms, 24.86, 0.7, "EUR")!;
  assert.equal(close.viaRights.toFixed(2), "24.69");
  assert.equal((close.edge * 100).toFixed(1), "0.7");
  assert.equal(close.value.toFixed(3), "0.729");
  const open = rightsValue(terms, 24.26, 0.51, "EUR")!;
  assert.equal((open.edge * 100).toFixed(1), "2.8");
  assert.equal((open.discount! * 100).toFixed(0), "19");
  // Duurder dan het aandeel.
  assert.ok(rightsValue(terms, 24.26, 0.8, "EUR")!.edge < 0);
  // Andere munt, onvolledige voorwaarden of units zonder samenstelling: niet te zeggen.
  assert.equal(rightsValue(terms, 24.26, 0.5, "SEK"), null);
  assert.equal(rightsValue({ price: 1 }, 2, 0.1, "NOK"), null);
  assert.equal(rightsValue({ price: 2.4, newShares: 1, perRights: 4, units: true }, 3, 0.1, "SEK"), null);
  // Units van vier aandelen: één recht geeft hier 4/4 = 1 aandeel.
  assert.equal(rightsValue({ price: 0.6, newShares: 1, perRights: 4, units: true, sharesPerUnit: 4, currency: "SEK" }, 0.8, 0.1, "SEK")!.perRight, 1);
  // "kr" past bij kronen.
  assert.ok(rightsValue({ price: 1, newShares: 1, perRights: 1, currency: "KR" }, 1.5, 0.2, "NOK"));
});

test("koersen via de websocket van TradingView", async () => {
  assert.deepEqual(splitFrames('~m~7~m~{"a":1}~m~4~m~~h~3'), ['{"a":1}', "~h~3"]);
  const socket = fakeSocket({ "MIL:UNIAXA": { lp: 0.67, lp_time: 1792497230, bid: 0.669, ask: 0.672, currency_code: "EUR" } });
  const quotes = await fetchQuotes(socket.open, ["MIL:UNIAXA", "MIL:ONBEKEND", "MIL:UNIAXA"]);
  assert.deepEqual(socket.opened, [["MIL:UNIAXA", "MIL:ONBEKEND"]]);
  assert.deepEqual(quotes.get("MIL:UNIAXA"), { symbol: "MIL:UNIAXA", last: 0.67, lastTime: 1792497230, bid: 0.669, ask: 0.672, currency: "EUR" });
  assert.equal(quotes.has("MIL:ONBEKEND"), false);
});

async function watchSetup(fields: Record<string, Record<string, unknown>>) {
  const store = new MemoryStore();
  const today = "2026-10-20";
  await store.setSetting(
    DAY_KEY,
    JSON.stringify({
      date: today,
      done: ["dividend", "ipo", "rechten", "rechtenvoorwaarden", "rechtenkoersen", "prijzen", "noteringinfo"],
      errors: [],
      rights: [
        { symbol: "MIL:UNIAXA", company: "UNIPOL ASSICURAZIONI SPA", exchange: "MIL", expiry: "2026-10-26", description: "", companySymbol: "MIL:UNI" },
        { symbol: "MIL:ZONDER", company: "Zonder SpA", exchange: "MIL", expiry: "2026-10-30", description: "", companySymbol: "MIL:ZON" },
      ],
    }),
  );
  // De noteringen en het overzicht zijn vanochtend al gedaan.
  await store.setSetting(LISTINGS_DONE_KEY, today);
  await store.setSetting(SENT_DATE_KEY, today);
  await saveTerms(store, { "MIL:UNIAXA": { price: 20.56, currency: "EUR", newShares: 10, perRights: 59 }, "MIL:ZONDER": { price: 1 } });
  await store.addAgenda(
    [{ key: "x", date: today, kind: "claim", label: "laatste handelsdag rechten", symbol: "MIL:UNI", name: "Unipol", title: "", url: "" }],
    at(today, "07:00"),
  );
  const socket = fakeSocket(fields);
  const alerts: string[] = [];
  const net = new FakeNet();
  const deps = (time: string) => ({
    store,
    config,
    fetcher: net.fetch,
    now: at(today, time),
    openSocket: socket.open,
    alert: async (html: string) => void alerts.push(html),
  });
  return { store, socket, alerts, deps, today };
}

test("rechtenwacht: melding als de rechten bij de opening ver onder hun waarde gaan, niet steeds opnieuw", async () => {
  const opened = at("2026-10-20", "09:01");
  const { store, socket, alerts, deps } = await watchSetup({
    "MIL:UNIAXA": { lp: 0.51, lp_time: opened, ask: 0.51, currency_code: "EUR" },
    "MIL:UNI": { lp: 24.3, lp_time: opened, bid: 24.26, currency_code: "EUR" },
  });
  const result = await runMorningStep(deps("09:02"), async () => {});
  assert.equal(result.alerts, 1);
  assert.equal(alerts.length, 1);
  assert.match(alerts[0], /<b>UNIAXA<\/b> rechten UNIPOL ASSICURAZIONI SPA: meedoen is nu <b>2,8% goedkoper<\/b> dan het aandeel/);
  assert.match(alerts[0], /recht €0,51 \(laat\) · aandeel €24,26 \(bied\) · uitgifte €20,56 · 10 nieuwe aandelen per 59 rechten/);
  assert.match(alerts[0], /via rechten €23,57 per aandeel · recht 18,7% onder z'n waarde €0,627/);
  assert.match(alerts[0], /vandaag laatste handelsdag van de rechten/);
  assert.match(alerts[0], /inschrijven kan tot ma 26 okt/);
  assert.ok(!alerts[0].includes("Aanname"));
  // Alleen lijnen met volledige voorwaarden.
  assert.deepEqual(socket.opened[0], ["MIL:UNIAXA", "MIL:UNI"]);

  // Zelfde voordeel een minuut later: geen tweede melding. Een procentpunt meer wel.
  await runMorningStep(deps("09:03"), async () => {});
  assert.equal(alerts.length, 1);
  socket.fields["MIL:UNIAXA"].ask = 0.45;
  await runMorningStep(deps("09:04"), async () => {});
  assert.equal(alerts.length, 2);
  assert.match(alerts[1], /4,3% goedkoper/);
  // Na het eerste half uur alleen om de vijf minuten.
  const rounds = socket.opened.length;
  await runMorningStep(deps("09:41"), async () => {});
  assert.equal(socket.opened.length, rounds);
  await runMorningStep(deps("09:45"), async () => {});
  assert.equal(socket.opened.length, rounds + 1);
  assert.match((await store.getSetting(RIGHTS_WATCH_KEY))!, /"lines":1,"quotes":2/);
  // Na het slot niet meer.
  await runMorningStep(deps("17:35"), async () => {});
  assert.equal(socket.opened.length, rounds + 1);
});

test("rechtenwacht: niet op koersen van gisteren, niet onder de drempel, en uit te zetten", async () => {
  const yesterday = at("2026-10-19", "17:35");
  const stale = await watchSetup({
    "MIL:UNIAXA": { lp: 0.51, lp_time: yesterday, ask: 0.51, currency_code: "EUR" },
    "MIL:UNI": { lp: 24.3, lp_time: at("2026-10-20", "09:01"), bid: 24.26, currency_code: "EUR" },
  });
  assert.equal(await watchRights(stale.deps("09:05"), JSON.parse((await stale.store.getSetting(DAY_KEY))!), "2026-10-20"), 0);

  const now = at("2026-10-20", "09:01");
  const small = await watchSetup({
    "MIL:UNIAXA": { lp: 0.7, lp_time: now, ask: 0.7, currency_code: "EUR" },
    "MIL:UNI": { lp: 24.9, lp_time: now, bid: 24.86, currency_code: "EUR" },
  });
  assert.equal(await watchRights(small.deps("09:05"), JSON.parse((await small.store.getSetting(DAY_KEY))!), "2026-10-20"), 0, "0,7% is te weinig");
  await small.store.setSetting("rights_alert_pct", "0.005");
  assert.equal(await watchRights(small.deps("09:06"), JSON.parse((await small.store.getSetting(DAY_KEY))!), "2026-10-20"), 1, "drempel 0,5%");
  await small.store.setSetting("rights_alert_pct", "0");
  small.socket.opened.length = 0;
  assert.equal(await watchRights(small.deps("09:07"), JSON.parse((await small.store.getSetting(DAY_KEY))!), "2026-10-20"), 0);
  assert.equal(small.socket.opened.length, 0, "uit = geen koersen ophalen");
});

test("/rechten toont de rekensom en neemt zelf ingevulde voorwaarden aan; /rechtenalarm is van de eigenaar", async () => {
  const net = new FakeNet();
  const store = new MemoryStore();
  const bot = { store, telegram: net.telegram(), fetcher: net.fetch, config };
  await store.setSetting(OWNER_USER_KEY, "1");
  await store.setSetting(ALERT_CHAT_KEY, "-100");
  const today = new Date().toISOString().slice(0, 10);
  await store.setSetting(
    DAY_KEY,
    JSON.stringify({
      date: today,
      done: [],
      errors: [],
      rights: [{ symbol: "VIE:LNZB", company: "Lenzing AG", exchange: "VIE", expiry: "", description: "", companySymbol: "VIE:LNZ" }],
      quotes: {
        "VIE:LNZB": { symbol: "VIE:LNZB", last: 0.8, lastTime: Math.floor(Date.now() / 1000), currency: "EUR" },
        "VIE:LNZ": { symbol: "VIE:LNZ", last: 10.52, lastTime: Math.floor(Date.now() / 1000), currency: "EUR" },
      },
    }),
  );
  await handleMessage(bot, msg("/rechten"));
  assert.match(net.sent.at(-1)!.text, /<b>LNZB<\/b> rechten Lenzing AG \(VIE\)/);
  assert.match(net.sent.at(-1)!.text, /slot recht €0,80 · aandeel €10,52/);
  assert.match(net.sent.at(-1)!.text, /uitgifteprijs en verhouding niet gevonden/);

  await handleMessage(bot, msg("/rechten lnzb 9,30 1/2"));
  assert.match(net.sent.at(-1)!.text, /✅ VIE:LNZB: uitgifte 9,30, 1 nieuw per 2 rechten/);
  assert.deepEqual((await loadTerms(store))["VIE:LNZB"], { price: 9.3, newShares: 1, perRights: 2, manual: true, checked: (await loadTerms(store))["VIE:LNZB"].checked });
  await handleMessage(bot, msg("/rechten"));
  // (10,52 − 9,30) / 2 = 0,61 waard; via rechten 9,30 + 2 × 0,80 = 10,90: duurder.
  assert.match(net.sent.at(-1)!.text, /❌ niet winstgevend: via rechten €10,90 per aandeel = 3,6% duurder dan het aandeel/);
  assert.match(net.sent.at(-1)!.text, /\(zelf ingevoerd\)/);
  await handleMessage(bot, msg("/rechten LNZB weg"));
  assert.equal((await loadTerms(store))["VIE:LNZB"], undefined);
  await handleMessage(bot, msg("/rechten ONBEKEND 1 1/1"));
  assert.match(net.sent.at(-1)!.text, /Geen lopende rechten met ticker ONBEKEND/);

  await handleMessage(bot, msg("/rechtenalarm"));
  assert.match(net.sent.at(-1)!.text, /minstens 2% goedkoper/);
  await handleMessage(bot, msg("/rechtenalarm 3,5"));
  assert.equal(await store.getSetting("rights_alert_pct"), "0.035");
  await handleMessage(bot, msg("/rechtenalarm 1", { chatId: "-100", chatType: "supergroup", fromId: "2" }));
  assert.match(net.sent.at(-1)!.text, /alleen de beheerder/);
  await handleMessage(bot, msg("/rechten LNZB 1 1/1", { chatId: "-100", chatType: "supergroup", fromId: "2" }));
  assert.match(net.sent.at(-1)!.text, /alleen de beheerder/);
});
