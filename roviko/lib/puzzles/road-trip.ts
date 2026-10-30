// Daily Road Trip (1.56): drive over land from a start to a finish country, one neighbour at a time. Everyone gets the same
// trip per UTC date (same seed logic as the other daily games). Data Roviko already ships:
// - the neighbour graph: `borders` in lib/data/countries.json (the same data as Next Door), only land borders, so overseas
//   territories never count (France does not border Brazil), plus two fixed links (LINKS below);
// - a box and a middle point per country (lib/data/road-boxes.json, derived from the Next Door boundaries file) to frame
//   the trip and to choose the trap;
// - the short facts after each step: UNESCO heritage clues (lib/data/mosaic-facts.json), the highest point
//   (Factbook, lib/data/country-metrics.json), railways (Factbook, lib/data/fun-metrics.json), population (World Bank) and
//   the capital.
import data from '../data/countries.json';
import boxes from '../data/road-boxes.json';
import heritage from '../data/mosaic-facts.json';
import metrics from '../data/country-metrics.json';
import fun from '../data/fun-metrics.json';
import worldbank from '../data/comparisons.json';
import { spanishCapital } from '../../i18n/content';
import { dutchCapital } from '../../i18n/capitals-nl';
import { random, seedHash, shuffle } from '../game-engine/scoring';

type Locale = 'en' | 'nl' | 'es';
export type Text = Record<Locale, string>;
type CountryRow = { id: string; name: string; nl: string; capitals: string[]; region: string; subregion: string; borders: string[]; area: number };
type Box = [number, number, number, number];
export type RoadTrip = { start: string; finish: string; shortest: number };

export const COUNTRIES = data as CountryRow[];
const BY_ID = new Map(COUNTRIES.map(c => [c.id, c]));
const BOXES = (boxes as any).countries as Record<string, { box: Box; c: [number, number] }>;
/** Land links that are not a land border in the data but that you can drive: Channel Tunnel and Øresund Bridge. */
export const LINKS: [string, string][] = [['GBR', 'FRA'], ['DNK', 'SWE']];
/** No country this big may sit on a shortest route: it would give the route away (Brazil in South America). */
export const MAX_AREA = 3_000_000;
/** Shortest route (countries in between) by weekday: Monday to Wednesday 3, Thursday to Saturday 4, Sunday 5. */
export const lengthFor = (date: string) => [5, 3, 3, 3, 4, 4, 4][new Date(date + 'T00:00:00Z').getUTCDay()];
/** No start/finish pair comes back within this many days. */
export const REPEAT_DAYS = 60;
/** The day the region rotation counts from (any fixed past date; never change it). */
const EPOCH = '2026-10-01';
/** After this many steps the car drives the rest of the shortest way by itself, so a trip always ends. */
export const ROAD_TRIP_MAX_STEPS = 40;

export const NEIGHBOURS = new Map<string, Set<string>>(COUNTRIES.map(c => [c.id, new Set<string>()]));
for (const c of COUNTRIES) for (const n of c.borders) if (BY_ID.has(n)) { NEIGHBOURS.get(c.id)!.add(n); NEIGHBOURS.get(n)!.add(c.id); }
for (const [a, b] of LINKS) { NEIGHBOURS.get(a)!.add(b); NEIGHBOURS.get(b)!.add(a); }
export const neighboursOf = (id: string) => [...(NEIGHBOURS.get(id) ?? [])].sort();

