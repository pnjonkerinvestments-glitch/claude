import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanSummary, headlinesUrl, newsFlowUrl, parseNewsResponse, parseSymbolSearch } from "../src/tradingview.ts";

test("leest het huidige news-flow-formaat", () => {
  const items = parseNewsResponse({
    items: [
      {
        id: "tag:dpa-afx,2026:newsml_A1",
        title: "innoscripta: Vorwürfe nicht bestätigt",
        published: 1790963160,
        urgency: 2,
        provider: { id: "dpa_afx", name: "dpa-AFX", logo_id: "dpa" },
        storyPath: "/news/dpa_afx:A1/",
        link: "https://www.dpa-afx.de/a1",
        relatedSymbols: [{ symbol: "XETR:1INN", logoid: "x" }, { symbol: "TRADEGATE:1INN" }],
      },
      { id: "zonder-titel" },
      "rommel",
    ],
  });
  assert.equal(items.length, 1);
  assert.deepEqual(items[0], {
    id: "tag:dpa-afx,2026:newsml_A1",
    title: "innoscripta: Vorwürfe nicht bestätigt",
    published: 1790963160,
    provider: "dpa-AFX",
    link: "https://www.dpa-afx.de/a1",
    storyUrl: "https://www.tradingview.com/news/dpa_afx:A1/",
    urgency: 2,
    symbols: ["XETR:1INN", "TRADEGATE:1INN"],
  });
});

test("leest ook het oude headlines-formaat (kale array, provider als tekst, ms-tijd)", () => {
  const [item] = parseNewsResponse([{ id: 42, title: "Kop", published: 1790963160000, provider: "reuters" }]);
  assert.equal(item.id, "42");
  assert.equal(item.published, 1790963160);
  assert.equal(item.provider, "reuters");
  assert.equal(item.link, undefined);
});

test("onbekende vorm geeft een lege lijst", () => {
  assert.deepEqual(parseNewsResponse(null), []);
  assert.deepEqual(parseNewsResponse({ error: "x" }), []);
});

test("urls bevatten taal en symbool", () => {
  const url = new URL(newsFlowUrl("XETR:1INN", "de"));
  assert.deepEqual(url.searchParams.getAll("filter"), ["lang:de", "symbol:XETR:1INN"]);
  assert.equal(new URL(headlinesUrl("XETR:1INN", "")).searchParams.get("lang"), null);
});

test("symbolen zoeken: prefix gaat voor beurs, tags eruit", () => {
  const matches = parseSymbolSearch({
    symbols: [
      { symbol: "<em>1INN</em>", description: "innoscripta SE", type: "stock", exchange: "Xetra", prefix: "XETR", country: "DE" },
      { symbol: "1INN", description: "innoscripta SE", type: "stock", exchange: "TRADEGATE" },
      { description: "zonder symbool" },
    ],
  });
  assert.deepEqual(
    matches.map((m) => m.symbol),
    ["XETR:1INN", "TRADEGATE:1INN"],
  );
  assert.equal(matches[0].name, "innoscripta SE");
});

test("samenvatting: kop en EQS-voorloop eraf, te kort is niets", () => {
  const title = "innoscripta SE: Update zu den Ermittlungen";
  assert.equal(
    cleanSummary(`innoscripta SE/ Schlagwort(e): Sonstiges innoscripta SE: Update zu den Ermittlungen – Der Geschäftsbetrieb läuft uneingeschränkt weiter.`, title),
    "Der Geschäftsbetrieb läuft uneingeschränkt weiter.",
  );
  assert.equal(cleanSummary("innoscripta SE XETR:1INN:", "innoscripta SE (1INN) Searched in Tax Probe"), undefined);
  assert.equal(cleanSummary("x".repeat(500), "kop")!.length, 350);
});
