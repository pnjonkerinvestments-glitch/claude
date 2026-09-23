import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import fs from 'node:fs';
import React from 'react';
import {create,act} from 'react-test-renderer';
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.window={addEventListener(){},removeEventListener(){}};
globalThis.document={visibilityState:'visible'};
fs.mkdirSync('.test-runtime',{recursive:true});
await build({stdin:{contents:"export {PuzzleGame} from './components/puzzles/PuzzleGame';export {generateMosaic,generateComparisons} from './lib/puzzles/generate';",resolveDir:process.cwd()},outfile:'.test-runtime/puzzle-ui.mjs',bundle:true,format:'esm',platform:'node',jsx:'automatic',external:['react','react/*','react-dom','react-dom/*','lucide-react','radix-ui'],plugins:[{name:'transport',setup(b){b.onResolve({filter:/^@\/lib\/client$/},()=>({path:'transport',namespace:'mock'}));b.onLoad({filter:/.*/,namespace:'mock'},()=>({contents:'export const api=(...args)=>globalThis.transport.api(...args);export const post=(...args)=>globalThis.transport.post(...args);export const sound=()=>{};export const readPreference=(k,f)=>globalThis.preferences?.get(k)??f;export const writePreference=(k,v)=>{globalThis.preferences??=new Map();globalThis.preferences.set(k,v);};'}));}}]});
const {PuzzleGame,generateMosaic,generateComparisons}=await import('../.test-runtime/puzzle-ui.mjs');
const app={t:k=>k,locale:'en',go(){},refresh(){},muted:true,copy(){},report(){}};
const base={id:'test',daily:null,phase:'question',round:0,settings:{topic:'area',size:4},answers:[],solved:[],streak:0,bestStreak:0,version:0,total:4,learning:true};
const clone=x=>structuredClone(x);
const buttons=(r,cls)=>r.root.findAll(n=>n.type==='button'&&n.props.className?.split(' ').includes(cls));
function deferred(){let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return{promise,resolve,reject};}

test('Mosaic replaces full selections, locks duplicate saves and keeps solved tiles in position',async()=>{
 let state={...clone(base),mode:'mosaic',board:generateMosaic(4,'ui'),question:null};
 let calls=0;const save=deferred();
 globalThis.transport={api:async()=>clone(state),post:async(path,body)=>{calls++;await save.promise;state={...state,version:1,solved:[state.board.countries[0].id],round:1};return clone(state);}};
 let r;await act(async()=>{r=create(React.createElement(PuzzleGame,{id:'test',app}));});
 const tiles=()=>buttons(r,'mosaic-tile');
 assert.equal(r.root.findAll(n=>n.props.className==='tile-stat').length,4,'Every fact is a readable label/value/unit/year card');
 assert.equal(r.root.findAll(n=>n.type==='time'&&n.props.dateTime===state.board.factDate).length,1);
 const ids=state.board.tiles.map(t=>t.id);const group=state.board.tiles.filter(t=>t.countryId===state.board.countries[0].id);
 for(const tile of group)await act(async()=>{tiles()[ids.indexOf(tile.id)].props.onClick();});
 assert.equal(tiles().filter(t=>t.props['aria-pressed']).length,4);
 const replacement=state.board.tiles.find(t=>t.kind===group[0].kind&&t.countryId!==group[0].countryId);
 await act(async()=>{tiles()[ids.indexOf(replacement.id)].props.onClick();});
 assert.equal(tiles().filter(t=>t.props['aria-pressed']).length,4);assert.equal(tiles()[ids.indexOf(group[0].id)].props['aria-pressed'],false);
 await act(async()=>{tiles()[ids.indexOf(group[0].id)].props.onClick();});
 const check=()=>r.root.findAll(n=>n.type==='button'&&n.props.onClick&&n.children.includes('puzzleConnect'))[0];
 assert.equal(check().props.disabled,false);
 await act(async()=>{check().props.onClick();check().props.onClick();});
 assert.equal(calls,1);assert.equal(tiles().length,16);assert.ok(tiles().every(t=>t.props.disabled));
 await act(async()=>{save.resolve();await save.promise;});
 assert.equal(tiles().length,16);assert.equal(tiles().filter(t=>t.props.disabled).length,4);
 assert.equal(tiles().filter(t=>t.props['aria-pressed']).length,0);
 await act(async()=>r.unmount());
});