const distCache = new Map<string, Map<string, number>>();
/** Steps over land from every country to `to` (breadth-first). Countries on another landmass are missing. */
export function distancesTo(to: string): Map<string, number> {
  let d = distCache.get(to);
  if (d) return d;
  d = new Map([[to, 0]]);
  const queue = [to];
  for (let i = 0; i < queue.length; i++) for (const n of NEIGHBOURS.get(queue[i]) ?? []) if (!d.has(n)) { d.set(n, d.get(queue[i])! + 1); queue.push(n); }
  distCache.set(to, d);
  return d;
}
/** Every country on at least one shortest route, start and finish included. */
export function onShortestRoutes(start: string, finish: string): string[] {
  const a = distancesTo(start), b = distancesTo(finish), total = b.get(start);
  if (total === undefined) return [];
  return COUNTRIES.map(c => c.id).filter(id => a.get(id) !== undefined && a.get(id)! + (b.get(id) ?? Infinity) === total);
}
/** One shortest route, start to finish (the first neighbour in alphabetical order at every fork). */
export function shortestRoute(start: string, finish: string): string[] {
  const d = distancesTo(finish);
  if (d.get(start) === undefined) return [];
  const route = [start];
  while (route.at(-1) !== finish) route.push(neighboursOf(route.at(-1)!).find(n => d.get(n) === d.get(route.at(-1)!)! - 1)!);
  return route;
}
/** Great-circle angle between two countries' middle points. */
function apart(a: string, b: string) {
  const [x1, y1] = BOXES[a].c, [x2, y2] = BOXES[b].c, r = Math.PI / 180;
  return Math.acos(Math.max(-1, Math.min(1, Math.sin(y1 * r) * Math.sin(y2 * r) + Math.cos(y1 * r) * Math.cos(y2 * r) * Math.cos((x2 - x1) * r))));
}
const regionOf = (id: string) => { const r = BY_ID.get(id)?.region ?? ''; return r === 'North America' || r === 'South America' ? 'Americas' : r; };

/** Why a pair is not a fair trip (empty: it is). Used by the generator and by the tests. */
export function tripProblems(start: string, finish: string, length?: number): string[] {
  const problems: string[] = [], d = distancesTo(finish), total = d.get(start);
  if (total === undefined) return ['not on the same landmass'];
  if (length !== undefined && total - 1 !== length) problems.push(`shortest route has ${total - 1} countries in between, not ${length}`);
  if (total - 1 < 3 || total - 1 > 5) problems.push('shortest route must have 3 to 5 countries in between');
  const on = onShortestRoutes(start, finish);
  for (const id of on) if (BY_ID.get(id)!.area > MAX_AREA) problems.push(id + ' (over 3 million km²) is on a shortest route');
  // A real choice at every step: each country you drive on from (one that does not border the finish yet) has a detour.
  for (const id of on) if (d.get(id)! >= 2 && !neighboursOf(id).some(n => d.get(n)! >= d.get(id)!)) problems.push(id + ' has no detour');
  return problems;
}
/** A trap: at some step on a shortest route, the neighbour that lies most towards the finish is a detour. */
export function hasTrap(start: string, finish: string) {
  const d = distancesTo(finish);
  return onShortestRoutes(start, finish).some(id => {
    if (d.get(id)! < 2) return false;
    const towards = neighboursOf(id).sort((a, b) => apart(a, finish) - apart(b, finish))[0];
    return d.get(towards)! >= d.get(id)!;
  });
}

/** The regions take turns, day by day; Africa and Europe (most roads) twice in a cycle. */
const REGIONS = ['Africa', 'Europe', 'Asia', 'Africa', 'Europe', 'Americas'];
/** When a region has no fair trip of the day's length left, the richest regions help out first. */
const FALLBACK = ['Africa', 'Europe', 'Asia', 'Americas'];
/** The naive drive: always the unvisited neighbour that lies most towards the finish (as the crow flies). How many detours
 *  that costs, or Infinity when it never gets there. A trip is interesting when this drive goes wrong 1 to 4 times:
 *  heading straight for the finish is not enough (Honduras → Peru was a single corridor), but it is never a maze. */
