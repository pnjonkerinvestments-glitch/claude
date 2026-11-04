// Daily Close Call (1.57): the points, apart from the country data so the game screen stays small.
export const CLOSE_CALL_ROUNDS = 3;
/** Points per round: 333, 333 and 334, so a perfect day is exactly 1,000. */
export const ROUND_MAX = [333, 333, 334];
/** Within this share of the target you get the Close Call bonus. */
export const BONUS_FROM = .98;

/** Points for one round, in line with the other daily games (straight, like 100 per right answer): 0 for a bust;
 *  otherwise 90% of the round's points times total ÷ target, plus the last 10% as the Close Call bonus when you end
 *  within 2% of the target. Exactly on target is the round's full 333 (334 in round 3); 98% ≈ 327 (with bonus),
 *  97% ≈ 291, 95% ≈ 285, 90% ≈ 270, 80% ≈ 240, half ≈ 150. */
export function roundPoints(round: number, total: number, target: number, bust: boolean) {
  if (bust || total <= 0 || total > target) return 0;
  const max = ROUND_MAX[round], share = total / target;
  return Math.round(max * .9 * share) + (share >= BONUS_FROM ? max - Math.round(max * .9) : 0);
}
export const hasBonus = (total: number, target: number) => total <= target && total / target >= BONUS_FROM;
