import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { build } from 'esbuild';
fs.mkdirSync('.test-runtime', { recursive: true });
await build({ stdin: { contents: "export * from './lib/daily-loop'; export { ACHIEVEMENTS } from './lib/achievements';", resolveDir: process.cwd() }, outfile: '.test-runtime/daily-loop.mjs', bundle: true, format: 'esm', platform: 'node' });
const { SHUFFLE_FROM, SHAPE_FROM, CROSSROADS_FROM, ROADTRIP_FROM, DAILY_MODES, DAY_MODES, MOSAIC_DAY_MODES, ALL_DAY_MODES, dailyModesFor, dayModesFor, streakMilestone, msUntilReset, formatCountdown, nextDailyMode, completedDailies, streakAtRisk, nearestAchievement, mysteryOfTheDay, ACHIEVEMENTS } = await import('../.test-runtime/daily-loop.mjs');
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
  // The Daily Detour comes first, then the five daily games with Shape Shift second (1.41; World Duel before), Size Shuffle fourth.
  assert.equal(nextDailyMode([]), 'daily');
  assert.equal(nextDailyMode([{ mode: 'daily', completed: true }]), 'rank');
  assert.equal(nextDailyMode([{ mode: 'daily', completed: true }, { mode: 'rank', completed: true }]), 'shape');
  assert.equal(nextDailyMode([{ mode: 'rank', completed: true }, { mode: 'order' }]), 'order');
  // 1.56: Daily Road Trip is the fifth daily game (from ROADTRIP_FROM; Crossroads and the daily Clue Trail before).
  const all = ['daily', 'rank', 'shape', 'compare', 'order', 'roadtrip'].map(mode => ({ mode, completed: true }));
  assert.equal(nextDailyMode(all), null);
  assert.equal(completedDailies(all), 6);
  assert.equal(completedDailies(all, ['rank', 'shape', 'compare', 'order', 'roadtrip']), 5);
  // A day before the switch keeps Country Mosaic; its lineup is passed in.
  const before = dayModesFor('2026-10-07');
  assert.equal(nextDailyMode([{ mode: 'rank', completed: true }, { mode: 'mosaic' }], before), 'mosaic');
  const old = ['daily', 'rank', 'duel', 'compare', 'mosaic', 'trail'].map(mode => ({ mode, completed: true }));
  assert.equal(nextDailyMode(old, before), null);
  assert.equal(completedDailies(old), 6, 'old days count their Mosaic');
});

test('the daily lineup is chosen per UTC date: Mosaic before SHUFFLE_FROM, Size Shuffle from it, always six games', () => {
  assert.match(SHUFFLE_FROM, /^\d{4}-\d{2}-\d{2}$/);
  const day = d => new Date(Date.parse(SHUFFLE_FROM + 'T00:00:00Z') + d * 86400000).toISOString().slice(0, 10);
  assert.deepEqual([...dailyModesFor(day(-1))], ['rank', 'duel', 'compare', 'mosaic', 'trail']);
  assert.deepEqual([...dailyModesFor(day(0))], ['rank', 'duel', 'compare', 'order', 'trail']);
  assert.deepEqual([...dayModesFor(day(1))], ['daily', 'rank', 'duel', 'compare', 'order', 'trail']);
  // 1.41: Shape Shift takes World Duel's place from SHAPE_FROM on.
  const at = d => new Date(Date.parse(SHAPE_FROM + 'T00:00:00Z') + d * 86400000).toISOString().slice(0, 10);
  assert.ok(SHAPE_FROM > SHUFFLE_FROM);
  assert.deepEqual([...dailyModesFor(at(-1))], ['rank', 'duel', 'compare', 'order', 'trail']);
  assert.deepEqual([...dayModesFor(at(0))], ['daily', 'rank', 'shape', 'compare', 'order', 'trail']);
  // 1.55: Daily Crossroads takes the daily Clue Trail's place from CROSSROADS_FROM on.
  const xr = d => new Date(Date.parse(CROSSROADS_FROM + 'T00:00:00Z') + d * 86400000).toISOString().slice(0, 10);
  assert.ok(CROSSROADS_FROM > SHAPE_FROM);
  assert.deepEqual([...dailyModesFor(xr(-1))], ['rank', 'shape', 'compare', 'order', 'trail']);
  // 1.56: Daily Road Trip went live on CROSSROADS_FROM itself, so no date has the Crossroads lineup; that day's
  // Crossroads points stay (server/competition.ts reads them back as 'crossroads' by their session).
  const rt = d => new Date(Date.parse(ROADTRIP_FROM + 'T00:00:00Z') + d * 86400000).toISOString().slice(0, 10);
  assert.ok(ROADTRIP_FROM >= CROSSROADS_FROM);
  assert.deepEqual([...dailyModesFor(rt(-1))], ROADTRIP_FROM === CROSSROADS_FROM ? ['rank', 'shape', 'compare', 'order', 'trail'] : ['rank', 'shape', 'compare', 'order', 'crossroads']);
  assert.deepEqual([...dayModesFor(rt(0))], ['daily', ...DAILY_MODES]);
  assert.deepEqual([...DAILY_MODES], ['rank', 'shape', 'compare', 'order', 'roadtrip']);
  assert.ok(ALL_DAY_MODES.includes('crossroads'), 'old Crossroads results still have a name');
  for (const d of [0, 1, 30, 400]) { assert.equal(dayModesFor(rt(d)).length, 6); assert.ok(!dayModesFor(rt(d)).includes('crossroads') && !dayModesFor(rt(d)).includes('trail')); }
  for (const d of [-1, 0, 30]) { assert.equal(dayModesFor(at(d)).length, 6); assert.ok(!(dayModesFor(at(d)).includes('duel') && dayModesFor(at(d)).includes('shape'))); }
  for (const d of [-30, -1, 0, 1, 400]) { assert.equal(dayModesFor(day(d)).length, 6); assert.ok(!(dayModesFor(day(d)).includes('mosaic') && dayModesFor(day(d)).includes('order'))); }
  assert.equal(dayModesFor(day(-1))[0], 'daily');
  for (const m of [...MOSAIC_DAY_MODES, ...DAY_MODES]) assert.ok(ALL_DAY_MODES.includes(m));
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
