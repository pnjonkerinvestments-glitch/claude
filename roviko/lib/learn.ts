/**
 * Learn (1.38): short lessons that teach flags, continent by continent, and bring back what you got wrong.
 * Pure logic only (no React, no fetch), so the same rules run in the app, on the server merge and in tests.
 *
 * Progress is one flat map of cards, each with its own timestamp `t`. Two copies (this phone, the account on
 * the server, another device) merge per card: the newest `t` wins. That keeps syncing simple and safe.
 *  - `item:flags:NLD`        a country in a topic: lvl 0 (seen, not known yet) … 3 (gold), due day, last day
 *  - `lesson:flags-europe-1` a finished lesson: day, best score
 *  - `boss:flags-europe`     the border check (final test) of a route: day passed, best score
 */
export type Card = { t: number; lvl?: number; due?: string; last?: string; day?: string; best?: number; of?: number };
export type Progress = Record<string, Card>;
export type Lesson = { id: string; key: string; countries: string[] };
export type Route = { id: string; topic: 'flags'; region: string; lessons: Lesson[] };

/** Days between reviews once a country reaches bronze (1), silver (2) and gold (3). */
export const INTERVALS = [0, 1, 3, 7];
/** After gold, a country still comes back now and then. */
export const GOLD_AGAIN = 14;
export const REVIEW_SIZE = 12;
export const BOSS_SIZE = 15;
export const BOSS_PASS = 12;
export const MAX_CARDS = 2000;

/**
 * Europe in nine lessons of four to six countries: well-known first, neighbours together, and flags that look
 * alike close to each other so the practice can point out the difference.
 */
export const ROUTES: Route[] = [{
  id: 'flags-europe', topic: 'flags', region: 'Europe', lessons: [
    ['west', ['NLD', 'BEL', 'DEU', 'FRA', 'GBR', 'IRL']],
    ['med', ['ESP', 'PRT', 'ITA', 'GRC', 'MLT']],
    ['north', ['SWE', 'NOR', 'DNK', 'FIN', 'ISL']],
    ['middle', ['CHE', 'AUT', 'CZE', 'SVK', 'HUN']],
    ['small', ['LUX', 'MCO', 'LIE', 'AND', 'SMR', 'VAT']],
    ['east', ['UKR', 'RUS', 'ROU', 'BLR', 'MDA']],
    ['baltic', ['POL', 'LTU', 'LVA', 'EST']],
    ['balkan', ['HRV', 'SVN', 'SRB', 'BIH', 'MNE']],
    ['southeast', ['ALB', 'MKD', 'BGR', 'CYP']],
  ].map(([key, countries], i) => ({ id: 'flags-europe-' + (i + 1), key: key as string, countries: countries as string[] })),
}];

/**
 * Flags that are easy to mix up. Used as wrong options in the tests and as a "looks like" note when you first
 * meet a flag. Only visual likeness; no facts are claimed.
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
};

export const routeOf = (id: string) => ROUTES.find(r => r.id === id) ?? null;
export const lessonOf = (id: string) => { for (const r of ROUTES) { const l = r.lessons.find(x => x.id === id); if (l) return { route: r, lesson: l, index: r.lessons.indexOf(l) }; } return null; };
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

/** Where the player stands on a route: lessons done, which lesson is next, what is due and the medal counts. */
export function routeState(route: Route, p: Progress, today: string) {
  const done = route.lessons.map(l => !!p['lesson:' + l.id]);
  const next = done.indexOf(false);
  const countries = routeCountries(route);
  const lvl = (id: string) => p[itemKey(route.topic, id)]?.lvl ?? -1;
  const due = countries.filter(id => { const c = p[itemKey(route.topic, id)]; return c && c.due && c.due <= today; })
    .sort((x, y) => (p[itemKey(route.topic, x)].due! < p[itemKey(route.topic, y)].due! ? -1 : 1) || lvl(x) - lvl(y));
  const medals = { bronze: 0, silver: 0, gold: 0 };
  for (const id of countries) { const l = lvl(id); if (l === 1) medals.bronze++; else if (l === 2) medals.silver++; else if (l >= 3) medals.gold++; }
  const learned = medals.bronze + medals.silver + medals.gold;
  return { done, next: next === -1 ? route.lessons.length : next, due, medals, learned, total: countries.length, boss: p['boss:' + route.id] ?? null, bossOpen: next === -1 };
}

