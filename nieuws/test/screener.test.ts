import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_FILTERS, loadConfig, parseFeeds } from "../src/config.ts";
import {
  checkScreener,
  feedUrl,
  formatCap,
  groupFilters,
  matchFilters,
  parseScannerRows,
  refreshUniverse,
  scannerPayload,
} from "../src/screener.ts";
import { FakeNet, MemoryStore, item } from "./helpers.ts";

const NOW = 1_791_000_000;
const config = loadConfig({ STORY_DETAILS: "false", SCREEN_FEEDS: "en:DE,GB; de:AT,DE" } as never);
const dividend = groupFilters(DEFAULT_FILTERS.dividend.map((word) => ({ filter: "dividend", word })));

test("woorden: hoofdletters, accenten, meervoud en woordgrens", () => {
  const hit = (title: string) => matchFilters(title, dividend)[0]?.word;
  assert.equal(hit("Pfisterer AG: Vorstand schlägt Sonderdividende von 1,50 EUR vor"), "Sonderdividende");
  assert.equal(hit("XYZ AG BESCHLIESST SONDERAUSSCHÜTTUNG"), "Sonderausschüttung");
  assert.equal(hit("Acme plc declares special dividends of 5p"), "special dividend");
  assert.equal(hit("Société X : versement d'un dividende exceptionnel de 2 €"), "dividende exceptionnel");
  assert.equal(hit("Y SpA, approvato dividendo straordinario"), "dividendo straordinario");
  assert.equal(hit("Z ASA foreslår ekstraordinært utbytte"), "ekstraordinært utbytte");
  assert.equal(hit("Q AB: Styrelsen föreslår extrautdelning"), "extrautdelning");
  assert.equal(hit("Company pays regular dividend"), undefined);
  assert.equal(hit("nonspecial dividend"), undefined, "moet aan het begin van een woord staan");
});

test("insolventie en emissie: echte koppen van begin oktober", () => {
  const filters = groupFilters(
    ["insolventie", "emissie"].flatMap((filter) => DEFAULT_FILTERS[filter].map((word) => ({ filter, word }))),
  );
  const hit = (title: string) => matchFilters(title, filters).map((h) => h.filter).join(",") || undefined;
  assert.equal(hit("Nacon fait le point sur la procédure de redressement judiciaire"), "insolventie");
  assert.equal(hit("Energy - Deposita l'istanza di composizione negoziata della crisi"), "insolventie");
  assert.equal(hit("SBF passt Ergebnisprognose für 2026 aufgrund der vorläufigen Insolvenzverwaltung eines Kunden an"), "insolventie");
  assert.equal(hit("Galeria-Insolvenzantrag vom Gericht zugelassen"), "insolventie");
  assert.equal(hit("REG - Headlam Group PLC - Administrators appointed for Ceco (Flooring) Ltd"), "insolventie");
  assert.equal(hit("Gigasun Announces Preliminary Outcome Of Rights Issue"), "emissie");
  assert.equal(hit("REG - eEnergy Group PLC - Placing and Subscription to raise £6.3 million"), "emissie");
  assert.equal(hit("Amoéba : succès de l'augmentation de capital"), "emissie");
  assert.equal(hit("Siav completa aumento capitale da 2,5 mln con ABB, collocamento a 2,25 euro/azione"), "emissie");
  assert.equal(hit("Miquel Y Costas anuncia una ampliación de capital de 15 millones de euros"), "emissie");
  assert.equal(hit("Kapitalerhöhung drückt Lenzing-Aktie auf tiefsten Stand seit 2009"), "emissie");
  assert.equal(hit("Vaisala Corporation's Board of Directors resolved on a directed share issue"), "emissie");
  assert.equal(hit("REG - Mears Grp PLC - Holding(s) in Company"), undefined);
  assert.equal(hit("POLYTEC HOLDING AG (PYT) LLB Invest Lowers Stake to 3.89%"), undefined);
});

test("eigen woorden in meerdere filters", () => {
  const filters = groupFilters([
    { filter: "dividend", word: "Sonderdividende" },
    { filter: "winst", word: "erstmals profitabel" },
    { filter: "winst", word: "Gewinnschwelle" },
  ]);
  assert.deepEqual(matchFilters("ABC AG erreicht erstmals die Gewinnschwelle", filters), [{ filter: "winst", word: "Gewinnschwelle" }]);
});

