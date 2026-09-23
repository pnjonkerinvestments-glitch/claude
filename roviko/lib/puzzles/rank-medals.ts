// Graded Rank Radar feedback: how good was the chosen subject among the four options?
// Kept free of data imports so the client bundle stays small.

export const RANK_MEDALS = ['🥇', '🥈', '🥉', '⚪'] as const;

/** 1 = the country's strongest subject, 4 = its weakest of the four. Ties share a place. */
export function choicePlace(options: { id: string; position: number }[], chosenId: string) {
  const chosen = options.find(o => o.id === chosenId);
  if (!chosen) return options.length;
  return 1 + options.filter(o => o.position < chosen.position).length;
}

export function medalFor(place: number) {
  return RANK_MEDALS[Math.min(Math.max(place, 1), RANK_MEDALS.length) - 1];
}

/** Counts per place for a finished radar, e.g. { 1: 4, 2: 1, 3: 1, 4: 0 }. */
export function medalSummary(places: number[]) {
  return places.reduce<Record<1 | 2 | 3 | 4, number>>((acc, p) => { const k = Math.min(Math.max(p, 1), 4) as 1 | 2 | 3 | 4; acc[k] += 1; return acc; }, { 1: 0, 2: 0, 3: 0, 4: 0 });
}
