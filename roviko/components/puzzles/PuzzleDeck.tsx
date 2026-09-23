'use client';
import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, Shuffle, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GameCover } from '../atelier/GameCover';
import { DailyRhythm } from '../atelier/DailyRhythm';
import { api, post } from '@/lib/client';
import { DEFAULT_SETTINGS } from '@/lib/config';
import { TOPICS } from '@/lib/puzzles/topics';
import type { PuzzleMode } from '@/lib/puzzles/model';
import { ACHIEVEMENTS } from '@/lib/achievements';
import { DAILY_MODES, completedDailies, dailyStateOf, nearestAchievement, nextDailyMode, streakAtRisk, streakMilestone, type DailyMode } from '@/lib/daily-loop';
import { dailyTitleKey } from '../atelier/DailyLoop';
import { MysteryCountry } from '../atelier/MysteryCountry';
import { NativeReminder } from '../atelier/NativeReminder';
import { ResetCountdown } from '../atelier/ResetCountdown';
import { HowToPlayButton } from '../atelier/HowToPlay';

const PRACTICE_LABELS: Record<DailyMode, string> = { rank: 'tilePracticeRank', daily: 'tilePracticeDaily', compare: 'puzzleBrowseTopics', mosaic: 'tilePracticeMosaic' };

/** Start (or resume) a daily or practice puzzle and open it. */
type PuzzleLauncher = { boot: { user: { id: string } }; refresh: () => Promise<unknown>; go: (href: string) => void };
export async function openPuzzle(app: PuzzleLauncher, mode: PuzzleMode | 'rank', daily = true, options: { topic?: string; size?: number } = {}) {
  if (!app.boot.user.id) { const ready = await app.refresh(); if (!ready) throw new Error('SESSION_EXPIRED'); }
  const game = await post(mode === 'rank' ? '/ranks' : '/puzzles', { mode, daily, ...options });
  app.go((mode === 'rank' ? '/rank/' : '/puzzle/') + game.id);
}

