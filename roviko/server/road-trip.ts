// Daily Road Trip (1.56): one trip per UTC date for everyone, one attempt per player per day (rules in lib/puzzles/road-trip.ts).
import { z } from 'zod';
import { AppError } from './auth';
import { batch, one, run } from './db';
import { dailyContent } from './daily-content';
import { recordCompetition } from './competition';
import { resultStatement } from './stats';
import { COMPETITION_SUFFIX, dailyScore } from '../lib/daily-scoring';
import { ROADTRIP_FROM, dailyModesFor } from '../lib/daily-loop';
import { ROAD_TRIP_MAX_STEPS, distancesTo, factFor, frameOf, middleOf, neighboursOf, roadTripFor, shortestRoute, type RoadTrip, type Text } from '../lib/puzzles/road-trip';
import { roadTripPoints } from '../lib/puzzles/road-trip-points';
import type { Env, User } from './types';

/** One stop on the route. `closer` is null for the start; `auto` marks the stops the car drove by itself. */
type Stop = { country: string; closer: boolean | null; at: number; auto?: boolean };
export type RoadTripState = {
  id: string; mode: 'roadtrip'; daily: string; edition: number; competition?: { version: 1; mode: 'roadtrip' };
  trip: RoadTrip; route: Stop[]; peeks: number; phase: 'playing' | 'finished'; startedAt: number;
  answers: { correct: boolean; responseTime: number; risk: number; countryId: string }[];
};
const KIND = 'roadtrip';
/** Edition number for the share text: #1 on ROADTRIP_FROM. */
export const editionOf = (date: string) => Math.max(1, Math.round((Date.parse(date + 'T00:00:00Z') - Date.parse(ROADTRIP_FROM + 'T00:00:00Z')) / 86400000) + 1);
const today = () => new Date().toISOString().slice(0, 10);
const detoursOf = (s: RoadTripState) => s.route.filter(r => r.closer === false).length;
const pointsOf = (s: RoadTripState) => s.competition ? dailyScore(s as any) : roadTripPoints(detoursOf(s), s.peeks);

/** Today's trip: started or resumed (one attempt a day). Scores only when Road Trip is one of the day's daily games. */
export async function startRoadTrip(env: Env, user: User) {
  const date = today(), ranked = (dailyModesFor(date) as readonly string[]).includes('roadtrip');
  const kind = KIND + (ranked ? COMPETITION_SUFFIX : '');
  const existing = await one(env, 'SELECT state,version FROM game_sessions WHERE user_id=? AND date=? AND kind=?', user.id, date, kind);
  if (existing) return view(JSON.parse(existing.state), existing.version);
  // The trip is frozen per date in daily_content, like every daily game: a later code change never changes a past day.
  const content = await dailyContent(env, date, KIND, () => ({ settings: {}, questions: [], board: roadTripFor(date) }));
  const trip = content.board as RoadTrip;
  const s: RoadTripState = { id: crypto.randomUUID(), mode: 'roadtrip', daily: date, edition: editionOf(date), ...(ranked ? { competition: { version: 1, mode: 'roadtrip' } as const } : {}),
    trip, route: [{ country: trip.start, closer: null, at: Date.now() }], peeks: 0, phase: 'playing', startedAt: Date.now(), answers: [] };
  const inserted = await run(env, 'INSERT OR IGNORE INTO game_sessions(id,user_id,kind,date,state,created_at) VALUES (?,?,?,?,?,?)', s.id, user.id, kind, date, JSON.stringify(s), Date.now());
  if (!inserted.meta.changes) {
    const saved = await one(env, 'SELECT state,version FROM game_sessions WHERE user_id=? AND date=? AND kind=?', user.id, date, kind);
    return view(JSON.parse(saved.state), saved.version);
  }
  return view(s, 0);
}

