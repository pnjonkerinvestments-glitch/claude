import { spanishContent } from '../i18n/content';
import type { DailyState } from './bonus';
export * from './bonus';
// Pure helpers behind the daily return loop: streak milestones, the UTC reset countdown,
// which daily game to suggest next, and the deterministic "mystery country" of the day.

/**
 * The first UTC date on which the daily Size Shuffle ('order') replaces Country Mosaic as daily game (1.24).
 * The lineup is chosen per UTC date, so nobody ever gets seven daily games on the switch day: dates before it keep
 * Mosaic, this date and later get Size Shuffle. The lead sets it to the first UTC day after the release.
 */
export const SHUFFLE_FROM = '2026-10-08';
/** The five daily games from SHUFFLE_FROM on. The Daily Detour ('daily') is the day's main trip on the homepage and scores on top of these. */
export const DAILY_MODES = ['rank', 'duel', 'compare', 'order', 'trail'] as const;
/** The five daily games before SHUFFLE_FROM (1.19–1.23): Country Mosaic in fourth place. */
export const MOSAIC_DAILY_MODES = ['rank', 'duel', 'compare', 'mosaic', 'trail'] as const;
export const DAY_MODES = ['daily', ...DAILY_MODES] as const;
export const MOSAIC_DAY_MODES = ['daily', ...MOSAIC_DAILY_MODES] as const;
export type DailyMode = typeof DAILY_MODES[number] | typeof MOSAIC_DAILY_MODES[number];
export type DayMode = 'daily' | DailyMode;
/** Every game that ever was a daily game (old results, shared links, history). */
export const ALL_DAY_MODES: readonly DayMode[] = ['daily', 'rank', 'duel', 'compare', 'mosaic', 'order', 'trail'];
const isDate = (date?: string | null): date is string => !!date && /^\d{4}-\d{2}-\d{2}$/.test(date);
/** The five daily games of one UTC date (YYYY-MM-DD). Without a date: today's lineup on this device's clock. */
export function dailyModesFor(date?: string | null): readonly DailyMode[] {
  const day = isDate(date) ? date : new Date().toISOString().slice(0, 10);
  return day < SHUFFLE_FROM ? MOSAIC_DAILY_MODES : DAILY_MODES;
}
/** The Daily Detour plus the five daily games of one UTC date. */
export function dayModesFor(date?: string | null): readonly DayMode[] {
  const day = isDate(date) ? date : new Date().toISOString().slice(0, 10);
  return day < SHUFFLE_FROM ? MOSAIC_DAY_MODES : DAY_MODES;
}
export type { DailyState } from './bonus';

export const STREAK_MILESTONES = [3, 7, 14, 30, 50, 100, 200, 365];

/** The next streak milestone above the current streak, and how far along the way to it the player is. */
export function streakMilestone(streak: number) {
  const target = STREAK_MILESTONES.find(m => m > streak) ?? Math.ceil((streak + 1) / 100) * 100;
  const previous = [...STREAK_MILESTONES].reverse().find(m => m <= streak) ?? 0;
  return { target, remaining: target - streak, progress: Math.max(0, Math.min(1, (streak - previous) / (target - previous))) };
}

/** Milliseconds until the daily puzzles change at 00:00 UTC. */
export function msUntilReset(now = Date.now()) {
  return 86400000 - (now % 86400000);
}

export function formatCountdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), s = total % 60;
  return [h, m, s].map(n => String(n).padStart(2, '0')).join(':');
}

export function dailyStateOf(sessions: { mode: string; completed?: boolean }[] | undefined, mode: DayMode): DailyState {
  const saved = sessions?.find(s => s.mode === mode);
  return saved?.completed ? 'done' : saved ? 'active' : 'new';
}

