// World Duel: you hold five country cards, Roviko plays one country per round on a subject.
// Beat it with a card from your hand; every card can be played once. Generated boards always
// have exactly one perfect route, every duel is clearly decided, and every round offers a real choice.
import { COUNTRIES } from '../game-engine/questions';
import { random, shuffle } from '../game-engine/scoring';
import { GEOGRAPHY_POLICY } from '../config';
import { RANK_TABLES, type RankCategory } from './rank';
import type { Localized } from './topics';

import { DUEL_MARGIN, DUEL_ROUNDS, type DuelBoard, type DuelCard, type DuelFact, type DuelRound } from './duel-shared';
export { DUEL_MARGIN, DUEL_ROUNDS, duelWon, type DuelBoard, type DuelCard, type DuelFact, type DuelRound } from './duel-shared';

const card = (c: typeof COUNTRIES[number]): DuelCard => ({ id: c.id, name: { en: c.name, nl: c.nl }, flag: c.flag });
const clear = (a: number, b: number) => Math.abs(a - b) / Math.max(Math.abs(a), Math.abs(b), 1e-9) >= DUEL_MARGIN;

/** Every way to give each round a different card that wins it. */
export function perfectRoutes(beats: boolean[][]): number[][] {
  const routes: number[][] = [], n = beats.length;
  const walk = (round: number, used: number[]) => {
    if (round === n) { routes.push([...used]); return; }
    for (let c = 0; c < n; c++) if (!used.includes(c) && beats[round][c]) { used.push(c); walk(round + 1, used); used.pop(); }
  };
  walk(0, []);
  return routes;
}

export function generateDuel(seed: string): DuelBoard {
  const rng = random(seed);
  const tables = RANK_TABLES.filter(t => Object.keys(t.values).length >= 120);
  // Recognisable, non-micro countries keep the cards fair for younger players.
  const pool = COUNTRIES.filter(c => !GEOGRAPHY_POLICY.puzzleSensitiveCountries.includes(c.id) && c.area >= 20000);
  for (let attempt = 0; attempt < 20000; attempt++) {
    const subjects = shuffle(tables, rng).slice(0, DUEL_ROUNDS);
    const eligible = pool.filter(c => subjects.every(t => t.values[c.id] && t.ranks[c.id]));
    if (eligible.length < DUEL_ROUNDS * 2) continue;
    const picked = shuffle(eligible, rng).slice(0, DUEL_ROUNDS * 2);
    const hand = picked.slice(0, DUEL_ROUNDS), opponents = picked.slice(DUEL_ROUNDS);
    const value = (t: typeof tables[number], id: string) => t.values[id].value;
    // Every possible pairing must be clearly decided, so no duel hinges on rounding.
    if (!subjects.every((t, r) => hand.every(h => clear(value(t, h.id), value(t, opponents[r].id))))) continue;
    const beats = subjects.map((t, r) => hand.map(h => value(t, h.id) > value(t, opponents[r].id)));
    const routes = perfectRoutes(beats);
    if (routes.length !== 1) continue;
    // A real choice: most rounds can be won by more than one card, so the order matters.
    if (beats.filter(row => row.filter(Boolean).length >= 2).length < 3) continue;
    const fact = (t: typeof tables[number], id: string): DuelFact => { const o = t.values[id], r = t.ranks[id]; return { value: o.value, rank: r.rank, coverage: r.coverage, referenceYear: o.referenceYear, source: o.source, sourceUrl: o.sourceUrl, ...(o.estimated ? { estimated: true } : {}) }; };
    return {
      seed,
      hand: hand.map(card),
      rounds: subjects.map((t, r) => ({
        category: { id: t.category.id, emoji: t.category.emoji, label: t.category.label, unit: t.category.unit, explanation: t.category.explanation },
        roviko: { ...card(opponents[r]), ...fact(t, opponents[r].id) },
        hand: Object.fromEntries(hand.map(h => [h.id, fact(t, h.id)])),
      })),
      solution: routes[0].map(i => hand[i].id),
    };
  }
  throw new Error('QUESTION_UNAVAILABLE');
}

/** Does this card beat Roviko's country in this round? */
