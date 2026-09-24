export function haversine(a: number[], b: number[]) { const rad = Math.PI / 180; const dLat = (b[0] - a[0]) * rad, dLng = (b[1] - a[1]) * rad; const x = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dLng / 2) ** 2; return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(Math.max(0, 1 - x))); }
export function scoreAnswer(correct: boolean, elapsed: number, limit: number, streak: number) { if (!correct)
    return 0; return 1000 + (limit > 0 ? Math.round(500 * Math.max(0, 1 - elapsed / limit)) : 0) + Math.min(250, Math.max(0, streak - 1) * 50); }
export function mapScore(distance: number, elapsed: number, limit: number) { return Math.round(1000 * Math.exp(-distance / 1600)) + (limit > 0 ? Math.round(500 * Math.max(0, 1 - elapsed / limit) * Math.exp(-distance / 1600)) : 0); }
export function normalize(s: string) { return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, ''); }
export function editDistance(a: string, b: string) { const p = Array.from({ length: b.length + 1 }, (_, i) => i); for (let i = 1; i <= a.length; i++) {
    let prev = p[0];
    p[0] = i;
    for (let j = 1; j <= b.length; j++) {
        const n = p[j];
        p[j] = Math.min(p[j] + 1, p[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
        prev = n;
    }
} return p[b.length]; }
export function matches(answer: string, valid: string[]) { const x = normalize(answer); return valid.some(v => { const y = normalize(v); return x === y || (x.length >= 5 && Math.abs(x.length - y.length) <= 1 && editDistance(x, y) <= 1); }); }
export function elo(a: number, b: number, outcome: number, k = 24) { return Math.round(a + k * (outcome - 1 / (1 + 10 ** ((b - a) / 400)))); }
export function roomCode() { const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; return Array.from(crypto.getRandomValues(new Uint8Array(5)), x => chars[x % chars.length]).join(''); }
export function seedHash(s: string) { let n = 2166136261; for (const c of s)
    n = Math.imul(n ^ c.charCodeAt(0), 16777619); return n >>> 0; }
export function random(seed: string) { let a = seedHash(seed); return () => { a += 0x6D2B79F5; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export function shuffle<T>(a: T[], rng: () => number) { const b = [...a]; for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
} return b; }
/** Untimed accuracy credit: every nearer miss earns at least as much as a farther miss. */
export function mapAccuracyPoints(correct: boolean, distance: number | null) {
    if (distance === null || !Number.isFinite(distance)) return 0;
    return correct ? 1000 : Math.round(900 * Math.exp(-Math.max(0, distance) / 1600));
}
