import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {build} from 'esbuild';
import React from 'react';
import {create,act} from 'react-test-renderer';
import {renderToStaticMarkup} from 'react-dom/server';
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
globalThis.window={addEventListener(){},removeEventListener(){}};
globalThis.document={querySelector(){return null;}};
fs.mkdirSync('.test-runtime',{recursive:true});
await build({stdin:{contents:`export * from './i18n/messages';export * from './i18n/content';export * from './lib/game-engine/questions';export * from './lib/game-engine/learning';export * from './lib/game-engine/map-camera';export * from './lib/game-engine/scoring';export * from './server/geography';export {tick,roomView} from './server/multiplayer';export {Question} from './components/game/Question';export {default as WorldMap} from './components/game/WorldMap';export {TOPICS} from './lib/puzzles/topics';export {generateMosaic,generateComparisons} from './lib/puzzles/generate';export {generateRankRounds} from './lib/puzzles/rank';`,resolveDir:process.cwd()},outfile:'.test-runtime/game-updates.mjs',bundle:true,format:'esm',platform:'node',jsx:'automatic',external:['react','react/*','react-dom','react-dom/*','lucide-react']});
const lib=await import('../.test-runtime/game-updates.mjs');
const settings={mode:'mixed',count:10,timer:15,difficulty:'medium',region:'World'};
const t=key=>lib.messages.en[key]??key;

test('Spanish covers all UI keys and interpolation tokens, including saved game content',()=>{
 for(const [key,en] of Object.entries(lib.messages.en)){
  assert.ok(lib.messages.es[key],key);assert.deepEqual(lib.messages.es[key].match(/\{\w+\}/g)?.sort()??[],en.match(/\{\w+\}/g)?.sort()??[],key);
 }
 for(const mode of ['trail','capitals','flags','borders','order','pinpoint']){
  const questions=lib.withSpanish(lib.generateQuestions({...settings,mode,count:20},'spanish-content'));
  for(const q of questions){assert.ok(q.prompt.es);assert.notEqual(q.prompt.es,q.prompt.en);assert.ok(q.answerLabel.es);assert.ok(q.fact.es);assert.ok(q.options.every(o=>!!o.es));assert.ok(!q.clues||q.clues.every(c=>!!c.es));}
 }
 for(const topic of lib.TOPICS)assert.ok(topic.label.es&&topic.prompt.es&&topic.explanation.es,topic.id);
 const mosaic=lib.withSpanish(lib.generateMosaic(5,'spanish-mosaic'));
 assert.ok(mosaic.tiles.filter(t=>t.kind==='fact').every(t=>t.fact.stat.label.es&&t.fact.stat.unit.es&&t.fact.stat.value.es));
 assert.ok(lib.withSpanish(lib.generateRankRounds('spanish-rank')).every(q=>q.country.name.es&&q.options.every(o=>o.explanation.es)));
 const facts=JSON.parse(fs.readFileSync('public/data/mosaic-facts.json')).facts;
 assert.ok(facts.every(f=>f.explanation.es&&f.clues.every(c=>c.es)));
 const q=lib.generateQuestions({...settings,mode:'capitals',count:1,typed:true},'es-capital',[],[], 'FRA')[0];
 assert.equal(lib.evaluate(q,'París',3000,15000,0).correct,true);
});

test('mixed games honour excluded modes for every round count and cover all enabled modes',()=>{
 for(const count of [5,10,15,20])for(const enabledModes of [['flags'],['trail','capitals','flags','borders','order'],['pinpoint','order']]){
  const q=lib.generateQuestions({...settings,count,enabledModes},`modes-${count}`);
  assert.equal(q.length,count);assert.ok(q.every(q=>enabledModes.includes(q.mode)));assert.equal(new Set(q.map(q=>q.mode)).size,enabledModes.length);
 }
 assert.equal(new Set(lib.generateQuestions({...settings,count:20},'all-modes').map(q=>q.mode)).size,6);
 assert.throws(()=>lib.generateQuestions({...settings,enabledModes:[]},'none'));
});