test("nieuwsstroom-url: filters op volgorde, landen gesorteerd", () => {
  const [feed] = parseFeeds("en: GB,de ,at");
  assert.deepEqual(feed, { lang: "en", countries: ["AT", "DE", "GB"] });
  assert.deepEqual(new URL(feedUrl(feed)).searchParams.getAll("filter"), ["lang:en", "market:stock", "market_country:AT,DE,GB"]);
});

test("screener-verzoek en -antwoord", () => {
  const payload = scannerPayload(config, { min: 2.5e6, max: 5e8 }, 1000) as any;
  assert.deepEqual(payload.range, [1000, 2000]);
  assert.deepEqual(payload.price_conversion, { to_currency: "eur" });
  assert.ok(payload.markets.includes("uk") && payload.markets.includes("switzerland") && !payload.markets.includes("greece"));
  assert.deepEqual(payload.filter[0].right, [2.5e6, 5e8]);
  const { rows, total } = parseScannerRows({
    totalCount: 2890,
    data: [
      { s: "XETR:NC5A", d: ["NorCom Information Technology GmbH & Co. KGaA", 2508868, "Germany"] },
      { s: "LSE:X", d: ["kapot", null, "United Kingdom"] },
    ],
  });
  assert.equal(total, 2890);
  assert.deepEqual(rows, [{ symbol: "XETR:NC5A", name: "NorCom Information Technology GmbH & Co. KGaA", capEur: 2508868, country: "Germany" }]);
});

test("marktwaarde leesbaar", () => {
  assert.equal(formatCap(23_400_000), "€23,4 mln");
  assert.equal(formatCap(2_508_868), "€2,5 mln");
  assert.equal(formatCap(1_200_000_000), "€1,2 mld");
});

function rows(n: number, prefix = "X") {
  return Array.from({ length: n }, (_, i) => ({ s: `XETR:${prefix}${i}`, d: [`Bedrijf ${i}`, 10e6 + i, "Germany"] }));
}

test("selectie verversen: per run één pagina, oude rijen pas weg als alles binnen is", async () => {
  const net = new FakeNet();
  const store = new MemoryStore();
  await store.putUniverse([{ symbol: "XETR:OUD", name: "Oud", capEur: 1, country: "Germany" }], "vorige");
  net.scannerRows = rows(2500);

  assert.equal(await refreshUniverse(store, config, net.fetch, NOW), true);
  assert.equal(store.universe.size, 1001, "oud blijft staan tijdens het verversen");
  await refreshUniverse(store, config, net.fetch, NOW + 60);
  await refreshUniverse(store, config, net.fetch, NOW + 120);
  assert.equal(store.universe.size, 2500);
  assert.ok(!store.universe.has("XETR:OUD"));
  assert.deepEqual(net.scannerBodies.map((b) => b.range[0]), [0, 1000, 2000]);

  assert.equal(await refreshUniverse(store, config, net.fetch, NOW + 3600), false, "pas na 20 uur opnieuw");
  await store.setSetting("screen_cap_max", "100000000");
  assert.equal(await refreshUniverse(store, config, net.fetch, NOW + 3660), true, "andere bandbreedte: meteen opnieuw");
  assert.deepEqual(net.scannerBodies.at(-1).filter[0].right, [2_500_000, 100_000_000]);
});

test("selectie: alleen bedrijven uit de gekozen landen, ook als ze in Londen genoteerd zijn", async () => {
  const net = new FakeNet();
  const store = new MemoryStore();
  net.scannerRows = [
    { s: "LSE:UK1", d: ["Brits bedrijf", 2e7, "United Kingdom"] },
    { s: "LSE:IE1", d: ["Iers bedrijf", 2e7, "Ireland"] },
    { s: "LSE:CY1", d: ["Cypriotisch bedrijf", 2e7, "Cyprus"] },
    { s: "OMXSTO:US1", d: ["Amerikaans bedrijf", 2e7, "United States"] },
    { s: "OMXCOP:FO1", d: ["Faeröers bedrijf", 2e7, "Faroe Islands"] },
  ];
  await refreshUniverse(store, config, net.fetch, NOW);
  assert.deepEqual([...store.universe.keys()].sort(), ["LSE:UK1", "OMXCOP:FO1"]);
});

