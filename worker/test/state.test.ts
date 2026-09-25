import assert from "node:assert/strict";
import { test } from "node:test";
import { AlertState } from "../src/state.ts";
import { MemoryKv, mover } from "./helpers.ts";

const DAY = "2026-09-14";

test("eerste melding is nieuw", async () => {
  const state = await AlertState.load(new MemoryKv(), DAY);
  assert.equal(state.isNew(mover(), 25), true);
});

test("zelfde ticker wordt niet herhaald, een veel grotere stijging wel", async () => {
  const state = await AlertState.load(new MemoryKv(), DAY);
  state.record(mover({ changePct: 80 }));
  assert.equal(state.isNew(mover({ changePct: 85 }), 25), false);
  assert.equal(state.isNew(mover({ changePct: 105 }), 25), true);
});

test("hoogste stijging telt", async () => {
  const state = await AlertState.load(new MemoryKv(), DAY);
  state.record(mover({ changePct: 120 }));
  state.record(mover({ changePct: 60 }));
  assert.equal(state.isNew(mover({ changePct: 100 }), 25), false);
});

test("blijft bewaard tussen runs en vervalt na een week", async () => {
  const kv = new MemoryKv();
  const first = await AlertState.load(kv, DAY);
  first.record(mover());
  await first.save();
  assert.deepEqual(kv.puts, [{ key: `alerts:${DAY}`, ttl: 7 * 24 * 3600 }]);

  const second = await AlertState.load(kv, DAY);
  assert.equal(second.isNew(mover(), 25), false);
  const nextDay = await AlertState.load(kv, "2026-09-15");
  assert.equal(nextDay.isNew(mover(), 25), true);
});

test("kapotte status houdt de alert niet tegen", async () => {
  const kv = new MemoryKv();
  kv.data.set(`alerts:${DAY}`, "{niet eens json");
  const warnings: string[] = [];
  const state = await AlertState.load(kv, DAY, (w) => warnings.push(w));
  assert.equal(state.isNew(mover(), 25), true);
  assert.equal(warnings.length, 1);
});

test("filterNew houdt alleen ongemelde over", async () => {
  const state = await AlertState.load(new MemoryKv(), DAY);
  state.record(mover({ symbol: "AAA" }));
  const fresh = state.filterNew([mover({ symbol: "AAA" }), mover({ symbol: "BBB" })], 25);
  assert.deepEqual(fresh.map((m) => m.symbol), ["BBB"]);
});
