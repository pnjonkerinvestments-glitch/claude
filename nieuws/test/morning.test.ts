import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_FILTERS, loadConfig } from "../src/config.ts";
import { datesForAgenda, findDates, localTime, toUnix } from "../src/dates.ts";
import { MAIN_EXCHANGES, newListings, sweepListings } from "../src/listings.ts";
import {
  DIGEST,
  SENT_KEY,
  checkStories,
  dividendPayload,
  dividendRatio,
  pack,
  parseDividendAmount,
  parseDividends,
  runMorningStep,
} from "../src/morning.ts";
import { checkScreener, groupFilters, matchFilters } from "../src/screener.ts";
import { flattenStory } from "../src/tradingview.ts";
import { parseValuation } from "../src/size.ts";
import { parseGrowthCsv } from "../src/growth.ts";
import { FakeNet, MemoryStore, item } from "./helpers.ts";

const TZ = "Europe/Amsterdam";
const config = loadConfig({ STORY_DETAILS: "false", SCREEN_FEEDS: "en:DE,GB" } as never);
const at = (date: string, clock: string) => toUnix(date, Number(clock.slice(0, 2)) * 60 + Number(clock.slice(3)), TZ);

// ---------------------------------------------------------------- datums

test("klok: 08:40 in Amsterdam, ook in de wintertijd", () => {
  assert.equal(new Date(at("2026-10-06", "08:40") * 1000).toISOString(), "2026-10-06T06:40:00.000Z");
  assert.equal(new Date(at("2026-12-07", "08:40") * 1000).toISOString(), "2026-12-07T07:40:00.000Z");
  assert.deepEqual(localTime(at("2026-10-06", "08:40"), TZ), { date: "2026-10-06", weekday: 2, minutes: 520 });
  assert.equal(localTime(at("2026-10-10", "12:00"), TZ).weekday, 6);
});

test("datums uit echte koppen en persberichten, met het soort datum", () => {
  const dates = (text: string) => datesForAgenda(text, "2026-10-06", "2026-10-06");
  assert.deepEqual(dates("80 Mile Extends PUSU Deadline For Greenland Energy Offer To Nov 3"), [
    { date: "2026-11-03", label: "PUSU-deadline (bod of afzien)" },
  ]);
  assert.deepEqual(dates("Webuild, Opa su Trevi in programma da 28 settembre a 20 novembre"), [
    { date: "2026-11-20", label: "einde periode" },
  ]);
  assert.deepEqual(dates("Glencore: First Day of Trading for Australian Securities Exchange Secondary Listing on Oct. 14"), [
    { date: "2026-10-14", label: "eerste handelsdag" },
  ]);
  assert.deepEqual(dates("Thyssenkrupp targets October 28 for listing of materials trading unit, sources say"), [
    { date: "2026-10-28", label: "eerste handelsdag" },
  ]);
  assert.deepEqual(dates("Adeunis : mise en oeuvre du retrait obligatoire le 15 octobre"), [
    { date: "2026-10-15", label: "laatste handelsdag / delisting" },
  ]);
  assert.deepEqual(dates("Die Annahmefrist endet am 23. Oktober 2026, 24:00 Uhr (Ortszeit Frankfurt am Main)."), [
    { date: "2026-10-23", label: "einde aanmeldtermijn" },
  ]);
  assert.deepEqual(dates("The FDA has set a PDUFA target action date of March 15, 2027."), [{ date: "2027-03-15", label: "PDUFA-datum" }]);
  assert.deepEqual(dates("Ezentis propondrá en su junta extraordinaria del 3 de noviembre una operación de 'contrasplit'"), [
    { date: "2026-11-03", label: "vergadering" },
  ]);
  assert.deepEqual(dates("ex-dividend date 08.10.2026, payment 16/10/2026"), [
    { date: "2026-10-08", label: "ex-dividend" },
    { date: "2026-10-16", label: "betaaldatum dividend" },
  ]);
  // Geen datums: "19 MAR" is een verordening, de dagtekening en datums in het verleden tellen niet.
  assert.deepEqual(dates("Managers' transactions announcement according to article 19 MAR"), []);
  assert.deepEqual(dates("COMMUNIQUÉ DU 6 OCTOBRE 2026 RELATIF AU DEPÔT D'UNE OFFRE PUBLIQUE"), []);
  assert.deepEqual(dates("Die Annahmefrist endete am 1. Oktober 2026"), []);
  assert.equal(findDates("Segment growth, EGM approved", "2026-10-06").length, 0);
});

test("berichttekst uit de opmaakboom van TradingView", () => {
  const ast = {
    type: "root",
    children: [
      { type: "p", children: ["Pfisterer ", { type: "symbol", params: { symbol: "XETR:PFSE", text: "XETR:PFSE" } }, ":"] },
      { type: "p", children: [{ type: "b", children: ["Annahmefrist"] }, " endet am 23. Oktober 2026."] },
      { type: "table", children: [{ type: "table-row", children: [{ type: "table-data-cell", children: ["a"] }, { type: "table-data-cell", children: ["b"] }] }] },
    ],
  };
  assert.equal(flattenStory(ast), "Pfisterer XETR:PFSE:\nAnnahmefrist endet am 23. Oktober 2026.\na | b |");
});

// ---------------------------------------------------------------- dividend

