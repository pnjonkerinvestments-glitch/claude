import assert from "node:assert/strict";
import { test } from "node:test";
import { ConfigError } from "../src/config.ts";
import type { Provider } from "../src/providers/index.ts";
import { runScan } from "../src/run.ts";
import { FakeSmtp, MAIL_ENV, MemoryKv, mover } from "./helpers.ts";

const IN_WINDOW = new Date("2026-09-14T11:00:00Z"); // maandag 07:00 ET
const OUTSIDE = new Date("2026-09-14T16:00:00Z"); // maandag 12:00 ET

function setup(movers = [mover()], env: Record<string, string> = MAIL_ENV) {
  const kv = new MemoryKv();
  const smtp = new FakeSmtp();
  let calls = 0;
  const provider: Provider = async () => {
    calls++;
    return movers;
  };
  const run = (opts = {}) =>
    runScan({ env, kv, connect: smtp.connect, log: () => {} }, { now: IN_WINDOW, provider, ...opts });
  return { kv, smtp, run, providerCalls: () => calls };
}

const mailsSent = (smtp: FakeSmtp) => smtp.received.filter((l) => l === "DATA").length;

test("mailt bij een treffer", async () => {
  const { smtp, run } = setup();
  const result = await run();
  assert.equal(result.status, "sent");
  assert.deepEqual(result.sent, ["ABCD"]);
  assert.equal(mailsSent(smtp), 1);
});

test("geen mail als niets de drempel haalt", async () => {
  const { smtp, kv, run } = setup([mover({ changePct: 20 })]);
  assert.equal((await run()).status, "no-hits");
  assert.equal(mailsSent(smtp), 0);
  assert.equal(kv.puts.length, 0);
});

test("buiten het venster niets doen, tenzij ignoreWindow", async () => {
  const { run, providerCalls } = setup();
  assert.equal((await run({ now: OUTSIDE })).status, "outside-window");
  assert.equal(providerCalls(), 0);
  assert.equal((await run({ now: OUTSIDE, ignoreWindow: true })).status, "sent");
});

test("zelfde ticker één keer per dag, veel grotere stijging opnieuw", async () => {
  const movers = [mover({ changePct: 80 })];
  const { smtp, run } = setup(movers);
  await run();
  assert.equal((await run()).status, "already-sent");
  movers[0] = mover({ changePct: 110 });
  assert.equal((await run()).status, "sent");
  assert.equal(mailsSent(smtp), 2);
});

test("drempel is te overschrijven", async () => {
  const { run } = setup([mover({ changePct: 35 })]);
  assert.equal((await run()).status, "no-hits");
  assert.equal((await run({ threshold: 30 })).status, "sent");
});

test("dry-run heeft geen mailinstellingen nodig en onthoudt niets", async () => {
  const { kv, smtp, run } = setup([mover()], {});
  const result = await run({ dryRun: true });
  assert.equal(result.status, "sent");
  assert.ok(result.logs.some((l) => l.startsWith("[DRY RUN]")));
  assert.equal(smtp.connections.length, 0);
  assert.equal(kv.puts.length, 0);
});

test("ontbrekende mailinstellingen en onbekende provider falen hard", async () => {
  await assert.rejects(setup([mover()], {}).run(), (e: Error) => e instanceof ConfigError && /SMTP_HOST/.test(e.message));
  await assert.rejects(
    setup([mover()], { ...MAIL_ENV, PROVIDER: "bestaatniet" }).run(),
    (e: Error) => e instanceof ConfigError,
  );
});

test("self-test stuurt een voorbeeld zonder databron", async () => {
  const { smtp, run, providerCalls } = setup();
  assert.equal((await run({ selfTest: true, now: OUTSIDE })).status, "self-test");
  assert.equal(providerCalls(), 0);
  assert.equal(mailsSent(smtp), 1);
});

test("mislukte mail wordt niet als verstuurd onthouden", async () => {
  const { smtp, kv, run } = setup();
  smtp.failOn = { prefix: "MAIL FROM", reply: "550 nee" };
  await assert.rejects(run(), /550/);
  assert.equal(kv.puts.length, 0);
});
