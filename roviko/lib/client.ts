import { effect, type Effect } from './audio';
import { haptic, isNativeApp } from './haptics';
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
/** Numbers follow Roviko's language (1.493 in Dutch), not the device's: the page language is on <html lang>. */
export function formatScore(value: number) { let lang = 'en'; try { lang = document.documentElement.lang || 'en'; } catch { /* server render */ } return new Intl.NumberFormat(lang).format(value ?? 0); }
export async function copyText(text: string) { if (navigator.clipboard)
    await navigator.clipboard.writeText(text);
else
    throw new Error('CLIPBOARD_UNAVAILABLE'); }
/** Sound is on by default in the iOS/Android app (the phone's silent switch still mutes it) and off on the
 * website, where Roviko is often played in classrooms and offices. A saved choice always wins. */
export const soundDefault = () => isNativeApp() ? 'on' : 'off';
export const soundOn = () => readPreference('rv_sound', soundDefault()) === 'on';
/**
 * Every game effect goes through here, so the sound setting is always respected (the World Duel used to
 * play regardless). In the app the same moment also gives a short vibration, unless switched off.
 * `streak`: right answers in a row; each one sounds a little higher.
 */
export function sound(type: Effect, streak = 0) { if (soundOn()) effect(type, streak); if (readPreference('rv_haptics', 'on') === 'on') haptic(type); }

export function metric(event: string, mode: string, context = '') { if (readPreference('rv_metrics','off') === 'on') void post('/metrics',{ event,mode,context }).catch(() => {}); }

/**
 * 1.54: the first /bootstrap is started by a tiny script in the page head (lib/early-boot.ts), before the app code has
 * even loaded, so on a slow phone the player is known up to a second sooner. Taken once; a different platform than the
 * app reports (should not happen) or a failed early request falls back to a normal request.
 */
export function earlyBoot(platform: string): Promise<any> | null {
    let early: { platform: string; response: Promise<{ ok: boolean; data: any }> } | undefined;
    try { early = (window as any).__rvBoot; delete (window as any).__rvBoot; } catch { return null; }
    if (!early || early.platform !== platform) return null;
    return early.response.then(r => { if (!r.ok) throw new Error(r.data?.error ?? 'SERVER_UNAVAILABLE'); return withSpanish(r.data); }, () => api('/bootstrap?platform=' + platform));
}
/** 1.54: the last known player (without email), shown at once on the next visit while the fresh one loads. */
export function cachedBoot(): any | null {
    try { const v = JSON.parse(localStorage.getItem('rv_boot') ?? 'null'); return v && Date.now() - v.at < 7 * 86400000 && v.boot?.user?.id ? v.boot : null; } catch { return null; }
}
export function rememberBoot(boot: any) {
    try { if (!boot?.user?.id) return; const user = { ...boot.user }; delete user.email; localStorage.setItem('rv_boot', JSON.stringify({ at: Date.now(), boot: { ...boot, user } })); } catch { /* storage full or blocked: just slower next time */ }
}
