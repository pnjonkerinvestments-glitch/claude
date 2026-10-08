import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import fs from 'node:fs';
fs.mkdirSync('.test-runtime',{recursive:true});
await build({stdin:{contents:"export {welcomeMail,mailLocale} from './server/welcome-mail';",resolveDir:process.cwd()},bundle:true,outfile:'.test-runtime/welcome-mail.mjs',format:'esm',platform:'node',logLevel:'error'});
const lib=await import('../.test-runtime/welcome-mail.mjs');

test('the welcome email greets by name, carries the confirm link and friend code, and escapes names (1.29)',()=>{
 for(const locale of ['nl','en','es']){
  const m=lib.welcomeMail(locale,{name:'Ollie <b>',friendCode:'E44C178E',link:'https://roviko.app/api/auth/verify?token=abc',origin:'https://roviko.app'});
  assert.ok(m.subject.includes('Roviko'));
  assert.ok(m.html.includes('href="https://roviko.app/api/auth/verify?token=abc"'));assert.ok(m.text.includes('https://roviko.app/api/auth/verify?token=abc'));
  assert.ok(m.html.includes('E44C178E')&&m.text.includes('E44C178E'));
  assert.ok(m.html.includes('Ollie &lt;b&gt;')&&!m.html.includes('Ollie <b>'),'names are escaped in HTML');
 }
 assert.match(lib.welcomeMail('nl',{name:'Ollie',friendCode:'X',link:'L',origin:'https://roviko.app'}).html,/Bevestig mijn e-mailadres/);
 assert.equal(lib.mailLocale('es',null),'es');assert.equal(lib.mailLocale(undefined,'nl-NL,nl;q=0.9'),'nl');assert.equal(lib.mailLocale('fr','de-DE'),'en');
});
