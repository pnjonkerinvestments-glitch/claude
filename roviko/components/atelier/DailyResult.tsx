'use client';
import { plural } from '@/lib/plural';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, Clock, Flame, Star, Users, X } from 'lucide-react';
import { api } from '@/lib/client';
import type { PointMode } from '@/lib/daily-scoring';
import { completedDailies, nextDailyMode, type DayMode } from '@/lib/daily-loop';
import { StreakMoment, streakMomentSeen } from '../ds/StreakMoment';
import { DaySummary } from './DaySummary';
import { launchDaily } from '../puzzles/PuzzleDeck';
import { CountUp } from '../ds/Celebration';
import { FinishStage, type FinishStageProps } from '../ds/FinishStage';
import { ResetCountdown } from './ResetCountdown';
import { dailyTitleKey } from './DailyLoop';
import { GameIcon } from './GameIcon';
import { nextBonusMode, type BonusMode } from '@/lib/bonus';
import { useBonusLaunch } from '../home/BonusTour';

type Standing = { score: number; place?: number; participants: number; next?: { name: string; gap: number; place: number } | null };
type ResultApp = Parameters<typeof launchDaily>[0] & { t: (key: string) => string; locale: string; share?: (text: string) => void; boot: { user?: { guest?: boolean }; stats: { dailyCount?: number; dailyStreak?: number; dailyDone?: boolean; streakFreezes?: { available?: number; nextIn?: number } } }; fail: (e: unknown) => void; busy?: boolean; setModal?: (m: string) => void };

const SAVE_KEY = 'roviko:save-prompt';
const readFlag = () => { try { return localStorage.getItem(SAVE_KEY) === 'done'; } catch { return true; } };
const writeFlag = () => { try { localStorage.setItem(SAVE_KEY, 'done'); } catch { /* shows again next time, that is fine */ } };

/**
 * The result of a daily game: the stage (Roviko, the points with a gold coin), then one white card with your
 * place among today's players and one forest pill on to the next daily game. After the sixth game the whole
 * screen becomes the day summary instead (Roviko cheering, the six games, the bonus tour, challenge a friend).
 */
