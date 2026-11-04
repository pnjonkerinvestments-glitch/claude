// Daily Close Call (1.57): three rounds, each with a target ("Get as close as you can to 150 million people"). You see the
// next country of the round's deck but not its number; Draw adds it, Hold stops. Go over the target and the round is a
// bust (0). The closer you hold, the more points. Everyone gets the same rounds per UTC date. Data Roviko already ships:
// population and GDP (World Bank 2025, lib/data/comparisons.json) and area (lib/data/countries.json).
import data from '../data/countries.json';
import worldbank from '../data/comparisons.json';
import { random, shuffle } from '../game-engine/scoring';

export type Topic = 'population' | 'area' | 'economy';
export type CloseCallRound = { topic: Topic; target: number; deck: string[] };
type CountryRow = { id: string; area: number };

export const CLOSE_CALL_ROUNDS = 3;
/** Points per round: 333, 333 and 334, so a perfect day is exactly 1,000. */
export const ROUND_MAX = [333, 333, 334];
export const DECK_SIZE = 10;
/** The shortest and longest safe run of draws a round may have. */
export const MIN_SAFE = 3, MAX_SAFE = 6;
/** The last safe total sits at most 97% of the target and the next draw at least 3% over it: no "is 150.0 over 150?". */
export const MARGIN = 0.03;

const COUNTRIES = data as CountryRow[];
const WB = (worldbank as any).topics as Record<string, { values: Record<string, number> }>;
const VALUES: Record<Topic, Map<string, number>> = {
  population: new Map(Object.entries(WB.population.values).filter(([, v]) => v > 0)),
  area: new Map(COUNTRIES.filter(c => c.area > 0).map(c => [c.id, c.area])),
  economy: new Map(Object.entries(WB.economy.values).filter(([, v]) => v > 0)),
};
/** Round targets per subject: round numbers people can picture. */
export const TARGETS: Record<Topic, number[]> = {
  population: [100e6, 120e6, 150e6, 180e6, 200e6, 250e6],
  area: [1e6, 1.2e6, 1.5e6, 2e6, 2.5e6, 3e6],
  economy: [1e12, 1.5e12, 2e12, 2.5e12, 3e12],
};
export const valueOf = (topic: Topic, id: string) => VALUES[topic].get(id) ?? null;

/** How many draws are safe in a deck (the running total stays at or under the target). */
export function safeDraws(round: CloseCallRound) {
  let sum = 0, k = 0;
  for (const id of round.deck) { const v = valueOf(round.topic, id)!; if (sum + v > round.target) break; sum += v; k++; }
  return k;
}
/** Why a round is not fair (empty: it is). */
export function roundProblems(round: CloseCallRound): string[] {
  const problems: string[] = [];
  if (round.deck.length !== DECK_SIZE || new Set(round.deck).size !== DECK_SIZE) problems.push('deck must be 10 different countries');
  if (round.deck.some(id => valueOf(round.topic, id) === null)) problems.push('a country without a number');
  const k = safeDraws(round);
  if (k < MIN_SAFE || k > MAX_SAFE) problems.push(`${k} safe draws (3 to 6 wanted)`);
  const values = round.deck.map(id => valueOf(round.topic, id) ?? 0), safe = values.slice(0, k).reduce((a, b) => a + b, 0), over = safe + (values[k] ?? Infinity);
  if (safe > round.target * (1 - MARGIN)) problems.push('the last safe total is too close to the target');
  if (over < round.target * (1 + MARGIN)) problems.push('the first bust is too close to the target');
  return problems;
}

/** The three rounds of a UTC date: every subject once in a date-dependent order, no country twice in a day. */
export function closeCallFor(date: string): CloseCallRound[] {
  const rng = random('roviko:close-call:v1:' + date), used = new Set<string>();
  const topics = shuffle<Topic>(['population', 'area', 'economy'], rng);
  return topics.map(topic => {
    for (let attempt = 0; attempt < 500; attempt++) {
      const target = TARGETS[topic][Math.floor(rng() * TARGETS[topic].length)];
      // Middle-sized countries only (4% to 45% of the target): no giant fills a round alone, no dwarf is a free draw.
      const pool = [...VALUES[topic]].filter(([id, v]) => !used.has(id) && v >= target * .04 && v <= target * .45).map(([id]) => id).sort();
      if (pool.length < DECK_SIZE) continue;
      const round = { topic, target, deck: shuffle(pool, rng).slice(0, DECK_SIZE) };
      if (roundProblems(round).length) continue;
      round.deck.forEach(id => used.add(id));
      return round;
    }
    throw new Error('NO_CLOSE_CALL ' + date + ' ' + topic);
  });
}

/** Points for one round: 0 for a bust, otherwise the share of the target you reached (rounded). */
export function roundPoints(round: number, total: number, target: number, bust: boolean) {
  if (bust || total <= 0) return 0;
  return Math.round(ROUND_MAX[round] * Math.min(1, total / target));
}
