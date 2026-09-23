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
        return data;
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
let context: AudioContext | undefined;
export function sound(type: 'correct' | 'incorrect' | 'countdown' | 'win') { try {
    context ??= new AudioContext();
    void context.resume();
    const oscillator = context.createOscillator(), gain = context.createGain();
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(type === 'correct' ? 620 : type === 'win' ? 780 : type === 'countdown' ? 420 : 220, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(type === 'incorrect' ? 150 : 1000, context.currentTime + .16);
    gain.gain.setValueAtTime(.045, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + .22);
    oscillator.start();
    oscillator.stop(context.currentTime + .24);
}
catch { } }

export function metric(event: string, mode: string, context = '') { if (readPreference('rv_metrics','off') === 'on') void post('/metrics',{ event,mode,context }).catch(() => {}); }
