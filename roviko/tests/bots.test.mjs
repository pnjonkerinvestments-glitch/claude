import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { build } from 'esbuild';
fs.mkdirSync('.test-runtime', { recursive: true });
await build({ stdin: { contents: "export * from './lib/game-engine/bots';export {generateQuestions,evaluate} from './lib/game-engine/questions';export {random} from './lib/game-engine/scoring';export {validAnswer} from './lib/game-engine/validate-answer';", resolveDir: process.cwd() }, outfile: '.test-runtime/bots.mjs', bundle: true, format: 'esm', platform: 'node', logLevel: 'error' });
const { botAnswer, botDelay, BOT_LEVELS, BOT_SKILL, generateQuestions, evaluate, random, validAnswer } = await import('../.test-runtime/bots.mjs');
const base = { count: 20, timer: 15, difficulty: 'medium', region: 'World', typed: false };

test('computer answers are always valid for every question type', () => {
  for (const mode of ['flags', 'capitals', 'pinpoint', 'borders', 'order', 'mixed']) {
    const questions = generateQuestions({ ...base, mode }, 'bots:' + mode);
    for (const level of BOT_LEVELS) for (const q of questions) assert.ok(validAnswer(q, botAnswer(q, level, random(q.id + level))), mode + ' ' + level);
  }
});

test('harder computers answer correctly more often and faster, always before the deadline', () => {
  const questions = generateQuestions({ ...base, mode: 'mixed', count: 20 }, 'bots:skill');
  const rate = level => { let right = 0, n = 0; for (let k = 0; k < 15; k++) for (const q of questions) { right += +evaluate(q, botAnswer(q, level, random(q.id + level + k)), 3000, 15000, 0).correct; n++; } return right / n; };
  const [easy, medium, hard] = BOT_LEVELS.map(rate);
  assert.ok(easy < medium && medium < hard, `${easy} < ${medium} < ${hard}`);
  assert.ok(Math.abs(hard - BOT_SKILL.hard.accuracy) < 0.12, 'hard is close to its accuracy');
  const avg = level => { let t = 0; for (let k = 0; k < 200; k++) t += botDelay(level, random('d' + level + k), 15000); return t / 200; };
  assert.ok(avg('hard') < avg('medium') && avg('medium') < avg('easy'));
  for (let k = 0; k < 200; k++) assert.ok(botDelay('easy', random('t' + k), 5000) <= 4100);
  assert.equal(botDelay('hard', random('same'), 0), botDelay('hard', random('same'), 0));
});
