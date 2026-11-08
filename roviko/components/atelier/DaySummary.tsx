'use client';
import React, { useContext, useEffect, useRef } from 'react';
import { AppContext } from '../app/context';
import { ArrowRight, Flame, Home, Share2, Trophy } from 'lucide-react';
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
import { ContinentCTA } from '../home/ContinentWeek';

/** A square per daily game for the day share: green from 800, yellow from 500, otherwise red. */
export const dayTrail = (scores: { mode: string; score: number }[], date?: string) => dayModesFor(date).map(m => { const s = scores.find(x => x.mode === m)?.score ?? 0; return s >= 800 ? '🟩' : s >= 500 ? '🟨' : '🟥'; }).join('');

/**
 * The whole day at a glance once all six scored games are done (1.23).
 * As a screen (after the sixth game): Roviko cheering on the cream canvas, "Nice trip. Same time tomorrow?",
 * the day total with a gold coin, the six games in one compact card (the one just played gets its points
 * in gold), then one forest pill to the bonus tour, an outline pill to challenge a friend with the day, and
 * the time until the new games. Without `screen` it is the compact card only (under an older result).
 */
export function DaySummary({ date, scores, place, players, streak, t, locale, share, screen = false, current, onBonus, bonusBusy, name, tomorrow, game, yesterdayPlace, onOpen, onRankings, onHome }: {
  date: string; scores: { mode: string; score: number }[]; place?: number; players?: number; streak?: number;
  t: (k: string) => string; locale: string; share: (text: string) => void;
  /** The player's name, for "Pietje: #1 of 230 players worldwide today" in the share (1.26). */
  name?: string;
  /** Show it as the whole end screen (with Roviko and the bonus tour), not as a card under a result. */
  screen?: boolean; current?: string; onBonus?: () => void; bonusBusy?: boolean;
  /** Tomorrow's Side by Side subject (1.35), a concrete reason to come back; never a question or an answer. */
  tomorrow?: { emoji?: string; label: Record<string, string> } | null;
  /** 1.57: the game just finished: its points and its place among today's players of that game, right now. */
  game?: { score: number; place?: number; participants: number } | null;
  /** 1.58: the way home (and the tab bar comes back on this screen). */
  onHome?: () => void;
  /** 1.57: yesterday's place in the day ranking, for "12 places higher than yesterday" (left out when unknown). */
  yesterdayPlace?: number | null;
  /** 1.57: open a game's own (finished) result from the list; and the Rankings page. */
  onOpen?: (mode: any) => void; onRankings?: () => void;
}) {
  const n = (v: number) => v.toLocaleString(locale), total = scores.reduce((a, s) => a + (s.score ?? 0), 0);
  const scoreOf = (m: string) => scores.find(s => s.mode === m)?.score ?? 0;
  const shareDay = () => share(shareCard({ label: t('dayShareLabel'), date, trail: dayTrail(scores, date), score: n(total) + '/' + n(DAILY_TOTAL_MAX) + ' ' + t('points'), streak, url: new URL('/?shared=day', location.origin).toString(), points: total, extras: (rememberStanding('day', date, place, players, total), challengeExtras(t, locale, 'day', date, name)) }));
  // The day's fanfare, once, when this is the end screen (it stands in for the last game's own stage).
  const title = useRef<HTMLHeadingElement>(null);
  const app = useContext(AppContext);
  // 1.58: the end of the day brings the top bar and the tab bar back, like every end screen.
  useEffect(() => { if (!screen) return; app?.setResultNav?.(true); return () => app?.setResultNav?.(false); }, [screen]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (screen) { sound('win'); warmShareImage(); toTop(); focusHeadline(title.current); } }, [screen]);
  const top = total >= DAILY_TOTAL_MAX * 0.8;
  // The six games of that UTC date: Country Mosaic before the switch to the daily Size Shuffle (1.24), Size Shuffle after.
  const lineup = dayModesFor(date);
  const row = (m: string) => <><GameIcon mode={m as any} size="sm"/><span>{t(dailyTitleKey(m as any))}</span>
    {m === current && screen && scoreOf(m) > 0 ? <b className="t-points">+{n(scoreOf(m))}</b> : <b>{n(scoreOf(m))}</b>}</>;
  // 1.57: on the end screen each game opens its own result (every daily game reopens finished on the same day).
  const list = <ul className="day-scores" aria-label={t('dayGamesLabel')}>{lineup.map((m, i) => <li key={m} className={m === current ? 'is-now' : ''} style={{ '--i': i } as React.CSSProperties}>
    {screen && onOpen && m !== current ? <button type="button" onClick={() => onOpen(m)}>{row(m)}</button> : row(m)}
  </li>)}</ul>;
  const rank = (p?: number, c?: number) => p ? t('dayGameRank').replace('{rank}', n(p)).replace('{count}', n(c ?? 0)) : '';
  const topPct = game?.place && game.participants > 1 ? Math.max(1, Math.ceil(game.place / game.participants * 100)) : null;
  const moved = place && yesterdayPlace ? yesterdayPlace - place : null;
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
    {/* 1. The game just played: points and its place right now (later players can still pass you). */}
    {current && game && <p className="ds-game"><span>{t(dailyTitleKey(current as any))} · <b>{n(game.score)}</b> / {n(1000)}</span>
      {game.place ? <small>{rank(game.place, game.participants)}{topPct ? ' · ' + t('dayTopPct').replace('{n}', String(topPct)) : ''} · {t('dayRightNow')}</small> : null}</p>}
    {/* 2. The day: total of all six, the day ranking right now, and how that compares with yesterday. */}
    <p className="fs-score has-coin"><Coin size={44} className="fs-coin"/><strong><CountUp value={total} format={n}/></strong><span className="fs-of">/ {n(DAILY_TOTAL_MAX)} {t('points')}</span></p>
    {place ? <p className="ds-place">{rank(place, players)} · <small>{t('dayRightNow')}</small></p> : null}
    {moved !== null && <p className="ds-since">{moved > 0 ? t('dayVsYesterdayUp').replace('{n}', n(moved)) : moved < 0 ? t('dayVsYesterdayDown').replace('{n}', n(-moved)) : t('dayVsYesterdaySame')}</p>}
    {/* 3. The six games, in the day's order. */}
    {list}
    {/* 4. The streak, as elsewhere. */}
    {streak ? <p className="ds-streak"><Flame size={16} aria-hidden="true"/>{t('dayStreak').replace('{n}', n(streak))}</p> : null}
    {/* 5. Share the day, the rankings, then the bonus tour as before. */}
    <div className="ds-actions">
      <button className="btn primary btn-lg ds-challenge" onClick={shareDay}><Share2 size={18} aria-hidden="true"/>{t('dayShareTrip')}</button>
      {onRankings && <button className="btn secondary btn-lg" onClick={onRankings}><Trophy size={18} aria-hidden="true"/>{t('dayViewRankings')}</button>}
      {onHome && <button className="btn secondary btn-lg" onClick={onHome}><Home size={18} aria-hidden="true"/>{t('backHome')}</button>}
      <ContinentCTA/>
      {onBonus && <button className="btn secondary btn-lg ds-bonus" disabled={bonusBusy} aria-busy={bonusBusy} onClick={onBonus}>{bonusBusy ? t('loading') : t('dayBonus')}<ArrowRight size={19} aria-hidden="true"/></button>}
    </div>
    {tomorrow && <p className="ds-tomorrow">{t('loopTomorrow').replace('{topic}', (tomorrow.emoji ? tomorrow.emoji + ' ' : '') + (tomorrow.label[locale] ?? tomorrow.label.en))}</p>}
    <p className="ds-reset"><ResetCountdown label={t('dayNewIn')} t={t}/></p>
  </section>;
}
