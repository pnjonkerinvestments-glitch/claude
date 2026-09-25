import { COMPETITION_SUFFIX, dailyScore } from '../lib/daily-scoring';
import { recordCompetition } from './competition';
import { refreshMosaicFacts } from '../lib/puzzles/country-facts';
import { reviewSession } from './reviews';
import { dailyContent } from './daily-content';
import { z } from 'zod';
import { AppError } from './auth';
import { one, rows, run, batch } from './db';
import { resultStatement } from './stats';
import { TOPICS } from '../lib/puzzles/topics';
import { dailyTopic, generateComparisons, generateMosaic } from '../lib/puzzles/generate';
import { checkMosaic, reviewMosaic, mosaicHint, type PuzzleState, type PuzzleView } from '../lib/puzzles/model';
import type { Env, User } from './types';

const schema = z.object({ mode: z.enum(['compare', 'mosaic']), daily: z.boolean().default(true), competition:z.boolean().default(false), topic: z.string().refine(v => TOPICS.some(t => t.id === v)).optional(), size: z.union([z.literal(3), z.literal(4), z.literal(5)]).default(4) });
const view = (s: PuzzleState, version = 0): PuzzleView => {
  const { questions, startedAt, turnAt, ...rest } = s;
  if (rest.board) rest.board = refreshMosaicFacts(rest.board, s.daily ?? new Date(s.startedAt).toISOString().slice(0, 10));
  const result: PuzzleView = { ...rest,...(s.competition?{score:dailyScore(s)}:{}), question: s.mode === 'compare' && s.phase !== 'finished' ? questions[s.round] : null, ...(s.mode === 'compare' && s.phase === 'finished' ? { review: questions } : {}), total: s.mode === 'compare' ? questions.length : 4, version, learning: true };
  if(s.competition) {
    delete result.mosaicAid;
    if(result.question && s.phase === 'question') result.question = {...result.question, correct:undefined, countries:result.question.countries.map(({value,...c},i)=>i===1&&result.question!.carried?{...c,value}:c)} as unknown as PuzzleView['question'];
    if(result.board) {
      const last=s.answers.at(-1), review=last && Array.isArray(last.value)?reviewMosaic(result.board,last.value):null;
      result.mosaicReview = review ? {...review,tiles:review.tiles.map(t=>({...t,countryId:t.correct?review.countryId:''}))} : null;
      result.board={...result.board,countries:result.board.countries.map(c=>({...c,flag:s.solved.includes(c.id)?c.flag:''})),tiles:result.board.tiles.map(tile=> {
        if(s.solved.includes(tile.countryId)) return tile;
        return {id:tile.id,kind:tile.kind,countryId:tile.kind==='name'?tile.countryId:'',
          ...(tile.kind==='flag'?{image:'/api/game-asset/'+s.id+'/'+encodeURIComponent(tile.id)}:{}),
          ...(tile.path?{path:tile.path}:{}),...(tile.kind==='name'?{text:tile.text}:{}),
          ...(tile.fact?.stat?{fact:{stat:tile.fact.stat} as any}:{})};
      })};
    }
  }
  return result;
};
export async function puzzleToday(env: Env, user: User, competition = false) {
  const date = new Date().toISOString().slice(0, 10);
  const sessions = await rows(env, "SELECT id,kind,completed,state FROM game_sessions WHERE user_id=? AND date=?", user.id, date);
  const recent = await rows(env, 'SELECT date FROM daily_challenge_results WHERE user_id=? AND date>=? ORDER BY date', user.id, new Date(Date.parse(date)-6*86400000).toISOString().slice(0,10));
  const tomorrow = new Date(Date.parse(date)+86400000).toISOString().slice(0,10);
  return { date, topic: dailyTopic(date), tomorrowTopic: dailyTopic(tomorrow), week: Array.from({length:7},(_,i)=>{const day=new Date(Date.parse(date)-(6-i)*86400000).toISOString().slice(0,10);return {date:day,completed:recent.some((r:any)=>r.date===day)};}), bonus: sessions.filter((s:any)=>s.kind.startsWith('bonus:')).map((s:any)=>{const state=JSON.parse(s.state);return {mode:s.kind.slice(6),completed:!!s.completed,score:state.answers?.filter((a:any)=>a.correct).length??0,total:state.questions?.length??10};}), sessions: sessions.filter((s:any)=>!s.kind.startsWith('bonus:') && (competition ? s.kind.endsWith(COMPETITION_SUFFIX) : !s.kind.endsWith(COMPETITION_SUFFIX))).map((s:any)=>{const state=JSON.parse(s.state);return {id:s.id,mode:state.competition?.mode??s.kind.replace('puzzle:',''),completed:!!s.completed,round:state.round,total:state.questions?.length||(state.mode==='duel'?5:4)};}) };
}
export async function startPuzzle(env: Env, user: User, input: unknown, focus?: string) {
  const settings = schema.parse(input), daily = settings.daily ? new Date().toISOString().slice(0, 10) : null;
  const ranked=!!daily&&settings.competition;
  const kind = 'puzzle:' + settings.mode + (ranked?COMPETITION_SUFFIX:'');
  if (daily) {
    const existing = await one(env, 'SELECT state,version FROM game_sessions WHERE user_id=? AND date=? AND kind=?', user.id, daily, kind);
    if (existing) { const s = JSON.parse(existing.state); if (s.phase === 'finished') await recordPuzzle(env, user, s); return view(s, existing.version); }
  }
  const id = crypto.randomUUID(), seed = daily ? 'roviko:puzzle:v1:' + settings.mode + ':' + daily : id;
  const topic = daily ? dailyTopic(daily).id : settings.topic ?? TOPICS[0].id;
  const size = daily ? 4 : settings.size;
  const generate = (seed: string) => ({ settings: { topic, size }, questions: settings.mode === 'compare' ? generateComparisons(topic, seed, 10, focus) : [], board: settings.mode === 'mosaic' ? generateMosaic(size, seed, focus, daily ?? new Date().toISOString().slice(0, 10)) : null });
  const content = daily ? await dailyContent(env, daily, kind, generate) : { ...generate(seed), datasetVersion: undefined };
  const blocked = await rows(env, 'SELECT question_id FROM disabled_questions');
  if (blocked.some((r:any) => content.board?.id === r.question_id || content.questions.some((q:any) => q.id === r.question_id))) throw new AppError('QUESTION_UNAVAILABLE',503);
  const s: PuzzleState = { id,...(ranked?{competition:{version:1,mode:settings.mode} as const}:{}), mode: settings.mode, daily, ...content, phase: 'question', round: 0, startedAt: Date.now(), turnAt: Date.now(), answers: [], solved: [], streak: 0, bestStreak: 0 };
  const inserted = await run(env, 'INSERT OR IGNORE INTO game_sessions(id,user_id,kind,date,state,created_at) VALUES (?,?,?,?,?,?)', id, user.id, kind, daily, JSON.stringify(s), Date.now());
  if (!inserted.meta.changes && daily) {
    const saved = await one(env, 'SELECT state,version FROM game_sessions WHERE user_id=? AND date=? AND kind=?', user.id, daily, kind);
    return view(JSON.parse(saved.state), saved.version);
  }
  return view(s);
}
export async function puzzleAction(env: Env, user: User, id: string, action: string, input: unknown) {
  const row = await one(env, 'SELECT * FROM game_sessions WHERE id=? AND user_id=?', id, user.id);
  if (!row || !row.kind.startsWith('puzzle:')) throw new AppError('GAME_NOT_FOUND', 404);
  const s = JSON.parse(row.state) as PuzzleState;
  if (action === 'get') { await reviewSession(env, user, s, row.created_at); if (s.phase === 'finished') await recordPuzzle(env, user, s); return view(s, row.version); }
  const b = z.object({ version: z.number().int().min(0), answer: z.union([z.string().max(50), z.array(z.string().max(50)).max(5)]).optional() }).parse(input);
  if (row.version !== b.version) throw new AppError('STATE_CHANGED', 409);
  if (s.phase === 'finished') throw new AppError('ANSWER_LOCKED', 409);
  if (action === 'hint' && s.competition && s.mode==='mosaic' && s.board) {
    if(!Array.isArray(b.answer)) throw new AppError('INVALID_INPUT');
    const anchor=s.board.tiles.find(t=>t.kind==='name'&&b.answer!.includes(t.id)&&!s.solved.includes(t.countryId));
    if(!anchor) throw new AppError('INVALID_INPUT');
    s.mosaicAid??={}; const aid=s.mosaicAid[anchor.countryId]??={wrong:false,hints:0}; aid.hints++;
    const selection=mosaicHint(s.board,s.solved,[anchor.id,...b.answer.filter(id=>id!==anchor.id)]);
    s.hintSelection=selection;
    const updated=await run(env,'UPDATE game_sessions SET state=?,version=version+1 WHERE id=? AND version=?',JSON.stringify(s),id,row.version);
    if(!updated.meta.changes) throw new AppError('STATE_CHANGED',409);
    return {...view(s,row.version+1),hintSelection:selection};
  }
  if (action === 'answer') {
    if (s.phase !== 'question') throw new AppError('ANSWER_LOCKED', 409);
    let correct = false, countryId = '', questionId = '';
    if (s.mode === 'compare') {
      const q = s.questions[s.round];
      if (typeof b.answer !== 'string' || !q.countries.some(c => c.id === b.answer)) throw new AppError('INVALID_INPUT');
      correct = q.correct === b.answer; countryId = q.correct; questionId = q.id; s.phase = 'reveal';
    } else {
      if (!Array.isArray(b.answer)) throw new AppError('INVALID_INPUT');
      const result = checkMosaic(s.board!, s.solved, b.answer);
      if (!result.valid || (s.competition && new Set(b.answer.map(id=>s.board!.tiles.find(t=>t.id===id)?.kind)).size!==s.board!.size)) throw new AppError('INVALID_INPUT');
      if(s.competition && !result.correct) { const anchor=s.board!.tiles.find(t=>t.kind==='name'&&b.answer!.includes(t.id))!; s.mosaicAid??={}; s.mosaicAid[anchor.countryId]={wrong:true,hints:s.mosaicAid[anchor.countryId]?.hints??0}; }
      correct = result.correct; countryId = result.countryId; questionId = s.board!.id;
      if (correct) s.solved.push(countryId);
      s.round = s.solved.length;
      if (s.solved.length === 4) s.phase = 'finished';
    }
    delete s.hintSelection;
    s.answers.push({ at: Date.now(), correct, countryId, questionId, value: b.answer!, responseTime: Math.max(0, Date.now() - s.turnAt) });
    s.turnAt = Date.now();
    s.streak = correct ? s.streak + 1 : 0; s.bestStreak = Math.max(s.bestStreak, s.streak);
  } else if (action === 'next' && s.mode === 'compare' && s.phase === 'reveal') {
    if (s.round + 1 === s.questions.length) s.phase = 'finished';
    else {
      s.round++; s.phase = 'question'; s.turnAt = Date.now();
    }
  } else throw new AppError('INVALID_ACTION');
  const updated = await run(env, 'UPDATE game_sessions SET state=?,version=version+1,completed=? WHERE id=? AND version=?', JSON.stringify(s), +(s.phase === 'finished'), id, row.version);
  if (!updated.meta.changes) throw new AppError('STATE_CHANGED', 409);
  // Immutable audit rows and result insertion are idempotent; GET repairs a retried completion.
  if (action === 'answer') { await batch(env, answerStatements(user, s).slice(-1)); await reviewSession(env, user, s, row.created_at); }
  if (s.phase === 'finished') await recordPuzzle(env, user, s);
  return view(s, row.version + 1);
}
function answerStatements(user: User, s: PuzzleState) {
  return s.answers.map((a, i) => ({ sql: 'INSERT OR IGNORE INTO answers(session_id,round,user_id,question_id,country_id,mode,answer,correct,points,response_time,risk,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)', args: [s.id, i, user.id, a.questionId, a.countryId, s.mode, JSON.stringify(a.value), +a.correct, 0, a.responseTime, 0, Date.now()] }));
}
async function recordAnswers(env: Env, user: User, s: PuzzleState) {
  const statements = answerStatements(user, s);
  for (let i = 0; i < statements.length; i += 40) await batch(env, statements.slice(i, i + 40));
}
async function recordPuzzle(env: Env, user: User, s: PuzzleState) {
  const statements = [resultStatement(s.id, user.id, { settings: { mode: s.mode }, answers: s.answers.map(a => ({ ...a, risk: 0 })), bestStreak: s.bestStreak })];
  if (s.daily) statements.push({ sql: 'INSERT OR IGNORE INTO daily_challenge_results(user_id,date,result_id,score) VALUES (?,?,?,?)', args: [user.id, s.daily, s.id, 0] });
  await recordAnswers(env, user, s);
  await batch(env, statements);
  await recordCompetition(env,user,s);
}
