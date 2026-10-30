import { DAILY_POINT_MODES, DAILY_TOTAL_MAX, dailyScore, type Competition } from '../lib/daily-scoring';
import { CROSSROADS_FROM, ROADTRIP_FROM, SHAPE_FROM, SHUFFLE_FROM, dayModesFor } from '../lib/daily-loop';

/**
 * The daily Size Shuffle (1.24) has no mode of its own in the ledger: the CHECK on daily_scores.mode only allows the six
 * modes of 1.21 and SQLite cannot widen a CHECK without rebuilding the table. A UTC date has one fourth game, so the
 * Size Shuffle uses Country Mosaic's slot from SHUFFLE_FROM on: stored as 'mosaic', read back as 'order' for those dates.
 * Totals, weeks and leagues only sum scores and never notice. Never change SHUFFLE_FROM once it has passed.
 * The same for Shape Shift (1.41): it replaces World Duel from SHAPE_FROM on, stored as 'duel', read back as 'shape'.
 * And for Daily Crossroads (1.55): it replaces the daily Clue Trail from CROSSROADS_FROM on, stored as 'trail', read back as
 * 'crossroads'. Clue Trail points of earlier dates stay 'trail'.
 * And for Daily Road Trip (1.56): it replaces Crossroads from ROADTRIP_FROM on, in the same slot: stored as 'trail', read
 * back as 'roadtrip' from ROADTRIP_FROM, as 'crossroads' from CROSSROADS_FROM until then, as 'trail' before.
 */
