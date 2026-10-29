// Daily Crossroads (1.55): one grid per UTC date for everyone, one attempt per player per day (rules in lib/puzzles/crossroads.ts).
import { z } from 'zod';
import { AppError } from './auth';
import { batch, one, rows, run } from './db';
import { dailyContent } from './daily-content';
import { recordCompetition } from './competition';
import { resultStatement } from './stats';
import { COMPETITION_SUFFIX, dailyScore } from '../lib/daily-scoring';
import { CROSSROADS_FROM, dailyModesFor } from '../lib/daily-loop';
import { CROSSROADS_CELLS, CROSSROADS_GUESSES, COUNTRIES, answersFor, categoryById, crossroadsFor, crossroadsPoints, judge, pickShare, isRare, resolveCountry, solveGrid, type Reason } from '../lib/puzzles/crossroads';
import type { Env, User } from './types';

type Guess = { cell: number; country: string; ok: boolean; at: number; reason?: Reason };
export type CrossroadsState = {
  id: string; mode: 'crossroads'; daily: string; edition: number; competition?: { version: 1; mode: 'crossroads' };
  grid: { rows: string[]; cols: string[] }; cells: (string | null)[]; guesses: Guess[]; guessesLeft: number;
  phase: 'playing' | 'finished'; startedAt: number; answers: { correct: boolean; responseTime: number; risk: number }[];
};
const KIND = 'crossroads';
/** Edition number for the share text: #1 on CROSSROADS_FROM. */
export const editionOf = (date: string) => Math.max(1, Math.round((Date.parse(date + 'T00:00:00Z') - Date.parse(CROSSROADS_FROM + 'T00:00:00Z')) / 86400000) + 1);
const today = () => new Date().toISOString().slice(0, 10);

/** Today's grid: started or resumed (one attempt a day). Scores only when Crossroads is one of the day's daily games. */
export async function startCrossroads(env: Env, user: User) {
  const date = today(), ranked = (dailyModesFor(date) as readonly string[]).includes('crossroads');
  const kind = KIND + (ranked ? COMPETITION_SUFFIX : '');
  const existing = await one(env, 'SELECT state,version FROM game_sessions WHERE user_id=? AND date=? AND kind=?', user.id, date, kind);
  if (existing) return view(env, JSON.parse(existing.state), existing.version);
  // The grid is frozen per date in daily_content, like every daily game: a later code change never changes a past day.
  const content = await dailyContent(env, date, KIND, () => ({ settings: {}, questions: [], board: crossroadsFor(date) }));
  const grid = content.board as { rows: string[]; cols: string[] };
  const s: CrossroadsState = { id: crypto.randomUUID(), mode: 'crossroads', daily: date, edition: editionOf(date), ...(ranked ? { competition: { version: 1, mode: 'crossroads' } as const } : {}),
    grid, cells: Array(CROSSROADS_CELLS).fill(null), guesses: [], guessesLeft: CROSSROADS_GUESSES, phase: 'playing', startedAt: Date.now(), answers: [] };
  const inserted = await run(env, 'INSERT OR IGNORE INTO game_sessions(id,user_id,kind,date,state,created_at) VALUES (?,?,?,?,?,?)', s.id, user.id, kind, date, JSON.stringify(s), Date.now());
  if (!inserted.meta.changes) {
    const saved = await one(env, 'SELECT state,version FROM game_sessions WHERE user_id=? AND date=? AND kind=?', user.id, date, kind);
    return view(env, JSON.parse(saved.state), saved.version);
  }
  return view(env, s, 0);
}

