// Daily Close Call (1.57): one set of three rounds per UTC date for everyone, one attempt per player per day
// (rules in lib/puzzles/close-call.ts).
import { z } from 'zod';
import { AppError } from './auth';
import { batch, one, run } from './db';
import { dailyContent } from './daily-content';
import { recordCompetition } from './competition';
import { resultStatement } from './stats';
import { COMPETITION_SUFFIX, dailyScore } from '../lib/daily-scoring';
import { CLOSECALL_FROM, dailyModesFor } from '../lib/daily-loop';
import { CLOSE_CALL_ROUNDS, ROUND_MAX, closeCallFor, roundPoints, valueOf, type CloseCallRound } from '../lib/puzzles/close-call';
import type { Env, User } from './types';

type Played = { drawn: number; held: boolean; bust: boolean; total: number; points: number };
export type CloseCallState = {
  id: string; mode: 'closecall'; daily: string; edition: number; competition?: { version: 1; mode: 'closecall' };
  rounds: CloseCallRound[]; round: number; played: Played[]; phase: 'playing' | 'finished'; startedAt: number;
  answers: { correct: boolean; points: number; responseTime: number; risk: number }[];
};
const KIND = 'closecall';
/** Edition number for the share text: #1 on CLOSECALL_FROM. */
export const editionOf = (date: string) => Math.max(1, Math.round((Date.parse(date + 'T00:00:00Z') - Date.parse(CLOSECALL_FROM + 'T00:00:00Z')) / 86400000) + 1);
const today = () => new Date().toISOString().slice(0, 10);
const pointsOf = (s: CloseCallState) => s.competition ? dailyScore(s as any) : s.played.reduce((n, p) => n + p.points, 0);

/** Today's rounds: started or resumed (one attempt a day). Scores only when Close Call is one of the day's daily games. */
export async function startCloseCall(env: Env, user: User) {
  const date = today();
  // Scored when Close Call is one of the day's daily games, unless this player already has points in its slot that day
  // (the game it replaced, played on the switch day before Close Call went live): one sixth game a day, never two.
  const ranked = (dailyModesFor(date) as readonly string[]).includes('closecall')
    && !await one(env, "SELECT 1 FROM daily_scores d WHERE d.user_id=? AND d.date=? AND d.mode='trail' AND NOT EXISTS(SELECT 1 FROM game_sessions g WHERE g.id=d.session_id AND g.kind LIKE 'closecall%')", user.id, date);
  const kind = KIND + (ranked ? COMPETITION_SUFFIX : '');
  const existing = await one(env, 'SELECT state,version FROM game_sessions WHERE user_id=? AND date=? AND kind=?', user.id, date, kind);
  if (existing) return view(JSON.parse(existing.state), existing.version);
  // The rounds are frozen per date in daily_content, like every daily game: a later code change never changes a past day.
  const content = await dailyContent(env, date, KIND, () => ({ settings: {}, questions: [], board: { rounds: closeCallFor(date) } }));
  const rounds = (content.board as { rounds: CloseCallRound[] }).rounds;
  const s: CloseCallState = { id: crypto.randomUUID(), mode: 'closecall', daily: date, edition: editionOf(date), ...(ranked ? { competition: { version: 1, mode: 'closecall' } as const } : {}),
    rounds, round: 0, played: rounds.map(() => ({ drawn: 0, held: false, bust: false, total: 0, points: 0 })), phase: 'playing', startedAt: Date.now(), answers: [] };
  const inserted = await run(env, 'INSERT OR IGNORE INTO game_sessions(id,user_id,kind,date,state,created_at) VALUES (?,?,?,?,?,?)', s.id, user.id, kind, date, JSON.stringify(s), Date.now());
  if (!inserted.meta.changes) {
    const saved = await one(env, 'SELECT state,version FROM game_sessions WHERE user_id=? AND date=? AND kind=?', user.id, date, kind);
    return view(JSON.parse(saved.state), saved.version);
  }
  return view(s, 0);
}

