import { BRAND } from './config';
export function shareResult(input: { mode: string; label: string; date?: string | null; correct: number; total: number; answers: boolean[]; origin: string; detail?: string }) {
    const url = new URL(input.mode === 'compare' || input.mode === 'mosaic' || input.mode === 'rank' || input.date ? '/daily' : '/', input.origin);
    url.searchParams.set('shared', input.mode);
    return `${BRAND.name} · ${input.label} · ${input.date ?? new Date().toISOString().slice(0,10)}\n${input.answers.map(ok => ok ? '●' : '○').join(' ')}\n${input.correct}/${input.total}${input.detail ? ' · ' + input.detail : ''}\n${url.toString()}`;
}