test('Mosaic preserves a failed selection, retries, and reconciles an acknowledged save with a lost response',async()=>{
 let state={...clone(base),mode:'mosaic',board:generateMosaic(4,'retry'),question:null};let fail=true;
 globalThis.transport={api:async()=>clone(state),post:async()=>{if(fail)throw Error('network');state={...state,version:1,solved:[state.board.countries[0].id],round:1};throw Error('lost response');}};
 let r;await act(async()=>{r=create(React.createElement(PuzzleGame,{id:'test',app}));});
 const tiles=()=>buttons(r,'mosaic-tile');const group=state.board.tiles.map((t,i)=>({t,i})).filter(({t})=>t.countryId===state.board.countries[0].id);
 for(const {i} of group)await act(async()=>tiles()[i].props.onClick());
 const check=()=>r.root.findAll(n=>n.type==='button'&&n.children.includes('puzzleConnect'))[0];
 await act(async()=>{check().props.onClick();});
 assert.equal(tiles().filter(t=>t.props['aria-pressed']).length,4);
 assert.equal(r.root.findAll(n=>n.props.role==='alert').length,1);
 await act(async()=>{r.root.findAll(n=>n.type==='button'&&n.children.includes('retry'))[0].props.onClick();});
 assert.equal(tiles().filter(t=>t.props['aria-pressed']).length,4);
 fail=false;await act(async()=>{check().props.onClick();});
 assert.equal(r.root.findAll(n=>n.props.role==='alert').length,0);
 assert.equal(tiles().filter(t=>t.props.disabled).length,4);
 await act(async()=>r.unmount());
});

test('Side by Side reveals immediately, awaits save, and advances exactly once using the acknowledged version',async()=>{
 const rounds=generateComparisons('area','ui-compare');let state={...clone(base),mode:'compare',total:10,board:null,question:rounds[0]};const save=deferred();let nextCalls=0;
 globalThis.transport={api:async()=>clone(state),post:async(path,body)=>{
  if(path.endsWith('/answer')){await save.promise;state={...state,phase:'reveal',version:1,answers:[{correct:body.answer===rounds[0].correct,value:body.answer}]};return clone(state);}
  assert.equal(body.version,1);nextCalls++;state={...state,phase:'question',version:2,round:1,question:rounds[1]};return clone(state);
 }};
 let r;await act(async()=>{r=create(React.createElement(PuzzleGame,{id:'test',app}));});
 await act(async()=>r.root.findByType('input').props.onChange({target:{checked:false}}));
 await act(async()=>buttons(r,'comparison-country')[0].props.onClick());
 assert.equal(buttons(r,'comparison-country').filter(t=>t.props.disabled).length,2);
 assert.equal(r.root.findAll(n=>n.props.className==='comparison-value'&&n.findAll(x=>x.type==='strong').length).length,2);
 const next=r.root.findAll(n=>n.type==='button'&&n.children.includes('next'))[0];
 await act(async()=>{next.props.onClick();next.props.onClick();});assert.equal(nextCalls,0);
 await act(async()=>{save.resolve();await save.promise;});assert.equal(nextCalls,1);
 const cards=buttons(r,'comparison-country');assert.equal(cards[1].props['aria-label'],rounds[0].countries[0].name.en);
 assert.ok(cards[1].props.className.includes('carried'));assert.equal(cards[1].findAll(n=>n.type==='strong').length,1);
 await act(async()=>r.unmount());
});


test('Mosaic uses a non-colliding board class at every clue count',async()=>{
 for(const size of [3,4,5]){
  const state={...clone(base),mode:'mosaic',board:generateMosaic(size,'layout'),question:null};
  globalThis.transport={api:async()=>clone(state),post:async()=>clone(state)};
  let r;await act(async()=>{r=create(React.createElement(PuzzleGame,{id:'test',app}));});
  const board=r.root.find(n=>n.props.className==='mosaic-board');
  assert.equal(board.props['data-clues'],size);
  assert.doesNotMatch(board.props.className,/(?:^| )size-[345](?: |$)/);
  assert.equal(buttons(r,'mosaic-tile').length,size*4);
  await act(async()=>r.unmount());
 }
});

test('Mosaic marks only the mismatched clues red and explains which country they belong to',async()=>{
 const board=generateMosaic(4,'wrong-clues');let state={...clone(base),mode:'mosaic',board,question:null};
 globalThis.transport={api:async()=>clone(state),post:async()=>({...clone(state),version:1})};
 let r;await act(async()=>{r=create(React.createElement(PuzzleGame,{id:'test',app}));});
 const group=board.tiles.filter(t=>t.countryId===board.countries[0].id);
 const wrong=board.tiles.find(t=>t.kind==='flag'&&t.countryId!==group[0].countryId);
 const choices=group.filter(t=>t.kind!=='flag').concat(wrong);
 for(const tile of choices)await act(async()=>buttons(r,'mosaic-tile')[board.tiles.findIndex(t=>t.id===tile.id)].props.onClick());
 const check=r.root.findAll(n=>n.type==='button'&&n.children.includes('puzzleConnect'))[0];
 await act(async()=>check.props.onClick());
 assert.equal(buttons(r,'clue-wrong').length,1);assert.equal(buttons(r,'clue-correct').length,3);
 const bad=buttons(r,'clue-wrong')[0];assert.ok(bad.props['aria-label'].includes(board.countries.find(c=>c.id===wrong.countryId).name.en));
 assert.equal(bad.findAll(n=>n.props.className==='tile-verdict').length,1);
 await act(async()=>bad.props.onClick());assert.equal(buttons(r,'clue-wrong').length,0);
 await act(async()=>r.unmount());
});

