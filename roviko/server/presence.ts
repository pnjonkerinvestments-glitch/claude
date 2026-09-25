import type { Env, User } from './types';
import { AppError, limit } from './auth';
import { one, rows, run } from './db';

/** A friend counts as online when their open Roviko tab checked in within this window. */
export const ONLINE_WINDOW = 90_000;
/** Invites stay visible for a quarter of an hour; rooms themselves expire after 30 idle minutes. */
export const INVITE_TTL = 15 * 60_000;

const isFriend = (env: Env, a: string, b: string) => one(env, "SELECT id FROM friend_requests WHERE status='accepted' AND ((from_id=? AND to_id=?) OR (from_id=? AND to_id=?))", a, b, b, a);

/**
 * Heartbeat from an open tab: remember that this player is around (and in which room),
 * and hand back the room invites that are still waiting for them.
 */
export async function heartbeat(env: Env, user: User, roomCode?: string | null) {
  if (user.guest) return { invites: [] };
  const now = Date.now();
  const room = roomCode && /^[A-Z2-9]{5}$/.test(roomCode) ? roomCode : null;
  await run(env, 'INSERT INTO user_presence(user_id,last_seen,room_code) VALUES (?,?,?) ON CONFLICT(user_id) DO UPDATE SET last_seen=excluded.last_seen,room_code=excluded.room_code', user.id, now, room);
  const invites = await rows(env, `SELECT i.id,i.room_code code,i.created_at,u.name,u.avatar FROM room_invites i JOIN users u ON u.id=i.from_id
    WHERE i.to_id=? AND i.status='pending' AND i.created_at>? ORDER BY i.created_at DESC LIMIT 3`, user.id, now - INVITE_TTL);
  return { invites };
}

/** Invite an accepted friend into a room you are in. Re-inviting refreshes the same invite instead of piling up new ones. */
export async function inviteFriend(env: Env, user: User, code: string, friendId: string) {
  if (user.guest) throw new AppError('ACCOUNT_REQUIRED', 403);
  if (!/^[A-Z2-9]{5}$/.test(code)) throw new AppError('INVALID_ROOM_CODE');
  await limit(env, 'invite:' + user.id, 30, 3600000);
  const row = await one(env, 'SELECT state,expires_at FROM multiplayer_rooms WHERE code=?', code);
  if (!row) throw new AppError('ROOM_NOT_FOUND', 404);
  if (row.expires_at < Date.now()) throw new AppError('ROOM_EXPIRED', 410);
  const state = JSON.parse(row.state) as { players: { id: string }[] };
  if (!state.players.some(p => p.id === user.id)) throw new AppError('NOT_IN_ROOM', 403);
  if (state.players.length >= 12) throw new AppError('ROOM_FULL', 409);
  if (friendId === user.id || !await isFriend(env, user.id, friendId)) throw new AppError('FORBIDDEN', 403);
  const now = Date.now();
  await run(env, `INSERT INTO room_invites(id,from_id,to_id,room_code,status,created_at) VALUES (?,?,?,?, 'pending', ?)
    ON CONFLICT(from_id,to_id,room_code) DO UPDATE SET status='pending',created_at=excluded.created_at`, crypto.randomUUID(), user.id, friendId, code, now);
  return { ok: true };
}

/** Accept (the client then joins the room) or dismiss an invite addressed to you. */
export async function answerInvite(env: Env, user: User, id: string, status: string) {
  if (!['accepted', 'dismissed'].includes(status)) throw new AppError('INVALID_INPUT');
  const invite = await one(env, 'SELECT id,room_code FROM room_invites WHERE id=? AND to_id=?', id, user.id);
  if (!invite) throw new AppError('NOT_FOUND', 404);
  await run(env, 'UPDATE room_invites SET status=? WHERE id=?', status, id);
  return { ok: true, code: invite.room_code };
}
