import { DAILY_POINT_MODES, DAILY_TOTAL_MAX, dailyScore, type Competition } from '../lib/daily-scoring';
import { SHUFFLE_FROM, dayModesFor } from '../lib/daily-loop';

/**
 * The daily Size Shuffle (1.24) has no mode of its own in the ledger: the CHECK on daily_scores.mode only allows the six
 * modes of 1.21 and SQLite cannot widen a CHECK without rebuilding the table. A UTC date has one fourth game, so the
 * Size Shuffle uses Country Mosaic's slot from SHUFFLE_FROM on: stored as 'mosaic', read back as 'order' for those dates.
 * Totals, weeks and leagues only sum scores and never notice. Never change SHUFFLE_FROM once it has passed.
 */
export const ledgerMode = (mode: string) => mode === 'order' ? 'mosaic' : mode;
const MODE_SQL = (alias = '') => `CASE WHEN ${alias}mode='mosaic' AND ${alias}date>='${SHUFFLE_FROM}' THEN 'order' ELSE ${alias}mode END`;
import { one, rows, run } from './db';
import { AppError } from './auth';
import type { Env, User } from './types';
import { weekStart } from './week';
import { ensureLeague } from './league';

/** Only completed, canonical, server-owned daily sessions can write this immutable ledger. */
export async function recordCompetition(env: Env, user: User, s: {id:string; daily:string|null; phase:string; answers:any[]; competition?:Competition}) {
  if (!s.daily || s.phase !== 'finished' || s.competition?.version !== 1 || !DAILY_POINT_MODES.includes(s.competition.mode)) return;
  // Six games per UTC date: only the lineup of the session's own date scores (Mosaic before SHUFFLE_FROM, Size Shuffle from then on).
  if (!dayModesFor(s.daily).includes(s.competition.mode as any)) return;
  await run(env, `INSERT OR IGNORE INTO daily_scores(user_id,date,mode,session_id,score,scoring_version,created_at)
    SELECT ?,?,?,?,?,1,? WHERE EXISTS(SELECT 1 FROM game_sessions WHERE id=? AND user_id=? AND date=? AND completed=1)`,
    user.id,s.daily,ledgerMode(s.competition.mode),s.id,dailyScore(s),Date.now(),s.id,user.id,s.daily);
  // Accounts join this week's league group with their first points of the week. Never blocks the saved result.
  // Only this week's points join a league: reopening an old finished game must not start a membership for a past week.
  if (!user.guest && weekStart(s.daily) === weekStart(new Date().toISOString().slice(0, 10))) { try { await ensureLeague(env, user, s.daily); } catch { /* joins on the next visit instead */ } }
}
type Scope = { date?: string; since?: string; mode?: string; userIds?: string[] };
async function ranking(env: Env, user: User, scope: Scope = {}) {
  const filters = ['u.blocked=0'], args: string[] = [];
  if (scope.date) { filters.push('d.date=?'); args.push(scope.date); }
  if (scope.since) { filters.push('d.date>=?'); args.push(scope.since); }
  if (scope.mode) { filters.push(MODE_SQL('d.') + '=?'); args.push(scope.mode); }
  if (scope.userIds) { filters.push('d.user_id IN (' + scope.userIds.map(() => '?').join(',') + ')'); args.push(...scope.userIds); }
  const cte = `WITH totals AS (SELECT d.user_id,SUM(d.score) score,COUNT(*) games,CASE WHEN u.discoverable=1 THEN u.name ELSE 'Explorer' END name,u.avatar FROM daily_scores d JOIN users u ON u.id=d.user_id WHERE ${filters.join(' AND ')} GROUP BY d.user_id), ranked AS (SELECT *,RANK() OVER(ORDER BY score DESC) place FROM totals)`;
  // below (1.35): players with a strictly lower score, for "better than X%" without counting ties as beaten.
  const summary = await one(env, cte + ' SELECT COUNT(*) participants,COALESCE(MAX(CASE WHEN user_id=? THEN score END),0) score,MAX(CASE WHEN user_id=? THEN place END) place,COALESCE(MAX(CASE WHEN user_id=? THEN games END),0) games,SUM(CASE WHEN score<(SELECT score FROM ranked WHERE user_id=?) THEN 1 ELSE 0 END) below FROM ranked',...args,user.id,user.id,user.id,user.id);
  const leaders = await rows(env, cte + ' SELECT name,avatar,score,place,user_id=? me FROM ranked ORDER BY score DESC,user_id LIMIT 10',...args,user.id);
  // The player just above you: the next target. Nothing when you lead or have not played.
  const next = summary?.place > 1 ? await one(env, cte + ' SELECT name,score,place FROM ranked WHERE score>? ORDER BY score ASC,user_id LIMIT 1',...args,summary.score) : null;
  // Around your place (1.35): outside the top 10 you also see the two players above and below you.
  const around = summary?.place > 10 ? await rows(env, cte + ', numbered AS (SELECT *,ROW_NUMBER() OVER(ORDER BY score DESC,user_id) rn FROM ranked), mine AS (SELECT rn FROM numbered WHERE user_id=?) SELECT name,avatar,score,place,user_id=? me FROM numbered WHERE rn BETWEEN (SELECT rn FROM mine)-2 AND (SELECT rn FROM mine)+2 ORDER BY rn',...args,user.id,user.id) : [];
  return {...summary,leaders,around,next:next?{name:next.name,score:Number(next.score),place:Number(next.place),gap:Number(next.score)-Number(summary.score)}:null};
}
export { weekStart } from './week';
export async function competitionSummary(env: Env, user: User, date: string, mode?: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date+'T00:00:00Z')) || new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date || (mode && !DAILY_POINT_MODES.includes(mode as any))) throw new AppError('INVALID_INPUT');
  const yesterday = new Date(Date.parse(date+'T00:00:00Z')-86400000).toISOString().slice(0,10);
  // Friends ranking: you plus accepted friends, today. Guests have no friends list.
  const friendIds = user.guest ? [] : (await rows(env,"SELECT CASE WHEN from_id=? THEN to_id ELSE from_id END id FROM friend_requests WHERE status='accepted' AND (from_id=? OR to_id=?)",user.id,user.id,user.id)).map((r:any)=>r.id);
  const [today,total,game,week,friends,scores,bests,bestDay,previous] = await Promise.all([
    ranking(env,user,{date}),ranking(env,user),mode ? ranking(env,user,{date,mode}) : Promise.resolve(null),
    ranking(env,user,{since:weekStart(date)}),
    friendIds.length ? ranking(env,user,{date,userIds:[user.id,...friendIds]}) : Promise.resolve(null),
    rows(env,'SELECT '+MODE_SQL()+' mode,score FROM daily_scores WHERE user_id=? AND date=?',user.id,date),
    // Personal bests from earlier days only, so today's own result can beat them.
    rows(env,'SELECT '+MODE_SQL()+' mode,MAX(score) best,COUNT(*) plays FROM daily_scores WHERE user_id=? AND date<? GROUP BY 1',user.id,date),
    one(env,'SELECT MAX(total) best FROM (SELECT SUM(score) total FROM daily_scores WHERE user_id=? AND date<? GROUP BY date)',user.id,date),
    one(env,'SELECT COALESCE(SUM(score),0) score,COUNT(*) games FROM daily_scores WHERE user_id=? AND date=?',user.id,yesterday),
  ]);
  const personalBest = Object.fromEntries(bests.map((b:any)=>[b.mode,{best:Number(b.best),plays:Number(b.plays)}]));
  return {date,today,total,game,week,weekStart:weekStart(date),friends,scores,personalBest,bestDay:bestDay?.best==null?null:Number(bestDay.best),yesterday:{score:Number(previous?.score??0),games:Number(previous?.games??0)},maxPerGame:1000,maxPerDay:DAILY_TOTAL_MAX};
}
