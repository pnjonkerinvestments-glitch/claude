import type { Localized, Topic } from './topics';
export type PuzzleMode = 'compare' | 'mosaic';
export type CountryLabel = { id: string; name: Localized; flag: string };
export type CompareRound = { id: string; topic: Topic; countries: (CountryLabel & { value: number })[]; carried?: boolean; correct: string; referenceYear: number | null; source: string; sourceUrl: string };
export type MosaicFact = { id: string; category: string; explanation: Localized; source: { title: string; url: string; provider: string; license: string; licenseUrl: string }; checkedAt: string; stat?: { label: Localized; value: Localized; unit: Localized; reference: Localized; rawValue: number; referenceYear: number | null; estimated: boolean } };
export type Tile = { id: string; kind: 'flag' | 'name' | 'shape' | 'fact' | 'capital'; countryId: string; text?: Localized; image?: string; path?: string; fact?: MosaicFact };
export type MosaicBoard = { id: string; size: 3 | 4 | 5; factEdition?: string; factDate?: string; tiles: Tile[]; countries: CountryLabel[] };
export type Attempt = { at?: number; correct: boolean; value: string | string[]; countryId: string; responseTime: number; questionId: string };
export type PuzzleState = { practice?: boolean; reviewOf?: string; datasetVersion?: string; id: string; mode: PuzzleMode; daily: string | null; phase: 'question' | 'reveal' | 'finished'; round: number; startedAt: number; turnAt: number; settings: { topic: string; size: 3 | 4 | 5 }; questions: CompareRound[]; board: MosaicBoard | null; answers: Attempt[]; solved: string[]; streak: number; bestStreak: number };
export type PuzzleView = Omit<PuzzleState, 'questions' | 'startedAt' | 'turnAt'> & { question: CompareRound | null; review?: CompareRound[]; total: number; version: number; learning: true };
export function checkMosaic(board: MosaicBoard, solved: string[], ids: string[]) {
  if (ids.length !== board.size || new Set(ids).size !== board.size) return { valid: false, correct: false, countryId: '', closest: 0 };
  const tiles = ids.map(id => board.tiles.find(t => t.id === id));
  if (tiles.some(t => !t || solved.includes(t.countryId))) return { valid: false, correct: false, countryId: '', closest: 0 };
  const counts: Record<string, number> = {};
  tiles.forEach(t => { counts[t!.countryId] = (counts[t!.countryId] ?? 0) + 1; });
  const [countryId, closest] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return { valid: true, correct: closest === board.size, countryId: closest === board.size ? countryId : '', closest };
}

/** One slot per clue type. A replacement works even when every slot is full. */
export function selectMosaicTile(board: MosaicBoard, solved: string[], selected: string[], id: string) {
  const tile = board.tiles.find(t => t.id === id);
  if (!tile || solved.includes(tile.countryId)) return selected;
  if (selected.includes(id)) return selected.filter(v => v !== id);
  return [...selected.filter(v => {
    const current = board.tiles.find(t => t.id === v);
    return current && !solved.includes(current.countryId) && current.kind !== tile.kind;
  }), id];
}

export function mosaicHint(board: MosaicBoard, solved: string[], selected: string[]) {
  const remaining = board.tiles.filter(t => !solved.includes(t.countryId));
  const first = remaining.find(t => t.id === selected[0]) ?? remaining.find(t => t.kind === 'name') ?? remaining[0];
  if (!first) return [];
  const group = remaining.filter(t => t.countryId === first.countryId);
  const already = selected.filter(id => group.some(t => t.id === id));
  const amount = Math.min(board.size, Math.max(2, already.length + 1));
  return [...already, ...group.map(t => t.id).filter(id => !already.includes(id))].slice(0, amount);
}

/** The selected country name is the explicit anchor for learning feedback. */
export function reviewMosaic(board: MosaicBoard, ids: string[]) {
  const tiles = ids.map(id => board.tiles.find(tile => tile.id === id)).filter((tile): tile is Tile => !!tile);
  const name = tiles.find(tile => tile.kind === 'name');
  if (!name) return null;
  return {
    countryId: name.countryId,
    tiles: tiles.map(tile => ({ id: tile.id, kind: tile.kind, countryId: tile.countryId, correct: tile.countryId === name.countryId })),
  };
}
