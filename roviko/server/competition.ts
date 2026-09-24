import { DAILY_POINT_MODES, dailyScore, type Competition } from '../lib/daily-scoring';
import { one, rows, run } from './db';
import { AppError } from './auth';
import type { Env, User } from './types';

/** Only completed, canonical, server-owned daily sessions can write this immutable ledger. */
export async function recordCompetition(env: Env, user: User, s: {id:string; daily:string|null; phase:string; answers:any[]; competition?:Competition}) {
  if (!s.daily || s.phase !== 'finished' || s.competition?.version !== 1 || !DAILY_POINT_MODES.includes(s.competition.mode)) return;
  await run(env, `INSERT OR IGNORE INTO daily_scores(user_id,date,mode,session_id,score,scoring_version,created_at)
    SELECT ?,?,?,?,?,1,? WHERE EXISTS(SELECT 1 FROM game_sessions WHERE id=? AND user_id=? AND date=? AND completed=1)`,
    user.id,s.daily,s.competition.mode,s.id,dailyScore(s),Date.now(),s.id,user.id,s.daily);
}
async function ranking(env: Env, user: User, date?: string, mode?: string) {
  const filters = ['u.blocked=0'], args: string[] = [];
  if (date) { filters.push('d.date=?'); args.push(date); }
  if (mode) { filters.push('d.mode=?'); args.push(mode); }
  const cte = `WITH totals AS (SELECT d.user_id,SUM(d.score) score,COUNT(*) games,CASE WHEN u.discoverable=1 THEN u.name ELSE 'Explorer' END name,u.avatar FROM daily_scores d JOIN users u ON u.id=d.user_id WHERE ${filters.join(' AND ')} GROUP BY d.user_id), ranked AS (SELECT *,RANK() OVER(ORDER BY score DESC) place FROM totals)`;
  const summary = await one(env, cte + ' SELECT COUNT(*) participants,COALESCE(MAX(CASE WHEN user_id=? THEN score END),0) score,MAX(CASE WHEN user_id=? THEN place END) place,COALESCE(MAX(CASE WHEN user_id=? THEN games END),0) games FROM ranked',...args,user.id,user.id,user.id);
  const leaders = await rows(env, cte + ' SELECT name,avatar,score,place,user_id=? me FROM ranked ORDER BY score DESC,user_id LIMIT 10',...args,user.id);
  return {...summary,leaders};
}
export async function competitionSummary(env: Env, user: User, date: string, mode?: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date+'T00:00:00Z')) || new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date || (mode && !DAILY_POINT_MODES.includes(mode as any))) throw new AppError('INVALID_INPUT');
  const yesterday = new Date(Date.parse(date+'T00:00:00Z')-86400000).toISOString().slice(0,10);
  const [today,total,game,scores,bests,bestDay,previous] = await Promise.all([
    ranking(env,user,date),ranking(env,user),mode ? ranking(env,user,date,mode) : Promise.resolve(null),
    rows(env,'SELECT mode,score FROM daily_scores WHERE user_id=? AND date=?',user.id,date),
    // Personal bests from earlier days only, so today's own result can beat them.
    rows(env,'SELECT mode,MAX(score) best,COUNT(*) plays FROM daily_scores WHERE user_id=? AND date<? GROUP BY mode',user.id,date),
    one(env,'SELECT MAX(total) best FROM (SELECT SUM(score) total FROM daily_scores WHERE user_id=? AND date<? GROUP BY date)',user.id,date),
    one(env,'SELECT COALESCE(SUM(score),0) score,COUNT(*) games FROM daily_scores WHERE user_id=? AND date=?',user.id,yesterday),
  ]);
  const personalBest = Object.fromEntries(bests.map((b:any)=>[b.mode,{best:Number(b.best),plays:Number(b.plays)}]));
  return {date,today,total,game,scores,personalBest,bestDay:bestDay?.best==null?null:Number(bestDay.best),yesterday:{score:Number(previous?.score??0),games:Number(previous?.games??0)},maxPerGame:1000,maxPerDay:5000};
}
