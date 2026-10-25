import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import fs from 'node:fs';
// 1.51: roviko.app links open the app: the two verification files, and where a link lands inside the app.
fs.mkdirSync('.test-runtime',{recursive:true});
await build({stdin:{contents:"export { appLinks } from './server/app-links'; export { appLinkTarget } from './lib/app-links';",resolveDir:process.cwd()},bundle:true,format:'esm',platform:'node',outfile:'.test-runtime/app-links.mjs'});
const {appLinks,appLinkTarget}=await import('../.test-runtime/app-links.mjs');
test('app links (1.51): iOS and Android files only with valid ids, Google sign-in and admin stay in the browser',async()=>{
 assert.equal(appLinks('/.well-known/apple-app-site-association',{}).status,404,'no team id: nothing');
 assert.equal(appLinks('/.well-known/assetlinks.json',{ANDROID_CERT_SHA256:'nonsense'}).status,404);
 const ios=appLinks('/.well-known/apple-app-site-association',{APPLE_TEAM_ID:'ABCDE12345'});
 assert.equal(ios.headers.get('Content-Type'),'application/json');
 const a=await ios.json();assert.deepEqual(a.applinks.details[0].appIDs,['ABCDE12345.com.roviko.app']);
 const c=a.applinks.details[0].components;assert.deepEqual(c.at(-1),{'/':'*'});assert.ok(c.some(x=>x['/']==='/api/auth/google*'&&x.exclude));assert.ok(c.some(x=>x['/']==='/admin*'&&x.exclude));
 const hex='AB'.repeat(32);
 for(const v of [hex,hex.match(/../g).join(':'),' '+hex.toLowerCase()+' ']){const j=await appLinks('/.well-known/assetlinks.json',{ANDROID_CERT_SHA256:v}).json();assert.equal(j[0].target.package_name,'com.roviko.app');assert.deepEqual(j[0].target.sha256_cert_fingerprints,[hex.match(/../g).join(':')]);}
 assert.equal((await appLinks('/.well-known/assetlinks.json',{ANDROID_CERT_SHA256:hex+','+'CD'.repeat(32)}).json())[0].target.sha256_cert_fingerprints.length,2);
});
test('app links (1.51): a link from an email opens that page in the app; other sites are ignored',()=>{
 assert.equal(appLinkTarget('https://roviko.app/?from=reminder'),'/?from=reminder');
 assert.equal(appLinkTarget('https://roviko.app/api/auth/verify?token=abc'),'/api/auth/verify?token=abc');
 assert.equal(appLinkTarget('https://roviko.app'),'/');
 assert.equal(appLinkTarget('https://evil.example/?x'),null);assert.equal(appLinkTarget('http://roviko.app/'),null);assert.equal(appLinkTarget(undefined),null);
});
