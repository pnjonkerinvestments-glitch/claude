// Daily streak with streak freezes, derived only from the dates a player finished a daily game.
// Every 7 play days earn one freeze (at most FREEZE_MAX in stock). A missed day automatically uses one,
// so the streak survives; frozen days keep the streak alive but do not add to it. Because everything is
// derived from immutable daily results, the outcome is the same on every device and cannot be farmed.
// Freezes only exist from FREEZE_START on, so streaks from before the feature do not change retroactively.

export const FREEZE_START = '2026-09-25';
export const FREEZE_EVERY = 7;
export const FREEZE_MAX = 2;
const DAY = 86400000;
const dayOf = (date: string) => Math.round(Date.parse(date + 'T00:00:00Z') / DAY);
const dateOf = (day: number) => new Date(day * DAY).toISOString().slice(0, 10);

export type StreakState = {
  streak: number;
  /** Freezes ready to protect the next missed day(s). */
  freezes: number;
  /** Play days still needed for the next freeze (0 when the stock is full). */
  nextFreezeIn: number;
  /** Days on which a freeze was used for the current streak, newest last. */
  frozenDates: string[];
};

export function streakWithFreezes(playedDates: readonly string[], today: string): StreakState {
  const days = [...new Set(playedDates.filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d)).map(dayOf))].filter(d => d <= dayOf(today)).sort((a, b) => a - b);
  const start = dayOf(FREEZE_START);
  let streak = 0, bank = 0, sinceEarn = 0, frozen: number[] = [], prev: number | null = null;
  // Bridge the missed days between two play days (or up to today); returns false when the streak breaks.
  const bridge = (from: number, to: number) => {
    const missed = to - from - 1;
    if (missed <= 0) return true;
    if (from + 1 >= start && missed <= bank) { bank -= missed; for (let d = from + 1; d < to; d++) frozen.push(d); return true; }
    return false;
  };
  for (const d of days) {
    if (prev !== null && !bridge(prev, d)) { streak = 0; bank = 0; sinceEarn = 0; frozen = []; }
    streak += 1;
    if (d >= start && ++sinceEarn >= FREEZE_EVERY) { sinceEarn = 0; bank = Math.min(FREEZE_MAX, bank + 1); }
    prev = d;
  }
  // Today itself is never missed yet: only the days before it can use a freeze or break the streak.
  if (prev !== null && !bridge(prev, dayOf(today))) { streak = 0; bank = 0; sinceEarn = 0; frozen = []; }
  return { streak, freezes: bank, nextFreezeIn: bank >= FREEZE_MAX ? 0 : FREEZE_EVERY - sinceEarn, frozenDates: frozen.map(dateOf) };
}
