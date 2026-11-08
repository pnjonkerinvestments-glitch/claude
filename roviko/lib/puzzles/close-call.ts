// Daily Close Call (1.57): three rounds, each with a target ("Get as close as you can to 150 million people"). Ten
// countries pass by one at a time; you see each country but not its number. Take adds it, Skip lets it go (its number is
// shown afterwards), Hold ends the round; after the tenth country the round ends by itself. Go over the target and the
// round is a bust (0). The closer you end, the more points, with a Close Call bonus within 2%. Everyone gets the same
// rounds per UTC date. Data Roviko already ships:
// population and GDP (World Bank 2025, lib/data/comparisons.json) and area (lib/data/countries.json).
import data from '../data/countries.json';
import worldbank from '../data/comparisons.json';
import { random, shuffle } from '../game-engine/scoring';
import { ROUND_MAX, roundPoints } from './close-call-points';

export type Topic = 'population' | 'area' | 'economy';
export type CloseCallRound = { topic: Topic; target: number; deck: string[] };
type CountryRow = { id: string; area: number };

export { CLOSE_CALL_ROUNDS, ROUND_MAX, BONUS_FROM } from './close-call-points';
export const DECK_SIZE = 10;
/**
 * 1.58: a deck is a mix that makes you think: two giants (45–75% of the target) that usually have to be skipped, four
 * middle-sized countries (12–30%) and four small ones (3–10%) to fill the last gap. Shares are of the round's target.
 */
export const GIANT = [.45, .75] as const, MIDDLE = [.12, .30] as const, SMALL = [.03, .10] as const;
export const MIN_SHARE = SMALL[0], MAX_SHARE = GIANT[1];
/** Every round can be finished within 2% of the target (the Close Call bonus), and taking everything always goes over. */
export const BEST_REACH = .98, ALL_OVER = 1.3;
/** Taking blindly until 80% or 90% of the target and then holding scores at most this share of the round. */
export const BLIND_MAX = .55;

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

/** Points for "take everything until `stop` × target, then hold": the autopilot a round must punish. */
export function blindPlay(round: CloseCallRound, stop: number) {
  let total = 0;
  for (const id of round.deck) { if (total >= round.target * stop) break; total += valueOf(round.topic, id) ?? 0; if (total > round.target) return 0; }
  return roundPoints(0, total, round.target, false);
}
/** The closest total at or under the target that a perfect player could reach with this deck (any subset). */
export function bestReach(round: CloseCallRound) {
  const values = round.deck.map(id => valueOf(round.topic, id) ?? 0);
  let best = 0;
  for (let mask = 1; mask < 1 << values.length; mask++) {
    let sum = 0;
    for (let i = 0; i < values.length; i++) if (mask & (1 << i)) sum += values[i];
    if (sum <= round.target && sum > best) best = sum;
  }
  return best;
}
/** Why a round is not fair (empty: it is). */
export function roundProblems(round: CloseCallRound): string[] {
  const problems: string[] = [];
  if (round.deck.length !== DECK_SIZE || new Set(round.deck).size !== DECK_SIZE) problems.push('deck must be 10 different countries');
  const values = round.deck.map(id => valueOf(round.topic, id));
  if (values.some(v => v === null)) return [...problems, 'a country without a number'];
  if (values.some(v => v! < round.target * MIN_SHARE || v! > round.target * MAX_SHARE)) problems.push('a country that is too small or too big');
  if (values.reduce((a, b) => a! + b!, 0)! < round.target * ALL_OVER) problems.push('taking every country must go over');
  if (bestReach(round) < round.target * BEST_REACH) problems.push('the Close Call bonus must be reachable');
  // No autopilot: taking everything until 80% (or 90%) and then holding must not pay (it hits a giant and goes over, or
  // stops far too low).
  for (const stop of [.8, .9]) if (blindPlay(round, stop) > ROUND_MAX[0] * BLIND_MAX) problems.push(`taking blindly until ${stop * 100}% pays too well`);
  return problems;
}

/** The three rounds of a UTC date: every subject once in a date-dependent order, no country twice in a day. */
export function closeCallFor(date: string): CloseCallRound[] {
  // v2 (1.58): decks with giants, middles and small countries. Days already played keep their frozen v1 rounds.
  const rng = random('roviko:close-call:v2:' + date), used = new Set<string>();
  const topics = shuffle<Topic>(['population', 'area', 'economy'], rng);
  return topics.map(topic => {
    for (let attempt = 0; attempt < 2000; attempt++) {
      const target = TARGETS[topic][Math.floor(rng() * TARGETS[topic].length)];
      const band = ([lo, hi]: readonly [number, number]) => [...VALUES[topic]].filter(([id, v]) => !used.has(id) && v >= target * lo && v <= target * hi).map(([id]) => id).sort();
      const giants = band(GIANT), middles = band(MIDDLE), smalls = band(SMALL);
      if (giants.length < 2 || middles.length < 4 || smalls.length < 4) continue;
      const round = { topic, target, deck: shuffle([...shuffle(giants, rng).slice(0, 2), ...shuffle(middles, rng).slice(0, 4), ...shuffle(smalls, rng).slice(0, 4)], rng) };
      if (roundProblems(round).length) continue;
      round.deck.forEach(id => used.add(id));
      return round;
    }
    throw new Error('NO_CLOSE_CALL ' + date + ' ' + topic);
  });
}

export { roundPoints, hasBonus } from './close-call-points';
