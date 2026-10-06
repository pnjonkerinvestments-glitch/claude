'use client';
import React from 'react';
import { Share2 } from 'lucide-react';
import { DAY_MODES } from '@/lib/daily-loop';
import { DAILY_TOTAL_MAX } from '@/lib/daily-scoring';
import { shareCard } from '@/lib/share';
import { GameIcon } from './GameIcon';
import { dailyTitleKey } from './DailyLoop';

/** A square per daily game for the day share: green from 800, yellow from 500, otherwise red. */
export const dayTrail = (scores: { mode: string; score: number }[]) => DAY_MODES.map(m => { const s = scores.find(x => x.mode === m)?.score ?? 0; return s >= 800 ? '🟩' : s >= 500 ? '🟨' : '🟥'; }).join('');

/**
 * The whole day at a glance once all six scored games are done (1.23): each game's points, the day total and
 * your place, and one button to share the day. Shown under the last daily result.
 */
export function DaySummary({ date, scores, place, players, streak, t, locale, share }: {
  date: string; scores: { mode: string; score: number }[]; place?: number; players?: number; streak?: number;
  t: (k: string) => string; locale: string; share: (text: string) => void;
}) {
  const n = (v: number) => v.toLocaleString(locale), total = scores.reduce((a, s) => a + (s.score ?? 0), 0);
  const shareDay = () => share(shareCard({ label: t('dayShareLabel'), date, trail: dayTrail(scores), score: n(total) + '/' + n(DAILY_TOTAL_MAX) + ' ' + t('points'), streak, url: new URL('/?shared=day', location.origin).toString(), points: total }));
  return <section className="day-summary" aria-labelledby="day-summary-title">
    <h3 id="day-summary-title">{t('dayDoneTitle')}</h3>
    <ul className="day-scores">{DAY_MODES.map(m => <li key={m}><GameIcon mode={m} size="sm"/><span>{t(dailyTitleKey(m))}</span><b>{n(scores.find(s => s.mode === m)?.score ?? 0)}</b></li>)}</ul>
    <p className="day-total"><span><b>{n(total)}</b> / {n(DAILY_TOTAL_MAX)}</span>{place ? <small>{t('resultDayRank').replace('{rank}', n(place)).replace('{count}', n(players ?? 0))}</small> : null}</p>
    <button className="btn secondary" onClick={shareDay}><Share2 size={17} aria-hidden="true"/>{t('dayShare')}</button>
  </section>;
}
