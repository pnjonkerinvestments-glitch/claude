import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import fs from 'node:fs';
const bundle=await build({stdin:{contents:"export {travelXp,levelOf,SOLO_XP_DAY_CAP} from './server/stats';",resolveDir:process.cwd()},bundle:true,format:'esm',platform:'node',write:false,loader:{'.json':'json'}});
fs.mkdirSync('.test-runtime',{recursive:true});fs.writeFileSync('.test-runtime/travel-xp.mjs',bundle.outputFiles[0].text);const e=await import('../.test-runtime/travel-xp.mjs');

test('daily players level up too, and practice XP is capped per day (1.36)',()=>{
  assert.equal(e.travelXp(6000,[]),600,'a full day of daily games: 600 XP');
  assert.equal(e.travelXp(0,[5,100]),50+e.SOLO_XP_DAY_CAP,'10 per correct answer, at most 300 a day');
  assert.deepEqual(e.levelOf(0),{level:1,levelProgress:0,xpToNext:100});
  assert.equal(e.levelOf(600).level,3);assert.equal(e.levelOf(600).xpToNext,300);
  assert.equal(e.levelOf(30*900).level,17,'a month of full days');
});
