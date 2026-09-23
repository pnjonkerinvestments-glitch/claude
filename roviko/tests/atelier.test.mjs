import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {build} from 'esbuild';
import postcss from 'postcss';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
fs.mkdirSync('.test-runtime',{recursive:true});
await build({stdin:{contents:"export {collectStamps,passportMilestone} from './lib/passport';export {returnDestination,navigationState} from './lib/navigation';export {messages} from './i18n/messages';export {GameCover} from './components/atelier/GameCover';export {DailyRhythm} from './components/atelier/DailyRhythm';",resolveDir:process.cwd()},bundle:true,format:'esm',platform:'node',outfile:'.test-runtime/atelier.mjs',jsx:'automatic',external:['react','react/*','lucide-react']});
const {collectStamps,passportMilestone,returnDestination,navigationState,messages,GameCover,DailyRhythm}=await import('../.test-runtime/atelier.mjs');
test('country stamps distinguish first discoveries from repeated knowledge and choose the closest milestone',()=>{
  const countries=JSON.parse(fs.readFileSync('lib/data/countries.json','utf8'));
  const rows=[{country_id:'FRA',mode:'flags',games:1},{country_id:'FRA',mode:'capitals',games:3},{country_id:'ESP',mode:'flags',games:2},{country_id:'FAKE',mode:'flags',games:8}];
  const stamps=collectStamps(rows,countries);assert.equal(stamps.length,2);assert.deepEqual(stamps.find(c=>c.id==='FRA').seals,['capitals']);assert.equal(stamps.find(c=>c.id==='ESP').seals.length,0);
  assert.deepEqual(passportMilestone(stamps),{region:'Europe',count:2,target:5});assert.deepEqual(collectStamps([...rows,rows[0]],countries),stamps);
});
test('back navigation keeps the original game entry and scroll through a follow-up and rejects external destinations',()=>{
  const state=navigationState('/daily',345,{},'/game/first');
  assert.deepEqual(returnDestination(navigationState('/game/first',0,state,'/puzzle/second')),{path:'/daily',scroll:345});
  assert.deepEqual(returnDestination({returnTo:{path:'https://untrusted.test',scroll:-3}}),{path:'/',scroll:0});
  assert.deepEqual(returnDestination(null),{path:'/',scroll:0});
});
test('translations remain complete and daily covers have decorative responsive local images',()=>{
  assert.deepEqual(Object.keys(messages.en).sort(),Object.keys(messages.nl).sort());
  for(const mode of ['daily','compare','mosaic','rank']){
    const html=renderToStaticMarkup(React.createElement(GameCover,{mode}));assert.match(html,/alt=""/);assert.match(html,/width="960" height="640"/);assert.match(html,/srcSet="[^"]+480w, [^"]+960w"/);
    const paths=[...html.matchAll(/\/art\/[a-z-]+-(?:480|960)\.webp/g)].map(m=>m[0]);assert.ok(paths.length>=2);
    for(const path of paths)assert.ok(fs.statSync('public'+path).size<40000);
    for(const key of ['cardVerb'+mode,'soloPace'])assert.ok(messages.en[key] && messages.nl[key]);
  }
});
test('the daily calendar reflects saved days, labels dates accessibly and shows the actual next topic',()=>{
  const week=Array.from({length:7},(_,i)=>({date:`2026-09-${15+i}`,completed:[0,3,4].includes(i)}));
  const props={week,date:'2026-09-21',tomorrowTopic:{emoji:'🏔️',label:{en:'Elevation',nl:'Hoogte'}}};
  for(const locale of ['en','nl']){
    const html=renderToStaticMarkup(React.createElement(DailyRhythm,{...props,locale,t:key=>messages[locale][key]}));
    assert.equal((html.match(/<time /g)||[]).length,7);assert.equal((html.match(/class="played /g)||[]).length,3);
    assert.equal((html.match(/aria-current="date"/g)||[]).length,1);
    assert.match(html,/<time dateTime="2026-09-21" aria-current="date" aria-label="[^\"]+ · (Not played|Nog niet gespeeld)"/);
    assert.ok(html.includes(messages[locale].weekPlayed.replace('{n}','3')));
    assert.ok(html.includes(props.tomorrowTopic.label[locale]));
  }
});
function lum(hex){hex=hex.replace('#','');if(hex.length===3)hex=hex.split('').map(v=>v+v).join('');const c=hex.match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return .2126*c[0]+.7152*c[1]+.0722*c[2];}
function contrast(a,b){const [x,y]=[lum(a),lum(b)].sort((a,b)=>b-a);return (x+.05)/(y+.05);}
const css=postcss.parse(['globals','revamp','atelier','rank'].map(f=>fs.readFileSync('app/'+f+'.css','utf8')).join('\n'));
test('text contrast meets 4.5:1 for both themes, all daily card surfaces and red feedback',()=>{
  const evidence=[];
  for(const theme of ['light','dark']){
    const vars={};css.walkRules(rule=>{if(rule.parent.type!=='root')return;if(rule.selector.split(',').some(s=>s.trim()===':root'||s.trim()===`:root[data-theme=${theme}]`))rule.walkDecls(d=>{if(d.prop.startsWith('--'))vars[d.prop]=d.value;});});
    const pairs=[['body','--foreground','--background'],['muted','--muted-foreground','--background'],['primary button','--primary-foreground','--primary'],['red feedback','--error-ink','--error-bg'],...['--trip','--compare','--mosaic'].flatMap(bg=>[[bg+' heading','--ink',bg],[bg+' text','--ink-soft',bg]])];
    for(const [label,fg,bg]of pairs){const ratio=contrast(vars[fg],vars[bg]);assert.ok(ratio>=4.5,`${theme} ${label}: ${ratio.toFixed(2)}`);evidence.push({theme,label,foreground:vars[fg],background:vars[bg],ratio:Number(ratio.toFixed(2))});}
  }
  fs.writeFileSync('.test-runtime/contrast.json',JSON.stringify(evidence,null,2));
});
