import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import fs from 'node:fs';
fs.mkdirSync('.test-runtime',{recursive:true});
await build({stdin:{contents:"export {createRoomClient} from './lib/realtime/room-client';export {locateInCountry} from './lib/game-engine/geometry';export {prepareGeography} from './server/geography';export {generateQuestions,publicQuestion,evaluate,COUNTRIES} from './lib/game-engine/questions';export {evaluateLearning,learningSolution} from './lib/game-engine/learning';export {shareResult} from './lib/share';export {pageTitle} from './lib/page-title';export {utcDate} from './server/daily-content';export {generateMosaic} from './lib/puzzles/generate';export {messages} from './i18n/messages';",resolveDir:process.cwd()},bundle:true,outfile:'.test-runtime/reliability.mjs',format:'esm',platform:'node'});
const lib=await import('../.test-runtime/reliability.mjs');
const pause=n=>new Promise(r=>setTimeout(r,n));
// Await the observable terminal state instead of assuming an unloaded event loop.
async function until(predicate){const deadline=Date.now()+1000;while(!predicate()&&Date.now()<deadline)await pause(2);assert.ok(predicate(),'Expected bounded realtime transition');}
const wire=()=>({readyState:1,sent:[],send(s){this.sent.push(JSON.parse(s));},close(){this.readyState=3;},onopen:null,onclose:null,onerror:null,onmessage:null});
const snapshot={code:'TEST2',players:[],phase:'lobby',serverTime:Date.now()};
test('HTTP lobby is visible before WebSocket; a silent upgrade stops retrying and manual recovery works',async()=>{
 let joins=0,states=[],statuses=[],sockets=[];
 const c=lib.createRoomClient({join:async()=>{joins++;return snapshot;},open:()=>{const s=wire();sockets.push(s);return s;},state:s=>states.push(s),status:(ok,e)=>statuses.push({ok,e}),rejected(){},timing:{join:20,handshake:7,heartbeat:50,stale:100,retry:2}});
 try{await c.start();assert.equal(states[0],snapshot);assert.equal(c.send('start'),false);await until(()=>joins===3&&statuses.at(-1).e==='REALTIME_UNAVAILABLE');assert.equal(joins,3);assert.equal(statuses.at(-1).e,'REALTIME_UNAVAILABLE');await pause(15);assert.equal(joins,3);
 c.retry();await pause(1);sockets.at(-1).onmessage({data:JSON.stringify({type:'state',...snapshot})});assert.equal(statuses.at(-1).ok,true);assert.equal(c.send('ready',{ready:true}),true);assert.deepEqual(sockets.at(-1).sent,[{type:'ready',ready:true}]);}finally{c.stop();}
});
test('a never-resolving lobby request and stale socket are bounded, without replaying actions',async()=>{
 let statuses=[];const c=lib.createRoomClient({join:()=>new Promise(()=>{}),open:wire,state(){},status:(ok,e)=>statuses.push(e),rejected(){},timing:{join:5,handshake:5,heartbeat:50,stale:10,retry:1}});
 try{void c.start();await until(()=>statuses.at(-1)==='REQUEST_TIMEOUT');assert.equal(statuses.at(-1),'REQUEST_TIMEOUT');}finally{c.stop();}
 let sockets=[],stateCount=0;const r=lib.createRoomClient({join:async()=>snapshot,open:()=>{let s=wire();sockets.push(s);return s;},state:()=>stateCount++,status(){},rejected(){},timing:{join:20,handshake:20,heartbeat:50,stale:10,retry:1}});
 try{await r.start();const stale=sockets[0].onmessage;stale({data:JSON.stringify({type:'state',...snapshot})});r.send('answer',{answer:'USA'});await pause(13);const before=stateCount;stale({data:JSON.stringify({type:'state',...snapshot})});assert.equal(stateCount,before);assert.equal(sockets.slice(1).flatMap(s=>s.sent).length,0);}finally{r.stop();}
});
test('country map accepts mainland and islands, rejects a far-away Kuwait pin, and withholds geometry in multiplayer',()=>{
 for(const [id,point] of [['USA',[21.3,-157.8]],['KWT',[29.3,47.8]],['JPN',[35.7,139.7]]]){
  const c=lib.COUNTRIES.find(c=>c.id===id),q=lib.prepareGeography([{id:'map:test',mode:'pinpoint',countryId:id,correct:c.latlng,options:[],prompt:{en:'',nl:''},answerLabel:{en:c.name,nl:c.nl},fact:{en:'',nl:''},difficulty:'medium'}])[0];
  assert.equal(lib.evaluateLearning(lib.learningSolution(q),point).correct,true,id);assert.equal(lib.evaluate(q,point,500,15000,0).correct,true);assert.ok(!('geometry' in lib.publicQuestion(q)));assert.ok(!('correct' in lib.publicQuestion(q)));
  if(id==='KWT')assert.equal(lib.evaluateLearning(lib.learningSolution(q),[29.3,50.1]).correct,false);
 }
 const island=[[[[179,-1],[-179,-1],[-179,1],[179,1],[179,-1]]]];
 assert.equal(lib.locateInCountry([0,179.5],island,0).correct,true);assert.equal(lib.locateInCountry([0,-179.5],island,0).correct,true);assert.equal(lib.locateInCountry([0,0],island,0).correct,false);
 const hole=[[[[0,0],[5,0],[5,5],[0,5],[0,0]],[[2,2],[3,2],[3,3],[2,3],[2,2]]]];
 assert.equal(lib.locateInCountry([2.5,2.5],hole,0).correct,false);assert.equal(lib.locateInCountry([1,1],hole,0).correct,true);
});
test('Mosaic clues retain source metadata without giving away regions; trails reveal broad to specific',()=>{
 for(let i=0;i<30;i++){
  const board=lib.generateMosaic(4,'audit:'+i), facts=board.tiles.filter(t=>t.kind==='fact');
  assert.equal(new Set(facts.map(f=>f.text.en)).size,4);
  assert.ok(new Set(board.countries.map(c=>lib.COUNTRIES.find(country=>country.id===c.id).region)).size<4);
  for(const f of facts){
   assert.doesNotMatch(f.text.en,/^Find me in /);
   assert.ok(f.fact.explanation.en && f.fact.explanation.nl);
   assert.ok(f.fact.source.url.startsWith('https://'));assert.ok(f.fact.stat.rawValue>0);
   assert.ok(['CC0 1.0','CC BY 4.0','ODbL 1.0','Factual observation'].includes(f.fact.source.license));
   const country=board.countries.find(c=>c.id===f.countryId);
   for(const locale of ['en','nl']) assert.ok(!f.text[locale].toLowerCase().includes(country.name[locale].toLowerCase()),'Clue must not print its answer');
  }
 }
 const qs=lib.generateQuestions({mode:'trail',count:5,region:'World',difficulty:'medium'},'trail-test');for(const q of qs){assert.equal(q.clues.length,4);assert.match(q.clues[0].en,/Start your search/);assert.match(q.clues[2].en,/capital/);assert.match(q.clues[3].en,/flag/);assert.ok(!q.prompt.en.includes(q.clues[3].en));}
});
test('UTC boundaries and share/title content contain the correct mode and no private technical ID or answer',()=>{
 assert.equal(lib.utcDate(Date.parse('2026-09-10T23:59:59.999Z')),'2026-09-10');assert.equal(lib.utcDate(Date.parse('2026-09-11T00:00:00Z')),'2026-09-11');
 const shared=lib.shareResult({mode:'compare',label:'Side by Side',date:'2026-09-10',correct:7,total:10,answers:[true,false,true],origin:'https://example.test'});assert.match(shared,/Side by Side · 2026-09-10/);assert.match(shared,/7\/10/);assert.match(shared,/https:\/\/example.test\/daily\?shared=compare/);assert.doesNotMatch(shared,/France|Japan|Paris|solution|puzzle\//);
 for(const locale of ['en','nl']){const t=k=>lib.messages[locale][k]??k;assert.ok(!lib.pageTitle('/puzzle/private-uuid-123',t).includes('private'));assert.match(lib.pageTitle('/profile',t),/Roviko/);}
});

test('a server handover reconnects quietly: no offline status, and an answer sent meanwhile is delivered',async()=>{
 let joins=0,statuses=[],sockets=[];
 const c=lib.createRoomClient({join:async()=>{joins++;return snapshot;},open:()=>{const s=wire();sockets.push(s);return s;},state(){},status:(ok,e)=>statuses.push({ok,e}),rejected(){},timing:{join:50,handshake:50,heartbeat:500,stale:500,retry:2}});
 try{
  await c.start();sockets[0].onmessage({data:JSON.stringify({type:'state',...snapshot})});assert.equal(statuses.at(-1).ok,true);const before=statuses.length;
  sockets[0].onmessage({data:JSON.stringify({type:'reconnect'})});
  assert.equal(c.send('answer',{answer:'NLD',round:0}),true,'an answer during the handover is kept');
  await until(()=>sockets.length===2);await pause(1);
  sockets[1].onmessage({data:JSON.stringify({type:'state',...snapshot})});
  assert.equal(statuses.length,before,'the room never shows as disconnected');
  assert.deepEqual(sockets[1].sent,[{type:'answer',answer:'NLD',round:0}]);assert.equal(joins,2);assert.equal(sockets[0].readyState,3);
 }finally{c.stop();}
});