export const ledgerMode = (mode: string) => mode === 'order' ? 'mosaic' : mode === 'shape' ? 'duel' : mode === 'crossroads' || mode === 'roadtrip' ? 'trail' : mode;
export const MODE_SQL = (alias = '') => `CASE WHEN ${alias}mode='mosaic' AND ${alias}date>='${SHUFFLE_FROM}' THEN 'order' WHEN ${alias}mode='duel' AND ${alias}date>='${SHAPE_FROM}' THEN 'shape' WHEN ${alias}mode='trail' AND ${alias}date>='${ROADTRIP_FROM}' THEN 'roadtrip' WHEN ${alias}mode='trail' AND ${alias}date>='${CROSSROADS_FROM}' THEN 'crossroads' ELSE ${alias}mode END`;
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
type Scope = { date?: string; since?: string; mode?: string; friendsOf?: string };
async function ranking(env: Env, user: User, scope: Scope = {}) {
  const filters = ['u.blocked=0'], args: string[] = [];
  if (scope.date) { filters.push('d.date=?'); args.push(scope.date); }
  if (scope.since) { filters.push('d.date>=?'); args.push(scope.since); }
  if (scope.mode) { filters.push(MODE_SQL('d.') + '=?'); args.push(scope.mode); }
  if (scope.friendsOf) { filters.push("d.user_id IN (SELECT CASE WHEN from_id=? THEN to_id ELSE from_id END FROM friend_requests WHERE status='accepted' AND (from_id=? OR to_id=?) UNION SELECT ?)"); args.push(scope.friendsOf, scope.friendsOf, scope.friendsOf, scope.friendsOf); }
  const cte = `WITH totals AS (SELECT d.user_id,SUM(d.score) score,COUNT(*) games,CASE WHEN u.discoverable=1 THEN u.name ELSE 'Explorer' END name,u.avatar FROM daily_scores d JOIN users u ON u.id=d.user_id WHERE ${filters.join(' AND ')} GROUP BY d.user_id), ranked AS (SELECT *,RANK() OVER(ORDER BY score DESC) place,ROW_NUMBER() OVER(ORDER BY score DESC,user_id) rn FROM totals), mine AS (SELECT * FROM ranked WHERE user_id=?)`;
  // 1.54: one query instead of up to four, each of which added up the whole period again. Rows: the summary, the top 10,
  // the player just above you (your next target, when you are not first) and, outside the top 10, two above and below you.
  // below (1.35): players with a strictly lower score, for "better than X%" without counting ties as beaten.
  const cols = 'name,avatar,score,place,user_id=? me,rn';
  const all = await rows(env, cte + ` SELECT 's' k,NULL name,NULL avatar,COALESCE((SELECT score FROM mine),0) score,(SELECT place FROM mine) place,0 me,NULL rn,COUNT(*) participants,COALESCE((SELECT games FROM mine),0) games,SUM(CASE WHEN score<(SELECT score FROM mine) THEN 1 ELSE 0 END) below FROM ranked
    UNION ALL SELECT 'l' k,${cols},NULL,NULL,NULL FROM ranked WHERE rn<=10
    UNION ALL SELECT * FROM (SELECT 'n' k,${cols},NULL,NULL,NULL FROM ranked WHERE (SELECT place FROM mine)>1 AND score>(SELECT score FROM mine) ORDER BY score ASC,user_id LIMIT 1)
    UNION ALL SELECT 'a' k,${cols},NULL,NULL,NULL FROM ranked WHERE (SELECT place FROM mine)>10 AND rn BETWEEN (SELECT rn FROM mine)-2 AND (SELECT rn FROM mine)+2`, ...args, user.id, user.id, user.id, user.id);
  const strip = (r: any) => ({ name: r.name, avatar: r.avatar, score: r.score, place: r.place, me: r.me });
  const s = all.find((r: any) => r.k === 's') ?? { participants: 0, score: 0, place: null, games: 0, below: 0 };
  const summary = { participants: s.participants, score: s.score, place: s.place, games: s.games, below: s.below };
  const leaders = all.filter((r: any) => r.k === 'l').sort((a: any, b: any) => a.rn - b.rn).map(strip);
  const around = all.filter((r: any) => r.k === 'a').sort((a: any, b: any) => a.rn - b.rn).map(strip);
  const next = all.find((r: any) => r.k === 'n');
  return {...summary,leaders,around,next:next?{name:next.name,score:Number(next.score),place:Number(next.place),gap:Number(next.score)-Number(summary.score)}:null};
}
/** 1.54: your own all-time points (the only part of the all-time standing the app shows since "Month" took its place). */
async function ownTotal(env: Env, user: User) {
  const r = await one(env, 'SELECT COALESCE(SUM(score),0) score,COUNT(*) games FROM daily_scores WHERE user_id=?', user.id);
  return { participants: 0, score: Number(r?.score ?? 0), place: null, games: Number(r?.games ?? 0), below: 0, leaders: [], around: [], next: null };
}
export { weekStart } from './week';
export async function competitionSummary(env: Env, user: User, date: string, mode?: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date+'T00:00:00Z')) || new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date || (mode && !DAILY_POINT_MODES.includes(mode as any))) throw new AppError('INVALID_INPUT');
  const yesterday = new Date(Date.parse(date+'T00:00:00Z')-86400000).toISOString().slice(0,10);
  // Friends ranking: you plus accepted friends, today. Guests have no friends list.
  // 1.54: the friends are read alongside everything else; the friends standing is only kept when you have friends.
  const friendSql = "SELECT CASE WHEN from_id=? THEN to_id ELSE from_id END id FROM friend_requests WHERE status='accepted' AND (from_id=? OR to_id=?)";
  // 1.50: "this month" (the UTC month of the date, fresh every 1st) replaces "all time" as a ranking, so a new player can
  // reach the top; `total` stays in the answer for your own all-time points.
  const [today,total,game,week,month,friendRanking,friendRows,scores,bests,bestDay,previous] = await Promise.all([
    ranking(env,user,{date}),ownTotal(env,user),mode ? ranking(env,user,{date,mode}) : Promise.resolve(null),
    ranking(env,user,{since:weekStart(date)}),ranking(env,user,{since:date.slice(0,8)+'01'}),
    user.guest ? Promise.resolve(null) : ranking(env,user,{date,friendsOf:user.id}),
    user.guest ? Promise.resolve([]) : rows(env,friendSql+' LIMIT 1',user.id,user.id,user.id),
    rows(env,'SELECT '+MODE_SQL()+' mode,score FROM daily_scores WHERE user_id=? AND date=?',user.id,date),
    // Personal bests from earlier days only, so today's own result can beat them.
    rows(env,'SELECT '+MODE_SQL()+' mode,MAX(score) best,COUNT(*) plays FROM daily_scores WHERE user_id=? AND date<? GROUP BY 1',user.id,date),
    one(env,'SELECT MAX(total) best FROM (SELECT SUM(score) total FROM daily_scores WHERE user_id=? AND date<? GROUP BY date)',user.id,date),
    one(env,'SELECT COALESCE(SUM(score),0) score,COUNT(*) games FROM daily_scores WHERE user_id=? AND date=?',user.id,yesterday),
  ]);
  const friends = friendRows.length ? friendRanking : null;
  const personalBest = Object.fromEntries(bests.map((b:any)=>[b.mode,{best:Number(b.best),plays:Number(b.plays)}]));
  return {date,today,total,game,week,month,weekStart:weekStart(date),monthStart:date.slice(0,8)+'01',friends,scores,personalBest,bestDay:bestDay?.best==null?null:Number(bestDay.best),yesterday:{score:Number(previous?.score??0),games:Number(previous?.games??0)},maxPerGame:1000,maxPerDay:DAILY_TOTAL_MAX};
}
