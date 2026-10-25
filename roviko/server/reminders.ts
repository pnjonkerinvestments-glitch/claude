import { z } from 'zod';
import type { Env, User } from './types';
import { AppError, digest, limit } from './auth';
import { batch, one, rows, run } from './db';
import { mailEnabled, sendMail } from './account';
import { streakWithFreezes } from '../lib/streak';
import { LUCIA_ID } from '../lib/lucia';
import { BRAND } from '../lib/config';
import type { MailLocale } from './welcome-mail';
import { REMINDER_COPY, REMINDER_FOOTER, type Stage } from './reminder-copy';

/**
 * 1.51 · the reminder by email for website players (the app has its own notifications). Only accounts with a
 * confirmed address, only when the player turned it on, at most one mail a day, and fewer and fewer the longer the
 * player stays away (see reminderStage), stopping after a month. Every mail has a one-tap unsubscribe link (a
 * one-time token, only its hash is stored, like the other mail links). Without RESEND_API_KEY nothing is sent.
 */
const DAY = 86400000;
/** Resend's free plan allows 100 mails a day; stay under it, the welcome and reset mails need room too. */
export const REMINDER_DAILY_CAP = 80;
const SITE = () => BRAND.url || 'https://roviko.app';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * 1.51 · when a mail goes out, counted in days since the last finished daily game (D): D 1 and 2 every day, D 7 once
 * (a week), D 30 once more (a month), then nothing until the player plays again, which starts the rhythm over.
 * We do not measure whether a mail was opened (no tracking pixels); coming back to play is the signal.
 * On D 1 and 2 a streak that is still alive (2 days or more, shields count) gets the streak mail.
 */
export function reminderStage(daysAway: number, streak: number): Stage | null {
  if (daysAway === 1 || daysAway === 2) return streak >= 2 ? 'streak' : daysAway === 1 ? 'lucia' : 'day2';
  if (daysAway === 7) return 'week';
  if (daysAway === 30) return 'month';
  return null;
}

/** 1.52: per step its own illustration (public/email/*.jpg, made from Roviko's own art) and accent colour. */
const LOOK: Record<Stage, { hero: string; tint: string; ink: string }> = {
  streak: { hero: 'streak', tint: '#fff1cf', ink: '#8a5a00' },
  lucia: { hero: 'lucia', tint: '#ede8ff', ink: '#4b3a9c' },
  day2: { hero: 'day2', tint: '#dff3ea', ink: '#1f6b57' },
  week: { hero: 'week', tint: '#fff3e2', ink: '#8a4b12' },
  month: { hero: 'month', tint: '#e7f0ff', ink: '#2c4f8a' },
};
const PILL: Record<MailLocale, (n: number) => string> = { nl: n => n + ' dagen op rij', en: n => n + ' days in a row', es: n => n + ' días seguidos' };
const SIGN: Record<MailLocale, { roviko: string; lucia: string; app: string }> = {
  nl: { roviko: 'Tot zo, Roviko', lucia: 'Groetjes van Lucia 👽 en Roviko', app: 'Speel in de app of op roviko.app' },
  en: { roviko: 'See you soon, Roviko', lucia: 'Greetings from Lucia 👽 and Roviko', app: 'Play in the app or at roviko.app' },
  es: { roviko: 'Hasta pronto, Roviko', lucia: 'Saludos de Lucia 👽 y Roviko', app: 'Juega en la app o en roviko.app' },
};

/** The mail as subject, text and HTML: a light, playful card in Roviko's style that works in Gmail, Outlook and Apple
 *  Mail (tables and inline styles, no web fonts, no tracking). `seed` picks the variant (the day number), so mails on
 *  following days read differently. */
