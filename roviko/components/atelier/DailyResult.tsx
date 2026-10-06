'use client';
import { plural } from '@/lib/plural';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, Clock, Flame, Star, Users, X } from 'lucide-react';
import { api } from '@/lib/client';
import type { PointMode } from '@/lib/daily-scoring';
import { completedDailies, nextDailyMode, type DayMode } from '@/lib/daily-loop';
import { StreakMoment, streakMomentSeen } from '../ds/StreakMoment';
import { launchDaily } from '../puzzles/PuzzleDeck';
import { CountUp } from '../ds/Celebration';
import { FinishStage, type FinishStageProps } from '../ds/FinishStage';
import { ResetCountdown } from './ResetCountdown';
import { dailyTitleKey } from './DailyLoop';
import { nextBonusMode, type BonusMode } from '@/lib/bonus';
import { useBonusLaunch } from '../home/BonusTour';

type Standing = { score: number; place?: number; participants: number; next?: { name: string; gap: number; place: number } | null };
type ResultApp = Parameters<typeof launchDaily>[0] & { t: (key: string) => string; locale: string; boot: { user?: { guest?: boolean }; stats: { dailyCount?: number; dailyStreak?: number; dailyDone?: boolean; streakFreezes?: { available?: number; nextIn?: number } } }; fail: (e: unknown) => void; busy?: boolean; setModal?: (m: string) => void };

const SAVE_KEY = 'roviko:save-prompt';
const readFlag = () => { try { return localStorage.getItem(SAVE_KEY) === 'done'; } catch { return true; } };
const writeFlag = () => { try { localStorage.setItem(SAVE_KEY, 'done'); } catch { /* shows again next time, that is fine */ } };

/**
 * The whole result of a daily game in one card: your points, how that compares with everyone who played
 * today, and one button on to the next game. Replaces the long score panel and the "games left" overview.
 */
export type ResultSummary = { label: string; value: string; icon?: 'check' | 'flame' | 'clock' }[];
export function DailyResult({ app, date, mode, summary, trail, stage }: { app: ResultApp; date: string; mode: PointMode; summary?: ResultSummary; trail?: boolean[]; stage?: Omit<FinishStageProps, 'score' | 'max' | 'locale' | 'unit'> }) {
  const { t, locale, boot, fail } = app;
  const [game, setGame] = useState<Standing | null>(null), [day, setDay] = useState<Standing | null>(null), [best, setBest] = useState<number | undefined>(), [next, setNext] = useState<DayMode | null | undefined>(), [busy, setBusy] = useState(false), [bonusNext, setBonusNext] = useState<BonusMode | null>(null);
  const bonusLaunch = useBonusLaunch({ go: app.go, fail });
  const lock = useRef(false);
  // The streak moment: after the first finished daily game of the day, once, a moment after the score.
  const [week, setWeek] = useState<{ date: string; completed: boolean }[] | undefined>(), [firstToday, setFirstToday] = useState(false), [moment, setMoment] = useState(false);
  const streak = boot.stats.dailyStreak ?? 0;
  useEffect(() => {
    if (!firstToday || !boot.stats.dailyDone || streak < 1 || streakMomentSeen(date)) return;
    const id = setTimeout(() => setMoment(true), 1600);
    return () => clearTimeout(id);
  }, [firstToday, boot.stats.dailyDone, streak, date]);
  useEffect(() => {
    let active = true;
    api('/competition?date=' + date + '&mode=' + mode).then(r => { if (active) { setGame(r.game ?? null); setDay(r.today ?? null); setBest(r.personalBest?.[mode]?.best); } }).catch(() => {});
    api('/puzzles/today?competition=1').then(r => { if (active) { setNext(nextDailyMode(r.sessions)); setBonusNext(nextBonusMode(r.bonus)); setWeek(r.week); setFirstToday(r.date === date && completedDailies(r.sessions) === 1); } }).catch(() => { if (active) setNext(null); });
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
  const card = <section className={'daily-result' + (stage ? ' has-stage' : '')} aria-label={t('competitionScoreSaved')}>
    {!stage && <><div className="daily-result-score">
      <strong>{game ? <CountUp value={score} format={fmt}/> : '…'}<small> / {fmt(1000)}</small></strong>
      <span>{t('points')}{isBest && <b className="daily-result-best"><Star size={13} strokeWidth={2.6} aria-hidden="true"/>{t('celebrateBest')}</b>}</span>
    </div>
    {summary && summary.length > 0 && <ul className="daily-result-summary">{summary.map(item => <li key={item.label}>{item.icon === 'flame' ? <Flame size={16} aria-hidden="true"/> : item.icon === 'clock' ? <Clock size={16} aria-hidden="true"/> : <Check size={16} strokeWidth={3} aria-hidden="true"/>}<b>{item.value}</b><span>{item.label}</span></li>)}</ul>}
    {trail && trail.length > 0 && <ol className="daily-result-trail" aria-label={summary?.[0]?.label}>{trail.map((ok, i) => <li key={i} className={ok ? 'is-right' : 'is-wrong'} aria-label={String(i + 1)}>{ok ? <Check size={13} strokeWidth={3}/> : <X size={13} strokeWidth={3}/>}</li>)}</ol>}</>}
    {stage && isBest && <p className="daily-result-best is-banner"><Star size={15} strokeWidth={2.6} aria-hidden="true"/>{t('celebrateBest')}</p>}
    <div className="daily-result-compare">
      <p><Users size={17} aria-hidden="true"/>{!game ? t('loading') : players <= 1 ? t('resultFirstPlayer') : plural(t, 'competitionRank', players, '{count}', fmt(players)).replace('{rank}', fmt(place))}</p>
      {beaten !== null && beaten > 0 && <><span className="daily-result-bar" aria-hidden="true"><i style={{ width: Math.max(4, beaten) + '%' }}/></span><small>{t('resultBeaten').replace('{n}', String(beaten))}</small></>}
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
  const streakMoment = <StreakMoment open={moment} date={date} streak={streak} week={week} shieldIn={boot.stats.streakFreezes?.nextIn} shields={boot.stats.streakFreezes?.available} t={t} onClose={() => setMoment(false)}/>;
  if (!stage) return <>{card}{streakMoment}</>;
  return <>
    {streakMoment}
    <FinishStage {...stage} score={game ? score : null} max={1000} unit={t('points')} locale={locale} chips={stage.chips ?? summary?.map(s => ({ ...s }))} trail={stage.trail ?? trail}/>
    {card}
  </>;
}