/**
 * One answer changes one country. `fresh` is a first test in a lesson; otherwise it is a review.
 * Only the first answer per country in a session counts (the caller passes that one).
 *  - lesson test: right → at least bronze, back tomorrow; wrong → no medal change, back today in the review pile
 *  - review: right on a new day → one medal up, back after a longer break; right again the same day → no change;
 *    wrong → one medal down (bronze stays bronze), back tomorrow
 */
export function applyAnswer(card: Card | undefined, right: boolean, today: string, now: number, fresh: boolean): Card {
  const lvl = card?.lvl ?? 0;
  if (fresh) return right ? { t: now, lvl: Math.max(1, lvl), last: today, due: addDays(today, INTERVALS[Math.max(1, lvl)]) } : { t: now, lvl, last: today, due: today };
  if (!right) return { t: now, lvl: lvl >= 2 ? lvl - 1 : lvl, last: today, due: addDays(today, 1) };
  if (card?.last === today) return { ...card, t: now, due: card.due && card.due > today ? card.due : addDays(today, 1) };
  const up = Math.min(3, Math.max(1, lvl + 1));
  return { t: now, lvl: up, last: today, due: addDays(today, lvl >= 3 ? GOLD_AGAIN : INTERVALS[up]) };
}

export type Question = { kind: 'flag2name' | 'name2flag'; id: string; options: string[] };

/** A small seeded random, so a session can be rebuilt and tests are repeatable. */
export function rng(seed: number) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; }; }
export function shuffle<T>(list: T[], rand: () => number) { const a = [...list]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

/** Wrong options: look-alikes first (when allowed), then others from the pool; always `n` distinct options. */
export function optionsFor(id: string, pool: string[], n: number, rand: () => number, lookalikes = true) {
  const picks: string[] = [];
  if (lookalikes) for (const x of shuffle(LOOKALIKES[id] ?? [], rand)) if (x !== id && pool.includes(x) && picks.length < Math.ceil((n - 1) / 2)) picks.push(x);
  for (const x of shuffle(pool, rand)) { if (picks.length >= n - 1) break; if (x !== id && !picks.includes(x)) picks.push(x); }
  return shuffle([id, ...picks], rand);
}

/** Practice: every country twice (flag → name, then name → flag), with options from the lesson only. */
export function practiceQuestions(lesson: Lesson, rand: () => number): Question[] {
  const n = Math.min(4, lesson.countries.length);
  const first = shuffle(lesson.countries, rand).map(id => ({ kind: 'flag2name' as const, id, options: optionsFor(id, lesson.countries, n, rand, false) }));
  const second = shuffle(lesson.countries, rand).map(id => ({ kind: 'name2flag' as const, id, options: optionsFor(id, lesson.countries, n, rand, false) }));
  return [...first, ...second];
}

/** The lesson test and reviews: each country once, four options with look-alikes from the whole route. */
export function testQuestions(ids: string[], pool: string[], rand: () => number, mixKinds = false): Question[] {
  return shuffle(ids, rand).map((id, i) => ({ kind: mixKinds && i % 3 === 2 ? 'name2flag' as const : 'flag2name' as const, id, options: optionsFor(id, pool, 4, rand) }));
}

/** The border check: BOSS_SIZE countries from the whole route, the least known first. */
export function bossQuestions(route: Route, p: Progress, rand: () => number): Question[] {
  const pool = routeCountries(route);
  const ranked = shuffle(pool, rand).sort((a, b) => (p[itemKey(route.topic, a)]?.lvl ?? 0) - (p[itemKey(route.topic, b)]?.lvl ?? 0));
  return testQuestions(ranked.slice(0, BOSS_SIZE), pool, rand, true);
}