/** Resume a started game first, otherwise the first one not yet played today (the Daily Detour comes first). Pass the lineup of the day (`dayModesFor(date)`). */
export function nextDailyMode(sessions: { mode: string; completed?: boolean }[] | undefined, modes: readonly DayMode[] = DAY_MODES): DayMode | null {
  return modes.find(m => dailyStateOf(sessions, m) === 'active') ?? modes.find(m => dailyStateOf(sessions, m) === 'new') ?? null;
}

/**
 * Finished scored games today: the Daily Detour plus the five daily games (pass the five only to leave out the Detour).
 * By default every game that ever was a daily game counts: a day only ever has scored sessions of its own lineup.
 */
export function completedDailies(sessions: { mode: string; completed?: boolean }[] | undefined, modes: readonly DayMode[] = ALL_DAY_MODES) {
  return modes.filter(m => dailyStateOf(sessions, m) === 'done').length;
}

/** The streak only needs one finished daily game; it is at risk when it exists but today has none yet. */
export function streakAtRisk(streak: number, completedToday: number) {
  return streak > 0 && completedToday === 0;
}

type Achievement = { id: string; metric: string; target: number; en: string; nl: string; es?: string };
const SOLO_METRICS = ['games', 'correct', 'bestStreak', 'dailyCount', 'dailyStreak'];
/** The locked solo achievement the player is relatively closest to, for an "almost there" nudge. */
export function nearestAchievement(achievements: readonly Achievement[], stats: { achievements?: string[] } & Record<string, unknown>) {
  const unlocked = new Set<string>(stats.achievements ?? []);
  return achievements
    .filter(a => !unlocked.has(a.id) && SOLO_METRICS.includes(a.metric))
    .map(a => { const value = Number(stats[a.metric] ?? 0); return { id: a.id, metric: a.metric, target: a.target, value, remaining: Math.max(0, a.target - value), progress: Math.min(1, value / a.target), name: { en: a.en, nl: a.nl, es: a.es ?? spanishContent(a.en) } }; })
    .sort((a, b) => b.progress - a.progress || a.remaining - b.remaining)[0] ?? null;
}

function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function seeded(seed: number) {
  return () => { seed = (seed + 0x6d2b79f5) >>> 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export type MysteryCountryData = { id: string; name: string; nl: string; es?: string; region: string; subregion?: string; flag: string };
export type MysteryFact = { id: string; countryId: string; category: string; clues: { en: string; nl: string; es?: string }[]; explanation: { en: string; nl: string; es?: string }; source: { title: string; url: string } };

/** Same puzzle for everyone on a UTC date: one sourced fact, its country and three plausible alternatives. */
export function mysteryOfTheDay(date: string, facts: MysteryFact[], countries: MysteryCountryData[]) {
  const usable = facts.filter(f => countries.some(c => c.id === f.countryId));
  if (!usable.length) return null;
  const day = Math.floor(Date.parse(date + 'T00:00:00Z') / 86400000);
  // Walk all facts in a fixed shuffled order, so a fact only repeats after the whole list.
  const order = usable.map((f, i) => ({ f, k: hash('roviko:mystery:' + f.id + ':' + i) })).sort((a, b) => a.k - b.k).map(x => x.f);
  const fact = order[((day % order.length) + order.length) % order.length];
  const answer = countries.find(c => c.id === fact.countryId)!;
  const rand = seeded(hash('roviko:mystery:' + date));
  const pool = countries.filter(c => c.id !== answer.id);
  const near = pool.filter(c => c.region === answer.region);
  const pick = (list: MysteryCountryData[], n: number, taken: MysteryCountryData[]) => { const out: MysteryCountryData[] = []; const rest = list.filter(c => !taken.includes(c)); while (out.length < n && rest.length) out.push(rest.splice(Math.floor(rand() * rest.length), 1)[0]); return out; };
  const distractors = pick(near, 3, []);
  if (distractors.length < 3) distractors.push(...pick(pool, 3 - distractors.length, distractors));
  const options = [answer, ...distractors].map(c => ({ c, k: rand() })).sort((a, b) => a.k - b.k).map(x => x.c);
  return { fact, answer, options };
}
