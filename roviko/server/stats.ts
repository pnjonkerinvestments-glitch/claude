import { COUNTRIES } from '../lib/game-engine/questions';
import { collectStamps } from '../lib/passport';
import { pendingReviews } from './reviews';
import { rows, one, run, batch } from './db';
import { ACHIEVEMENTS } from '../lib/achievements';
import { streakWithFreezes } from '../lib/streak';
import type { Env } from './types';
export async function stats(env: Env, id: string) {
    // 1.34: the independent reads run at the same time instead of one after another.
    const statsRow = one(env, `SELECT COUNT(*) games, COALESCE(SUM(CASE WHEN multiplayer=1 THEN score ELSE 0 END),0) score,COALESCE(SUM(CASE WHEN multiplayer=1 THEN xp ELSE 0 END),0) xp,COALESCE(SUM(correct),0) correct,COALESCE(SUM(total),0) total,COALESCE(SUM(duration),0) duration,COALESCE(MAX(best_streak),0) bestStreak,COALESCE(SUM(win),0) wins,COALESCE(SUM(multiplayer),0) multiGames,COALESCE(SUM(CASE WHEN correct=total THEN 1 ELSE 0 END),0) perfect,COALESCE(MAX(CASE WHEN multiplayer=1 THEN score ELSE 0 END),0) personalBest FROM game_results WHERE user_id=?`, id);
    const [row, dates, modes, reviews, stampRecords, earned, dailyPoints, soloDays] = await Promise.all([statsRow,
        rows(env, 'SELECT date FROM daily_challenge_results WHERE user_id=? ORDER BY date DESC', id),
        rows(env, 'SELECT mode,COUNT(*) games, SUM(correct) correct,SUM(total) total FROM game_results WHERE user_id=? GROUP BY mode', id),
        pendingReviews(env, id),
        rows(env, "SELECT country_id,mode,COUNT(DISTINCT session_id) games FROM answers WHERE user_id=? AND correct=1 AND country_id<>'' GROUP BY country_id,mode", id),
        rows(env, 'SELECT achievement_id FROM user_achievements WHERE user_id=?', id),
        one(env, 'SELECT COALESCE(SUM(score),0) points FROM daily_scores WHERE user_id=?', id),
        rows(env, "SELECT date(created_at/1000,'unixepoch') day,COALESCE(SUM(correct),0) correct FROM game_results WHERE user_id=? AND multiplayer=0 GROUP BY day", id)]);
    // Travel XP (1.36): the level grows from every kind of play, not only multiplayer. Multiplayer XP as before, plus
    // a tenth of the daily-game points (up to 600 a day) and 10 per correct answer in solo games, at most 300 a day,
    // so endless practice cannot run the level up. Ranking points are not touched.
    const s = { ...row, xp: Number(row.xp) + travelXp(Number(dailyPoints?.points ?? 0), soloDays.map((d: any) => Number(d.correct))) };
    const today = new Date().toISOString().slice(0, 10);
    // Streak freezes are derived from the same dates, so they need no extra storage (see lib/streak.ts).
    const streakState = streakWithFreezes(dates.map((d: { date: string }) => d.date), today);
    const dailyStreak = streakState.streak;
    const metrics = { ...s, dailyStreak, dailyCount: dates.length, ...Object.fromEntries(modes.map((m: any) => [m.mode, m.games])) };
    const have = new Set(earned.map((e: any) => e.achievement_id));
    const unlocked = ACHIEVEMENTS.filter(a => Number(metrics[a.metric] ?? 0) >= a.target);
    // Only new achievements are written; before 1.34 every visit wrote all of them again. Since 1.35 the list returned is
    // everything ever earned (a badge stays when a streak breaks), plus what is earned now.
    const fresh = unlocked.filter(a => !have.has(a.id));
    if (fresh.length)
        await batch(env, fresh.map(a => ({ sql: 'INSERT OR IGNORE INTO user_achievements(user_id,achievement_id,earned_at) VALUES (?,?,?)', args: [id, a.id, Date.now()] })));
    const stamps = collectStamps(stampRecords,COUNTRIES);
    return { ...s, reviews, stamps, discovered: stamps.length, accuracy: s.total ? Math.round(s.correct / s.total * 100) : 0, averageTime: s.total ? Math.round(s.duration / s.total) : 0, ...levelOf(s.xp), dailyStreak, streakFreezes: { available: streakState.freezes, nextIn: streakState.nextFreezeIn, frozenDates: streakState.frozenDates.slice(-14) }, dailyCount: dates.length, dailyDone: dates.some((d: any) => d.date === today), modes, achievements: [...new Set([...have, ...unlocked.map(a => a.id)])], rating: 1000, recent: await rows(env, 'SELECT * FROM game_results WHERE user_id=? ORDER BY created_at DESC LIMIT 12', id), weak: await rows(env, 'SELECT country_id,mode,correct,attempts FROM concept_performance WHERE user_id=? AND correct<attempts ORDER BY (1.0*correct/attempts),attempts DESC LIMIT 16', id) };
}
export const SOLO_XP_PER_CORRECT = 10, SOLO_XP_DAY_CAP = 300;
export function travelXp(dailyPoints: number, soloCorrectPerDay: number[]) {
    return Math.floor(dailyPoints / 10) + soloCorrectPerDay.reduce((sum, c) => sum + Math.min(SOLO_XP_DAY_CAP, c * SOLO_XP_PER_CORRECT), 0);
}
/** Level L starts at (L-1)² × 100 XP; also how much is left to the next one. */
export function levelOf(xp: number) {
    const level = 1 + Math.floor(Math.sqrt(xp / 100));
    return { level, levelProgress: Math.round((Math.sqrt(xp / 100) % 1) * 100), xpToNext: level * level * 100 - xp };
}
/**
 * Levels of several players at once (1.37), for friends and invites: the same travel XP as `stats`, read with three
 * grouped queries instead of three per player. Ids without any play are level 1.
 */
