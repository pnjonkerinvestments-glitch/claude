// Multiplayer Size Shuffle gives partial points for rows in the right place; the Daily Detour stays all-or-nothing.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import fs from 'node:fs';
const bundle=await build({stdin:{contents:"export * from './lib/game-engine/questions'; export * from './lib/game-engine/scoring'; export * from './lib/game-engine/learning'; export * from './lib/daily-scoring';",resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'node'});
fs.mkdirSync('.test-runtime',{recursive:true});fs.writeFileSync('.test-runtime/order-partial.mjs',bundle.outputFiles[0].text);const e=await import('../.test-runtime/order-partial.mjs');
const orderQuestion=()=>e.generateQuestions({mode:'order',count:1,timer:15,difficulty:'medium',region:'World'},'order-partial-seed')[0];
// Swap two pairs: two of four rows right; swap one pair: two right; rotate everything: none right.
const twoRight=c=>[c[1],c[0],c[2],c[3]], noneRight=c=>[c[1],c[2],c[3],c[0]];
test('orderPlacement counts rows in their right place',()=>{
  assert.equal(e.orderPlacement(['a','b','c','d'],['a','b','c','d']),4);
  assert.equal(e.orderPlacement(['b','a','c','d'],['a','b','c','d']),2);
  assert.equal(e.orderPlacement(['b','c','d','a'],['a','b','c','d']),0);
  assert.equal(e.orderPlacement(null,['a','b']),0);
  assert.equal(e.orderPlacement('a',['a']),0);
});
test('partialOrderPoints is proportional and never includes the streak bonus',()=>{
  assert.equal(e.partialOrderPoints(2,4,0,10000),750);
  assert.equal(e.partialOrderPoints(1,4,0,10000),375);
  assert.equal(e.partialOrderPoints(2,4,5000,10000),625);
  assert.equal(e.partialOrderPoints(2,4,0,0),500);
  assert.equal(e.partialOrderPoints(0,4,0,10000),0);
  assert.equal(e.partialOrderPoints(4,0,0,10000),0);
});
test('multiplayer evaluate: full points when right, a share when partly right, 0 when none right',()=>{
  const q=orderQuestion(), c=q.correct;
  assert.equal(c.length,4);
  const full=e.evaluate(q,[...c],0,15000,3);
  assert.equal(full.correct,true);assert.equal(full.points,e.scoreAnswer(true,0,15000,4));assert.equal(full.streak,4);assert.equal(full.orderRight,4);
  const half=e.evaluate(q,twoRight(c),0,15000,3);
  assert.equal(half.correct,false,'a partly right list is not correct');assert.equal(half.streak,0,'the streak follows correct');
  assert.equal(half.orderRight,2);assert.equal(half.points,750,'2 of 4 right: half of 1,000 + 500 speed');
  assert.ok(half.points<full.points);
  const late=e.evaluate(q,twoRight(c),15000,15000,3);assert.equal(late.points,500);
  const none=e.evaluate(q,noneRight(c),0,15000,3);assert.equal(none.points,0);assert.equal(none.orderRight,0);
  const missing=e.evaluate(q,null,15000,15000,3);assert.equal(missing.points,0);assert.equal(missing.correct,false);
});
test('other multiplayer modes keep their scoring',()=>{
  const q=e.generateQuestions({mode:'flags',count:1,timer:15,difficulty:'medium',region:'World'},'order-partial-flags')[0];
  const wrong=q.options.find(o=>o.id!==q.correct).id;
  assert.equal(e.evaluate(q,wrong,0,15000,2).points,0);
  assert.equal(e.evaluate(q,q.correct,0,15000,2).points,e.scoreAnswer(true,0,15000,3));
  assert.equal(e.evaluate(q,q.correct,0,15000,2).orderRight,undefined);
});
test('Daily Detour points for Size Shuffle stay all-or-nothing (50 per fully right question)',()=>{
  const q=orderQuestion(), c=q.correct, sol=e.learningSolution(q);
  const right=e.evaluateLearning(sol,[...c],0), half=e.evaluateLearning(sol,twoRight(c),0);
  assert.equal(right.correct,true);assert.equal(half.correct,false);
  assert.equal(half.points,0);
  assert.equal(e.dailyRoundPoints('daily',{...right,mode:'order'},20),50);
  assert.equal(e.dailyRoundPoints('daily',{...half,mode:'order'},20),0);
  assert.equal(e.dailyRoundPoints('daily',{...half,mode:'order',points:750},20),0,'even a stray multiplayer points field never reaches the daily ledger');
});
test('no country starts in its right place, so confirming an untouched list earns nothing',()=>{
  for(const mode of ['order','mixed'])for(const difficulty of ['easy','medium','hard'])for(let k=0;k<20;k++){
    for(const q of e.generateQuestions({mode,count:5,timer:15,difficulty,region:'World'},'start-'+mode+difficulty+k).filter(q=>q.mode==='order')){
      const start=q.options.map(o=>o.id);
      assert.equal(e.orderPlacement(start,q.correct),0,q.id);
      assert.deepEqual([...start].sort(),[...q.correct].sort());
      assert.equal(e.evaluate(q,start,0,15000,0).points,0);
    }
  }
  const rng=e.random('cycle');for(let k=0;k<200;k++){const d=e.derangedStart(['a','b','c','d'],rng);assert.equal(e.orderPlacement(d,['a','b','c','d']),0);}
});