function room(timer=15){const now=100000;return {code:'ABCDE',host:'one',settings:{...settings,timer},players:['one','two'].map(id=>({id,lastSeen:now,name:id,score:0,streak:0,bestStreak:0,correct:0,results:[]})),phase:'question',round:0,startAt:now-5000,deadline:timer?now+10000:0,revealUntil:0,matchId:'timing',questions:lib.generateQuestions({...settings,mode:'flags',count:5},'timing'),answers:{},events:[]};}
test('timed and untimed rounds reveal exactly one second after the last answer, scoring once',()=>{
 for(const timer of [0,15]){const r=room(timer),q=r.questions[0];
  r.answers.one={value:q.correct,at:100010};lib.tick(r,100010);assert.equal(r.phase,'question');assert.equal(r.answersCompleteAt,undefined);
  r.answers.two={value:q.correct,at:100300};lib.tick(r,100300);assert.equal(r.answersCompleteAt,101300);assert.equal(r.phase,'question');assert.equal(lib.roomView(r,'one').feedback,null);
  lib.tick(r,101299);assert.equal(r.phase,'question');assert.equal(r.players[0].score,0);
  lib.tick(r,101300);assert.equal(r.phase,'reveal');assert.equal(r.players[0].results.length,1);assert.ok(r.players[0].score>=1000);
  const score=r.players[0].score;lib.tick(r,101301);assert.equal(r.players[0].score,score);
  lib.tick(r,r.revealUntil);assert.equal(r.phase,'countdown');assert.equal(r.answersCompleteAt,undefined);assert.deepEqual(r.answers,{});
 }
});
test('a missing answer still waits for the deadline; a reconnect cancels a premature reveal',()=>{
 const r=room();r.answers.one={value:r.questions[0].correct,at:100000};lib.tick(r,r.deadline-1);assert.equal(r.phase,'question');lib.tick(r,r.deadline);assert.equal(r.phase,'reveal');assert.equal(r.players[1].score,0);
 const reconnect=room(0);reconnect.players[1].lastSeen=0;reconnect.answers.one={value:reconnect.questions[0].correct,at:100000};lib.tick(reconnect,100000);assert.equal(reconnect.answersCompleteAt,101000);
 reconnect.players[1].lastSeen=100500;lib.tick(reconnect,100500);assert.equal(reconnect.answersCompleteAt,undefined);lib.tick(reconnect,101500);assert.equal(reconnect.phase,'question');
});

test('map misses earn decreasing accuracy credit, with neighbour/continent feedback and no invented client score',()=>{
 const q=lib.prepareGeography(lib.generateQuestions({...settings,mode:'pinpoint',count:1},'map-credit',[],[],'DEU'))[0];
 const check=pin=>lib.enrichMapFeedback(q,pin,lib.evaluateLearning(q,pin));
 assert.equal(check([52.52,13.405]).mapPoints,1000);
 const neighbour=check([48.8566,2.3522]),continent=check([40.4168,-3.7038]),far=check([-33.8688,151.2093]);
 assert.equal(neighbour.mapRelation,'mapNeighbour');assert.equal(continent.mapRelation,'mapContinent');assert.ok(neighbour.mapPoints>continent.mapPoints);assert.ok(continent.mapPoints>far.mapPoints);
 assert.equal(neighbour.correct,false);assert.equal(neighbour.points,0);assert.ok(neighbour.mapPoints>0&&neighbour.mapPoints<1000);
 assert.equal(lib.evaluateLearning(q,null).mapPoints,0);assert.equal(lib.evaluateLearning(q,[999,999]).mapPoints,0);
 for(let km=0;km<20000;km+=100)assert.ok(lib.mapAccuracyPoints(false,km)>=lib.mapAccuracyPoints(false,km+100));
 const live=lib.evaluate(q,[48.8566,2.3522],1000,15000,0);assert.equal(live.points,neighbour.mapPoints);
});

test('zoom preserves the focal point, pans within bounds and resets cleanly',()=>{
 const camera=lib.zoomCamera(lib.initialCamera,4,[400,200],[.3,.4]);assert.equal(camera.x+.3*1000/camera.zoom,400);assert.equal(camera.y+.4*500/camera.zoom,200);
 const panned=lib.panCamera(camera,[.1,-.1]);assert.ok(panned.x<camera.x);assert.ok(panned.y>camera.y);
 assert.deepEqual(lib.zoomCamera(panned,1),lib.initialCamera);assert.equal(lib.zoomCamera(camera,999).zoom,64);
});

