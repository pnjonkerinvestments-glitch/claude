import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import fs from 'node:fs';
const bundle=await build({stdin:{contents:"export * from './lib/growth';",resolveDir:process.cwd()},bundle:true,format:'esm',platform:'node',write:false});
fs.mkdirSync('.test-runtime',{recursive:true});fs.writeFileSync('.test-runtime/growth.mjs',bundle.outputFiles[0].text);const g=await import('../.test-runtime/growth.mjs');

test('growth (1.49): date helpers and return rates only judge cohorts old enough',()=>{
 assert.deepEqual(g.dateRange('2026-10-24',3),['2026-10-22','2026-10-23','2026-10-24']);
 assert.equal(g.addDays('2026-10-31',1),'2026-11-01');
 const first=new Map([['a','2026-10-01'],['b','2026-10-01'],['c','2026-10-20'],['d','2026-10-23']]);
 const active=new Set(['a|2026-10-02','b|2026-10-05','c|2026-10-21']);
 const r=g.returnRates(first,active,'2026-10-24');
 assert.equal(r.day2Cohort,3,'d started yesterday: too new to judge day 2');assert.equal(r.day2,2/3);
 assert.equal(r.weekCohort,2,'only a and b are older than a week');assert.equal(r.week,1);
});

test('growth (1.50): the day-1 funnel counts each daily game of the first day in the day\'s order, only for complete days',()=>{
 const lineup=()=>['daily','compare','rank'];
 const first=new Map([['a','2026-10-20'],['b','2026-10-20'],['c','2026-10-22'],['old','2026-08-01'],['today','2026-10-24']]);
 const done=new Set(['a|2026-10-20|daily','a|2026-10-20|compare','a|2026-10-20|rank','b|2026-10-20|daily','c|2026-10-23|daily','today|2026-10-24|daily']);
 const f=g.dayOneFunnel(first,done,lineup,'2026-10-24');
 assert.equal(f.players,3,'old cohorts and today are left out');
 assert.deepEqual(f.steps,[2,1,1],'c played on its second day, which does not count');
 assert.equal(f.all,1);
 assert.deepEqual(g.dayOneFunnel(new Map(),new Set(),lineup,'2026-10-24'),{players:0,steps:[],all:0});
});
