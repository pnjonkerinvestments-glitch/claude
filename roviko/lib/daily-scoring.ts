/** Versioned, untimed daily competition. Practice and multiplayer never enter this ledger. */
export const COMPETITION_VERSION = 1;
export const COMPETITION_SUFFIX = ':competitive-v1';
export const DAILY_POINT_MODES = ['daily', 'trail', 'compare', 'mosaic', 'rank'] as const;
export type PointMode = typeof DAILY_POINT_MODES[number];
export type Competition = { version: 1; mode: PointMode };
export const DAILY_GAME_MAX = 1000;
export const DAILY_TOTAL_MAX = DAILY_POINT_MODES.length * DAILY_GAME_MAX;
export function trailPoints(correct: boolean, clues = 1) {
  return correct ? 250 - 50 * Math.max(1, Math.min(4, Math.floor(clues))) : 0;
}
/** The Daily Detour has 20 questions (50 points each); editions before 1.18 had five stops (200 each). */
export const DETOUR_ROUNDS = 20;
export function dailyRoundPoints(mode: PointMode, answer: any, rounds = 5) {
  if (mode === 'trail') return trailPoints(answer.correct, answer.cluesUsed);
  if (mode === 'daily') { const n = Math.max(1, rounds); return answer.mode === 'pinpoint' ? Math.round(Math.max(0, Math.min(1000, answer.mapPoints ?? 0)) / n) : answer.correct ? Math.round(1000 / n) : 0; }
  if (mode === 'compare') return answer.correct ? 100 : 0;
  return 0;
}
export function dailyScore(s: { competition?: Competition; answers: any[]; questions?: unknown[]; mosaicAid?: Record<string, { wrong: boolean; hints: number }> }) {
  const mode = s.competition?.mode;
  if (!mode) return 0;
  let score = 0;
  if (mode === 'rank') score = Math.round(s.answers.filter(a => a.correct).length / 6 * 1000);
  else if (mode === 'mosaic') {
    const solved = new Set(s.answers.filter(a => a.correct).map(a => a.countryId));
    for (const id of solved) { const aid = s.mosaicAid?.[id]; score += aid?.wrong ? 0 : Math.max(0, 250 - (aid?.hints ?? 0) * 125); }
  } else score = s.answers.reduce((sum, a) => sum + dailyRoundPoints(mode, a, s.questions?.length ?? 5), 0);
  return Math.max(0, Math.min(1000, score));
}
