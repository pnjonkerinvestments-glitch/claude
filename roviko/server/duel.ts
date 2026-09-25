import { COMPETITION_SUFFIX, dailyScore, type Competition } from '../lib/daily-scoring';
import { recordCompetition } from './competition';
import { z } from 'zod';
import { AppError } from './auth';
import { one, run, batch } from './db';
import { dailyContent } from './daily-content';
import { resultStatement } from './stats';
import { generateDuel } from '../lib/puzzles/duel';
import { DUEL_ROUNDS, duelWon, type DuelBoard } from '../lib/puzzles/duel-shared';
import type { Env, User } from './types';

type DuelAnswer = { value: string; correct: boolean; countryId: string; questionId: string; responseTime: number; at: number };
export type DuelState = { id: string; competition?: Competition; mode: 'duel'; daily: string | null; phase: 'question' | 'finished'; board: DuelBoard; datasetVersion?: string; answers: DuelAnswer[]; streak: number; bestStreak: number; startedAt: number; turnAt: number };

/** The scored daily World Duel: the server keeps every value and the perfect route until a card is played. */
function view(s: DuelState, version = 0) {
  const { board, startedAt, turnAt, ...rest } = s;
  const played = s.answers.length, finished = s.phase === 'finished';
  const rounds = board.rounds.map((r, i) => i < played || finished ? r : { category: r.category, roviko: { id: r.roviko.id, name: r.roviko.name, flag: r.roviko.flag }, hand: {} });
  return { ...rest, ...(s.competition ? { score: dailyScore(s) } : {}), version, total: DUEL_ROUNDS, date: s.daily, seed: board.seed, hand: board.hand, rounds, solution: finished ? board.solution : board.solution.slice(0, played), plays: s.answers.map(a => a.value) };
}
export async function startDuel(env: Env, user: User, input: unknown) {
  const settings = z.object({ competition: z.boolean().default(true) }).parse(input ?? {});
  const daily = new Date().toISOString().slice(0, 10);
  const kind = 'duel' + (settings.competition ? COMPETITION_SUFFIX : '');
  const existing = await one(env, 'SELECT state,version FROM game_sessions WHERE user_id=? AND date=? AND kind=?', user.id, daily, kind);
  if (existing) { const s = JSON.parse(existing.state); await record(env, user, s); return view(s, existing.version); }
  const content = await dailyContent(env, daily, 'duel' + COMPETITION_SUFFIX, seed => ({ board: generateDuel(seed), settings: { mode: 'duel' } }));
  const id = crypto.randomUUID();
  const s: DuelState = { id, ...(settings.competition ? { competition: { version: 1, mode: 'duel' } as const } : {}), mode: 'duel', daily, phase: 'question', board: content.board, datasetVersion: content.datasetVersion, answers: [], streak: 0, bestStreak: 0, startedAt: Date.now(), turnAt: Date.now() };
  const inserted = await run(env, 'INSERT OR IGNORE INTO game_sessions(id,user_id,kind,date,state,created_at) VALUES (?,?,?,?,?,?)', id, user.id, kind, daily, JSON.stringify(s), Date.now());
  if (!inserted.meta.changes) { const saved = await one(env, 'SELECT state,version FROM game_sessions WHERE user_id=? AND date=? AND kind=?', user.id, daily, kind); return view(JSON.parse(saved.state), saved.version); }
  return view(s);
}
export async function duelAction(env: Env, user: User, id: string, action: string, input: unknown) {
  const row = await one(env, 'SELECT * FROM game_sessions WHERE id=? AND user_id=?', id, user.id);
  if (!row || !['duel', 'duel' + COMPETITION_SUFFIX].includes(row.kind)) throw new AppError('GAME_NOT_FOUND', 404);
  const s = JSON.parse(row.state) as DuelState;
  if (action === 'get') { await record(env, user, s); return view(s, row.version); }
  if (action !== 'play') throw new AppError('INVALID_ACTION');
  const body = z.object({ version: z.number().int().min(0), card: z.string().max(40) }).parse(input);
  if (body.version !== row.version) throw new AppError('STATE_CHANGED', 409);
  if (s.phase === 'finished') throw new AppError('ANSWER_LOCKED', 409);
  const round = s.board.rounds[s.answers.length];
  if (!s.board.hand.some(c => c.id === body.card) || s.answers.some(a => a.value === body.card)) throw new AppError('INVALID_INPUT');
  const correct = duelWon(round, body.card);
  s.answers.push({ value: body.card, correct, countryId: round.roviko.id, questionId: s.board.seed + ':' + round.category.id, responseTime: Math.max(0, Date.now() - s.turnAt), at: Date.now() });
  s.streak = correct ? s.streak + 1 : 0; s.bestStreak = Math.max(s.bestStreak, s.streak); s.turnAt = Date.now();
  if (s.answers.length >= DUEL_ROUNDS) s.phase = 'finished';
  const updated = await run(env, 'UPDATE game_sessions SET state=?,version=version+1,completed=? WHERE id=? AND version=?', JSON.stringify(s), +(s.phase === 'finished'), id, row.version);
  if (!updated.meta.changes) throw new AppError('STATE_CHANGED', 409);
  await record(env, user, s); return view(s, row.version + 1);
}
async function record(env: Env, user: User, s: DuelState) {
  const statements: any[] = s.answers.map((a, i) => ({ sql: 'INSERT OR IGNORE INTO answers(session_id,round,user_id,question_id,country_id,mode,answer,correct,points,response_time,risk,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)', args: [s.id, i, user.id, a.questionId, a.countryId, 'duel', JSON.stringify(a.value), +a.correct, 0, a.responseTime, 0, a.at] }));
  if (s.phase === 'finished') {
    statements.push(resultStatement(s.id, user.id, { settings: { mode: 'duel' }, answers: s.answers.map(a => ({ ...a, risk: 0 })), bestStreak: s.bestStreak }));
    if (s.daily) statements.push({ sql: 'INSERT OR IGNORE INTO daily_challenge_results(user_id,date,result_id,score) VALUES (?,?,?,?)', args: [user.id, s.daily, s.id, 0] });
  }
  if (statements.length) await batch(env, statements);
  await recordCompetition(env, user, s);
}
