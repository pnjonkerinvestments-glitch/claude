import type { Env } from './types';
import { rows } from './db';

/**
 * 1.48: the questions these players answered in the last 30 days (newest first, at most `limit`), so a new game
 * prefers countries they have not just seen. Ids lose any "-repeat" suffix, so a repeated round counts as its base.
 */
export async function recentQuestionIds(env: Env, userIds: string[], limit = 300): Promise<string[]> {
    const ids = [...new Set(userIds.filter(Boolean))].slice(0, 12);
    if (!ids.length) return [];
    const found = await rows(env, `SELECT question_id FROM answers WHERE user_id IN (${ids.map(() => '?').join(',')}) AND created_at>? ORDER BY created_at DESC LIMIT ?`, ...ids, Date.now() - 30 * 86400000, limit);
    return [...new Set<string>(found.map((r: any) => String(r.question_id).split("-")[0]))];
}
