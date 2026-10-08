'use client';
import React, { useEffect, useRef } from 'react';
import { ArrowRight, Share2 } from 'lucide-react';
import { dayModesFor } from '@/lib/daily-loop';
import { DAILY_TOTAL_MAX } from '@/lib/daily-scoring';
import { challengeExtras, rememberStanding, shareCard } from '@/lib/share';
import { sound } from '@/lib/client';
import { warmShareImage } from '@/lib/share-image';
import { GameIcon } from './GameIcon';
import { dailyTitleKey } from './DailyLoop';
import { ResetCountdown } from './ResetCountdown';
import { CountUp } from '../ds/Celebration';
import { Coin } from '../ds/Coin';
import { FinishConfetti, FinishHero, focusHeadline, toTop } from '../ds/FinishStage';

/** A square per daily game for the day share: green from 800, yellow from 500, otherwise red. */
export const dayTrail = (scores: { mode: string; score: number }[], date?: string) => dayModesFor(date).map(m => { const s = scores.find(x => x.mode === m)?.score ?? 0; return s >= 800 ? '🟩' : s >= 500 ? '🟨' : '🟥'; }).join('');

/**
 * The whole day at a glance once all six scored games are done (1.23).
 * As a screen (after the sixth game): Roviko cheering on the cream canvas, "Nice trip. Same time tomorrow?",
 * the day total with a gold coin, the six games in one compact card (the one just played gets its points
 * in gold), then one forest pill to the bonus tour, an outline pill to challenge a friend with the day, and
 * the time until the new games. Without `screen` it is the compact card only (under an older result).
 */
export function DaySummary({ date, scores, place, players, streak, t, locale, share, screen = false, current, onBonus, bonusBusy, name }: {
  date: string; scores: { mode: string; score: number }[]; place?: number; players?: number; streak?: number;
  t: (k: string) => string; locale: string; share: (text: string) => void;
  /** The player's name, for "Pietje: #1 of 230 players worldwide today" in the share (1.26). */
  name?: string;
  /** Show it as the whole end screen (with Roviko and the bonus tour), not as a card under a result. */
  screen?: boolean; current?: string; onBonus?: () => void; bonusBusy?: boolean;
}) {
  const n = (v: number) => v.toLocaleString(locale), total = scores.reduce((a, s) => a + (s.score ?? 0), 0);
  const scoreOf = (m: string) => scores.find(s => s.mode === m)?.score ?? 0;
  const shareDay = () => share(shareCard({ label: t('dayShareLabel'), date, trail: dayTrail(scores, date), score: n(total) + '/' + n(DAILY_TOTAL_MAX) + ' ' + t('points'), streak, url: new URL('/?shared=day', location.origin).toString(), points: total, extras: (rememberStanding('day', date, place, players), challengeExtras(t, locale, 'day', date, name)) }));
  // The day's fanfare, once, when this is the end screen (it stands in for the last game's own stage).
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (screen) { sound('win'); warmShareImage(); toTop(); focusHeadline(title.current); } }, [screen]);
  const top = total >= DAILY_TOTAL_MAX * 0.8;
  // The six games of that UTC date: Country Mosaic before the switch to the daily Size Shuffle (1.24), Size Shuffle after.
  const lineup = dayModesFor(date);
  const list = <ul className="day-scores" aria-label={t('dayGamesLabel')}>{lineup.map((m, i) => <li key={m} className={m === current ? 'is-now' : ''} style={{ '--i': i } as React.CSSProperties}>
    <GameIcon mode={m} size="sm"/><span>{t(dailyTitleKey(m))}</span>
    {m === current && screen && scoreOf(m) > 0 ? <b className="t-points">+{n(scoreOf(m))}</b> : <b>{n(scoreOf(m))}</b>}
  </li>)}</ul>;
  if (!screen) return <section className="day-summary" aria-labelledby="day-summary-title">
    <h3 id="day-summary-title">{t('dayDoneTitle')}</h3>
    {list}
    <p className="day-total"><span><b>{n(total)}</b> / {n(DAILY_TOTAL_MAX)}</span>{place ? <small>{t('resultDayRank').replace('{rank}', n(place)).replace('{count}', n(players ?? 0))}</small> : null}</p>
    <button className="btn secondary" onClick={shareDay}><Share2 size={17} aria-hidden="true"/>{t('dayChallenge')}</button>
  </section>;
  return <section className={'day-summary is-screen' + (top ? ' is-top' : '')} aria-labelledby="day-summary-title">
    {top && <FinishConfetti/>}
    <FinishHero mood="cheer" tone={top ? 'gold' : 'forest'}/>
    <p className="fs-kicker">{t('dayDoneKicker')}</p>
    <ol className="ds-dots" aria-hidden="true">{lineup.map((m, i) => <li key={m} style={{ '--i': i } as React.CSSProperties}/>)}</ol>
    <h1 className="fs-title" id="day-summary-title" ref={title} tabIndex={-1}>{t('dayDoneHeadline')}</h1>
    <p className="fs-score has-coin"><Coin size={44} className="fs-coin"/><strong><CountUp value={total} format={n}/></strong><span className="fs-of">/ {n(DAILY_TOTAL_MAX)} {t('points')}</span></p>
    {place ? <p className="ds-place">{t('resultDayRank').replace('{rank}', n(place)).replace('{count}', n(players ?? 0))}</p> : null}
    {list}
    <div className="ds-actions">
      {onBonus && <button className="btn primary btn-lg ds-bonus" disabled={bonusBusy} aria-busy={bonusBusy} onClick={onBonus}>{bonusBusy ? t('loading') : t('dayBonus')}<ArrowRight size={19} aria-hidden="true"/></button>}
      <button className="btn secondary btn-lg ds-challenge" onClick={shareDay}><Share2 size={18} aria-hidden="true"/>{t('dayChallenge')}</button>
    </div>
    <p className="ds-reset"><ResetCountdown label={t('dayNewIn')} t={t}/></p>
  </section>;
}
