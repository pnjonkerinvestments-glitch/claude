import { z } from 'zod';
import { nextMode } from '../lib/next-discovery';
import { DEFAULT_SETTINGS } from '../lib/config';
import { generateQuestions, type Question } from '../lib/game-engine/questions';
import { shuffle, random } from '../lib/game-engine/scoring';
import { reviewMosaic } from '../lib/puzzles/model';
import { prepareGeography } from './geography';
import { AppError } from './auth';
import { one, rows, run } from './db';
import type { Env, User } from './types';

/** A resumable follow-up belongs to its source player; no client-selected answers or rewards. */
export async function followUp(env:Env,user:User,input:unknown) {
  const {sessionId,intent}=z.object({sessionId:z.string().min(1).max(100),intent:z.enum(['review','next'])}).parse(input);
  const source=await one(env,'SELECT state FROM game_sessions WHERE id=? AND user_id=? AND completed=1',sessionId,user.id);
  if(!source)throw new AppError('GAME_NOT_FOUND',404);
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(user.id+':'+sessionId+':'+intent));
  const id='follow-'+Array.from(new Uint8Array(digest)).map(v=>v.toString(16).padStart(2,'0')).join('').slice(0,32);
  const existing=await one(env,'SELECT kind FROM game_sessions WHERE id=? AND user_id=?',id,user.id);
  if(existing)return {href:(existing.kind.startsWith('puzzle:')?'/puzzle/':'/game/')+id};
  const original=JSON.parse(source.state),disabled=(await rows(env,'SELECT question_id FROM disabled_questions')).map((q:any)=>q.question_id);
  if(original.mode==='rank')throw new AppError('INVALID_ACTION');
  const missed=original.answers.map((answer:any,i:number)=>({answer,i})).filter(({answer}:any)=>!answer.correct);
  const isReview=intent==='review' && missed.length>0,now=Date.now();
  let settings={...DEFAULT_SETTINGS,...original.settings,mode:nextMode(original.daily?'daily':original.mode ?? original.settings.mode),timer:0,count:5};
  let questions:Question[]=[],state:any,kind=settings.mode;
  if(isReview && original.mode==='compare') {
    const comparisons=missed.map(({i}:any)=>original.questions[i]).filter((q:any)=>q&&!disabled.includes(q.id)).slice(0,5).map((q:any)=>({...q,carried:false}));
    if(!comparisons.length)throw new AppError('QUESTION_UNAVAILABLE',503);
    kind='puzzle:compare';
    state={id,mode:'compare',daily:null,settings:original.settings,questions:comparisons,board:null,phase:'question',round:0,startedAt:now,turnAt:now,answers:[],solved:[],streak:0,bestStreak:0,practice:true,reviewOf:sessionId};
  } else {
    if(isReview && original.mode==='mosaic') {
      const concepts=new Map<string,{mode:string;countryId:string}>();
      for(const {answer} of missed){const review=reviewMosaic(original.board,answer.value);if(!review)continue;for(const tile of review.tiles.filter(t=>!t.correct)){
        const mode=tile.kind==='flag'?'flags':tile.kind==='capital'?'capitals':tile.kind==='shape'?'pinpoint':'trail';
        concepts.set(mode+':'+review.countryId,{mode,countryId:review.countryId});
      }}
      for(const [key,target] of [...concepts].slice(0,5)) {
        const q=generateQuestions({...DEFAULT_SETTINGS,mode:target.mode,count:1,timer:0},id+key,disabled,[],target.countryId,disabled)[0];
        if(q?.countryId===target.countryId)questions.push(q);
      }
      settings={...DEFAULT_SETTINGS,mode:'mixed',count:questions.length,timer:0};
    } else if(isReview) {
      questions=missed.map(({i}:any)=>original.questions[i]).filter((q:any)=>q&&!disabled.includes(q.id)).slice(0,5);
      settings={...original.settings,mode:original.settings.mode==='daily'?'mixed':original.settings.mode,count:questions.length,timer:0};
    } else {
      const seen=new Set<string>();
      const countries=original.board?.countries.map((c:any)=>c.id) ?? original.answers.filter((a:any)=>a.correct).map((a:any)=>a.countryId);
      for(const country of countries ?? []) {
        if(seen.has(country) || questions.length===5)continue;seen.add(country);
        const q=generateQuestions({...settings,count:1},id+country,disabled,[],country,disabled)[0];
        if(q)questions.push(q);
      }
      const extra=generateQuestions(settings,id,disabled,[],undefined,disabled);
      for(const q of extra){if(questions.length===5)break;if(!questions.some(p=>p.id===q.id))questions.push(q);}
    }
    if(!questions.length)throw new AppError('QUESTION_UNAVAILABLE',503);
    questions=questions.map(q=>({...q,options:shuffle(q.options,random(id+q.id))}));
    kind=settings.mode;
    state={id,settings:{...settings,count:questions.length},questions:prepareGeography(questions),phase:'question',round:0,startAt:now,startedAt:now,answers:[],score:0,xp:0,personalBest:0,streak:0,bestStreak:0,daily:null,practice:isReview,reviewOf:isReview?sessionId:undefined};
  }
  await run(env,'INSERT OR IGNORE INTO game_sessions(id,user_id,kind,date,state,created_at) VALUES (?,?,?,?,?,?)',id,user.id,kind,null,JSON.stringify(state),now);
  return {href:(kind.startsWith('puzzle:')?'/puzzle/':'/game/')+id};
}
