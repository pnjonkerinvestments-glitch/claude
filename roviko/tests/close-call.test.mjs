import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { build } from 'esbuild';
fs.mkdirSync('.test-runtime', { recursive: true });
await build({ stdin: { contents: "export * from './lib/puzzles/close-call';", resolveDir: process.cwd() }, outfile: '.test-runtime/close-call.mjs', bundle: true, format: 'esm', platform: 'node', logLevel: 'error' });
const x = await import('../.test-runtime/close-call.mjs');
const date = i => new Date(Date.parse('2026-11-05T00:00:00Z') + i * 86400000).toISOString().slice(0, 10);

test('Daily Close Call: the next 365 days all have three fair rounds', () => {
  const safe = new Set();
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
      for (const id of r.deck) { const v = x.valueOf(r.topic, id); assert.ok(v >= r.target * .04 && v <= r.target * .45, d + ' ' + id + ' is middle-sized'); }
      safe.add(x.safeDraws(r));
    }
  }
  assert.deepEqual([...safe].sort(), [3, 4, 5, 6], 'rounds of every length');
});

test('Daily Close Call points: up to 333 per round (1,000 a day), 0 for a bust', () => {
  assert.deepEqual(x.ROUND_MAX, [333, 333, 334]);
  assert.equal(x.ROUND_MAX.reduce((a, b) => a + b), 1000);
  assert.equal(x.roundPoints(0, 150, 150, false), 333);
  assert.equal(x.roundPoints(2, 150, 150, false), 334);
  assert.equal(x.roundPoints(0, 75, 150, false), 167);
  assert.equal(x.roundPoints(1, 160, 150, true), 0, 'a bust scores 0');
  assert.equal(x.roundPoints(1, 0, 150, false), 0);
});
