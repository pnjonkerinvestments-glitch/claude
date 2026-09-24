// Daily quests ("dagdoelen"): three small goals per UTC day, the same for everyone.
// Pure logic so the homepage, the after-game loop and tests agree. Quests give no points or XP;
// finishing all three earns a crown, kept in this browser.
import { DAILY_MODES, type DailyMode } from './daily-loop';

export type QuestKind = 'mode' | 'mystery' | 'duel' | 'games';
export type Quest = { id: string; kind: QuestKind; icon: string; mode?: DailyMode; target: number; progress: number; done: boolean };
export type QuestInput = { completedModes: readonly string[]; mysteryPlayed: boolean; duelDone: boolean };

/** Days since 1970-01-01 for a UTC date string. */
const dayNumber = (date: string) => Math.floor(Date.parse(date + 'T00:00:00Z') / 86400000);

/** Easy: one named daily game. Medium: a bonus game (mystery or duel). Stretch: three daily games. */
export function questsFor(date: string, input: QuestInput): Quest[] {
  const day = dayNumber(date);
  const completed = new Set(input.completedModes.filter(m => (DAILY_MODES as readonly string[]).includes(m)));
  const mode = DAILY_MODES[((day % DAILY_MODES.length) + DAILY_MODES.length) % DAILY_MODES.length];
  const bonus: QuestKind = day % 2 === 0 ? 'mystery' : 'duel';
  const make = (id: string, kind: QuestKind, icon: string, target: number, progress: number, extra: Partial<Quest> = {}): Quest =>
    ({ id, kind, icon, target, progress: Math.min(progress, target), done: progress >= target, ...extra });
  return [
    make('mode:' + mode, 'mode', '🎯', 1, completed.has(mode) ? 1 : 0, { mode }),
    bonus === 'mystery' ? make('mystery', 'mystery', '❓', 1, input.mysteryPlayed ? 1 : 0) : make('duel', 'duel', '⚔️', 1, input.duelDone ? 1 : 0),
    make('games:3', 'games', '🔥', 3, completed.size),
  ];
}

export const allQuestsDone = (quests: Quest[]) => quests.length > 0 && quests.every(q => q.done);

/** Crowns are a small collectible: one per UTC day on which all quests were finished. */
export function addCrown(dates: readonly string[], date: string) {
  return dates.includes(date) ? [...dates] : [...dates, date].sort().slice(-400);
}
