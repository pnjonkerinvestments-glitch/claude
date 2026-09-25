import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import fs from 'node:fs';
fs.mkdirSync('.test-runtime',{recursive:true});
await build({stdin:{contents:"export * from './lib/daily-scoring';export * from './lib/game-engine/questions';",resolveDir:process.cwd()},bundle:true,format:'esm',platform:'node',outfile:'.test-runtime/competition.mjs'});
const {dailyScore,dailyRoundPoints,trailPoints,generateQuestions,COUNTRIES}=await import('../.test-runtime/competition.mjs');
test('all five official games have the same 1000-point ceiling and no time bonus',()=>{
 assert.deepEqual([1,2,3,4].map(n=>trailPoints(true,n)),[200,150,100,50]);assert.equal(trailPoints(false,1),0);
 for(const mode of ['daily','trail','compare','rank','mosaic']){
  const count={daily:5,trail:5,compare:10,rank:6,mosaic:4}[mode];
  const answers=Array.from({length:count},(_,i)=>({correct:true,cluesUsed:1,countryId:'c'+i,mode:'flags',responseTime:10000}));
  assert.equal(dailyScore({competition:{version:1,mode},answers}),1000);
  assert.equal(dailyScore({answers}),0);
  assert.equal(dailyScore({competition:{version:1,mode},answers:answers.map(a=>({...a,responseTime:0}))}),1000);
 }
 assert.equal(dailyRoundPoints('daily',{mode:'pinpoint',correct:false,mapPoints:500}),100);
 assert.equal(dailyScore({competition:{version:1,mode:'rank'},answers:Array(5).fill({correct:true})}),833);
});
test('every Clue Trail has useful continent choices, a capital third, a flag last and no option flags',()=>{
 for(const region of ['World','Europe','Africa','Asia','North America','South America','Oceania'])for(const difficulty of ['easy','medium','hard']){
  const questions=generateQuestions({mode:'trail',count:20,timer:0,difficulty,region},region+difficulty);
  for(const q of questions){const c=COUNTRIES.find(c=>c.id===q.countryId);assert.equal(q.options.length,4);assert.equal(new Set(q.options.map(o=>o.id)).size,4);assert.ok(q.options.every(o=>!o.flag));assert.equal(q.options.filter(o=>COUNTRIES.find(c=>c.id===o.id).region!==c.region).length,2);assert.match(q.clues[2].en,/capital/);assert.match(q.clues[3].en,/flag/);assert.ok(!q.clues[2].en.includes(c.name));}
 }
});

test('Daily Detour: twenty questions share 1,000 points; older five-stop editions keep 200 per stop', () => {
 assert.equal(dailyRoundPoints('daily',{mode:'flags',correct:true},20),50);
 assert.equal(dailyRoundPoints('daily',{mode:'pinpoint',correct:false,mapPoints:500},20),25);
 assert.equal(dailyRoundPoints('daily',{mode:'flags',correct:true}),200);
 const answers=Array.from({length:20},()=>({mode:'capitals',correct:true}));
 assert.equal(dailyScore({competition:{version:1,mode:'daily'},answers,questions:answers}),1000);
 assert.equal(dailyScore({competition:{version:1,mode:'daily'},answers:answers.slice(0,5),questions:answers.slice(0,5)}),1000);
});
