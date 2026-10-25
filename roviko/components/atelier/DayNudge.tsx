'use client';
import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { dayModesFor, nextDailyMode } from '@/lib/daily-loop';
import { useApp } from '../app/context';
import { useToday } from '../home/useDay';
import { launchDaily } from '../puzzles/PuzzleDeck';
import { dailyTitleKey } from './DailyLoop';
import { GameIcon } from './GameIcon';

/**
 * 1.50: after free play, a bonus game, survival or a lesson in Learn, while today's daily games are not all done yet:
 * one quiet line with one secondary button on to the next daily game. Nothing when the day is complete, and the
 * screen's own main button stays what it is.
 */
export function DayNudge() {
  const app = useApp();
  // Outside the app (a static render) there is no player, so nothing is fetched and nothing shows.
  const { data: today } = useToday(app?.boot ?? { user: { id: '' } } as any);
  const [busy, setBusy] = useState(false);
  const next = app && today ? nextDailyMode(today.sessions, dayModesFor(today.date)) : null;
  if (!next) return null;
  const { t, fail } = app;
  const go = async () => { if (busy) return; setBusy(true); try { await launchDaily(app as any, next); } catch (e) { fail(e); } finally { setBusy(false); } };
  return <aside className="day-nudge" aria-label={t('dayNudge')}>
    <p>{t('dayNudge')}</p>
    <button className="day-nudge-go" disabled={busy || app.busy} aria-busy={busy} onClick={go}><GameIcon mode={next} size="sm" className="day-nudge-icon"/><span>{busy ? t('loading') : t('dayNudgeCta').replace('{game}', t(dailyTitleKey(next)))}</span><b className="day-nudge-arrow" aria-hidden="true"><ArrowRight size={18} strokeWidth={2.6}/></b></button>
  </aside>;
}
