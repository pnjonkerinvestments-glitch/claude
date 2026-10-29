// Daily Crossroads (1.55): a 3×3 grid of country categories. Three categories head the columns, three the rows, and each
// square wants one country that fits both. Every country once, 9 squares, 12 guesses, no timer. The grid comes from the
// date alone (same seed logic as the other daily games), built only from data Roviko already ships:
// continent (`region` in lib/data/countries.json), landlocked (CIA Factbook coastline 0 km, lib/data/country-metrics.json),
// no land borders and neighbours (`borders`, the same data as Next Door), the capital's first letter (`capitals`),
// population (World Bank 2025, lib/data/comparisons.json), area (`area`), official languages (`languages`) and four
// well-known regions (`subregion`). Not used: currencies (stale: Bulgaria's euro is missing) and highest points (gaps).
// TODO (later step, not built): a multiplayer Crossroads, noughts and crosses on this grid in a room.
import data from '../data/countries.json';
import metrics from '../data/country-metrics.json';
import worldbank from '../data/comparisons.json';
import { spanishCapital, spanishCountry } from '../../i18n/content';
import { dutchCapital } from '../../i18n/capitals-nl';
import { random, normalize } from '../game-engine/scoring';
import { resolveCountry } from './country-names';

type Locale = 'en' | 'nl' | 'es';
type Label = Record<Locale, string>;
type CountryRow = { id: string; name: string; nl: string; capitals: string[]; region: string; subregion: string; borders: string[]; area: number; languages: string[] };
export type CategoryKind = 'continent' | 'region' | 'landlocked' | 'island' | 'capital' | 'popOver' | 'areaOver' | 'areaUnder' | 'borders' | 'neighbours' | 'language';
/** Continents and the few well-known regions are places: never crossed with each other (no answers). */
const place = (kind: string) => kind === 'continent' || kind === 'region';
export type Category = { id: string; kind: CategoryKind; icon: string; label: Label };
export type CrossroadsGrid = { rows: Category[]; cols: Category[] };
/** Why a guess does not fit, for one short line under the grid (formatted on the device, in its language). */
export type Reason = { key: string; country: string; value?: number | string; other?: string; category?: string };

export const CROSSROADS_GUESSES = 12;
export const CROSSROADS_CELLS = 9;
export const CROSSROADS_POINTS_PER_CELL = 100;
export const CROSSROADS_FULL_BONUS = 100;
/** Every wrong guess (a known country that doesn't fit) costs this many points. */
export const CROSSROADS_WRONG_PENALTY = 25;
/** Fewer players than this for a square: "Early pick" instead of a percentage. */
export const CROSSROADS_MIN_PLAYERS = 20;
/** A pick that at most this share of the players made is a "rare pick". */
export const CROSSROADS_RARE = 5;
/** A grid only counts as fair when every square has at least this many answers. */
export const MIN_ANSWERS = 4;
/** No country may sit this close (3%) to a number line used that day: no discussion about "about 50 million". */
const MARGIN = 0.03;

export const COUNTRIES = data as CountryRow[];
const BY_ID = new Map(COUNTRIES.map(c => [c.id, c]));
const COAST = (metrics as any).records as Record<string, { coastline?: { value: number } }>;
const POPULATION = (worldbank as any).topics.population.values as Record<string, number>;
/** Landlocked: a coastline of 0 km in the Factbook archive (a country without a coastline record is not landlocked). */
export const isLandlocked = (c: CountryRow) => COAST[c.id]?.coastline?.value === 0;
export const population = (c: CountryRow): number | null => POPULATION[c.id] ?? null;
/** The capital names a player may know, per language (accents and case ignored). */
const capitalsIn = (c: CountryRow, locale: Locale) => c.capitals.map(n => locale === 'nl' ? dutchCapital(n) : locale === 'es' ? spanishCapital(n) : n);
const startsWith = (name: string, letter: string) => normalize(name).startsWith(letter.toLowerCase());
/** A capital fits a letter when its name starts with it in English, Dutch or Spanish (Warsaw, Warschau and Varsovia all
 *  count), so a player is never marked wrong for the name in their own language. */
