import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { build } from 'esbuild';
fs.mkdirSync('.test-runtime', { recursive: true });
await build({ stdin: { contents: "export * from './lib/bonus'; export { generateQuestions } from './lib/game-engine/questions';", resolveDir: process.cwd() }, outfile: '.test-runtime/bonus.mjs', bundle: true, format: 'esm', platform: 'node' });
const { BONUS_MODES, BONUS_ROUNDS, nextBonusMode, bonusStateOf, generateQuestions } = await import('../.test-runtime/bonus.mjs');
const settings = mode => ({ mode, count: BONUS_ROUNDS, timer: 0, difficulty: 'medium', region: 'World', typed: false });
const seed = (date, mode) => 'daily:' + date + ':bonus:' + mode + ':test';

test('bonus tour: the six classic games, easiest first, resuming a started game before new ones', () => {
  assert.deepEqual([...BONUS_MODES], ['flags', 'capitals', 'pinpoint', 'borders', 'order', 'trail']);
  assert.equal(nextBonusMode([]), 'flags');
  assert.equal(nextBonusMode([{ mode: 'flags', completed: true }]), 'capitals');
  assert.equal(nextBonusMode([{ mode: 'flags', completed: true }, { mode: 'pinpoint' }]), 'pinpoint');
  assert.equal(nextBonusMode(BONUS_MODES.map(mode => ({ mode, completed: true }))), null);
  assert.equal(bonusStateOf(undefined, 'order'), 'new');
});

test('bonus tour: the same ten questions for everyone on a day, other countries the next day', () => {
  for (const mode of BONUS_MODES) {
    const a = generateQuestions(settings(mode), seed('2026-09-25', mode), [], []);
    const again = generateQuestions(settings(mode), seed('2026-09-25', mode), [], []);
    const next = generateQuestions(settings(mode), seed('2026-09-26', mode), [], []);
    assert.equal(a.length, BONUS_ROUNDS, mode);
    assert.deepEqual(a.map(q => q.countryId), again.map(q => q.countryId), mode);
    assert.notDeepEqual(a.map(q => q.countryId), next.map(q => q.countryId), mode);
  }
});