test("lege screener-respons gooit de selectie niet weg", async () => {
  const net = new FakeNet();
  const store = new MemoryStore();
  await store.putUniverse([{ symbol: "XETR:OUD", name: "Oud", capEur: 1, country: "Germany" }], "vorige");
  await refreshUniverse(store, config, net.fetch, NOW);
  assert.ok(store.universe.has("XETR:OUD"));
});

async function screenerSetup() {
  const net = new FakeNet();
  const store = new MemoryStore();
  for (const word of DEFAULT_FILTERS.dividend) await store.addFilterWord("dividend", word);
  await store.putUniverse(
    [
      { symbol: "XETR:PFSE", name: "Pfisterer Holding SE", capEur: 312_000_000, country: "Germany" },
      { symbol: "LSE:ACME", name: "Acme plc", capEur: 45_500_000, country: "United Kingdom" },
    ],
    "b",
  );
  const sent: string[] = [];
  const run = (now: number) =>
    checkScreener({ store, fetcher: net.fetch, config, send: async (t) => void sent.push(t), now });
  return { net, store, sent, run };
}

test("screener: melding bij filterwoord binnen de selectie, één keer", async () => {
  const { net, sent, run } = await screenerSetup();
  assert.equal((await run(NOW)).alerted, 0, "eerste run legt alleen het startpunt vast");

  net.feeds.set("de", {
    items: [
      item("eqs:1", "Pfisterer Holding SE: Vorstand schlägt Sonderdividende vor", NOW + 30, {
        relatedSymbols: [{ symbol: "XETR:PFSE" }],
        provider: { name: "EQS" },
      }),
      item("eqs:2", "Siemens AG: Sonderdividende", NOW + 30, { relatedSymbols: [{ symbol: "XETR:SIE" }] }),
      item("eqs:3", "Pfisterer Holding SE: Hauptversammlung", NOW + 30, { relatedSymbols: [{ symbol: "XETR:PFSE" }] }),
      item("eqs:0", "Pfisterer: Sonderdividende (oud)", NOW - 60, { relatedSymbols: [{ symbol: "XETR:PFSE" }] }),
    ],
  });
  net.feeds.set("en", {
    items: [
      item("eqs:1en", "Pfisterer Holding SE: Management Board proposes special dividend", NOW + 31, {
        relatedSymbols: [{ symbol: "XETR:PFSE" }],
      }),
      item("rns:9", "Acme plc declares special dividends", NOW + 40, { relatedSymbols: [{ symbol: "LSE:ACME" }] }),
    ],
  });
  const result = await run(NOW + 60);
  assert.equal(result.alerted, 3);
  assert.equal(sent.length, 2, "Pfisterer in twee talen wordt één bericht");
  const pfisterer = sent.find((t) => t.includes("PFSE"))!;
  assert.match(pfisterer, /🔎 <b>Filter: dividend<\/b>/);
  assert.match(pfisterer, /Duitsland · marktwaarde €312,0 mln/);
  assert.match(pfisterer, /Vorstand schlägt Sonderdividende vor/);
  assert.match(pfisterer, /proposes special dividend/);
  assert.ok(!sent.some((t) => t.includes("Siemens") || t.includes("Hauptversammlung") || t.includes("(oud)")));
  assert.match(sent.find((t) => t.includes("ACME"))!, /Verenigd Koninkrijk · marktwaarde €45,5 mln/);

  await run(NOW + 120);
  assert.equal(sent.length, 2, "geen dubbele meldingen");
  assert.equal(net.feedRequests.length, 4, "twee stromen per run, niet per aandeel");
});

test("screener: niets dubbel als de volglijst het al gemeld heeft", async () => {
  const { net, store, sent, run } = await screenerSetup();
  await run(NOW);
  await store.markSeen(["eqs:7"], "XETR:PFSE", NOW);
  net.feeds.set("de", {
    items: [item("eqs:7", "Pfisterer: Sonderdividende", NOW + 30, { relatedSymbols: [{ symbol: "XETR:PFSE" }] })],
  });
  await run(NOW + 60);
  assert.equal(sent.length, 0);
});

test("screener: zonder filters gebeurt er niets", async () => {
  const net = new FakeNet();
  const store = new MemoryStore();
  const result = await checkScreener({ store, fetcher: net.fetch, config, send: async () => {}, now: NOW });
  assert.equal(result.scanned, 0);
  assert.equal(net.feedRequests.length, 0);
});