const capitalFits = (c: CountryRow, letter: string) => (['en', 'nl', 'es'] as const).some(l => capitalsIn(c, l).some(n => startsWith(n, letter)));

const CONTINENTS: { id: string; icon: string; label: Label }[] = [
  { id: 'Europe', icon: '🏰', label: { en: 'In Europe', nl: 'In Europa', es: 'En Europa' } },
  { id: 'Africa', icon: '🦁', label: { en: 'In Africa', nl: 'In Afrika', es: 'En África' } },
  { id: 'Asia', icon: '🏯', label: { en: 'In Asia', nl: 'In Azië', es: 'En Asia' } },
  { id: 'North America', icon: '🌵', label: { en: 'In North America', nl: 'In Noord-Amerika', es: 'En América del Norte' } },
  { id: 'South America', icon: '🦜', label: { en: 'In South America', nl: 'In Zuid-Amerika', es: 'En América del Sur' } },
  { id: 'Oceania', icon: '🐨', label: { en: 'In Oceania', nl: 'In Oceanië', es: 'En Oceanía' } },
];
/** Four regions with clear, well-known borders (UN geoscheme `subregion` in our data). */
const REGIONS: { id: string; continent: string; icon: string; label: Label }[] = [
  { id: 'Caribbean', continent: 'North America', icon: '🏖️', label: { en: 'In the Caribbean', nl: 'In het Caribisch gebied', es: 'En el Caribe' } },
  { id: 'Central America', continent: 'North America', icon: '🌋', label: { en: 'In Central America', nl: 'In Midden-Amerika', es: 'En Centroamérica' } },
  { id: 'South-Eastern Asia', continent: 'Asia', icon: '🛕', label: { en: 'In Southeast Asia', nl: 'In Zuidoost-Azië', es: 'En el Sudeste Asiático' } },
  { id: 'Western Africa', continent: 'Africa', icon: '🥁', label: { en: 'In West Africa', nl: 'In West-Afrika', es: 'En África Occidental' } },
];
export const regionContinent = (id: string) => REGIONS.find(r => r.id === id)?.continent;
const n = (v: number, locale: Locale) => v.toLocaleString(locale === 'en' ? 'en-US' : locale === 'nl' ? 'nl-NL' : 'es-ES');
const POP_LINES = [5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 100, 150, 200];
const AREA_OVER = [100_000, 200_000, 250_000, 300_000, 500_000, 750_000, 1_000_000, 2_000_000];
const AREA_UNDER = [1_000, 10_000, 20_000, 30_000, 50_000, 100_000];
/** Neighbour categories: countries with at least five land neighbours. */
const HUBS = COUNTRIES.filter(c => c.borders.length >= 5).map(c => c.id);

