import measurements from '../data/country-metrics.json';
import worldbank from '../data/comparisons.json';
import { COUNTRIES, type Country } from '../game-engine/questions';
import { random, shuffle, seedHash } from '../game-engine/scoring';
import { TOPICS, type Localized } from './topics';
import type { MosaicBoard, MosaicFact, Tile } from './model';

export const FACT_EDITION = 'metrics-v2';
const text = (en: string, nl: string): Localized => ({ en, nl });
type Observation = { value: number; reference_year: number | null; estimated: boolean; source_id: string; source_url: string; raw: string; place?: string };
const archive = measurements.records as unknown as Record<string, Record<string, Observation>>;
const definitions: Record<string, { label: Localized; unit: string; explanation: Localized }> = {
  highest: { label: text('Highest point', 'Hoogste punt'), unit: 'm', explanation: text('Elevation above sea level. The source’s territorial convention applies; the summit name is revealed after matching.', 'Hoogte boven zeeniveau, volgens de territoriale indeling van de bron. De naam van de top verschijnt na het koppelen.') },
  elevation: { label: text('Mean elevation', 'Gemiddelde hoogte'), unit: 'm', explanation: text('Average terrain elevation above sea level, rather than the height of the highest mountain.', 'De gemiddelde terreinhoogte boven zeeniveau, niet de hoogte van de hoogste berg.') },
  coastline: { label: text('Coastline', 'Kustlengte'), unit: 'km', explanation: text('Coastline length in the archived Factbook. Length depends on the measuring method and which islands the source includes.', 'Kustlengte uit het Factbook-archief. De lengte hangt af van de meetmethode en de eilanden die de bron meetelt.') },
  age: { label: text('Median age', 'Mediane leeftijd'), unit: 'years', explanation: text('Half of the population is younger than this age and half is older. This is neither the average age nor life expectancy.', 'De helft van de bevolking is jonger dan deze leeftijd en de helft is ouder. Dit is niet de gemiddelde leeftijd of levensverwachting.') },
  area: { label: text('Total area', 'Totale oppervlakte'), unit: 'area', explanation: text('Total country area from the country catalogue, following its territorial convention.', 'Totale oppervlakte uit de landencatalogus, volgens de territoriale indeling van die bron.') },
};
for (const id of ['population', 'life', 'urban', 'income', 'economy', 'forest', 'farmland', 'internet', 'births', 'exports']) {
  const t = TOPICS.find(t => t.id === id)!;
  definitions[id] = { label: t.label, unit: t.unit, explanation: t.explanation };
}
definitions.economy.label = text('Total GDP', 'Totaal bbp');

type Candidate = { category: string; value: number; referenceYear: number | null; estimated: boolean; place?: string; source: MosaicFact['source'] };
function candidates(country: Country): Candidate[] {
  const result: Candidate[] = [{ category: 'area', value: country.area, referenceYear: null, estimated: false, source: { title: 'World countries 5.1.0', provider: 'Mohammed Le Doze & contributors', url: 'https://github.com/mledoze/countries', license: 'ODbL 1.0', licenseUrl: '/licenses/countries-ODbL.txt' } }];
  for (const [category, value] of Object.entries(archive[country.id] ?? {})) {
    if (!definitions[category] || !Number.isFinite(value.value) || value.value <= 0) continue;
    result.push({ category, value: value.value, referenceYear: value.reference_year, estimated: value.estimated, place: value.place, source: { title: value.source_id === 'zugspitze-operator' ? 'Zugspitze · mountain operator' : 'The World Factbook · archived country profile', provider: value.source_id === 'zugspitze-operator' ? 'Bayerische Zugspitzbahn' : 'CIA · factbook.json archive', url: value.source_url, license: value.source_id === 'zugspitze-operator' ? 'Factual observation' : 'CC0 1.0', licenseUrl: value.source_id === 'zugspitze-operator' ? value.source_url : '/licenses/factbook-CC0.txt' } });
  }
  for (const [category, data] of Object.entries(worldbank.topics)) {
    const value = (data.values as Record<string, number>)[country.id];
    if (!definitions[category] || !Number.isFinite(value) || value <= 0) continue;
    result.push({ category, value, referenceYear: data.reference_year, estimated: false, source: { title: 'World Development Indicators · ' + data.indicator, provider: 'The World Bank', url: 'https://data.worldbank.org/indicator/' + data.indicator, license: 'CC BY 4.0', licenseUrl: 'https://www.worldbank.org/ext/en/legal/terms-conditions/datasets' } });
  }
  return shuffle(result, random('roviko:fact-order:v2:' + country.id));
}
const catalogue = new Map(COUNTRIES.map(c => [c.id, candidates(c)]));
export const factCoverage = () => Object.fromEntries([...catalogue].map(([id, facts]) => [id, facts.map(f => f.category)]));

