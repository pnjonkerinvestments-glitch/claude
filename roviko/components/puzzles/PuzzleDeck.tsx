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
import { ResetCountdown } from '../atelier/ResetCountdown';

export function PuzzleDeck({ app, dailyPage = false, welcome = false }: { app: any; dailyPage?: boolean; welcome?: boolean }) {
  const { t, locale, boot, refresh, go, fail, start } = app;
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
      if (!boot.user.id) { const ready = await refresh(); if (!ready) throw new Error('SESSION_EXPIRED'); }
      const game = await post(mode === 'rank' ? '/ranks' : '/puzzles', { mode, daily, topic, size: +size });
      setPractice(null); go((mode === 'rank' ? '/rank/' : '/puzzle/') + game.id);
    } catch (e) { fail(e); } finally { launching.current = false; setBusy(''); }
  }
  const modes = DAILY_MODES;
  const completed = completedDailies(today?.sessions);
  const stateOf = (mode: DailyMode) => dailyStateOf(today?.sessions, mode);
  const title = (mode: DailyMode) => t(dailyTitleKey(mode));
  const launch = (mode: DailyMode) => mode === 'daily' ? start({ ...DEFAULT_SETTINGS, mode: 'daily' }) : play(mode);
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
        const state = stateOf(mode);
        return <article key={mode} className={'daily-card daily-card-' + mode + ' is-' + state}>
          <div className="daily-cover"><GameCover mode={mode}/><span className={'daily-state state-' + state}>{state === 'done' && <Check size={14}/>} {t(!today ? 'dailyStatusPending' : state === 'done' ? 'dailyDoneState' : state === 'active' ? 'dailyActiveState' : 'dailyNewState')}</span></div>
          <div className="daily-card-body">
          <div className="daily-card-copy"><h3>{t(mode === 'daily' ? 'dailyTitle' : mode)}</h3><p>{t(mode + 'CardCopy')}</p></div>
          <button className="btn daily-card-action" disabled={app.busy || !!busy} onClick={() => launch(mode)} aria-label={t(state === 'done' ? 'puzzleViewResult' : state === 'active' ? 'puzzleResume' : 'dailyStart') + ' · ' + t(mode === 'daily' ? 'dailyTitle' : mode)}>{app.busy || busy === mode ? t('loading') : t(state === 'done' ? 'puzzleViewResult' : state === 'active' ? 'puzzleResume' : 'dailyStart')}<ArrowRight size={18}/></button></div>
        </article>;
      })}
    </div>
    {loadError && <p className="inline-error" role="alert">{t('dailyStatusUnavailable')} <button className="text-link" onClick={() => setReload(n => n+1)}>{t('retry')}</button></p>}
    {dailyPage && today && <DailyRhythm week={today.week} date={today.date} tomorrowTopic={today.tomorrowTopic} locale={locale} t={t}/>}
    {dailyPage && badge && <div className="goal-nudge"><span className="goal-nudge-medal" aria-hidden="true">🏅</span><div><small>{t('goalNudge')}</small><strong>{badge.name[locale as 'en' | 'nl']}</strong></div><span className="goal-bar" aria-hidden="true"><i style={{ width: badge.progress * 100 + '%' }}/></span><b>{Math.min(badge.value, badge.target)}/{badge.target}</b></div>}
    {welcome && today && <MysteryCountry key={today.date} date={today.date} t={t} locale={locale}/>}
    <div className="daily-quiet-options"><span className="practice-label" aria-hidden="true">{t('extraPractice')}</span><div className="daily-practice-links" role="group" aria-label={t('extraPractice')}><button className="text-link" disabled={!!busy} onClick={() => play('rank', false)}>{t('rankPractice')}<ArrowRight size={14}/></button><button className="text-link" onClick={() => setPractice('compare')}>{t('puzzleBrowseTopics')}<ArrowRight size={14}/></button><button className="text-link" onClick={() => setPractice('mosaic')}>{t('freshMosaic')}<ArrowRight size={14}/></button></div>{dailyPage && <span className="practice-reset">{t('dailyResetLocal').replace('{time}', new Date(new Date().setUTCHours(24,0,0,0)).toLocaleTimeString(locale, { hour:'2-digit', minute:'2-digit', timeZoneName:'short' }))}</span>}</div>
    <Dialog open={!!practice} onOpenChange={v => !v && setPractice(null)}><DialogContent className="app-modal puzzle-setup"><span className="puzzle-sticker" aria-hidden="true">{practice === 'compare' ? '⚖️' : '🧩'}</span><DialogTitle className="modal-title">{t(practice ?? 'compare')}</DialogTitle><DialogDescription>{t('puzzlePracticeCopy')}</DialogDescription>{practice === 'compare' ? <label className="field"><span>{t('puzzleTopic')}</span><Select value={topic} onValueChange={setTopic}><SelectTrigger className="select-trigger" aria-label={t('puzzleTopic')}><SelectValue/></SelectTrigger><SelectContent>{TOPICS.map(topic => <SelectItem value={topic.id} key={topic.id}>{topic.emoji} {topic.label[locale as 'en' | 'nl']}</SelectItem>)}</SelectContent></Select></label> : <><p className="field-label">{t('puzzleCluesPerCountry')}</p><Tabs value={size} onValueChange={setSize}><TabsList className="app-tabs puzzle-size-tabs">{['3','4','5'].map(n => <TabsTrigger key={n} value={n}>{n} {t('puzzleClues')}<small>{+n * 4} {t('puzzleTiles')}</small></TabsTrigger>)}</TabsList></Tabs><p className="muted">{t('puzzleSize' + size)}</p></>}<button className="btn primary wide" disabled={!!busy} onClick={() => play(practice!, false)}><Shuffle size={18}/>{busy ? t('loading') : t('puzzleStartPractice')}</button></DialogContent></Dialog>
  </section></>;
}
