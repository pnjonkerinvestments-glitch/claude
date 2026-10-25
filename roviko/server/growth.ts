import type { Env } from './types';
import { one, rows } from './db';
import { LUCIA_ID } from '../lib/lucia';
import { MODE_SQL } from './competition';
import { dayModesFor } from '../lib/daily-loop';
import { addDays, dateRange, dayKey, dayOneFunnel, returnRates, type GrowthDay, type GrowthWindow, type Platform } from '../lib/growth';

/** One answer counts as at most two minutes of play, so a player who walks away does not inflate the time. */
const ANSWER_CAP_MS = 120_000;

/**
 * 1.49 · numbers for the growth dashboard on /admin (owner only). Read-only, aggregated, no names or emails:
 * active players, new players per platform, games, estimated play time, return rates and the most played games.
 * "Playing" means answering at least one question, so visitors who only opened the page do not count.
 */
export async function growthStats(env: Env, days = 90) {
  const today = dayKey(Date.now()), since = Date.parse(addDays(today, -days + 1) + 'T00:00:00Z');
  const [perDay, firsts, platforms, activity, totals, modes, multiplayer, accounts, mpDays, mpRows, dailyDone] = await Promise.all([
    // Guests count as players too (1.49): "accounts" are those with an account now, the rest are guests.
    rows(env, `SELECT date(a.created_at/1000,'unixepoch') d, COUNT(DISTINCT a.user_id) active, COUNT(DISTINCT CASE WHEN u.guest=0 THEN a.user_id END) accounts, COUNT(DISTINCT a.session_id) games, SUM(MIN(a.response_time, ${ANSWER_CAP_MS})) ms FROM answers a JOIN users u ON u.id=a.user_id WHERE a.created_at>=? AND a.user_id<>? GROUP BY d`, since, LUCIA_ID),
    rows(env, `SELECT a.user_id, date(MIN(a.created_at)/1000,'unixepoch') d, MIN(u.guest) guest FROM answers a JOIN users u ON u.id=a.user_id WHERE a.user_id<>? GROUP BY a.user_id`, LUCIA_ID),
    rows(env, `SELECT user_id, platform, MIN(day) d FROM app_opens GROUP BY user_id`),
    rows(env, `SELECT DISTINCT a.user_id, date(a.created_at/1000,'unixepoch') d, u.guest FROM answers a JOIN users u ON u.id=a.user_id WHERE a.created_at>=? AND a.user_id<>?`, since - 8 * 86400000, LUCIA_ID),
    one(env, `SELECT COUNT(DISTINCT user_id) players, SUM(MIN(response_time, ${ANSWER_CAP_MS})) ms, COUNT(DISTINCT session_id) games FROM answers WHERE user_id<>?`, LUCIA_ID),
    rows(env, `SELECT kind, COUNT(*) n FROM game_sessions WHERE created_at>=? GROUP BY kind`, since),
    one(env, `SELECT COUNT(*) n FROM game_results WHERE multiplayer=1 AND created_at>=?`, since),
    one(env, `SELECT COUNT(*) n FROM users WHERE guest=0 AND id<>?`, LUCIA_ID),
    // Multiplayer (1.49): one result row per player per match; the match is the part of the id before ":".
    rows(env, `SELECT date(r.created_at/1000,'unixepoch') d, COUNT(DISTINCT substr(r.id,1,instr(r.id,':')-1)) matches, COUNT(DISTINCT r.user_id) players FROM game_results r WHERE r.multiplayer=1 AND r.created_at>=? AND r.user_id<>? GROUP BY d`, since, LUCIA_ID),
    rows(env, `SELECT r.user_id, substr(r.id,1,instr(r.id,':')-1) m, date(r.created_at/1000,'unixepoch') d, u.guest FROM game_results r JOIN users u ON u.id=r.user_id WHERE r.multiplayer=1 AND r.created_at>=? AND r.user_id<>?`, Date.parse(addDays(today, -89) + 'T00:00:00Z'), LUCIA_ID),
    // 1.50: finished daily games of the last 31 days, for the day-1 funnel.
    rows(env, `SELECT user_id, date d, ${MODE_SQL()} mode FROM daily_scores WHERE date>=? AND user_id<>?`, addDays(today, -31), LUCIA_ID),
  ]);
  const platformOf = new Map<string, Platform>(platforms.map((r: any) => [String(r.user_id), (['web', 'ios', 'android'].includes(r.platform) ? r.platform : 'unknown') as Platform]));
  const first = new Map<string, string>(firsts.map((r: any) => [String(r.user_id), String(r.d)]));
  const active = new Set<string>(activity.map((r: any) => r.user_id + '|' + r.d));
  const byDay = new Map<string, any>(perDay.map((r: any) => [String(r.d), r]));
  const mpByDay = new Map<string, any>(mpDays.map((r: any) => [String(r.d), r]));
  const guestFirst = new Set<string>(firsts.filter((r: any) => Number(r.guest) === 1).map((r: any) => String(r.user_id)));
  const series: GrowthDay[] = dateRange(today, days).map(date => ({ date, active: Number(byDay.get(date)?.active ?? 0), accounts: Number(byDay.get(date)?.accounts ?? 0), games: Number(byDay.get(date)?.games ?? 0), minutes: Math.round(Number(byDay.get(date)?.ms ?? 0) / 60000), newPlayers: 0, newAccounts: 0, newByPlatform: { web: 0, ios: 0, android: 0, unknown: 0 }, mpMatches: Number(mpByDay.get(date)?.matches ?? 0), mpPlayers: Number(mpByDay.get(date)?.players ?? 0) }));
  const index = new Map(series.map((d, i) => [d.date, i]));
  for (const [user, d] of first) { const i = index.get(d); if (i === undefined) continue; series[i].newPlayers++; if (!guestFirst.has(user)) series[i].newAccounts++; series[i].newByPlatform[platformOf.get(user) ?? 'unknown']++; }
  // Active in the last 1 / 7 / 30 days, from the per-player activity rows.
  const activeSince = (n: number) => { const from = addDays(today, -n + 1), who = new Set<string>(); for (const r of activity as any[]) if (r.d >= from) who.add(String(r.user_id)); return who.size; };
  // 1.49: per window, distinct players split into accounts and guests, and the same for multiplayer.
  const windows: Record<number, GrowthWindow> = {};
  for (const n of [1, 7, 30, 90]) {
    const from = addDays(today, -n + 1), all = new Map<string, number>(), mp = new Map<string, number>(), matches = new Set<string>(); let seats = 0;
    for (const r of activity as any[]) if (r.d >= from) all.set(String(r.user_id), Number(r.guest));
    for (const r of mpRows as any[]) if (r.d >= from) { mp.set(String(r.user_id), Number(r.guest)); matches.add(String(r.m)); seats++; }
    const accountsOf = (m: Map<string, number>) => [...m.values()].filter(g => g === 0).length;
    windows[n] = { players: all.size, accounts: accountsOf(all), guests: all.size - accountsOf(all), mpPlayers: mp.size, mpAccounts: accountsOf(mp), mpMatches: matches.size, mpSeats: seats };
  }
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
    windows,
    platforms: appPlayers,
    returns: returnRates(first, active, today),
    funnel: { ...dayOneFunnel(first, new Set<string>(dailyDone.map((r: any) => r.user_id + '|' + r.d + '|' + r.mode)), dayModesFor, today), modes: dayModesFor(addDays(today, -1)) },
    topGames: [...games].map(([game, n]) => ({ game, n })).sort((a, b) => b.n - a.n).slice(0, 10),
  };
}
