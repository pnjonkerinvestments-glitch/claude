// Words for the moments in a game: the heading after an answer and the headline of a finish screen.
// Only wording: points, rules and results never depend on this.

/** Right answers in a row at the end of a list of answers (for the rising combo chime). */
export function inARow(answers: { correct?: boolean }[] = []) { let n = 0; for (let i = answers.length - 1; i >= 0 && answers[i]?.correct; i--) n++; return n; }

const pick = (seed: string, n: number) => { let h = 7; for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h % n; };

/** The heading after an answer: a few warm variants (stable per question), a combo from 3 in a row,
 * and "So close! 240 km away" for a map pin that just missed. Text keys live in i18n/v123.ts. */
export function feedbackHeading(t: (k: string) => string, input: { correct: boolean; seed: string; streak?: number; distanceKm?: number | null; locale?: string }) {
  if (input.correct && (input.streak ?? 0) >= 3) return t('fbStreak').replace('{n}', String(input.streak));
  if (!input.correct && typeof input.distanceKm === 'number' && input.distanceKm > 0 && input.distanceKm <= 300)
    return t('fbNear').replace('{n}', Math.round(input.distanceKm).toLocaleString(input.locale));
  return t((input.correct ? 'fbRight' : 'fbWrong') + (pick(input.seed, 4) + 1));
}

/** Finish-screen headline from the share of the maximum (0–1): perfect, world class, strong, nice, or
 * an encouraging "tomorrow's another chance" for a low score. */
export function finishKey(ratio: number, perfect = false) {
  if (perfect) return 'finishPerfect';
  if (ratio >= 0.9) return 'finishTop';
  if (ratio >= 0.7) return 'finishStrong';
  if (ratio >= 0.4) return 'finishNice';
  return 'finishTomorrow';
}
/** Roviko's face to go with it. */
export const finishMood = (ratio: number, perfect = false) => perfect || ratio >= 0.7 ? 'cheer' as const : ratio >= 0.4 ? 'happy' as const : 'wink' as const;
