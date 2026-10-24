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
