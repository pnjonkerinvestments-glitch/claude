import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import fs from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

fs.mkdirSync('.test-runtime', { recursive: true });
await build({ stdin: { contents: "export { Question } from './components/game/Question'; export { SoloResults } from './components/game/SoloResults'; export { messages } from './i18n/messages';", resolveDir: process.cwd() }, outfile: '.test-runtime/learning-ui.mjs', bundle: true, format: 'esm', platform: 'node', jsx: 'automatic', external: ['react', 'react/*', 'react-dom', 'react-dom/*', 'lucide-react'] });
const { Question, SoloResults, messages } = await import('../.test-runtime/learning-ui.mjs');
const t = key => messages.en[key] ?? key;
const q = { id: 'capitals:example', mode: 'capitals', prompt: { en: 'What is the capital of France?' }, options: [{ id: 'FRA', en: 'Paris' }, { id: 'ESP', en: 'Madrid' }] };
const feedback = { mode: 'capitals', correct: true, correctAnswer: 'FRA', answerLabel: { en: 'Paris' }, fact: { en: 'Paris is the capital of France.' }, points: 1500, distance: null, streak: 1 };

test('solo feedback displays the correct answer and fact without points; multiplayer retains points', () => {
    const props = { question: q, feedback, locked: true, onAnswer() {}, onReport() {}, t, locale: 'en' };
    const solo = renderToStaticMarkup(React.createElement(Question, { ...props, competitive: false }));
    assert.match(solo, /You got it!/);
    assert.match(solo, /Paris is the capital/);
    assert.match(solo, /🎉/);
    assert.doesNotMatch(solo, /1,500|1500|points| pts/);
    const multiplayer = renderToStaticMarkup(React.createElement(Question, props));
    assert.match(multiplayer, /1,500/);
    assert.ok(multiplayer.includes(' ' + t('points')));
});

test('solo results omit legacy scores, XP and time while keeping discoveries and progress', () => {
    const result = { answers: [{ ...feedback, correct: false }], settings: { mode: 'capitals' }, score: 987654, xp: 654321, duration: 999999, bestStreak: 0 };
    const html = renderToStaticMarkup(React.createElement(SoloResults, { result, t, locale: 'en', onAgain() {}, onShare() {}, onHome() {}, dailyStreak: 1 }));
    assert.match(html, /correct answers/);
    assert.match(html, /New things you know/);
    assert.match(html, /Paris/);
    assert.doesNotMatch(html, /987|654|999|points|XP|game-timer/);
});


test('country flags accompany known names, but flag-quiz choices reveal flags only after answering', () => {
 const question = { ...q, mode: 'flags', country: undefined, options: [{id:'FRA', en:'France', flag:'/flags/fr.svg'},{id:'ESP',en:'Spain',flag:'/flags/es.svg'}] };
 const props = { question, locked:false, onAnswer(){}, onReport(){},t,locale:'en',competitive:false };
 const before = renderToStaticMarkup(React.createElement(Question, props));
 assert.doesNotMatch(before, /src="\/flags\//);
 const after = renderToStaticMarkup(React.createElement(Question, {...props,feedback}));
 assert.match(after, /src="\/flags\/fr.svg"/);
 const borders = renderToStaticMarkup(React.createElement(Question, {...props, question:{...question,mode:'borders',country:{en:'France',flag:'/flags/fr.svg'}}}));
 assert.match(borders, /question-country/);assert.match(borders, /option-country/);assert.match(borders, /src="\/flags\/es.svg"/);
});


test('wrong ordering marks every misplaced row and gives its correct position, including after reload',()=>{
 const options=[{id:'CAF',en:'Central African Republic',flag:'/flags/cf.svg'},{id:'GUY',en:'Guyana',flag:'/flags/gy.svg'},{id:'NAM',en:'Namibia',flag:'/flags/na.svg'},{id:'NZL',en:'New Zealand',flag:'/flags/nz.svg'}];
 const question={id:'order:screenshot',mode:'order',prompt:{en:'Put these countries in order.'},options};
 const result={...feedback,correct:false,value:['CAF','GUY','NAM','NZL'],correctAnswer:['NAM','CAF','NZL','GUY'],answerLabel:{en:'Namibia → Central African Republic → New Zealand → Guyana'},fact:{en:'Area in square kilometres.'}};
 const html=renderToStaticMarkup(React.createElement(Question,{question,feedback:result,locked:true,onAnswer(){},onReport(){},t,locale:'en',competitive:false}));
 assert.equal((html.match(/class="order-item order-wrong"/g)||[]).length,4);
 for(const position of [1,2,3,4])assert.ok(html.includes('Belongs at #'+position));
 assert.match(html,/Correct order/);assert.match(html,/4 countries are in the wrong position/);
 assert.doesNotMatch(html,/order-controls/);
 const partial=renderToStaticMarkup(React.createElement(Question,{question,feedback:{...result,value:['NAM','CAF','GUY','NZL']},locked:true,onAnswer(){},onReport(){},t,locale:'en',competitive:false}));
 assert.equal((partial.match(/class="order-item order-wrong"/g)||[]).length,2);
 assert.equal((partial.match(/class="order-item order-correct"/g)||[]).length,2);
});

test('wrong choice and typed answer remain marked red when reloading the revealed round',()=>{
 const props={question:q,feedback:{...feedback,correct:false,value:'ESP'},locked:true,onAnswer(){},onReport(){},t,locale:'en',competitive:false};
 const html=renderToStaticMarkup(React.createElement(Question,props));
 assert.match(html,/is-wrong is-selected/);assert.match(html,/Your answer/);assert.match(html,/Madrid/);assert.match(html,/Correct answer/);
 const typed=renderToStaticMarkup(React.createElement(Question,{...props,question:{...q,typed:true},feedback:{...props.feedback,value:'Lyon'}}));
 assert.match(typed,/input-wrong/);assert.match(typed,/aria-invalid="true"/);assert.match(typed,/value="Lyon"/);assert.match(typed,/Paris/);
});
