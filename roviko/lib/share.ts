import { BRAND } from './config';
import { ALL_DAY_MODES, type DayMode } from './daily-loop';
import { nameAllowed } from './name-filter';

/** A friend's challenge from a shared link. Since 1.26 it can also carry the sharer's name and place of the day
 *  (?n=Pietje&r=1&p=230): a friendly claim read from the address, never stored or ranked. */
export type SharedChallenge = { mode: DayMode | 'day'; points: number; name?: string; place?: number; players?: number };
/** A name from a link: the same characters and filter as player names, else nothing. */
export function sharedName(raw: string | null) {
    const v = (raw ?? '').trim().slice(0, 24);
    return v.length >= 2 && /^[\p{L}\p{N} _.-]+$/u.test(v) && nameAllowed(v) ? v : undefined;
}
/** Reads a shared link (?shared=daily&s=820, or ?shared=day&s=4210 for a whole day): which game and how many points the friend got.
 *  Every game that ever was a daily game is accepted, so older Mosaic links keep working after the daily Size Shuffle took its place (1.24). */
export function readChallenge(search: string): SharedChallenge | null {
    const q = new URLSearchParams(search), mode = q.get('shared') as DayMode | 'day' | null, s = q.get('s');
    if (!mode || !(mode === 'day' || (ALL_DAY_MODES as readonly string[]).includes(mode)) || s === null || !/^\d{1,4}$/.test(s)) return null;
    const points = Number(s);
    // One game is worth at most 1,000; a whole day ("day") at most 6,000.
    if (points > (mode === 'day' ? 6000 : 1000)) return null;
    const out: SharedChallenge = { mode, points };
    const name = sharedName(q.get('n')); if (name) out.name = name;
    const r = q.get('r'), p = q.get('p');
    if (r && p && /^\d{1,7}$/.test(r) && /^\d{1,7}$/.test(p) && +r >= 1 && +p >= 2 && +r <= +p) { out.place = +r; out.players = +p; }
    return out;
}

/** Today's place of the player, per game ('day' for the whole day), remembered when the result screen loads it,
 *  so every share button can say "#3 of 120" without asking the server again. Only lives in this page. */
const standings = new Map<string, { place: number; players: number }>();
export function rememberStanding(mode: string, date: string, place?: number, players?: number) {
    if (place && players && players >= 2) standings.set(mode + ':' + date, { place, players });
}
export function standingFor(mode: string, date?: string | null) { return date ? standings.get(mode + ':' + date) : undefined; }

/**
 * The challenge part of a share (1.26): "🏆 Pietje: #1 of 230 players worldwide today", "Can you beat that?",
 * and the name, place and language in the link so the friend's page (and its link preview) can say the same.
 */
export function challengeExtras(t: (k: string) => string, locale: string, mode: string, date: string | null | undefined, name?: string) {
    const st = standingFor(mode, date), who = sharedName(name ?? null);
    const n = (v: number) => v.toLocaleString(locale);
    const rank = st ? (st.place === 1 ? t('shareRankFirst') : t('shareRank')).replace('{place}', n(st.place)).replace('{players}', n(st.players)) : '';
    return {
        rankLine: st ? '🏆 ' + (who ? t('shareRankWho').replace('{name}', who).replace('{rank}', rank) : rank) : undefined,
        callLine: t('shareCall'),
        params: { ...(who ? { n: who } : {}), ...(st ? { r: String(st.place), p: String(st.players) } : {}), l: locale },
    };
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
export type ShareExtras = ReturnType<typeof challengeExtras>;
export function shareCard(input: { label: string; date?: string | null; trail: string; score?: string; streak?: number; url: string; points?: number; extras?: ShareExtras }) {
    const n = editionNumber(input.date);
    // A daily score travels in the link (?s=820) so the friend who opens it sees what to beat.
    let url = input.url;
    if (typeof input.points === 'number' && Number.isFinite(input.points)) { const u = new URL(url); u.searchParams.set('s', String(Math.round(input.points))); for (const [k, v] of Object.entries(input.extras?.params ?? {})) u.searchParams.set(k, v); url = u.toString(); }
    const head = `${BRAND.name}${n ? ' #' + n : ''} · ${input.label}`;
    const line = [input.score, input.streak && input.streak > 1 ? '🔥 ' + input.streak : ''].filter(Boolean).join(' · ');
    // The place of the day and the call come after the score line (the share picture reads the first line after the squares as the score).
    return [head, input.trail, line, input.extras?.rankLine, typeof input.points === 'number' ? input.extras?.callLine : '', url].filter(Boolean).join('\n');
}
export function shareResult(input: { mode: string; label: string; date?: string | null; correct: number; total: number; answers: boolean[]; origin: string; detail?: string; streak?: number; points?: number; extras?: ShareExtras }) {
    const url = new URL(input.mode === 'compare' || input.mode === 'mosaic' || input.mode === 'rank' || input.date ? '/daily' : '/', input.origin);
    url.searchParams.set('shared', input.mode);
    return shareCard({ label: input.label, date: input.date, trail: squares(input.answers), score: input.detail ?? `${input.correct}/${input.total}`, streak: input.streak, url: url.toString(), points: input.points, extras: input.extras });
}
