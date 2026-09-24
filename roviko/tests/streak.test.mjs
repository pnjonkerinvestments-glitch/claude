import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { build } from 'esbuild';
fs.mkdirSync('.test-runtime', { recursive: true });
await build({ stdin: { contents: "export * from './lib/streak';", resolveDir: process.cwd() }, outfile: '.test-runtime/streak.mjs', bundle: true, format: 'esm', platform: 'node', logLevel: 'error' });
const { streakWithFreezes, FREEZE_START } = await import('../.test-runtime/streak.mjs');
const day = (offset, from = '2026-10-01') => new Date(Date.parse(from + 'T00:00:00Z') + offset * 86400000).toISOString().slice(0, 10);
const range = (a, b, from) => Array.from({ length: b - a + 1 }, (_, i) => day(a + i, from));

test('without gaps the streak counts consecutive days ending today or yesterday', () => {
  assert.equal(streakWithFreezes([], day(0)).streak, 0);
  assert.equal(streakWithFreezes(range(0, 4), day(4)).streak, 5);
  assert.equal(streakWithFreezes(range(0, 4), day(5)).streak, 5, 'today not played yet is not a miss');
  assert.equal(streakWithFreezes(range(0, 2), day(5)).streak, 0, 'no freeze earned yet: two missed days break it');
});

test('seven play days earn a freeze that bridges one missed day without adding to the streak', () => {
  const s = streakWithFreezes(range(0, 6), day(7));
  assert.deepEqual([s.streak, s.freezes, s.nextFreezeIn], [7, 1, 7]);
  const bridged = streakWithFreezes([...range(0, 6), day(8)], day(8));
  assert.equal(bridged.streak, 8);
  assert.equal(bridged.freezes, 0);
  assert.deepEqual(bridged.frozenDates, [day(7)]);
  const waiting = streakWithFreezes(range(0, 6), day(8));
  assert.equal(waiting.streak, 7, 'yesterday missed, freeze protects the streak until today');
  assert.equal(waiting.freezes, 0);
});

test('stock is capped at two, and more missed days than freezes break the streak', () => {
  const s = streakWithFreezes(range(0, 27), day(28));
  assert.equal(s.freezes, 2);
  assert.equal(s.nextFreezeIn, 0);
  assert.equal(streakWithFreezes([...range(0, 27), day(30)], day(30)).streak, 29, 'two missed days use two freezes');
  const broken = streakWithFreezes([...range(0, 27), day(31)], day(31));
  assert.deepEqual([broken.streak, broken.freezes], [1, 0]);
});

test('freezes are not earned or used before the launch date, so older streaks never change', () => {
  const before = range(-20, -8, FREEZE_START);
  const s = streakWithFreezes([...before, day(-6, FREEZE_START)], day(-6, FREEZE_START));
  assert.equal(s.streak, 1);
  assert.equal(streakWithFreezes(before, day(-7, FREEZE_START)).freezes, 0);
});

test('duplicates, future dates and malformed values are ignored', () => {
  assert.equal(streakWithFreezes([day(0), day(0), day(1), 'bad', day(9)], day(1)).streak, 2);
});
