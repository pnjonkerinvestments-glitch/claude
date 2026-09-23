import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { build } from 'esbuild';
fs.mkdirSync('.test-runtime', { recursive: true });
await build({ stdin: { contents: "export * from './lib/daily-loop'; export { ACHIEVEMENTS } from './lib/achievements';", resolveDir: process.cwd() }, outfile: '.test-runtime/daily-loop.mjs', bundle: true, format: 'esm', platform: 'node' });
const { streakMilestone, msUntilReset, formatCountdown, nextDailyMode, completedDailies, streakAtRisk, nearestAchievement, mysteryOfTheDay, ACHIEVEMENTS } = await import('../.test-runtime/daily-loop.mjs');
const facts = JSON.parse(fs.readFileSync('lib/data/mosaic-facts.json', 'utf8')).facts;
const countries = JSON.parse(fs.readFileSync('lib/data/countries.json', 'utf8'));

test('streak milestones point at the next target with progress since the previous one', () => {
  assert.deepEqual(streakMilestone(0), { target: 3, remaining: 3, progress: 0 });
  assert.equal(streakMilestone(3).target, 7);
  assert.equal(streakMilestone(5).remaining, 2);
  assert.equal(streakMilestone(5).progress, 0.5);
  assert.equal(streakMilestone(365).target, 400);
});

test('countdown reaches the next 00:00 UTC and formats as hh:mm:ss', () => {
  const now = Date.parse('2026-09-23T22:30:15Z');
  assert.equal(msUntilReset(now), (1 * 3600 + 29 * 60 + 45) * 1000);
  assert.equal(formatCountdown(msUntilReset(now)), '01:29:45');
  assert.equal(formatCountdown(-5), '00:00:00');
});

test('next daily resumes a started game first, then the first unplayed one, and none when all are done', () => {
  assert.equal(nextDailyMode([]), 'rank');
  assert.equal(nextDailyMode([{ mode: 'rank', completed: true }]), 'daily');
  assert.equal(nextDailyMode([{ mode: 'rank', completed: true }, { mode: 'mosaic' }]), 'mosaic');
  const all = ['rank', 'daily', 'compare', 'mosaic'].map(mode => ({ mode, completed: true }));
  assert.equal(nextDailyMode(all), null);
  assert.equal(completedDailies(all), 4);
});

test('a streak is only at risk when it exists and nothing is finished today', () => {
  assert.equal(streakAtRisk(0, 0), false);
  assert.equal(streakAtRisk(4, 0), true);
  assert.equal(streakAtRisk(4, 1), false);
});

test('the badge nudge picks the closest locked solo achievement and never a multiplayer one', () => {
  const badge = nearestAchievement(ACHIEVEMENTS, { games: 8, correct: 20, bestStreak: 2, dailyCount: 1, dailyStreak: 1, achievements: ['first', 'daily1', 'correct10'] });
  assert.equal(badge.id, 'games10');
  assert.equal(badge.remaining, 2);
  assert.ok(!['wins', 'multiGames', 'xp'].includes(badge.metric));
});

test('the mystery country is identical for a date, has four distinct options including the answer, and cycles through every fact', () => {
  const a = mysteryOfTheDay('2026-09-23', facts, countries), b = mysteryOfTheDay('2026-09-23', facts, countries);
  assert.equal(a.fact.id, b.fact.id);
  assert.deepEqual(a.options.map(o => o.id), b.options.map(o => o.id));
  assert.equal(new Set(a.options.map(o => o.id)).size, 4);
  assert.ok(a.options.some(o => o.id === a.answer.id));
  assert.equal(a.answer.id, a.fact.countryId);
  const seen = new Set();
  for (let d = 0; d < facts.length; d++) seen.add(mysteryOfTheDay(new Date(Date.parse('2026-01-01') + d * 86400000).toISOString().slice(0, 10), facts, countries).fact.id);
  assert.equal(seen.size, facts.length);
});
