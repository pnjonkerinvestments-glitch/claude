/** Versioned, untimed daily competition. Practice and multiplayer never enter this ledger. */
export const COMPETITION_VERSION = 1;
export const COMPETITION_SUFFIX = ':competitive-v1';
/**
 * Every game that can give daily points: the Daily Detour plus the daily games. A UTC date has six of them
 * (`dayModesFor` in lib/daily-loop.ts): Country Mosaic before the switch to the daily Size Shuffle ('order', 1.24), Size Shuffle after.
 */
export const DAILY_POINT_MODES = ['daily', 'rank', 'duel', 'compare', 'mosaic', 'order', 'trail'] as const;
export type PointMode = typeof DAILY_POINT_MODES[number];
export type Competition = { version: 1; mode: PointMode };
export const DAILY_GAME_MAX = 1000;
/** Six scored games per day, up to 1,000 points each (6,000 per day since 1.19). */
export const DAY_GAME_COUNT = 6;
export const DAILY_TOTAL_MAX = DAY_GAME_COUNT * DAILY_GAME_MAX;
/** The daily Size Shuffle (1.24): five rounds of four countries, 50 points per country in its right place (200 per round). */
export const SHUFFLE_ROUNDS = 5;
export const SHUFFLE_POINTS_PER_PLACE = 50;
/** How many countries of a sorted list stand in their right place. Anything that is not a list of ids counts as none. */
export function placesRight(answer: unknown, correct: unknown) {
  if (!Array.isArray(answer) || !Array.isArray(correct)) return 0;
  return correct.reduce((n: number, id, i) => n + (answer[i] === id ? 1 : 0), 0);
}
export function shufflePoints(answer: unknown, correct: unknown) {
  return Math.min(SHUFFLE_POINTS_PER_PLACE * 4, SHUFFLE_POINTS_PER_PLACE * placesRight(answer, correct));
}
export function trailPoints(correct: boolean, clues = 1) {
  return correct ? 250 - 50 * Math.max(1, Math.min(4, Math.floor(clues))) : 0;
}
/** The Daily Detour has 10 questions (100 points each) since 1.32; 20 (50 each) from 1.18, five stops (200 each) before. */
export const DETOUR_ROUNDS = 10;
export function dailyRoundPoints(mode: PointMode, answer: any, rounds = 5) {
  if (mode === 'trail') return trailPoints(answer.correct, answer.cluesUsed);
  // Daily Size Shuffle: partial credit per country in its right place, from the saved list and the saved right order.
  if (mode === 'order') return shufflePoints(answer.value, answer.correctAnswer);
  if (mode === 'daily') { const n = Math.max(1, rounds); return answer.mode === 'pinpoint' ? Math.round(Math.max(0, Math.min(1000, answer.mapPoints ?? 0)) / n) : answer.correct ? Math.round(1000 / n) : 0; }
  if (mode === 'compare') return answer.correct ? Math.round(1000 / Math.max(1, rounds)) : 0;
  if (mode === 'duel') return answer.correct ? Math.round(1000 / Math.max(1, rounds)) : 0;
  return 0;
}
export function dailyScore(s: { competition?: Competition; answers: any[]; questions?: unknown[]; board?: any; mosaicAid?: Record<string, { wrong: boolean; hints: number }> }) {
  const mode = s.competition?.mode;
  if (!mode) return 0;
  let score = 0;
  // Rank Radar since 1.21: the sum of the points per pick (8 × 125). Before: share of six right answers.
  if (mode === 'rank') score = s.answers.some(a => a.points !== undefined) ? s.answers.reduce((sum, a) => sum + (a.points ?? 0), 0) : Math.round(s.answers.filter(a => a.correct).length / 6 * 1000);
  // Side by Side: the share of the run you got right (10 questions before 1.21, 15 since).
  else if (mode === 'compare') score = Math.round(s.answers.filter(a => a.correct).length / Math.max(1, s.questions?.length ?? 10) * 1000);
  // World Duel: the share of rounds won (five rounds before 1.21, seven since).
  else if (mode === 'duel') score = Math.round(s.answers.filter(a => a.correct).length / Math.max(1, s.board?.rounds?.length ?? 5) * 1000);
  else if (mode === 'mosaic') {
    const solved = new Set(s.answers.filter(a => a.correct).map(a => a.countryId));
    for (const id of solved) { const aid = s.mosaicAid?.[id]; score += aid?.wrong ? 0 : Math.max(0, 250 - (aid?.hints ?? 0) * 125); }
  } else score = s.answers.reduce((sum, a) => sum + dailyRoundPoints(mode, a, s.questions?.length ?? 5), 0);
  return Math.max(0, Math.min(1000, score));
}
