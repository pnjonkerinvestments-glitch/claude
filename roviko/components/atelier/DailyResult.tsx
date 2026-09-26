'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Star, Users } from 'lucide-react';
import { api } from '@/lib/client';
import type { PointMode } from '@/lib/daily-scoring';
import { nextDailyMode, type DayMode } from '@/lib/daily-loop';
import { launchDaily } from '../puzzles/PuzzleDeck';
import { CountUp } from '../ds/Celebration';
import { ResetCountdown } from './ResetCountdown';
import { dailyTitleKey } from './DailyLoop';
import { nextBonusMode, type BonusMode } from '@/lib/bonus';
import { useBonusLaunch } from '../home/BonusTour';

type Standing = { score: number; place?: number; participants: number; next?: { name: string; gap: number; place: number } | null };
type ResultApp = Parameters<typeof launchDaily>[0] & { t: (key: string) => string; locale: string; boot: { user?: { guest?: boolean }; stats: { dailyCount?: number } }; fail: (e: unknown) => void; busy?: boolean; setModal?: (m: string) => void };

const SAVE_KEY = 'roviko:save-prompt';
const readFlag = () => { try { return localStorage.getItem(SAVE_KEY) === 'done'; } catch { return true; } };
const writeFlag = () => { try { localStorage.setItem(SAVE_KEY, 'done'); } catch { /* shows again next time, that is fine */ } };

/**
 * The whole result of a daily game in one card: your points, how that compares with everyone who played
 * today, and one button on to the next game. Replaces the long score panel and the "games left" overview.
 */
export function DailyResult({ app, date, mode }: { app: ResultApp; date: string; mode: PointMode }) {
  const { t, locale, boot, fail } = app;
  const [game, setGame] = useState<Standing | null>(null), [day, setDay] = useState<Standing | null>(null), [best, setBest] = useState<number | undefined>(), [next, setNext] = useState<DayMode | null | undefined>(), [busy, setBusy] = useState(false), [bonusNext, setBonusNext] = useState<BonusMode | null>(null);
  const bonusLaunch = useBonusLaunch({ go: app.go, fail });
  const lock = useRef(false);
  useEffect(() => {
    let active = true;
    api('/competition?date=' + date + '&mode=' + mode).then(r => { if (active) { setGame(r.game ?? null); setDay(r.today ?? null); setBest(r.personalBest?.[mode]?.best); } }).catch(() => {});
    api('/puzzles/today?competition=1').then(r => { if (active) { setNext(nextDailyMode(r.sessions)); setBonusNext(nextBonusMode(r.bonus)); } }).catch(() => { if (active) setNext(null); });
    return () => { active = false; };
  }, [date, mode, boot.stats.dailyCount]);
  const fmt = (n: number) => n.toLocaleString(locale);
  const score = game?.score ?? 0, players = game?.participants ?? 0, place = game?.place ?? 0;
  // Share of today's other players you scored higher than (ties count as not beaten).
  const beaten = players > 1 && place ? Math.round((players - place) / (players - 1) * 100) : null;
  const isBest = best !== undefined && score > best;
  const go = async () => { if (!next || lock.current) return; lock.current = true; setBusy(true); try { await launchDaily(app, next); } catch (e) { fail(e); } finally { lock.current = false; setBusy(false); } };
  // Once per guest, after a finished Detour (never before play or mid-game): keep your streak with a free account.
  const [askSave, setAskSave] = useState(false);
  useEffect(() => { if (mode === 'daily' && boot.user?.guest && !readFlag()) setAskSave(true); }, [mode, boot.user?.guest]);
  const closeSave = () => { writeFlag(); setAskSave(false); };
  return <section className="daily-result" aria-label={t('competitionScoreSaved')}>
    <div className="daily-result-score">
      <strong>{game ? <CountUp value={score} format={fmt}/> : '…'}<small> / {fmt(1000)}</small></strong>
      <span>{t('points')}{isBest && <b className="daily-result-best"><Star size={13} strokeWidth={2.6} aria-hidden="true"/>{t('celebrateBest')}</b>}</span>
    </div>
    <div className="daily-result-compare">
      <p><Users size={17} aria-hidden="true"/>{!game ? t('loading') : players <= 1 ? t('resultFirstPlayer') : t('competitionRank').replace('{rank}', fmt(place)).replace('{count}', fmt(players))}</p>
      {beaten !== null && <><span className="daily-result-bar" aria-hidden="true"><i style={{ width: Math.max(4, beaten) + '%' }}/></span><small>{t('resultBeaten').replace('{n}', String(beaten))}</small></>}
      {day?.place ? <p className="daily-result-target">{t('resultDayRank').replace('{rank}', fmt(day.place)).replace('{count}', fmt(day.participants))} · {day.next ? t('rankTarget').replace('{n}', fmt(day.next.gap + 1)).replace('{name}', day.next.name).replace('{place}', fmt(day.next.place)) : t('rankLeading')}</p> : null}
    </div>
    {askSave && <aside className="save-prompt" aria-labelledby="save-prompt-title">
      <strong id="save-prompt-title">{t('savePromptTitle')}</strong><p>{t('savePromptCopy')}</p>
      <div><button className="btn gold" onClick={() => { closeSave(); app.setModal?.('signup'); }}>{t('savePromptCta')}<ArrowRight size={17} aria-hidden="true"/></button><button className="btn ghost" onClick={closeSave}>{t('savePromptLater')}</button></div>
    </aside>}
    {next === undefined ? null : next
      ? <button className="btn primary btn-lg daily-result-next" disabled={busy || app.busy} onClick={go}>{busy ? t('loading') : t('loopNext').replace('{game}', t(dailyTitleKey(next)))}<ArrowRight size={19} aria-hidden="true"/></button>
      : bonusNext
        ? <div className="daily-result-bonus"><p>{t('bonusAfterDaily')}</p><button className="btn primary btn-lg daily-result-next" disabled={!!bonusLaunch.launching || app.busy} onClick={() => bonusLaunch.open(bonusNext)}>{bonusLaunch.launching ? t('loading') : t('bonusCta').replace('{game}', t(bonusNext))}<ArrowRight size={19} aria-hidden="true"/></button></div>
        : <p className="daily-result-done">{t('loopAllDone')} <ResetCountdown label={t('heroResetIn')} t={t}/></p>}
  </section>;
}
