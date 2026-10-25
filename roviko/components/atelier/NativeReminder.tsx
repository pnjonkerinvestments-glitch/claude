'use client';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { Bell, BellOff, Mail } from 'lucide-react';
import { api, post } from '@/lib/client';
import { Switch } from '@/components/ui/switch';
import { useApp } from '../app/context';

// Only rendered inside the Roviko iOS/Android app (Capacitor), where the native bridge exposes
// the LocalNotifications plugin on window.Capacitor. The website itself never asks for permission.
type Notifications = {
  requestPermissions(): Promise<{ display: string }>;
  schedule(options: unknown): Promise<unknown>;
  cancel(options: unknown): Promise<unknown>;
  addListener?(event: string, fn: (e: unknown) => void): Promise<{ remove(): void }> | { remove(): void };
};
type CapacitorGlobal = { isNativePlatform?: () => boolean; Plugins?: { LocalNotifications?: Notifications } };
const capacitor = () => (typeof window === 'undefined' ? undefined : (window as unknown as { Capacitor?: CapacitorGlobal }).Capacitor);
const plugin = () => capacitor()?.Plugins?.LocalNotifications;
const subscribe = () => () => {};
const isApp = () => !!capacitor()?.isNativePlatform?.() && !!plugin();

const HOUR = 18, KEY = 'roviko:reminder', TIMES = 'roviko:play-times';
// Older versions scheduled one weekly notification per weekday (ids 1001–1007). Since 1.39 the reminder is smart:
// one-off notifications for the next 7 days (ids 1101–1107), so it stops by itself after 7 days without a visit.
const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7], OLD_IDS = WEEKDAYS.map(d => ({ id: 1000 + d })), DAYS = 7, NEW_IDS = Array.from({ length: DAYS }, (_, i) => ({ id: 1101 + i }));
function readOn() { try { return localStorage.getItem(KEY) === 'on'; } catch { return false; } }
function writeOn(on: boolean) { try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch { /* the reminder still works for this session */ } }
function readTimes(): number[] { try { const v = JSON.parse(localStorage.getItem(TIMES) ?? '[]'); return Array.isArray(v) ? v.filter(Number.isFinite).slice(-14) : []; } catch { return []; } }
/** Remember when (minutes after local midnight) the player plays a daily game, at most once per day. */
export function rememberPlayTime(now = new Date()) {
  try {
    const day = now.toDateString(), last = localStorage.getItem(TIMES + ':day');
    if (last === day) return;
    localStorage.setItem(TIMES + ':day', day);
    localStorage.setItem(TIMES, JSON.stringify([...readTimes(), now.getHours() * 60 + now.getMinutes()].slice(-14)));
  } catch { /* no storage: the reminder keeps 18:00 */ }
}
/**
 * The time to remind (1.39): the player's usual play time (the median of the last two weeks), 30 minutes before
 * it, never later than an hour before the daily reset (00:00 UTC in local time), never before 9:00. 18:00 until
 * there is a habit.
 */
export function reminderMinute(times: number[], now = new Date()) {
  const sorted = [...times].sort((a, b) => a - b);
  let at = sorted.length >= 2 ? sorted[Math.floor(sorted.length / 2)] - 30 : HOUR * 60;
  const reset = new Date(now); reset.setUTCHours(24, 0, 0, 0);
  const resetMinute = (reset.getHours() * 60 + reset.getMinutes()) || 24 * 60;
  const latest = (resetMinute <= 9 * 60 ? 24 * 60 : resetMinute) - 60;
  return Math.max(9 * 60, Math.min(at, latest, 22 * 60));
}
/**
 * The text of the reminder on day i (1.50): on the one day the streak is really at stake (today if not played yet,
 * else tomorrow) and the streak is 2 days or more, it names the streak; otherwise the weekday line as before.
 */
