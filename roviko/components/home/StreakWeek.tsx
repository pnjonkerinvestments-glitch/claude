'use client';
import React, { useState } from 'react';
import { ArrowRight, Snowflake, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import { post } from '@/lib/client';
import { plural } from '@/lib/plural';
import { FlameMark } from '../ds/Coin';
import { useApp } from '../app/context';

type Day = { date: string; state: 'played' | 'shield' | 'repaired' | 'missed' | 'today' | 'future' };

/**
 * The week card (1.39): Monday to Sunday as seven round days (a flame for played, a snowflake for a day a shield
 * or repair kept the streak alive, empty for a missed day, a ring for today), with the shields in stock and when
 * the next one comes. Everything comes from the server's derived streak (lib/streak.ts).
 */
export function StreakWeek() {
  const { t, boot } = useApp();
  const week = (boot?.stats?.streakWeek ?? []) as Day[];
  if (week.length !== 7) return null;
  const shields = boot.stats.streakFreezes?.available ?? 0, nextIn = boot.stats.streakFreezes?.nextIn ?? 0;
  const lang = typeof document !== 'undefined' ? document.documentElement.lang || 'en' : 'en';
  const label = (d: Day) => new Date(d.date + 'T12:00:00Z').toLocaleDateString(lang, { weekday: 'narrow', timeZone: 'UTC' });
  const played = week.filter(d => d.state === 'played').length;
  return <section className="side-row streak-week" aria-labelledby="streak-week-title">
    <div className="sw-head">
      <strong id="streak-week-title">{t('weekTitle')}</strong>
      <small>{plural(t, 'streakWeekPlayed', played)}</small>
    </div>
    <ol className="sw-days">{week.map(d => <li key={d.date} className={'is-' + d.state} aria-label={label(d) + ' · ' + t('weekState_' + d.state)}>
      <span className="sw-dot" aria-hidden="true">{d.state === 'played' ? <FlameMark size={20}/> : d.state === 'shield' || d.state === 'repaired' ? <Snowflake size={15} strokeWidth={2.6}/> : null}</span>
      <small aria-hidden="true">{label(d)}</small>
    </li>)}</ol>
    <p className="sw-shields"><Snowflake size={14} strokeWidth={2.6} aria-hidden="true"/>{shields >= 2 ? t('weekShieldsFull') : (shields ? plural(t, 'weekShields', shields) + ' · ' : '') + plural(t, 'weekShieldNext', Math.max(1, nextIn))}</p>
  </section>;
}

/** A free repair, once per 30 days, for a streak that just broke (1.39). */
export function StreakRepair() {
  const { t, boot, refresh, fail } = useApp();
  const offer = boot?.stats?.streakRepair as { days: string[]; from: number; to: number; lost: number } | null | undefined;
  const [busy, setBusy] = useState(false);
  if (!offer) return null;
  const repair = async () => {
    setBusy(true);
    try { const r = await post('/streak/repair'); toast.success(plural(t, 'repairDone', r.streak)); await refresh?.(); }
    catch (e) { fail?.(e); } finally { setBusy(false); }
  };
  return <section className="streak-repair t-card" aria-labelledby="streak-repair-title">
    <span className="sr-icon" aria-hidden="true"><FlameMark size={34} off/><Wrench size={16} strokeWidth={2.6}/></span>
    <div className="sr-copy">
      <h2 id="streak-repair-title">{plural(t, 'repairTitle', offer.lost)}</h2>
      <p>{t('repairCopy')}</p>
    </div>
    <button className="btn secondary btn-lg" disabled={busy} aria-busy={busy} onClick={repair}>{t('repairCta')}<ArrowRight size={18} aria-hidden="true"/></button>
  </section>;
}
