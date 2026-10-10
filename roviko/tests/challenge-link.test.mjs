import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import fs from 'node:fs';
const bundle=await build({stdin:{contents:"export {readChallenge,setSharer,challengeExtras} from './lib/share';",resolveDir:process.cwd()},bundle:true,format:'esm',platform:'node',write:false,loader:{'.json':'json'}});
fs.mkdirSync('.test-runtime',{recursive:true});fs.writeFileSync('.test-runtime/challenge-link.mjs',bundle.outputFiles[0].text);const e=await import('../.test-runtime/challenge-link.mjs');

test('challenge links carry the edition date and the sharer code; older editions are marked (1.36)',()=>{
  const today=new Date().toISOString().slice(0,10);
  const c=e.readChallenge('?shared=daily&s=800&n=Ollie&u=abcd1234&d='+today);
  assert.equal(c.code,'ABCD1234');assert.equal(c.date,today);assert.equal(c.stale,false);
  const old=e.readChallenge('?shared=daily&s=800&d=2026-01-01');assert.equal(old.stale,true);
  assert.equal(e.readChallenge('?shared=daily&s=800&u=zz&d=yesterday').code,undefined,'bad values are ignored');
  e.setSharer('ABCD1234');
  const x=e.challengeExtras(k=>k,'en','daily',today,'Ollie');assert.equal(x.params.u,'ABCD1234');assert.equal(x.params.d,today);
  e.setSharer('');assert.equal(e.challengeExtras(k=>k,'en','daily',today).params.u,undefined);
});
