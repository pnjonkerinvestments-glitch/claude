import { nameAllowed } from '../lib/name-filter';
import { mergeProgress } from './merge-progress';
import { z } from 'zod';
import { one, run, batch } from './db';
import { nameTaken } from './names';
import type { Env, User } from './types';
export class AppError extends Error {
    constructor(public code: string, public status = 400) { super(code); }
}
export const hex = (bytes: ArrayBuffer) => Array.from(new Uint8Array(bytes), v => v.toString(16).padStart(2, '0')).join('');
export async function digest(s: string) { return hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))); }
export async function limit(env: Env, key: string, max = 60, window = 60000) { const now = Date.now(), bucket = Math.floor(now / window); const id = await digest(key + ':' + bucket); const r = await one(env, 'INSERT INTO rate_limits (key,count,reset_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count', id, (bucket + 1) * window); if (r.count > max)
    throw new AppError('TOO_MANY_REQUESTS', 429); }
export function cookieValue(req: Request, key = 'rv_session') { return req.headers.get('Cookie')?.split(';').map(v => v.trim()).find(v => v.startsWith(key + '='))?.slice(key.length + 1); }
export async function getUser(req: Request, env: Env): Promise<User | null> { const raw = cookieValue(req); if (!raw)
    return null; const user = await one(env, 'SELECT u.* FROM users u JOIN auth_sessions s ON s.user_id=u.id WHERE s.token=? AND s.expires_at>?', await digest(raw), Date.now()); if (user?.blocked)
    throw new AppError('ACCOUNT_BLOCKED', 403); return user; }
export async function requireUser(req: Request, env: Env) { const user = await getUser(req, env); if (!user)
    throw new AppError('SESSION_EXPIRED', 401); return user; }
/** An account may change its name once per NAME_LOCK_DAYS (1.29); guests choose freely. */
export const NAME_LOCK_DAYS = 30;
export function nameUnlocksAt(u: User) { return u.guest || !u.name_changed_at ? null : Number(u.name_changed_at) + NAME_LOCK_DAYS * 86400000; }
export function safeUser(u: User) { const unlock = nameUnlocksAt(u); return { id: u.id, name: u.name, avatar: u.avatar, guest: !!u.guest, email: u.email, emailVerified: !!u.email_verified, discoverable: !!u.discoverable, friendCode: u.id.slice(0, 8).toUpperCase(), nameLockedUntil: unlock && unlock > Date.now() ? unlock : null }; }
/** Sessions last 60 days and slide (1.35): a visit with less than 53 days left renews them, so a player who keeps
 * coming back is never logged out or turned into a new guest. At most one renewal write per session per week. */
