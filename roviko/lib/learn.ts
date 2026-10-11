/**
 * Learn (1.38): short lessons that teach flags, capitals and where countries lie, continent by continent, and
 * bring back what you got wrong. Pure logic only (no React, no fetch), so the same rules run in the app, on the
 * server merge and in tests.
 *
 * A route is one topic on one continent (flags of Africa, capitals of Asia …): lessons of four to six countries,
 * a midway test after every three lessons (all of them mixed) and the border check at the end.
 *
 * Progress is one flat map of cards, each with its own timestamp `t`. Two copies (this phone, the account on
 * the server, another device) merge per card: the newest `t` wins. That keeps syncing simple and safe.
 *  - `item:flags:NLD`           a country in a topic: lvl 0 (seen, not known yet) … 3 (gold), due day, last day
 *  - `lesson:flags-europe-1`    a finished lesson (day) or a passed midway test `lesson:flags-europe-x1` (day)
 *  - `boss:flags-europe`        the border check of a route: day passed, best score
 */
export type Card = { t: number; lvl?: number; due?: string; last?: string; day?: string; best?: number; of?: number };
export type Progress = Record<string, Card>;
export type Topic = 'flags' | 'capitals' | 'map';
export type Lesson = { id: string; key: string; countries: string[] };
export type Step = { kind: 'lesson'; id: string; key: string; countries: string[]; n: number } | { kind: 'exam'; id: string; countries: string[]; n: number; from: number; to: number };
export type Route = { id: string; topic: Topic; continent: string; region: string; lessons: Lesson[]; steps: Step[] };

export const TOPICS: Topic[] = ['flags', 'capitals', 'map'];
export const CONTINENTS = [
  { id: 'europe', region: 'Europe' }, { id: 'africa', region: 'Africa' }, { id: 'asia', region: 'Asia' },
  { id: 'north-america', region: 'North America' }, { id: 'south-america', region: 'South America' }, { id: 'oceania', region: 'Oceania' },
];

/** Days between reviews once a country reaches bronze (1), silver (2) and gold (3). */
export const INTERVALS = [0, 1, 3, 7];
/** After gold, a country still comes back now and then. */
export const GOLD_AGAIN = 14;
export const REVIEW_SIZE = 12;
export const EXAM_SIZE = 12;
export const BOSS_SIZE = 15;
/** A midway test after every this many lessons (not after the last lesson: the border check follows there). */
export const EXAM_EVERY = 3;
export const MAX_CARDS = 2000;
/** Tests and the border check need 80% right. */
export const passMark = (n: number) => Math.ceil(n * .8);

/**
 * The lessons per continent, the same for every topic: well-known countries first, neighbours together, and
 * (for Europe) flags that look alike close to each other. Every country of the continent exactly once.
 */
