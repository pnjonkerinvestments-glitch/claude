import assert from "node:assert/strict";
import { test } from "node:test";
import { rejectReason, select } from "../src/scanner.ts";
import { config, mover } from "./helpers.ts";

test("een echte stijger komt erdoor", () => {
  assert.equal(rejectReason(mover(), config()), null);
});

test("filters wijzen af met een reden", () => {
  const cfg = config();
  assert.match(rejectReason(mover({ changePct: 49.9 }), cfg)!, /stijging/);
  assert.match(rejectReason(mover({ price: 0.8 }), cfg)!, /koers/);
  assert.match(rejectReason(mover({ volume: 10_000 }), cfg)!, /volume/);
  assert.match(rejectReason(mover({ price: 1.5, volume: 60_000 }), cfg)!, /omzet/);
  assert.match(rejectReason(mover({ exchange: "OTC" }), cfg)!, /beurs/);
  assert.match(rejectReason(mover({ instrumentType: "fund" }), cfg)!, /type/);
  assert.match(rejectReason(mover({ price: 30 }), config({ maxPrice: 20 }))!, /koers/);
});

test("lege beurslijst laat OTC toe", () => {
  assert.equal(rejectReason(mover({ exchange: "OTC" }), config({ exchanges: [] })), null);
});

test("select sorteert en kapt af", () => {
  const hits = select(
    [mover({ symbol: "A", changePct: 60 }), mover({ symbol: "B", changePct: 200 }), mover({ symbol: "C", changePct: 10 })],
    config({ maxResults: 1 }),
  );
  assert.deepEqual(hits.map((m) => m.symbol), ["B"]);
});
