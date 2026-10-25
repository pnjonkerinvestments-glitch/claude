import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import fs from 'node:fs';
// 1.50: the app reminder names the streak only on the one day it is really at stake.
fs.mkdirSync('.test-runtime',{recursive:true});
await build({stdin:{contents:"export { reminderText, reminderMinute, luciaAt } from './components/atelier/NativeReminder'; export { messages } from './i18n/messages';",resolveDir:process.cwd(),loader:'tsx'},bundle:true,format:'esm',platform:'node',outfile:'.test-runtime/reminder.mjs',external:['react','react-dom','lucide-react'],jsx:'automatic',loader:{'.json':'json'}});
const {reminderText,luciaAt,messages}=await import('../.test-runtime/reminder.mjs');
const t=k=>messages.nl[k]??k;
test('reminder text (1.50): streak on the day it is at stake, the weekday line otherwise',()=>{
 const sunday=new Date('2026-10-25T12:00:00');
 assert.match(reminderText(t,0,sunday,false,5),/reeks van 5 dagen/,'not played yet: today names the streak');
 assert.doesNotMatch(reminderText(t,1,sunday,false,5),/reeks van/,'tomorrow the streak is already gone');
 assert.match(reminderText(t,1,sunday,true,5),/reeks van 5 dagen/,'played today: tomorrow is the day at stake');
 assert.equal(reminderText(t,0,sunday,false,1),t('reminder'+(sunday.getDay()+1)),'a streak of 1 is no streak yet');
 for(const l of ['en','nl','es'])assert.ok(messages[l].reminderStreak.includes('{n}'),l);
});

test('Lucia in the app (1.52): a day after the visit, always in the daytime on the phone',()=>{
 const at=d=>luciaAt(new Date(d));
 assert.equal(at('2026-10-25T14:00:00').getHours(),14,'afternoon visit: same time the next day');
 const morning=at('2026-10-25T06:30:00');assert.equal(morning.getHours(),10);assert.equal(morning.getDate(),26,'early: waits until 10:00');
 const evening=at('2026-10-25T21:00:00');assert.equal(evening.getHours(),10);assert.equal(evening.getDate(),27,'evening: 10:00 the day after');
 for(const l of ['en','nl','es']){assert.match(messages[l].luciaNotifTitle,/Lucia/);for(const k of ['luciaNotifBody','luciaNotif2','luciaNotif3'])assert.doesNotMatch(messages[l][k],/15/,'no question count, the owner asked: '+l+' '+k);}
});