/** Every category Roviko can use. Whether a number line is fair depends on the day's grid (see `tooClose`). */
export const CATEGORIES: Category[] = (() => {
  const out: Category[] = CONTINENTS.map(c => ({ id: 'continent:' + c.id, kind: 'continent' as const, icon: c.icon, label: c.label }));
  for (const r of REGIONS) out.push({ id: 'region:' + r.id, kind: 'region', icon: r.icon, label: r.label });
  // Official languages (`languages` in our data): only the big ones, so every square has room.
  for (const [lang, nl, es] of [['English', 'Engels', 'inglés'], ['French', 'Frans', 'francés'], ['Spanish', 'Spaans', 'español'], ['Arabic', 'Arabisch', 'árabe'], ['Portuguese', 'Portugees', 'portugués'], ['Russian', 'Russisch', 'ruso']])
    out.push({ id: 'language:' + lang, kind: 'language', icon: '💬', label: { en: 'Official language: ' + lang, nl: 'Officiële taal: ' + nl, es: 'Idioma oficial: ' + es } });
  out.push({ id: 'neighbours:1', kind: 'neighbours', icon: '🫂', label: { en: 'Borders just one country', nl: 'Grenst aan precies één land', es: 'Limita con un solo país' } });
  out.push({ id: 'neighbours:5', kind: 'neighbours', icon: '🧭', label: { en: 'Borders 5 or more countries', nl: 'Grenst aan 5 of meer landen', es: 'Limita con 5 o más países' } });
  out.push({ id: 'landlocked', kind: 'landlocked', icon: '🏔️', label: { en: 'Landlocked', nl: 'Geen zee', es: 'Sin salida al mar' } });
  out.push({ id: 'island', kind: 'island', icon: '🏝️', label: { en: 'No land borders', nl: 'Geen landgrenzen', es: 'Sin fronteras terrestres' } });
  for (const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
    if (COUNTRIES.filter(c => capitalFits(c, letter)).length < 6) continue;
    out.push({ id: 'capital:' + letter, kind: 'capital', icon: '🏛️', label: { en: 'Capital starts with ' + letter, nl: 'Hoofdstad begint met ' + letter, es: 'Capital empieza por ' + letter } });
  }
  for (const m of POP_LINES)
    out.push({ id: 'popOver:' + m, kind: 'popOver', icon: '👥', label: { en: `Over ${m} million people`, nl: `Meer dan ${m} miljoen inwoners`, es: `Más de ${m} millones de habitantes` } });
  for (const a of AREA_OVER)
    out.push({ id: 'areaOver:' + a, kind: 'areaOver', icon: '📐', label: { en: `Larger than ${n(a, 'en')} km²`, nl: `Groter dan ${n(a, 'nl')} km²`, es: `Más de ${n(a, 'es')} km²` } });
  for (const a of AREA_UNDER)
    out.push({ id: 'areaUnder:' + a, kind: 'areaUnder', icon: '🔎', label: { en: `Smaller than ${n(a, 'en')} km²`, nl: `Kleiner dan ${n(a, 'nl')} km²`, es: `Menos de ${n(a, 'es')} km²` } });
  for (const id of HUBS) { const c = BY_ID.get(id)!;
    out.push({ id: 'borders:' + id, kind: 'borders', icon: '🤝', label: { en: 'Borders ' + c.name, nl: 'Grenst aan ' + c.nl, es: 'Limita con ' + spanishCountry(c.name) } }); }
  return out;
})();
const CATEGORY = new Map(CATEGORIES.map(c => [c.id, c]));
export const categoryById = (id: string) => CATEGORY.get(id);

/** Whether a country fits one category. Unknown data never fits (a population line never claims Vatican City). */
export function fits(categoryId: string, country: CountryRow): boolean {
  const [kind, arg] = categoryId.split(':');
  switch (kind) {
    case 'continent': return country.region === arg;
    case 'region': return country.subregion === arg;
    case 'neighbours': return arg === '1' ? country.borders.length === 1 : country.borders.length >= Number(arg);
    case 'language': return country.languages.includes(arg);
    case 'landlocked': return isLandlocked(country);
    case 'island': return country.borders.length === 0;
    case 'capital': return capitalFits(country, arg);
    case 'popOver': { const p = population(country); return p !== null && p > Number(arg) * 1e6; }
    case 'areaOver': return country.area > Number(arg);
    case 'areaUnder': return country.area < Number(arg);
    case 'borders': return country.borders.includes(arg);
    default: return false;
  }
}
const FIT_SETS = new Map(CATEGORIES.map(cat => [cat.id, new Set(COUNTRIES.filter(c => fits(cat.id, c)).map(c => c.id))]));
export const answersFor = (row: string, col: string) => { const a = FIT_SETS.get(row), b = FIT_SETS.get(col);
  return a && b ? [...a].filter(id => b.has(id)) : COUNTRIES.filter(c => fits(row, c) && fits(col, c)).map(c => c.id); };