test('map touch gestures pinch and pan without placing a pin; only a released tap selects',async()=>{
 const prior=globalThis.fetch;globalThis.fetch=async path=>({ok:true,json:async()=>String(path).includes('boundaries')?{}:[]});
 let renderer;const pins=[];const svgNode={getBoundingClientRect:()=>({left:0,top:0,width:400,height:300}),setPointerCapture(){},addEventListener(){},removeEventListener(){}};
 try{
  await act(async()=>{renderer=create(React.createElement(lib.WorldMap,{value:null,onChange:v=>pins.push(v),t}),{createNodeMock:el=>el.type==='svg'?svgNode:null});});
  const svg=()=>renderer.root.findByProps({className:'world-map'});const event=(pointerId,x,y,type='pointerdown')=>({pointerId,clientX:x,clientY:y,button:0,currentTarget:svgNode,type});
  await act(async()=>{svg().props.onPointerDown(event(1,100,150));});assert.equal(pins.length,0);
  await act(async()=>{svg().props.onPointerDown(event(2,300,150));});
  await act(async()=>{svg().props.onPointerMove(event(1,20,150,'pointermove'));svg().props.onPointerMove(event(2,380,150,'pointermove'));});
  assert.ok(Number(svg().props.viewBox.split(' ')[2])<1000);
  await act(async()=>{svg().props.onPointerUp(event(1,20,150,'pointerup'));svg().props.onPointerUp(event(2,380,150,'pointerup'));});assert.equal(pins.length,0);
  const before=svg().props.viewBox;
  await act(async()=>{svg().props.onPointerDown(event(3,200,150));svg().props.onPointerMove(event(3,230,150,'pointermove'));});
  assert.notEqual(svg().props.viewBox,before);await act(async()=>svg().props.onPointerUp(event(3,230,150,'pointerup')));assert.equal(pins.length,0);
  await act(async()=>renderer.root.findByProps({'aria-label':t('mapReset')}).props.onClick());
  await act(async()=>svg().props.onPointerDown(event(4,200,150)));await act(async()=>svg().props.onPointerUp(event(4,200,150,'pointerup')));
  assert.deepEqual(pins,[[0,0]],'Correct coordinates even with a letterboxed SVG');
 }finally{if(renderer)await act(async()=>renderer.unmount());globalThis.fetch=prior;}
});

test('ordering countries remains editable until the confirm button submits the displayed order',async()=>{
 const q=lib.withSpanish(lib.publicQuestion(lib.generateQuestions({...settings,mode:'order',count:1},'confirm-order')[0]));let renderer;const answers=[];
 await act(async()=>{renderer=create(React.createElement(lib.Question,{question:q,feedback:null,locked:false,onAnswer:a=>answers.push(a),t,locale:'en',onReport(){}}));});
 const down=renderer.root.findAll(n=>n.type==='button'&&n.props['aria-label']?.startsWith(t('moveDown')))[0];await act(async()=>down.props.onClick());assert.equal(answers.length,0);
 const confirm=renderer.root.findAll(n=>n.type==='button'&&n.children.includes(t('confirmOrder')))[0];await act(async()=>confirm.props.onClick());assert.deepEqual(answers[0],[q.options[1].id,q.options[0].id,...q.options.slice(2).map(o=>o.id)]);await act(async()=>renderer.unmount());
});

test('flag and trail choices cannot give away the matching flag and capitals exclude self-naming answers',()=>{
 const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 for(const mode of ['trail','flags','capitals','borders'])for(let seed=0;seed<8;seed++)for(const q of lib.generateQuestions({...settings,mode,count:20},'no-leak'+seed)){
  const safe=lib.withSpanish(lib.publicQuestion(q));const html=renderToStaticMarkup(React.createElement(lib.Question,{question:safe,feedback:null,locked:false,onAnswer(){},t,locale:'en',onReport(){}}));
  assert.equal(safe.correct,undefined);assert.equal(safe.countryId,undefined);assert.equal(safe.fact,undefined);assert.equal(safe.answerLabel,undefined);
  if(['trail','flags'].includes(mode)){assert.ok(safe.options.every(o=>!o.flag));assert.doesNotMatch(html,/class="option-country"><img/);assert.equal(safe.country,undefined);}
  if(mode==='capitals')for(const cap of q.aliases)assert.ok(!normalize(q.prompt.en).includes(normalize(cap)),q.prompt.en+' -> '+cap);
  if(mode==='trail')assert.ok(!q.clues.map(c=>c.en).join(' ').includes(q.answerLabel.en),q.countryId);
  if(mode==='borders')assert.ok(!q.prompt.en.includes(q.answerLabel.en));
 }
});