test("bedrag van een speciaal dividend uit kop of tekst", () => {
  assert.deepEqual(parseDividendAmount("Pfisterer AG: Vorstand schlägt Sonderdividende von 1,50 EUR je Aktie vor"), { amount: 1.5, currency: "EUR" });
  assert.deepEqual(parseDividendAmount("Acme plc declares special dividend of 25p per share"), { amount: 25, currency: "GBX" });
  assert.deepEqual(parseDividendAmount("Société X : versement d'un dividende exceptionnel de 2 € par action"), { amount: 2, currency: "EUR" });
  assert.deepEqual(parseDividendAmount("Deep Value Driller proposes extraordinary dividend of NOK 20.60 per share"), { amount: 20.6, currency: "NOK" });
  assert.deepEqual(parseDividendAmount("Q AB: Styrelsen föreslår extrautdelning om 5 kronor per aktie"), { amount: 5, currency: "SEK" });
  assert.deepEqual(parseDividendAmount("Y SpA, dividendo straordinario di 0,35 euro"), { amount: 0.35, currency: "EUR" });
  assert.deepEqual(parseDividendAmount("Big plc: special dividend of £1,250.50 total"), { amount: 1250.5, currency: "GBP" });
  assert.equal(parseDividendAmount("Company raises EUR 20 million; special dividend under review"), null);
  assert.equal(parseDividendAmount("Regular dividend of EUR 1"), null);

  assert.equal(dividendRatio({ amount: 25, currency: "GBX" }, { close: 100, currency: "GBX", name: "" }), 0.25);
  assert.equal(dividendRatio({ amount: 0.25, currency: "GBP" }, { close: 100, currency: "GBX", name: "" }), 0.25);
  assert.equal(dividendRatio({ amount: 5, currency: "KR" }, { close: 20, currency: "SEK", name: "" }), 0.25);
  assert.equal(dividendRatio({ amount: 5, currency: "USD" }, { close: 20, currency: "EUR", name: "" }), null);
});

test("aangekondigd dividend uit de screener: in eigen munt, vanaf 25% van de koers", () => {
  const payload = dividendPayload(config, 1_791_000_000) as any;
  assert.deepEqual(payload.price_conversion, { to_symbol: true }, "zonder dit geeft TradingView dollars");
  const rows = parseDividends(
    [
      { s: "OSL:DVD", d: ["Deep Value Driller AS", "Norway", 21.85, "NOK", 20.6, at("2026-10-08", "11:59"), at("2026-10-16", "11:59")] },
      { s: "BME:A3M", d: ["Atresmedia", "Spain", 5.75, "EUR", 0.6723, at("2026-12-14", "11:59"), null] },
      { s: "NYSE:X", d: ["Buitenlands", "United States", 10, "USD", 9, at("2026-10-08", "11:59"), null] },
    ],
    config,
  );
  assert.deepEqual(rows.map((r) => [r.symbol, r.exDate, r.payDate]), [["OSL:DVD", "2026-10-08", "2026-10-16"]]);
});

// ---------------------------------------------------------------- screener

test("claimemissies, Britse biedingen en de andere filters tegen echte koppen", () => {
  const filters = groupFilters(
    ["overname", "claim", "adhoc", "fda", "index", "notering", "splitsing", "handelsstop"].flatMap((filter) =>
      DEFAULT_FILTERS[filter].map((word) => ({ filter, word })),
    ),
  );
  const hit = (title: string) => matchFilters(title, filters).map((h) => h.filter).join(",") || undefined;
  // Insiders bestaan niet meer.
  assert.equal(hit("FIT GROUP AG: Diyar Acar, Kauf"), undefined);
  assert.equal(hit("REG - Land Sec. Group PLC - Director/PDMR Shareholding"), undefined);
  // Claimemissies, maar niet "unter Ausschluss des Bezugsrechts" of een insider die rechten uitoefent.
  assert.equal(hit("Orexo Resolves To Carry Out Rights Issue Of SEK 250 Mln"), "claim");
  assert.equal(hit("Unipol, aumento di capitale in opzione da 2,5 miliardi"), "claim");
  assert.equal(hit("Techstep ASA: Fortrinnsrettsemisjon - tegningsperioden starter i dag"), "claim");
  assert.equal(hit("Algene Holding SE: Barkapitalerhöhung unter Ausschluss des Bezugsrechts mit einem Volumen von bis zu EUR 3 Mio."), undefined);
  assert.equal(hit("Lenzing AG: Oberbank AG, Erwerb: Ausübung Bezugsrechte"), undefined);
  // Britse biedingen.
  assert.equal(hit("REG - Spectris PLC - Recommended Cash Acquisition of Spectris plc by Advent"), "overname");
  assert.equal(hit("REG - Assura PLC - Statement regarding possible offer"), "overname");
  assert.equal(hit("AKVA group ASA: Agreement on a recommended voluntary cash offer for all shares"), "overname");
  assert.equal(hit("Pininfarina, azionista Mahindra lancia Opa con obiettivo delisting"), "overname");
  assert.equal(hit("Nürnberger Beteiligungs-AG: Squeeze-out-Verlangen. Barabfindung auf EUR 120,00 je Aktie"), "overname");
  assert.equal(hit("REG - Squarepoint Ops LLC Bodycote PLC - Form 8.3 - Bodycote PLC"), undefined);
  assert.equal(hit("OTS: Personio / Personio übernimmt Fintech Circula / Die Übernahme macht ..."), undefined);
  assert.equal(hit("PTA-Adhoc: Jost AG: Vorstand erwartet für 2026 Umsatz über dem Rekordjahr"), "adhoc");
  assert.equal(hit("Inside Information: Preliminary result of Martela Corporation’s directed share issue"), "adhoc");
  assert.equal(hit("BOOSTER Precision Components gibt Verlängerung der Stillhaltevereinbarung mit Ad-hoc-Gruppe bekannt"), undefined);
  assert.equal(hit("XETR:AAD Managers' transactions announcement according to article 19 MAR"), undefined);
  assert.equal(hit("Idorsia Announces Positive Phase 3 Precision Study Findings"), "fda");
  assert.equal(hit("Studie: Alle europäischen Autobauer schaffen Emissionsziele bis 2027"), undefined);
  assert.equal(hit("Glencore Gets Approval for Agua Rica Project in Argentina"), undefined);
  assert.equal(hit("INDEX-MONITOR: SGL Carbon rückt für W&W in den SDax auf"), "index");
  assert.equal(hit("GENFIT va intégrer les indices CAC Mid 60 et SBF 120 d’Euronext Paris"), "index");
  assert.equal(hit("AKTIE IM FOKUS: Auto1 am MDax-Ende - Analysten senken Ziele"), undefined);
  assert.equal(hit("Glencore: First Day of Trading for Australian Securities Exchange Secondary Listing on Oct. 14"), "notering");
  assert.equal(hit("Vantiva : transfert sur Euronext Growth Paris envisagé fin novembre"), "notering");
  assert.equal(hit("REG - Cohort PLC - Block Listings Six Monthly Return"), undefined);
  assert.equal(hit("Toosla lance une opération de regroupement d'actions"), "splitsing");
  assert.equal(hit("Perrot-Duval-Aktien vor GV vom Handel ausgesetzt"), "handelsstop");
});

