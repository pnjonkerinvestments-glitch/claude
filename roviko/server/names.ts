import { one } from './db';
import { LUCIA_ID } from '../lib/lucia';
import type { Env } from './types';

/**
 * Usernames (1.33). An account's display name is also its username: friends add you by it. Comparison ignores
 * capitals and surrounding spaces. SQLite's lower() only folds A-Z, so the key is built the same way in SQL and
 * here (ASCII folding only); the SQL expression matches the index `users_name_key` (migration 0012).
 * Lucia is found by "lucia" whatever mark her stored name carries, and nobody else can take that name.
 */
export const NAME_KEY_SQL = 'lower(trim(name))';
export const LUCIA_KEY = 'lucia';
export function nameKey(name: string) {
    return name.trim().replace(/[A-Z]/g, c => c.toLowerCase());
}
/** The search key with Lucia's alien mark dropped, so "Lucia 👽" typed in full also finds her. */
export function searchKey(name: string) {
    return nameKey(name.replace(/[\u{1F47D}\u{1F916}]/gu, ''));
}
/** Whether another account (not a guest) already uses this name. */
export async function nameTaken(env: Env, name: string, exceptId: string) {
    if (searchKey(name) === LUCIA_KEY && exceptId !== LUCIA_ID) return true;
    return !!await one(env, 'SELECT id FROM users WHERE ' + NAME_KEY_SQL + '=? AND guest=0 AND id<>? LIMIT 1', nameKey(name), exceptId);
}
