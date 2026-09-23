import { COUNTRIES, type Country } from '../game-engine/questions';
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
export function generateComparisons(topicId: string, seed: string, count = 10, anchorId?: string, excluded: string[] = []): CompareRound[] {
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
    const left = shuffle(candidates, rng)[0];
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
    ...(kind === 'flag' ? { image: country.flag } : kind === 'shape' ? { path: (silhouettes as Record<string, string>)[country.id] } : kind === 'fact' ? numericCountryFact(country.id, factDate, usedFacts) : { text: kind === 'name' ? { en: country.name, nl: country.nl } : { en: country.capitals.join(' / '), nl: country.capitals.join(' / ') } }),
  })));
  return { id: 'mosaic:' + seedHash(seed).toString(36), size, factEdition: FACT_EDITION, factDate, countries: countries.map(label), tiles: shuffle(tiles, rng) };
}