test("screener: alles wordt bewaard, filters voor het ochtendoverzicht melden niet direct", async () => {
  const net = new FakeNet();
  const store = new MemoryStore();
  const sent: string[] = [];
  for (const filter of ["overname", "emissie"]) await store.addFilterWords(filter, DEFAULT_FILTERS[filter]);
  await store.putUniverse([{ symbol: "XETR:PFSE", name: "Pfisterer", capEur: 300e6, country: "Germany" }], "b");
  const run = (now: number) =>
    checkScreener({ store, fetcher: net.fetch, config, now, send: async (html) => void sent.push(html) });
  const NOW = 1_791_000_000;
  await run(NOW);
  net.feeds.set("en", {
    items: [
      item("o:1", "Pfisterer: recommended cash offer at EUR 30", NOW + 10, { relatedSymbols: [{ symbol: "XETR:PFSE" }] }),
      item("e:1", "Pfisterer: capital increase placed", NOW + 20, { relatedSymbols: [{ symbol: "XETR:PFSE" }] }),
      item("b:1", "Pfisterer: takeover offer and capital increase", NOW + 30, { relatedSymbols: [{ symbol: "XETR:PFSE" }] }),
    ],
  });
  await run(NOW + 60);
  assert.equal(sent.length, 1, "één bericht: emissie meldt direct, overname niet");
  assert.match(sent[0], /Filter: emissie/);
  assert.ok(!sent[0].includes("overname"));
  assert.deepEqual(
    store.events.map((e) => `${e.id}:${e.filter}`).sort(),
    ["b:1:emissie", "b:1:overname", "e:1:emissie", "o:1:overname"],
  );
  assert.equal(store.events[0].name, "Pfisterer");

  // Volgende minuut: niets dubbel, niet opnieuw bewaard.
  await run(NOW + 120);
  assert.equal(sent.length, 1);
  assert.equal(store.events.length, 4);
});

// ---------------------------------------------------------------- noteringen

test("noteringen: eerste ronde legt vast, daarna zijn nieuwe beursgangen en dubbele noteringen te zien", async () => {
  const net = new FakeNet();
  const store = new MemoryStore();
  const primary = [
    { s: "EURONEXT:DSFIR", d: ["DSM-Firmenich AG", "EURONEXT", "Switzerland", "CH1216478797"] },
    { s: "XETR:SAP", d: ["SAP SE", "XETR", "Germany", "DE0007164600"] },
  ];
  const other = [{ s: "XETR:GOB", d: ["Compagnie de Saint-Gobain SA", "XETR", "France", "FR0000125007"] }];
  net.scannerHandler = (body) => (body.columns.includes("isin") ? (body.filter[0].right ? primary : other) : null);
  const NOW = at("2026-10-05", "07:00");
  assert.equal(await sweepListings(store, config, net.fetch, NOW, "2026-10-05"), true);
  assert.equal(await sweepListings(store, config, net.fetch, NOW + 60, "2026-10-05"), true);
  assert.equal(await sweepListings(store, config, net.fetch, NOW + 120, "2026-10-05"), false, "vandaag klaar");
  const otherQuery = net.scannerBodies.find((b) => b.filter[0].right === false);
  assert.deepEqual(otherQuery.filter[2], { left: "exchange", operation: "in_range", right: MAIN_EXCHANGES });
  assert.deepEqual(await newListings(store, 0), [], "de eerste ronde is niets nieuws");

  primary.push({ s: "SIX:INFOM", d: ["Infomaniak Network SA", "SIX", "Switzerland", "CH0000000001"] });
  other.push({ s: "SIX:DSFIR", d: ["DSM-Firmenich AG", "SIX", "Switzerland", "CH1216478797"] });
  other.push({ s: "XETR:SAPT", d: ["SAP SE TEMP", "XETR", "Germany", "DE0007164600"] });
  const NEXT = at("2026-10-06", "07:00");
  await sweepListings(store, config, net.fetch, NEXT, "2026-10-06");
  await sweepListings(store, config, net.fetch, NEXT + 60, "2026-10-06");
  const fresh = await newListings(store, NEXT - 3600);
  assert.deepEqual(
    fresh.map((l) => [l.symbol, l.kind, l.others.map((o) => o.symbol)]),
    [
      ["SIX:INFOM", "ipo", []],
      ["SIX:DSFIR", "dubbel", ["EURONEXT:DSFIR"]],
    ],
  );
});

// ---------------------------------------------------------------- het hele ochtendoverzicht

