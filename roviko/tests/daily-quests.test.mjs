import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { build } from 'esbuild';
fs.mkdirSync('.test-runtime', { recursive: true });
await build({ stdin: { contents: "export * from './lib/daily-quests';export {DAILY_MODES} from './lib/daily-loop';export {messages} from './i18n/messages';", resolveDir: process.cwd() }, outfile: '.test-runtime/daily-quests.mjs', bundle: true, format: 'esm', platform: 'node', logLevel: 'error' });
const { questsFor, allQuestsDone, addCrown, DAILY_MODES, messages } = await import('../.test-runtime/daily-quests.mjs');
const none = { completedModes: [], mysteryPlayed: false, duelDone: false };

test('three quests per UTC day, the same for everyone, rotating over the daily games', () => {
  const a = questsFor('2026-09-24', none), b = questsFor('2026-09-24', none);
  assert.deepEqual(a, b);
  assert.equal(a.length, 3);
  assert.deepEqual(a.map(q => q.kind), ['mode', a[1].kind, 'games']);
  const modes = Array.from({ length: 5 }, (_, i) => questsFor(`2026-09-${String(20 + i).padStart(2, '0')}`, none)[0].mode);
  assert.deepEqual([...modes].sort(), [...DAILY_MODES].sort());
  const bonuses = new Set(Array.from({ length: 4 }, (_, i) => questsFor(`2026-10-0${i + 1}`, none)[1].kind));
  assert.deepEqual([...bonuses].sort(), ['duel', 'mystery']);
});

test('progress comes from finished daily games and local bonus play, capped at the target', () => {
  const date = '2026-09-24', target = questsFor(date, none)[0].mode;
  const partial = questsFor(date, { completedModes: [target, 'not-a-daily-mode'], mysteryPlayed: false, duelDone: false });
  assert.equal(partial[0].done, true);
  assert.equal(partial[2].progress, 1);
  assert.equal(allQuestsDone(partial), false);
  const all = questsFor(date, { completedModes: [...DAILY_MODES], mysteryPlayed: true, duelDone: true });
  assert.equal(all[2].progress, 3);
  assert.equal(allQuestsDone(all), true);
  const otherGames = DAILY_MODES.filter(m => m !== target).slice(0, 3);
  assert.equal(questsFor(date, { completedModes: otherGames, mysteryPlayed: true, duelDone: true })[0].done, false);
});

test('a crown is added once per day, sorted and bounded', () => {
  assert.deepEqual(addCrown(['2026-09-22'], '2026-09-24'), ['2026-09-22', '2026-09-24']);
  assert.deepEqual(addCrown(['2026-09-24'], '2026-09-24'), ['2026-09-24']);
  assert.deepEqual(addCrown(['2026-09-25'], '2026-09-24'), ['2026-09-24', '2026-09-25']);
  const many = Array.from({ length: 450 }, (_, i) => new Date(Date.UTC(2025, 0, 1) + i * 86400000).toISOString().slice(0, 10));
  assert.equal(addCrown(many, '2027-01-01').length, 400);
});

test('quest and reminder texts exist in English, Dutch and Spanish with the same placeholders', () => {
  for (const key of ['questsTitle', 'questsIntro', 'questPlayMode', 'questPlayN', 'questMystery', 'questDuel', 'questChest', 'questCrownWon', 'questCrowns', 'questNew', 'reviewCardTitle', 'reviewCardCopy', 'reviewCardCta', ...[1, 2, 3, 4, 5, 6, 7].map(d => 'reminder' + d)]) {
    const tokens = s => (s.match(/\{\w+\}/g) ?? []).sort();
    for (const locale of ['en', 'nl', 'es']) assert.ok(messages[locale][key], `${locale} ${key}`);
    assert.deepEqual(tokens(messages.nl[key]), tokens(messages.en[key]), key);
    assert.deepEqual(tokens(messages.es[key]), tokens(messages.en[key]), key);
  }
});
