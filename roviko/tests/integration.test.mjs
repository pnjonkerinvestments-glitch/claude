import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {Miniflare} from 'miniflare';
import fs from 'node:fs/promises';
const ips = new Map();
let mf,db;const origin='http://roviko.test';
before(async()=>{await fs.mkdir('.test-runtime',{recursive:true});await build({stdin:{contents:"import {handleApi} from './server/api';export default {fetch:handleApi};",resolveDir:process.cwd()},bundle:true,outfile:'.test-runtime/api.mjs',format:'esm',platform:'browser'});mf=new Miniflare({modules:true,scriptPath:'.test-runtime/api.mjs',compatibilityDate:'2025-03-01',compatibilityFlags:['nodejs_compat'],d1Databases:['DB'],serviceBindings:{ASSETS:async req=>{try{return new Response(await fs.readFile('public'+new URL(req.url).pathname));}catch{return new Response('Not found',{status:404});}}},bindings:{ENVIRONMENT:'test'},log:undefined});db=await mf.getD1Database('DB');const migrations=(await fs.readdir('drizzle')).filter(x=>x.endsWith('.sql')).sort();for(const file of migrations){const sql=await fs.readFile('drizzle/'+file,'utf8');for(const stmt of sql.split('--> statement-breakpoint'))if(stmt.trim())await db.prepare(stmt.trim()).run();}});
after(async()=>{await mf?.dispose();});
async function request(cookie,path,method='GET',body){const res=await mf.dispatchFetch(origin+'/api'+path,{method,headers:{...(cookie?{Cookie:cookie}:{}),Origin:origin,'CF-Connecting-IP': (()=>{if(!ips.has(cookie))ips.set(cookie,ips.size+1);return '203.0.113.'+ips.get(cookie)})(),'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});return {status:res.status,data:await res.json(),cookie:res.headers.get('Set-Cookie')?.split(';')[0]};}
async function bootstrap(){const r=await request(null,'/bootstrap');assert.equal(r.status,200,JSON.stringify(r.data));return r;}
async function stored(code){const r=await db.prepare('SELECT * FROM multiplayer_rooms WHERE code=?').bind(code).first();return JSON.parse(r.state);}
async function alter(code,fn){const r=await stored(code);fn(r);await db.prepare('UPDATE multiplayer_rooms SET state=?,version=version+1 WHERE code=?').bind(JSON.stringify(r),code).run();}
const settings={mode:'flags',count:5,timer:5,difficulty:'medium',region:'World'};
test('a personal retry contains only misses, preserves Europe, resumes once and cannot alter the source result',async()=>{
 const a=await bootstrap();let g=(await request(a.cookie,'/games','POST',{settings:{...settings,region:'Europe'}})).data;const misses=[];
 while(g.phase!=='finished'){
  const correct=g.question.solution.correct;const wrong=g.round<2; if(wrong)misses.push(g.question.solution.countryId);
  const answer=wrong?g.question.options.find(o=>o.id!==correct).id:correct;
  assert.equal((await request(a.cookie,'/games/'+g.id+'/answer','POST',{round:g.round,answer})).status,200);
  g=(await request(a.cookie,'/games/'+g.id+'/next','POST',{})).data;
 }
 const original=structuredClone(g);const [first,again]=await Promise.all([request(a.cookie,'/next-round','POST',{sessionId:g.id,intent:'review'}),request(a.cookie,'/next-round','POST',{sessionId:g.id,intent:'review'})]);
 assert.equal(first.status,200,JSON.stringify(first.data));assert.equal(first.data.href,again.data.href);
 const other=await bootstrap();assert.equal((await request(other.cookie,'/next-round','POST',{sessionId:g.id,intent:'review'})).status,404);
 let retry=(await request(a.cookie,first.data.href.replace('/game/','/games/'))).data;assert.equal(retry.total,2);assert.equal(retry.settings.region,'Europe');assert.equal(retry.daily,null);assert.equal(retry.practice,true);assert.equal(retry.settings.timer,0);
 for(const country of misses){assert.equal(retry.question.solution.countryId,country);await request(a.cookie,'/games/'+retry.id+'/answer','POST',{round:retry.round,answer:retry.question.solution.correct});retry=(await request(a.cookie,'/games/'+retry.id+'/next','POST',{})).data;}
 assert.equal(retry.phase,'finished');assert.equal(retry.score,0);
 const after=(await request(a.cookie,'/games/'+g.id)).data;assert.deepEqual(after.answers,original.answers);
 const beforeStamps=(await request(a.cookie,'/profile')).data.stats.stamps;await request(a.cookie,'/games/'+retry.id);await request(a.cookie,'/games/'+retry.id);assert.deepEqual((await request(a.cookie,'/profile')).data.stats.stamps,beforeStamps);
 const following=await request(a.cookie,'/next-round','POST',{sessionId:retry.id,intent:'next'});assert.equal(following.status,200,JSON.stringify(following.data));const next=(await request(a.cookie,following.data.href.replace('/game/','/games/'))).data;assert.equal(next.settings.mode,'capitals');assert.equal(next.settings.region,'Europe');assert.equal(next.total,5);assert.equal(next.daily,null);
});

test('comparison retries stop at five missed questions, retain units and years, and keep the official daily result',async()=>{
 const a=await bootstrap();let p=(await request(a.cookie,'/puzzles','POST',{mode:'compare'})).data;const misses=[];
 while(p.phase!=='finished'){const q=structuredClone(p.question);const wrong=p.round<6;if(wrong)misses.push(q);const answer=wrong?q.countries.find(c=>c.id!==q.correct).id:q.correct;const saved=await request(a.cookie,'/puzzles/'+p.id+'/answer','POST',{version:p.version,answer});assert.equal(saved.status,200);p=(await request(a.cookie,'/puzzles/'+p.id+'/next','POST',{version:saved.data.version})).data;}
 const retry=await request(a.cookie,'/next-round','POST',{sessionId:p.id,intent:'review'});assert.equal(retry.status,200,JSON.stringify(retry.data));let fresh=(await request(a.cookie,retry.data.href.replace('/puzzle/','/puzzles/'))).data;
 assert.equal(fresh.total,5);assert.equal(fresh.daily,null);assert.equal(fresh.practice,true);
 for(let i=0;i<5;i++){assert.deepEqual(fresh.question,{...misses[i],carried:false});const saved=await request(a.cookie,'/puzzles/'+fresh.id+'/answer','POST',{version:fresh.version,answer:fresh.question.correct});assert.equal(saved.status,200);fresh=(await request(a.cookie,'/puzzles/'+fresh.id+'/next','POST',{version:saved.data.version})).data;}
 assert.equal(fresh.phase,'finished');const daily=(await request(a.cookie,'/puzzles','POST',{mode:'compare'})).data;assert.equal(daily.id,p.id);assert.equal(daily.answers.filter(a=>a.correct).length,4);assert.equal((await request(a.cookie,'/profile')).data.stats.dailyCount,1);
});

test('a completed Mosaic opens a targeted retry for its mismatched flag',async()=>{
 const a=await bootstrap();let p=(await request(a.cookie,'/puzzles','POST',{mode:'mosaic',daily:false})).data;const country=p.board.countries[0].id,group=p.board.tiles.filter(t=>t.countryId===country);
 const wrong=[...group.filter(t=>t.kind!=='flag').map(t=>t.id),p.board.tiles.find(t=>t.kind==='flag'&&t.countryId!==country).id];
 p=(await request(a.cookie,'/puzzles/'+p.id+'/answer','POST',{version:p.version,answer:wrong})).data;
 for(const c of p.board.countries)p=(await request(a.cookie,'/puzzles/'+p.id+'/answer','POST',{version:p.version,answer:p.board.tiles.filter(t=>t.countryId===c.id).map(t=>t.id)})).data;
 assert.equal(p.phase,'finished');const start=await request(a.cookie,'/next-round','POST',{sessionId:p.id,intent:'review'});assert.equal(start.status,200,JSON.stringify(start.data));const retry=(await request(a.cookie,start.data.href.replace('/game/','/games/'))).data;assert.equal(retry.total,1);assert.equal(retry.question.mode,'flags');assert.equal(retry.question.solution.countryId,country);assert.equal(retry.daily,null);
});

test('knowledge seals count distinct games, survive refresh and never double-award within the same game',async()=>{
 const a=await bootstrap();
 for(let i=0;i<5;i++)await db.prepare('INSERT INTO answers(session_id,round,user_id,question_id,country_id,mode,answer,correct,points,response_time,risk,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').bind('seal-game-1',i,a.data.user.id,'q'+i,'FRA','flags','FRA',1,0,1000,0,Date.now()).run();
 const profile=async()=>(await request(a.cookie,'/profile')).data.stats;
 let s=await profile();assert.equal(s.stamps.length,1);assert.deepEqual(s.stamps[0].seals,[]);
 for(let i=2;i<=3;i++)await db.prepare('INSERT INTO answers(session_id,round,user_id,question_id,country_id,mode,answer,correct,points,response_time,risk,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').bind('seal-game-'+i,0,a.data.user.id,'q'+i,'FRA','flags','FRA',1,0,1000,0,Date.now()).run();
 s=await profile();assert.equal(s.stamps.length,1);assert.deepEqual(s.stamps[0].seals,['flags']);assert.deepEqual((await profile()).stamps,s.stamps);
});
test('guest singleplayer, locked answers, results, account upgrade, stats, export and deletion',async()=>{
 const b=await bootstrap(),cookie=b.cookie;assert.ok(b.data.user.guest);const start=await request(cookie,'/games','POST',{settings:{...settings,timer:0}});assert.equal(start.status,200);let game=start.data;assert.ok(!('correct' in game.question));assert.ok(!game.question.id.includes(':BRA'));
 for(let i=0;i<5;i++){const row=await db.prepare('SELECT state FROM game_sessions WHERE id=?').bind(game.id).first();const s=JSON.parse(row.state);s.startAt=Date.now()-1000;await db.prepare('UPDATE game_sessions SET state=? WHERE id=?').bind(JSON.stringify(s),game.id).run();const q=s.questions[i];const body={round:i,answer:q.correct,score:9999999};const answers=await Promise.all([request(cookie,'/games/'+game.id+'/answer','POST',body),request(cookie,'/games/'+game.id+'/answer','POST',body)]);assert.equal(answers.filter(a=>a.status===200).length,1);assert.equal(answers.filter(a=>a.status===409).length,1);assert.equal(answers.find(a=>a.status===200).data.feedback.points,0);const next=await request(cookie,'/games/'+game.id+'/next','POST',{});assert.equal(next.status,200,JSON.stringify(next.data));game=next.data;}
 assert.equal(game.phase,'finished');assert.equal(game.score,0);assert.equal(game.xp,0);const account=await request(cookie,'/auth/signup','POST',{email:'solo-test@example.test',password:'Synthetic-test-password-8462',name:'Test Navigator'});assert.equal(account.status,200,JSON.stringify(account.data));assert.equal(account.data.user.id,b.data.user.id);assert.equal(account.data.user.guest,false);const saved=await request(account.cookie,'/profile');assert.equal(saved.data.stats.games,1);assert.equal(saved.data.stats.accuracy,100);assert.equal(saved.data.stats.score,0);assert.equal(saved.data.stats.xp,0);assert.ok(saved.data.stats.achievements.includes('first'));const auth=await request(null,'/auth/login','POST',{email:'solo-test@example.test',password:'Synthetic-test-password-8462'});assert.equal(auth.status,200);const bad=await request(null,'/auth/login','POST',{email:'solo-test@example.test',password:'Incorrect-test-password-1234'});assert.equal(bad.status,401);const exported=await request(auth.cookie,'/export');assert.equal(exported.data.results.length,1);assert.ok(!JSON.stringify(exported.data).includes('Synthetic-test-password'));const report=await request(auth.cookie,'/reports','POST',{questionId:'flags:sample',template:'flags',category:'translation',detail:'Synthetic test report'});assert.equal(report.status,200);assert.equal((await request(auth.cookie,'/admin')).status,403);assert.equal((await request(auth.cookie,'/profile','DELETE')).status,200);assert.equal((await db.prepare('SELECT COUNT(*) count FROM game_results WHERE user_id=?').bind(b.data.user.id).first()).count,0);
});
test('same UTC daily for two guests, five complete rounds and immutable first result',async()=>{const a=await bootstrap(),b=await bootstrap();const sa=await request(a.cookie,'/games','POST',{settings:{...settings,mode:'daily'}}),sb=await request(b.cookie,'/games','POST',{settings:{...settings,mode:'daily'}});assert.deepEqual(sa.data.question,sb.data.question);let g=sa.data;for(let i=0;i<5;i++){const row=await db.prepare('SELECT state FROM game_sessions WHERE id=?').bind(g.id).first();const state=JSON.parse(row.state);state.startAt=Date.now()-1000;await db.prepare('UPDATE game_sessions SET state=? WHERE id=?').bind(JSON.stringify(state),g.id).run();assert.equal((await request(a.cookie,'/games/'+g.id+'/answer','POST',{round:i,answer:state.questions[i].correct})).status,200);g=(await request(a.cookie,'/games/'+g.id+'/next','POST',{})).data;}assert.equal(g.phase,'finished');assert.equal(g.answers.length,5);const again=await request(a.cookie,'/games','POST',{settings:{...settings,mode:'daily'}});assert.equal(again.data.id,g.id);assert.equal(again.data.score,g.score);assert.equal((await db.prepare('SELECT COUNT(*) count FROM daily_challenge_results WHERE user_id=?').bind(a.data.user.id).first()).count,1);});
test('solo and daily ignore requested and legacy timers, produce no points, and validate independently',async()=>{
 const b=await bootstrap();
 for(const mode of ['flags','capitals','trail','pinpoint','borders','order','daily']){
  let g=(await request(b.cookie,'/games','POST',{settings:{...settings,mode,timer:5}})).data;
  assert.equal(g.deadline,null);assert.equal(g.settings.timer,0);assert.ok(g.question.solution);assert.ok(!('questions' in g));
  const row=await db.prepare('SELECT state FROM game_sessions WHERE id=?').bind(g.id).first(),state=JSON.parse(row.state);
  state.settings.timer=5;state.startedAt=Date.now()-3*86400000;state.startAt=Date.now()-3600000;state.score=12345;state.xp=999;
  await db.prepare('UPDATE game_sessions SET state=? WHERE id=?').bind(JSON.stringify(state),g.id).run();
  const resumed=(await request(b.cookie,'/games/'+g.id)).data;
  assert.equal(resumed.deadline,null);assert.equal(resumed.score,0);assert.equal(resumed.xp,0);
  const solved=await request(b.cookie,'/games/'+g.id+'/answer','POST',{round:0,answer:state.questions[0].correct,score:999999,points:999999});
  assert.equal(solved.status,200);assert.equal(solved.data.feedback.correct,true,mode);assert.equal(solved.data.feedback.points,0);assert.equal(solved.data.score,0);assert.equal(solved.data.feedback.risk,0);
  const audit=await db.prepare('SELECT * FROM answers WHERE session_id=?').bind(g.id).first();assert.equal(audit.points,0);assert.equal(audit.correct,1);
  const next=(await request(b.cookie,'/games/'+g.id+'/next','POST',{})).data;assert.equal(next.deadline,null);
  const wrong=await request(b.cookie,'/games/'+g.id+'/answer','POST',{round:1,answer:next.question.mode === 'pinpoint' ? [0,0] : next.question.mode === 'order' ? [...next.question.solution.correct].reverse() : next.question.options.find(o=>o.id!==next.question.solution.correct).id,correct:true,feedback:{correct:true}});
  assert.equal(wrong.data.feedback.correct,false);assert.equal(wrong.data.feedback.points,0);
 }
 assert.deepEqual((await request(b.cookie,'/leaderboard?category=daily')).data.entries,[]);
 assert.deepEqual((await request(b.cookie,'/leaderboard?category=score')).data.entries,[]);
});
test('two-player WebSocket rooms, synchronized rounds, score authority, rematch and reconnect',async()=>{
 const a=await bootstrap(),b=await bootstrap(),c=await bootstrap();const room=(await request(a.cookie,'/rooms','POST',{settings})).data;const code=room.code;assert.match(code,/^[A-Z2-9]{5}$/);assert.equal((await request(b.cookie,'/rooms/'+code+'/join','POST',{})).data.players.length,2);assert.equal((await request(b.cookie,'/rooms/'+code+'/start','POST',{})).status,403);assert.equal((await request(c.cookie,'/rooms/'+code+'/answer','POST',{round:0,answer:'USA'})).status,403);assert.equal((await request(b.cookie,'/rooms/'+code+'/bot','POST',{})).status,403);
 async function connect(cookie){const r=await mf.dispatchFetch(origin+'/api/rooms/'+code+'/socket',{headers:{Cookie:cookie,Origin:origin,Upgrade:'websocket'}});assert.equal(r.status,101);const ws=r.webSocket;ws.accept();const messages=[];ws.addEventListener('message',e=>messages.push(JSON.parse(e.data)));return {ws,messages};}
 const wa=await connect(a.cookie),wb=await connect(b.cookie);
 const waitFor=async(client,predicate)=>{const end=Date.now()+6000;while(Date.now()<end){const found=client.messages.find(predicate);if(found)return found;await new Promise(r=>setTimeout(r,50));}throw new Error('Expected WebSocket state not received: '+JSON.stringify(client.messages.slice(-2)));};
 wa.ws.send(JSON.stringify({type:'start'}));const firstA=await waitFor(wa,x=>x.phase==='countdown'),firstB=await waitFor(wb,x=>x.phase==='countdown');assert.deepEqual(firstA.question,firstB.question);assert.equal(firstA.startAt,firstB.startAt);assert.equal(firstA.question,null);assert.equal(firstB.question,null);const matchId=firstA.matchId;
 for(let i=0;i<5;i++){await alter(code,r=>{r.startAt=Date.now()-800;r.deadline=Date.now()+4000;});let g=(await request(a.cookie,'/rooms/'+code)).data;assert.equal(g.phase,'question');const raw=await stored(code);const correct=raw.questions[i].correct;const wrong=raw.questions[i].options.find(o=>o.id!==correct).id;wa.ws.send(JSON.stringify({type:'answer',round:i,matchId,answer:correct,score:9999999}));await waitFor(wa,x=>x.round===i&&x.answered);const noLeak=(await request(b.cookie,'/rooms/'+code)).data;assert.equal(noLeak.feedback,null);assert.equal(noLeak.players.find(p=>p.id===a.data.user.id).score,i===0?0:(await stored(code)).players.find(p=>p.id===a.data.user.id).score);assert.equal((await request(a.cookie,'/rooms/'+code+'/answer','POST',{round:i,matchId,answer:wrong})).status,409);assert.equal((await request(b.cookie,'/rooms/'+code+'/answer','POST',{round:i,matchId,answer:wrong})).status,200);if(i===0){const pending=(await request(a.cookie,'/rooms/'+code)).data;assert.equal(pending.phase,'question');assert.equal(pending.feedback,null);const target=pending.answersCompleteAt;assert.ok(target<Date.now()+1200);const [aReveal,bReveal]=await Promise.all([waitFor(wa,x=>x.phase==='reveal'&&x.round===i),waitFor(wb,x=>x.phase==='reveal'&&x.round===i)]);assert.ok(aReveal.serverTime>=target);assert.ok(bReveal.serverTime>=target);assert.ok(Math.max(aReveal.serverTime,bReveal.serverTime)-target<1800);assert.equal(aReveal.revealUntil,bReveal.revealUntil);assert.ok(aReveal.serverTime<pending.deadline,'Reveal does not wait out the round timer');g=aReveal;}else{await alter(code,r=>{r.deadline=Date.now()-1;if(r.answersCompleteAt)r.answersCompleteAt=Date.now()-1;});g=(await request(a.cookie,'/rooms/'+code)).data;}assert.equal(g.phase,'reveal');assert.ok(g.feedback.correct);assert.ok(g.feedback.points<=1750);assert.equal(g.players.find(p=>p.id===b.data.user.id).score,0);assert.equal((await request(b.cookie,'/rooms/'+code+'/answer','POST',{round:i,matchId,answer:correct})).status,409);await alter(code,r=>{r.revealUntil=Date.now()-1;});g=(await request(a.cookie,'/rooms/'+code)).data;assert.equal(g.phase,i===4?'finished':'countdown');}
 const final=(await request(a.cookie,'/rooms/'+code)).data;assert.equal(final.history.length,5,'match review has every round');for(const h of final.history){const me=h.players.find(p=>p.id===a.data.user.id),other=h.players.find(p=>p.id===b.data.user.id);assert.ok(me.correct&&me.points>0&&me.answer?.en);assert.ok(other,'opponent is in the review');assert.equal(other.points>0,other.correct);assert.equal(other.answered,!!other.answer);assert.ok(h.prompt.en&&h.answerLabel.en);}assert.equal(final.players[0].id,a.data.user.id);assert.ok(final.players[0].score<9000);assert.equal((await request(a.cookie,'/profile')).data.stats.wins,1);assert.equal((await request(b.cookie,'/profile')).data.stats.wins,0);const oldIds=(await stored(code)).questions.map(q=>q.id);const rematch=await request(a.cookie,'/rooms/'+code+'/rematch','POST',{});assert.equal(rematch.data.phase,'lobby');assert.equal(rematch.data.players.length,2);wa.ws.close();wb.ws.close();const again=await connect(b.cookie);await waitFor(again,x=>x.phase==='lobby');assert.equal((await request(b.cookie,'/rooms/'+code)).data.players.length,2);await alter(code,r=>{r.players.find(p=>p.id===a.data.user.id).lastSeen=Date.now()-40000;r.players.find(p=>p.id===b.data.user.id).lastSeen=Date.now();});assert.equal((await request(b.cookie,'/rooms/'+code)).data.host,b.data.user.id);const fresh=(await request(b.cookie,'/rooms/'+code+'/start','POST',{})).data;assert.equal(fresh.phase,'countdown');assert.ok(!(await stored(code)).questions.some(q=>oldIds.includes(q.id)));
 const rejoinedA=await connect(a.cookie);await waitFor(rejoinedA,x=>x.phase==='countdown');
 for(let i=0;i<5;i++){
  await alter(code,r=>{r.startAt=Date.now()-800;r.deadline=Date.now()+4000;});await request(b.cookie,'/rooms/'+code);const r=await stored(code),value=r.questions[i].correct;
  again.ws.send(JSON.stringify({type:'answer',round:i,matchId:fresh.matchId,answer:value}));rejoinedA.ws.send(JSON.stringify({type:'answer',round:i,matchId:fresh.matchId,answer:value}));
  await waitFor(again,x=>x.round===i&&x.answered&&x.matchId===fresh.matchId);await waitFor(rejoinedA,x=>x.round===i&&x.answered&&x.matchId===fresh.matchId);
  await alter(code,r=>{r.deadline=Date.now()-1;if(r.answersCompleteAt)r.answersCompleteAt=Date.now()-1;});{const shown=(await request(b.cookie,'/rooms/'+code)).data;assert.equal(shown.phase,'reveal');assert.equal(shown.roundAnswers.length,2,'reveal shows both players');assert.ok(shown.roundAnswers.every(x=>x.correct&&x.points>0&&x.answer?.en));}await alter(code,r=>{r.revealUntil=Date.now()-1;});await request(b.cookie,'/rooms/'+code);
 }
 await waitFor(again,x=>x.phase==='finished'&&x.matchId===fresh.matchId);assert.equal((await request(b.cookie,'/profile')).data.stats.multiGames,2);again.ws.close();rejoinedA.ws.close();
});
test('friend privacy and request authorization',async()=>{const a=await bootstrap(),b=await bootstrap();const aa=await request(a.cookie,'/auth/signup','POST',{name:'Friend A',email:'friend-a@example.test',password:'Synthetic-friend-password-A'}),bb=await request(b.cookie,'/auth/signup','POST',{name:'Friend B',email:'friend-b@example.test',password:'Synthetic-friend-password-B'});const req=await request(aa.cookie,'/friends','POST',{code:bb.data.user.friendCode});assert.equal(req.status,200);const requests=(await request(bb.cookie,'/friends')).data.friends;assert.equal(requests.length,1);assert.equal((await request(aa.cookie,'/friends/'+requests[0].id,'POST',{status:'accepted'})).status,403);assert.equal((await request(bb.cookie,'/friends/'+requests[0].id,'POST',{status:'accepted'})).status,200);assert.equal((await request(aa.cookie,'/friends')).data.friends[0].status,'accepted');});
test('opposite friend requests are unique and a block cannot be undone by the other player',async()=>{const a=await bootstrap(),b=await bootstrap();const aa=await request(a.cookie,'/auth/signup','POST',{name:'Pair A',email:'pair-a@example.test',password:'Synthetic-pair-password-A'}),bb=await request(b.cookie,'/auth/signup','POST',{name:'Pair B',email:'pair-b@example.test',password:'Synthetic-pair-password-B'});const results=await Promise.all([request(aa.cookie,'/friends','POST',{code:bb.data.user.friendCode}),request(bb.cookie,'/friends','POST',{code:aa.data.user.friendCode})]);assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);const list=(await request(aa.cookie,'/friends')).data.friends;assert.equal(list.length,1);assert.equal((await request(aa.cookie,'/friends/'+list[0].id,'POST',{status:'blocked'})).status,200);assert.equal((await request(bb.cookie,'/friends/'+list[0].id,'POST',{status:'accepted'})).status,403);assert.equal((await request(bb.cookie,'/friends/'+list[0].id,'POST',{status:'rejected'})).status,403);});
test('cross-origin mutation, injection and name validation',async()=>{const a=await bootstrap();const response=await mf.dispatchFetch(origin+'/api/rooms',{method:'POST',headers:{Cookie:a.cookie,Origin:'https://untrusted.test','Content-Type':'application/json'},body:JSON.stringify({settings})});assert.equal(response.status,403);assert.equal((await request(a.cookie,"/rooms/';DROP")).status,400);assert.equal((await request(a.cookie,'/profile','PATCH',{name:'<img src=x>',avatar:0,discoverable:true})).status,400);});


test('daily comparisons are shared, untimed, resumable and independently validated without points', async()=>{
 const a=await bootstrap(),b=await bootstrap();
 const today=(await request(a.cookie,'/puzzles/today')).data;
 assert.match(today.date,/^\d{4}-\d{2}-\d{2}$/);assert.equal(today.week.length,7);assert.equal(today.week.at(-1).completed,false);assert.ok(today.tomorrowTopic.id);
 const starts=await Promise.all([request(a.cookie,'/puzzles','POST',{mode:'compare'}),request(a.cookie,'/puzzles','POST',{mode:'compare'})]);
 assert.equal(starts[0].status,200);assert.equal(starts[0].data.id,starts[1].data.id);
 let g=starts[0].data;
 const second=(await request(b.cookie,'/puzzles','POST',{mode:'compare'})).data;
 assert.deepEqual(g.question,second.question);assert.ok(!('questions' in g));assert.ok(!('deadline' in g));
 assert.equal((await request(b.cookie,'/puzzles/'+g.id)).status,404);
 assert.equal((await request(a.cookie,'/games/'+g.id)).status,404);
 for(let i=0;i<10;i++){
  const answer=i===2?g.question.countries.find(c=>c.id!==g.question.correct).id:g.question.correct;
  const replies=await Promise.all([request(a.cookie,'/puzzles/'+g.id+'/answer','POST',{version:g.version,answer,correct:true,score:99999}),request(a.cookie,'/puzzles/'+g.id+'/answer','POST',{version:g.version,answer})]);
  assert.deepEqual(replies.map(r=>r.status).sort(),[200,409]);
  g=replies.find(r=>r.status===200).data;assert.equal(g.answers.at(-1).correct,i!==2);assert.equal(g.phase,'reveal');
  const resumed=(await request(a.cookie,'/puzzles/'+g.id)).data;assert.deepEqual(resumed,g);
  const carried=g.question.countries[0].id;const next=await request(a.cookie,'/puzzles/'+g.id+'/next','POST',{version:g.version});assert.equal(next.status,200,JSON.stringify(next.data));g=next.data;if(g.question)assert.equal(g.question.countries[1].id,carried);
 }
 assert.equal(g.phase,'finished');assert.equal(g.answers.length,10);assert.equal((await request(a.cookie,'/puzzles/today')).data.week.at(-1).completed,true);
 const repeat=(await request(a.cookie,'/puzzles','POST',{mode:'compare'})).data;assert.equal(repeat.id,g.id);assert.equal(repeat.phase,'finished');
 const profile=(await request(a.cookie,'/profile')).data;assert.equal(profile.stats.games,1);assert.equal(profile.stats.accuracy,90);assert.equal(profile.stats.score,0);assert.equal(profile.stats.xp,0);assert.equal(profile.stats.dailyStreak,1);
 const results=(await request(a.cookie,'/export')).data;assert.equal(results.results.length,1);assert.equal(results.answers.length,10);assert.equal(results.results[0].mode,'compare');
});

test('mosaic supports every board size, retrying mistakes, resuming, final results and fresh practice',async()=>{
 const a=await bootstrap(),b=await bootstrap();
 const dailyA=(await request(a.cookie,'/puzzles','POST',{mode:'mosaic',daily:true,size:5})).data;
 const dailyB=(await request(b.cookie,'/puzzles','POST',{mode:'mosaic',daily:true})).data;
 assert.equal(dailyA.board.tiles.length,16);assert.deepEqual(dailyA.board,dailyB.board);
 for(const size of [3,4,5]){
  let g=(await request(a.cookie,'/puzzles','POST',{mode:'mosaic',daily:false,size})).data;
  assert.equal(g.board.tiles.length,size*4);
  assert.equal((await request(a.cookie,'/puzzles/'+g.id+'/answer','POST',{version:g.version,answer:Array(size).fill(g.board.tiles[0].id)})).status,400);
  const group=g.board.tiles.filter(t=>t.countryId===g.board.countries[0].id),other=g.board.tiles.find(t=>t.countryId!==group[0].countryId);
  const wrong=await request(a.cookie,'/puzzles/'+g.id+'/answer','POST',{version:g.version,answer:[...group.slice(1).map(t=>t.id),other.id]});assert.equal(wrong.status,200);g=wrong.data;assert.equal(g.solved.length,0);assert.equal(g.answers[0].correct,false);
  for(const country of g.board.countries){
   const ids=g.board.tiles.filter(t=>t.countryId===country.id).map(t=>t.id);
   const result=await request(a.cookie,'/puzzles/'+g.id+'/answer','POST',{version:g.version,answer:ids});assert.equal(result.status,200,JSON.stringify(result.data));g=result.data;
   assert.equal(g.answers.at(-1).correct,true);
   assert.equal((await request(a.cookie,'/puzzles/'+g.id+'/answer','POST',{version:g.version-1,answer:ids})).status,409);
   assert.deepEqual((await request(a.cookie,'/puzzles/'+g.id)).data,g);
  }
  assert.equal(g.phase,'finished');assert.equal(g.solved.length,4);assert.equal(g.answers.length,5);
  const fresh=(await request(a.cookie,'/puzzles','POST',{mode:'mosaic',daily:false,size})).data;assert.notEqual(fresh.board.id,g.board.id);
 }
 let daily=dailyA;
 for(const country of daily.board.countries){const answer=daily.board.tiles.filter(t=>t.countryId===country.id).map(t=>t.id);daily=(await request(a.cookie,'/puzzles/'+daily.id+'/answer','POST',{version:daily.version,answer})).data;}
 assert.equal(daily.phase,'finished');const saved=(await request(a.cookie,'/puzzles','POST',{mode:'mosaic'})).data;assert.equal(saved.id,daily.id);assert.equal(saved.phase,'finished');
 const profile=(await request(a.cookie,'/profile')).data;assert.equal(profile.stats.games,4);assert.equal(profile.stats.correct,16);assert.equal(profile.stats.total,19);assert.equal(profile.stats.score,0);assert.equal(profile.stats.xp,0);assert.equal(profile.stats.dailyStreak,1);
 assert.equal((await request(a.cookie,'/puzzles','POST',{mode:'mosaic',size:6})).status,400);
 assert.equal((await request(a.cookie,'/puzzles','POST',{mode:'compare',topic:'made-up'})).status,400);
});


test('legacy comparison sessions retain the entire frozen puzzle across deployments',async()=>{
 const a=await bootstrap();let g=(await request(a.cookie,'/puzzles','POST',{mode:'compare',daily:false,topic:'area'})).data;
 const row=await db.prepare('SELECT state FROM game_sessions WHERE id=?').bind(g.id).first();const state=JSON.parse(row.state);
 // Simulate the previous independent-pair format by swapping the next pair.
 state.questions[1].countries.reverse();
 await db.prepare('UPDATE game_sessions SET state=? WHERE id=?').bind(JSON.stringify(state),g.id).run();
 g=(await request(a.cookie,'/puzzles/'+g.id+'/answer','POST',{version:g.version,answer:g.question.correct})).data;
 const history=structuredClone(g.answers),first=structuredClone(g.question);
 g=(await request(a.cookie,'/puzzles/'+g.id+'/next','POST',{version:g.version})).data;
 assert.deepEqual(g.question,state.questions[1]);assert.deepEqual(g.answers,history);
 const migrated=JSON.parse((await db.prepare('SELECT state FROM game_sessions WHERE id=?').bind(g.id).first()).state);
 assert.deepEqual(migrated.questions[0],first);assert.deepEqual(migrated.questions,state.questions);
});

test('twelve independent guests complete five concurrent rounds and a full rematch; thirteenth guest is rejected',async()=>{
 const people=[];for(let i=0;i<13;i++)people.push(await bootstrap());
 let room=(await request(people[0].cookie,'/rooms','POST',{settings:{...settings,timer:0}})).data;const path='/rooms/'+room.code;
 for(const p of people.slice(1,12))assert.equal((await request(p.cookie,path+'/join','POST',{})).status,200);
 assert.equal((await request(people[12].cookie,path+'/join','POST',{})).data.error,'ROOM_FULL');
 for(let match=0;match<2;match++){
  room=(await request(people[0].cookie,path+'/start','POST',{})).data;assert.equal(room.phase,'countdown');
  for(let i=0;i<5;i++){
   await alter(room.code,r=>{r.startAt=Date.now()-600;});const state=await stored(room.code),answer=state.questions[i].correct;
   const responses=await Promise.all(people.slice(0,12).map(p=>request(p.cookie,path+'/answer','POST',{round:i,matchId:room.matchId,answer,score:9999999})));
   assert.ok(responses.every(r=>r.status===200),JSON.stringify(responses.map(r=>r.data.error)));
   assert.equal((await request(people[0].cookie,path+'/answer','POST',{round:i,matchId:room.matchId,answer})).status,409);
   await alter(room.code,r=>{r.answersCompleteAt=Date.now()-1;});const reveal=(await request(people[0].cookie,path)).data;assert.equal(reveal.phase,'reveal');assert.equal(reveal.players.length,12);assert.ok(reveal.players.every(p=>p.rank===1));
   await alter(room.code,r=>{r.revealUntil=Date.now()-1;});room=(await request(people[0].cookie,path)).data;
  }
  assert.equal(room.phase,'finished');assert.ok(room.players.every(p=>p.score===5500));
  if(match===0){room=(await request(people[0].cookie,path+'/rematch','POST',{})).data;assert.equal(room.players.length,12);assert.equal(room.phase,'lobby');}
 }
 const audit=await db.prepare('SELECT COUNT(*) count FROM answers WHERE session_id=?').bind(room.matchId).first();assert.equal(audit.count,60);
 await alter(room.code,r=>{r.expiresAt=Date.now()-1;});await db.prepare('UPDATE multiplayer_rooms SET expires_at=? WHERE code=?').bind(Date.now()-1,room.code).run();assert.equal((await request(people[0].cookie,path)).data.error,'ROOM_EXPIRED');
});
test('trail clues persist, wrong comparison knowledge opens targeted practice, and daily snapshots are immutable',async()=>{
 const a=await bootstrap();let g=(await request(a.cookie,'/games','POST',{settings:{...settings,mode:'trail'}})).data;
 assert.equal(g.question.cluesShown,1);g=(await request(a.cookie,'/games/'+g.id+'/hint','POST',{round:0,count:3})).data;assert.equal(g.question.cluesShown,3);assert.equal((await request(a.cookie,'/games/'+g.id)).data.question.cluesShown,3);
 const wrong=g.question.options.find(o=>o.id!==g.question.solution.correct).id;const done=await request(a.cookie,'/games/'+g.id+'/answer','POST',{round:0,answer:wrong});assert.equal(done.data.feedback.cluesUsed,3);
 let p=(await request(a.cookie,'/puzzles','POST',{mode:'compare'})).data;const answer=p.question.countries.find(c=>c.id!==p.question.correct).id;p=(await request(a.cookie,'/puzzles/'+p.id+'/answer','POST',{version:p.version,answer})).data;
 const profile=(await request(a.cookie,'/profile')).data;const review=profile.stats.reviews.find(r=>r.mode==='compare');assert.ok(review);const practice=(await request(a.cookie,'/practice/'+encodeURIComponent(review.key),'POST',{})).data;
 const fresh=(await request(a.cookie,practice.href.replace('/puzzle/','/puzzles/'))).data;assert.equal(fresh.daily,null);assert.equal(fresh.question.topic.id,review.topic);assert.ok(fresh.question.countries.some(c=>c.id===review.country_id));assert.notEqual(fresh.question.id,p.question.id);
 const snapshot=await db.prepare('SELECT * FROM daily_content WHERE date=? AND kind=?').bind(p.daily,'puzzle:compare').first();assert.ok(snapshot.dataset_version);const b=await bootstrap();const same=(await request(b.cookie,'/puzzles','POST',{mode:'compare'})).data;assert.deepEqual(same.question,JSON.parse(snapshot.content).questions[0]);assert.equal(same.datasetVersion,p.datasetVersion);
});
async function finishDaily(cookie){let g=(await request(cookie,'/games','POST',{settings:{...settings,mode:'daily'}})).data;while(g.phase!=='finished'){const r=await request(cookie,'/games/'+g.id+'/answer','POST',{round:g.round,answer:g.question.solution.correct});assert.equal(r.status,200,JSON.stringify(r.data));g=(await request(cookie,'/games/'+g.id+'/next','POST',{})).data;}return g;}
test('logging into an existing account merges guest sessions once, preserves its first daily, and revokes guest bearer sessions',async()=>{
 const a=await bootstrap();const email='merge-account@example.test',password='Synthetic-merge-password-5432';const account=await request(a.cookie,'/auth/signup','POST',{email,password,name:'Merge Test'});assert.equal(account.status,200);const canonical=await finishDaily(account.cookie);
 const guest=await bootstrap();const guestGame=await finishDaily(guest.cookie);const login=await request(guest.cookie,'/auth/login','POST',{email,password});assert.equal(login.status,200,JSON.stringify(login.data));assert.equal(login.data.user.id,account.data.user.id);
 let stats=(await request(login.cookie,'/profile')).data.stats;assert.equal(stats.games,2);assert.equal(stats.total,10);assert.equal(stats.correct,10);assert.equal(stats.dailyCount,1);
 const daily=(await request(login.cookie,'/games','POST',{settings:{...settings,mode:'daily'}})).data;assert.equal(daily.id,canonical.id);assert.equal((await request(login.cookie,'/games/'+guestGame.id)).status,200);assert.equal((await request(guest.cookie,'/profile')).status,401);
 const repeat=await request(login.cookie,'/auth/login','POST',{email,password});assert.equal(repeat.status,200);stats=(await request(repeat.cookie,'/profile')).data.stats;assert.equal(stats.games,2);
});

test('all six practice games can be completed and their results survive a reload',async()=>{
 const guest=await bootstrap();for(const mode of ['flags','capitals','trail','pinpoint','borders','order']){
  let g=(await request(guest.cookie,'/games','POST',{settings:{...settings,mode}})).data;
  while(g.phase!=='finished'){const a=await request(guest.cookie,'/games/'+g.id+'/answer','POST',{round:g.round,answer:g.question.solution.correct});assert.equal(a.status,200,mode);g=(await request(guest.cookie,'/games/'+g.id+'/next','POST',{})).data;}
  const reloaded=(await request(guest.cookie,'/games/'+g.id)).data;assert.equal(reloaded.phase,'finished');assert.equal(reloaded.answers.filter(a=>a.correct).length,5);assert.equal(reloaded.score,0);
 }
 const stats=(await request(guest.cookie,'/profile')).data.stats;assert.equal(stats.games,6);assert.equal(stats.total,30);assert.equal(stats.accuracy,100);
});
test('optional measurement defaults off, deduplicates consented events and stores no raw user identity',async()=>{
 const a=await bootstrap();const count=async()=>Number((await db.prepare('SELECT COUNT(*) n FROM analytics_events').first()).n);const initial=await count();
 await request(a.cookie,'/metrics','POST',{event:'shared_result_opened',mode:'compare'});assert.equal(await count(),initial);
 for(let i=0;i<2;i++)assert.equal((await request(a.cookie+'; rv_metrics=on','/metrics','POST',{event:'shared_result_opened',mode:'compare'})).status,200);
 assert.equal(await count(),initial+1);const event=await db.prepare('SELECT * FROM analytics_events ORDER BY created_at DESC LIMIT 1').first();assert.match(event.id,/^[a-f0-9]{64}$/);assert.ok(!JSON.stringify(event).includes(a.data.user.id));assert.equal((await request(a.cookie,'/rooms/ABCDE/connect','POST',{connectionToken:'forged'})).status,400);
});


test('saved daily Mosaic upgrades old hints without losing solved groups or answer version',async()=>{
 const a=await bootstrap();let p=(await request(a.cookie,'/puzzles','POST',{mode:'mosaic'})).data;
 const first=p.board.countries[0].id;
 p=(await request(a.cookie,'/puzzles/'+p.id+'/answer','POST',{version:p.version,answer:p.board.tiles.filter(t=>t.countryId===first).map(t=>t.id)})).data;
 const row=await db.prepare('SELECT state,version FROM game_sessions WHERE id=?').bind(p.id).first();const old=JSON.parse(row.state);
 delete old.board.factEdition;delete old.board.factDate;
 for(const t of old.board.tiles)if(t.kind==='fact'){t.text={en:'Find me in Europe',nl:'Zoek mij in Europa'};delete t.fact;}
 await db.prepare('UPDATE game_sessions SET state=? WHERE id=?').bind(JSON.stringify(old),p.id).run();
 const resumed=(await request(a.cookie,'/puzzles','POST',{mode:'mosaic'})).data;
 assert.equal(resumed.id,p.id);assert.equal(resumed.version,p.version);assert.deepEqual(resumed.solved,[first]);
 assert.deepEqual(resumed.board.tiles.map(t=>t.id),old.board.tiles.map(t=>t.id));
 assert.ok(resumed.board.tiles.filter(t=>t.kind==='fact').every(t=>t.fact.stat.rawValue>0&&!t.text.en.includes('Find me')));
 const country=resumed.board.countries.find(c=>c.id!==first).id;
 const saved=await request(a.cookie,'/puzzles/'+p.id+'/answer','POST',{version:resumed.version,answer:resumed.board.tiles.filter(t=>t.countryId===country).map(t=>t.id)});
 assert.equal(saved.status,200);assert.deepEqual(saved.data.solved,[first,country]);
});


test('native flag images use the same opaque question ID and licensed artwork as web SVGs',async()=>{
 const a=await bootstrap();const game=(await request(a.cookie,'/games','POST',{settings:{...settings,mode:'flags'}})).data;
 assert.equal(game.question.flag,game.question.id);assert.ok(!game.question.countryId);
 const png=await mf.dispatchFetch(origin+'/api/flag/'+game.question.flag+'?format=png');assert.equal(png.status,200);assert.equal(png.headers.get('content-type'),'image/png');assert.deepEqual([...new Uint8Array(await png.arrayBuffer()).slice(0,8)],[137,80,78,71,13,10,26,10]);
 const svg=await mf.dispatchFetch(origin+'/api/flag/'+game.question.flag);assert.equal(svg.status,200);assert.equal(svg.headers.get('content-type'),'image/svg+xml');assert.match(await svg.text(),/<svg/);
 assert.equal((await mf.dispatchFetch(origin+'/api/flag/invalid?format=png')).status,404);
});

test('Rank Radar daily is shared, resumable, untimed and isolated from other game endpoints',async()=>{
 const a=await bootstrap(),b=await bootstrap();
 const [first,second]=await Promise.all([request(a.cookie,'/ranks','POST',{}),request(b.cookie,'/ranks','POST',{})]);
 assert.equal(first.status,200,JSON.stringify(first.data));let g=first.data;
 assert.equal(g.mode,'rank');assert.equal(g.total,6);assert.equal(g.learning,true);assert.deepEqual(g.question,second.data.question);
 for(const forbidden of ['questions','review','startedAt','turnAt','score','xp','deadline'])assert.ok(!(forbidden in g),forbidden);
 assert.equal((await request(b.cookie,'/ranks/'+g.id)).status,404);assert.equal((await request(a.cookie,'/games/'+g.id)).status,404);assert.equal((await request(a.cookie,'/puzzles/'+g.id)).status,404);
 assert.equal((await request(a.cookie,'/ranks/'+g.id+'/next','POST',{version:g.version})).status,400);
 assert.equal((await request(a.cookie,'/ranks/'+g.id+'/answer','POST',{version:g.version,answer:'made-up'})).status,400);
 const wrong=g.question.options.find(o=>o.id!==g.question.correct).id;
 const results=await Promise.all([request(a.cookie,'/ranks/'+g.id+'/answer','POST',{version:0,answer:wrong,score:999999}),request(a.cookie,'/ranks/'+g.id+'/answer','POST',{version:0,answer:g.question.correct})]);
 assert.equal(results.filter(r=>r.status===200).length,1);assert.equal(results.filter(r=>r.status===409).length,1);
 g=results.find(r=>r.status===200).data;
 const resumed=(await request(a.cookie,'/ranks','POST',{})).data;assert.equal(resumed.id,g.id);assert.deepEqual(resumed.answers,g.answers);assert.equal(resumed.phase,'reveal');assert.ok(!resumed.review);
 assert.equal((await request(a.cookie,'/ranks/'+g.id+'/answer','POST',{version:g.version,answer:g.question.correct})).status,409);
 const daily=(await request(a.cookie,'/puzzles/today')).data.sessions.find(s=>s.mode==='rank');assert.equal(daily.total,6);assert.equal(daily.completed,false);
});

test('six Rank Radar rounds persist exactly once, award no points and expose a native-compatible recap',async()=>{
 const a=await bootstrap();let g=(await request(a.cookie,'/ranks','POST',{})).data;
 const firstQuestion=g.question.id;
 while(g.phase!=='finished'){
  assert.equal(g.question.options.length,4);for(const o of g.question.options)assert.ok(o.label.en&&o.label.nl&&o.explanation.en&&o.sourceUrl);
  const answer=g.round===0?g.question.options.find(o=>o.id!==g.question.correct).id:g.question.correct;
  const reveal=await request(a.cookie,'/ranks/'+g.id+'/answer','POST',{version:g.version,answer,correct:true,points:5000});assert.equal(reveal.status,200,JSON.stringify(reveal.data));
  g=reveal.data;assert.equal(g.answers.at(-1).correct,g.round!==0);assert.equal(g.answers.at(-1).countryId,g.question.country.id);
  const next=await request(a.cookie,'/ranks/'+g.id+'/next','POST',{version:g.version});assert.equal(next.status,200);g=next.data;
 }
 assert.equal(g.answers.length,6);assert.equal(g.review.length,6);assert.equal(g.question,null);assert.equal(g.review[0].id,firstQuestion);assert.equal(g.bestStreak,5);
 const profile=(await request(a.cookie,'/profile')).data.stats;assert.equal(profile.games,1);assert.equal(profile.correct,5);assert.equal(profile.total,6);assert.equal(profile.score,0);assert.equal(profile.xp,0);assert.equal(profile.dailyCount,1);assert.equal(profile.discovered,5);
 for(let i=0;i<2;i++)await request(a.cookie,'/ranks/'+g.id);
 const replay=(await request(a.cookie,'/ranks','POST',{})).data;assert.equal(replay.id,g.id);assert.deepEqual(replay.answers,g.answers);
 assert.equal((await request(a.cookie,'/profile')).data.stats.games,1);
 const audit=await db.prepare('SELECT COUNT(*) n,SUM(points) points FROM answers WHERE session_id=?').bind(g.id).first();assert.equal(audit.n,6);assert.equal(audit.points,0);
 const daily=(await request(a.cookie,'/puzzles/today')).data.sessions.find(s=>s.mode==='rank');assert.equal(daily.completed,true);
 const practice=(await request(a.cookie,'/ranks','POST',{daily:false})).data;assert.equal(practice.daily,null);assert.notEqual(practice.id,g.id);assert.notEqual(practice.question.id,firstQuestion);
 assert.equal((await request(a.cookie,'/next-round','POST',{sessionId:g.id,intent:'review'})).status,400);
});

test('room options validate count and mode exclusions, enforce the host and persist through rematch',async()=>{
 const host=await bootstrap(),guest=await bootstrap();
 for(const count of [5,10,15,20]){
  const room=(await request(host.cookie,'/rooms','POST',{settings:{...settings,mode:'mixed',count,enabledModes:['flags','order']}})).data;
  const path='/rooms/'+room.code;
  assert.equal(room.settings.count,count);assert.deepEqual(room.settings.enabledModes,['flags','order']);
  await request(guest.cookie,path+'/join','POST',{});
  assert.equal((await request(guest.cookie,path+'/settings','POST',{settings:{...settings,count:20}})).status,403);
  for(const enabledModes of [[],['not-a-mode'],['flags','flags']])assert.equal((await request(host.cookie,path+'/settings','POST',{settings:{...settings,mode:'mixed',enabledModes}})).status,400);
  assert.equal((await request(host.cookie,path+'/settings','POST',{settings:{...settings,count:7}})).status,400);
  const started=await request(host.cookie,path+'/start','POST',{});assert.equal(started.status,200);assert.equal(started.data.total,count);
  assert.ok((await stored(room.code)).questions.every(q=>['flags','order'].includes(q.mode)));
  await alter(room.code,r=>{r.phase='finished';r.players.forEach(p=>p.results=[]);});
  const rematch=await request(host.cookie,path+'/rematch','POST',{});assert.equal(rematch.status,200);assert.deepEqual(rematch.data.settings.enabledModes,['flags','order']);assert.equal(rematch.data.settings.count,count);
 }
 const standard=(await request(host.cookie,'/rooms','POST',{settings:{...settings,mode:'mixed',count:20}})).data;
 await request(host.cookie,'/rooms/'+standard.code+'/start','POST',{});assert.equal(new Set((await stored(standard.code)).questions.map(q=>q.mode)).size,6);
});

test('map accuracy points survive saving and reload without accepting a client-supplied score',async()=>{
 const guest=await bootstrap();let game=(await request(guest.cookie,'/games','POST',{settings:{...settings,mode:'pinpoint'}})).data;
 const correct=game.question.solution.correct;
 const answered=await request(guest.cookie,'/games/'+game.id+'/answer','POST',{round:0,answer:correct,points:999999,mapPoints:999999});assert.equal(answered.status,200);assert.equal(answered.data.feedback.mapPoints,1000);assert.equal(answered.data.feedback.points,0);
 const resumed=(await request(guest.cookie,'/games/'+game.id)).data;assert.equal(resumed.feedback.mapPoints,1000);assert.equal(resumed.feedback.mapRelation,'mapExact');
});

// Daily competition uses server-owned solutions. Tests read the private D1 snapshot,
// never a public solution field, to exercise the same HTTP routes as the website.
async function privateGame(id){return JSON.parse((await db.prepare('SELECT state FROM game_sessions WHERE id=?').bind(id).first()).state);}
async function finishCompetitionSolo(a,g,choose){
 while(g.phase!=='finished'){
  const s=await privateGame(g.id),q=s.questions[g.round];
  const answer=choose?choose(q,g.round):q.correct;
  const saved=await request(a.cookie,'/games/'+g.id+'/answer','POST',{round:g.round,answer,score:999999});assert.equal(saved.status,200,JSON.stringify(saved.data));
  const next=await request(a.cookie,'/games/'+g.id+'/next','POST',{});assert.equal(next.status,200,JSON.stringify(next.data));g=next.data;
 }return g;
}
test('official Clue Trail reveals paid hints in order, keeps flags private, scores once and rejects duplicate answers',async()=>{
 const a=await bootstrap(),b=await bootstrap();
 const create={settings:{...settings,mode:'daily-trail',count:20,region:'Europe',typed:true},competition:true};
 let g=(await request(a.cookie,'/games','POST',create)).data;const s=await privateGame(g.id);
 assert.equal(g.total,5);assert.equal(g.settings.region,'World');assert.equal(g.settings.typed,undefined);assert.equal(g.competition.mode,'trail');
 assert.equal(g.question.solution,undefined);assert.equal(g.question.correct,undefined);assert.equal(g.question.clues.length,1);assert.equal(g.question.clueCount,4);assert.equal(g.question.availablePoints,200);assert.ok(g.question.options.every(o=>!o.flag));
 assert.equal((await mf.dispatchFetch(origin+g.question.flagUrl,{headers:{Cookie:a.cookie}})).status,404);
 g=(await request(a.cookie,'/games/'+g.id+'/hint','POST',{round:0,count:3})).data;
 assert.equal(g.question.availablePoints,100);assert.equal(g.question.clues.length,3);assert.match(g.question.clues[2].en,/capital/);assert.equal((await mf.dispatchFetch(origin+g.question.flagUrl,{headers:{Cookie:a.cookie}})).status,404);
 g=(await request(a.cookie,'/games/'+g.id+'/hint','POST',{round:0,count:4})).data;
 assert.match(g.question.clues[3].en,/flag/);assert.equal((await mf.dispatchFetch(origin+g.question.flagUrl,{headers:{Cookie:a.cookie}})).status,200);assert.equal((await mf.dispatchFetch(origin+g.question.flagUrl,{headers:{Cookie:b.cookie}})).status,404);
 g=(await request(a.cookie,'/games/'+g.id+'/hint','POST',{round:0,count:1})).data;assert.equal(g.question.availablePoints,50,'Cannot refund revealed hints');
 const body={round:0,answer:s.questions[0].correct};const writes=await Promise.all([request(a.cookie,'/games/'+g.id+'/answer','POST',body),request(a.cookie,'/games/'+g.id+'/answer','POST',body)]);assert.deepEqual(writes.map(x=>x.status).sort(),[200,409]);
 g=writes.find(x=>x.status===200).data;assert.equal(g.feedback.points,50);assert.equal(g.feedback.cluesUsed,4);
 g=(await request(a.cookie,'/games/'+g.id+'/next','POST',{})).data;g=await finishCompetitionSolo(a,g,(q,round)=>round===1?q.options.find(o=>o.id!==q.correct).id:q.correct);
 assert.equal(g.score,650);assert.equal(g.answers[1].points,0);assert.equal(g.answers[1].cluesUsed,1);
 const standings=(await request(a.cookie,'/competition?mode=trail')).data;assert.equal(standings.game.score,650);assert.equal(standings.today.score,650);assert.equal(standings.total.score,650);assert.equal(standings.game.place,1);
 for(let i=0;i<2;i++){assert.equal((await request(a.cookie,'/games','POST',create)).data.id,g.id);await request(a.cookie,'/games/'+g.id);}
 assert.equal((await db.prepare('SELECT COUNT(*) n FROM daily_scores WHERE user_id=?').bind(a.data.user.id).first()).n,1);
 const fresh=(await request(b.cookie,'/games','POST',create)).data;assert.equal(fresh.question.id,s.questions[0].id);assert.equal(fresh.question.clues.length,1);
 const retry=(await request(a.cookie,'/next-round','POST',{sessionId:g.id,intent:'review'})).data;
 const review=(await request(a.cookie,retry.href.replace('/game/','/games/'))).data;assert.equal(review.competition,undefined);assert.equal(review.score,0);assert.equal(review.daily,null);
});
test('World Trip uses accuracy points for maps, hides solutions and ignores client scores',async()=>{
 const a=await bootstrap();let g=(await request(a.cookie,'/games','POST',{settings:{...settings,mode:'daily'},competition:true})).data;
 let expected=0;
 while(g.phase!=='finished'){
  assert.equal(g.question.solution,undefined);assert.equal(g.question.correct,undefined);assert.equal(g.question.geometry,undefined);
  const s=await privateGame(g.id),q=s.questions[g.round];
  const answer=q.mode==='pinpoint'?[0,0]:q.correct;
  const saved=await request(a.cookie,'/games/'+g.id+'/answer','POST',{round:g.round,answer,points:9999});assert.equal(saved.status,200,JSON.stringify(saved.data));
  const feedback=saved.data.feedback;assert.equal(feedback.points,q.mode==='pinpoint'?Math.round(feedback.mapPoints/5):200);expected+=feedback.points;
  g=(await request(a.cookie,'/games/'+g.id+'/next','POST',{})).data;
 }
 assert.equal(g.score,expected);assert.equal((await request(a.cookie,'/competition?mode=daily')).data.game.score,expected);
 const sessions=(await request(a.cookie,'/puzzles/today?competition=1')).data.sessions;assert.equal(sessions.find(s=>s.mode==='daily').id,g.id);
});
test('daily Rank Radar ranks ties, counts finished players, preserves zero scores and excludes practice',async()=>{
 const players=await Promise.all([bootstrap(),bootstrap(),bootstrap()]);
 for(let j=0;j<players.length;j++){
  const a=players[j];let g=(await request(a.cookie,'/ranks','POST',{daily:true,competition:true})).data;
  while(g.phase!=='finished'){
   assert.equal(g.question.correct,undefined);for(const o of g.question.options){assert.equal(o.rank,undefined);assert.equal(o.value,undefined);assert.equal(o.sourceUrl,undefined);}
   const s=await privateGame(g.id),q=s.questions[g.round],answer=j===2?q.options.find(o=>o.id!==q.correct).id:g.round===0?q.options.find(o=>o.id!==q.correct).id:q.correct;
   const r=await request(a.cookie,'/ranks/'+g.id+'/answer','POST',{version:g.version,answer});assert.equal(r.status,200,JSON.stringify(r.data));assert.ok(r.data.question.options.every(o=>o.rank>0));
   g=(await request(a.cookie,'/ranks/'+g.id+'/next','POST',{version:r.data.version})).data;
  }
  assert.equal(g.score,j===2?0:833);
 }
 const first=(await request(players[0].cookie,'/competition?mode=rank')).data,second=(await request(players[1].cookie,'/competition?mode=rank')).data,last=(await request(players[2].cookie,'/competition?mode=rank')).data;
 assert.equal(first.game.place,1);assert.equal(second.game.place,1);assert.equal(last.game.place,3);assert.equal(first.game.participants,3);assert.equal(last.game.score,0);
 let practice=(await request(players[0].cookie,'/ranks','POST',{daily:false,competition:true})).data;assert.equal(practice.competition,undefined);
 while(practice.phase!=='finished'){const r=await request(players[0].cookie,'/ranks/'+practice.id+'/answer','POST',{version:practice.version,answer:practice.question.correct});practice=(await request(players[0].cookie,'/ranks/'+practice.id+'/next','POST',{version:r.data.version})).data;}
 assert.equal((await request(players[0].cookie,'/competition')).data.total.score,833);
 await db.prepare('UPDATE users SET blocked=1 WHERE id=?').bind(players[1].data.user.id).run();assert.equal((await request(players[0].cookie,'/competition?mode=rank')).data.game.participants,2);
});
test('daily Mosaic hides unsolved associations, marks mismatches, charges hints and saves the final group score once',async()=>{
 const a=await bootstrap();let g=(await request(a.cookie,'/puzzles','POST',{mode:'mosaic',daily:true,competition:true})).data;
 const s=await privateGame(g.id),board=s.board,group=id=>board.tiles.filter(t=>t.countryId===id).map(t=>t.id);
 for(const tile of g.board.tiles){if(tile.kind!=='name')assert.equal(tile.countryId,'');if(tile.kind==='flag')assert.match(tile.image,/^\/api\/game-asset\//);if(tile.kind==='fact'){assert.equal(tile.fact.explanation,undefined);assert.equal(tile.fact.source,undefined);}}
 assert.ok(g.board.countries.every(c=>!c.flag));assert.equal(g.mosaicAid,undefined);
 const country=board.countries[0].id,second=board.countries[1].id;
 const wrong=board.tiles.filter(t=>t.countryId===country&&t.kind!=='flag').map(t=>t.id).concat(board.tiles.find(t=>t.countryId!==country&&t.kind==='flag').id);
 g=(await request(a.cookie,'/puzzles/'+g.id+'/answer','POST',{version:g.version,answer:wrong})).data;assert.equal(g.mosaicReview.countryId,country);assert.equal(g.mosaicReview.tiles.filter(t=>!t.correct).length,1);assert.equal(g.mosaicReview.tiles.find(t=>!t.correct).countryId,'');assert.equal(g.score,0);
 g=(await request(a.cookie,'/puzzles/'+g.id+'/answer','POST',{version:g.version,answer:group(country)})).data;assert.equal(g.score,0);assert.ok(g.board.tiles.filter(t=>t.countryId===country).length===4);
 const anchor=board.tiles.find(t=>t.countryId===second&&t.kind==='name').id;
 const before=g.version;g=(await request(a.cookie,'/puzzles/'+g.id+'/hint','POST',{version:g.version,answer:[anchor]})).data;assert.equal(g.hintSelection.length,2);assert.equal(g.mosaicAid,undefined);
 assert.equal((await request(a.cookie,'/puzzles/'+g.id+'/hint','POST',{version:before,answer:[anchor]})).status,409);
 for(const c of board.countries.slice(1))g=(await request(a.cookie,'/puzzles/'+g.id+'/answer','POST',{version:g.version,answer:group(c.id)})).data;
 assert.equal(g.phase,'finished');assert.equal(g.score,625);assert.ok(g.board.tiles.filter(t=>t.kind==='fact').every(t=>!!t.fact.source));
 const summary=(await request(a.cookie,'/competition?mode=mosaic')).data;assert.equal(summary.game.score,625);
 await request(a.cookie,'/puzzles/'+g.id);assert.equal((await request(a.cookie,'/competition')).data.total.score,625);
});
test('daily comparisons conceal values until reveal and accumulate with other daily modes',async()=>{
 const a=await bootstrap();let g=(await request(a.cookie,'/puzzles','POST',{mode:'compare',daily:true,competition:true})).data;
 while(g.phase!=='finished'){
  assert.equal(g.question.correct,undefined);assert.equal(g.question.countries[0].value,undefined);assert.ok(g.question.carried?Number.isFinite(g.question.countries[1].value):g.question.countries[1].value===undefined,'only the carried country keeps its already revealed value');
  const q=(await privateGame(g.id)).questions[g.round];const r=await request(a.cookie,'/puzzles/'+g.id+'/answer','POST',{version:g.version,answer:q.correct});assert.equal(r.status,200);assert.ok(r.data.question.countries.every(c=>Number.isFinite(c.value)));
  g=(await request(a.cookie,'/puzzles/'+g.id+'/next','POST',{version:r.data.version})).data;
 }
 assert.equal(g.score,1000);
 let trail=(await request(a.cookie,'/games','POST',{settings:{...settings,mode:'daily-trail'},competition:true})).data;trail=await finishCompetitionSolo(a,trail);
 const summary=(await request(a.cookie,'/competition')).data;assert.equal(summary.today.score,2000);assert.equal(summary.total.score,2000);assert.equal(summary.today.games,2);assert.equal(summary.scores.length,2);
 const exported=(await request(a.cookie,'/export')).data;assert.equal(exported.dailyScores.length,2);
 // Existing unranked clients keep their published edition and never get retroactive points.
 const legacy=(await request(a.cookie,'/puzzles','POST',{mode:'compare',daily:true})).data;assert.equal(legacy.competition,undefined);assert.ok(legacy.question.correct);assert.notEqual(legacy.id,g.id);
 assert.equal((await request(a.cookie,'/competition')).data.today.score,2000);
});
test('guest daily scores merge once, preserve the account’s first result and disappear on account deletion',async()=>{
 const a=await bootstrap(),email='daily-merge@example.test',password='Synthetic-daily-merge-password';
 const account=await request(a.cookie,'/auth/signup','POST',{email,password,name:'Daily Player'});assert.equal(account.status,200);const registered={cookie:account.cookie,data:{user:account.data.user}};
 let first=(await request(registered.cookie,'/games','POST',{settings:{...settings,mode:'daily-trail'},competition:true})).data;
 first=await finishCompetitionSolo(registered,first,(q,round)=>round===0?q.options.find(o=>o.id!==q.correct).id:q.correct);assert.equal(first.score,800);
 const guest=await bootstrap();let duplicate=(await request(guest.cookie,'/games','POST',{settings:{...settings,mode:'daily-trail'},competition:true})).data;duplicate=await finishCompetitionSolo(guest,duplicate);assert.equal(duplicate.score,1000);
 let extra=(await request(guest.cookie,'/games','POST',{settings:{...settings,mode:'daily'},competition:true})).data;extra=await finishCompetitionSolo(guest,extra);
 const login=await request(guest.cookie,'/auth/login','POST',{email,password});assert.equal(login.status,200,JSON.stringify(login.data));
 let scores=(await request(login.cookie,'/competition')).data;assert.equal(scores.today.games,2);assert.equal(scores.scores.find(s=>s.mode==='trail').score,800);assert.equal(scores.total.score,800+extra.score);
 assert.equal((await request(login.cookie,'/games/'+duplicate.id)).data.competition,undefined);
 await request(login.cookie,'/games/'+extra.id);assert.equal((await request(login.cookie,'/competition')).data.total.score,scores.total.score);
 assert.equal((await request(guest.cookie,'/competition')).status,401);
 const deleted=await request(login.cookie,'/profile','DELETE');assert.equal(deleted.status,200);assert.equal((await db.prepare('SELECT COUNT(*) n FROM daily_scores WHERE user_id=?').bind(account.data.user.id).first()).n,0);
});
test('daily ranks and cumulative ranks use different date scopes and validate query input',async()=>{
 const a=await bootstrap();let g=(await request(a.cookie,'/games','POST',{settings:{...settings,mode:'daily-trail'},competition:true})).data;g=await finishCompetitionSolo(a,g);
 const yesterday=new Date(Date.now()-86400000).toISOString().slice(0,10);
 await db.prepare('UPDATE daily_scores SET date=? WHERE session_id=?').bind(yesterday,g.id).run();
 const summary=(await request(a.cookie,'/competition')).data;assert.equal(summary.today.score,0);assert.equal(summary.today.place,null);assert.equal(summary.total.score,1000);assert.equal(summary.scores.length,0);
 const historic=(await request(a.cookie,'/competition?date='+yesterday+'&mode=trail')).data;assert.equal(historic.game.score,1000);assert.ok(historic.game.place>=1);
 for(const query of ['?date=2026-99-99','?date=2026-02-30','?mode=madeup','?date=abc'])assert.equal((await request(a.cookie,'/competition'+query)).status,400);
});
test('competition summary reports earlier personal bests, the best day and yesterday, never counting today',async()=>{
 const a=await bootstrap();const id=a.data.user.id;const day=n=>new Date(Date.now()-n*86400000).toISOString().slice(0,10);
 const score=async(date,mode,points)=>{const sid=crypto.randomUUID();await db.prepare("INSERT INTO game_sessions(id,user_id,kind,date,state,completed,created_at) VALUES (?,?,?,?,'{}',1,?)").bind(sid,id,'synthetic:'+mode,date,Date.now()).run();await db.prepare('INSERT INTO daily_scores(user_id,date,mode,session_id,score,created_at) VALUES (?,?,?,?,?,?)').bind(id,date,mode,sid,points,Date.now()).run();};
 await score(day(2),'rank',700);await score(day(1),'rank',400);await score(day(1),'compare',300);await score(day(0),'rank',800);
 const s=(await request(a.cookie,'/competition?mode=rank')).data;
 assert.equal(s.game.score,800);assert.deepEqual(s.personalBest.rank,{best:700,plays:2});assert.deepEqual(s.personalBest.compare,{best:300,plays:1});
 assert.equal(s.bestDay,700);assert.deepEqual(s.yesterday,{score:700,games:2});
 const fresh=(await request((await bootstrap()).cookie,'/competition')).data;assert.deepEqual(fresh.personalBest,{});assert.equal(fresh.bestDay,null);assert.deepEqual(fresh.yesterday,{score:0,games:0});
});
test('friends see who is online and can invite each other straight into a room',async()=>{
 const signup=async(n)=>{const g=await bootstrap();return request(g.cookie,'/auth/signup','POST',{name:'Invite '+n,email:'invite-'+n.toLowerCase()+'@example.test',password:'Synthetic-invite-password-'+n});};
 const a=await signup('A'),b=await signup('B'),c=await signup('C');
 await request(a.cookie,'/friends','POST',{code:b.data.user.friendCode});const pending=(await request(b.cookie,'/friends')).data.friends[0];
 assert.equal(pending.online,0,'pending requests never reveal presence');
 await request(b.cookie,'/friends/'+pending.id,'POST',{status:'accepted'});
 assert.deepEqual((await request(a.cookie,'/presence','POST',{})).data,{invites:[]});
 let seen=(await request(b.cookie,'/friends')).data.friends[0];assert.equal(seen.online,1);assert.equal(seen.name,'Invite A');
 const room=(await request(a.cookie,'/rooms','POST',{settings})).data;
 assert.equal((await request(a.cookie,'/rooms/'+room.code+'/invite','POST',{friendId:c.data.user.id})).status,403,'only accepted friends');
 assert.equal((await request(c.cookie,'/rooms/'+room.code+'/invite','POST',{friendId:b.data.user.id})).status,403,'only players in the room');
 assert.equal((await request(a.cookie,'/rooms/'+room.code+'/invite','POST',{friendId:b.data.user.id})).status,200);
 assert.equal((await request(a.cookie,'/rooms/'+room.code+'/invite','POST',{friendId:b.data.user.id})).status,200,'re-inviting refreshes');
 const inbox=(await request(b.cookie,'/presence','POST',{})).data.invites;assert.equal(inbox.length,1);assert.equal(inbox[0].code,room.code);assert.equal(inbox[0].name,'Invite A');
 assert.equal((await request(c.cookie,'/invites/'+inbox[0].id,'POST',{status:'accepted'})).status,404,'nobody else can answer it');
 const answer=(await request(b.cookie,'/invites/'+inbox[0].id,'POST',{status:'accepted'})).data;assert.equal(answer.code,room.code);
 assert.equal((await request(b.cookie,'/rooms/'+room.code+'/join','POST',{})).status,200);
 assert.deepEqual((await request(b.cookie,'/presence','POST',{room:room.code})).data.invites,[]);
 seen=(await request(a.cookie,'/friends')).data.friends[0];assert.equal(seen.room_code,room.code);
 await db.prepare('UPDATE user_presence SET last_seen=? WHERE user_id=?').bind(Date.now()-5*60000,a.data.user.id).run();
 assert.equal((await request(b.cookie,'/friends')).data.friends[0].online,0);
 const guest=await bootstrap();assert.deepEqual((await request(guest.cookie,'/presence','POST',{})).data,{invites:[]});
 assert.equal(await db.prepare('SELECT COUNT(*) n FROM user_presence WHERE user_id=?').bind(guest.data.user.id).first('n'),0);
});
test('the next flag can load while the answer is shown, but never early and never a hidden Clue Trail flag',async()=>{
 const a=await bootstrap();let g=(await request(a.cookie,'/games','POST',{settings:{...settings,mode:'flags',count:5}})).data;
 assert.equal(g.preloadFlag,undefined,'nothing to preload before answering');
 const r=(await request(a.cookie,'/games/'+g.id+'/answer','POST',{round:0,answer:g.question.options[0].id})).data;
 assert.match(r.preloadFlag,/^\/api\/flag\//);
 const img=await mf.dispatchFetch(origin+r.preloadFlag,{headers:{Cookie:a.cookie}});assert.equal(img.status,200);await img.arrayBuffer();
 const next=(await request(a.cookie,'/games/'+g.id+'/next','POST',{})).data;assert.equal('/api/flag/'+encodeURIComponent(next.question.flag),r.preloadFlag,'the preloaded image is exactly the next question');
 const trail=(await request(a.cookie,'/games','POST',{settings:{...settings,mode:'trail',count:5}})).data;
 const tr=(await request(a.cookie,'/games/'+trail.id+'/answer','POST',{round:0,answer:trail.question.options[0].id})).data;assert.equal(tr.preloadFlag,undefined,'Clue Trail flags stay hidden');
 const daily=(await request(a.cookie,'/games','POST',{settings:{...settings,mode:'daily'},competition:true})).data;
 assert.match(daily.question.flagUrl,/^\/api\/game-asset\//);
 const early=await mf.dispatchFetch(origin+'/api/game-asset/'+daily.id+'/1',{headers:{Cookie:a.cookie}});assert.equal(early.status,404,'future rounds stay private while a question is open');await early.arrayBuffer();
 const own=await mf.dispatchFetch(origin+daily.question.flagUrl,{headers:{Cookie:a.cookie}});assert.equal(own.status,200);assert.match(own.headers.get('cache-control'),/private/);await own.arrayBuffer();
});
