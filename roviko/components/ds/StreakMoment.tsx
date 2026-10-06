'use client';
import React, { useEffect } from 'react';
import { ArrowRight, Snowflake } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { sound } from '@/lib/client';
import { plural } from '@/lib/plural';
import { CountUp } from './Celebration';
import { FlameMark } from './Coin';

const KEY = 'roviko:streak-moment';
/** Shown at most once per UTC date and device. */
export const streakMomentSeen = (date: string) => { try { return localStorage.getItem(KEY) === date; } catch { return true; } };
const markSeen = (date: string) => { try { localStorage.setItem(KEY, date); } catch { /* may show again, harmless */ } };

/**
 * The moment the daily streak grows (1.23): after the first finished daily game of a day, the gold flame of
 * the streak pill flares up with the number of days, "5 days in a row!", this week as dots (gold for a day
 * played) and how far the next streak shield is. Pure motivation: the streak itself is derived from saved
 * daily results on the server (lib/streak.ts) and never changes here.
 */
export function StreakMoment({ open, date, streak, week, shieldIn, shields, t, onClose }: {
  open: boolean; date: string; streak: number; week?: { date: string; completed: boolean }[]; shieldIn?: number; shields?: number;
  t: (k: string) => string; onClose: () => void;
}) {
  useEffect(() => { if (open) { markSeen(date); sound('win'); } }, [open, date]);
  const weekdays = (week ?? []).map(d => new Date(d.date + 'T12:00:00Z').toLocaleDateString(document.documentElement.lang || 'en', { weekday: 'narrow', timeZone: 'UTC' }));
  return <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
    <DialogContent className="app-modal streak-moment">
      <div className="sm-flame" aria-hidden="true"><span className="sm-glow"/><FlameMark size={124}/><b><CountUp value={streak} format={n => String(n)}/></b></div>
      <DialogTitle className="modal-title">{plural(t, 'smTitle', streak)}</DialogTitle>
      <DialogDescription>{t('smCopy')}</DialogDescription>
      {week && week.length > 0 && <ol className="sm-week" aria-label={t('smWeek')}>{week.map((d, i) => <li key={d.date} className={(d.completed ? 'is-done' : '') + (d.date === date ? ' is-today' : '')} style={{ '--i': i } as React.CSSProperties}><span>{weekdays[i]}</span><i aria-hidden="true">{d.completed ? <FlameMark size={16}/> : null}</i></li>)}</ol>}
      {typeof shieldIn === 'number' && <p className="sm-shield"><Snowflake size={15} aria-hidden="true"/>{(shields ?? 0) >= 2 ? t('smShieldFull') : plural(t, 'smShield', Math.max(1, shieldIn))}</p>}
      <button className="btn primary btn-lg" onClick={onClose} autoFocus>{t('smContinue')}<ArrowRight size={18} aria-hidden="true"/></button>
    </DialogContent>
  </Dialog>;
}
