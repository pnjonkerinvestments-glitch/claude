import { effect, type Effect } from './audio';
import { withSpanish } from '../i18n/content';
export async function api(path: string, options: RequestInit = {}) {
    const controller = new AbortController();
    const abort = () => controller.abort();
    options.signal?.addEventListener('abort', abort, { once: true });
    if (options.signal?.aborted) controller.abort();
    const timeout = setTimeout(abort, 12000);
    try {
        const res = await fetch('/api' + path, { ...options, signal: controller.signal, headers: { 'Content-Type': 'application/json', ...options.headers } });
        const data = await res.json().catch(() => { throw new Error('SERVER_UNAVAILABLE'); });
        if (!res.ok) throw new Error(data.error ?? 'SERVER_UNAVAILABLE');
        return withSpanish(data);
    } catch (error: any) {
        if (controller.signal.aborted) throw new Error('REQUEST_TIMEOUT');
        if (error instanceof TypeError) throw new Error('SERVER_UNAVAILABLE');
        throw error;
    } finally {
        clearTimeout(timeout);
        options.signal?.removeEventListener('abort', abort);
    }
}
// Preferences are optional: blocked storage must never prevent a game from loading.
export function readPreference(key: string, fallback: string) { try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } }
export function writePreference(key: string, value: string) { try { localStorage.setItem(key, value); } catch { /* Session-only preference. */ } }
export const post = (path: string, value: any = {}) => api(path, { method: 'POST', body: JSON.stringify(value) });
export function formatScore(value: number) { return new Intl.NumberFormat().format(value ?? 0); }
export async function copyText(text: string) { if (navigator.clipboard)
    await navigator.clipboard.writeText(text);
else
    throw new Error('CLIPBOARD_UNAVAILABLE'); }
/** Sound effects live in lib/audio.ts; this name stays for the existing callers. */
export function sound(type: Effect) { effect(type); }

export function metric(event: string, mode: string, context = '') { if (readPreference('rv_metrics','off') === 'on') void post('/metrics',{ event,mode,context }).catch(() => {}); }