export function reminderMail(locale: MailLocale, input: { name: string; streak: number; stage: Stage; seed: number; play: string; off: string; origin: string }) {
  const variants = (REMINDER_COPY[locale] ?? REMINDER_COPY.en)[input.stage], f = REMINDER_FOOTER[locale] ?? REMINDER_FOOTER.en;
  const v = variants[Math.abs(input.seed) % variants.length], look = LOOK[input.stage], sign = SIGN[locale] ?? SIGN.en;
  const fill = (s: string) => s.replace(/\{n\}/g, String(input.streak)).replace(/\{name\}/g, input.name);
  const subject = fill(v.subject), title = fill(v.title), body = fill(v.body), button = fill(v.button);
  const text = [title, '', body, '', button + ': ' + input.play, '', input.stage === 'lucia' ? sign.lucia : sign.roviko, '', f.why + ' ' + f.rhythm, f.off + ': ' + input.off].join('\n');
  const pill = input.stage === 'streak' ? `<tr><td align="center" style="padding:22px 28px 0;"><span style="display:inline-block;padding:8px 16px;border-radius:999px;background:${look.tint};color:${look.ink};font-size:15px;font-weight:800;">🔥 ${esc((PILL[locale] ?? PILL.en)(input.streak))}</span></td></tr>` : `<tr><td align="center" style="padding:22px 28px 0;font-size:34px;line-height:1;">${v.emoji}</td></tr>`;
  const font = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
  const html = `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:#f3eee1;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${esc(body)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3eee1;"><tr><td align="center" style="padding:24px 12px 32px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;font-family:${font};color:#163b32;">
<tr><td align="center" style="padding:0 0 16px;"><table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td style="padding-right:10px;"><img src="${input.origin}/icon-192.png" width="40" height="40" alt="" style="display:block;border:0;border-radius:12px;"></td>
<td style="font-size:24px;font-weight:900;letter-spacing:-.5px;color:#163b32;">roviko</td></tr></table></td></tr>
<tr><td style="background:#ffffff;border-radius:28px;overflow:hidden;box-shadow:0 10px 30px rgba(22,59,50,.10);">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding:0;line-height:0;font-size:0;"><a href="${esc(input.play)}"><img src="${input.origin}/email/${look.hero}.jpg" width="560" alt="" style="display:block;width:100%;max-width:560px;height:auto;border:0;border-radius:28px 28px 0 0;"></a></td></tr>
${pill}
<tr><td align="center" style="padding:14px 32px 0;"><h1 style="margin:0;font-size:28px;line-height:1.2;font-weight:800;color:#163b32;">${esc(title)}</h1></td></tr>
<tr><td align="center" style="padding:12px 34px 0;"><p style="margin:0;font-size:17px;line-height:1.55;color:#3f5a52;">${esc(body)}</p></td></tr>
<tr><td align="center" style="padding:26px 28px 10px;"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td align="center" style="border-radius:999px;background:#163b32;box-shadow:0 6px 0 #0d2a22;">
<a href="${esc(input.play)}" style="display:inline-block;padding:18px 40px;font-size:18px;font-weight:800;color:#ffffff;text-decoration:none;border-radius:999px;">${esc(button)} &rarr;</a></td></tr></table></td></tr>
<tr><td align="center" style="padding:6px 28px 0;font-size:13px;color:#7a8a84;">${esc(sign.app)}</td></tr>
<tr><td style="padding:26px 28px 28px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${look.tint};border-radius:18px;"><tr>
<td width="56" style="padding:12px 0 12px 14px;"><img src="${input.origin}/icon-192.png" width="42" height="42" alt="" style="display:block;border:0;border-radius:50%;"></td>
<td style="padding:12px 16px 12px 10px;font-size:15px;font-weight:700;color:${look.ink};">${esc(input.stage === 'lucia' ? sign.lucia : sign.roviko)} 🌍</td></tr></table></td></tr>
</table></td></tr>
<tr><td align="center" style="padding:20px 26px 0;font-size:12px;line-height:1.6;color:#8a978f;">${esc(f.why)} ${esc(f.rhythm)}<br><a href="${esc(input.off)}" style="color:#1f806b;">${esc(f.off)}</a><br>Roviko · Jonker Studios</td></tr>
</table></td></tr></table></body></html>`;
  return { subject, text, html };
}

