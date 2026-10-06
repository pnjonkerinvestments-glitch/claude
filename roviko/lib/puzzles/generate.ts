import { COUNTRIES, type Country } from '../game-engine/questions';
import { dutchCapital } from '../../i18n/capitals-nl';
import { random, shuffle, seedHash } from '../game-engine/scoring';
import snapshot from '../data/comparisons.json';
import silhouettes from '../data/silhouettes.json';
import { numericCountryFact, FACT_EDITION } from './country-facts';
import { TOPICS, formatMetric } from './topics';
import { GEOGRAPHY_POLICY } from '../config';
import type { CompareRound, MosaicBoard, Tile } from './model';

export function dailyTopic(date: string) {
  const day = Math.floor(Date.parse(date + 'T00:00:00Z') / 86400000);
  const cycle = Math.floor(day / TOPICS.length);
  return shuffle(TOPICS, random('roviko:topics:v1:' + cycle))[(day % TOPICS.length + TOPICS.length) % TOPICS.length];
}
const label = (c: Country) => ({ id: c.id, name: { en: c.name, nl: c.nl }, flag: c.flag });
const sensitive = new Set(GEOGRAPHY_POLICY.puzzleSensitiveCountries);
function metric(country: Country, topic: string): number | undefined {
  if (topic === 'area') return country.area;
  if (topic === 'borders') return sensitive.has(country.id) ? undefined : country.borders.length;
  if (topic === 'equator') return Math.abs(country.latlng[0]) * Math.PI / 180 * 6371;
  if (topic === 'north') return country.latlng[0];
  return (snapshot.topics as Record<string, { values: Record<string, number> }>)[topic]?.values[country.id];
}
/** Side by Side since 1.21: 15 comparisons that get harder, and one mistake ends the run. */
export const COMPARE_ROUNDS = 15;
/**
 * A chain of comparisons: the country on the right moves to the left for the next one. With `ramp`, the
 * gap between the two values shrinks along the chain, from obvious (one value a fraction of the other)
 * to close calls (a few per cent apart), so the run starts easy and ends hard.
 */
export function generateComparisons(topicId: string, seed: string, count = 10, anchorId?: string, excluded: string[] = [], ramp = false): CompareRound[] {
  const topic = TOPICS.find(t => t.id === topicId);
  if (!topic) throw new Error('INVALID_TOPIC');
  const rng = random(seed), pool = COUNTRIES.filter(c => Number.isFinite(metric(c, topicId)));
  const values = new Map(pool.map(c => [c.id, metric(c, topicId)!]));
  const formatted = new Map(pool.map(c => [c.id, formatMetric(values.get(c.id)!, topic.unit, 'en')]));
  let right = pool.find(c => c.id === anchorId) ?? shuffle(pool, rng)[0];
  const used = new Set([...excluded, right.id]);
  const picked: [Country, Country][] = [];
  for (let i = 0; i < count; i++) {
    const b = values.get(right.id)!;
    const candidates = pool.filter(c => {
      const a = values.get(c.id)!;
      return !used.has(c.id) && formatted.get(c.id) !== formatted.get(right.id) && Math.abs(a-b) / Math.max(1,Math.abs(a),Math.abs(b)) >= .025;
    });
    // Relative gap 0..1 between the two values; the target falls from 0.85 to 0.04 over the run.
    const gap = (c: Country) => { const a = values.get(c.id)!; return Math.abs(a - b) / Math.max(1e-9, Math.abs(a), Math.abs(b)); };
    const target = .85 - (.85 - .04) * (count > 1 ? i / (count - 1) : 0);
    const left = ramp ? shuffle([...candidates].sort((x, y) => Math.abs(gap(x) - target) - Math.abs(gap(y) - target)).slice(0, 4), rng)[0] : shuffle(candidates, rng)[0];
    if (!left) throw new Error('QUESTION_UNAVAILABLE');
    picked.push([left,right]); used.add(left.id); right = left;
  }
  const metadata = (snapshot.topics as Record<string, { indicator: string; reference_year: number }>)[topicId];
  return picked.map((pair, i) => {
    const countries = pair.map(c => ({ ...label(c), value: metric(c, topicId)! }));
    return { id: 'compare:' + seedHash(seed + ':' + i).toString(36), topic, countries, carried: i > 0 || !!anchorId, correct: countries[0].value > countries[1].value ? countries[0].id : countries[1].id, referenceYear: metadata?.reference_year ?? null, source: metadata ? 'The World Bank · WDI · CC BY 4.0' : 'World countries · ODbL 1.0', sourceUrl: metadata ? 'https://data.worldbank.org/indicator/' + metadata.indicator : '/sources' };
  });
}
export function generateMosaic(size: 3 | 4 | 5, seed: string, focus?: string, factDate = new Date().toISOString().slice(0, 10)): MosaicBoard {
  const rng = random(seed);
  const eligible = COUNTRIES.filter(c => c.area > 5000 && c.capitals.length && !sensitive.has(c.id) && (silhouettes as Record<string, string>)[c.id]);
  const pool = shuffle(eligible, rng).sort((a,b) => +(b.id === focus) - +(a.id === focus));
  const countries: Country[] = [];
  const add = (country: Country) => {
    if (!countries.some(c => c.id === country.id || c.capitals.some(cap => country.capitals.includes(cap)))) countries.push(country);
  };
  if (pool[0]) {
    add(pool[0]);
    // Include another country from the same continent when available, so region
    // alone cannot solve the board. The seeded order still varies every board.
    const companion = pool.find(c => c.id !== pool[0].id && c.region === pool[0].region);
    if (companion) add(companion);
  }
  for (const country of pool) {
    if (countries.length === 4) break;
    add(country);
  }
  if (countries.length !== 4) throw new Error('QUESTION_UNAVAILABLE');
  const kinds = ['flag', 'name', 'shape', 'fact', 'capital'] as const;
  const usedFacts = new Set<string>();
  const tiles: Tile[] = countries.flatMap((country, i) => kinds.slice(0, size).map((kind, j) => ({
    id: 'tile:' + seedHash(seed + ':' + i + ':' + j).toString(36), countryId: country.id, kind,
    ...(kind === 'flag' ? { image: country.flag } : kind === 'shape' ? { path: (silhouettes as Record<string, string>)[country.id] } : kind === 'fact' ? numericCountryFact(country.id, factDate, usedFacts) : { text: kind === 'name' ? { en: country.name, nl: country.nl } : { en: country.capitals.join(' / '), nl: country.capitals.map(dutchCapital).join(' / ') } }),
  })));
  return { id: 'mosaic:' + seedHash(seed).toString(36), size, factEdition: FACT_EDITION, factDate, countries: countries.map(label), tiles: shuffle(tiles, rng) };
}
