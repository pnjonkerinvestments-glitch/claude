// Survival runs (1.21), kept apart from the game engine so the browser can import it without the country data.
/**
 * One mistake and the run is over. Every day each survival game has the same questions for everyone,
 * climbing from easy to hard. Your score is how far you got; no ranking points, but you see the day's best run.
 * Shape Shift is new in 1.21: name the country from its outline.
 */
export const SURVIVAL_MODES = ['order', 'borders', 'shape'] as const;
export type SurvivalMode = typeof SURVIVAL_MODES[number];
export const SURVIVAL_ROUNDS = 30;
export type SurvivalSession = { mode: string; completed?: boolean; score?: number; out?: boolean };