function morningNet() {
  const net = new FakeNet();
  const primary: unknown[] = [
    { s: "XETR:PFSE", d: ["Pfisterer Holding SE", "XETR", "Germany", "DE000PFSE001"] },
    { s: "XETR:MUV2", d: ["Munchener Ruckversicherungs-Gesellschaft AG", "XETR", "Germany", "DE0008430026"] },
    { s: "OSL:ACR", d: ["Axactor ASA", "OSL", "Norway", "NO0010840515"] },
    { s: "MIL:UNI", d: ["UNIPOL ASSICURAZIONI SPA", "MIL", "Italy", "IT0004810054"] },
  ];
  const other: unknown[] = [];
  // Marktwaarde en IPO-datum van nieuwe noteringen (stap noteringinfo).
  const listingInfo: Record<string, [number, number | null]> = {
    "SIX:INFOM": [1.5e9, at("2026-10-05", "02:00")],
    "EURONEXT:PFSE": [1.2e9, null],
    "VIE:RAT": [20e6, null],
    "BME:OUD": [2e9, at("1998-05-04", "02:00")],
    "SIX:MUV2": [60e9, null],
    "LSE:0EW2": [400e6, null],
    "OMXSTO:ACRO": [50e6, null],
  };
  net.scannerHandler = (body) => {
    if (body.symbols && body.columns.length === 1) {
      return body.symbols.tickers.flatMap((t: string) => (t === "MIL:UNI" ? [{ s: t, d: [23e9] }] : []));
    }
    if (body.symbols && body.columns.includes("ipo_offer_date")) {
      return body.symbols.tickers.flatMap((t: string) => (listingInfo[t] ? [{ s: t, d: listingInfo[t] }] : []));
    }
    if (body.symbols) {
      return body.symbols.tickers.flatMap((t: string) =>
        t === "XETR:PFSE" ? [{ s: t, d: [12.1, "EUR", "Pfisterer Holding SE"] }] : t === "LSE:XYZ" ? [{ s: t, d: [500, "GBX", "XYZ plc"] }] : [],
      );
    }
    const columns: string[] = body.columns;
    if (columns.includes("isin") && columns.length === 4) return body.filter[0].right ? primary : other;
    if (columns.includes("dividend_amount_upcoming")) {
      return [
        { s: "OSL:DVD", d: ["Deep Value Driller AS", "Norway", 21.85, "NOK", 20.6, at("2026-10-08", "11:59"), at("2026-10-16", "11:59")] },
        { s: "BME:A3M", d: ["Atresmedia", "Spain", 5.75, "EUR", 0.6723, at("2026-12-14", "11:59"), null] },
        { s: "OSL:GROW", d: ["Growth Oslo AS", "Norway", 10, "NOK", 5, at("2026-10-09", "11:59"), null] },
      ];
    }
    if (columns.includes("ipo_offer_status")) {
      return body.filter[0].left === "ipo_offer_status"
        ? [
            { s: "SIX:INFOM", d: ["Infomaniak Network SA", "SIX", "Switzerland", "pending", null, null, 900e6] },
            { s: "FWB:ADG", d: ["AMG Critical Materials N.V.", "FWB", "Netherlands", "pending", null, null, null] },
          ]
        : [];
    }
    return null;
  };
  // Euronext Growth Oslo en de claimrechten op Euronext Milan.
  net.growthCsv = [
    "Name;ISIN;Symbol;Market;Currency",
    '"European Equities"',
    ...Array.from({ length: 30 }, (_, i) => `"GROEI ${i}";NO00000000${String(i).padStart(2, "0")};GR${i};"Euronext Growth Oslo";NOK`),
    '"GROWTH OSLO";NO00000GRW01;GROW;"Euronext Growth Oslo";NOK',
  ].join("\n");
  net.searchByExchange.set("MIL", {
    symbols: [
      { symbol: "UNIAXA", description: "UNIPOL ASSICURAZIONI SPA Rights 2026-26.10.26 fOR Shares", type: "right", exchange: "MIL", isin: "IT0005733370" },
      { symbol: "OLDR", description: "Oud SpA Rights 2026-01.10.26 For Shares", type: "right", exchange: "MIL" },
      { symbol: "UNI", description: "UNIPOL ASSICURAZIONI SPA", type: "stock", exchange: "MIL" },
    ],
  });
  return { net, primary, other };
}

async function runDay(
  deps: { store: MemoryStore; net: FakeNet },
  date: string,
  from: string,
  to: string,
  sent: string[],
): Promise<void> {
  for (let now = at(date, from); now <= at(date, to); now += 60) {
    await runMorningStep({ store: deps.store, config, fetcher: deps.net.fetch, now }, async (html) => void sent.push(html));
  }
}