export type ResultSummary = { label: string; value: string; icon?: 'check' | 'flame' | 'clock' }[];
export function DailyResult({ app, date, mode, summary, trail, stage }: { app: ResultApp; date: string; mode: PointMode; summary?: ResultSummary; trail?: boolean[]; stage?: Omit<FinishStageProps, 'score' | 'max' | 'locale' | 'unit'> }) {
  const { t, locale, boot, fail } = app;
  const [game, setGame] = useState<Standing | null>(null), [day, setDay] = useState<Standing | null>(null), [best, setBest] = useState<number | undefined>(), [next, setNext] = useState<DayMode | null | undefined>(), [busy, setBusy] = useState(false), [bonusNext, setBonusNext] = useState<BonusMode | null>(null);
  const [standingLoaded, setStandingLoaded] = useState(false);
  const bonusLaunch = useBonusLaunch({ go: app.go, fail });
  const lock = useRef(false);
  const [scores, setScores] = useState<{ mode: string; score: number }[]>([]);
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
    api('/competition?date=' + date + '&mode=' + mode).then(r => { if (active) { setGame(r.game ?? null); setDay(r.today ?? null); setBest(r.personalBest?.[mode]?.best); setScores(r.scores ?? []); } }).catch(() => {}).finally(() => { if (active) setStandingLoaded(true); });
    api('/puzzles/today?competition=1').then(r => { if (active) { setNext(nextDailyMode(r.sessions)); setBonusNext(nextBonusMode(r.bonus)); setWeek(r.week); setFirstToday(r.date === date && completedDailies(r.sessions) === 1); } }).catch(() => { if (active) setNext(null); });
    return () => { active = false; };
  }, [date, mode, boot.stats.dailyCount]);
  const dayDone = next === null && scores.length >= 6;
  // Which screen to show is decided once, as soon as both answers are in (or after a short wait), so the
  // last game of the day goes straight to the day summary instead of swapping screens under the player.
  const [view, setView] = useState<'wait' | 'game' | 'day'>(stage ? 'wait' : 'game'), [waited, setWaited] = useState(false);
  useEffect(() => { const id = setTimeout(() => setWaited(true), 1500); return () => clearTimeout(id); }, []);
  const ready = next !== undefined && standingLoaded;
  if (view === 'wait' && (ready || waited)) setView(ready && dayDone ? 'day' : 'game');
  const fmt = (n: number) => n.toLocaleString(locale);
  const score = game?.score ?? 0, players = game?.participants ?? 0, place = game?.place ?? 0;
  // Share of today's other players you scored higher than (ties count as not beaten).
  const beaten = players > 1 && place ? Math.round((players - place) / (players - 1) * 100) : null;
  const isBest = best !== undefined && score > best;
  const go = async () => { if (!next || lock.current) return; lock.current = true; setBusy(true); try { await launchDaily(app, next); } catch (e) { fail(e); } finally { lock.current = false; setBusy(false); } };
  // The bonus tour after the day: today's next bonus game, or the bonus tab of all games when none is left.
  const toBonus = () => bonusNext ? bonusLaunch.open(bonusNext) : app.go('/daily#classic');
  // Once per guest, after a finished Detour (never before play or mid-game): keep your streak with a free account.
  const [askSave, setAskSave] = useState(false);
  useEffect(() => { if (mode === 'daily' && boot.user?.guest && !readFlag()) setAskSave(true); }, [mode, boot.user?.guest]);
  const closeSave = () => { writeFlag(); setAskSave(false); };
  const savePrompt = askSave && <aside className="save-prompt" aria-labelledby="save-prompt-title">
    <strong id="save-prompt-title">{t('savePromptTitle')}</strong><p>{t('savePromptCopy')}</p>
    <div><button className="btn secondary" onClick={() => { closeSave(); app.setModal?.('signup'); }}>{t('savePromptCta')}<ArrowRight size={17} aria-hidden="true"/></button><button className="btn ghost" onClick={closeSave}>{t('savePromptLater')}</button></div>
  </aside>;
  const streakMoment = <StreakMoment open={moment} date={date} streak={streak} week={week} shieldIn={boot.stats.streakFreezes?.nextIn} shields={boot.stats.streakFreezes?.available} t={t} onClose={() => setMoment(false)}/>;
  if (view === 'wait') return <div className="finish-wait" aria-busy="true"><span className="sr-only">{t('loading')}</span></div>;
  if (view === 'day') return <>
    {streakMoment}
    <DaySummary screen date={date} scores={scores} place={day?.place} players={day?.participants} streak={boot.stats.dailyStreak} t={t} locale={locale} share={app.share ?? (() => {})}
      current={mode} onBonus={toBonus} bonusBusy={!!bonusLaunch.launching || app.busy}/>
    {savePrompt}
  </>;
  const card = <section className={'daily-result' + (stage ? ' has-stage' : '')} aria-label={t('competitionScoreSaved')}>
    {!stage && <><div className="daily-result-score">
      <strong>{game ? <CountUp value={score} format={fmt}/> : '…'}<small> / {fmt(1000)}</small></strong>
      <span>{t('points')}{isBest && <b className="daily-result-best"><Star size={13} strokeWidth={2.6} aria-hidden="true"/>{t('celebrateBest')}</b>}</span>
    </div>
    {summary && summary.length > 0 && <ul className="daily-result-summary">{summary.map(item => <li key={item.label}>{item.icon === 'flame' ? <Flame size={16} aria-hidden="true"/> : item.icon === 'clock' ? <Clock size={16} aria-hidden="true"/> : <Check size={16} strokeWidth={3} aria-hidden="true"/>}<b>{item.value}</b><span>{item.label}</span></li>)}</ul>}
    {trail && trail.length > 0 && <ol className="daily-result-trail" aria-label={summary?.[0]?.label}>{trail.map((ok, i) => <li key={i} className={ok ? 'is-right' : 'is-wrong'} aria-label={String(i + 1)}>{ok ? <Check size={13} strokeWidth={3}/> : <X size={13} strokeWidth={3}/>}</li>)}</ol>}</>}
    <div className="daily-result-compare">
      <p><Users size={18} aria-hidden="true"/>{!game ? t('loading') : players <= 1 ? t('resultFirstPlayer') : plural(t, 'competitionRank', players, '{count}', fmt(players)).replace('{rank}', fmt(place))}</p>
      {beaten !== null && beaten > 0 && <><span className="daily-result-bar" aria-hidden="true"><i style={{ width: Math.max(4, beaten) + '%' }}/></span><small>{t('resultBeaten').replace('{n}', String(beaten))}</small></>}
      {day?.place ? <p className="daily-result-target">{t('resultDayRank').replace('{rank}', fmt(day.place)).replace('{count}', fmt(day.participants))} · {day.next ? t('rankTarget').replace('{n}', fmt(day.next.gap + 1)).replace('{name}', day.next.name).replace('{place}', fmt(day.next.place)) : t('rankLeading')}</p> : null}
    </div>
    {dayDone && <DaySummary date={date} scores={scores} place={day?.place} players={day?.participants} streak={boot.stats.dailyStreak} t={t} locale={locale} share={app.share ?? (() => {})}/>}
    {next === undefined ? <span className="daily-result-next is-pending" aria-hidden="true"/> : next
      ? <button className="btn primary btn-lg daily-result-next" disabled={busy || app.busy} aria-busy={busy} onClick={go}><GameIcon mode={next} size="sm"/><span>{busy ? t('loading') : t('loopNext').replace('{game}', t(dailyTitleKey(next)))}</span><ArrowRight size={19} aria-hidden="true"/></button>
      : bonusNext
        ? <div className="daily-result-bonus"><p>{t('bonusAfterDaily')}</p><button className="btn primary btn-lg daily-result-next" disabled={!!bonusLaunch.launching || app.busy} onClick={() => bonusLaunch.open(bonusNext)}><GameIcon mode={bonusNext} size="sm"/><span>{bonusLaunch.launching ? t('loading') : t('bonusCta').replace('{game}', t(bonusNext))}</span><ArrowRight size={19} aria-hidden="true"/></button></div>
        : <p className="daily-result-done">{t('loopAllDone')} <ResetCountdown label={t('dayNewIn')} t={t}/></p>}
    {/* The way on comes first; the once-per-guest save prompt waits quietly under it. */}
    {savePrompt}
  </section>;
  if (!stage) return <>{card}{streakMoment}</>;
  return <>
    {streakMoment}
    <FinishStage {...stage} coin score={game ? score : null} max={1000} unit={t('points')} locale={locale} chips={stage.chips ?? summary?.map(s => ({ ...s }))} trail={stage.trail ?? trail}>
      {stage.children}
      {isBest && <p className="fs-best"><Star size={15} strokeWidth={2.6} aria-hidden="true"/>{t('celebrateBest')}</p>}
    </FinishStage>
    {card}
  </>;
}
