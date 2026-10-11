import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import fs from 'node:fs';
const bundle=await build({stdin:{contents:"export * from './lib/learn'; export {COUNTRIES} from './lib/game-engine/questions';",resolveDir:process.cwd()},bundle:true,format:'esm',platform:'node',write:false,loader:{'.json':'json'}});
fs.mkdirSync('.test-runtime',{recursive:true});fs.writeFileSync('.test-runtime/learn.mjs',bundle.outputFiles[0].text);const L=await import('../.test-runtime/learn.mjs');

test('the Europe flag route covers all 45 European countries once, in lessons of four to six (1.38)',()=>{
  const route=L.ROUTES[0],ids=L.routeCountries(route);
  const europe=L.COUNTRIES.filter(c=>c.region==='Europe').map(c=>c.id).sort();
  assert.deepEqual([...ids].sort(),europe);assert.equal(new Set(ids).size,ids.length);
  for(const l of route.lessons)assert.ok(l.countries.length>=4&&l.countries.length<=6,l.id);
  for(const [id,list] of Object.entries(L.LOOKALIKES)){assert.ok(europe.includes(id),id);for(const x of list){assert.ok(europe.includes(x),x);assert.notEqual(x,id);}}
});

test('medals: a lesson gives bronze, reviews on later days give silver and gold, a miss steps back (1.38)',()=>{
  const d='2026-10-11';let c=L.applyAnswer(undefined,true,d,1,true);
  assert.equal(c.lvl,1);assert.equal(c.due,'2026-10-12');
  const again=L.applyAnswer(c,true,d,2,false);assert.equal(again.lvl,1,'the same day does not count twice');
  c=L.applyAnswer(c,true,'2026-10-12',3,false);assert.equal(c.lvl,2);assert.equal(c.due,'2026-10-15');
  c=L.applyAnswer(c,true,'2026-10-15',4,false);assert.equal(c.lvl,3);assert.equal(c.due,'2026-10-22');
  c=L.applyAnswer(c,true,'2026-10-22',5,false);assert.equal(c.lvl,3);assert.equal(c.due,'2026-11-05');
  c=L.applyAnswer(c,false,'2026-11-05',6,false);assert.equal(c.lvl,2);assert.equal(c.due,'2026-11-06');
  const miss=L.applyAnswer(undefined,false,d,7,true);assert.equal(miss.lvl,0);assert.equal(miss.due,d,'a miss in the lesson test is due today');
  const bronzeMiss=L.applyAnswer({t:1,lvl:1,last:'2026-10-10',due:d},false,d,8,false);assert.equal(bronzeMiss.lvl,1,'bronze never drops away');
});

test('route state: lessons open one by one, due cards are listed, the border check opens at the end (1.38)',()=>{
  const route=L.ROUTES[0],d='2026-10-11';let p={};
  let s=L.routeState(route,p,d);assert.equal(s.next,0);assert.equal(s.learned,0);assert.equal(s.bossOpen,false);
  p={'lesson:flags-europe-1':{t:1,day:d,best:6,of:6},[L.itemKey('flags','NLD')]:{t:1,lvl:1,due:'2026-10-12',last:d},[L.itemKey('flags','BEL')]:{t:1,lvl:0,due:d,last:d}};
  s=L.routeState(route,p,d);assert.equal(s.next,1);assert.equal(s.learned,1);assert.deepEqual(s.due,['BEL']);
  for(const l of route.lessons)p['lesson:'+l.id]={t:1,day:d};
  assert.equal(L.routeState(route,p,d).bossOpen,true);
});

test('merging keeps the newest card per key and drops broken ones (1.38)',()=>{
  const a={'item:flags:NLD':{t:5,lvl:2,due:'2026-10-14'},'lesson:flags-europe-1':{t:1,day:'2026-10-11'}};
  const b={'item:flags:NLD':{t:3,lvl:3},'item:flags:BEL':{t:4,lvl:1},'bad key!':{t:9},'item:flags:DEU':{t:2,due:'tomorrow'},'item:flags:FRA':{lvl:1}};
  const m=L.mergeProgress(a,b);assert.equal(m['item:flags:NLD'].lvl,2);assert.equal(m['item:flags:BEL'].lvl,1);
  assert.equal(m['bad key!'],undefined);assert.equal(m['item:flags:DEU'],undefined);assert.equal(m['item:flags:FRA'],undefined);
});

test('questions: practice asks every country both ways, tests have four distinct options with the answer (1.38)',()=>{
  const route=L.ROUTES[0],pool=L.routeCountries(route),rand=L.rng(42);
  for(const lesson of route.lessons){
    const pq=L.practiceQuestions(lesson,rand);assert.equal(pq.length,lesson.countries.length*2);
    for(const q of pq){assert.ok(q.options.includes(q.id));assert.equal(new Set(q.options).size,q.options.length);assert.ok(q.options.every(o=>lesson.countries.includes(o)));}
    const tq=L.testQuestions(lesson.countries,pool,rand);assert.deepEqual(tq.map(q=>q.id).sort(),[...lesson.countries].sort());
    for(const q of tq){assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4);assert.ok(q.options.includes(q.id));}
  }
  const boss=L.bossQuestions(route,{},rand);assert.equal(boss.length,L.BOSS_SIZE);assert.equal(new Set(boss.map(q=>q.id)).size,L.BOSS_SIZE);
  const nld=L.testQuestions(['NLD'],pool,L.rng(7))[0];assert.ok(nld.options.some(o=>L.LOOKALIKES.NLD.includes(o)),'a look-alike is among the options');
});
