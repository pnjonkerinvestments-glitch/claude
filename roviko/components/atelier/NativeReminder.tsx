'use client';
import { useState, useSyncExternalStore } from 'react';
import { Bell, BellOff } from 'lucide-react';

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

const HOUR = 18, KEY = 'roviko:reminder';
// One weekly notification per weekday (Capacitor: 1 = Sunday … 7 = Saturday), each with its own friendly line,
// so the nudge never reads the same two days running. ID 1001 was the earlier single daily reminder.
const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7], idFor = (weekday: number) => 1000 + weekday;
function readOn() { try { return localStorage.getItem(KEY) === 'on'; } catch { return false; } }
function writeOn(on: boolean) { try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch { /* the reminder still works for this session */ } }

export function NativeReminder({ t }: { t: (k: string) => string }) {
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
        await notifications.cancel({ notifications: WEEKDAYS.map(d => ({ id: idFor(d) })) });
        writeOn(false); setOn(false);
      } else {
        const permission = await notifications.requestPermissions();
        if (permission.display !== 'granted') { setDenied(true); return; }
        await notifications.cancel({ notifications: WEEKDAYS.map(d => ({ id: idFor(d) })) });
        await notifications.schedule({ notifications: WEEKDAYS.map(d => ({ id: idFor(d), title: 'Roviko', body: t('reminder' + d), schedule: { on: { weekday: d, hour: HOUR, minute: 0 }, allowWhileIdle: false } })) });
        writeOn(true); setOn(true); setDenied(false);
      }
    } finally { setBusy(false); }
  }
  return <section className={'native-reminder' + (on ? ' is-on' : '')} aria-live="polite">
    <span className="native-reminder-icon" aria-hidden="true">{on ? <Bell size={22} strokeWidth={2.2}/> : <BellOff size={22} strokeWidth={2.2}/>}</span>
    <div><strong>{t('reminderTitle')}</strong><p>{denied ? t('reminderDenied') : t(on ? 'reminderOnCopy' : 'reminderCopy')}</p></div>
    <button className={'btn ' + (on ? 'secondary' : 'primary')} disabled={busy} onClick={toggle} aria-pressed={on}>{on ? <BellOff size={18}/> : <Bell size={18}/>}{t(on ? 'reminderTurnOff' : 'reminderTurnOn')}</button>
  </section>;
}
