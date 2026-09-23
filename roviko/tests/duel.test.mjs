import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { build } from 'esbuild';
fs.mkdirSync('.test-runtime', { recursive: true });
await build({ stdin: { contents: "export * from './lib/puzzles/duel';", resolveDir: process.cwd() }, outfile: '.test-runtime/duel.mjs', bundle: true, format: 'esm', platform: 'node', logLevel: 'error' });
const { generateDuel, perfectRoutes, duelWon, DUEL_ROUNDS, DUEL_MARGIN } = await import('../.test-runtime/duel.mjs');

const dates = Array.from({ length: 21 }, (_, d) => new Date(Date.parse('2026-10-01') + d * 86400000).toISOString().slice(0, 10));

test('the same date always produces the same duel', () => {
  assert.deepEqual(generateDuel('roviko:duel:v1:' + dates[0]), generateDuel('roviko:duel:v1:' + dates[0]));
});

test('every duel has five distinct cards, five subjects and exactly one perfect route', () => {
  for (const date of dates) {
    const b = generateDuel('roviko:duel:v1:' + date);
    assert.equal(b.hand.length, DUEL_ROUNDS);
    assert.equal(new Set([...b.hand.map(h => h.id), ...b.rounds.map(r => r.roviko.id)]).size, DUEL_ROUNDS * 2, 'no country appears twice');
    assert.equal(new Set(b.rounds.map(r => r.category.id)).size, DUEL_ROUNDS);
    const beats = b.rounds.map(r => b.hand.map(h => duelWon(r, h.id)));
    const routes = perfectRoutes(beats);
    assert.equal(routes.length, 1, date + ' must have one perfect route');
    assert.deepEqual(routes[0].map(i => b.hand[i].id), b.solution);
    assert.ok(beats.filter(row => row.filter(Boolean).length >= 2).length >= 3, 'most rounds offer a real choice');
  }
});

test('every possible pairing is clearly decided, never by a hair', () => {
  for (const date of dates) {
    const b = generateDuel('roviko:duel:v1:' + date);
    for (const r of b.rounds) for (const h of b.hand) {
      const a = r.hand[h.id].value, o = r.roviko.value;
      assert.ok(Math.abs(a - o) / Math.max(Math.abs(a), Math.abs(o)) >= DUEL_MARGIN, `${date} ${r.category.id} ${h.id}`);
      assert.ok(r.roviko.source && r.hand[h.id].source, 'every value keeps its source');
    }
  }
});
