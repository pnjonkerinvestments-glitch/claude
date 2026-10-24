import type { Env } from './types';
import { one, rows } from './db';
import { LUCIA_ID } from '../lib/lucia';
import { addDays, dateRange, dayKey, returnRates, type GrowthDay, type Platform } from '../lib/growth';

/** One answer counts as at most two minutes of play, so a player who walks away does not inflate the time. */
const ANSWER_CAP_MS = 120_000;

/**
 * 1.49 · numbers for the growth dashboard on /admin (owner only). Read-only, aggregated, no names or emails:
 * active players, new players per platform, games, estimated play time, return rates and the most played games.
 * "Playing" means answering at least one question, so visitors who only opened the page do not count.
 */
export async function growthStats(env: Env, days = 90) {
  const today = dayKey(Date.now()), since = Date.parse(addDays(today, -days + 1) + 'T00:00:00Z');
  const [perDay, firsts, platforms, activity, totals, modes, multiplayer, accounts] = await Promise.all([
    rows(env, `SELECT date(created_at/1000,'unixepoch') d, COUNT(DISTINCT user_id) active, COUNT(DISTINCT session_id) games, SUM(MIN(response_time, ${ANSWER_CAP_MS})) ms FROM answers WHERE created_at>=? AND user_id<>? GROUP BY d`, since, LUCIA_ID),
    rows(env, `SELECT user_id, date(MIN(created_at)/1000,'unixepoch') d FROM answers WHERE user_id<>? GROUP BY user_id`, LUCIA_ID),
    rows(env, `SELECT user_id, platform, MIN(day) d FROM app_opens GROUP BY user_id`),
    rows(env, `SELECT DISTINCT user_id, date(created_at/1000,'unixepoch') d FROM answers WHERE created_at>=? AND user_id<>?`, since - 8 * 86400000, LUCIA_ID),
    one(env, `SELECT COUNT(DISTINCT user_id) players, SUM(MIN(response_time, ${ANSWER_CAP_MS})) ms, COUNT(DISTINCT session_id) games FROM answers WHERE user_id<>?`, LUCIA_ID),
    rows(env, `SELECT kind, COUNT(*) n FROM game_sessions WHERE created_at>=? GROUP BY kind`, since),
    one(env, `SELECT COUNT(*) n FROM game_results WHERE multiplayer=1 AND created_at>=?`, since),
    one(env, `SELECT COUNT(*) n FROM users WHERE guest=0 AND id<>?`, LUCIA_ID),
  ]);
  const platformOf = new Map<string, Platform>(platforms.map((r: any) => [String(r.user_id), (['web', 'ios', 'android'].includes(r.platform) ? r.platform : 'unknown') as Platform]));
  const first = new Map<string, string>(firsts.map((r: any) => [String(r.user_id), String(r.d)]));
  const active = new Set<string>(activity.map((r: any) => r.user_id + '|' + r.d));
  const byDay = new Map<string, any>(perDay.map((r: any) => [String(r.d), r]));
  const series: GrowthDay[] = dateRange(today, days).map(date => ({ date, active: Number(byDay.get(date)?.active ?? 0), games: Number(byDay.get(date)?.games ?? 0), minutes: Math.round(Number(byDay.get(date)?.ms ?? 0) / 60000), newPlayers: 0, newByPlatform: { web: 0, ios: 0, android: 0, unknown: 0 } }));
  const index = new Map(series.map((d, i) => [d.date, i]));
  for (const [user, d] of first) { const i = index.get(d); if (i === undefined) continue; series[i].newPlayers++; series[i].newByPlatform[platformOf.get(user) ?? 'unknown']++; }
  // Active in the last 1 / 7 / 30 days, from the per-player activity rows.
  const activeSince = (n: number) => { const from = addDays(today, -n + 1), who = new Set<string>(); for (const r of activity as any[]) if (r.d >= from) who.add(String(r.user_id)); return who.size; };
  const appPlayers = { ios: 0, android: 0, web: 0 } as Record<'ios' | 'android' | 'web', number>;
  for (const p of platformOf.values()) if (p !== 'unknown') appPlayers[p]++;
  const label = (kind: string) => kind.replace(/:competitive-v\d+$/, '').replace(/^puzzle:/, '').replace(/^daily-/, 'daily ').replace(/^(bonus|survival):/, '$1 ');
  const games = new Map<string, number>();
  for (const r of modes as any[]) { const k = label(String(r.kind)); games.set(k, (games.get(k) ?? 0) + Number(r.n)); }
  if (Number(multiplayer?.n)) games.set('multiplayer', Number(multiplayer.n));
  return {
    today, days, series,
    totals: { players: Number(totals?.players ?? 0), accounts: Number(accounts?.n ?? 0), games: Number(totals?.games ?? 0), hours: Math.round(Number(totals?.ms ?? 0) / 3600000) },
    active: { today: activeSince(1), week: activeSince(7), month: activeSince(30) },
    platforms: appPlayers,
    returns: returnRates(first, active, today),
    topGames: [...games].map(([game, n]) => ({ game, n })).sort((a, b) => b.n - a.n).slice(0, 10),
  };
}