/** Read the trip, drive to a neighbour (final, no undo), or peek at the map (−200). */
export async function roadTripAction(env: Env, user: User, id: string, action: string, input: unknown) {
  const row = await one(env, 'SELECT * FROM game_sessions WHERE id=? AND user_id=?', id, user.id);
  if (!row || !String(row.kind).startsWith(KIND)) throw new AppError('GAME_NOT_FOUND', 404);
  const s = JSON.parse(row.state) as RoadTripState;
  if (action === 'get') { if (s.phase === 'finished') await record(env, user, s); return view(s, row.version); }
  if (action !== 'drive' && action !== 'peek') throw new AppError('INVALID_ACTION');
  const b = z.object({ version: z.number().int().min(0), country: z.string().trim().length(3).optional() }).parse(input);
  if (s.phase === 'finished') throw new AppError('ANSWER_LOCKED', 409);
  if (row.version !== b.version) throw new AppError('STATE_CHANGED', 409);
  if (action === 'peek') s.peeks++;
  else {
    const last = s.route.at(-1)!.country, next = b.country ?? '';
    if (!neighboursOf(last).includes(next)) throw new AppError('NOT_A_NEIGHBOUR', 400);
    const d = distancesTo(s.trip.finish), closer = d.get(next)! < d.get(last)!;
    s.route.push({ country: next, closer, at: Date.now() });
    s.answers.push({ correct: closer, responseTime: 0, risk: 0, countryId: next });
    // Next to the finish: the car drives on by itself and the trip is done. After 40 steps it drives the shortest way home.
    if (d.get(next) === 1) s.route.push({ country: s.trip.finish, closer: true, at: Date.now(), auto: true });
    else if (s.route.length > ROAD_TRIP_MAX_STEPS) for (const c of shortestRoute(next, s.trip.finish).slice(1)) s.route.push({ country: c, closer: true, at: Date.now(), auto: true });
    if (s.route.at(-1)!.country === s.trip.finish) s.phase = 'finished';
  }
  const updated = await run(env, 'UPDATE game_sessions SET state=?,version=version+1,score=?,completed=? WHERE id=? AND version=?', JSON.stringify(s), pointsOf(s), s.phase === 'finished' ? 1 : 0, id, row.version);
  if (!updated.meta.changes) throw new AppError('STATE_CHANGED', 409);
  if (s.phase === 'finished') await record(env, user, s);
  return view(s, row.version + 1);
}

/** Results, streak, rankings and passport stamps, once (every write is INSERT OR IGNORE). */
async function record(env: Env, user: User, s: RoadTripState) {
  const statements: any[] = [resultStatement(s.id, user.id, { settings: { mode: 'roadtrip' }, answers: s.answers, bestStreak: 0 })];
  statements.push({ sql: 'INSERT OR IGNORE INTO daily_challenge_results(user_id,date,result_id,score) VALUES (?,?,?,?)', args: [user.id, s.daily, s.id, 0] });
  // Every country you drove through that got you closer is a passport stamp, like the right answers in the other daily games.
  s.route.forEach((stop, i) => { if (i > 0 && stop.closer && !stop.auto) statements.push({ sql: 'INSERT OR IGNORE INTO answers(session_id,round,user_id,question_id,country_id,mode,answer,correct,points,response_time,risk,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
    args: [s.id, i, user.id, 'roadtrip:' + s.daily + ':' + i, stop.country, 'roadtrip', JSON.stringify(stop.country), 1, 0, 0, 0, Date.now()] }); });
  await batch(env, statements);
  await recordCompetition(env, user, s);
}

/** What the device may see: start, finish, your route with a fact per stop, the neighbours you can drive to now and the
 *  frame of the map. One shortest route only once the trip is done. */
function view(s: RoadTripState, version: number) {
  const last = s.route.at(-1)!.country, finished = s.phase === 'finished';
  const options = finished ? [] : neighboursOf(last);
  const shown = new Set([s.trip.start, s.trip.finish, ...s.route.map(r => r.country), ...options]);
  const best = finished ? shortestRoute(s.trip.start, s.trip.finish) : null;
  for (const c of best ?? []) shown.add(c);
  const middles: Record<string, [number, number]> = {};
  for (const c of shown) { const m = middleOf(c); if (m) middles[c] = m; }
  const facts: Record<string, Text | null> = {};
  for (const r of s.route) facts[r.country] ??= factFor(r.country, s.daily);
  return { id: s.id, mode: 'roadtrip' as const, daily: s.daily, edition: s.edition, version, phase: s.phase, competition: s.competition ?? null,
    start: s.trip.start, finish: s.trip.finish, shortest: s.trip.shortest, frame: frameOf(s.trip.start, s.trip.finish),
    route: s.route.map(r => ({ country: r.country, closer: r.closer, auto: !!r.auto })), options, middles, facts,
    detours: detoursOf(s), peeks: s.peeks, score: pointsOf(s), best };
}