export const SESSION_DAYS = 60, SESSION_RENEW_LEFT_DAYS = 53;
export async function renewSession(req: Request, env: Env) {
    const raw = cookieValue(req); if (!raw) return '';
    const token = await digest(raw), now = Date.now(), until = now + SESSION_DAYS * 86400000;
    const done = await run(env, 'UPDATE auth_sessions SET expires_at=? WHERE token=? AND expires_at>? AND expires_at<?', until, token, now, now + SESSION_RENEW_LEFT_DAYS * 86400000);
    return done.meta.changes ? sessionCookie(req, raw) : '';
}
export function sessionCookie(req: Request, token: string, maxAge = SESSION_DAYS * 86400) { return `rv_session=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAge}${new URL(req.url).protocol === 'https:' ? '; Secure' : ''}`; }
export async function newSession(req: Request, env: Env, userId: string) { const token = crypto.randomUUID() + crypto.randomUUID(); await run(env, 'INSERT INTO auth_sessions(token,user_id,expires_at) VALUES (?,?,?)', await digest(token), userId, Date.now() + SESSION_DAYS * 86400000); return sessionCookie(req, token); }
// Guests get a friendly name ("Curious Fox 18") instead of a code; they can change it once they have an account.
const ADJECTIVES = ['Curious', 'Brave', 'Swift', 'Sunny', 'Clever', 'Bold', 'Calm', 'Lucky', 'Jolly', 'Nimble', 'Witty', 'Merry', 'Keen', 'Bright', 'Gentle', 'Quick'];
const ANIMALS = ['Fox', 'Owl', 'Otter', 'Panda', 'Koala', 'Falcon', 'Dolphin', 'Lynx', 'Turtle', 'Robin', 'Heron', 'Puffin', 'Badger', 'Gecko', 'Llama', 'Hare'];
export function guestName() { const r = crypto.getRandomValues(new Uint8Array(3)); return ADJECTIVES[r[0] % ADJECTIVES.length] + ' ' + ANIMALS[r[1] % ANIMALS.length] + ' ' + (10 + r[2] % 90); }
export async function guest(req: Request, env: Env) { await limit(env, 'guest:' + (req.headers.get('CF-Connecting-IP') ?? 'local'), 80); const id = crypto.randomUUID(); const name = guestName(); await run(env, 'INSERT INTO users(id,name,avatar,created_at) VALUES (?,?,?,?)', id, name, 0, Date.now()); return { user: await one(env, 'SELECT * FROM users WHERE id=?', id), cookie: await newSession(req, env, id) }; }
// Names are the only player text others see: allowed characters only, and the EN/NL/ES filter in lib/name-filter.ts.
export const nameSchema = z.string().trim().min(2).max(24).refine(v => /^[\p{L}\p{N} _.-]+$/u.test(v) && nameAllowed(v), 'NAME_INVALID');
export const passwordSchema = z.string().min(8).max(128);
const credentials = z.object({ email: z.string().email().max(254).transform(v => v.toLowerCase().trim()), password: passwordSchema, name: nameSchema.optional(), locale: z.enum(['en', 'nl', 'es']).optional(), avatar: z.number().int().min(0).max(7).optional() });
export async function hashPassword(password: string, salt: string) { const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']); return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 100000, hash: 'SHA-256' }, key, 256)); }
export async function auth(req: Request, env: Env, body: any, signup: boolean) {
    await limit(env, 'auth:' + (req.headers.get('CF-Connecting-IP') ?? 'local'), 12, 600000);
    const v = credentials.parse(body);
    if (signup) {
        if (await one(env, 'SELECT id FROM users WHERE email=?', v.email))
            throw new AppError('EMAIL_UNAVAILABLE', 409);
        let user = await getUser(req, env);
        if (user && !user.guest)
            throw new AppError('ALREADY_SIGNED_IN', 409);
        if (!user)
            user = (await guest(req, env)).user;
        // 1.33: the name is the username friends add you by, so a new account needs a name nobody else has.
        if (v.name && await nameTaken(env, v.name, user!.id))
            throw new AppError('NAME_TAKEN', 409);
        const salt = crypto.randomUUID();
        // The name chosen at sign-up counts as a change: the next one is possible after NAME_LOCK_DAYS.
        // 1.37: the Roviko chosen at sign-up becomes the avatar.
        await run(env, 'UPDATE users SET email=?,password=?,name=?,avatar=?,guest=0,name_changed_at=? WHERE id=?', v.email, salt + ':' + await hashPassword(v.password, salt), v.name ?? user!.name, v.avatar ?? user!.avatar ?? 0, v.name ? Date.now() : null, user!.id);
        return { cookie: await newSession(req, env, user!.id), user: safeUser(await one(env, 'SELECT * FROM users WHERE id=?', user!.id)) };
    }
    const u = await one(env, 'SELECT * FROM users WHERE email=?', v.email);
    const [salt, expected] = (u?.password ?? 'dummy:').split(':');
    const actual = await hashPassword(v.password, salt);
    let diff = actual.length ^ expected.length;
    for (let i = 0; i < actual.length; i++)
        diff |= actual.charCodeAt(i) ^ (expected.charCodeAt(i) || 0);
    if (!u || diff || u.blocked)
        throw new AppError('INVALID_CREDENTIALS', 401);
    await mergeProgress(env, await getUser(req, env), u.id);
    return { cookie: await newSession(req, env, u.id), user: safeUser(u) };
}
export function checkOrigin(req: Request) { const origin = req.headers.get('Origin'); if (origin && origin !== new URL(req.url).origin)
    throw new AppError('ORIGIN_NOT_ALLOWED', 403); }
export function admin(env: Env, user: User) { if (!env.ADMIN_USER_IDS?.split(',').map(v => v.trim()).includes(user.id))
    throw new AppError('FORBIDDEN', 403); }
