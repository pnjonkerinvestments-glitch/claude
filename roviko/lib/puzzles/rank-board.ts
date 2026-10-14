import { COUNTRIES } from '../game-engine/questions';
import { random, shuffle, seedHash } from '../game-engine/scoring';
import { GEOGRAPHY_POLICY } from '../config';
import { localized } from '../../i18n/content';
import { ACTIVE_RANK_TABLES, RANK_TABLES as ALL_RANK_TABLES, type RankCategory } from './rank';
import type { Localized } from './topics';

/**
 * Rank Radar since 1.22 (played like GeoRankle):
 * - eight countries and eight subjects a day, every subject used exactly once;
 * - the countries arrive one by one: you never know which country comes next;
 * - after each pick you see the world place (#) of the subject you chose and how good that pick was;
 *   the full radar and the best subject per country open after the last pick.
 * Since 1.41 (board v3) every country has one clear best subject, a different one for each country, so a
 * perfect day (8 of 8) is always possible and there is exactly one ideal solution. A pick scores by how
 * good it was for that country: its best subject 125, the second best 90, then 65, 45, 30, 20, 10 and 5.
 * Boards from before 1.41 (v2) keep their old points: relative to the country's strongest subject.
 */
export const RANK_BOARD_ROUNDS = 8;
/**
 * Subjects for board v3 (1.41): the lively ones plus the ones GeoRankle players know (forest, birth rate,
 * city living, internet, median age, population density), so a day is not the same eight subjects again.
 */
const EXTRA_IDS = ['forest', 'births', 'urban', 'internet', 'age', 'density'];
const RANK_TABLES = [...ACTIVE_RANK_TABLES, ...ALL_RANK_TABLES.filter(t => EXTRA_IDS.includes(t.category.id))];
export const RANK_ROUND_MAX = 125;

export type RankStat = { rank: number; coverage: number; position: number; value: number; unit: string; referenceYear: number | null; source: string; sourceUrl: string; estimated?: boolean; place?: string };
export type RankBoardCategory = Pick<RankCategory, 'id' | 'emoji' | 'label' | 'explanation' | 'unit'>;
export type RankBoardRound = { id: string; country: { id: string; name: Localized; flag: string }; stats: Record<string, RankStat> };
export type RankBoard = { v: 2 | 3; categories: RankBoardCategory[]; rounds: RankBoardRound[]; optimal: number };
/**
 * What the browser may see: played countries and the current one (later ones only as an anonymous id),
 * and for a played country only the place of the subject that was chosen. Everything opens at the end.
 */
export type PublicRankRound = { id: string; country?: RankBoardRound['country']; stats?: Record<string, RankStat>; best?: string[] };
export type PublicRankBoard = { v: 2 | 3; categories: RankBoardCategory[]; rounds: PublicRankRound[]; optimal?: number };
export function publicBoard(board: RankBoard, picks: (string | undefined)[], round: number, finished: boolean): PublicRankBoard {
  return { v: board.v, categories: board.categories, rounds: board.rounds.map((r, i) => {
    if (finished) return { ...r, best: bestCategories(r, board.v) };
    if (i > round) return { id: r.id };
    const pick = picks[i];
    return pick && r.stats[pick] ? { id: r.id, country: r.country, stats: { [pick]: r.stats[pick] } } : { id: r.id, country: r.country };
  }), ...(finished ? { optimal: board.optimal } : {}) };
}

