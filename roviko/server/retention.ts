import { run } from './db';
import type { Env } from './types';

/** Guest progress is deleted after this long without any game (see the privacy page). */
export const GUEST_RETENTION_MS = 365 * 86400000;
const EVERY_MS = 6 * 3600000;
let lastRun = 0;

/**
 * Housekeeping behind the privacy promises: guests with no game and no valid session for a year,
 * expired sign-in sessions and rooms that expired a day ago. Their results, answers and scores
 * go with them through the foreign keys. Accounts are only deleted by their owner.
 * Runs at most every six hours per instance, piggybacking on normal traffic.
 */
export async function pruneExpired(env: Env, now = Date.now(), force = false) {
  if (!force && now - lastRun < EVERY_MS) return;
  lastRun = now;
  const cutoff = now - GUEST_RETENTION_MS;
  await run(env, `DELETE FROM question_reports WHERE user_id IN (SELECT id FROM users u WHERE u.guest=1 AND u.created_at<?
    AND NOT EXISTS (SELECT 1 FROM game_sessions g WHERE g.user_id=u.id AND g.created_at>=?)
    AND NOT EXISTS (SELECT 1 FROM auth_sessions s WHERE s.user_id=u.id AND s.expires_at>=?))`, cutoff, cutoff, now);
  await run(env, `DELETE FROM users WHERE guest=1 AND created_at<?
    AND NOT EXISTS (SELECT 1 FROM game_sessions g WHERE g.user_id=users.id AND g.created_at>=?)
    AND NOT EXISTS (SELECT 1 FROM auth_sessions s WHERE s.user_id=users.id AND s.expires_at>=?)`, cutoff, cutoff, now);
  await run(env, 'DELETE FROM auth_sessions WHERE expires_at<?', now);
  await run(env, 'DELETE FROM multiplayer_rooms WHERE expires_at<?', now - 86400000);
}