function display(value: number, unit: string, locale: 'en' | 'nl') {
  const compact = (unit === 'dollars' || unit === 'number') && value >= 1e6;
  const number = new Intl.NumberFormat(locale === 'nl' ? 'nl-NL' : 'en-GB', { notation: compact ? 'compact' : 'standard', maximumFractionDigits: compact ? 2 : ['percent', 'years', 'births'].includes(unit) ? 1 : 0 }).format(value);
  const units: Record<string, Localized> = { m: text('m above sea level', 'm boven zeeniveau'), km: text('km of coastline', 'km kust'), years: text('years', 'jaar'), area: text('km²', 'km²'), dollars: text('US dollars', 'Amerikaanse dollar'), percent: text('%', '%'), number: text('people', 'inwoners'), births: text('per woman', 'per vrouw') };
  return { number, unit: units[unit]?.[locale] ?? '' };
}

/** One numeric clue per country; advance through its available subjects every UTC day.
 * Used signatures avoid ambiguous, equally displayed clues within the same board. */
export function numericCountryFact(countryId: string, date: string, used = new Set<string>()): Pick<Tile, 'text' | 'fact'> {
  const pool = catalogue.get(countryId);
  const day = Math.floor(Date.parse(date + 'T00:00:00Z') / 86400000);
  if (!pool?.length || !Number.isFinite(day)) throw new Error('QUESTION_UNAVAILABLE');
  const start = ((day + seedHash(countryId)) % pool.length + pool.length) % pool.length;
  for (let offset = 0; offset < pool.length; offset++) {
    const c = pool[(start + offset) % pool.length], d = definitions[c.category];
    const en = display(c.value, d.unit, 'en'), nl = display(c.value, d.unit, 'nl');
    const signature = c.category + ':' + en.number + ':' + c.referenceYear;
    if (used.has(signature)) continue;
    used.add(signature);
    const reference = c.referenceYear ? text(String(c.referenceYear) + (c.estimated ? ' estimate' : ''), String(c.referenceYear) + (c.estimated ? ' · schatting' : '')) : c.source.provider.startsWith('CIA') ? text('Archived source', 'Archiefbron') : text('Source catalogue', 'Broncatalogus');
    const valueText = text(en.number + ' ' + en.unit, nl.number + ' ' + nl.unit);
    return {
      text: text(d.label.en + ': ' + valueText.en + ' · ' + reference.en, d.label.nl + ': ' + valueText.nl + ' · ' + reference.nl),
      fact: { id: FACT_EDITION + ':' + countryId + ':' + c.category + ':' + date, category: c.category, explanation: text((c.place ? c.place + ' · ' + valueText.en + '. ' : '') + d.explanation.en, (c.place ? c.place + ' · ' + valueText.nl + '. ' : '') + d.explanation.nl), source: c.source, checkedAt: measurements.imported_at, stat: { label: d.label, value: text(en.number, nl.number), unit: text(en.unit, nl.unit), reference, rawValue: c.value, referenceYear: c.referenceYear, estimated: c.estimated } },
    };
  }
  throw new Error('QUESTION_UNAVAILABLE');
}

/** Upgrade clue presentation without changing tile IDs, country matches or saved results.
 * A daily keeps its date. A practice board keeps the date on which it was created. */
export function refreshMosaicFacts(board: MosaicBoard, date: string): MosaicBoard {
  if (board.factEdition === FACT_EDITION) return board;
  const used = new Set<string>();
  const replacements = new Map(board.countries.map(c => [c.id, numericCountryFact(c.id, date, used)]));
  return { ...board, factEdition: FACT_EDITION, factDate: date, tiles: board.tiles.map(tile => tile.kind === 'fact' ? { ...tile, ...replacements.get(tile.countryId) } : tile) };
}