/** Nine different countries, one per square, when they exist (bipartite matching with augmenting paths). */
export function solveGrid(cells: string[][]): string[] | null {
  const owner = new Map<string, number>(), pick: string[] = Array(cells.length).fill('');
  const tryCell = (i: number, seen: Set<string>): boolean => {
    for (const id of cells[i]) {
      if (seen.has(id)) continue; seen.add(id);
      const other = owner.get(id);
      if (other === undefined || tryCell(other, seen)) { owner.set(id, i); pick[i] = id; return true; }
    }
    return false;
  };
  for (let i = 0; i < cells.length; i++) if (!tryCell(i, new Set())) return null;
  return pick;
}

/** The number behind a population or area line, or null for other categories. */
function lineOf(categoryId: string): { line: number; value: (c: CountryRow) => number | null } | null {
  const [kind, arg] = categoryId.split(':');
  if (kind === 'popOver') return { line: Number(arg) * 1e6, value: population };
  if (kind === 'areaOver' || kind === 'areaUnder') return { line: Number(arg), value: c => c.area };
  return null;
}
/**
 * No discussion about "about 50 million": a number line may not be used on a day when a country that fits a crossing
 * category sits within 3% of it (Spain, 49.4 million, keeps "Over 50 million" away from "In Europe", not from "In Africa").
 */
export function tooClose(grid: { rows: string[]; cols: string[] }): string[] {
  const out: string[] = [];
  for (const [axis, other] of [[grid.rows, grid.cols], [grid.cols, grid.rows]] as const)
    for (const id of axis) {
      const l = lineOf(id); if (!l) continue;
      for (const cross of other) for (const c of COUNTRIES) {
        const v = l.value(c);
        if (v !== null && fits(cross, c) && Math.abs(v - l.line) <= l.line * MARGIN) out.push(`${c.name} is within 3% of ${id} (crossing ${cross})`);
      }
    }
  return out;
}
/** Every rule a day's grid must meet; empty when it is fine. */
export function gridProblems(grid: { rows: string[]; cols: string[] }): string[] {
  const problems: string[] = [];
  const all = [...grid.rows, ...grid.cols];
  if (new Set(all).size !== 6) problems.push('a category appears twice');
  for (const id of all) if (!CATEGORY.has(id)) problems.push('unknown or unfair category ' + id);
  const kinds = (ids: string[]) => ids.map(id => place(id.split(':')[0]) ? 'place' : id.split(':')[0]);
  for (const axis of [grid.rows, grid.cols]) {
    const k = kinds(axis).filter(x => x !== 'place'); if (new Set(k).size !== k.length) problems.push('two categories of one kind on an axis');
    // A region next to its own continent on one axis would overlap (the Caribbean is in North America).
    for (const id of axis) if (id.startsWith('region:') && axis.includes('continent:' + regionContinent(id.slice(7)))) problems.push('a region next to its continent');
  }
  const rowKinds = new Set(kinds(grid.rows)); if (kinds(grid.cols).some(k => rowKinds.has(k))) problems.push('one kind on both axes');
  const cells = grid.rows.flatMap(r => grid.cols.map(c => answersFor(r, c)));
  cells.forEach((list, i) => { if (list.length < MIN_ANSWERS) problems.push(`square ${i + 1} has ${list.length} answers`); });
  if (!problems.length) for (const p of tooClose(grid)) problems.push(p);
  if (!problems.length && !solveGrid(cells)) problems.push('no full solution with nine different countries');
  return problems;
}

/** How a day mixes the categories: three, two, one or no continents on an axis, so not every day is "three continents". */
const SHAPES = [3, 2, 2, 1, 1, 0];
/** A tricky day (about one in four): fewer continents, more regions, and three to five squares with only 4 to 6 answers.
 *  Never unfair: every square keeps at least 4 answers and the whole grid stays solvable with nine different countries. */
