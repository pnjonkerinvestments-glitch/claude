import type { Env, User } from './types';
import { AppError, limit } from './auth';
import { one, rows, run } from './db';
import { LUCIA_ACCEPT_AFTER, LUCIA_ID, LUCIA_INVITE_AFTER, LUCIA_MAX_NOES, LUCIA_NAME } from '../lib/lucia';
import { createLuciaRoom, mutateRoom } from './multiplayer';
import { levelsFor } from './stats';
import { blockedBetween } from './moderation';

/** A friend counts as online when their open Roviko tab checked in within this window. */
export const ONLINE_WINDOW = 90_000;
/** Invites stay visible for half an hour (15 minutes before 1.41), as long as the room is still open to join. */
export const INVITE_TTL = 30 * 60_000;

const isFriend = (env: Env, a: string, b: string) => one(env, "SELECT id FROM friend_requests WHERE status='accepted' AND ((from_id=? AND to_id=?) OR (from_id=? AND to_id=?))", a, b, b, a);

/**
 * Heartbeat from an open tab: remember that this player is around (and in which room),
 * and hand back the room invites that are still waiting for them and how many friend requests wait.
 */
export async function heartbeat(env: Env, user: User, roomCode?: string | null, playing = false) {
  if (user.guest) return { invites: [], requests: 0 };
  const now = Date.now();
  const room = roomCode && /^[A-Z2-9]{5}$/.test(roomCode) ? roomCode : null;
  // 1.50: Lucia needs to know when this visit began, so the previous "last seen" is read before it moves on.
  const seen = await one(env, 'SELECT p.last_seen, l.user_id lucia, l.online_since FROM users u LEFT JOIN user_presence p ON p.user_id=u.id LEFT JOIN lucia_friends l ON l.user_id=u.id WHERE u.id=?', user.id);
  const since = !seen?.last_seen || now - Number(seen.last_seen) > ONLINE_WINDOW || !seen.online_since ? now : Number(seen.online_since);
  // 1.34: being seen and Lucia's turn run side by side; the invites and requests are read together after that.
  await Promise.all([
    run(env, 'INSERT INTO user_presence(user_id,last_seen,room_code) VALUES (?,?,?) ON CONFLICT(user_id) DO UPDATE SET last_seen=excluded.last_seen,room_code=excluded.room_code', user.id, now, room),
    (async () => {
      if (!seen?.lucia) await luciaBefriends(env, user.id, now).catch(() => { /* next check */ });
      else if (since !== Number(seen.online_since)) await run(env, 'UPDATE lucia_friends SET online_since=? WHERE user_id=?', since, user.id).catch(() => {});
      await luciaAccepts(env, user.id, now).catch(() => { /* next check */ });
      if (!room && !playing) await luciaInvites(env, user.id, now, since).catch(() => { /* Lucia waits for the next check */ });
    })(),
  ]);
  // 1.41: only invites into rooms you can still join (waiting room, not full, not expired), and a friend's invite
  // always before Lucia's, so her automatic invite never hides a real one.
  const [inviteRows, pending] = await Promise.all([rows(env, `SELECT i.id,i.room_code code,i.created_at,u.id from_id,u.name,u.avatar FROM room_invites i JOIN users u ON u.id=i.from_id
    JOIN multiplayer_rooms r ON r.code=i.room_code
    WHERE i.to_id=? AND i.status='pending' AND i.created_at>? AND r.expires_at>? AND json_extract(r.state,'$.phase')='lobby' AND COALESCE(json_array_length(r.state,'$.players'),0)<12
    ORDER BY (i.from_id=?) ASC, i.created_at DESC LIMIT 3`, user.id, now - INVITE_TTL, now, LUCIA_ID),
    // 1.28: friend requests waiting for you, for the red badge on the Multiplayer tab.
    one(env, "SELECT COUNT(*) n FROM friend_requests WHERE to_id=? AND status='pending'", user.id)]);
  // 1.37: who invites you, with their level (not for Lucia, a computer).
  const levels = inviteRows.length ? await levelsFor(env, inviteRows.map((i: any) => i.from_id).filter((id: string) => id !== LUCIA_ID)) : {};
  const invites = inviteRows.map((i: any) => ({ id: i.id, code: i.code, created_at: i.created_at, name: i.from_id === LUCIA_ID ? LUCIA_NAME : i.name, avatar: i.avatar, level: levels[i.from_id] ?? null, bot: i.from_id === LUCIA_ID }));
  const requests = Number(pending?.n ?? 0);
  return { invites, requests };
}

/** 1.42: a cheap read-only check (one indexed read, no writes) the app makes every few seconds, so a new invite
 * shows up within seconds instead of waiting for the next heartbeat. The app runs the full heartbeat when it changes. */
export async function inviteCheck(env: Env, user: User) {
  if (user.guest) return { n: 0, last: 0 };
  const r = await one(env, "SELECT COUNT(*) n, MAX(created_at) last FROM room_invites WHERE to_id=? AND status='pending' AND created_at>?", user.id, Date.now() - INVITE_TTL);
  return { n: Number(r?.n ?? 0), last: Number(r?.last ?? 0) };
}

