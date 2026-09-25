// The parts of World Duel the browser needs: constants, types and the win rule.
// Kept apart from duel.ts, which imports the full country and statistics data for generating boards on the server.
import type { Localized } from './topics';

export const DUEL_ROUNDS = 5;
/** A duel only counts as clear when the two values differ by at least this share. */
export const DUEL_MARGIN = 0.12;

type DuelCategory = { id: string; emoji: string; label: Localized; unit: string; explanation: Localized };
export type DuelCard = { id: string; name: Localized; flag: string };
export type DuelFact = { value: number; rank: number; coverage: number; referenceYear: number | null; source: string; sourceUrl: string; estimated?: boolean };
export type DuelRound = {
  category: DuelCategory;
  roviko: DuelCard & DuelFact;
  /** The value of every card in the player's hand for this round's subject. */
  hand: Record<string, DuelFact>;
};
export type DuelBoard = { seed: string; hand: DuelCard[]; rounds: DuelRound[]; solution: string[] };

export function duelWon(round: DuelRound, cardId: string) {
  return (round.hand[cardId]?.value ?? -Infinity) > round.roviko.value;
}
