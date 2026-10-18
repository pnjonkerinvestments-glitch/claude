import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import fs from 'node:fs';
const bundle=await build({stdin:{contents:"export { livesLeft, COMPARE_LIVES } from './lib/puzzles/model';",resolveDir:process.cwd()},bundle:true,format:'esm',platform:'node',write:false,loader:{'.json':'json'}});
fs.mkdirSync('.test-runtime',{recursive:true});fs.writeFileSync('.test-runtime/lives.mjs',bundle.outputFiles[0].text);const e=await import('../.test-runtime/lives.mjs');

const run=(...c)=>c.map(correct=>({correct}));
test('Side by Side lives (1.42): three lives, old days keep one, other games have none',()=>{
 assert.equal(e.COMPARE_LIVES,3);
 assert.equal(e.livesLeft({lives:3,answers:run(true,false,true)}),2);
 assert.equal(e.livesLeft({lives:3,answers:run(false,false,false)}),0);
 assert.equal(e.livesLeft({lives:3,answers:run(false,false,false,false)}),0,'never below zero');
 assert.equal(e.livesLeft({suddenDeath:true,answers:run(true,false)}),0,'a day stored under the one-mistake rule keeps it');
 assert.equal(e.livesLeft({suddenDeath:true,answers:run(true)}),1);
 assert.equal(e.livesLeft({answers:run(false)}),undefined,'no lives: the run never ends on mistakes');
});