test("ochtendoverzicht: op werkdagen om 08:40 één keer, met agenda, claimemissies, dividend, overnames, emissies en noteringen", async () => {
  const { net, primary, other } = morningNet();
  const store = new MemoryStore();
  const sent: string[] = [];

  // Maandag: de eerste ronde noteringen legt alleen vast; de rechten van Unipol bestaan nog niet.
  const milRights = net.searchByExchange.get("MIL");
  net.searchByExchange.set("MIL", { symbols: [] });
  await runDay({ store, net }, "2026-10-05", "06:55", "09:00", sent);
  net.searchByExchange.set("MIL", milRights);
  assert.equal(sent.length, 1, "maandag één overzicht");
  assert.match(sent[0], /Ochtendoverzicht ma 5 okt/);
  assert.ok(!sent[0].includes("Nieuw op de beurs"));
  sent.length = 0;

  // Nieuws in de nacht naar dinsdag, en de nieuwe noteringen.
  const night = at("2026-10-05", "22:00");
  const ev = (id: string, filter: string, symbol: string, name: string, title: string, published = night) => ({
    id, filter, symbol, name, title, url: `https://example.com/${id}`, lang: "de", published,
  });
  await store.recordEvents(
    [
      ev("o1", "overname", "XETR:PFSE", "Pfisterer Holding SE", "Pfisterer: Übernahmeangebot von ABB zu 30 EUR"),
      ev("d1", "dividend", "XETR:PFSE", "Pfisterer Holding SE", "Pfisterer: Vorstand schlägt Sonderdividende von 4,00 EUR vor"),
      ev("d2", "dividend", "LSE:XYZ", "XYZ plc", "XYZ plc declares special dividend of 5p"),
      ev("i1", "insider", "XETR:R1B", "Rubean AG", "Rubean AG: M2 Venture GmbH, Kauf"),
      ev("c1", "emissie", "MIL:UNI", "", "Unipol, prezzo aumento capitale fissato a 20,56 euro, al via il 12 ottobre"),
      ev("e1", "emissie", "LSE:TINY", "Tiny plc", "REG - Tiny plc - Placing to raise £2 million"),
      ev("e2", "emissie", "XETR:MUX", "Mutares SE", "Mutares: Kapitalerhöhung erfolgreich platziert"),
      ev("g1", "emissie", "OSL:GROW", "Growth Oslo AS", "Growth Oslo AS: private placement completed"),
      ev("n1", "ipo", "", "", "Dolomiti Energia, Ipo in stand-by"),
      ev("a1", "adhoc", "XETR:JST", "Jost AG", "PTA-Adhoc: Jost AG: Prognose angehoben"),
      ev("a0", "adhoc", "XETR:OLD", "Oud AG", "PTA-Adhoc: Oud AG: van gistermiddag", at("2026-10-05", "15:00")),
      ev("f1", "fda", "OMXCOP:GMAB", "", "Genmab Phase 3 Combo Cuts Risk by 51%"),
    ],
    night,
  );
  net.stories.set("o1", { astDescription: { type: "root", children: [{ type: "p", children: ["Die Annahmefrist endet am 9. Oktober 2026."] }] } });
  net.stories.set("c1", {
    astDescription: {
      type: "root",
      children: [{ type: "p", children: ["I diritti di opzione saranno esercitabili dal 12 al 26 ottobre e negoziabili dal 12 al 20 ottobre."] }],
    },
  });
  primary.push({ s: "SIX:INFOM", d: ["Infomaniak Network SA", "SIX", "Switzerland", "CH0000000001"] });
  other.push({ s: "EURONEXT:PFSE", d: ["Pfisterer Holding SE", "EURONEXT", "Germany", "DE000PFSE001"] });
  // Ruis van 7 oktober: oude of kleine aandelen die even uit de lijst waren, en extra handelslijnen.
  primary.push({ s: "VIE:RAT", d: ["Rath AG", "VIE", "Austria", "AT0000767306"] });
  primary.push({ s: "BME:OUD", d: ["Oud Groot SA", "BME", "Spain", "ES0000000OUD"] });
  other.push({ s: "SIX:MUV2", d: ["Munchener Ruckversicherungs-Gesellschaft AG", "SIX", "Germany", "DE0008430026"] });
  other.push({ s: "LSE:0EW2", d: ["Sogn Sparebank", "LSE", "Norway", "NO0006000603"] });
  other.push({ s: "OMXSTO:ACRO", d: ["Axactor ASA", "OMXSTO", "Norway", "NO0010840515"] });
  await store.addAgenda(
    [{ key: "eigen:1", date: "2026-10-07", kind: "eigen", label: "Capital Markets Day Pfisterer", symbol: "", name: "", title: "", url: "" }],
    night,
  );
  await store.setSetting("routes", JSON.stringify({ [DIGEST]: { chat: "-100", thread: 77 } }));

  await runDay({ store, net }, "2026-10-06", "06:55", "08:39", sent);
  assert.equal(sent.length, 0, "niets vóór 08:40");
  await runDay({ store, net }, "2026-10-06", "08:40", "10:00", sent);
  assert.equal(sent.length, 1, "precies één keer");
  const text = sent[0];

  assert.match(text, /Ochtendoverzicht di 6 okt/);
  // Agenda: eigen punt, ex-dividend uit de screener en de deadline uit het persbericht.
  assert.match(text, /Agenda komende 7 dagen/);
  assert.match(text, /wo 7 okt<\/b> \(morgen\) Capital Markets Day Pfisterer/);
  assert.match(text, /do 8 okt<\/b> \(over 2 dagen\) <b>DVD<\/b> Deep Value Driller AS · ex-dividend 20,60 NOK \(94% van de koers\)/);
  assert.match(text, /vr 9 okt<\/b> \(over 3 dagen\) <b>PFSE<\/b> Pfisterer Holding SE · einde aanmeldtermijn/);
  // Dividend: screener (94%) en nieuws met koers (33%); 5p op 500p (1%) weggelaten; Atresmedia (12%) niet.
  assert.match(text, /<b>DVD<\/b> Deep Value Driller AS: 20,60 NOK bij koers 21,85 NOK = <b>94%<\/b> · ex do 8 okt/);
  assert.match(text, /<b>PFSE<\/b> Pfisterer Holding SE: €4,00 bij koers €12,10 = <b>33%<\/b>/);
  assert.match(text, /1 speciaal dividend onder 25% weggelaten/);
  assert.ok(!text.includes("Atresmedia"));
  // Claimemissie: rechtenlijn met alle data, en het emissiebericht niet nog eens onder Emissies.
  assert.match(
    text,
    /Claimemissies en rechtenhandel<\/b>\n• <b>UNIAXA<\/b> rechten UNIPOL ASSICURAZIONI SPA \(MIL, €23,0 mld\) · 🆕 <b>rechtenhandel net begonnen<\/b>\n   rechtenhandel begint <b>ma 12 okt<\/b> \(over 6 dagen\) · laatste handelsdag rechten <b>di 20 okt<\/b> \(over 14 dagen\) · inschrijving sluit <b>ma 26 okt<\/b> \(over 20 dagen\) · rechten vervallen <b>ma 26 okt<\/b> \(over 20 dagen\)\n\n/,
  );
  assert.ok(!text.includes("OLDR"), "verlopen rechten");
  assert.match(text, /ma 12 okt<\/b> \(over 6 dagen\) <b>UNI<\/b> \(MIL\) · rechtenhandel begint/);
  // Emissies: niet uit Londen, niet de claimemissie, niet van Euronext Growth Oslo.
  assert.match(text, /Emissies<\/b>\n• <b>MUX<\/b> Mutares SE: <a href="https:\/\/example.com\/e2">Mutares: Kapitalerhöhung erfolgreich platziert<\/a>\n\n/);
  for (const noise of ["Tiny plc", "Growth Oslo", "Rubean", "Insider", "Vroege koersen", "Cijfers vandaag"]) assert.ok(!text.includes(noise), noise);
  // Noteringen pas vanaf €1 mld, en de IPO-kalender met IPO-nieuws.
  assert.match(text, /Nieuw op de beurs<\/b>\n• <b>INFOM<\/b> Infomaniak Network SA \(SIX, Zwitserland, €1,5 mld\) · nieuw op de beurs\n\n/);
  assert.match(
    text,
    /dubbele noteringen<\/b>\n• <b>PFSE<\/b> Pfisterer Holding SE \(EURONEXT, Duitsland, €1,2 mld\) · tweede notering, al genoteerd als XETR:PFSE\n\n/,
  );
  for (const noise of ["Rath", "Oud Groot", "MUV2", "Sogn", "Axactor"]) assert.ok(!text.includes(noise), noise);
  assert.match(
    text,
    /Beursgangen en noteringen op komst<\/b>\n• <b>INFOM<\/b> Infomaniak Network SA \(SIX\) · datum nog niet bekend · marktwaarde ±\$900 mln\n• <a href="https:\/\/example.com\/n1">Dolomiti Energia, Ipo in stand-by<\/a>\n\n/,
  );
  // Overname met deadline.
  assert.match(text, /Übernahmeangebot von ABB zu 30 EUR<\/a>\n   ⏰ einde aanmeldtermijn: <b>vr 9 okt<\/b> \(over 3 dagen\)/);
  // Ad-hoc alleen sinds het slot van gisteren.
  assert.match(text, /Jost AG: Prognose angehoben/);
  assert.ok(!text.includes("van gistermiddag"));
  assert.match(text, /<b>GMAB<\/b> \(OMXCOP\): <a href="https:\/\/example.com\/f1">Genmab Phase 3/);
  // In het eigen onderwerp (zoals runMorning het verstuurt).
  const { AlertSender } = await import("../src/alerts.ts");
  await new AlertSender(store, net.telegram(), "-100").send("x", [DIGEST]);
  assert.deepEqual(net.sentThreads, [77]);

  // Woensdag: alleen wat nieuw is sinds dinsdag.
  sent.length = 0;
  await runDay({ store, net }, "2026-10-07", "08:35", "08:45", sent);
  assert.equal(sent.length, 1);
  assert.ok(!sent[0].includes("Jost"), "nieuws van gisteren staat er niet nog eens in");
  assert.ok(!sent[0].includes("INFOM</b> Infomaniak Network SA (SIX, Zwitserland) · nieuw"));
  assert.match(sent[0], /vandaag<\/b>|\(vandaag\) Capital Markets Day/);

  // Zaterdag: geen overzicht.
  sent.length = 0;
  await runDay({ store, net }, "2026-10-10", "08:35", "08:50", sent);
  assert.equal(sent.length, 0);
  assert.equal(Number(store.settings.get(SENT_KEY)), at("2026-10-07", "08:40"));
});