/** Read the game, or place one guess. An unknown name or a country already in the grid costs no guess. */
export async function crossroadsAction(env: Env, user: User, id: string, action: string, input: unknown) {
  const row = await one(env, 'SELECT * FROM game_sessions WHERE id=? AND user_id=?', id, user.id);
  if (!row || !String(row.kind).startsWith(KIND)) throw new AppError('GAME_NOT_FOUND', 404);
  const s = JSON.parse(row.state) as CrossroadsState;
  if (action === 'get') { if (s.phase === 'finished') await record(env, user, s); return view(env, s, row.version); }
  if (action !== 'guess') throw new AppError('INVALID_ACTION');
  const b = z.object({ version: z.number().int().min(0), cell: z.number().int().min(0).max(8), country: z.string().trim().min(1).max(80) }).parse(input);
  if (s.phase === 'finished') throw new AppError('ANSWER_LOCKED', 409);
  if (row.version !== b.version) throw new AppError('STATE_CHANGED', 409);
  if (s.cells[b.cell]) throw new AppError('CELL_FILLED', 409);
  const country = COUNTRIES.some(c => c.id === b.country) ? b.country : resolveCountry(b.country);
  if (!country) throw new AppError('UNKNOWN_COUNTRY', 400);
  if (s.cells.includes(country)) throw new AppError('COUNTRY_USED', 409);
  const verdict = judge(s.grid, b.cell, country);
  s.guesses.push({ cell: b.cell, country, ok: verdict.ok, at: Date.now(), ...(verdict.reason ? { reason: verdict.reason } : {}) });
  s.answers.push({ correct: verdict.ok, responseTime: 0, risk: 0 });
  s.guessesLeft = Math.max(0, s.guessesLeft - 1);
  if (verdict.ok) s.cells[b.cell] = country;
  if (s.cells.every(Boolean) || s.guessesLeft === 0) s.phase = 'finished';
  const updated = await run(env, 'UPDATE game_sessions SET state=?,version=version+1,score=?,completed=? WHERE id=? AND version=?', JSON.stringify(s), crossroadsPoints(s.cells.filter(Boolean).length), s.phase === 'finished' ? 1 : 0, id, row.version);
  if (!updated.meta.changes) throw new AppError('STATE_CHANGED', 409);
  // Rarity: how often each country was the right answer in this square today. Only the first (scored) attempt of the day
  // counts; a count per date, square and country, never who picked it.
  if (verdict.ok && s.competition) await run(env, 'INSERT INTO crossroads_picks(date,cell,country_id,picks) VALUES (?,?,?,1) ON CONFLICT(date,cell,country_id) DO UPDATE SET picks=picks+1', s.daily, b.cell, country);
  if (s.phase === 'finished') await record(env, user, s);
  return view(env, s, row.version + 1);
}

/** Results, streak, rankings and passport stamps, once (every write is INSERT OR IGNORE). */
async function record(env: Env, user: User, s: CrossroadsState) {
  const statements: any[] = [resultStatement(s.id, user.id, { settings: { mode: 'crossroads' }, answers: s.answers, bestStreak: 0 })];
  statements.push({ sql: 'INSERT OR IGNORE INTO daily_challenge_results(user_id,date,result_id,score) VALUES (?,?,?,?)', args: [user.id, s.daily, s.id, 0] });
  // Each right square is a correct answer about that country (passport stamps), like the other daily games.
  s.cells.forEach((country, cell) => { if (country) statements.push({ sql: 'INSERT OR IGNORE INTO answers(session_id,round,user_id,question_id,country_id,mode,answer,correct,points,response_time,risk,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
    args: [s.id, cell, user.id, 'crossroads:' + s.daily + ':' + cell, country, 'crossroads', JSON.stringify(country), 1, 100, 0, 0, Date.now()] }); });
  await batch(env, statements);
  await recordCompetition(env, user, s);
}

/** What the device may see: the categories, your squares with how often they were picked, never the answers (until the end). */
async function view(env: Env, s: CrossroadsState, version: number) {
  const picks = await rows(env, 'SELECT cell,country_id,picks FROM crossroads_picks WHERE date=?', s.daily);
  const players = new Map<number, number>(), mine = new Map<string, number>();
  for (const p of picks) { players.set(Number(p.cell), (players.get(Number(p.cell)) ?? 0) + Number(p.picks)); mine.set(p.cell + ':' + p.country_id, Number(p.picks)); }
  const cells = s.cells.map((country, cell) => {
    if (!country) return null;
    const share = pickShare(mine.get(cell + ':' + country) ?? 0, players.get(cell) ?? 0);
    return { country, share, rare: isRare(share) };
  });
  // At the end, one possible answer for each empty square (not one you already used), so the grid teaches something.
  let examples: (string | null)[] | null = null;
  if (s.phase === 'finished' && s.cells.some(c => !c)) {
    const used = new Set(s.cells.filter(Boolean) as string[]);
    const options = s.grid.rows.flatMap(r => s.grid.cols.map(c => answersFor(r, c))).map((list, i) => s.cells[i] ? [s.cells[i]!] : list.filter(id => !used.has(id)));
    const solved = solveGrid(options);
    examples = s.cells.map((c, i) => c ? null : solved?.[i] ?? options[i][0] ?? null);
  }
  const category = (id: string) => ({ ...(categoryById(id) ?? { icon: '❔', label: { en: id, nl: id, es: id }, kind: 'continent' }), id });
  return { id: s.id, mode: 'crossroads' as const, daily: s.daily, edition: s.edition, version, phase: s.phase, competition: s.competition ?? null,
    rows: s.grid.rows.map(category), cols: s.grid.cols.map(category), cells, guessesLeft: s.guessesLeft, guessesTotal: CROSSROADS_GUESSES,
    last: s.guesses.at(-1) ?? null, score: s.competition ? dailyScore(s as any) : crossroadsPoints(s.cells.filter(Boolean).length), examples };
}