export function greedyDetours(start: string, finish: string) {
  const d = distancesTo(finish), seen = new Set([start]);
  let here = start, detours = 0;
  for (let step = 0; d.get(here)! > 1; step++) {
    if (step > 25) return Infinity;
    const fresh = neighboursOf(here).filter(n => !seen.has(n)), pool = fresh.length ? fresh : neighboursOf(here);
    const next = pool.sort((a, b) => apart(a, finish) - apart(b, finish) || a.localeCompare(b))[0];
    if (d.get(next)! >= d.get(here)!) detours++;
    seen.add(next); here = next;
  }
  return detours;
}
export const GREEDY_MIN = 1, GREEDY_MAX = 4;
export const isInteresting = (start: string, finish: string) => { const g = greedyDetours(start, finish); return g >= GREEDY_MIN && g <= GREEDY_MAX; };
/** A region needs at least this many interesting trips of a length to take its turn; otherwise another region helps out. */
const MIN_BUCKET = 6;
let buckets: Map<string, [string, string][]> | null = null;
/** Every fair and interesting trip, per region and length, in its direction (Ghana → Kenya and Kenya → Ghana are separate). */
function allBuckets() {
  if (buckets) return buckets;
  const found = new Map<string, [string, string][]>();
  const ids = COUNTRIES.map(c => c.id).sort();
  for (const a of ids) for (const b of ids) {
    if (a === b || regionOf(a) !== regionOf(b)) continue;
    const total = distancesTo(b).get(a);
    if (total === undefined || total - 1 < 3 || total - 1 > 5 || tripProblems(a, b).length || !isInteresting(a, b)) continue;
    const key = regionOf(a) + ':' + (total - 1);
    if (!found.has(key)) found.set(key, []);
    found.get(key)!.push([a, b]);
  }
  buckets = new Map();
  for (const [key, list] of found) if (list.length >= MIN_BUCKET) buckets.set(key, shuffle(list, random('roviko:road-trip:bucket:v4:' + key)));
  return buckets;
}

const dayNumber = (date: string) => Math.floor(Date.parse(date + 'T00:00:00Z') / 86400000);
const dateOf = (day: number) => new Date(day * 86400000).toISOString().slice(0, 10);
/** Trips from EPOCH on, one per day, worked out in order: the regions take turns, each region and length walks through its
 *  own list, and a pair used in the last 60 days is skipped. Kept in memory, so a date only costs the days not seen yet. */
const plan: { pair: [string, string]; region: string }[] = [];
const counters = new Map<string, number>(), lastUsed = new Map<string, number>();
function planUntil(day: number) {
  const first = dayNumber(EPOCH), all = allBuckets();
  while (first + plan.length <= day) {
    const today = first + plan.length, length = lengthFor(dateOf(today));
    let chosen: { pair: [string, string]; region: string } | null = null;
    const turn = REGIONS[plan.length % REGIONS.length], order = [turn, ...FALLBACK.filter(r => r !== turn)];
    for (const region of order) {
      if (chosen) break;
      const key = region + ':' + length, list = all.get(key) ?? [];
      const at = counters.get(key) ?? 0;
      for (let i = 0; i < list.length; i++) {
        const pair = list[(at + i) % list.length], used = lastUsed.get([...pair].sort().join('|'));
        if (used !== undefined && today - used < REPEAT_DAYS) continue;
        chosen = { pair, region }; counters.set(key, (at + i + 1) % list.length); break;
      }
    }
    if (!chosen) throw new Error('NO_ROAD_TRIP ' + dateOf(today));
    lastUsed.set([...chosen.pair].sort().join('|'), today);
    plan.push(chosen);
  }
}
/** The trip of a UTC date: start, finish and the length of the shortest route (countries in between). */
export function roadTripFor(date: string): RoadTrip {
  const day = dayNumber(date), first = dayNumber(EPOCH);
  if (!Number.isFinite(day)) throw new Error('BAD_DATE');
  // Before EPOCH (only tests and odd clocks): the same plan, shifted by whole 42-day blocks so weekday and region match.
  const index = day >= first ? day : first + (((day - first) % 42) + 42) % 42;
  planUntil(index);
  const [start, finish] = plan[index - first].pair;
  return { start, finish, shortest: distancesTo(finish).get(start)! - 1 };
}
export const regionOfTrip = (date: string) => { const day = dayNumber(date); planUntil(Math.max(day, dayNumber(EPOCH))); return plan[Math.max(0, day - dayNumber(EPOCH))]?.region ?? ''; };