const GROUPS: Record<string, [string, string[]][]> = {
  europe: [
    ['west', ['NLD', 'BEL', 'DEU', 'FRA', 'GBR', 'IRL']], ['med', ['ESP', 'PRT', 'ITA', 'GRC', 'MLT']], ['north', ['SWE', 'NOR', 'DNK', 'FIN', 'ISL']],
    ['middle', ['CHE', 'AUT', 'CZE', 'SVK', 'HUN']], ['small', ['LUX', 'MCO', 'LIE', 'AND', 'SMR', 'VAT']], ['east', ['UKR', 'RUS', 'ROU', 'BLR', 'MDA']],
    ['baltic', ['POL', 'LTU', 'LVA', 'EST']], ['balkan', ['HRV', 'SVN', 'SRB', 'BIH', 'MNE']], ['southeast', ['ALB', 'MKD', 'BGR', 'CYP']],
  ],
  africa: [
    ['afNorth', ['EGY', 'MAR', 'DZA', 'TUN', 'LBY']], ['afKnown', ['ZAF', 'KEN', 'NGA', 'GHA', 'ETH']], ['afNile', ['SDN', 'SSD', 'ERI', 'DJI', 'SOM']],
    ['afEast', ['TZA', 'UGA', 'RWA', 'BDI']], ['afSouth', ['NAM', 'BWA', 'ZWE', 'LSO', 'SWZ']], ['afSoutheast', ['ZMB', 'MWI', 'MOZ', 'MDG']],
    ['afHeart', ['COD', 'COG', 'CAF', 'TCD']], ['afCoast', ['CMR', 'GAB', 'GNQ', 'AGO']], ['afSahel', ['MLI', 'NER', 'MRT', 'BFA']],
    ['afWest', ['SEN', 'GMB', 'GNB', 'GIN', 'SLE']], ['afGuinea', ['LBR', 'CIV', 'TGO', 'BEN']], ['afIslands', ['MUS', 'COM', 'SYC', 'CPV', 'STP']],
  ],
  asia: [
    ['asEast', ['CHN', 'JPN', 'KOR', 'PRK', 'MNG']], ['asSouth', ['IND', 'PAK', 'BGD', 'NPL', 'BTN']], ['asSea', ['THA', 'VNM', 'IDN', 'PHL']],
    ['asMekong', ['KHM', 'LAO', 'MMR', 'MYS']], ['asIslands', ['SGP', 'BRN', 'TLS', 'LKA', 'MDV']], ['asMideast', ['SAU', 'IRN', 'IRQ', 'ISR']],
    ['asLevant', ['SYR', 'JOR', 'LBN', 'PSE']], ['asGulf', ['ARE', 'QAT', 'KWT', 'BHR', 'OMN', 'YEM']], ['asCaucasus', ['TUR', 'GEO', 'ARM', 'AZE']],
    ['asCentral', ['KAZ', 'UZB', 'TKM', 'KGZ', 'TJK', 'AFG']],
  ],
  'north-america': [
    ['naBig', ['USA', 'CAN', 'MEX', 'CUB', 'JAM']], ['naCentral', ['GTM', 'BLZ', 'HND', 'SLV', 'NIC']], ['naIsthmus', ['CRI', 'PAN', 'DOM', 'HTI', 'BHS']],
    ['naCarib', ['TTO', 'BRB', 'GRD', 'LCA']], ['naAntilles', ['DMA', 'ATG', 'VCT', 'KNA']],
  ],
  'south-america': [
    ['saBig', ['BRA', 'ARG', 'CHL', 'PER']], ['saAndes', ['COL', 'ECU', 'BOL', 'VEN']], ['saEast', ['PRY', 'URY', 'GUY', 'SUR']],
  ],
  oceania: [
    ['ocBig', ['AUS', 'NZL', 'PNG', 'FJI']], ['ocIslands', ['SLB', 'VUT', 'WSM', 'TON', 'TUV']], ['ocMicro', ['KIR', 'FSM', 'PLW', 'MHL', 'NRU']],
  ],
};

function makeRoute(topic: Topic, continent: { id: string; region: string }): Route {
  const id = topic + '-' + continent.id;
  const lessons = GROUPS[continent.id].map(([key, countries], i) => ({ id: id + '-' + (i + 1), key, countries }));
  const steps: Step[] = [];
  lessons.forEach((l, i) => {
    steps.push({ kind: 'lesson', id: l.id, key: l.key, countries: l.countries, n: i + 1 });
    if ((i + 1) % EXAM_EVERY === 0 && i < lessons.length - 1) {
      const from = i + 2 - EXAM_EVERY, k = (i + 1) / EXAM_EVERY;
      steps.push({ kind: 'exam', id: id + '-x' + k, countries: lessons.slice(i + 1 - EXAM_EVERY, i + 1).flatMap(x => x.countries), n: k, from, to: i + 1 });
    }
  });
  return { id, topic, continent: continent.id, region: continent.region, lessons, steps };
}
export const ROUTES: Route[] = TOPICS.flatMap(topic => CONTINENTS.map(c => makeRoute(topic, c)));

/**
 * Flags that are easy to mix up. Used as wrong options in flag tests and as a "looks like" note when you first
 * meet a flag. Only visual likeness; no facts are claimed. Look-alikes on another continent are simply not used.
 */
