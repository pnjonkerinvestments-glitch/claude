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
const css=postcss.parse(['globals','revamp','atelier','rank','playful','polish','design'].map(f=>fs.readFileSync('app/'+f+'.css','utf8')).join('\n'));
test('text contrast meets 4.5:1 for both themes, all daily card surfaces and red feedback',()=>{
  const evidence=[];
  for(const theme of ['light','dark']){
    const vars={};css.walkRules(rule=>{if(rule.parent.type!=='root')return;if(rule.selector.split(',').some(s=>s.trim()===':root'||s.trim()===`:root[data-theme=${theme}]`))rule.walkDecls(d=>{if(d.prop.startsWith('--'))vars[d.prop]=d.value;});});
    const pairs=[['body','--foreground','--background'],['muted','--muted-foreground','--background'],['primary button','--primary-foreground','--primary'],['link','--link','--background'],['link on card','--link','--card'],['gold button','--color-gold-ink','--color-gold'],['muted on card','--muted-foreground','--card'],['red feedback','--error-ink','--error-bg'],...['--trip','--compare','--mosaic'].flatMap(bg=>[[bg+' heading','--ink',bg],[bg+' text','--ink-soft',bg]])];
    const resolve=v=>{for(let i=0;i<6&&/^var\(/.test(v??'');i++)v=vars[v.slice(4,-1).split(',')[0].trim()];return v;};for(const k of Object.keys(vars))vars[k]=resolve(vars[k]);
    for(const [label,fg,bg]of pairs){const ratio=contrast(vars[fg],vars[bg]);assert.ok(ratio>=4.5,`${theme} ${label}: ${ratio.toFixed(2)}`);evidence.push({theme,label,foreground:vars[fg],background:vars[bg],ratio:Number(ratio.toFixed(2))});}
  }
  fs.writeFileSync('.test-runtime/contrast.json',JSON.stringify(evidence,null,2));
});

test('1.17 illustrations: every artwork the interface references exists and stays light', () => {
  const files = ['components/home/CoverArt.tsx', 'components/atelier/GameCover.tsx', 'components/pages/ExplorePage.tsx', 'components/pages/MultiplayerPage.tsx', 'components/home/HomePage.tsx', 'components/atelier/HowToPlay.tsx', 'components/atelier/PassportCollection.tsx', 'components/atelier/DailyQuests.tsx', 'components/pages/ScoringPage.tsx', 'components/RovikoApp.tsx', 'components/friends/Friends.tsx'];
  const src = files.map(f => fs.readFileSync(f, 'utf8')).join('\n');
  const direct = [...src.matchAll(/\/art\/([a-z0-9-]+\.webp)/g)].map(m => m[1]);
  const regions = ['europe', 'africa', 'asia', 'north-america', 'south-america', 'oceania'];
  const covers = ['rank-radar', 'world-trip', 'side-by-side', 'country-mosaic', 'clue-trail'].flatMap(n => [n + '-480.webp', n + '-960.webp']);
  const scenes = ['duel', 'mystery', 'classic'].flatMap(n => [n + '-480.webp', n + '-720.webp']);
  const perRegion = regions.flatMap(r => ['scene-' + r + '.webp', 'banner-' + r + '.webp', 'pick-' + r + '.webp']);
  const classics = ['trail', 'capitals', 'flags', 'pinpoint', 'borders', 'order'].map(m => 'classic-' + m + '.webp');
  const facts = ['points', 'day', 'once', 'timer'].map(f => 'fact-' + f + '.webp');
  const headers = [];
  for (const f of ['components/RovikoApp.tsx', 'components/friends/Friends.tsx', 'components/pages/PassportPage.tsx', 'components/pages/ExplorePage.tsx', 'components/pages/RankingsPage.tsx', 'components/pages/ScoringPage.tsx', 'components/pages/MultiplayerPage.tsx', 'components/atelier/HowToPlay.tsx']) for (const m of fs.readFileSync(f, 'utf8').matchAll(/art="([a-z0-9-]+)"/g)) headers.push(m[1] + '.webp');
  assert.ok(headers.length >= 8, 'page headers carry artwork');
  for (const name of new Set([...direct, ...covers, ...scenes, ...perRegion, ...classics, ...facts, ...headers])) {
    const path = 'public/art/' + name;
    assert.ok(fs.existsSync(path), 'missing artwork ' + path);
    assert.ok(fs.statSync(path).size < 140_000, name + ' is too heavy');
  }
  // Nothing orphaned: every file in public/art is used somewhere.
  const used = new Set([...direct, ...covers, ...scenes, ...perRegion, ...classics, ...facts, ...headers]);
  for (const file of fs.readdirSync('public/art')) assert.ok(used.has(file), 'unused artwork public/art/' + file);
});

test('1.17 every game has its own logo, used wherever a game is named', () => {
  const icon = fs.readFileSync('components/atelier/GameIcon.tsx', 'utf8');
  for (const mode of ['rank', 'daily', 'compare', 'mosaic', 'trail', 'duel', 'mystery', 'capitals', 'flags', 'pinpoint', 'borders', 'order', 'mixed', 'room']) assert.match(icon, new RegExp('\\n  ' + mode + ': <>'), 'logo for ' + mode);
  assert.doesNotMatch(icon, /lucide-react/, 'logos are drawn, not borrowed icons');
  for (const f of ['components/puzzles/PuzzleDeck.tsx', 'components/RovikoApp.tsx', 'components/pages/ScoringPage.tsx', 'components/atelier/DailyQuests.tsx', 'components/atelier/HowToPlay.tsx']) assert.match(fs.readFileSync(f, 'utf8'), /<GameIcon /, f + ' shows game logos');
  assert.doesNotMatch(fs.readFileSync('components/puzzles/PuzzleDeck.tsx', 'utf8'), /puzzle-sticker/);
});

test('1.17 explore and passport: region cards use cleaned scenes; the copy keeps its own space on phones', () => {
  const css = fs.readFileSync('app/design.css', 'utf8');
  const v17 = css.slice(css.indexOf('/* ===================================================================================\n   1.17'));
  assert.match(v17, /\.scene-card \.region-copy\{max-width:62%/);
  assert.match(v17, /\.region-card\.scene-card,\[data-theme=dark\] \.region-card\.scene-card\{aspect-ratio:418\/310/);
  for (const f of ['components/pages/ExplorePage.tsx', 'components/atelier/PassportCollection.tsx']) {
    const src = fs.readFileSync(f, 'utf8');
    assert.match(src, /scene-card/); assert.match(src, /banner-/); assert.doesNotMatch(src, /region-flags|region-stamp-grid/);
  }
});

test('1.18 daily results are one short card and games keep the way on in reach on phones', () => {
 const result = fs.readFileSync('components/atelier/DailyResult.tsx', 'utf8');
 assert.match(result, /resultBeaten/); assert.match(result, /competitionRank/);
 for (const f of ['components/RovikoApp.tsx', 'components/puzzles/RankGame.tsx', 'components/puzzles/PuzzleGame.tsx']) { const s = fs.readFileSync(f, 'utf8'); assert.match(s, /<DailyResult /, f); assert.doesNotMatch(s, /<DailyLoop |<CompetitionPanel app=\{app\} date=/, f); }
 const css = fs.readFileSync('app/design.css', 'utf8');
 assert.match(css, /\.solo-next-row,\.rank-controls:has\(\.btn\.primary\),\.puzzle-bottom:has\(\.btn\.primary\),\.duel-next\{position:fixed!important/);
 assert.match(css, /\.topbar\.is-game\{display:none\}/);
});
