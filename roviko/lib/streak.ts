// Daily streak with streak freezes, derived only from the dates a player finished a daily game.
// Every 7 play days earn one freeze (at most FREEZE_MAX in stock). A missed day automatically uses one,
// so the streak survives; frozen days keep the streak alive but do not add to it. Because everything is
// derived from immutable daily results, the outcome is the same on every device and cannot be farmed.
// Freezes only exist from FREEZE_START on, so streaks from before the feature do not change retroactively.

export const FREEZE_START = '2026-09-25';
export const FREEZE_EVERY = 7;
export const FREEZE_MAX = 2;
/** 1.39: the first shield of a streak comes after 3 play days (then every 7), for play days from this date on. */
export const FIRST_FREEZE = 3, FIRST_FREEZE_FROM = '2026-10-13';
/** 1.39: a broken streak can be repaired for free once per this many days, if at most REPAIR_MAX_GAP days were missed. */
export const REPAIR_EVERY = 30, REPAIR_MAX_GAP = 2;
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

export function streakWithFreezes(playedDates: readonly string[], today: string, repairedDates: readonly string[] = []): StreakState {
  const days = [...new Set(playedDates.filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d)).map(dayOf))].filter(d => d <= dayOf(today)).sort((a, b) => a - b);
  const repaired = new Set(repairedDates.filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d)).map(dayOf));
  const start = dayOf(FREEZE_START), firstFrom = dayOf(FIRST_FREEZE_FROM);
  let streak = 0, bank = 0, sinceEarn = 0, earned = 0, frozen: number[] = [], prev: number | null = null;
  // Bridge the missed days between two play days (or up to today); returns false when the streak breaks.
  // Repaired days (1.39) are bridged for free; the others need a freeze each.
  const bridge = (from: number, to: number) => {
    const gap: number[] = []; for (let d = from + 1; d < to; d++) gap.push(d);
    const need = gap.filter(d => !repaired.has(d));
    if (!gap.length) return true;
    if (!need.length) { frozen.push(...gap); return true; }
    if (from + 1 >= start && need.length <= bank) { bank -= need.length; frozen.push(...gap); return true; }
    return false;
  };
  const reset = () => { streak = 0; bank = 0; sinceEarn = 0; earned = 0; frozen = []; };
  const needFor = (d: number) => earned === 0 && d >= firstFrom ? FIRST_FREEZE : FREEZE_EVERY;
  for (const d of days) {
    if (prev !== null && !bridge(prev, d)) reset();
    streak += 1;
    if (d >= start && ++sinceEarn >= needFor(d)) { sinceEarn = 0; earned++; bank = Math.min(FREEZE_MAX, bank + 1); }
    prev = d;
  }
  // Today itself is never missed yet: only the days before it can use a freeze or break the streak.
  if (prev !== null && !bridge(prev, dayOf(today))) reset();
  const nextNeed = prev !== null ? needFor(prev + 1) : needFor(dayOf(today));
  return { streak, freezes: bank, nextFreezeIn: bank >= FREEZE_MAX ? 0 : nextNeed - sinceEarn, frozenDates: frozen.map(dateOf) };
}

/**
 * The free streak repair (1.39): when the last gap before today broke a streak of at least 2 days, and that gap
 * is at most REPAIR_MAX_GAP days, those days can be repaired once per REPAIR_EVERY days (the caller checks that).
 * Returns the days to repair and the streak before and after, or null.
 */
export function repairOffer(playedDates: readonly string[], today: string, repairedDates: readonly string[] = []) {
  const t = dayOf(today);
  const before = [...new Set(playedDates.map(dayOf))].filter(d => d < t).sort((a, b) => a - b);
  const last = before[before.length - 1];
  if (last === undefined) return null;
  const gap: string[] = []; for (let d = last + 1; d < t; d++) gap.push(dateOf(d));
  if (!gap.length || gap.length > REPAIR_MAX_GAP) return null;
  const now = streakWithFreezes(playedDates, today, repairedDates);
  if (gap.every(d => now.frozenDates.includes(d))) return null;
  const fixed = streakWithFreezes(playedDates, today, [...repairedDates, ...gap]);
  const lost = streakWithFreezes(playedDates.filter(d => dayOf(d) <= last), dateOf(last), repairedDates).streak;
  if (lost < 2 || fixed.streak <= now.streak) return null;
  return { days: gap, from: now.streak, to: fixed.streak, lost };
}
