// 1.24: the daily Size Shuffle replaces Country Mosaic as daily game (from SHUFFLE_FROM). Generation, scoring,
// what the server sends before an answer, and the per-date lineup.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { build } from 'esbuild';
fs.mkdirSync('.test-runtime', { recursive: true });
await build({ stdin: { contents: "export * from './lib/puzzles/size-shuffle'; export * from './lib/daily-scoring'; export { COUNTRIES } from './lib/game-engine/questions'; export { evaluateLearning, learningSolution } from './lib/game-engine/learning'; export { soloView } from './server/solo'; export { ledgerMode } from './server/competition'; export { SHUFFLE_FROM, dayModesFor } from './lib/daily-loop';", resolveDir: process.cwd() }, outfile: '.test-runtime/daily-shuffle.mjs', bundle: true, format: 'esm', platform: 'node', logLevel: 'error', external: ['cloudflare:*'] });
const e = await import('../.test-runtime/daily-shuffle.mjs');
const area = id => e.COUNTRIES.find(c => c.id === id).area;

test('the same five rounds of four countries for a seed, largest first, never a country twice', () => {
  const a = e.generateSizeShuffle('daily:2026-10-09:daily-order:competitive-v1:x'), b = e.generateSizeShuffle('daily:2026-10-09:daily-order:competitive-v1:x');
  assert.deepEqual(a, b);
  assert.notDeepEqual(a.map(q => q.correct), e.generateSizeShuffle('daily:2026-10-10:daily-order:competitive-v1:x').map(q => q.correct));
  assert.equal(a.length, 5);
  const seen = new Set();
  for (const q of a) {
    assert.equal(q.mode, 'order'); assert.equal(q.options.length, 4); assert.equal(q.correct.length, 4);
    assert.deepEqual([...q.options.map(o => o.id)].sort(), [...q.correct].sort());
    assert.notDeepEqual(q.options.map(o => o.id), q.correct, 'the shown order is never the answer');
    for (let i = 1; i < 4; i++) assert.ok(area(q.correct[i - 1]) > area(q.correct[i]), 'strictly largest first');
    for (const id of q.correct) { assert.ok(!seen.has(id), 'no repeats'); seen.add(id); }
  }
});

test('rounds go from easy to hard: sizes far apart first, close together last', () => {
  let first = 0, last = 0;
  for (let i = 0; i < 60; i++) {
    const g = e.generateSizeShuffle('seed-' + i), gap = q => Math.min(...q.correct.slice(1).map((id, j) => area(q.correct[j]) / area(id)));
    first += gap(g[0]); last += gap(g[4]);
    assert.ok(gap(g[0]) >= 1.8, 'round 1 is easy');
  }
  assert.ok(first / 60 > (last / 60) * 1.8);
});

test('partial credit: 50 points per country in its right place, 200 per round, 1,000 for the day', () => {
  const c = ['A', 'B', 'C', 'D'];
  assert.equal(e.placesRight(c, c), 4);
  assert.equal(e.placesRight(['B', 'A', 'C', 'D'], c), 2);
  assert.equal(e.placesRight(['B', 'C', 'D', 'A'], c), 0);
  assert.equal(e.placesRight(null, c), 0);
  assert.equal(e.dailyRoundPoints('order', { value: c, correctAnswer: c }), 200);
  assert.equal(e.dailyRoundPoints('order', { value: ['B', 'A', 'C', 'D'], correctAnswer: c }), 100);
  assert.equal(e.dailyRoundPoints('order', { value: ['A', 'C', 'B', 'D'], correctAnswer: c, points: 900 }), 100, 'only the saved list counts');
  const answers = [c, c, c, c, c].map(v => ({ value: v, correctAnswer: c }));
  assert.equal(e.dailyScore({ competition: { version: 1, mode: 'order' }, answers }), 1000);
  answers[0] = { value: ['B', 'A', 'C', 'D'], correctAnswer: c }; answers[1] = { value: ['B', 'C', 'D', 'A'], correctAnswer: c };
  assert.equal(e.dailyScore({ competition: { version: 1, mode: 'order' }, answers }), 700);
  // Server-side evaluation of the real question: two swapped rows still score half the round.
  const q = e.generateSizeShuffle('eval')[0], sol = e.learningSolution(q);
  const swapped = [q.correct[1], q.correct[0], q.correct[2], q.correct[3]], r = e.evaluateLearning(sol, swapped, 0);
  assert.equal(r.correct, false);
  assert.equal(e.dailyRoundPoints('order', { ...r, value: swapped }), 100);
  assert.equal(e.DAILY_TOTAL_MAX, 6000, 'still six games of 1,000');
});

test('before an answer the browser never gets the order, the areas or a solution', () => {
  const questions = e.generateSizeShuffle('leak');
  const s = { id: 'x', competition: { version: 1, mode: 'order' }, questions, settings: { mode: 'order', count: 5, timer: 0, difficulty: 'medium', region: 'World' }, round: 0, startAt: 0, score: 0, streak: 0, bestStreak: 0, answers: [], phase: 'question', daily: '2026-10-09', xp: 0, personalBest: 0 };
  const view = e.soloView(s), text = JSON.stringify(view);
  assert.equal(view.feedback, null);
  assert.equal(view.question.solution, undefined);
  assert.equal(view.question.correct, undefined);
  assert.ok(!/km²|correctAnswer|answerLabel|"fact"/.test(text), 'nothing that gives the order away');
  assert.equal(view.question.dailyPoints, true);
  assert.equal(view.question.options.length, 4);
});

test('the ledger keeps the six allowed modes: the Size Shuffle uses the fourth-game slot by date', () => {
  assert.equal(e.ledgerMode('order'), 'mosaic');
  assert.equal(e.ledgerMode('trail'), 'trail');
  const day = d => new Date(Date.parse(e.SHUFFLE_FROM + 'T00:00:00Z') + d * 86400000).toISOString().slice(0, 10);
  assert.ok(e.dayModesFor(day(0)).includes('order') && !e.dayModesFor(day(-1)).includes('order'));
});
