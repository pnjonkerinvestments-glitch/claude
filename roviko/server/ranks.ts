import { z } from 'zod';
import { AppError } from './auth';
import { one, rows, run, batch } from './db';
import { dailyContent } from './daily-content';
import { resultStatement } from './stats';
import { generateRankRounds, type RankState, type RankView } from '../lib/puzzles/rank';
import type { Env, User } from './types';

function view(s: RankState, version = 0): RankView {
  const {questions,startedAt,turnAt,...rest}=s;
  // This untimed learning game reveals only the current solution for instant feedback.
  return {...rest,version,total:questions.length,learning:true,question:s.phase==='finished'?null:questions[s.round],...(s.phase==='finished'?{review:questions}:{})};
}
export async function startRank(env: Env, user: User, input: unknown) {
  const settings=z.object({daily:z.boolean().default(true)}).parse(input);
  const daily=settings.daily?new Date().toISOString().slice(0,10):null;
  if(daily){const existing=await one(env,'SELECT state,version FROM game_sessions WHERE user_id=? AND date=? AND kind=?',user.id,daily,'rank');if(existing){const s=JSON.parse(existing.state);await record(env,user,s);return view(s,existing.version);}}
  const id=crypto.randomUUID();
  const generate=(seed:string)=>({questions:generateRankRounds(seed),settings:{mode:'rank'}});
  const content=daily?await dailyContent(env,daily,'rank',generate):generate(id);
  const blocked=await rows(env,'SELECT question_id FROM disabled_questions');
  if(blocked.some((b:any)=>content.questions.some((q:any)=>q.id===b.question_id)))throw new AppError('QUESTION_UNAVAILABLE',503);
  const s:RankState={id,mode:'rank',daily,phase:'question',round:0,questions:content.questions,datasetVersion:content.datasetVersion,answers:[],streak:0,bestStreak:0,startedAt:Date.now(),turnAt:Date.now()};
  const inserted=await run(env,'INSERT OR IGNORE INTO game_sessions(id,user_id,kind,date,state,created_at) VALUES (?,?,?,?,?,?)',id,user.id,'rank',daily,JSON.stringify(s),Date.now());
  if(!inserted.meta.changes&&daily){const saved=await one(env,'SELECT state,version FROM game_sessions WHERE user_id=? AND date=? AND kind=?',user.id,daily,'rank');return view(JSON.parse(saved.state),saved.version);}
  return view(s);
}
export async function rankAction(env: Env, user: User, id: string, action: string, input: unknown) {
  const row=await one(env,'SELECT * FROM game_sessions WHERE id=? AND user_id=?',id,user.id);
  if(!row||row.kind!=='rank')throw new AppError('GAME_NOT_FOUND',404);
  const s=JSON.parse(row.state) as RankState;
  if(action==='get'){await record(env,user,s);return view(s,row.version);}
  const body=z.object({version:z.number().int().min(0),answer:z.string().max(40).optional()}).parse(input);
  if(body.version!==row.version)throw new AppError('STATE_CHANGED',409);
  if(s.phase==='finished')throw new AppError('ANSWER_LOCKED',409);
  if(action==='answer'){
    if(s.phase!=='question')throw new AppError('ANSWER_LOCKED',409);
    const q=s.questions[s.round];
    if(!body.answer||!q.options.some(o=>o.id===body.answer))throw new AppError('INVALID_INPUT');
    const correct=body.answer===q.correct;
    s.answers.push({value:body.answer,correct,countryId:q.country.id,questionId:q.id,responseTime:Math.max(0,Date.now()-s.turnAt),at:Date.now()});
    s.streak=correct?s.streak+1:0;s.bestStreak=Math.max(s.bestStreak,s.streak);s.phase='reveal';
  }else if(action==='next'&&s.phase==='reveal'){
    if(s.round+1===s.questions.length)s.phase='finished';else{s.round++;s.phase='question';s.turnAt=Date.now();}
  }else throw new AppError('INVALID_ACTION');
  const updated=await run(env,'UPDATE game_sessions SET state=?,version=version+1,completed=? WHERE id=? AND version=?',JSON.stringify(s),+(s.phase==='finished'),id,row.version);
  if(!updated.meta.changes)throw new AppError('STATE_CHANGED',409);
  await record(env,user,s);return view(s,row.version+1);
}
async function record(env: Env,user: User,s: RankState){
  const statements=s.answers.map((a,i)=>({sql:'INSERT OR IGNORE INTO answers(session_id,round,user_id,question_id,country_id,mode,answer,correct,points,response_time,risk,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',args:[s.id,i,user.id,a.questionId,a.countryId,'rank',JSON.stringify(a.value),+a.correct,0,a.responseTime,0,a.at]}));
  if(s.phase==='finished'){
    statements.push(resultStatement(s.id,user.id,{settings:{mode:'rank'},answers:s.answers.map(a=>({...a,risk:0})),bestStreak:s.bestStreak}));
    if(s.daily)statements.push({sql:'INSERT OR IGNORE INTO daily_challenge_results(user_id,date,result_id,score) VALUES (?,?,?,?)',args:[user.id,s.daily,s.id,0]});
  }
  if(statements.length)await batch(env,statements);
}
