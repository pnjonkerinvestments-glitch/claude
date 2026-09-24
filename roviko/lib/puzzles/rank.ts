import { localized } from '../../i18n/content';
import { COUNTRIES } from '../game-engine/questions';
import { random, shuffle, seedHash } from '../game-engine/scoring';
import { GEOGRAPHY_POLICY } from '../config';
import snapshot from '../data/comparisons.json';
import archive from '../data/country-metrics.json';
import { TOPICS, type Localized } from './topics';

const text = localized;
export type RankCategory = { id: string; emoji: string; label: Localized; explanation: Localized; unit: string };
export const RANK_CATEGORIES: RankCategory[] = [
  ...TOPICS.filter(t => !['borders','equator','north'].includes(t.id)),
  { id: 'highest', emoji: '🏔️', label: text('Highest peak','Hoogste punt'), unit: 'm', explanation: text('Elevation of the highest point above sea level. Shared summits can have equal ranks.','Hoogte van het hoogste punt boven zeeniveau. Gedeelde toppen kunnen dezelfde positie hebben.') },
  { id: 'elevation', emoji: '⛰️', label: text('Average elevation','Gemiddelde hoogte'), unit: 'm', explanation: text('Mean elevation of the country’s land above sea level.','Gemiddelde hoogte van het land boven zeeniveau.') },
  { id: 'coastline', emoji: '🌊', label: text('Coastline','Kustlijn'), unit: 'km', explanation: text('Coastline length in the archived source. Measurements depend on scale and method.','Lengte van de kustlijn in de archiefbron. Metingen hangen af van schaal en methode.') },
  { id: 'age', emoji: '🧑‍🤝‍🧑', label: text('Median age','Mediane leeftijd'), unit: 'years', explanation: text('Half the population is younger than this age, half older. A 2025 estimate, not an arithmetic average.','De helft van de bevolking is jonger, de helft ouder. Een schatting voor 2025, geen rekenkundig gemiddelde.') },
];
type Observation = { value: number; referenceYear: number | null; source: string; sourceUrl: string; estimated?: boolean; place?: string };
export type RankOption = RankCategory & Observation & { rank: number; coverage: number; position: number; topPercent: number };
export type RankRound = { id: string; country: { id: string; name: Localized; flag: string }; options: RankOption[]; correct: string };
export type RankAnswer = { value: string; correct: boolean; countryId: string; questionId: string; responseTime: number; at: number };
export type RankState = { competition?: import('../daily-scoring').Competition; id: string; mode: 'rank'; daily: string | null; phase: 'question' | 'reveal' | 'finished'; round: number; questions: RankRound[]; answers: RankAnswer[]; streak: number; bestStreak: number; startedAt: number; turnAt: number; datasetVersion?: string };
export type RankView = Omit<RankState, 'questions' | 'startedAt' | 'turnAt'> & { total: number; version: number; score?: number; question: RankRound | null; review?: RankRound[]; learning: true; places?: number[] };

/** Competition ranking: ties share a place. Coverage never includes missing values. */
export function rankValues(values: Record<string, number>) {
  const entries = Object.entries(values).filter(([,v]) => Number.isFinite(v));
  const ordered = entries.map(([,v]) => v).sort((a,b) => b-a);
  return Object.fromEntries(entries.map(([id,value]) => {
    const rank = ordered.indexOf(value) + 1, coverage = ordered.length;
    return [id, { rank, coverage, position: coverage > 1 ? (rank-1)/(coverage-1) : 0, topPercent: Math.ceil(rank/coverage*100) }];
  }));
}
function observations(topic: RankCategory): Record<string, Observation> {
  const wdi = (snapshot.topics as Record<string, { values: Record<string, number>; reference_year: number; indicator: string }>)[topic.id];
  const records = archive.records as Record<string, Record<string, {value: number; reference_year: number | null; source_id: string; source_url: string; estimated: boolean; place?: string}>>;
  return Object.fromEntries(COUNTRIES.flatMap<[string, Observation]>(c => {
    if (topic.id === 'area') return [[c.id, { value:c.area, referenceYear:null, source:'World countries · ODbL 1.0', sourceUrl:'/sources' }]];
    if (wdi && Number.isFinite(wdi.values[c.id])) return [[c.id, { value:wdi.values[c.id], referenceYear:wdi.reference_year, source:'World Bank · WDI · CC BY 4.0', sourceUrl:'https://data.worldbank.org/indicator/'+wdi.indicator }]];
    const fact = records[c.id]?.[topic.id];
    if (!fact || !Number.isFinite(fact.value) || (topic.id === 'age' && fact.reference_year !== 2025)) return [];
    return [[c.id, { value:fact.value, referenceYear:fact.reference_year, source:fact.source_id === 'zugspitze-operator' ? 'Zugspitze · mountain operator · numerical fact' : 'Factbook archive · CC0', sourceUrl:fact.source_url, estimated:fact.estimated, ...(fact.place ? {place:fact.place} : {}) }]];
  }));
}
export const RANK_TABLES = RANK_CATEGORIES.map(category => { const values=observations(category); return { category, values, ranks:rankValues(Object.fromEntries(Object.entries(values).map(([id,o])=>[id,o.value]))) }; });

export function generateRankRounds(seed: string, count = 6): RankRound[] {
  const rng = random(seed), rounds: RankRound[] = [], usedWinners = new Set<string>();
  const pool = shuffle(COUNTRIES.filter(c => !GEOGRAPHY_POLICY.puzzleSensitiveCountries.includes(c.id)), rng);
  for (const country of pool) {
    const options: RankOption[] = RANK_TABLES.filter(t => t.values[country.id]).map(t => ({...t.category,...t.values[country.id],...t.ranks[country.id]}));
    // Leave a visible gap: avoid questions decided by rounding or unequal coverage.
    const candidates = shuffle(options.filter(o => o.position < .55 && !usedWinners.has(o.id)), rng);
    for (const winner of candidates) {
      const others = shuffle(options.filter(o => o.id !== winner.id && o.rank > winner.rank && o.position - winner.position >= .08 && o.topPercent - winner.topPercent >= 8),rng).slice(0,3);
      if (others.length !== 3) continue;
      rounds.push({ id:'rank:'+seedHash(seed+':'+rounds.length).toString(36), country:{ id:country.id, name:text(country.name,country.nl), flag:country.flag }, options:shuffle([winner,...others],rng), correct:winner.id });
      usedWinners.add(winner.id); break;
    }
    if (rounds.length === count) return rounds;
  }
  throw new Error('QUESTION_UNAVAILABLE');
}
