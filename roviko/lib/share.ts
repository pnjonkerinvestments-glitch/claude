import { BRAND } from './config';
import { DAY_MODES, type DayMode } from './daily-loop';

/** Reads a shared link (?shared=daily&s=820): which daily game and how many points the friend got. */
export function readChallenge(search: string): { mode: DayMode; points: number } | null {
    const q = new URLSearchParams(search), mode = q.get('shared') as DayMode | null, s = q.get('s');
    if (!mode || !(DAY_MODES as readonly string[]).includes(mode) || s === null || !/^\d{1,4}$/.test(s)) return null;
    const points = Number(s);
    return points <= 1000 ? { mode, points } : null;
}

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
export function shareCard(input: { label: string; date?: string | null; trail: string; score?: string; streak?: number; url: string; points?: number }) {
    const n = editionNumber(input.date);
    // A daily score travels in the link (?s=820) so the friend who opens it sees what to beat.
    let url = input.url;
    if (typeof input.points === 'number' && Number.isFinite(input.points)) { const u = new URL(url); u.searchParams.set('s', String(Math.round(input.points))); url = u.toString(); }
    const head = `${BRAND.name}${n ? ' #' + n : ''} · ${input.label}`;
    const line = [input.score, input.streak && input.streak > 1 ? '🔥 ' + input.streak : ''].filter(Boolean).join(' · ');
    return [head, input.trail, line, url].filter(Boolean).join('\n');
}
export function shareResult(input: { mode: string; label: string; date?: string | null; correct: number; total: number; answers: boolean[]; origin: string; detail?: string; streak?: number; points?: number }) {
    const url = new URL(input.mode === 'compare' || input.mode === 'mosaic' || input.mode === 'rank' || input.date ? '/daily' : '/', input.origin);
    url.searchParams.set('shared', input.mode);
    return shareCard({ label: input.label, date: input.date, trail: squares(input.answers), score: input.detail ?? `${input.correct}/${input.total}`, streak: input.streak, url: url.toString(), points: input.points });
}