test("ochtendoverzicht: Telegram faalt helemaal → volgende minuut opnieuw; deels verstuurd → niet dubbel", async () => {
  const { net } = morningNet();
  const store = new MemoryStore();
  for (let i = 0; i < 80; i++) {
    await store.recordEvents(
      [{ id: `e${i}`, filter: ["emissie", "overname", "fda", "index", "splitsing", "notering", "handelsstop", "insolventie"][i % 8], symbol: `XETR:E${i}`, name: `Bedrijf ${i}`, title: `Bedrijf ${i} kondigt een kapitaalverhoging aan ${"x".repeat(80)}`, url: "", lang: "de", published: at("2026-10-06", "07:00") }],
      at("2026-10-06", "07:00"),
    );
  }
  let calls = 0;
  let failFrom = 0;
  const send = async () => {
    calls++;
    if (calls >= failFrom) throw new Error("Telegram plat");
  };
  failFrom = 1;
  await assert.rejects(runMorningStep({ store, config, fetcher: net.fetch, now: at("2026-10-06", "08:40") }, send));
  assert.equal(store.settings.get("ochtend_datum"), undefined, "nog niet verstuurd");
  calls = 0;
  failFrom = 2;
  const result = await runMorningStep({ store, config, fetcher: net.fetch, now: at("2026-10-06", "08:41") }, send);
  assert.equal(result.sent, 1);
  assert.match(result.errors[0], /deels verstuurd/);
  assert.equal(store.settings.get("ochtend_datum"), "2026-10-06");
  const again = await runMorningStep({ store, config, fetcher: net.fetch, now: at("2026-10-06", "08:42") }, send);
  assert.equal(again.sent, undefined);
});

test("ochtendoverzicht uit: niets versturen, wel berichten lezen", async () => {
  const { net } = morningNet();
  const store = new MemoryStore();
  await store.setSetting("ochtend_uit", "1");
  const sent: string[] = [];
  await runDay({ store, net }, "2026-10-06", "08:38", "08:45", sent);
  assert.equal(sent.length, 0);
});

