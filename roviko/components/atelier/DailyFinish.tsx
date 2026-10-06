'use client';
import React from 'react';
import { Check, RefreshCw, Share2 } from 'lucide-react';
import type { PointMode } from '@/lib/daily-scoring';
import type { MascotMood } from '../ds/Mascot';
import { DailyResult, type ResultSummary } from './DailyResult';

type FinishApp = Parameters<typeof DailyResult>[0]['app'];

/**
 * The end of every daily game, the same everywhere: a stage like the social videos (Roviko, the points, the trail),
 * one card with how you did against today's players and the way on, then Share and Done side by side.
 * Practising again and the review sit below.
 */
export function DailyFinish({ app, date, mode, game, headline, mood, summary, trail, onShare, onDone, onAgain, busy, children }: {
  app: FinishApp; date: string; mode: PointMode; game: string; headline: string; mood: MascotMood;
  summary?: ResultSummary; trail?: boolean[]; onShare: () => void; onDone: () => void; onAgain?: () => void; busy?: boolean; children?: React.ReactNode;
}) {
  const { t } = app;
  return <section className="daily-finish">
    <DailyResult app={app} date={date} mode={mode} summary={summary} trail={trail} stage={{ game, headline, mood, chips: summary, trail }}/>
    <div className="finish-actions">
      <button className="btn secondary" disabled={busy} onClick={onShare}><Share2 size={17} aria-hidden="true"/>{t('share')}</button>
      <button className="btn secondary" onClick={onDone}><Check size={17} strokeWidth={2.6} aria-hidden="true"/>{t('finishDone')}</button>
    </div>
    {onAgain && <button className="text-link finish-again" disabled={busy} onClick={onAgain}><RefreshCw size={15} aria-hidden="true"/>{t('finishPractice')}</button>}
    {children}
  </section>;
}
