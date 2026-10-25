import { z } from 'zod';
import type { Env, User } from './types';
import { AppError, digest, limit } from './auth';
import { batch, one, rows, run } from './db';
import { mailEnabled, sendMail } from './account';
import { streakWithFreezes } from '../lib/streak';
import { LUCIA_ID } from '../lib/lucia';
import { BRAND } from '../lib/config';
import type { MailLocale } from './welcome-mail';

/**
 * 1.51 · the daily reminder by email for website players (the app has its own notifications). Only accounts with a
 * confirmed address, only when the player turned it on, at most one mail a day, and only when there is a streak of
 * 2 days or more that ends tonight because today has not been played yet. Every mail has a one-tap unsubscribe link
 * (a one-time token, only its hash is stored, like the other mail links). Without RESEND_API_KEY nothing is sent.
 */
const DAY = 86400000;
/** Resend's free plan allows 100 mails a day; stay under it, the welcome and reset mails need room too. */
export const REMINDER_DAILY_CAP = 80;
const SITE = () => BRAND.url || 'https://roviko.app';

type Copy = { subject: string; hello: string; body: string; button: string; why: string; off: string };
const COPY: Record<MailLocale, Copy> = {
  nl: { subject: 'Je reeks van {n} dagen wacht op je 🔥', hello: 'Hoi {name},', body: 'Je hebt vandaag nog niet gespeeld. Eén spelletje is genoeg om je reeks van {n} dagen vast te houden.', button: 'Speel nu', why: 'Je krijgt deze mail omdat je de dagelijkse herinnering aanzette. Hooguit één per dag.', off: 'Geen herinneringen meer? Zet ze met één tik uit' },
  en: { subject: 'Your {n}-day streak is waiting for you 🔥', hello: 'Hi {name},', body: 'You have not played today yet. One game is enough to keep your {n}-day streak going.', button: 'Play now', why: 'You get this email because you turned on the daily reminder. At most one a day.', off: 'No more reminders? Turn them off with one tap' },
  es: { subject: 'Tu racha de {n} días te espera 🔥', hello: 'Hola, {name}:', body: 'Hoy todavía no has jugado. Un solo juego basta para mantener tu racha de {n} días.', button: 'Jugar ahora', why: 'Recibes este correo porque activaste el recordatorio diario. Como mucho uno al día.', off: '¿No quieres más recordatorios? Desactívalos con un toque' },
};
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** The reminder as subject, text and HTML, in the same plain style as the welcome mail (no tracking, no fonts). */
export function reminderMail(locale: MailLocale, input: { name: string; streak: number; play: string; off: string; origin: string }) {
  const c = COPY[locale] ?? COPY.en, n = String(input.streak);
  const subject = c.subject.replace('{n}', n), hello = c.hello.replace('{name}', input.name), body = c.body.replace('{n}', n);
  const text = [hello, '', body, '', c.button + ': ' + input.play, '', c.why, c.off + ': ' + input.off, '', 'Roviko'].join('\n');
  const html = `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:#f5f0e3;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0e3;"><tr><td align="center" style="padding:28px 14px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:24px;overflow:hidden;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#163b32;">
<tr><td align="center" style="padding:30px 24px 6px;"><img src="${input.origin}/icon-192.png" width="64" height="64" alt="Roviko" style="display:block;border:0;border-radius:16px;"></td></tr>
<tr><td align="center" style="padding:8px 28px 4px;font-size:44px;line-height:1;">🔥</td></tr>
<tr><td align="center" style="padding:6px 28px 0;font-size:16px;line-height:1.55;">
<p style="margin:0 0 8px;font-size:20px;font-weight:800;">${esc(hello)}</p>
<p style="margin:0 0 22px;">${esc(body)}</p>
<table role="presentation" cellpadding="0" cellspacing="0" align="center"><tr><td align="center" style="border-radius:999px;background:#163b32;">
<a href="${esc(input.play)}" style="display:inline-block;padding:15px 34px;font-size:17px;font-weight:800;color:#ffffff;text-decoration:none;border-radius:999px;">${esc(c.button)}</a>
</td></tr></table>
<p style="margin:22px 0 26px;">Roviko 🌍</p>
</td></tr>
<tr><td style="padding:16px 28px 24px;border-top:1px solid #eee6d2;font-size:12px;line-height:1.5;color:#7a8a84;">
${esc(c.why)}<br><a href="${esc(input.off)}" style="color:#1f806b;">${esc(c.off)}</a>
</td></tr>
</table></td></tr></table></body></html>`;
  return { subject, text, html };
}

/** The player's own setting: whether it can be used (confirmed email, mail set up) and whether it is on. */
export async function reminderState(env: Env, user: User) {
  const row = user.guest ? null : await one(env, 'SELECT enabled FROM email_reminders WHERE user_id=?', user.id);
  return { available: !user.guest && !!user.email && !!user.email_verified && mailEnabled(env), verified: !!user.email_verified, on: !!row?.enabled };
}