/** The part of the world to show: start, finish and every country on a shortest route, plus a margin. Never the route itself. */
export function frameOf(start: string, finish: string): Box {
  let box: Box | null = null;
  for (const id of onShortestRoutes(start, finish)) { const b = BOXES[id]?.box; if (b) box = box ? [Math.min(box[0], b[0]), Math.min(box[1], b[1]), Math.max(box[2], b[2]), Math.max(box[3], b[3])] : [...b] as Box; }
  if (!box) return [-20, -40, 60, 70];
  const mx = Math.max(3, (box[2] - box[0]) * .18), my = Math.max(3, (box[3] - box[1]) * .18);
  return [box[0] - mx, box[1] - my, box[2] + mx, box[3] + my].map(v => Math.round(v * 100) / 100) as Box;
}
/** The middle point of a country (for the dotted route line). */
export const middleOf = (id: string) => BOXES[id]?.c ?? null;

// The fact after each step. Heritage first (the richest), otherwise a fact that rotates by date.
const HERITAGE = new Map<string, Text>(((heritage as any).facts as { countryId: string; clues: Text[] }[]).filter(f => f.clues?.[0]).map(f => [f.countryId, f.clues[0]]));
const ARCHIVE = (metrics as any).records as Record<string, { highest?: { value: number; place?: string } }>;
const FUN = (fun as any).records as Record<string, { railways?: { value: number } }>;
const POPULATION = (worldbank as any).topics.population.values as Record<string, number>;
const fmt = (n: number, locale: string) => n.toLocaleString(locale, { maximumFractionDigits: 1 });
const round2 = (n: number) => { const p = Math.pow(10, Math.max(0, Math.floor(Math.log10(n)) - 1)); return Math.round(n / p) * p; };
export function factFor(id: string, date: string): Text | null {
  const c = BY_ID.get(id);
  if (!c) return null;
  const options: Text[] = [];
  const heritageFact = HERITAGE.get(id);
  if (heritageFact) return heritageFact;
  const high = ARCHIVE[id]?.highest;
  if (high?.value && high.place) { const m = Math.round(high.value).toLocaleString('en'), mn = Math.round(high.value).toLocaleString('nl-NL'), ms = Math.round(high.value).toLocaleString('es-ES');
    options.push({ en: 'Highest point: ' + high.place + ', ' + m + ' m.', nl: 'Hoogste punt: ' + high.place + ', ' + mn + ' m.', es: 'Punto más alto: ' + high.place + ', ' + ms + ' m.' }); }
  const rail = FUN[id]?.railways?.value;
  if (rail && rail >= 100) { const v = round2(rail); options.push({ en: 'About ' + fmt(v, 'en') + ' km of railway.', nl: 'Zo’n ' + fmt(v, 'nl-NL') + ' km spoorlijn.', es: 'Unos ' + fmt(v, 'es-ES') + ' km de vías de tren.' }); }
  const pop = POPULATION[id];
  if (pop && pop >= 1e6) { const v = round2(pop) / 1e6; options.push({ en: 'About ' + fmt(v, 'en') + ' million people live here.', nl: 'Er wonen zo’n ' + fmt(v, 'nl-NL') + ' miljoen mensen.', es: 'Aquí viven unos ' + fmt(v, 'es-ES') + ' millones de personas.' }); }
  const cap = c.capitals[0];
  if (cap) options.push({ en: 'Capital: ' + cap + '.', nl: 'Hoofdstad: ' + dutchCapital(cap) + '.', es: 'Capital: ' + spanishCapital(cap) + '.' });
  return options.length ? options[seedHash(date + ':' + id) % options.length] : null;
}
