import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import fs from 'node:fs';
const bundle=await build({stdin:{contents:"export * from './lib/learn'; export {COUNTRIES} from './lib/game-engine/questions';",resolveDir:process.cwd()},bundle:true,format:'esm',platform:'node',write:false,loader:{'.json':'json'}});
fs.mkdirSync('.test-runtime',{recursive:true});fs.writeFileSync('.test-runtime/learn.mjs',bundle.outputFiles[0].text);const L=await import('../.test-runtime/learn.mjs');

test('18 routes: three topics on six continents, every country once per topic, lessons of four to six (1.38)',()=>{
  assert.equal(L.ROUTES.length,18);
  for(const topic of L.TOPICS){
    const all=L.ROUTES.filter(r=>r.topic===topic).flatMap(r=>L.routeCountries(r));
    assert.equal(all.length,195,topic);assert.equal(new Set(all).size,195,topic);
  }
  const region=new Map(L.COUNTRIES.map(c=>[c.id,c.region]));
  for(const r of L.ROUTES){
    for(const l of r.lessons){assert.ok(l.countries.length>=4&&l.countries.length<=6,l.id);for(const id of l.countries)assert.equal(region.get(id),r.region,id+' in '+r.id);}
  }
  for(const [id,list] of Object.entries(L.LOOKALIKES)){assert.ok(region.has(id),id);for(const x of list){assert.ok(region.has(x),x);assert.notEqual(x,id);}}
});

test('a midway test after every three lessons covers those lessons, never right before the border check (1.38)',()=>{
  const eu=L.routeFor('flags','europe');
  assert.deepEqual(eu.steps.map(s=>s.kind==='exam'?'x':'l').join(''),'lllxlllxlll');
  const x1=eu.steps[3];assert.equal(x1.id,'flags-europe-x1');assert.deepEqual(x1.countries,[...eu.lessons[0].countries,...eu.lessons[1].countries,...eu.lessons[2].countries]);
  assert.equal(L.routeFor('map','south-america').steps.filter(s=>s.kind==='exam').length,0,'three lessons: straight to the border check');
  assert.equal(L.routeFor('capitals','africa').steps.filter(s=>s.kind==='exam').length,3);
  assert.equal(L.passMark(15),12);assert.equal(L.passMark(12),10);
  assert.equal(L.stepOf('capitals-asia-x2').route.id,'capitals-asia');
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
  const route=L.routeFor('flags','europe'),d='2026-10-11';let p={};
  let s=L.routeState(route,p,d);assert.equal(s.next,0);assert.equal(s.learned,0);assert.equal(s.bossOpen,false);
  p={'lesson:flags-europe-1':{t:1,day:d,best:6,of:6},[L.itemKey('flags','NLD')]:{t:1,lvl:1,due:'2026-10-12',last:d},[L.itemKey('flags','BEL')]:{t:1,lvl:0,due:d,last:d}};
  s=L.routeState(route,p,d);assert.equal(s.next,1);assert.equal(s.learned,1);assert.deepEqual(s.due,['BEL']);
  assert.equal(L.dueEverywhere(p,d),1);
  for(const l of route.lessons)p['lesson:'+l.id]={t:1,day:d};
  s=L.routeState(route,p,d);assert.equal(s.bossOpen,false,'the midway tests still wait');assert.equal(route.steps[s.next].id,'flags-europe-x1');
  p['lesson:flags-europe-x1']={t:1,best:7,of:12};assert.equal(L.routeState(route,p,d).next,3,'a failed test (no day) does not open the next lessons');
  p['lesson:flags-europe-x1']={t:2,day:d,best:11,of:12};p['lesson:flags-europe-x2']={t:2,day:d};
  assert.equal(L.routeState(route,p,d).bossOpen,true);
  assert.equal(L.routeState(L.routeFor('capitals','europe'),p,d).learned,0,'every topic has its own progress');
});

test('merging keeps the newest card per key and drops broken ones (1.38)',()=>{
  const a={'item:flags:NLD':{t:5,lvl:2,due:'2026-10-14'},'lesson:flags-europe-1':{t:1,day:'2026-10-11'}};
  const b={'item:flags:NLD':{t:3,lvl:3},'item:flags:BEL':{t:4,lvl:1},'bad key!':{t:9},'item:flags:DEU':{t:2,due:'tomorrow'},'item:flags:FRA':{lvl:1}};
  const m=L.mergeProgress(a,b);assert.equal(m['item:flags:NLD'].lvl,2);assert.equal(m['item:flags:BEL'].lvl,1);
  assert.equal(m['bad key!'],undefined);assert.equal(m['item:flags:DEU'],undefined);assert.equal(m['item:flags:FRA'],undefined);
});

test('questions: practice asks every country once both ways in turn, tests have four distinct options with the answer (1.38)',()=>{
  const rand=L.rng(42);
  for(const route of L.ROUTES){
    const pool=L.routeCountries(route);
    for(const lesson of route.lessons){
      const pq=L.practiceQuestions(lesson,rand);assert.equal(pq.length,lesson.countries.length);assert.deepEqual(pq.map(q=>q.id).sort(),[...lesson.countries].sort());
      assert.ok(pq.some(q=>q.kind==='toName')&&pq.some(q=>q.kind==='fromName'));
      for(const q of pq){assert.ok(q.options.includes(q.id));assert.equal(new Set(q.options).size,q.options.length);assert.ok(q.options.every(o=>lesson.countries.includes(o)));}
      for(const q of L.testQuestions(lesson.countries,pool,rand)){assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4);assert.ok(q.options.includes(q.id));assert.ok(q.options.every(o=>pool.includes(o)));}
    }
    const boss=L.bossQuestions(route,{},rand);assert.equal(boss.length,Math.min(L.BOSS_SIZE,pool.length));assert.equal(new Set(boss.map(q=>q.id)).size,boss.length);
    for(const step of route.steps.filter(s=>s.kind==='exam')){const ex=L.examQuestions(route,step,{},rand);assert.equal(ex.length,Math.min(L.EXAM_SIZE,step.countries.length));assert.ok(ex.every(q=>step.countries.includes(q.id)));}
  }
  const pool=L.routeCountries(L.routeFor('flags','europe'));
  const nld=L.testQuestions(['NLD'],pool,L.rng(7))[0];assert.ok(nld.options.some(o=>L.LOOKALIKES.NLD.includes(o)),'a look-alike is among the options');
  const near=L.testQuestions(['NLD'],pool,L.rng(7),()=>['BEL','DEU'])[0];assert.ok(near.options.includes('BEL')||near.options.includes('DEU'),'a nearby country is among the options');
});