export function reminderText(t: (k: string) => string, i: number, at: Date, playedToday: boolean, streak: number) {
  if (streak >= 2 && i === (playedToday ? 1 : 0)) return t('reminderStreak').replace('{n}', String(streak));
  return t('reminder' + (at.getDay() + 1));
}
/** One notification per day for the next 7 days, today only if the player has not played yet. */
export async function scheduleReminders(t: (k: string) => string, playedToday: boolean, now = new Date(), streak = 0) {
  const notifications = plugin();
  if (!notifications || !readOn()) return;
  const minute = reminderMinute(readTimes(), now);
  const list: unknown[] = [];
  for (let i = 0; i < DAYS; i++) {
    const at = new Date(now); at.setDate(at.getDate() + i); at.setHours(Math.floor(minute / 60), minute % 60, 0, 0);
    if (i === 0 && (playedToday || at.getTime() < now.getTime() + 5 * 60000)) continue;
    list.push({ id: 1101 + i, title: 'Roviko', body: reminderText(t, i, at, playedToday, streak), schedule: { at, allowWhileIdle: false } });
  }
  await notifications.cancel({ notifications: [...OLD_IDS, ...NEW_IDS] });
  if (list.length) await notifications.schedule({ notifications: list });
}
/** Keeps the reminders right whenever the app opens or a daily game is played (1.39), with the streak in the text (1.50). */
export function useSmartReminder(t: (k: string) => string, ready: boolean, playedToday: boolean, streak = 0, open?: () => void) {
  useEffect(() => {
    if (!ready || !isApp()) return;
    if (playedToday) rememberPlayTime();
    scheduleReminders(t, playedToday, new Date(), streak).catch(() => {});
  }, [ready, playedToday, streak]); // eslint-disable-line react-hooks/exhaustive-deps
  // 1.50: a tap on the reminder opens today's games (the home screen), wherever the app was left.
  useEffect(() => {
    const notifications = plugin();
    if (!open || !isApp() || !notifications?.addListener) return;
    let handle: { remove(): void } | undefined, gone = false;
    Promise.resolve(notifications.addListener('localNotificationActionPerformed', () => open())).then(h => { if (gone) h.remove(); else handle = h; }).catch(() => {});
    return () => { gone = true; handle?.remove(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}

const ASKS = 'roviko:reminder-asks', MAX_ASKS = 2;
function readAsks(): { n: number; day: string } { try { const v = JSON.parse(localStorage.getItem(ASKS) ?? '{}'); return { n: Number(v.n) || 0, day: String(v.day ?? '') }; } catch { return { n: MAX_ASKS, day: '' }; } }
/**
 * 1.50: the app offers the reminder at the moment it makes sense, right after a daily game grew the streak, instead
 * of only in Settings. At most twice, never twice on one day, never once it is on; a no is respected.
 * 1.51: on the website the same moment offers the reminder by email, for accounts with a confirmed address (only
 * when mail is set up and the email reminder is not on yet).
 */
export function useReminderOffer(date: string, open = true) {
  const app = useApp();
  const inApp = useSyncExternalStore(subscribe, isApp, () => false);
  const user = app?.boot?.user;
  const webOk = !inApp && !!app?.boot?.mailEnabled && !!user && !user.guest && !!user.emailVerified;
  const [asks] = useState(() => typeof window === 'undefined' ? { n: MAX_ASKS, day: '' } : readAsks());
  const fresh = open && asks.n < MAX_ASKS && asks.day !== date;
  // On the website, first ask the server whether the email reminder is already on.
  const [mailOff, setMailOff] = useState<boolean | null>(null);
  useEffect(() => { if (fresh && webOk && mailOff === null) api('/reminders/email').then(r => setMailOff(!r.on && !!r.available)).catch(() => setMailOff(false)); }, [fresh, webOk]); // eslint-disable-line react-hooks/exhaustive-deps
  const kind: 'app' | 'email' | null = inApp ? 'app' : webOk ? 'email' : null;
  const [shown, setShown] = useState(false);
  const show = shown || (fresh && (kind === 'app' ? !readOn() : kind === 'email' ? mailOff === true : false));
  const [state, setState] = useState<'ask' | 'on' | 'denied' | 'no'>('ask');
  useEffect(() => { if (show && !shown) { setShown(true); try { localStorage.setItem(ASKS, JSON.stringify({ n: asks.n + 1, day: date })); } catch { /* asked once more, harmless */ } } }, [show]); // eslint-disable-line react-hooks/exhaustive-deps
  return { show, state, kind, accept: async (t: (k: string) => string, playedToday: boolean, streak: number) => {
    if (kind === 'email') {
      try { await post('/reminders/email', { on: true, locale: app?.locale }); setState('on'); } catch { setState('denied'); }
      return;
    }
    const notifications = plugin();
    if (!notifications) return;
    try {
      const permission = await notifications.requestPermissions();
      if (permission.display !== 'granted') { setState('denied'); return; }
      writeOn(true); setState('on');
      await scheduleReminders(t, playedToday, new Date(), streak);
    } catch { setState('denied'); }
  }, decline: () => setState('no') };
}

/**
 * 1.51: the daily reminder by email in Settings, for website players. Guests see how to get it (a free account),
 * accounts without a confirmed address are sent to confirm it first; others get the switch.
 */
export function EmailReminder({ t }: { t: (k: string) => string }) {
  const app = useApp();
  const inApp = useSyncExternalStore(subscribe, isApp, () => false);
  const user = app?.boot?.user;
  const [state, setState] = useState<{ available: boolean; verified: boolean; on: boolean } | null>(null), [busy, setBusy] = useState(false);
  const account = !!user && !user.guest;
  useEffect(() => { if (account && !inApp) api('/reminders/email').then(setState).catch(() => {}); }, [account, inApp]);
  if (inApp || !app?.boot?.mailEnabled) return null;
  const toggle = async (on: boolean) => { setBusy(true); try { setState(await post('/reminders/email', { on, locale: app.locale })); } catch (e) { app.fail?.(e); } finally { setBusy(false); } };
  return <section className="page-section" aria-labelledby="settings-mail">
    <div className="settings-card">
      <div className="settings-card-row">
        <Mail size={22} className="row-icon" aria-hidden="true"/>
        <label htmlFor="set-mail-reminder"><strong id="settings-mail">{t('mailReminderTitle')}</strong><small>{!account ? t('mailReminderGuest') : state && !state.verified ? t('mailReminderVerify') : t(state?.on ? 'mailReminderOnCopy' : 'mailReminderCopy')}</small></label>
        {!account ? <button className="btn secondary btn-sm" onClick={() => app.setModal('signup')}>{t('signUp')}</button>
          : state && !state.verified ? <button className="btn secondary btn-sm" onClick={() => app.go('/account')}>{t('mailReminderVerifyCta')}</button>
          : <Switch id="set-mail-reminder" checked={!!state?.on} disabled={busy || !state} onCheckedChange={toggle}/>}
      </div>
    </div>
  </section>;
}

export function NativeReminder({ t }: { t: (k: string) => string }) {
  const stats = useApp()?.boot?.stats, playedToday = !!stats?.dailyDone, streak = Number(stats?.dailyStreak ?? 0);
  const inApp = useSyncExternalStore(subscribe, isApp, () => false);
  const [on, setOn] = useState(() => typeof window !== 'undefined' && readOn());
  const [busy, setBusy] = useState(false), [denied, setDenied] = useState(false);
  if (!inApp) return null;
  async function toggle() {
    const notifications = plugin();
    if (!notifications || busy) return;
    setBusy(true);
    try {
      if (on) {
        await notifications.cancel({ notifications: [...OLD_IDS, ...NEW_IDS] });
        writeOn(false); setOn(false);
      } else {
        const permission = await notifications.requestPermissions();
        if (permission.display !== 'granted') { setDenied(true); return; }
        writeOn(true); setOn(true); setDenied(false);
        await scheduleReminders(t, playedToday, new Date(), streak);
      }
    } finally { setBusy(false); }
  }
  return <section className={'native-reminder' + (on ? ' is-on' : '')} aria-live="polite">
    <span className="native-reminder-icon" aria-hidden="true">{on ? <Bell size={22} strokeWidth={2.2}/> : <BellOff size={22} strokeWidth={2.2}/>}</span>
    <div><strong>{t('reminderTitle')}</strong><p>{denied ? t('reminderDenied') : t(on ? 'reminderOnCopy' : 'reminderCopy')}</p></div>
    <button className={'btn ' + (on ? 'secondary' : 'primary')} disabled={busy} onClick={toggle} aria-pressed={on}>{on ? <BellOff size={18}/> : <Bell size={18}/>}{t(on ? 'reminderTurnOff' : 'reminderTurnOn')}</button>
  </section>;
}