/** Points per pick in board v3, by how good the pick was for that country (1st best of eight … 8th). */
export const CHOICE_POINTS = [125, 90, 65, 45, 30, 20, 10, 5] as const;
/** Where a subject stands for this country among the day's eight: 1 = its best (ties share the better place). */
export function choicePlace(round: Pick<RankBoardRound, 'stats'>, categoryId: string, v: 2 | 3 = 3) {
  const chosen = round.stats[categoryId];
  if (!chosen) return 0;
  const key = (s: RankStat) => v === 3 ? s.rank : s.position;
  return 1 + Object.values(round.stats).filter(s => key(s) < key(chosen)).length;
}
/** Points for choosing `categoryId` for this round's country. */
export function rankPoints(round: Pick<RankBoardRound, 'stats'>, categoryId: string, v: 2 | 3 = 2) {
  const stats = Object.values(round.stats), chosen = round.stats[categoryId];
  if (!chosen || !stats.length) return 0;
  if (v === 3) return CHOICE_POINTS[Math.min(CHOICE_POINTS.length, choicePlace(round, categoryId, 3)) - 1];
  const best = Math.min(...stats.map(s => s.position));
  if (chosen.position <= best) return RANK_ROUND_MAX;
  return Math.round(RANK_ROUND_MAX * Math.pow((1 - chosen.position) / Math.max(1e-9, 1 - best), 3));
}
/** The country's best subject(s) of the day: the best world place (v3) or relative position (v2). */
export function bestCategories(round: Pick<RankBoardRound, 'stats'>, v: 2 | 3 = 2) {
  return Object.keys(round.stats).filter(id => choicePlace(round, id, v) === 1);
}
/** Best total a player could reach today: try every way to hand out the eight subjects (8! = 40,320). */
export function optimalTotal(board: Pick<RankBoard, 'categories' | 'rounds'> & { v?: 2 | 3 }) {
  const ids = board.categories.map(c => c.id), table = board.rounds.map(r => ids.map(id => rankPoints(r, id, board.v ?? 2)));
  let best = 0;
  const walk = (round: number, used: number, sum: number) => {
    if (round === table.length) { if (sum > best) best = sum; return; }
    for (let c = 0; c < ids.length; c++) if (!(used & (1 << c))) walk(round + 1, used | (1 << c), sum + table[round][c]);
  };
  walk(0, 0, 0);
  return best;
}

const statsOf = (t: (typeof RANK_TABLES)[number], id: string): RankStat => {
  const o = t.values[id], r = t.ranks[id];
  return { rank: r.rank, coverage: r.coverage, position: r.position, value: o.value, unit: t.category.unit, referenceYear: o.referenceYear, source: o.source, sourceUrl: o.sourceUrl, ...(o.estimated ? { estimated: true } : {}), ...(o.place ? { place: o.place } : {}) };
};

/**
 * Board v3 (1.41). Eight subjects, then for each subject a country whose clear best of those eight is that
 * subject: at most world #25 there, and clearly ahead of its second best (at least 5 places and a third
 * better), so the right pick is learnable and never a coin toss. At most three countries per continent.
 * When a set of subjects cannot be covered, the next set is tried (deterministic per seed).
 */
export function generateRankBoard(seed: string): RankBoard {
  const rng = random(seed);
  const full = RANK_TABLES.filter(t => Object.keys(t.values).length >= 150);
  for (let attempt = 0; attempt < 60; attempt++) {
    const tables = shuffle(full, rng).slice(0, RANK_BOARD_ROUNDS);
    if (tables.length < RANK_BOARD_ROUNDS) break;
    const pool = shuffle(COUNTRIES.filter(c => c.area >= 3000 && !GEOGRAPHY_POLICY.puzzleSensitiveCountries.includes(c.id) && tables.every(t => t.values[c.id] && t.ranks[c.id])), rng);
    // Who could own each subject; then hand the scarcest subjects out first, a random candidate each, so the
    // same well-known country (Germany for the economy) does not show up every other day.
    const candidates = new Map<string, typeof pool>(tables.map(t => [t.category.id, []]));
    for (const country of pool) {
      const sorted = tables.map(t => ({ id: t.category.id, rank: t.ranks[country.id].rank })).sort((x, y) => x.rank - y.rank);
      const [top, second] = sorted;
      if (top.rank <= 25 && second.rank - top.rank >= 5 && top.rank <= second.rank * 0.67) candidates.get(top.id)!.push(country);
    }
    const owner = new Map<string, (typeof pool)[number]>(), regions = new Map<string, number>();
    for (const [id, list] of [...candidates].sort((x, y) => x[1].length - y[1].length)) {
      const free = list.filter(c => (regions.get(c.region) ?? 0) < 3);
      if (!free.length) break;
      const country = free[Math.floor(rng() * free.length)];
      owner.set(id, country); regions.set(country.region, (regions.get(country.region) ?? 0) + 1);
    }
    if (owner.size < RANK_BOARD_ROUNDS) continue;
    const picked = shuffle([...owner.values()], rng);
    const categories = tables.map(t => ({ id: t.category.id, emoji: t.category.emoji, label: t.category.label, explanation: t.category.explanation, unit: t.category.unit }));
    const rounds: RankBoardRound[] = picked.map((country, i) => ({
      id: 'rank3:' + seedHash(seed + ':' + i).toString(36),
      country: { id: country.id, name: localized(country.name, country.nl), flag: country.flag },
      stats: Object.fromEntries(tables.map(t => [t.category.id, statsOf(t, country.id)])),
    }));
    const board: RankBoard = { v: 3, categories, rounds, optimal: 0 };
    board.optimal = optimalTotal(board);
    return board;
  }
  throw new Error('QUESTION_UNAVAILABLE');
}
