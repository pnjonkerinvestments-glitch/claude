import { COUNTRIES, fame, type Country, type Question } from '../game-engine/questions';
import { random, seedHash, shuffle } from '../game-engine/scoring';
import { GEOGRAPHY_POLICY } from '../config';
import { SHUFFLE_ROUNDS } from '../daily-scoring';

/**
 * The daily Size Shuffle (1.24): five rounds of four countries to sort by area, largest first.
 * The same countries for everyone on a UTC date (the seed comes from the date; the server stores the result
 * in daily_content). Round 1 uses well-known countries whose sizes lie far apart; every round the countries
 * get less familiar and their sizes closer together, so round 5 is the hard one.
 */
type Step = { maxFame: number; minRatio: number; maxRatio: number };
// fame(): 0 = on the familiar list, 1–2 = the rest from large to small. minRatio/maxRatio: area of a country ÷ the next one down.
const STEPS: Step[] = [
  { maxFame: 0, minRatio: 2.5, maxRatio: Infinity },
  { maxFame: 1.3, minRatio: 1.8, maxRatio: Infinity },
  { maxFame: 1.55, minRatio: 1.4, maxRatio: 6 },
  { maxFame: 1.8, minRatio: 1.2, maxRatio: 2.2 },
  { maxFame: 2, minRatio: 1.08, maxRatio: 1.6 },
];
/** Countries a player can reasonably compare: at least 1,000 km² and not politically sensitive. */
const POOL = COUNTRIES.filter(c => c.area >= 1000 && !GEOGRAPHY_POLICY.puzzleSensitiveCountries.includes(c.id));

function fits(list: Country[], step: Step) {
  return list.every((c, i) => i === 0 || (list[i - 1].area / c.area >= step.minRatio && list[i - 1].area / c.area <= step.maxRatio));
}
function pickFour(step: Step, used: Set<string>, rng: () => number) {
  const pool = POOL.filter(c => !used.has(c.id) && fame(c) <= step.maxFame);
  for (let tries = 0; tries < 400; tries++) {
    const list = shuffle(pool, rng).slice(0, 4).sort((a, b) => b.area - a.area);
    if (list.length === 4 && fits(list, step)) return list;
  }
  return null;
}
const fmt = (c: Country, locale: 'en' | 'nl') => (locale === 'en' ? c.name : c.nl) + ': ' + c.area.toLocaleString(locale) + ' km²';

function question(list: Country[], round: number, rng: () => number): Question {
  const sorted = [...list].sort((a, b) => b.area - a.area);
  // The shown order is never already the answer.
  let shown = shuffle(list, rng);
  if (shown.every((c, i) => c.id === sorted[i].id)) shown = [shown[1], shown[0], shown[2], shown[3]];
  return {
    id: 'order:' + seedHash('roviko-v1:daily-order:' + sorted.map(c => c.id).join(',')).toString(36),
    mode: 'order',
    countryId: sorted[0].id,
    prompt: { en: 'Put these countries in order. Largest area first.', nl: 'Zet de landen op volgorde. Grootste oppervlakte bovenaan.' },
    options: shown.map(c => ({ id: c.id, en: c.name, nl: c.nl, flag: c.flag })),
    correct: sorted.map(c => c.id),
    answerLabel: { en: sorted.map(c => c.name).join(' → '), nl: sorted.map(c => c.nl).join(' → ') },
    fact: { en: sorted.map(c => fmt(c, 'en')).join(' · '), nl: sorted.map(c => fmt(c, 'nl')).join(' · ') },
    difficulty: round < 2 ? 'easy' : round < 4 ? 'medium' : 'hard',
  } as Question;
}

/** Five rounds from easy to hard, never the same country twice. Deterministic for a seed. */
export function generateSizeShuffle(seed: string, rounds = SHUFFLE_ROUNDS): Question[] {
  const rng = random('roviko:size-shuffle:' + seed), used = new Set<string>(), out: Question[] = [];
  for (let i = 0; i < rounds; i++) {
    const base = STEPS[Math.min(STEPS.length - 1, Math.round(i * (STEPS.length - 1) / Math.max(1, rounds - 1)))];
    // Should a step ever run dry, loosen it a little at a time instead of failing the day.
    let list: Country[] | null = null;
    for (let relax = 0; !list && relax < 6; relax++) list = pickFour({ maxFame: base.maxFame + relax * .2, minRatio: Math.max(1.03, base.minRatio - relax * .15), maxRatio: base.maxRatio * (1 + relax * .5) }, used, rng);
    if (!list) throw new Error('Size Shuffle selection exhausted');
    list.forEach(c => used.add(c.id));
    out.push(question(list, i, rng));
  }
  return out;
}