export const LOOKALIKES: Record<string, string[]> = {
  NLD: ['LUX', 'FRA', 'RUS'], LUX: ['NLD'], FRA: ['NLD', 'RUS'], BEL: ['DEU', 'ROU'], DEU: ['BEL', 'LTU'],
  IRL: ['ITA'], ITA: ['IRL', 'HUN'], HUN: ['ITA', 'BGR'], BGR: ['HUN', 'LTU'], LTU: ['BGR', 'DEU'],
  ROU: ['MDA', 'AND', 'BEL'], MDA: ['ROU', 'AND'], AND: ['MDA', 'ROU'],
  NOR: ['ISL', 'DNK', 'FIN'], ISL: ['NOR', 'FIN'], DNK: ['NOR', 'SWE', 'CHE'], SWE: ['FIN', 'DNK'], FIN: ['SWE', 'ISL'],
  RUS: ['SVK', 'SVN', 'SRB', 'NLD'], SVK: ['SVN', 'RUS'], SVN: ['SVK', 'RUS', 'HRV'], SRB: ['RUS', 'MNE'], HRV: ['SVN', 'SRB'],
  MCO: ['POL', 'MLT'], POL: ['MCO', 'MLT'], MLT: ['POL', 'MCO'], AUT: ['LVA'], LVA: ['AUT'], CHE: ['DNK'],
  EST: ['UKR'], UKR: ['EST'], ALB: ['MNE'], MNE: ['ALB'], MKD: ['ESP'], ESP: ['MKD', 'PRT'], PRT: ['ESP'],
  CZE: ['SVK'], BIH: ['UKR'], SMR: ['VAT'], VAT: ['SMR'], LIE: ['AND'], GRC: ['CYP'], CYP: ['GRC'], BLR: ['LVA'], GBR: ['ISL'],
  // Africa
  MLI: ['GIN', 'SEN', 'CMR'], GIN: ['MLI', 'CMR'], SEN: ['MLI', 'CMR'], CMR: ['SEN', 'MLI'], CIV: ['NER'], NER: ['CIV'],
  GHA: ['BFA', 'TGO'], BFA: ['GHA', 'TGO'], TGO: ['BEN', 'GHA'], BEN: ['TGO', 'GNB'], GNB: ['BEN', 'TGO'], ETH: ['GHA'],
  SDN: ['EGY', 'LBY'], EGY: ['SDN'], LBY: ['SDN'], DZA: ['MAR'], MAR: ['DZA'], TUN: ['MAR'], COG: ['GAB'], GAB: ['COG', 'SLE'], SLE: ['GAB'],
  SOM: ['DJI'], DJI: ['SOM', 'ERI'], ERI: ['DJI'], KEN: ['MWI', 'SSD'], MWI: ['KEN'], SSD: ['KEN'], NAM: ['ZAF'], ZAF: ['NAM'],
  ZMB: ['ZWE'], ZWE: ['ZMB'], RWA: ['BDI'], BDI: ['RWA'], LBR: ['SLE'], COD: ['COG'], TCD: ['CAF'], CAF: ['TCD'],
  // Asia
  IDN: ['SGP'], SGP: ['IDN'], IRQ: ['SYR', 'YEM'], SYR: ['IRQ', 'YEM'], YEM: ['SYR', 'IRQ'], JOR: ['PSE'], PSE: ['JOR'],
  ARE: ['KWT', 'JOR'], KWT: ['ARE', 'PSE'], QAT: ['BHR'], BHR: ['QAT'], CHN: ['VNM'], VNM: ['CHN'], JPN: ['BGD', 'KOR'], BGD: ['JPN'],
  KOR: ['JPN'], PRK: ['KOR'], THA: ['KHM', 'LAO'], KHM: ['THA', 'LAO'], LAO: ['THA', 'KHM'], MYS: ['LBR'], IND: ['NER', 'IRN'], IRN: ['IND', 'TJK'],
  TJK: ['IRN'], PAK: ['TKM'], TKM: ['PAK', 'UZB'], UZB: ['TKM'], KAZ: ['KGZ'], KGZ: ['KAZ'], TUR: ['AZE'], AZE: ['TUR'],
  // Americas and Oceania
  USA: ['LBR', 'CUB'], CUB: ['USA'], HND: ['NIC', 'SLV', 'GTM'], NIC: ['HND', 'SLV'], SLV: ['NIC', 'HND'], GTM: ['HND'],
  DOM: ['HTI', 'PAN'], HTI: ['DOM'], PAN: ['DOM'], COL: ['ECU', 'VEN'], ECU: ['COL', 'VEN'], VEN: ['COL', 'ECU'], ARG: ['URY'], URY: ['ARG'],
  BOL: ['GHA'], CHL: ['TTO'], AUS: ['NZL'], NZL: ['AUS'], TUV: ['FJI'], FJI: ['TUV'], WSM: ['TON'], TON: ['WSM'],
};