/** Read the game, draw the next country, or hold. Every choice is final. */
export async function closeCallAction(env: Env, user: User, id: string, action: string, input: unknown) {
  const row = await one(env, 'SELECT * FROM game_sessions WHERE id=? AND user_id=?', id, user.id);
  if (!row || !String(row.kind).startsWith(KIND)) throw new AppError('GAME_NOT_FOUND', 404);
  const s = JSON.parse(row.state) as CloseCallState;
  if (action === 'get') { if (s.phase === 'finished') await record(env, user, s); return view(s, row.version); }
  if (action !== 'draw' && action !== 'hold') throw new AppError('INVALID_ACTION');
  const b = z.object({ version: z.number().int().min(0) }).parse(input);
  if (s.phase === 'finished') throw new AppError('ANSWER_LOCKED', 409);
  if (row.version !== b.version) throw new AppError('STATE_CHANGED', 409);
  const r = s.rounds[s.round], p = s.played[s.round];
  if (action === 'hold') {
    if (p.drawn === 0) throw new AppError('DRAW_FIRST', 400);
    p.held = true;
  } else {
    p.total += valueOf(r.topic, r.deck[p.drawn]) ?? 0; p.drawn++;
    if (p.total > r.target) p.bust = true;
  }
  if (p.held || p.bust) {
    p.points = roundPoints(s.round, p.total, r.target, p.bust);
    s.answers.push({ correct: !p.bust, points: p.points, responseTime: 0, risk: 0 });
    if (s.round + 1 < CLOSE_CALL_ROUNDS) s.round++; else s.phase = 'finished';
  }
  const updated = await run(env, 'UPDATE game_sessions SET state=?,version=version+1,score=?,completed=? WHERE id=? AND version=?', JSON.stringify(s), pointsOf(s), s.phase === 'finished' ? 1 : 0, id, row.version);
  if (!updated.meta.changes) throw new AppError('STATE_CHANGED', 409);
  if (s.phase === 'finished') await record(env, user, s);
  return view(s, row.version + 1);
}

/** Results, streak, rankings and passport stamps, once (every write is INSERT OR IGNORE). */
async function record(env: Env, user: User, s: CloseCallState) {
  const statements: any[] = [resultStatement(s.id, user.id, { settings: { mode: 'closecall' }, answers: s.answers, bestStreak: 0 })];
  statements.push({ sql: 'INSERT OR IGNORE INTO daily_challenge_results(user_id,date,result_id,score) VALUES (?,?,?,?)', args: [user.id, s.daily, s.id, 0] });
  // Every country you drew without going over is a passport stamp, like the right answers in the other daily games.
  s.rounds.forEach((r, ri) => { const p = s.played[ri]; r.deck.slice(0, p.bust ? p.drawn - 1 : p.drawn).forEach((country, i) => statements.push({
    sql: 'INSERT OR IGNORE INTO answers(session_id,round,user_id,question_id,country_id,mode,answer,correct,points,response_time,risk,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
    args: [s.id, ri * 100 + i, user.id, 'closecall:' + s.daily + ':' + ri + ':' + i, country, 'closecall', JSON.stringify(country), 1, 0, 0, 0, Date.now()] })); });
  await batch(env, statements);
  await recordCompetition(env, user, s);
}

/** What the device may see: each round's subject and target, the countries drawn so far with their numbers, and only the
 *  next country of the deck (never its number). Finished rounds also show the country that would have come next. */
function view(s: CloseCallState, version: number) {
  const rounds = s.rounds.map((r, ri) => {
    const p = s.played[ri], open = ri === s.round && s.phase === 'playing', done = p.held || p.bust;
    return { topic: r.topic, target: r.target, max: ROUND_MAX[ri],
      drawn: r.deck.slice(0, p.drawn).map(id => ({ id, value: valueOf(r.topic, id) })),
      next: open && !done ? r.deck[p.drawn] ?? null : null,
      // After a hold: what the next draw would have been, so you learn whether holding was right.
      wouldBe: p.held ? { id: r.deck[p.drawn], value: valueOf(r.topic, r.deck[p.drawn]) } : null,
      total: p.total, held: p.held, bust: p.bust, points: p.points, started: ri < s.round || open || s.phase === 'finished' };
  });
  return { id: s.id, mode: 'closecall' as const, daily: s.daily, edition: s.edition, version, phase: s.phase, competition: s.competition ?? null,
    round: s.round, rounds: rounds.map(r => r.started ? r : { ...r, target: null, drawn: [], next: null }), score: pointsOf(s) };
}
