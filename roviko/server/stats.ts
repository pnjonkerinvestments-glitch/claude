import { COUNTRIES } from '../lib/game-engine/questions';
import { collectStamps } from '../lib/passport';
import { pendingReviews } from './reviews';
import { rows, one, run, batch } from './db';
import { ACHIEVEMENTS } from '../lib/achievements';
import { streakWithFreezes } from '../lib/streak';
import type { Env } from './types';
export async function stats(env: Env, id: string) {
    const s = await one(env, `SELECT COUNT(*) games, COALESCE(SUM(CASE WHEN multiplayer=1 THEN score ELSE 0 END),0) score,COALESCE(SUM(CASE WHEN multiplayer=1 THEN xp ELSE 0 END),0) xp,COALESCE(SUM(correct),0) correct,COALESCE(SUM(total),0) total,COALESCE(SUM(duration),0) duration,COALESCE(MAX(best_streak),0) bestStreak,COALESCE(SUM(win),0) wins,COALESCE(SUM(multiplayer),0) multiGames,COALESCE(SUM(CASE WHEN correct=total THEN 1 ELSE 0 END),0) perfect,COALESCE(MAX(CASE WHEN multiplayer=1 THEN score ELSE 0 END),0) personalBest FROM game_results WHERE user_id=?`, id);
    const dates = await rows(env, 'SELECT date FROM daily_challenge_results WHERE user_id=? ORDER BY date DESC', id);
    const today = new Date().toISOString().slice(0, 10);
    // Streak freezes are derived from the same dates, so they need no extra storage (see lib/streak.ts).
    const streakState = streakWithFreezes(dates.map((d: { date: string }) => d.date), today);
    const dailyStreak = streakState.streak;
    const modes = await rows(env, 'SELECT mode,COUNT(*) games, SUM(correct) correct,SUM(total) total FROM game_results WHERE user_id=? GROUP BY mode', id);
    const metrics = { ...s, dailyStreak, dailyCount: dates.length, ...Object.fromEntries(modes.map((m: any) => [m.mode, m.games])) };
    const unlocked = ACHIEVEMENTS.filter(a => Number(metrics[a.metric] ?? 0) >= a.target);
    if (unlocked.length)
        await batch(env, unlocked.map(a => ({ sql: 'INSERT OR IGNORE INTO user_achievements(user_id,achievement_id,earned_at) VALUES (?,?,?)', args: [id, a.id, Date.now()] })));
    const reviews = await pendingReviews(env, id);
    const stampRecords = await rows(env, "SELECT country_id,mode,COUNT(DISTINCT session_id) games FROM answers WHERE user_id=? AND correct=1 AND country_id<>'' GROUP BY country_id,mode", id);
    const stamps = collectStamps(stampRecords,COUNTRIES);
    return { ...s, reviews, stamps, discovered: stamps.length, accuracy: s.total ? Math.round(s.correct / s.total * 100) : 0, averageTime: s.total ? Math.round(s.duration / s.total) : 0, level: 1 + Math.floor(Math.sqrt(s.xp / 100)), levelProgress: Math.round((Math.sqrt(s.xp / 100) % 1) * 100), dailyStreak, streakFreezes: { available: streakState.freezes, nextIn: streakState.nextFreezeIn, frozenDates: streakState.frozenDates.slice(-14) }, dailyCount: dates.length, dailyDone: dates.some((d: any) => d.date === today), modes, achievements: unlocked.map(a => a.id), rating: 1000, recent: await rows(env, 'SELECT * FROM game_results WHERE user_id=? ORDER BY created_at DESC LIMIT 12', id), weak: await rows(env, 'SELECT country_id,mode,correct,attempts FROM concept_performance WHERE user_id=? AND correct<attempts ORDER BY (1.0*correct/attempts),attempts DESC LIMIT 16', id) };
}
export function resultStatement(id: string, userId: string, state: any, multiplayer = 0, win = 0) { const arr = state.answers ?? state.results ?? []; return { sql: 'INSERT OR IGNORE INTO game_results(id,user_id,mode,score,xp,correct,total,duration,best_streak,win,multiplayer,risk,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)', args: [id, userId, state.settings?.mode ?? 'mixed', multiplayer ? state.score : 0, multiplayer ? Math.round(state.score / 25) + arr.length * 10 : 0, arr.filter((a: any) => a.correct).length, arr.length, arr.reduce((n: number, a: any) => n + a.responseTime, 0), state.bestStreak ?? 0, win, multiplayer, arr.reduce((n: number, a: any) => n + a.risk, 0), Date.now()] }; }
export async function leaderboard(env: Env, period: string, category: string) {
    // Solo and daily play are unranked learning activities, including older results.
    if (category === 'daily') return [];
    const cutoff = period === 'daily' ? new Date(new Date().toISOString().slice(0, 10)).getTime() : period === 'weekly' ? Date.now() - 7 * 86400000 : 0;
    const field = category === 'wins' ? 'SUM(r.win)' : category === 'score' ? 'SUM(r.score)' : 'SUM(r.xp)';
    return rows(env, `SELECT u.id,u.name,u.avatar,${field} score,COUNT(*) games FROM game_results r JOIN users u ON u.id=r.user_id WHERE r.multiplayer=1 AND r.created_at>=? AND u.blocked=0 AND r.risk<3 GROUP BY u.id ORDER BY score DESC LIMIT 50`, cutoff);
}
