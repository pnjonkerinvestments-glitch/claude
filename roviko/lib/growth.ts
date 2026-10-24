/**
 * 1.49 · the growth dashboard's arithmetic, kept pure so it can be tested without a database.
 * Input: one row per player per day they answered a question (activity), and per player their first day and the
 * platform they first opened Roviko on. Output: per-day series and return rates. Dates are UTC "YYYY-MM-DD".
 */
export type Platform = 'web' | 'ios' | 'android' | 'unknown';
export type GrowthDay = { date: string; active: number; accounts: number; newPlayers: number; newAccounts: number; newByPlatform: Record<Platform, number>; games: number; minutes: number; mpMatches: number; mpPlayers: number };
/** Distinct players over a window (1, 7, 30 or 90 days), split into accounts and guests, overall and in multiplayer. */
export type GrowthWindow = { players: number; accounts: number; guests: number; mpPlayers: number; mpAccounts: number; mpMatches: number; mpSeats: number };

export const dayKey = (ms: number) => new Date(ms).toISOString().slice(0, 10);
export const addDays = (date: string, n: number) => dayKey(Date.parse(date + 'T00:00:00Z') + n * 86400000);

/** The last `days` dates ending today, oldest first. */
export function dateRange(today: string, days: number) { return Array.from({ length: days }, (_, i) => addDays(today, i - days + 1)); }

/**
 * Share of new players who came back: the day after their first day (day 2) and on any of the next seven days (week).
 * Only cohorts old enough to judge count: a player who started yesterday cannot have returned "within a week" yet.
 */
export function returnRates(first: Map<string, string>, active: Set<string>, today: string, window = 30) {
  const from = addDays(today, -window);
  let d1n = 0, d1 = 0, d7n = 0, d7 = 0;
  for (const [user, day] of first) {
    if (day < from) continue;
    if (addDays(day, 1) < today) { d1n++; if (active.has(user + '|' + addDays(day, 1))) d1++; }
    if (addDays(day, 7) < today) { d7n++; for (let k = 1; k <= 7; k++) if (active.has(user + '|' + addDays(day, k))) { d7++; break; } }
  }
  return { day2: d1n ? d1 / d1n : null, day2Cohort: d1n, week: d7n ? d7 / d7n : null, weekCohort: d7n };
}