test('Side by Side auto-next preference survives unmount and reload',async()=>{
 globalThis.preferences=new Map([['rv_compare_auto','on']]);const state={...clone(base),mode:'compare',total:10,board:null,question:generateComparisons('area','preference')[0]};globalThis.transport={api:async()=>clone(state),post:async()=>clone(state)};
 let r;await act(async()=>{r=create(React.createElement(PuzzleGame,{id:'test',app}));});assert.equal(r.root.findByType('input').props.checked,true);
 await act(async()=>r.root.findByType('input').props.onChange({target:{checked:false}}));await act(async()=>r.unmount());
 await act(async()=>{r=create(React.createElement(PuzzleGame,{id:'test',app}));});assert.equal(r.root.findByType('input').props.checked,false);await act(async()=>r.unmount());
});

test('reloading a saved Mosaic mistake restores the selection and only the incorrect red clue',async()=>{
 const board=generateMosaic(4,'reload-mismatch'),country=board.countries[0].id;
 const chosen=[...board.tiles.filter(t=>t.countryId===country&&t.kind!=='flag').map(t=>t.id),board.tiles.find(t=>t.countryId!==country&&t.kind==='flag').id];
 const state={...clone(base),mode:'mosaic',board,question:null,answers:[{correct:false,value:chosen,countryId:'',questionId:board.id,responseTime:0}]};
 globalThis.transport={api:async()=>clone(state),post:async()=>clone(state)};
 let r;await act(async()=>{r=create(React.createElement(PuzzleGame,{id:'test',app}));});
 assert.equal(buttons(r,'mosaic-tile').filter(t=>t.props['aria-pressed']).length,4);
 assert.equal(buttons(r,'clue-wrong').length,1);assert.equal(buttons(r,'clue-correct').length,3);await act(async()=>r.unmount());
});

test('a five-question comparison retry ends on question five and its follow-up locks repeated clicks',async()=>{
 globalThis.preferences=new Map();
 let state={...clone(base),mode:'compare',round:4,total:5,practice:true,board:null,question:generateComparisons('area','retry-total')[0],phase:'reveal',answers:Array.from({length:5},()=>({correct:false,value:'wrong',countryId:'',questionId:'q',responseTime:0}))};
 let requests=0;const save=deferred(),destinations=[];
 globalThis.transport={api:async()=>clone(state),post:async(path)=>{if(path==='/next-round'){requests++;await save.promise;return{href:'/puzzle/retry'};}state={...state,phase:'finished'};return clone(state);}};
 let r;await act(async()=>{r=create(React.createElement(PuzzleGame,{id:'test',app:{...app,go:href=>destinations.push(href)}}));});
 const finish=r.root.findAll(n=>n.type==='button'&&n.children.includes('finish'))[0];assert.ok(finish);await act(async()=>finish.props.onClick());
 const follow=r.root.findAll(n=>n.type==='button'&&n.children.includes('reviewMyMisses'))[0];assert.ok(follow);
 await act(async()=>{follow.props.onClick();follow.props.onClick();});assert.equal(requests,1);
 await act(async()=>{save.resolve();await save.promise;});assert.deepEqual(destinations,['/puzzle/retry']);await act(async()=>r.unmount());
});


test('Mosaic reveals a sourced story only after its country is solved, and accepts legacy facts',async()=>{
 for(const legacy of [false,true]){
  const board=generateMosaic(4,'stories');if(legacy)board.tiles.forEach(t=>delete t.fact);
  const country=board.countries[0].id;
  let state={...clone(base),mode:'mosaic',board,question:null};
  globalThis.transport={api:async()=>clone(state),post:async()=>{state={...state,version:1,solved:[country],round:1};return clone(state);}};
  let r;await act(async()=>{r=create(React.createElement(PuzzleGame,{id:'test',app}));});
  const stories=()=>r.root.findAll(n=>n.type==='details'&&n.props.className==='mosaic-fact-reveal');
  assert.equal(stories().length,0);
  for(const tile of board.tiles.filter(t=>t.countryId===country))await act(async()=>buttons(r,'mosaic-tile')[board.tiles.findIndex(t=>t.id===tile.id)].props.onClick());
  await act(async()=>r.root.findAll(n=>n.type==='button'&&n.children.includes('puzzleConnect'))[0].props.onClick());
  assert.equal(stories().length,legacy ? 0 : 1);
  if(!legacy){const fact=board.tiles.find(t=>t.countryId===country&&t.kind==='fact').fact;assert.ok(stories()[0].findAll(n=>n.type==='a').some(n=>n.props.href===fact.source.url));assert.ok(stories()[0].findAll(n=>n.type==='p').some(n=>n.children.includes(fact.explanation.en)));}
  await act(async()=>r.unmount());
 }
});
