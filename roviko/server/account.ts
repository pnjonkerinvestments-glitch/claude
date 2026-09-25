import { z } from 'zod';
import { one, run, batch } from './db';
import { AppError, digest, hashPassword, limit, passwordSchema } from './auth';
import type { Env, User } from './types';

// Account email: verify the address and reset a forgotten password with one-time links.
// Links are sent through Resend when RESEND_API_KEY is set; without it the features report
// MAIL_UNAVAILABLE and the account page hides them. Only a hash of each token is stored.

const HOUR = 3600000;
export function mailEnabled(env: Env) { return !!env.RESEND_API_KEY; }

async function sendMail(env: Env, to: string, subject: string, text: string) {
  if (!env.RESEND_API_KEY) throw new AppError('MAIL_UNAVAILABLE', 503);
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env.MAIL_FROM ?? 'Roviko <hello@roviko.app>', to: [to], subject, text }),
  });
  if (!r.ok) throw new AppError('MAIL_FAILED', 502);
}

async function newToken(env: Env, user: User, kind: 'verify' | 'reset', email: string, ttl: number) {
  const token = crypto.randomUUID() + crypto.randomUUID();
  await batch(env, [
    { sql: 'DELETE FROM email_tokens WHERE user_id=? AND kind=?', args: [user.id, kind] },
    { sql: 'INSERT INTO email_tokens(token,user_id,kind,email,expires_at,created_at) VALUES (?,?,?,?,?,?)', args: [await digest(token), user.id, kind, email, Date.now() + ttl, Date.now()] },
  ]);
  return token;
}

async function useToken(env: Env, token: string, kind: string) {
  const row = await one(env, 'DELETE FROM email_tokens WHERE token=? AND kind=? RETURNING user_id,email,expires_at', await digest(token), kind);
  if (!row || row.expires_at < Date.now()) throw new AppError('LINK_EXPIRED', 400);
  return row as { user_id: string; email: string };
}

/** Sends a link that confirms the account's email address. */
export async function sendVerification(req: Request, env: Env, user: User) {
  if (user.guest || !user.email) throw new AppError('ACCOUNT_REQUIRED', 403);
  if (user.email_verified) return { ok: true, verified: true };
  await limit(env, 'verify:' + user.id, 3, HOUR);
  const token = await newToken(env, user, 'verify', user.email, 48 * HOUR);
  const link = new URL(req.url).origin + '/api/auth/verify?token=' + token;
  await sendMail(env, user.email, 'Confirm your email for Roviko',
    `Hi ${user.name},\n\nTap this link to confirm your email address for Roviko:\n${link}\n\nThe link works for 48 hours. Did not ask for this? Then you can ignore this email.\n\nRoviko`);
  return { ok: true };
}

/** The link from the email: marks the address verified and opens the account page. */
export async function verifyEmail(env: Env, url: URL) {
  let ok = true;
  try {
    const row = await useToken(env, url.searchParams.get('token') ?? '', 'verify');
    await run(env, 'UPDATE users SET email_verified=1 WHERE id=? AND email=?', row.user_id, row.email);
  } catch { ok = false; }
  return new Response(null, { status: 302, headers: { Location: '/account?verified=' + (ok ? '1' : '0') } });
}

/** Sends a reset link if an account uses this email. Always answers the same, so it never reveals who has an account. */
export async function requestReset(req: Request, env: Env, body: unknown) {
  const { email } = z.object({ email: z.string().email().max(254).transform(v => v.toLowerCase().trim()) }).parse(body);
  await limit(env, 'reset:' + (req.headers.get('CF-Connecting-IP') ?? 'local'), 5, HOUR);
  if (!mailEnabled(env)) throw new AppError('MAIL_UNAVAILABLE', 503);
  const user = await one(env, 'SELECT * FROM users WHERE email=? AND guest=0 AND blocked=0', email) as User | null;
  if (user) {
    const token = await newToken(env, user, 'reset', email, HOUR);
    const link = new URL(req.url).origin + '/account?reset=' + token;
    await sendMail(env, email, 'Reset your Roviko password',
      `Hi ${user.name},\n\nTap this link to choose a new password for Roviko:\n${link}\n\nThe link works for one hour. Did not ask for this? Then your password stays the same and you can ignore this email.\n\nRoviko`);
  }
  return { ok: true };
}

/** Sets a new password from a reset link and signs out every other session. */
export async function resetPassword(req: Request, env: Env, body: unknown) {
  const v = z.object({ token: z.string().min(20).max(200), password: passwordSchema }).parse(body);
  await limit(env, 'reset-use:' + (req.headers.get('CF-Connecting-IP') ?? 'local'), 10, HOUR);
  const row = await useToken(env, v.token, 'reset');
  const salt = crypto.randomUUID();
  // The link proves the player can read this inbox, so the address counts as verified too.
  await batch(env, [
    { sql: 'UPDATE users SET password=?, email_verified=1 WHERE id=? AND email=?', args: [salt + ':' + await hashPassword(v.password, salt), row.user_id, row.email] },
    { sql: 'DELETE FROM auth_sessions WHERE user_id=?', args: [row.user_id] },
  ]);
  return { ok: true };
}

/** Change the password while signed in: needs the current one. */
export async function changePassword(req: Request, env: Env, user: User, body: unknown) {
  const v = z.object({ current: z.string().max(128), password: passwordSchema }).parse(body);
  await limit(env, 'password:' + user.id, 8, HOUR);
  const full = await one(env, 'SELECT password FROM users WHERE id=?', user.id);
  if (full?.password) {
    const [salt, expected] = String(full.password).split(':');
    if (await hashPassword(v.current, salt) !== expected) throw new AppError('INVALID_CREDENTIALS', 401);
  }
  const salt = crypto.randomUUID();
  await run(env, 'UPDATE users SET password=? WHERE id=?', salt + ':' + await hashPassword(v.password, salt), user.id);
  return { ok: true };
}
