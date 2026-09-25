import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { build } from 'esbuild';
fs.mkdirSync('.test-runtime', { recursive: true });
await build({ stdin: { contents: "export * from './lib/puzzles/rank-medals';", resolveDir: process.cwd() }, outfile: '.test-runtime/rank-medals.mjs', bundle: true, format: 'esm', platform: 'node', logLevel: 'error' });
const { choicePlace, medalFor, medalSummary } = await import('../.test-runtime/rank-medals.mjs');

const options = [{ id: 'a', position: .30 }, { id: 'b', position: .05 }, { id: 'c', position: .60 }, { id: 'd', position: .30 }];

test('the strongest subject is place 1 and ties share a place', () => {
  assert.equal(choicePlace(options, 'b'), 1);
  assert.equal(choicePlace(options, 'a'), 2);
  assert.equal(choicePlace(options, 'd'), 2);
  assert.equal(choicePlace(options, 'c'), 4);
});

test('medals and the summary follow the places', () => {
  assert.deepEqual([1, 2, 3, 4].map(medalFor), ['🥇', '🥈', '🥉', '⚪']);
  assert.deepEqual(medalSummary([1, 1, 2, 4, 3, 1]), { 1: 3, 2: 1, 3: 1, 4: 1 });
});