const TRICKY_SHAPES = [1, 1, 0];
const TRICKY_SHARE = 0.25, TIGHT = 6, TIGHT_MIN = 3, TIGHT_MAX = 5;
export const isTrickyDay = (date: string) => random('roviko:crossroads:tricky:v1:' + date)() < TRICKY_SHARE;
/** How many squares of a grid have only a few answers (4 to 6). */
export const tightSquares = (g: { rows: string[]; cols: string[] }) => g.rows.flatMap(r => g.cols.map(c => answersFor(r, c).length)).filter(n => n <= TIGHT).length;
const KINDS: CategoryKind[] = ['landlocked', 'island', 'capital', 'popOver', 'areaOver', 'areaUnder', 'borders', 'neighbours', 'language'];
const setKey = (g: { rows: string[]; cols: string[] }) => [...g.rows, ...g.cols].sort().join('|');
const firstChoice = new Map<string, string>();
/** A day's first valid grid, before the check against earlier days (so no day depends on a long chain of days). */
function firstOf(date: string) {
  let key = firstChoice.get(date);
  if (key === undefined) { try { key = setKey(build(date, () => true)); } catch { key = ''; } if (firstChoice.size > 1000) firstChoice.clear(); firstChoice.set(date, key); }
  return key;
}
/** The grid of a UTC date: deterministic, so everyone gets the same one; tries seeds until every rule holds and the six
 *  categories differ from the first choice of each of the seven days before. */
export function crossroadsFor(date: string): { rows: string[]; cols: string[] } {
  const recent = new Set(Array.from({ length: 7 }, (_, i) => firstOf(new Date(Date.parse(date + 'T00:00:00Z') - (i + 1) * 86400000).toISOString().slice(0, 10))));
  return build(date, g => !recent.has(setKey(g)));
}
function build(date: string, fresh: (g: { rows: string[]; cols: string[] }) => boolean): { rows: string[]; cols: string[] } {
  const rng = random('roviko:crossroads:v1:' + date), tricky = isTrickyDay(date);
  const day = Math.floor(Date.parse(date + 'T00:00:00Z') / 86400000);
  const featured = KINDS[((day % KINDS.length) + KINDS.length) % KINDS.length];
  const pick = <T,>(list: T[]) => list[Math.floor(rng() * list.length)];
  const continents = CATEGORIES.filter(c => c.kind === 'continent'), regions = CATEGORIES.filter(c => c.kind === 'region');
  const ofKind = new Map(KINDS.map(k => [k, CATEGORIES.filter(c => c.kind === k)]));
  for (let attempt = 0; attempt < 3000; attempt++) {
    const shapes = tricky ? TRICKY_SHAPES : SHAPES, onRows = shapes[Math.floor(rng() * shapes.length)];
    const rows: Category[] = [], cols: Category[] = [], kinds = new Set<CategoryKind>();
    // Mostly continents; now and then one of the four well-known regions.
    while (rows.length < onRows) { const c = rng() < (tricky ? 0.5 : 0.2) ? pick(regions) : pick(continents);
      const clash = c.kind === 'region' && rows.some(r => r.id === 'continent:' + regionContinent(c.id.slice(7)) || r.kind === 'region');
      if (!rows.includes(c) && !clash) rows.push(c); }
    // Build greedily: a column only joins when it leaves every square with enough answers, so few tries are wasted.
    const enough = (a: Category, b: Category) => answersFor(a.id, b.id).length >= MIN_ANSWERS;
    // The day's featured kind goes in first (it rotates, so every kind gets its days); landlocked and "no land borders"
    // fit almost everywhere, so they only join now and then unless featured.
    // After many tries without luck the day goes on without a featured kind.
    if (attempt < 1500) { if (rows.length < 3) rows.push(pick(ofKind.get(featured)!)); else cols.push(pick(ofKind.get(featured)!)); kinds.add(featured); }
    for (const axis of [rows, cols]) {
      const other = axis === rows ? cols : rows;
      let guard = 0;
      while (axis.length < 3 && guard++ < 60) {
        const kind = pick(KINDS), list = ofKind.get(kind)!;
        if (kinds.has(kind) || !list.length) continue;
        if ((kind === 'landlocked' || kind === 'island') && rng() < 0.6) continue;
        const c = pick(list);
        if (!other.every(o => enough(o, c))) continue;
        kinds.add(kind); axis.push(c);
      }
    }
    if (rows.length < 3 || cols.length < 3) continue;
    const grid = rng() < 0.5 ? { rows: rows.map(c => c.id), cols: cols.map(c => c.id) } : { rows: cols.map(c => c.id), cols: rows.map(c => c.id) };
    // A tricky day only takes a grid with a few tight squares (after many tries it settles for an ordinary one).
    if (tricky && attempt < 2500) { const tight = tightSquares(grid); if (tight < TIGHT_MIN || tight > TIGHT_MAX) continue; }
    if (!gridProblems(grid).length && fresh(grid)) return grid;
  }
  throw new Error('NO_CROSSROADS_GRID ' + date);
}

