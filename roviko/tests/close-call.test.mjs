import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { build } from 'esbuild';
fs.mkdirSync('.test-runtime', { recursive: true });
await build({ stdin: { contents: "export * from './lib/puzzles/close-call';", resolveDir: process.cwd() }, outfile: '.test-runtime/close-call.mjs', bundle: true, format: 'esm', platform: 'node', logLevel: 'error' });
const x = await import('../.test-runtime/close-call.mjs');
const date = i => new Date(Date.parse('2026-11-05T00:00:00Z') + i * 86400000).toISOString().slice(0, 10);

test('Daily Close Call: the next 365 days all have three fair rounds', () => {
  for (let i = 0; i < 365; i++) {
    const d = date(i), rounds = x.closeCallFor(d);
    assert.deepEqual(x.closeCallFor(d), rounds, 'the same date always gives the same rounds');
    assert.equal(rounds.length, 3);
    assert.deepEqual(rounds.map(r => r.topic).sort(), ['area', 'economy', 'population'], d + ': every subject once');
    const all = rounds.flatMap(r => r.deck);
    assert.equal(new Set(all).size, all.length, d + ': no country twice in a day');
    for (const r of rounds) {
      assert.deepEqual(x.roundProblems(r), [], d + ' ' + r.topic);
      assert.ok(x.TARGETS[r.topic].includes(r.target), 'a round target');
      assert.equal(r.deck.length, 10, 'ten countries to take or skip');
      const values = r.deck.map(id => x.valueOf(r.topic, id));
      for (const v of values) assert.ok(v >= r.target * .03 && v <= r.target * .40, d + ': middle-sized countries only');
      assert.ok(values.reduce((a, b) => a + b) > r.target * 1.3, d + ': taking everything goes over, so you must skip');
      assert.ok(x.bestReach(r) >= r.target * .98, d + ': the Close Call bonus is always reachable');
    }
  }
});

test('Daily Close Call points: straight like the other daily games, a bonus within 2%, 0 over the target', () => {
  assert.deepEqual(x.ROUND_MAX, [333, 333, 334]);
  assert.equal(x.ROUND_MAX.reduce((a, b) => a + b), 1000);
  const p = share => x.roundPoints(0, share * 100, 100, false);
  assert.equal(p(1), 333); assert.equal(x.roundPoints(2, 100, 100, false), 334);
  assert.equal(p(.99), 330); assert.equal(p(.98), 327, '98%: the Close Call bonus');
  assert.equal(p(.97), 291, 'just outside the bonus');
  assert.equal(p(.95), 285); assert.equal(p(.9), 270); assert.equal(p(.8), 240); assert.equal(p(.5), 150);
  assert.equal(x.roundPoints(1, 101, 100, false), 0, 'over the target is never points');
  assert.equal(x.roundPoints(1, 90, 100, true), 0, 'a bust scores 0');
  assert.ok(x.hasBonus(98, 100) && !x.hasBonus(97, 100) && !x.hasBonus(101, 100));
});