export async function levelsFor(env: Env, ids: string[]): Promise<Record<string, number>> {
    const list = [...new Set(ids)].filter(Boolean).slice(0, 100);
    if (!list.length) return {};
    const marks = list.map(() => '?').join(',');
    const [mp, daily, solo] = await Promise.all([
        rows(env, `SELECT user_id,COALESCE(SUM(xp),0) xp FROM game_results WHERE multiplayer=1 AND user_id IN (${marks}) GROUP BY user_id`, ...list),
        rows(env, `SELECT user_id,COALESCE(SUM(score),0) points FROM daily_scores WHERE user_id IN (${marks}) GROUP BY user_id`, ...list),
        rows(env, `SELECT user_id,date(created_at/1000,'unixepoch') day,COALESCE(SUM(correct),0) correct FROM game_results WHERE multiplayer=0 AND user_id IN (${marks}) GROUP BY user_id,day`, ...list)]);
    const xp = new Map<string, number>(list.map(id => [id, 0]));
    for (const r of mp) xp.set(r.user_id, (xp.get(r.user_id) ?? 0) + Number(r.xp));
    for (const r of daily) xp.set(r.user_id, (xp.get(r.user_id) ?? 0) + travelXp(Number(r.points), []));
    for (const r of solo) xp.set(r.user_id, (xp.get(r.user_id) ?? 0) + travelXp(0, [Number(r.correct)]));
    return Object.fromEntries([...xp].map(([id, v]) => [id, levelOf(v).level]));
}
export function resultStatement(id: string, userId: string, state: any, multiplayer = 0, win = 0) { const arr = state.answers ?? state.results ?? []; return { sql: 'INSERT OR IGNORE INTO game_results(id,user_id,mode,score,xp,correct,total,duration,best_streak,win,multiplayer,risk,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)', args: [id, userId, state.settings?.mode ?? 'mixed', multiplayer ? state.score : 0, multiplayer ? Math.round(state.score / 25) + arr.length * 10 : 0, arr.filter((a: any) => a.correct).length, arr.length, arr.reduce((n: number, a: any) => n + a.responseTime, 0), state.bestStreak ?? 0, win, multiplayer, arr.reduce((n: number, a: any) => n + a.risk, 0), Date.now()] }; }
export async function leaderboard(env: Env, period: string, category: string) {
    // Solo and daily play are unranked learning activities, including older results.
    if (category === 'daily') return [];
    const cutoff = period === 'daily' ? new Date(new Date().toISOString().slice(0, 10)).getTime() : period === 'weekly' ? Date.now() - 7 * 86400000 : 0;
    const field = category === 'wins' ? 'SUM(r.win)' : category === 'score' ? 'SUM(r.score)' : 'SUM(r.xp)';
    return rows(env, `SELECT u.id,u.name,u.avatar,${field} score,COUNT(*) games FROM game_results r JOIN users u ON u.id=r.user_id WHERE r.multiplayer=1 AND r.created_at>=? AND u.blocked=0 AND r.risk<3 GROUP BY u.id ORDER BY score DESC LIMIT 50`, cutoff);
}
