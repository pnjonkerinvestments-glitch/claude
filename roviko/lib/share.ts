import { BRAND } from './config';

/** Edition numbers like Wordle's: 25 September 2026 (the day roviko.app moved to its own hosting) is #1. */
export const EDITION_ONE = Date.UTC(2026, 8, 25);
export function editionNumber(date?: string | null) {
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
    const n = Math.round((Date.parse(date + 'T00:00:00Z') - EDITION_ONE) / 86400000) + 1;
    return n >= 1 ? n : null;
}
/** Right/wrong as coloured squares, ten per line, so twenty answers stay readable in a chat. */
export function squares(answers: boolean[]) {
    const cells = answers.map(ok => ok ? '🟩' : '🟥');
    const rows: string[] = [];
    for (let i = 0; i < cells.length; i += 10) rows.push(cells.slice(i, i + 10).join(''));
    return rows.join('\n');
}
/**
 * One share text for every game: "Roviko #12 · Daily Detour", the answer squares, the score (points for a
 * daily game) with the streak, and a link. Never names countries or subjects, so it spoils nothing.
 */
export function shareCard(input: { label: string; date?: string | null; trail: string; score?: string; streak?: number; url: string }) {
    const n = editionNumber(input.date);
    const head = `${BRAND.name}${n ? ' #' + n : ''} · ${input.label}`;
    const line = [input.score, input.streak && input.streak > 1 ? '🔥 ' + input.streak : ''].filter(Boolean).join(' · ');
    return [head, input.trail, line, input.url].filter(Boolean).join('\n');
}
export function shareResult(input: { mode: string; label: string; date?: string | null; correct: number; total: number; answers: boolean[]; origin: string; detail?: string; streak?: number }) {
    const url = new URL(input.mode === 'compare' || input.mode === 'mosaic' || input.mode === 'rank' || input.date ? '/daily' : '/', input.origin);
    url.searchParams.set('shared', input.mode);
    return shareCard({ label: input.label, date: input.date, trail: squares(input.answers), score: input.detail ?? `${input.correct}/${input.total}`, streak: input.streak, url: url.toString() });
}
