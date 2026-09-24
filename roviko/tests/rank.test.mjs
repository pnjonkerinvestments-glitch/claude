import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {build} from 'esbuild';
import React from 'react';
import {create,act} from 'react-test-renderer';
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
globalThis.window={addEventListener(){},removeEventListener(){}};
globalThis.document={title:''};
fs.mkdirSync('.test-runtime',{recursive:true});
await build({stdin:{contents:"export {RankGame,rankValue} from './components/puzzles/RankGame';export {rankValues,generateRankRounds,RANK_CATEGORIES} from './lib/puzzles/rank';export {messages} from './i18n/messages';export {shareResult} from './lib/share';",resolveDir:process.cwd()},outfile:'.test-runtime/rank.mjs',bundle:true,format:'esm',platform:'node',jsx:'automatic',external:['react','react/*','react-dom','react-dom/*','lucide-react','radix-ui'],plugins:[{name:'transport',setup(b){b.onResolve({filter:/^@\/lib\/client$/},()=>({path:'transport',namespace:'mock'}));b.onLoad({filter:/.*/,namespace:'mock'},()=>({contents:'export const api=(...args)=>globalThis.transport.api(...args);export const post=(...args)=>globalThis.transport.post(...args);export const sound=()=>{};'}));}}]});
const {RankGame,rankValue,rankValues,generateRankRounds,RANK_CATEGORIES,messages,shareResult}=await import('../.test-runtime/rank.mjs');
const clone=x=>structuredClone(x);
const app={t:k=>messages.en[k]??k,locale:'en',go(){},refresh(){},muted:true,copy(){},report(){}};
function state(){return {id:'rank-ui',mode:'rank',daily:'2026-09-22',phase:'question',round:0,total:6,version:0,learning:true,answers:[],streak:0,bestStreak:0,question:generateRankRounds('rank-ui')[0]};}
const cards=r=>r.root.findAll(n=>n.type==='button'&&n.props.className?.split(' ').includes('rank-option'));
const confirm=r=>r.root.findAll(n=>n.type==='button'&&n.children.includes(messages.en.confirmChoice))[0];
const next=r=>r.root.findAll(n=>n.type==='button'&&n.children.includes(messages.en.next))[0];
function deferred(){let resolve;const promise=new Promise(a=>resolve=a);return {promise,resolve};}

