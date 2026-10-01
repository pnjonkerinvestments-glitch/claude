// World Duel: you hold seven country cards, Roviko plays one country per round on a subject.
// Beat it with a card from your hand; every card can be played once. Since 1.21 the results stay hidden
// until the last card is down. Generated boards always
// have exactly one perfect route, every duel is clearly decided, and every round offers a real choice.
import { COUNTRIES } from '../game-engine/questions';
import { random, shuffle } from '../game-engine/scoring';
import { GEOGRAPHY_POLICY } from '../config';
import { RANK_TABLES, type RankCategory } from './rank';
import type { Localized } from './topics';

import { DUEL_MARGIN, DUEL_ROUNDS, type DuelBoard, type DuelCard, type DuelFact, type DuelRound } from './duel-shared';
export { DUEL_MARGIN, DUEL_ROUNDS, duelWon, type DuelBoard, type DuelCard, type DuelFact, type DuelRound } from './duel-shared';

const card = (c: typeof COUNTRIES[number]): DuelCard => ({ id: c.id, name: { en: c.name, nl: c.nl }, flag: c.flag });
const popcount = (m: number) => { let c = 0; for (; m; m &= m - 1) c++; return c; };
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
  const rng = random(seed), n = DUEL_ROUNDS;
  const tables = RANK_TABLES.filter(t => Object.keys(t.values).length >= 120);
  // Recognisable, non-micro countries keep the cards fair for younger players.
  const pool = COUNTRIES.filter(c => !GEOGRAPHY_POLICY.puzzleSensitiveCountries.includes(c.id) && c.area >= 20000);
  const value = (t: typeof tables[number], id: string) => t.values[id].value;
  for (let attempt = 0; attempt < 400; attempt++) {
    const subjects = shuffle(tables, rng).slice(0, n);
    const eligible = shuffle(pool.filter(c => subjects.every(t => t.values[c.id] && t.ranks[c.id])), rng);
    if (eligible.length < n * 3) continue;
    const hand = eligible.slice(0, n), others = eligible.slice(n);
    // Every opponent Roviko may play per round, as the set of hand cards that beat it. Pairings must be
    // clearly decided, so no duel hinges on rounding.
    const options = subjects.map(t => others.filter(o => hand.every(h => clear(value(t, h.id), value(t, o.id))))
      .map(o => ({ o, mask: hand.reduce((m, h, i) => m | (value(t, h.id) > value(t, o.id) ? 1 << i : 0), 0) })));
    // Exactly one perfect route by construction. Cards are placed one by one: each new round may only be won by
    // its own new card and by cards already placed, so a perfect route can never swap two cards. With values
    // per subject, the new card is the strongest one in that subject that has not been placed yet.
    for (let tries = 0; tries < 30; tries++) {
      const open = shuffle(subjects.map((_, i) => i), rng), used = new Set<string>(), chosen: { o: typeof pool[number]; mask: number }[] = [];
      let placed = 0, ok = true, choice = 0;
      for (let k = 0; k < n; k++) {
        const fits = open.flatMap(slot => options[slot].filter(x => !used.has(x.o.id) && popcount(x.mask & ~placed) === 1).map(x => ({ slot, x })));
        if (!fits.length) { ok = false; break; }
        // Prefer rounds more than one card can win, so the order of play matters.
        const rich = fits.filter(f => popcount(f.x.mask) > 1), list = k && rich.length ? rich : fits, pick = list[Math.floor(rng() * list.length)];
        if (popcount(pick.x.mask) > 1) choice++;
        placed |= pick.x.mask; used.add(pick.x.o.id); chosen[pick.slot] = pick.x; open.splice(open.indexOf(pick.slot), 1);
      }
      if (!ok || choice < Math.ceil(n / 2)) continue;
      const beats = subjects.map((_, r) => hand.map((__, i) => !!(chosen[r].mask & 1 << i)));
      const routes = perfectRoutes(beats);
      if (routes.length !== 1) continue;
      const fact = (t: typeof tables[number], id: string): DuelFact => { const o = t.values[id], r = t.ranks[id]; return { value: o.value, rank: r.rank, coverage: r.coverage, referenceYear: o.referenceYear, source: o.source, sourceUrl: o.sourceUrl, ...(o.estimated ? { estimated: true } : {}) }; };
      return {
        seed,
        hand: hand.map(card),
        rounds: subjects.map((t, r) => ({
          category: { id: t.category.id, emoji: t.category.emoji, label: t.category.label, unit: t.category.unit, explanation: t.category.explanation },
          roviko: { ...card(chosen[r].o), ...fact(t, chosen[r].o.id) },
          hand: Object.fromEntries(hand.map(h => [h.id, fact(t, h.id)])),
        })),
        solution: routes[0].map(i => hand[i].id),
        blind: true,
      };
    }
  }
  throw new Error('QUESTION_UNAVAILABLE');
}

/** Does this card beat Roviko's country in this round? */