export { namesOf, resolveCountry, countryName } from './country-names';

/** Whether a country fits a square, and if not, one short reason (or "doesn't fit" when nothing better is known). */
export function judge(grid: { rows: string[]; cols: string[] }, cell: number, countryId: string): { ok: boolean; reason?: Reason } {
  const country = BY_ID.get(countryId);
  if (!country) return { ok: false, reason: { key: 'xrUnknown', country: countryId } };
  const row = grid.rows[Math.floor(cell / 3)], col = grid.cols[cell % 3];
  const rowOk = fits(row, country), colOk = fits(col, country);
  if (rowOk && colOk) return { ok: true };
  const failing = !rowOk ? row : col;
  return { ok: false, reason: reasonFor(failing, country) ?? { key: 'xrNoFit', country: country.id, category: row, other: col } };
}
function reasonFor(categoryId: string, c: CountryRow): Reason | null {
  const [kind, arg] = categoryId.split(':');
  switch (kind) {
    case 'continent': return { key: 'xrContinent', country: c.id, value: c.region };
    case 'region': return { key: 'xrRegion', country: c.id, other: arg };
    case 'neighbours': return { key: 'xrNeighbours', country: c.id, value: c.borders.length };
    case 'language': return { key: 'xrLanguage', country: c.id, other: arg };
    case 'landlocked': return { key: 'xrCoast', country: c.id };
    case 'island': return c.borders[0] ? { key: 'xrHasBorder', country: c.id, other: c.borders[0] } : null;
    // Burundi moved its capital from Bujumbura to Gitega in 2019 (the owner's example; Gitega is in our data).
    case 'capital': return c.id === 'BDI' ? { key: 'xrBurundi', country: c.id } : { key: 'xrCapital', country: c.id, value: c.capitals[0] };
    case 'popOver': { const p = population(c); if (p === null) return null; const line = Number(arg) * 1e6;
      return { key: p >= line * 0.85 ? 'xrPopClose' : 'xrPop', country: c.id, value: Math.max(1, Math.round(p / 1e6)) }; }
    case 'areaOver': case 'areaUnder': return { key: 'xrArea', country: c.id, value: Math.round(c.area / 1000) * 1000 || c.area };
    case 'borders': return { key: 'xrNotBorder', country: c.id, other: arg };
    default: return null;
  }
}

/** Points: 100 per filled square, plus 100 for the full grid (1,000), minus 25 for every wrong guess (never below 0).
 *  Rarity never counts. */
export function crossroadsPoints(filled: number, wrong = 0) {
  const f = Math.max(0, Math.min(CROSSROADS_CELLS, Math.floor(filled)));
  return Math.max(0, f * CROSSROADS_POINTS_PER_CELL + (f === CROSSROADS_CELLS ? CROSSROADS_FULL_BONUS : 0) - Math.max(0, Math.floor(wrong)) * CROSSROADS_WRONG_PENALTY);
}
/** "31%" for a square, or null ("Early pick") while fewer than 20 players filled it. */
export function pickShare(picks: number, players: number) {
  return players >= CROSSROADS_MIN_PLAYERS && players > 0 ? Math.max(1, Math.round(picks / players * 100)) : null;
}
export const isRare = (share: number | null) => share !== null && share <= CROSSROADS_RARE;
