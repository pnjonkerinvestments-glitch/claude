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
 * Since 1.54 run by the hourly scheduled task (worker/index.ts) four times a day, no longer with visits.
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
  await run(env, 'DELETE FROM player_reports WHERE reported_id NOT IN (SELECT id FROM users)');
  await run(env, 'DELETE FROM auth_sessions WHERE expires_at<?', now);
  await run(env, 'DELETE FROM multiplayer_rooms WHERE expires_at<?', now - 86400000);
  // 1.54: optional measurements older than 90 days (this ran with every measured event before), and rate-limit counters
  // whose minute is long over (they were never removed). In slices, so one run never holds the database for long.
  await run(env, 'DELETE FROM analytics_events WHERE created_at<?', now - 90 * 86400000);
  for (let i = 0; i < 40; i++) {
    const done = await run(env, 'DELETE FROM rate_limits WHERE key IN (SELECT key FROM rate_limits WHERE reset_at<? LIMIT 5000)', now - 3600000);
    if (!done.meta?.changes || done.meta.changes < 5000) break;
  }
}
