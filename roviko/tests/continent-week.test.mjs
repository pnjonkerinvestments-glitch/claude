import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import fs from 'node:fs';
const bundle=await build({stdin:{contents:"export * from './lib/game-engine/questions'; export * from './lib/continent-week';",resolveDir:process.cwd()},bundle:true,format:'esm',platform:'node',write:false,loader:{'.json':'json'}});
fs.mkdirSync('.test-runtime',{recursive:true});fs.writeFileSync('.test-runtime/continent-week.mjs',bundle.outputFiles[0].text);const e=await import('../.test-runtime/continent-week.mjs');

test('the continent of the week turns every Monday in a five-week round (1.35)',()=>{
  assert.equal(e.continentOfWeek('2026-10-05'),'Europe');assert.equal(e.continentOfWeek('2026-10-11'),'Europe','Sunday is still the same week');
  assert.equal(e.continentOfWeek('2026-10-12'),'Africa');assert.equal(e.continentOfWeek('2026-10-19'),'Asia');assert.equal(e.continentOfWeek('2026-10-26'),'Americas');
  assert.equal(e.continentOfWeek('2026-11-02'),'Oceania');assert.equal(e.continentOfWeek('2026-11-09'),'Europe');assert.equal(e.continentOfWeek('2026-09-28'),'Oceania','weeks before the start count back');
});

test('every continent, level and game makes a full set of questions about that continent only (1.35)',()=>{
  const COUNTRY=new Map(e.COUNTRIES.map(c=>[c.id,c]));
  for(const region of e.WEEK_CONTINENTS) for(const difficulty of ['easy','medium','hard','mixed']) {
    const modes=e.continentModes(region);
    for(const enabled of [modes,...modes.map(m=>[m])]) for(const count of [5,20]) {
      const qs=e.generateQuestions({mode:'mixed',count,timer:0,difficulty,region,enabledModes:enabled},'continent:'+region+':'+difficulty+':'+enabled.join(',')+':'+count);
      assert.equal(qs.length,count,region+' '+difficulty+' '+enabled.join(','));
      for(const q of qs){const id=q.countryId??q.answerId??q.correct; const c=COUNTRY.get(q.countryId); if(c) assert.ok(e.inRegion(c.region,region),region+': '+c.name+' in '+q.mode);}
    }
  }
});
