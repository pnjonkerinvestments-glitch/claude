'use client';
import React, { useState, useSyncExternalStore } from 'react';
import { ArrowRight, X } from 'lucide-react';
import type { DayMode } from '@/lib/daily-loop';
import { readChallenge } from '@/lib/share';
import { dailyTitleKey } from '../atelier/DailyLoop';
import { launchDaily } from '../puzzles/PuzzleDeck';
import { Peek } from '../ds/Character';
import { Coin } from '../ds/Coin';

export type Challenge = { mode: DayMode | 'day'; points: number };

// The challenge lives in the address (?shared=daily&s=820). One small store, so the homepage hero and the
// banner agree, and closing or playing it clears both.
let cache: { search: string; value: Challenge | null } = { search: '\0', value: null };
const snapshot = () => { const s = location.search; if (s !== cache.search) cache = { search: s, value: readChallenge(s) }; return cache.value; };
const subscribe = (onChange: () => void) => {
  window.addEventListener('roviko:challenge', onChange); window.addEventListener('popstate', onChange);
  return () => { window.removeEventListener('roviko:challenge', onChange); window.removeEventListener('popstate', onChange); };
};
/** The friend's score from a shared link, or null. Null on the server, so the markup agrees. */
export const useChallenge = () => useSyncExternalStore(subscribe, snapshot, () => null);
/** Forget the challenge: removes it from the address, so a reload shows the normal page. */
export function clearChallenge() {
  try { history.replaceState(history.state, '', location.pathname + location.hash); } catch { /* keep the address */ }
  try { window.dispatchEvent(new Event('roviko:challenge')); } catch { /* not in a browser */ }
}
/** "A friend scored 820 points in Daily Detour" in the page language. */
export const challengeLine = (t: (k: string) => string, locale: string, c: Challenge) =>
  t(c.mode === 'day' ? 'chTitleDay' : 'chTitle').replace('{n}', c.points.toLocaleString(locale)).replace('{game}', c.mode === 'day' ? '' : t(dailyTitleKey(c.mode)));

/**
 * Someone tapped a shared result (1.23): "A friend scored 820 points in the Daily Detour. Can you beat it?"
 * with one button into the same game. The number comes from the link, so it is a friendly claim, never a
 * ranking: nothing is stored and the daily points stay server-checked as always.
 * On the homepage the hero itself carries the challenge (Roviko says it, the main pill plays it), so the
 * banner only shows on the all-games page.
 */
export function ChallengeBanner({ app }: { app: Parameters<typeof launchDaily>[0] & { t: (k: string) => string; locale: string; fail: (e: unknown) => void } }) {
  const challenge = useChallenge(), [busy, setBusy] = useState(false);
  if (!challenge || location.pathname === '/') return null;
  const { t, locale } = app, day = challenge.mode === 'day', game = day ? '' : t(dailyTitleKey(challenge.mode as DayMode));
  const play = async () => { if (busy) return; setBusy(true); try { clearChallenge(); await launchDaily(app, day ? 'daily' : challenge.mode as DayMode); } catch (e) { app.fail(e); } finally { setBusy(false); } };
  return <aside className="challenge-banner ch-trip" aria-labelledby="challenge-title">
    <Peek mood="curious" size={84}/>
    <span className="t-points ch-score"><Coin size={18}/>{challenge.points.toLocaleString(locale)}</span>
    <strong id="challenge-title">{challengeLine(t, locale, challenge)}</strong>
    <p>{t('chCopy')}</p>
    <button className="btn primary" disabled={busy} aria-busy={busy} onClick={play}>{day ? t('tripStart') : t('chPlay').replace('{game}', game)}<ArrowRight size={18} aria-hidden="true"/></button>
    <button className="icon-btn challenge-close" onClick={clearChallenge} aria-label={t('close')}><X size={18} aria-hidden="true"/></button>
  </aside>;
}
