'use client';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { useApp } from '../app/context';

// Only rendered inside the Roviko iOS/Android app (Capacitor), where the native bridge exposes
// the LocalNotifications plugin on window.Capacitor. The website itself never asks for permission.
type Notifications = {
  requestPermissions(): Promise<{ display: string }>;
  schedule(options: unknown): Promise<unknown>;
  cancel(options: unknown): Promise<unknown>;
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
/** One notification per day for the next 7 days, today only if the player has not played yet. */
export async function scheduleReminders(t: (k: string) => string, playedToday: boolean, now = new Date()) {
  const notifications = plugin();
  if (!notifications || !readOn()) return;
  const minute = reminderMinute(readTimes(), now);
  const list: unknown[] = [];
  for (let i = 0; i < DAYS; i++) {
    const at = new Date(now); at.setDate(at.getDate() + i); at.setHours(Math.floor(minute / 60), minute % 60, 0, 0);
    if (i === 0 && (playedToday || at.getTime() < now.getTime() + 5 * 60000)) continue;
    list.push({ id: 1101 + i, title: 'Roviko', body: t('reminder' + (at.getDay() + 1)), schedule: { at, allowWhileIdle: false } });
  }
  await notifications.cancel({ notifications: [...OLD_IDS, ...NEW_IDS] });
  if (list.length) await notifications.schedule({ notifications: list });
}
/** Keeps the reminders right whenever the app opens or a daily game is played (1.39). */
export function useSmartReminder(t: (k: string) => string, ready: boolean, playedToday: boolean) {
  useEffect(() => {
    if (!ready || !isApp()) return;
    if (playedToday) rememberPlayTime();
    scheduleReminders(t, playedToday).catch(() => {});
  }, [ready, playedToday]); // eslint-disable-line react-hooks/exhaustive-deps
}

export function NativeReminder({ t }: { t: (k: string) => string }) {
  const playedToday = !!useApp()?.boot?.stats?.dailyDone;
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
        await scheduleReminders(t, playedToday);
      }
    } finally { setBusy(false); }
  }
  return <section className={'native-reminder' + (on ? ' is-on' : '')} aria-live="polite">
    <span className="native-reminder-icon" aria-hidden="true">{on ? <Bell size={22} strokeWidth={2.2}/> : <BellOff size={22} strokeWidth={2.2}/>}</span>
    <div><strong>{t('reminderTitle')}</strong><p>{denied ? t('reminderDenied') : t(on ? 'reminderOnCopy' : 'reminderCopy')}</p></div>
    <button className={'btn ' + (on ? 'secondary' : 'primary')} disabled={busy} onClick={toggle} aria-pressed={on}>{on ? <BellOff size={18}/> : <Bell size={18}/>}{t(on ? 'reminderTurnOff' : 'reminderTurnOn')}</button>
  </section>;
}
