'use client';
import React from 'react';
import { Home, LayoutGrid, RefreshCw, Share2 } from 'lucide-react';
import type { PointMode } from '@/lib/daily-scoring';
import type { MascotMood } from '../ds/Mascot';
import { DailyResult, type ResultSummary } from './DailyResult';

type FinishApp = Parameters<typeof DailyResult>[0]['app'];

/**
 * The end of every daily game, the same everywhere: Roviko and the points on the cream canvas, one card with
 * your place today and one forest pill on to the next game, then a quiet Share and Done. Practising again and
 * the review (folded) sit below. After the sixth game the day summary takes the place of the stage and card.
 */
export function DailyFinish({ app, date, mode, game, headline, mood, summary, trail, onShare, onDone, onAgain, busy, children }: {
  app: FinishApp; date: string; mode: PointMode; game: string; headline: string; mood: MascotMood;
  summary?: ResultSummary; trail?: boolean[]; onShare: () => void; onDone: () => void; onAgain?: () => void; busy?: boolean; children?: React.ReactNode;
}) {
  const { t } = app;
  return <section className="daily-finish">
    <DailyResult app={app} date={date} mode={mode} summary={summary} trail={trail} stage={{ game, headline, mood, chips: summary, trail }} onShare={onShare}/>
    <div className="finish-actions">
      {/* Sharing is the way Roviko grows (1.26): a real button, "Challenge your friends", with your place of the day in the message. */}
      <button className="btn primary finish-share finish-share-big" disabled={busy} onClick={onShare}><Share2 size={17} aria-hidden="true"/>{t('shareChallenge')}</button>
      {/* 1.58: two clear ways out instead of one "Done": Home, and all the games (the tab bar is back on this screen too). */}
      <div className="finish-ways">
        <button className="finish-quiet" onClick={() => app.go ? app.go('/') : onDone()}><Home size={16} strokeWidth={2.4} aria-hidden="true"/>{t('backHome')}</button>
        <button className="finish-quiet" onClick={() => app.go ? app.go('/daily') : onDone()}><LayoutGrid size={16} strokeWidth={2.4} aria-hidden="true"/>{t('viewAllGames')}</button>
      </div>
    </div>
    {onAgain && <button className="text-link finish-again" disabled={busy} onClick={onAgain}><RefreshCw size={15} aria-hidden="true"/>{t('finishPractice')}</button>}
    {children}
  </section>;
}
