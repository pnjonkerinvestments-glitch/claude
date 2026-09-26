// The bonus tour, kept apart from daily-loop so the worker can import it without the translations.
export type DailyState = 'new' | 'active' | 'done';

/**
 * The bonus tour: after the six scored games, the six classic games as a daily edition. Same countries for
 * everyone on a UTC date, ten questions each, no ranking points. Easiest first so the tour keeps flowing.
 */
export const BONUS_MODES = ['flags', 'capitals', 'pinpoint', 'borders', 'order', 'trail'] as const;
export type BonusMode = typeof BONUS_MODES[number];
export const BONUS_ROUNDS = 10;
export type BonusSession = { mode: string; completed?: boolean; score?: number; total?: number };
export function bonusStateOf(bonus: BonusSession[] | undefined, mode: BonusMode): DailyState {
  const saved = bonus?.find(s => s.mode === mode);
  return saved?.completed ? 'done' : saved ? 'active' : 'new';
}
/** A started bonus game first, otherwise the first one not yet played today. */
export function nextBonusMode(bonus: BonusSession[] | undefined): BonusMode | null {
  return BONUS_MODES.find(m => bonusStateOf(bonus, m) === 'active') ?? BONUS_MODES.find(m => bonusStateOf(bonus, m) === 'new') ?? null;
}