export const routeOf = (id: string) => ROUTES.find(r => r.id === id) ?? null;
export const routeFor = (topic: string, continent: string) => ROUTES.find(r => r.topic === topic && r.continent === continent) ?? ROUTES[0];
export const stepOf = (id: string) => { for (const r of ROUTES) { const i = r.steps.findIndex(x => x.id === id); if (i >= 0) return { route: r, step: r.steps[i], index: i }; } return null; };
export const routeCountries = (r: Route) => r.lessons.flatMap(l => l.countries);
export const itemKey = (topic: string, id: string) => `item:${topic}:${id}`;

/** The player's own calendar day (learning is personal, so local time, not the UTC game day). */
export function localDay(now = new Date()) { return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`; }
export function addDays(day: string, n: number) { const d = new Date(day + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }

/** Two copies of the progress become one: per card the newest wins. Unknown or broken cards are dropped. */
export function mergeProgress(a: Progress | null | undefined, b: Progress | null | undefined): Progress {
  const out: Progress = {};
  for (const src of [a, b]) for (const [k, v] of Object.entries(src ?? {})) {
    if (!validCard(k, v)) continue;
    if (!out[k] || v.t > out[k].t) out[k] = v;
  }
  return out;
}
const DAY = /^\d{4}-\d{2}-\d{2}$/;
export function validCard(k: string, v: any): v is Card {
  if (!/^(item|lesson|boss):[a-z0-9:-]{1,40}$/i.test(k) || !v || typeof v !== 'object' || !Number.isFinite(v.t)) return false;
  for (const f of ['due', 'last', 'day']) if (v[f] !== undefined && !(typeof v[f] === 'string' && DAY.test(v[f]))) return false;
  if (v.lvl !== undefined && !(Number.isInteger(v.lvl) && v.lvl >= 0 && v.lvl <= 3)) return false;
  for (const f of ['best', 'of']) if (v[f] !== undefined && !(Number.isInteger(v[f]) && v[f] >= 0 && v[f] <= 100)) return false;
  return true;
}

/** Where the player stands on a route: steps done, which step is next, what is due and the medal counts. */
export function routeState(route: Route, p: Progress, today: string) {
  const done = route.steps.map(s => !!p['lesson:' + s.id]?.day);
  const next = done.indexOf(false);
  const countries = routeCountries(route);
  const card = (id: string) => p[itemKey(route.topic, id)];
  const due = countries.filter(id => { const c = card(id); return c && c.due && c.due <= today; })
    .sort((x, y) => (card(x).due! < card(y).due! ? -1 : card(x).due! > card(y).due! ? 1 : 0) || (card(x).lvl ?? 0) - (card(y).lvl ?? 0));
  const medals = { bronze: 0, silver: 0, gold: 0 };
  for (const id of countries) { const l = card(id)?.lvl ?? 0; if (l === 1) medals.bronze++; else if (l === 2) medals.silver++; else if (l >= 3) medals.gold++; }
  const learned = medals.bronze + medals.silver + medals.gold;
  return { done, next: next === -1 ? route.steps.length : next, due, medals, learned, total: countries.length, boss: p['boss:' + route.id] ?? null, bossOpen: next === -1 };
}
/** Everything due on every route (the home page counter). */
export function dueEverywhere(p: Progress, today: string) { return ROUTES.reduce((n, r) => n + routeState(r, p, today).due.length, 0); }

/**
 * One answer changes one country. `fresh` is a first test in a lesson; otherwise it is a review, a midway test
 * or the border check. Only the first answer per country in a session counts (the caller passes that one).
 *  - lesson test: right → at least bronze, back tomorrow; wrong → no medal change, back today in the review pile
 *  - otherwise: right on a new day → one medal up, back after a longer break; right again the same day → no change;
 *    wrong → one medal down (bronze stays bronze), back tomorrow
 */
export function applyAnswer(card: Card | undefined, right: boolean, today: string, now: number, fresh: boolean): Card {
  const lvl = card?.lvl ?? 0;
  if (fresh) return right ? { t: now, lvl: Math.max(1, lvl), last: today, due: addDays(today, INTERVALS[Math.max(1, lvl)]) } : { t: now, lvl, last: today, due: today };
  if (!right) return { t: now, lvl: lvl >= 2 ? lvl - 1 : lvl, last: today, due: addDays(today, 1) };
  if (card?.last === today) return { ...card, t: now, lvl: Math.max(1, lvl), due: card.due && card.due > today ? card.due : addDays(today, 1) };
  const up = Math.min(3, Math.max(1, lvl + 1));
  return { t: now, lvl: up, last: today, due: addDays(today, lvl >= 3 ? GOLD_AGAIN : INTERVALS[up]) };
}

/**
 * A question. `toName`: the prompt is the thing (a flag, a capital, a spot on the map) and you pick the country.
 * `fromName`: the prompt is the country and you pick its flag, capital or spot.
 */
export type Question = { kind: 'toName' | 'fromName'; id: string; options: string[] };
export type Similar = (id: string) => string[];

/** A small seeded random, so a session can be rebuilt and tests are repeatable. */
export function rng(seed: number) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; }; }
export function shuffle<T>(list: T[], rand: () => number) { const a = [...list]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const flagLike: Similar = id => LOOKALIKES[id] ?? [];

/** Wrong options: similar ones first (look-alike flags, nearby countries), then others from the pool; `n` distinct. */
export function optionsFor(id: string, pool: string[], n: number, rand: () => number, similar: Similar | null = flagLike) {
  const picks: string[] = [];
  // Look-alike flags: at most half, so a test is never only look-alikes. Nearby countries: all but one.
  const most = similar === flagLike ? Math.ceil((n - 1) / 2) : Math.max(1, n - 2);
  if (similar) for (const x of shuffle(similar(id), rand)) if (x !== id && pool.includes(x) && !picks.includes(x) && picks.length < most) picks.push(x);
  for (const x of shuffle(pool, rand)) { if (picks.length >= n - 1) break; if (x !== id && !picks.includes(x)) picks.push(x); }
  return shuffle([id, ...picks], rand);
}

/** Practice: every country once, the two directions taking turns, with options from the lesson only. */
export function practiceQuestions(lesson: { countries: string[] }, rand: () => number): Question[] {
  const n = Math.min(4, lesson.countries.length);
  return shuffle(lesson.countries, rand).map((id, i) => ({ kind: i % 2 ? 'fromName' as const : 'toName' as const, id, options: optionsFor(id, lesson.countries, n, rand, null) }));
}

/** Tests: each country once, four options with similar ones from the whole route. */
export function testQuestions(ids: string[], pool: string[], rand: () => number, similar: Similar = flagLike, mixKinds = false): Question[] {
  return shuffle(ids, rand).map((id, i) => ({ kind: mixKinds && i % 3 === 2 ? 'fromName' as const : 'toName' as const, id, options: optionsFor(id, pool, 4, rand, similar) }));
}

/** The countries least known first (shuffled within a medal), at most `size`. */
function weakest(ids: string[], route: Route, p: Progress, size: number, rand: () => number) {
  return shuffle(ids, rand).sort((a, b) => (p[itemKey(route.topic, a)]?.lvl ?? 0) - (p[itemKey(route.topic, b)]?.lvl ?? 0)).slice(0, size);
}
/** A midway test: the countries of the last three lessons mixed, the least known first. */
export function examQuestions(route: Route, step: { countries: string[] }, p: Progress, rand: () => number, similar: Similar = flagLike): Question[] {
  return testQuestions(weakest(step.countries, route, p, EXAM_SIZE, rand), routeCountries(route), rand, similar, true);
}
/** The border check: countries from the whole route, the least known first. */
export function bossQuestions(route: Route, p: Progress, rand: () => number, similar: Similar = flagLike): Question[] {
  const pool = routeCountries(route);
  return testQuestions(weakest(pool, route, p, BOSS_SIZE, rand), pool, rand, similar, true);
}
