'use client';
import React, { useEffect, useState } from 'react';
import { ArrowRight, X } from 'lucide-react';
import type { DayMode } from '@/lib/daily-loop';
import { readChallenge } from '@/lib/share';
import { dailyTitleKey } from '../atelier/DailyLoop';
import { launchDaily } from '../puzzles/PuzzleDeck';
import { Character } from '../ds/Character';

/**
 * Someone tapped a shared result (1.23): "A friend scored 820 points in the Daily Detour. Can you beat it?"
 * with one button into the same game. The number comes from the link, so it is a friendly claim, never a
 * ranking: nothing is stored and the daily points stay server-checked as always.
 */
export function ChallengeBanner({ app }: { app: Parameters<typeof launchDaily>[0] & { t: (k: string) => string; locale: string; fail: (e: unknown) => void } }) {
  const [challenge, setChallenge] = useState<{ mode: DayMode | 'day'; points: number } | null>(null), [busy, setBusy] = useState(false);
  useEffect(() => { setChallenge(readChallenge(location.search)); }, []);
  if (!challenge) return null;
  const { t, locale } = app, day = challenge.mode === 'day', game = day ? '' : t(dailyTitleKey(challenge.mode as DayMode));
  const close = () => { setChallenge(null); try { history.replaceState(history.state, '', location.pathname); } catch { /* keep the address */ } };
  const play = async () => { if (busy) return; setBusy(true); try { close(); await launchDaily(app, day ? 'daily' : challenge.mode as DayMode); } catch (e) { app.fail(e); } finally { setBusy(false); } };
  return <aside className="challenge-banner" aria-labelledby="challenge-title">
    <Character mood="curious" pose="point" size={84} className="challenge-character"/>
    <div>
      <strong id="challenge-title">{t(day ? 'chTitleDay' : 'chTitle').replace('{n}', challenge.points.toLocaleString(locale)).replace('{game}', game)}</strong>
      <p>{t('chCopy')}</p>
      <button className="btn gold" disabled={busy} onClick={play}>{day ? t('tripStart') : t('chPlay').replace('{game}', game)}<ArrowRight size={17} aria-hidden="true"/></button>
    </div>
    <button className="icon-btn challenge-close" onClick={close} aria-label={t('close')}><X size={18} aria-hidden="true"/></button>
  </aside>;
}