/** Turn the reminder on or off. On needs an account with a confirmed address. */
export async function setReminder(env: Env, user: User, body: unknown) {
  const b = z.object({ on: z.boolean(), locale: z.enum(['en', 'nl', 'es']).optional() }).parse(body);
  if (user.guest || !user.email) throw new AppError('ACCOUNT_REQUIRED', 403);
  if (b.on && !user.email_verified) throw new AppError('EMAIL_NOT_VERIFIED', 403);
  if (b.on && !mailEnabled(env)) throw new AppError('MAIL_UNAVAILABLE', 503);
  await limit(env, 'reminder:' + user.id, 20, 3600000);
  await run(env, `INSERT INTO email_reminders(user_id,enabled,locale,updated_at) VALUES (?,?,?,?)
    ON CONFLICT(user_id) DO UPDATE SET enabled=excluded.enabled,locale=COALESCE(?,email_reminders.locale),updated_at=excluded.updated_at`, user.id, b.on ? 1 : 0, b.locale ?? 'en', Date.now(), b.locale ?? null);
  return reminderState(env, user);
}

/** The link in the mail (GET from a mail client, POST from a one-click unsubscribe): turns it off, no login needed. */
export async function unsubscribe(env: Env, token: string, method: string) {
  const row = token ? await one(env, "DELETE FROM email_tokens WHERE token=? AND kind='unsub' RETURNING user_id,expires_at", await digest(token)) : null;
  const ok = !!row && Number(row.expires_at) >= Date.now();
  if (ok) await run(env, 'UPDATE email_reminders SET enabled=0,updated_at=? WHERE user_id=?', Date.now(), row!.user_id);
  if (method === 'POST') return new Response(null, { status: ok ? 200 : 400 });
  return new Response(null, { status: 302, headers: { Location: '/settings?reminder=' + (ok ? 'off' : 'expired') } });
}

/**
 * Who gets a reminder today: reminder on, confirmed address, not blocked, no mail yet today, a streak of 2 or more that
 * is still alive (with shields and repairs, like the streak pill) and no daily game finished today.
 */
export async function reminderCandidates(env: Env, today: string) {
  const list = await rows(env, `SELECT r.user_id, r.locale, u.email, u.name FROM email_reminders r JOIN users u ON u.id=r.user_id
    WHERE r.enabled=1 AND u.email_verified=1 AND u.blocked=0 AND u.guest=0 AND u.email IS NOT NULL AND u.id<>? AND (r.last_sent IS NULL OR r.last_sent<>?)
    AND NOT EXISTS (SELECT 1 FROM daily_scores d WHERE d.user_id=r.user_id AND d.date=?)`, LUCIA_ID, today, today);
  if (!list.length) return [];
  const since = new Date(Date.parse(today + 'T00:00:00Z') - 400 * DAY).toISOString().slice(0, 10);
  const out: { user_id: string; email: string; name: string; locale: MailLocale; streak: number }[] = [];
  for (const r of list as any[]) {
    const [dates, repairs] = await Promise.all([
      rows(env, 'SELECT DISTINCT date FROM daily_scores WHERE user_id=? AND date>=?', r.user_id, since),
      rows(env, 'SELECT date FROM streak_repairs WHERE user_id=?', r.user_id)]);
    const streak = streakWithFreezes(dates.map((d: any) => String(d.date)), today, repairs.map((d: any) => String(d.date))).streak;
    if (streak >= 2) out.push({ user_id: r.user_id, email: r.email, name: r.name, locale: (['nl', 'es'].includes(r.locale) ? r.locale : 'en') as MailLocale, streak });
  }
  return out;
}

/** The daily run (Cron Trigger, 17:00 UTC): sends at most REMINDER_DAILY_CAP mails and counts them per day. */
export async function sendReminders(env: Env, now = Date.now()) {
  const today = new Date(now).toISOString().slice(0, 10);
  if (!mailEnabled(env)) return { today, candidates: 0, sent: 0, skipped: 'no-mail' };
  const done = Number((await one(env, 'SELECT sent FROM email_reminder_log WHERE day=?', today))?.sent ?? 0);
  const list = (await reminderCandidates(env, today)).slice(0, Math.max(0, REMINDER_DAILY_CAP - done));
  let sent = 0;
  for (const c of list) {
    // Claim the day first: a second run the same day never mails this player again.
    const claim = await run(env, 'UPDATE email_reminders SET last_sent=? WHERE user_id=? AND (last_sent IS NULL OR last_sent<>?)', today, c.user_id, today);
    if (!claim.meta?.changes) continue;
    const token = crypto.randomUUID() + crypto.randomUUID();
    await batch(env, [
      { sql: "DELETE FROM email_tokens WHERE user_id=? AND kind='unsub'", args: [c.user_id] },
      { sql: "INSERT INTO email_tokens(token,user_id,kind,email,expires_at,created_at) VALUES (?,?,'unsub',?,?,?)", args: [await digest(token), c.user_id, c.email, now + 60 * DAY, now] },
    ]);
    const origin = SITE(), off = origin + '/api/reminders/unsubscribe?token=' + token;
    const mail = reminderMail(c.locale, { name: c.name, streak: c.streak, play: origin + '/?from=reminder', off, origin });
    try {
      await sendMail(env, c.email, mail.subject, mail.text, mail.html, { 'List-Unsubscribe': '<' + off + '>', 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' });
      sent++;
    } catch { /* this one is skipped today; the claim stays, so nobody gets two */ }
  }
  if (sent) await run(env, 'INSERT INTO email_reminder_log(day,sent) VALUES (?,?) ON CONFLICT(day) DO UPDATE SET sent=sent+excluded.sent', today, sent);
  return { today, candidates: list.length, sent };
}
