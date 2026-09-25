import { z } from 'zod';
import { AppError, limit } from './auth';
import { one, rows, run, batch } from './db';
import type { Env, User } from './types';

/** Why a player can be reported. No free text: nothing new for others to read or moderate. */
export const REPORT_REASONS = ['name', 'cheating', 'behaviour', 'other'] as const;

/** True when either player blocked the other. */
export async function blockedBetween(env: Env, a: string, b: string) {
  return !!await one(env, 'SELECT 1 x FROM player_blocks WHERE (blocker_id=? AND blocked_id=?) OR (blocker_id=? AND blocked_id=?)', a, b, b, a);
}
/** Everyone this player blocked or was blocked by, for filtering rooms and matches. */
export async function blockedIds(env: Env, userId: string) {
  const list = await rows(env, 'SELECT blocked_id id FROM player_blocks WHERE blocker_id=? UNION SELECT blocker_id id FROM player_blocks WHERE blocked_id=?', userId, userId);
  return new Set(list.map((r: any) => String(r.id)));
}

async function target(env: Env, user: User, id: unknown) {
  const targetId = z.string().min(1).max(64).parse(id);
  if (targetId === user.id || targetId.startsWith('bot-')) throw new AppError('INVALID_INPUT');
  const t = await one(env, 'SELECT id,name FROM users WHERE id=?', targetId);
  if (!t) throw new AppError('NOT_FOUND', 404);
  return t as { id: string; name: string };
}

/** Block a player: you are never matched, invited or shown online to each other again. Also ends a friendship. */
export async function blockPlayer(env: Env, user: User, id: unknown) {
  await limit(env, 'block:' + user.id, 60, 86400000);
  const t = await target(env, user, id);
  await batch(env, [
    { sql: 'INSERT OR IGNORE INTO player_blocks(blocker_id,blocked_id,created_at) VALUES (?,?,?)', args: [user.id, t.id, Date.now()] },
    { sql: 'DELETE FROM friend_requests WHERE (from_id=? AND to_id=?) OR (from_id=? AND to_id=?)', args: [user.id, t.id, t.id, user.id] },
    { sql: 'DELETE FROM room_invites WHERE (from_id=? AND to_id=?) OR (from_id=? AND to_id=?)', args: [user.id, t.id, t.id, user.id] },
  ]);
  return { ok: true };
}
export async function unblockPlayer(env: Env, user: User, id: unknown) {
  await run(env, 'DELETE FROM player_blocks WHERE blocker_id=? AND blocked_id=?', user.id, z.string().max(64).parse(id));
  return { ok: true };
}
export async function listBlocks(env: Env, user: User) {
  return { blocked: await rows(env, 'SELECT u.id,u.name,u.avatar,b.created_at FROM player_blocks b JOIN users u ON u.id=b.blocked_id WHERE b.blocker_id=? ORDER BY b.created_at DESC', user.id) };
}

/** Report a player to the owner, who reviews reports in /admin (see docs/MODERATIE.md). */
export async function reportPlayer(env: Env, user: User, id: unknown, input: unknown) {
  await limit(env, 'report:' + user.id, 20, 86400000);
  const t = await target(env, user, id);
  const b = z.object({ reason: z.enum(REPORT_REASONS), room: z.string().regex(/^[A-Z2-9]{5}$/).nullish() }).parse(input ?? {});
  await run(env, 'INSERT INTO player_reports(id,reporter_id,reported_id,reported_name,reason,room_code,status,created_at) VALUES (?,?,?,?,?,?,?,?)', crypto.randomUUID(), user.id, t.id, t.name, b.reason, b.room ?? null, 'open', Date.now());
  return { ok: true };
}