test("berichten lezen: datums naar de agenda, dividendbedrag bij het bericht, één keer", async () => {
  const net = new FakeNet();
  const store = new MemoryStore();
  const NOW = at("2026-10-06", "10:00");
  await store.recordEvents(
    [
      { id: "x1", filter: "overname", symbol: "EURONEXT:ALERS", name: "Eurobio", title: "Eurobio : dépôt de l'OPR", url: "", lang: "fr", published: NOW },
      { id: "x1", filter: "notering", symbol: "EURONEXT:ALERS", name: "Eurobio", title: "Eurobio : dépôt de l'OPR", url: "", lang: "fr", published: NOW },
      { id: "x2", filter: "dividend", symbol: "XETR:PFSE", name: "Pfisterer", title: "Pfisterer: Sonderdividende", url: "", lang: "de", published: NOW },
      { id: "x3", filter: "emissie", symbol: "XETR:MUX", name: "Mutares", title: "Mutares: Kapitalerhöhung platziert", url: "", lang: "de", published: NOW },
    ],
    NOW,
  );
  net.stories.set("x1", { astDescription: { type: "root", children: [{ type: "p", children: ["L'offre sera ouverte du 8 octobre au 21 octobre 2026 inclus. Retrait obligatoire le 23 octobre 2026."] }] } });
  net.stories.set("x2", { astDescription: JSON.stringify({ type: "root", children: [{ type: "p", children: ["Der Vorstand schlägt eine Sonderdividende von 4,00 EUR je Aktie vor. Ex-Tag ist der 15.10.2026."] }] }) });
  const checked = await checkStories({ store, config, fetcher: net.fetch, now: NOW }, "2026-10-06");
  assert.equal(checked, 3, "ook emissies worden gelezen (is het een claimemissie?)");
  assert.deepEqual(
    store.agenda.map((a) => [a.kind, a.date, a.label]),
    [
      ["overname", "2026-10-21", "einde periode"],
      ["overname", "2026-10-23", "laatste handelsdag / delisting"],
      ["dividend", "2026-10-15", "ex-dividend"],
    ],
  );
  assert.deepEqual(JSON.parse(store.events.find((e) => e.id === "x2")!.extra), { amount: 4, currency: "EUR" });
  assert.equal(await checkStories({ store, config, fetcher: net.fetch, now: NOW + 60 }, "2026-10-06"), 0);
});

test("lange overzichten worden in berichten onder de Telegram-grens gesplitst", () => {
  const block = (n: number) => Array.from({ length: 60 }, (_, i) => `• regel ${n}.${i} ${"x".repeat(50)}`);
  const messages = pack([["kop"], block(1), block(2), Array.from({ length: 200 }, (_, i) => `• ${i} ${"y".repeat(40)}`)]);
  assert.ok(messages.length >= 3);
  for (const message of messages) assert.ok(message.length <= 4000, `${message.length}`);
  assert.match(messages.at(-1)!, /ingekort/);
});

// ---------------------------------------------------------------- minimale marktwaarde

test("waardering uit kop of bericht, omgerekend naar euro", () => {
  const mln = (text: string) => {
    const value = parseValuation(text);
    return value === undefined ? undefined : Math.round(value / 1e6);
  };
  assert.equal(mln("Prisjakt AB (publ) Plans First North IPO at SEK 31, Valued at SEK 675M"), 59);
  assert.equal(mln("Infomaniak IPO valued at CHF 1.2 billion"), 1260);
  assert.equal(mln("Börsengang mit einer Bewertung von rund 1,2 Mrd. Euro"), 1200);
  assert.equal(mln("Introduction en bourse : la société est valorisée à 250 millions d'euros"), 250);
  assert.equal(mln("Float would give it a market capitalisation of £50m"), 57);
  assert.equal(mln("Abenojar Tungsten SA Intents To Undertake An Initial Public Offering On LSE"), undefined);
  assert.equal(mln("IPO to raise up to SEK 500 million"), undefined, "opbrengst is geen waardering");
});

test("screener: minimale marktwaarde per filter, ook buiten de selectie en bij beursgangen", async () => {
  const net = new FakeNet();
  const store = new MemoryStore();
  const sent: string[] = [];
  for (const filter of ["emissie", "overname", "ipo", "notering"]) await store.addFilterWords(filter, DEFAULT_FILTERS[filter]);
  await store.putUniverse(
    [
      { symbol: "XETR:KLEIN", name: "Klein AG", capEur: 6e6, country: "Germany" },
      { symbol: "XETR:MIDDEN", name: "Midden AG", capEur: 60e6, country: "Germany" },
      { symbol: "XETR:GROOT", name: "Groot AG", capEur: 300e6, country: "Germany" },
    ],
    "b",
  );
  // Buiten de selectie: de marktwaarde komt van de screener.
  net.scannerHandler = (body) =>
    body.symbols
      ? body.symbols.tickers.flatMap((t: string) => (t === "OSL:SMALL" ? [{ s: t, d: [40e6] }] : t === "OSL:BIG" ? [{ s: t, d: [2e9] }] : []))
      : null;
  const NOW = 1_791_000_000;
  const run = (now: number) => checkScreener({ store, fetcher: net.fetch, config, now, send: async (html) => void sent.push(html) });
  await run(NOW);
  const sym = (s: string) => ({ relatedSymbols: [{ symbol: s }] });
  net.feeds.set("en", {
    items: [
      item("e1", "Klein AG: capital increase placed", NOW + 1, sym("XETR:KLEIN")),
      item("e2", "Midden AG: capital increase placed", NOW + 2, sym("XETR:MIDDEN")),
      item("o1", "Midden AG receives recommended cash offer", NOW + 3, sym("XETR:MIDDEN")),
      item("o2", "Groot AG receives recommended cash offer", NOW + 4, sym("XETR:GROOT")),
      item("i1", "Prisjakt AB (publ) Plans First North IPO at SEK 31, Valued at SEK 675M", NOW + 5, { relatedSymbols: [] }),
      item("i2", "REG - Abenojar Tungsten SA - Intention to Float", NOW + 6, { relatedSymbols: [] }),
      item("n1", "Small ASA plans secondary listing in Stockholm", NOW + 7, sym("OSL:SMALL")),
      item("n2", "Big ASA plans secondary listing in Stockholm", NOW + 8, sym("OSL:BIG")),
    ],
  });
  await run(NOW + 60);
  const recorded = store.events.map((e) => `${e.id}:${e.filter}`).sort();
  assert.deepEqual(recorded, ["e2:emissie", "i2:ipo", "n2:notering", "o2:overname"]);
  assert.deepEqual(JSON.parse(store.events.find((e) => e.id === "n2")!.extra), { capEur: 2e9 });
  // Direct: emissie (Midden, €60 mln) en de IPO met onbekende grootte; overname en notering staan in het overzicht.
  assert.equal(sent.length, 2);
  assert.match(sent.join("\n"), /Midden AG: capital increase/);
  assert.match(sent.join("\n"), /Abenojar/);
  assert.equal(net.scannerBodies.filter((b) => b.symbols).length, 1, "één vraag voor alle marktwaarden");
});

