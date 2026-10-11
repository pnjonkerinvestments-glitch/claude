import { MAX_CARDS, mergeProgress, type Progress } from '../lib/learn';
import { AppError } from './auth';
import { one, run } from './db';
import type { Env, User } from './types';

/** Learn progress (1.38): one JSON map of cards per player; see lib/learn.ts for the cards and the merge. */
export async function learnProgress(env: Env, user: User): Promise<Progress> {
    const row: any = await one(env, 'SELECT data FROM learn_progress WHERE user_id=?', user.id);
    try { return mergeProgress(row ? JSON.parse(row.data) : {}, {}); } catch { return {}; }
}

/** Merges what the app sends with what is stored (per card the newest wins) and returns the result. */
export async function saveLearnProgress(env: Env, user: User, incoming: unknown): Promise<Progress> {
    if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) throw new AppError('INVALID_INPUT', 400);
    const now = Date.now(), cards = Object.entries(incoming as Record<string, any>);
    if (cards.length > MAX_CARDS) throw new AppError('INVALID_INPUT', 400);
    // A card from the future would win every later merge; clamp it to now.
    const clean = mergeProgress(Object.fromEntries(cards.map(([k, v]) => [k, v && typeof v === 'object' && v.t > now ? { ...v, t: now } : v])), {});
    const merged = mergeProgress(await learnProgress(env, user), clean);
    if (Object.keys(merged).length > MAX_CARDS) throw new AppError('INVALID_INPUT', 400);
    await run(env, 'INSERT INTO learn_progress(user_id,data,updated_at) VALUES (?,?,?) ON CONFLICT(user_id) DO UPDATE SET data=excluded.data,updated_at=excluded.updated_at', user.id, JSON.stringify(merged), now);
    return merged;
}