/** 1.52: mails go out at this hour in the player's own time zone (daytime, before the evening). */
export const SEND_HOUR = 17;
const validZone = (tz: string) => { try { new Intl.DateTimeFormat('en', { timeZone: tz }); return true; } catch { return false; } };
/** The player's time zone, or a fair guess from their language when they never sent one. */
export const zoneFor = (tz: string | null | undefined, locale: string) => tz && validZone(tz) ? tz : locale === 'nl' ? 'Europe/Amsterdam' : locale === 'es' ? 'Europe/Madrid' : 'UTC';
/** The hour (0–23) at `now` in a time zone. */
export function localHour(tz: string, now: number) { return Number(new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', hourCycle: 'h23' }).format(new Date(now))) % 24; }

/** The player's own setting: whether it can be used (confirmed email, mail set up) and whether it is on. */
export async function reminderState(env: Env, user: User) {
  const row = user.guest ? null : await one(env, 'SELECT enabled FROM email_reminders WHERE user_id=?', user.id);
  return { available: !user.guest && !!user.email && !!user.email_verified && mailEnabled(env), verified: !!user.email_verified, on: !!row?.enabled };
}

/** Turn the reminder on or off. On needs an account with a confirmed address. */
export async function setReminder(env: Env, user: User, body: unknown) {
  const b = z.object({ on: z.boolean(), locale: z.enum(['en', 'nl', 'es']).optional(), tz: z.string().max(64).optional() }).parse(body);
  const tz = b.tz && validZone(b.tz) ? b.tz : null;
  if (user.guest || !user.email) throw new AppError('ACCOUNT_REQUIRED', 403);
  if (b.on && !user.email_verified) throw new AppError('EMAIL_NOT_VERIFIED', 403);
  if (b.on && !mailEnabled(env)) throw new AppError('MAIL_UNAVAILABLE', 503);
  await limit(env, 'reminder:' + user.id, 20, 3600000);
  await run(env, `INSERT INTO email_reminders(user_id,enabled,locale,tz,updated_at) VALUES (?,?,?,?,?)
    ON CONFLICT(user_id) DO UPDATE SET enabled=excluded.enabled,locale=COALESCE(?,email_reminders.locale),tz=COALESCE(?,email_reminders.tz),updated_at=excluded.updated_at`, user.id, b.on ? 1 : 0, b.locale ?? 'en', tz, Date.now(), b.locale ?? null, tz);
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
 * Who gets a reminder today: reminder on, confirmed address, not blocked, no mail yet today, no daily game finished
 * today, and a stage for the days since the last daily game (reminderStage). Never played at all: no mail.
 */
export async function reminderCandidates(env: Env, today: string, now = Date.now()) {
  const list = await rows(env, `SELECT r.user_id, r.locale, r.tz, u.email, u.name FROM email_reminders r JOIN users u ON u.id=r.user_id
    WHERE r.enabled=1 AND u.email_verified=1 AND u.blocked=0 AND u.guest=0 AND u.email IS NOT NULL AND u.id<>? AND (r.last_sent IS NULL OR r.last_sent<>?)
    AND NOT EXISTS (SELECT 1 FROM daily_scores d WHERE d.user_id=r.user_id AND d.date=?)`, LUCIA_ID, today, today);
  // 1.52: only the players for whom it is SEND_HOUR now, where they live (the cron runs every hour).
  const due = (list as any[]).filter(r => localHour(zoneFor(r.tz, r.locale), now) === SEND_HOUR);
  if (!due.length) return [];
  const since = new Date(Date.parse(today + 'T00:00:00Z') - 400 * DAY).toISOString().slice(0, 10);
  const out: { user_id: string; email: string; name: string; locale: MailLocale; streak: number; stage: Stage }[] = [];
  for (const r of due) {
    const [dates, repairs] = await Promise.all([
      rows(env, 'SELECT DISTINCT date FROM daily_scores WHERE user_id=? AND date>=?', r.user_id, since),
      rows(env, 'SELECT date FROM streak_repairs WHERE user_id=?', r.user_id)]);
    const played = dates.map((d: any) => String(d.date)).sort();
    if (!played.length) continue;
    const away = Math.round((Date.parse(today + 'T00:00:00Z') - Date.parse(played[played.length - 1] + 'T00:00:00Z')) / DAY);
    const streak = streakWithFreezes(played, today, repairs.map((d: any) => String(d.date))).streak;
    const stage = reminderStage(away, streak);
    if (stage) out.push({ user_id: r.user_id, email: r.email, name: r.name, locale: (['nl', 'es'].includes(r.locale) ? r.locale : 'en') as MailLocale, streak, stage });
  }
  return out;
}

/** The hourly run (Cron Trigger; 1.51 daily at 17:00 UTC, since 1.52 every hour for 17:00 local time): sends at most REMINDER_DAILY_CAP mails (streaks first) and counts them per day. */
export async function sendReminders(env: Env, now = Date.now()) {
  const today = new Date(now).toISOString().slice(0, 10);
  if (!mailEnabled(env)) return { today, candidates: 0, sent: 0, skipped: 'no-mail' };
  const done = Number((await one(env, 'SELECT sent FROM email_reminder_log WHERE day=?', today))?.sent ?? 0);
  const order: Stage[] = ['streak', 'lucia', 'day2', 'week', 'month'];
  const list = (await reminderCandidates(env, today, now)).sort((a, b) => order.indexOf(a.stage) - order.indexOf(b.stage)).slice(0, Math.max(0, REMINDER_DAILY_CAP - done));
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
    const mail = reminderMail(c.locale, { name: c.name, streak: c.streak, stage: c.stage, seed: Math.floor(now / DAY), play: origin + (c.stage === 'lucia' ? '/?lucia=1' : '/?from=reminder'), off, origin });
    try {
      await sendMail(env, c.email, mail.subject, mail.text, mail.html, { 'List-Unsubscribe': '<' + off + '>', 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' });
      sent++;
    } catch { /* this one is skipped today; the claim stays, so nobody gets two */ }
  }
  if (sent) await run(env, 'INSERT INTO email_reminder_log(day,sent) VALUES (?,?) ON CONFLICT(day) DO UPDATE SET sent=sent+excluded.sent', today, sent);
  return { today, candidates: list.length, sent };
}