test("ochtendoverzicht: te kleine bedrijven vallen af, ook als de waardering pas in het bericht staat", async () => {
  const net = new FakeNet();
  const store = new MemoryStore();
  const NOW = at("2026-10-06", "07:00");
  const ev = (id: string, filter: string, title: string, extra?: string) => ({
    id, filter, symbol: "", name: "", title, url: "", lang: "en", published: NOW, extra,
  });
  await store.recordEvents(
    [
      ev("a", "overname", "Klein bod", JSON.stringify({ capEur: 50e6 })),
      ev("b", "overname", "Groot bod", JSON.stringify({ capEur: 500e6 })),
      ev("c", "ipo", "Nordic Startup plans IPO on First North"),
      ev("d", "ipo", "Unknown Co intention to float"),
      ev("e", "emissie", "Mini plc placing", JSON.stringify({ capEur: 4e6 })),
    ],
    NOW,
  );
  net.stories.set("c", { astDescription: { type: "root", children: [{ type: "p", children: ["The offering values the company at SEK 400 million. First day of trading is expected on 22 October 2026."] }] } });
  await checkStories({ store, config, fetcher: net.fetch, now: NOW }, "2026-10-06", 5);
  assert.deepEqual(JSON.parse(store.events.find((e) => e.id === "c")!.extra), { capEur: 34800000 });
  assert.equal(store.agenda.length, 0, "geen agendapunt voor een te kleine beursgang");
  const sent: string[] = [];
  await runMorningStep({ store, config, fetcher: net.fetch, now: at("2026-10-06", "08:40") }, async (html) => void sent.push(html));
  const text = sent.join("\n");
  assert.ok(text.includes("Groot bod") && text.includes("Unknown Co"));
  for (const small of ["Klein bod", "Nordic Startup", "Mini plc"]) assert.ok(!text.includes(small), small);
});

// ---------------------------------------------------------------- minder rommel (oktober 2026)

test("Euronext Growth Oslo uit de download van Euronext", () => {
  const csv = [
    'Name;ISIN;Symbol;Market;Currency;"Open Price"',
    '"European Equities"',
    '"20 Oct 2026"',
    '"3030 DVD";NO0010955917;DVD;"Euronext Growth Oslo";NOK;2.50',
    '"AASEN SPAREBANK";NO0010672181;AASB;"Euronext Growth Oslo";NOK;136.04',
    '"EQUINOR";NO0010096985;EQNR;"Oslo Børs";NOK;250',
  ].join("\n");
  assert.deepEqual(parseGrowthCsv(csv), { symbols: ["OSL:DVD", "OSL:AASB"], isins: ["NO0010955917", "NO0010672181"] });
});

test("screener: emissies en claimemissies over heel Europa, maar niet uit Londen of van Euronext Growth Oslo", async () => {
  const net = new FakeNet();
  const store = new MemoryStore();
  const sent: string[] = [];
  for (const filter of ["emissie", "claim", "overname"]) await store.addFilterWords(filter, DEFAULT_FILTERS[filter]);
  await store.setSetting("growth_oslo", JSON.stringify({ date: "2026-10-20", symbols: ["OSL:GROW"], isins: [] }));
  const caps: Record<string, number> = { "MIL:UNI": 23e9, "LSE:BIG": 3e9, "OSL:GROW": 50e6, "LSE:SPX": 4e9 };
  net.scannerHandler = (body) =>
    body.symbols ? body.symbols.tickers.flatMap((t: string) => (caps[t] ? [{ s: t, d: [caps[t]] }] : [])) : null;
  const NOW = 1_791_000_000;
  const run = (now: number) => checkScreener({ store, fetcher: net.fetch, config, now, send: async (html) => void sent.push(html) });
  await run(NOW);
  const sym = (s: string) => ({ relatedSymbols: [{ symbol: s }] });
  net.feeds.set("en", {
    items: [
      item("u1", "Unipol, aumento di capitale in opzione da 2,5 miliardi", NOW + 1, sym("MIL:UNI")),
      item("l1", "REG - Big plc - Placing to raise £50 million", NOW + 2, sym("LSE:BIG")),
      item("l2", "REG - Small Mining plc - Placing and Subscription", NOW + 3, { relatedSymbols: [] }),
      item("g1", "Growth AS: private placement completed", NOW + 4, sym("OSL:GROW")),
      item("g2", "Volare Shipping Starts Trading On Euronext Growth Oslo after private placement", NOW + 5, { relatedSymbols: [] }),
      item("s1", "REG - Spectris PLC - Recommended Cash Acquisition of Spectris plc by Advent", NOW + 6, sym("LSE:SPX")),
    ],
  });
  await run(NOW + 60);
  assert.deepEqual(
    store.events.map((e) => `${e.id}:${e.filter}`).sort(),
    ["s1:overname", "u1:claim", "u1:emissie"],
    "Unipol (€23 mld) en het Britse bod wel; Londense placings en Growth Oslo niet",
  );
  assert.equal(sent.length, 1, "de claimemissie meldt direct; overnames staan alleen in het overzicht");
  assert.match(sent[0], /Filter: (claim, emissie|emissie, claim)/);
});