export function PuzzleDeck({ app, dailyPage = false, welcome = false }: { app: any; dailyPage?: boolean; welcome?: boolean }) {
  const { t, locale, boot, go, fail, start } = app;
  const launching = useRef(false);
  const [loadError, setLoadError] = useState(false), [reload, setReload] = useState(0);
  const [today, setToday] = useState<any>(null), [practice, setPractice] = useState<PuzzleMode | null>(null);
  const [topic, setTopic] = useState(TOPICS[0].id), [size, setSize] = useState('4'), [busy, setBusy] = useState('');
  useEffect(() => {
    if (!boot.user.id) return;
    setToday(null);
    let requestVersion=0;
    let active = true, timer: ReturnType<typeof setTimeout>;
    const load = async () => {
      clearTimeout(timer); const version=++requestVersion;
      try { const state = await api('/puzzles/today'); if (active && version===requestVersion) { setToday(state); setLoadError(false); } } catch (e) { if (active && version===requestVersion) setLoadError(true); }
      if (active && version===requestVersion) timer = setTimeout(load, 86400000 - Date.now() % 86400000 + 500);
    };
    const visible = () => { if (document.visibilityState === 'visible') load(); };
    load(); document.addEventListener('visibilitychange', visible);
    return () => { active = false; clearTimeout(timer); document.removeEventListener('visibilitychange', visible); };
  }, [boot.user.id, reload]);
  async function play(mode: PuzzleMode | 'rank', daily = true) {
    if (launching.current) return;
    launching.current = true; setBusy(mode);
    try {
      await openPuzzle(app, mode, daily, { topic, size: +size });
      setPractice(null);
    } catch (e) { fail(e); } finally { launching.current = false; setBusy(''); }
  }
  const modes = DAILY_MODES;
  const completed = completedDailies(today?.sessions);
  const stateOf = (mode: DailyMode) => dailyStateOf(today?.sessions, mode);
  const title = (mode: DailyMode) => t(dailyTitleKey(mode));
  const launch = (mode: DailyMode) => mode === 'daily' ? start({ ...DEFAULT_SETTINGS, mode: 'daily' }) : play(mode);
  // Practice under each tile, like a "random" round: never touches today's shared puzzle.
  const practiceFor = (mode: DailyMode) => mode === 'rank' ? play('rank', false) : mode === 'daily' ? start({ ...DEFAULT_SETTINGS, mode: 'mixed', region: app.region ?? 'World' }) : setPractice(mode);
  const next = nextDailyMode(today?.sessions);
  const allDone = !!today && completed === modes.length;
  const streak = boot.stats.dailyStreak ?? 0, goal = streakMilestone(streak);
  const atRisk = !!today && streakAtRisk(streak, completed);
  const badge = nearestAchievement(ACHIEVEMENTS, boot.stats);
  const bubble = allDone ? t('heroBubbleDone') : atRisk ? t('heroBubbleRisk').replace('{n}', String(streak)) : completed > 0 ? t('heroBubbleLeft').replace('{n}', String(modes.length - completed)) : t('heroBubble');
  // Four arcs around the mascot, one per daily game; finished games light up in their colour.
  const ring = 2 * Math.PI * 46, arc = ring / modes.length;
  const hero = welcome && <section className={'play-hero' + (allDone ? ' is-done' : '') + (atRisk ? ' is-at-risk' : '')} aria-labelledby="hero-title">
    <div className="play-hero-copy">
      <h1 id="hero-title">{t('atelierTitle')}</h1>
      <p>{atRisk ? t('streakAtRiskNote') : t('atelierIntro')}</p>
      <div className="play-hero-actions">
        {allDone
          ? <button className="btn hero-cta" onClick={() => document.getElementById('modes')?.scrollIntoView({ behavior: 'smooth' })}>{t('chooseGame')}<ArrowRight size={20}/></button>
          : <button className="btn hero-cta" disabled={!today || !next || app.busy || !!busy} onClick={() => next && launch(next)}>{!today ? t('dailyStatusPending') : app.busy || busy ? t('loading') : t(next && stateOf(next) === 'active' ? 'heroContinue' : completed > 0 ? 'loopNext' : 'heroStart').replace('{game}', next ? title(next) : '')}<ArrowRight size={20}/></button>}
        {allDone && <ResetCountdown className="hero-reset" label={t('heroResetIn')}/>}
        {!allDone && completed === 0 && <button className="text-link hero-howto" onClick={() => go('/how-to-play')}>{t('howToHomeLink')}<ArrowRight size={16}/></button>}
      </div>
      <ul className="play-hero-stats">
        <li className={'stat-streak' + (atRisk ? ' at-risk' : '')}><span aria-hidden="true">🔥</span><b>{streak}</b><small>{t('heroStatStreak')}</small><em className="stat-goal" aria-label={t('heroStreakGoal').replace('{n}', String(goal.remaining)).replace('{target}', String(goal.target))}><i style={{ width: goal.progress * 100 + '%' }}/></em></li>
        <li className="stat-today"><span aria-hidden="true">🎯</span><b>{today ? completed : 0}/{modes.length}</b><small>{t('heroStatToday')}</small></li>
        <li className="stat-countries"><button onClick={() => go('/profile')}><span aria-hidden="true">🗺️</span><b>{boot.stats.discovered ?? 0}</b><small>{t('heroStatCountries')}</small></button></li>
      </ul>
    </div>
    <div className="play-hero-art" aria-hidden="true">
      <span className="hero-bubble" key={bubble}>{bubble}</span>
      <svg className="hero-ring" viewBox="0 0 100 100">
        <circle className="hero-ring-track" cx="50" cy="50" r="46"/>
        {modes.map((mode, i) => <circle key={mode} className={'hero-ring-arc arc-' + mode + (stateOf(mode) === 'done' ? ' is-done' : '')} cx="50" cy="50" r="46" strokeDasharray={`${arc - 7} ${ring - arc + 7}`} strokeDashoffset={-(arc * i) - 3.5}/>)}
      </svg>
      <img className="hero-mascot" src="/globe-logo.webp" alt="" width={280} height={280}/>
    </div>
  </section>;
  return <>{hero}<section className={'puzzle-deck-section atelier-dailies ' + (dailyPage ? 'daily-deck' : '')} aria-labelledby="today-title">
    <div className="atelier-section-heading"><h2 id="today-title">{t('todayPlay')}</h2><span>{today ? new Date(today.date + 'T12:00:00Z').toLocaleDateString(locale, { day: 'numeric', month: 'long', timeZone: 'UTC' }) : t('puzzleToday')}</span></div>
    <div className="daily-card-grid">
      {modes.map(mode => {
        const state = stateOf(mode), name = title(mode);
        const cta = t(state === 'done' ? 'puzzleViewResult' : state === 'active' ? 'puzzleResume' : 'dailyStart');
        return <article key={mode} className={'daily-card daily-card-' + mode + ' is-' + state}>
          <button className="daily-tile" disabled={app.busy || !!busy} onClick={() => launch(mode)} aria-label={cta + ' · ' + name}>
            <span className="daily-cover"><GameCover mode={mode}/><span className={'daily-state state-' + state}>{state === 'done' && <Check size={14}/>} {t(!today ? 'dailyStatusPending' : state === 'done' ? 'dailyDoneState' : state === 'active' ? 'dailyActiveState' : 'dailyNewState')}</span></span>
            <span className="daily-tile-copy"><strong className="daily-tile-title">{name}</strong><span>{t(mode + 'CardCopy')}</span></span>
            <span className="daily-tile-cta">{app.busy || busy === mode ? t('loading') : cta}<ArrowRight size={18}/></span>
          </button>
          <div className="daily-tile-actions">
            <button className="tile-btn" disabled={app.busy || !!busy} onClick={() => practiceFor(mode)}><Shuffle size={16}/>{t(PRACTICE_LABELS[mode])}</button>
            <HowToPlayButton mode={mode} t={t} locale={locale}/>
          </div>
        </article>;
      })}
    </div>
    {loadError && <p className="inline-error" role="alert">{t('dailyStatusUnavailable')} <button className="text-link" onClick={() => setReload(n => n+1)}>{t('retry')}</button></p>}
    {dailyPage && <p className="practice-reset">{t('dailyResetLocal').replace('{time}', new Date(new Date().setUTCHours(24,0,0,0)).toLocaleTimeString(locale, { hour:'2-digit', minute:'2-digit', timeZoneName:'short' }))}</p>}
    {dailyPage && today && <DailyRhythm week={today.week} date={today.date} tomorrowTopic={today.tomorrowTopic} locale={locale} t={t}/>}
    {dailyPage && badge && <div className="goal-nudge"><span className="goal-nudge-medal" aria-hidden="true">🏅</span><div><small>{t('goalNudge')}</small><strong>{badge.name[locale as 'en' | 'nl']}</strong></div><span className="goal-bar" aria-hidden="true"><i style={{ width: badge.progress * 100 + '%' }}/></span><b>{Math.min(badge.value, badge.target)}/{badge.target}</b></div>}
    {welcome && <div className="daily-extras">
      <div className="atelier-section-heading"><h2>{t('howToExtras')}</h2></div>
      <div className="daily-extras-grid">
        <button className="duel-tile" onClick={() => go('/duel')}>
          <span className="duel-tile-art" aria-hidden="true"><img src="/globe-logo.webp" alt="" width={72} height={72}/><span>⚔️</span></span>
          <span className="duel-tile-copy"><small>{t('duelCardTitle')}</small><strong>{t('duel')}</strong><span>{t('duelTagline')}</span></span>
          <span className="daily-tile-cta">{t('duelPlay')}<ArrowRight size={18}/></span>
        </button>
        {today && <MysteryCountry key={today.date} date={today.date} t={t} locale={locale}/>}
      </div>
    </div>}
    {welcome && <NativeReminder t={t}/>}
    <Dialog open={!!practice} onOpenChange={v => !v && setPractice(null)}><DialogContent className="app-modal puzzle-setup"><span className="puzzle-sticker" aria-hidden="true">{practice === 'compare' ? '⚖️' : '🧩'}</span><DialogTitle className="modal-title">{t(practice ?? 'compare')}</DialogTitle><DialogDescription>{t('puzzlePracticeCopy')}</DialogDescription>{practice === 'compare' ? <label className="field"><span>{t('puzzleTopic')}</span><Select value={topic} onValueChange={setTopic}><SelectTrigger className="select-trigger" aria-label={t('puzzleTopic')}><SelectValue/></SelectTrigger><SelectContent>{TOPICS.map(topic => <SelectItem value={topic.id} key={topic.id}>{topic.emoji} {topic.label[locale as 'en' | 'nl']}</SelectItem>)}</SelectContent></Select></label> : <><p className="field-label">{t('puzzleCluesPerCountry')}</p><Tabs value={size} onValueChange={setSize}><TabsList className="app-tabs puzzle-size-tabs">{['3','4','5'].map(n => <TabsTrigger key={n} value={n}>{n} {t('puzzleClues')}<small>{+n * 4} {t('puzzleTiles')}</small></TabsTrigger>)}</TabsList></Tabs><p className="muted">{t('puzzleSize' + size)}</p></>}<button className="btn primary wide" disabled={!!busy} onClick={() => play(practice!, false)}><Shuffle size={18}/>{busy ? t('loading') : t('puzzleStartPractice')}</button></DialogContent></Dialog>
  </section></>;
}