test('ranking shares tied places, omits missing data and normalizes different coverage',()=>{
 const ranks=rankValues({A:100,B:100,C:50,D:0,E:NaN});
 assert.deepEqual(ranks.A,{rank:1,coverage:4,position:0,topPercent:25});assert.equal(ranks.B.rank,1);assert.equal(ranks.C.rank,3);assert.equal(ranks.D.position,1);assert.ok(!ranks.E);
 assert.equal(rankValues({only:5}).only.position,0);
});
test('180 daily seeds produce six distinct countries and unambiguous, varied four-subject rounds',()=>{
 const winners=new Set();
 for(let day=0;day<180;day++){
  const seed='radar-day-'+day,rounds=generateRankRounds(seed);
  assert.deepEqual(rounds,generateRankRounds(seed));assert.equal(rounds.length,6);assert.equal(new Set(rounds.map(r=>r.country.id)).size,6);
  assert.equal(new Set(rounds.map(r=>r.correct)).size,6);
  for(const q of rounds){assert.equal(q.options.length,4);assert.equal(new Set(q.options.map(o=>o.id)).size,4);assert.ok(!['RUS','UKR','ISR','PSE'].includes(q.country.id));
   const winner=q.options.find(o=>o.id===q.correct);winners.add(winner.id);
   for(const o of q.options){assert.ok(Number.isFinite(o.value));assert.ok(o.rank>=1&&o.rank<=o.coverage);assert.ok(o.coverage>=150);assert.ok(o.source&&o.sourceUrl);assert.ok(o.explanation.en&&o.explanation.nl);if(o.id==='age')assert.equal(o.referenceYear,2025);if(['population','income','forest'].includes(o.id))assert.equal(o.referenceYear,2023);if(o.id!==winner.id){assert.ok(o.rank>winner.rank);assert.ok(o.position-winner.position>=.08);assert.ok(o.topPercent-winner.topPercent>=8);}}
  }
 }
 assert.equal(winners.size,15);assert.equal(RANK_CATEGORIES.length,15);assert.notDeepEqual(generateRankRounds('today'),generateRankRounds('tomorrow'));
});
test('revealed units stay explicit and spoiler-free shares exclude country and subject answers',()=>{
 const q=generateRankRounds('units')[0];assert.equal(rankValue({value:2962,unit:'m'},'en'),'2,962 m');assert.equal(rankValue({value:50.5,unit:'percent'},'nl'),'50,5%');
 const share=shareResult({mode:'rank',label:'Rank Radar',date:'2026-09-22',correct:4,total:6,answers:[true,false,true,false,true,true],origin:'https://roviko.test'});
 assert.match(share,/● ○ ● ○ ● ●/);assert.match(share,/\/daily\?shared=rank/);assert.ok(!share.includes(q.country.name.en));assert.ok(!share.includes(q.correct));
});
test('wrong choice turns red immediately, identifies the winner and blocks duplicate saves and early next',async()=>{
 let saved=state(),writes=0;const wait=deferred();const wrong=saved.question.options.find(o=>o.id!==saved.question.correct);
 globalThis.transport={api:async()=>clone(saved),post:async(path,body)=>{writes++;await wait.promise;saved={...saved,phase:'reveal',version:1,answers:[{value:body.answer,correct:false}]};return clone(saved);}};
 let r;await act(async()=>{r=create(React.createElement(RankGame,{id:saved.id,app}));});
 const button=cards(r).find(c=>c.props['aria-label']===wrong.label.en);
 await act(async()=>{button.props.onClick();});
 assert.equal(writes,0,'Selecting a card does not submit');assert.equal(confirm(r).props.disabled,false);
 const submit=confirm(r).props.onClick;await act(async()=>{submit();submit();});
 assert.equal(writes,1);assert.equal(cards(r).filter(c=>c.props.className.includes('rank-wrong')).length,1);assert.equal(cards(r).filter(c=>c.props.className.includes('rank-best')).length,1);
 assert.ok(cards(r).every(c=>c.props.disabled));assert.equal(next(r).props.disabled,true);
 const feedback=r.root.find(n=>n.props.className==='rank-feedback is-wrong');assert.ok(feedback.findAll(n=>n.type==='p').some(n=>n.children.some(s=>typeof s==='string'&&s.includes(wrong.label.en))));
 await act(async()=>{wait.resolve();await wait.promise;});assert.equal(next(r).props.disabled,false);await act(async()=>r.unmount());
 await act(async()=>{r=create(React.createElement(RankGame,{id:saved.id,app}));});assert.equal(cards(r).filter(c=>c.props.className.includes('rank-wrong')).length,1);await act(async()=>r.unmount());
});
test('lost saved response reconciles once, while an unsaved guess requires explicit recovery',async()=>{
 for(const committed of [true,false]){
  let saved=state(),writes=0;
  globalThis.transport={api:async()=>clone(saved),post:async(path,body)=>{writes++;if(committed)saved={...saved,phase:'reveal',version:1,answers:[{value:body.answer,correct:body.answer===saved.question.correct}]};throw Error('network');}};
  let r;await act(async()=>{r=create(React.createElement(RankGame,{id:saved.id,app}));});await act(async()=>{cards(r)[0].props.onClick();});await act(async()=>{confirm(r).props.onClick();});assert.equal(writes,1);
  assert.equal(r.root.findAll(n=>n.props.role==='alert').length,committed?0:1);
  if(!committed){assert.ok(cards(r).every(c=>c.props.disabled));await act(async()=>{r.root.findAll(n=>n.type==='button'&&n.children.includes(messages.en.retry))[0].props.onClick();});assert.ok(cards(r).every(c=>!c.props.disabled));}
  await act(async()=>r.unmount());
 }
});
