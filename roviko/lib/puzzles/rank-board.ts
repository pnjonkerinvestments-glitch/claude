import { COUNTRIES } from '../game-engine/questions';
import { random, shuffle, seedHash } from '../game-engine/scoring';
import { GEOGRAPHY_POLICY } from '../config';
import { localized } from '../../i18n/content';
import { RANK_TABLES, type RankCategory } from './rank';
import type { Localized } from './topics';

/**
 * Rank Radar since 1.21 (inspired by GeoRankle, with three changes):
 * - eight countries and eight subjects a day, every subject used exactly once;
 * - all eight countries are shown up front, so you can plan which subject to keep for whom;
 * - after each pick you see that country's place in all eight subjects, and at the end the best
 *   possible total for the day, so you know how close to perfect you came.
 * A pick is worth up to 125 points: full points for the country's strongest subject of the eight,
 * fewer the lower the chosen subject sits on the world list compared with that strongest one.
 */
export const RANK_BOARD_ROUNDS = 8;
export const RANK_ROUND_MAX = 125;

export type RankStat = { rank: number; coverage: number; position: number; value: number; unit: string; referenceYear: number | null; source: string; sourceUrl: string; estimated?: boolean; place?: string };
export type RankBoardCategory = Pick<RankCategory, 'id' | 'emoji' | 'label' | 'explanation' | 'unit'>;
export type RankBoardRound = { id: string; country: { id: string; name: Localized; flag: string }; stats: Record<string, RankStat> };
export type RankBoard = { v: 2; categories: RankBoardCategory[]; rounds: RankBoardRound[]; optimal: number };
/** What the browser may see: every country up front, a country's places only once it has been played. */
export type PublicRankBoard = { v: 2; categories: RankBoardCategory[]; rounds: (Pick<RankBoardRound, 'id' | 'country'> & { stats?: Record<string, RankStat>; best?: string[] })[]; optimal?: number };
export function publicBoard(board: RankBoard, played: number, finished: boolean): PublicRankBoard {
  return { v: 2, categories: board.categories, rounds: board.rounds.map((r, i) => i < played ? { ...r, best: bestCategories(r) } : { id: r.id, country: r.country }), ...(finished ? { optimal: board.optimal } : {}) };
}

/** Points for choosing `categoryId` for this round's country. */
export function rankPoints(round: Pick<RankBoardRound, 'stats'>, categoryId: string) {
  const stats = Object.values(round.stats), chosen = round.stats[categoryId];
  if (!chosen || !stats.length) return 0;
  const best = Math.min(...stats.map(s => s.position));
  if (chosen.position <= best) return RANK_ROUND_MAX;
  return Math.round(RANK_ROUND_MAX * Math.pow((1 - chosen.position) / Math.max(1e-9, 1 - best), 3));
}
/** The country's strongest subject(s) of the day. */
export function bestCategories(round: Pick<RankBoardRound, 'stats'>) {
  const best = Math.min(...Object.values(round.stats).map(s => s.position));
  return Object.entries(round.stats).filter(([, s]) => s.position === best).map(([id]) => id);
}
/** Best total a player could reach today: try every way to hand out the eight subjects (8! = 40,320). */
export function optimalTotal(board: Pick<RankBoard, 'categories' | 'rounds'>) {
  const ids = board.categories.map(c => c.id), table = board.rounds.map(r => ids.map(id => rankPoints(r, id)));
  let best = 0;
  const walk = (round: number, used: number, sum: number) => {
    if (round === table.length) { if (sum > best) best = sum; return; }
    for (let c = 0; c < ids.length; c++) if (!(used & (1 << c))) walk(round + 1, used | (1 << c), sum + table[round][c]);
  };
  walk(0, 0, 0);
  return best;
}

export function generateRankBoard(seed: string): RankBoard {
  const rng = random(seed);
  // Subjects with near-complete coverage only, so every country has a fair place in each.
  const tables = shuffle(RANK_TABLES.filter(t => Object.keys(t.values).length >= 150), rng).slice(0, RANK_BOARD_ROUNDS);
  if (tables.length < RANK_BOARD_ROUNDS) throw new Error('QUESTION_UNAVAILABLE');
  const pool = shuffle(COUNTRIES.filter(c => c.area >= 3000 && !GEOGRAPHY_POLICY.puzzleSensitiveCountries.includes(c.id) && tables.every(t => t.values[c.id])), rng);
  const picked: typeof pool = [], bestUse = new Map<string, number>(), regions = new Map<string, number>();
  for (const country of pool) {
    const positions = tables.map(t => ({ id: t.category.id, rank: t.ranks[country.id].rank, position: t.ranks[country.id].position }));
    const top = positions.reduce((a, b) => (b.position < a.position ? b : a));
    // Every country stands out somewhere (top 30 in at least one subject); no subject is the best pick more
    // than twice, and at most three countries per continent, so the day needs real choices.
    if (top.rank > 30 || (bestUse.get(top.id) ?? 0) >= 2 || (regions.get(country.region) ?? 0) >= 3) continue;
    picked.push(country); bestUse.set(top.id, (bestUse.get(top.id) ?? 0) + 1); regions.set(country.region, (regions.get(country.region) ?? 0) + 1);
    if (picked.length === RANK_BOARD_ROUNDS) break;
  }
  if (picked.length < RANK_BOARD_ROUNDS) throw new Error('QUESTION_UNAVAILABLE');
  const categories = tables.map(t => ({ id: t.category.id, emoji: t.category.emoji, label: t.category.label, explanation: t.category.explanation, unit: t.category.unit }));
  const rounds: RankBoardRound[] = picked.map((country, i) => ({
    id: 'rank2:' + seedHash(seed + ':' + i).toString(36),
    country: { id: country.id, name: localized(country.name, country.nl), flag: country.flag },
    stats: Object.fromEntries(tables.map(t => { const o = t.values[country.id], r = t.ranks[country.id]; return [t.category.id, { rank: r.rank, coverage: r.coverage, position: r.position, value: o.value, unit: t.category.unit, referenceYear: o.referenceYear, source: o.source, sourceUrl: o.sourceUrl, ...(o.estimated ? { estimated: true } : {}), ...(o.place ? { place: o.place } : {}) }]; })),
  }));
  const board = { v: 2 as const, categories, rounds, optimal: 0 };
  board.optimal = optimalTotal(board);
  return board;
}
