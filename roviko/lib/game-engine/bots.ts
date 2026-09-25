// Computer opponents for rooms. Pure and deterministic per match, round and bot, so every
// server instance that ticks a room arrives at the same answer at the same moment.
import type { Question } from './questions';

export const BOT_LEVELS = ['easy', 'medium', 'hard'] as const;
export type BotLevel = typeof BOT_LEVELS[number];
export const MAX_BOTS = 5;

/** How often each level knows the answer, and how long it thinks (seconds). */
export const BOT_SKILL: Record<BotLevel, { accuracy: number; think: [number, number]; pinError: [number, number] }> = {
  easy: { accuracy: 0.45, think: [5.5, 10], pinError: [6, 22] },
  medium: { accuracy: 0.68, think: [3.5, 7], pinError: [2, 9] },
  hard: { accuracy: 0.88, think: [1.8, 4.2], pinError: [0.2, 3] },
};
export const BOT_NAMES: Record<BotLevel, string[]> = {
  easy: ['Pip', 'Bo', 'Lumi'],
  medium: ['Atlas', 'Juno', 'Kiki'],
  hard: ['Nova', 'Orion', 'Vega'],
};

const between = (rng: () => number, [a, b]: [number, number]) => a + (b - a) * rng();

/** Milliseconds after the round starts at which the bot answers; always before a timed deadline. */
export function botDelay(level: BotLevel, rng: () => number, timerMs = 0) {
  const ms = Math.round(between(rng, BOT_SKILL[level].think) * 1000);
  return timerMs ? Math.min(ms, Math.max(800, timerMs - 900)) : ms;
}

/** A valid answer for any question type: right with the level's accuracy, otherwise a believable miss. */
export function botAnswer(q: Question, level: BotLevel, rng: () => number): unknown {
  const skill = BOT_SKILL[level], right = rng() < skill.accuracy;
  const correct = q.correct as unknown;
  if (q.mode === 'pinpoint' && Array.isArray(correct)) {
    const [lat, lng] = correct as number[];
    // Even a "right" pin lands a little off; a miss lands further away.
    const error = right ? between(rng, [0, skill.pinError[0] + 0.6]) : between(rng, skill.pinError);
    const angle = rng() * Math.PI * 2;
    return [Math.max(-89, Math.min(89, lat + Math.sin(angle) * error)), Math.max(-179, Math.min(179, lng + Math.cos(angle) * error * 1.4))];
  }
  if (q.mode === 'order' && Array.isArray(correct)) {
    const order = [...correct as string[]];
    if (!right && order.length > 1) { const i = Math.floor(rng() * (order.length - 1)); [order[i], order[i + 1]] = [order[i + 1], order[i]]; }
    return order;
  }
  if (q.typed) return right ? (q.aliases?.[0] ?? String(correct)) : '-';
  if (right) return correct;
  const wrong = q.options.filter(o => o.id !== correct);
  return wrong.length ? wrong[Math.floor(rng() * wrong.length)].id : correct;
}