/** Lucia accepts friend requests that have waited a minute (1.31). Cheap: one indexed update on the request pair. */
export async function luciaAccepts(env: Env, userId: string, now = Date.now()) {
  await run(env, "UPDATE friend_requests SET status='accepted' WHERE from_id=? AND to_id=? AND status='pending' AND created_at<=?", userId, LUCIA_ID, now - LUCIA_ACCEPT_AFTER);
}

/**
 * 1.50: every account has Lucia as a friend from the start (the owner's choice). Once per account: a player who
 * already has a friendship row with her (also one they ended), or who blocked her, keeps it that way.
 */
export async function luciaBefriends(env: Env, userId: string, now = Date.now()) {
  if (userId === LUCIA_ID) return;
  const known = await one(env, 'SELECT id FROM friend_requests WHERE (from_id=? AND to_id=?) OR (from_id=? AND to_id=?)', LUCIA_ID, userId, userId, LUCIA_ID);
  if (!known && !await blockedBetween(env, userId, LUCIA_ID))
    await run(env, "INSERT OR IGNORE INTO friend_requests(id,from_id,to_id,status,created_at) VALUES (?,?,?,'accepted',?)", [LUCIA_ID, userId].sort().join(':'), LUCIA_ID, userId, now);
  await run(env, 'INSERT OR IGNORE INTO lucia_friends(user_id,added_at,online_since) VALUES (?,?,?)', userId, now, now);
}

/** Befriend Lucia once, for pages that read the friend list before the first heartbeat. */
export async function ensureLucia(env: Env, userId: string) {
  if (!await one(env, 'SELECT user_id FROM lucia_friends WHERE user_id=?', userId)) await luciaBefriends(env, userId);
}

/**
 * Lucia invites a friend (1.30, calmer since 1.50): at most once per day (UTC), LUCIA_INVITE_AFTER after they came
 * online, never in a room or a game, never over a friend's invite. Her room: medium, 15 questions. An invite that
 * got no yes (declined or left unanswered) counts as a no; after LUCIA_MAX_NOES of those in a row she stops for
 * good. A yes starts the count again. We do not want to spam.
 */
async function luciaInvites(env: Env, userId: string, now: number, since: number) {
  if (now - since < LUCIA_INVITE_AFTER) return;
  const state = await one(env, 'SELECT last_day,last_invite,noes,stopped FROM lucia_friends WHERE user_id=?', userId);
  const today = new Date(now).toISOString().slice(0, 10);
  if (!state || state.stopped || state.last_day === today) return;
  if (!await isFriend(env, userId, LUCIA_ID)) return;
  // A friend's invite is waiting: Lucia does not cut in (1.41).
  if (await one(env, "SELECT id FROM room_invites WHERE to_id=? AND from_id<>? AND status='pending' AND created_at>? LIMIT 1", userId, LUCIA_ID, now - INVITE_TTL)) return;
  let noes = Number(state.noes) || 0;
  if (state.last_invite) {
    const last = await one(env, 'SELECT status FROM room_invites WHERE id=?', state.last_invite);
    noes = last?.status === 'accepted' ? 0 : noes + 1;
    // Yesterday's invite, if never answered, makes way for today's: never two of hers at once.
    if (last?.status === 'pending') await run(env, "UPDATE room_invites SET status='expired' WHERE id=?", state.last_invite);
  }
  if (noes >= LUCIA_MAX_NOES) { await run(env, 'UPDATE lucia_friends SET noes=?,stopped=1,last_invite=NULL WHERE user_id=?', noes, userId); return; }
  // Claim today first, so two checks at the same moment never send two invites.
  const claim = await run(env, 'UPDATE lucia_friends SET last_day=?,noes=?,last_invite=NULL WHERE user_id=? AND (last_day IS NULL OR last_day<>?) AND stopped=0', today, noes, userId, today);
  if (!claim.meta?.changes) return;
  const code = await createLuciaRoom(env), id = crypto.randomUUID();
  await run(env, `INSERT INTO room_invites(id,from_id,to_id,room_code,status,created_at) VALUES (?,?,?,?, 'pending', ?)
    ON CONFLICT(from_id,to_id,room_code) DO UPDATE SET status='pending',created_at=excluded.created_at`, id, LUCIA_ID, userId, code, now);
  await run(env, 'UPDATE lucia_friends SET last_invite=? WHERE user_id=?', id, userId);
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
  if (friendId === user.id || !await isFriend(env, user.id, friendId)) throw new AppError('NOT_FRIENDS', 403);
  // Lucia never keeps you waiting (1.30): she joins the room straight away as a medium computer player.
  if (friendId === LUCIA_ID) { await mutateRoom(env, code, user, 'luciaJoin'); return { ok: true, joined: true }; }
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
