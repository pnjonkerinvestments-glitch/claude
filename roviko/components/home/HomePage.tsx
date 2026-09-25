'use client';
import React, { useRef, useState } from 'react';
import { ArrowRight, CalendarDays, Check, ChevronRight, Flame, ShieldCheck, Star, Target, Trophy } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DAILY_MODES, completedDailies, dailyStateOf, nextDailyMode, streakAtRisk, streakMilestone, type DailyMode } from '@/lib/daily-loop';
import { useApp } from '../app/context';
import { A } from '../app/shared';
import { dailyTitleKey } from '../atelier/DailyLoop';
import { DailyQuests, type Quest } from '../atelier/DailyQuests';
import { MysteryCountry } from '../atelier/MysteryCountry';
import { Mascot, type MascotMood } from '../ds/Mascot';
import { SectionHeader, Skeleton } from '../ds/States';
import { launchDaily } from '../puzzles/PuzzleDeck';
import { CoverArt } from './CoverArt';
import { GameCard } from './GameCard';
import { useCompetition, useResetLabel, useToday } from './useDay';

/** The globe with one arc per daily game around it; finished games light up in their own colour. */
function MascotRing({ states, mood, bubble }: { states: ('new' | 'active' | 'done')[]; mood: MascotMood; bubble: string }) {
  const ring = 2 * Math.PI * 46, arc = ring / DAILY_MODES.length;
  return <div className="hero-mascot" aria-hidden="true">
    <span className="hero-bubble" key={bubble}>{bubble}</span>
    <svg className="hero-ring" viewBox="0 0 100 100">
      <circle className="hero-ring-track" cx="50" cy="50" r="46"/>
      {DAILY_MODES.map((mode, i) => <circle key={mode} className={'hero-ring-arc tone-' + mode + ' is-' + states[i]} cx="50" cy="50" r="46" strokeDasharray={`${arc - 7} ${ring - arc + 7}`} strokeDashoffset={-(arc * i) - 3.5}/>)}
    </svg>
    <Mascot mood={mood} size={260} className="hero-globe"/>
  </div>;
}

/** Seven small days, today last: played, saved by a shield, or still open. */
function WeekDots({ week, frozen, locale }: { week: { date: string; completed: boolean }[]; frozen: string[]; locale: string }) {
  return <ol className="week-dots">{week.map((d, i) => { const saved = frozen.includes(d.date); const today = i === week.length - 1; return <li key={d.date} className={(d.completed ? 'is-played' : saved ? 'is-saved' : '') + (today ? ' is-today' : '')}>
    <span className="week-dot">{d.completed ? <Check size={13} strokeWidth={3}/> : saved ? <ShieldCheck size={13} strokeWidth={2.6}/> : null}</span>
    <small>{new Date(d.date + 'T12:00:00Z').toLocaleDateString(locale, { weekday: 'narrow', timeZone: 'UTC' })}</small>
  </li>; })}</ol>;
}

export function HomePage() {
  const app = useApp(), { t, locale, boot, bootLoaded, go, fail } = app;
  const { data: today, error: todayError, retry } = useToday(boot);
  const { data: competition } = useCompetition(boot, today?.date);
  const [fallbackDate] = useState(() => new Date().toISOString().slice(0, 10));
  const date = today?.date ?? fallbackDate;
  const [mysteryOpen, setMysteryOpen] = useState(false), [launching, setLaunching] = useState('');
  const lock = useRef(false);
  const reset = useResetLabel(t);
  const n = (v: number) => v.toLocaleString(locale);

  const sessions = today?.sessions;
  const ready = bootLoaded && !!today;
  const states = DAILY_MODES.map(m => dailyStateOf(sessions, m));
  const completed = completedDailies(sessions), left = DAILY_MODES.length - completed;
  const next = today ? nextDailyMode(sessions) : DAILY_MODES[0];
  const allDone = !!today && completed === DAILY_MODES.length;
  const streak = boot.stats.dailyStreak ?? 0, goal = streakMilestone(streak);
  const freeze = boot.stats.streakFreezes as { available: number; nextIn: number; frozenDates: string[] } | undefined;
  const atRisk = !!today && streakAtRisk(streak, completed);
  const yesterdayDate = new Date(Date.parse(date + 'T00:00:00Z') - 86400000).toISOString().slice(0, 10);
  const savedByShield = !!today && completed === 0 && !!freeze?.frozenDates.includes(yesterdayDate);
  const firstVisit = bootLoaded && (boot.stats.dailyCount ?? 0) === 0 && completed === 0;
  const pointsToday = competition?.today.score ?? 0;
  const yesterday = competition?.yesterday?.score ?? 0;
  const bestDay = competition?.bestDay ?? null;
  const scoreOf = (mode: string) => competition?.scores.find(s => s.mode === mode)?.score;
  const name = (mode: DailyMode) => t(dailyTitleKey(mode));

  // What the globe says, from most to least urgent.
  const [mood, bubble]: [MascotMood, string] = !ready ? ['happy', t('heroBubble')]
    : allDone ? ['cheer', t('mascotDone')]
    : savedByShield ? ['wink', t('freezeSaved')]
    : atRisk ? ['worried', t('mascotRisk').replace('{n}', String(streak))]
    : firstVisit ? ['happy', t('mascotFirst')]
    : completed > 0 ? ['cheer', t(left === 1 ? 'mascotLeftOne' : 'mascotLeft').replace('{n}', String(left)).replace('{game}', next ? name(next) : '')]
    : ['happy', t('mascotStart')];

  async function open(mode: DailyMode) {
    if (lock.current) return; lock.current = true; setLaunching(mode);
    try { await launchDaily(app, mode); } catch (e) { fail(e); } finally { lock.current = false; setLaunching(''); }
  }
  const busy = !ready || !!launching || app.busy;
  const pickQuest = (q: Quest) => { if (busy) return; if (q.kind === 'mode' && q.mode) open(q.mode as DailyMode); else if (q.kind === 'mystery') setMysteryOpen(true); else if (q.kind === 'duel') go('/duel'); else if (next) open(next); };
  const cta = allDone ? t('tripDoneCta') : completed === 0 && next && dailyStateOf(sessions, next) === 'new' ? t('tripStart') : t('tripContinue').replace('{game}', next ? name(next) : '');
  const pointsGoal = allDone ? '' : yesterday > 0 && pointsToday < yesterday ? t('beatYesterday').replace('{n}', n(yesterday)) : bestDay && pointsToday < bestDay ? t('beatBestDay').replace('{n}', n(bestDay)) : '';

  return <div className="home">
    <section className={'home-hero-v2' + (atRisk ? ' is-at-risk' : '') + (allDone ? ' is-done' : '')} aria-labelledby="home-title">
      <div className="hero-copy">
        <p className="kicker">{t('homeKicker')}</p>
        <h1 id="home-title">{t('homeTitle')}</h1>
        <p className="lead">{atRisk ? t('streakAtRiskNote') : allDone && reset ? t('tripDoneCopy').replace('{time}', reset) : t('homeLead')}</p>
        <div className="hero-actions">
          <button className="btn primary btn-lg" disabled={busy} aria-busy={!!launching} onClick={() => allDone ? go('/leaderboard') : next && open(next)}>{cta}<ArrowRight size={20} aria-hidden="true"/></button>
          {!allDone && <A href="/how-to-play" className="text-link">{t('howToLink')}</A>}
        </div>
        {todayError && <p className="inline-error" role="alert">{t('dailyStatusUnavailable')} <button className="text-link" onClick={retry}>{t('retry')}</button></p>}
        <ul className="hero-stats" aria-label={t('statusLabel')}>
          <li className={'hero-stat stat-streak' + (streak > 0 ? ' is-on' : '') + (atRisk ? ' is-at-risk' : '')}>
            <span className="hero-stat-icon" aria-hidden="true"><Flame size={26} strokeWidth={2}/></span>
            <span>{ready ? <b>{streak}</b> : <Skeleton className="sk-num"/>}<small>{t('heroStatStreak')}</small></span>
            {ready && <span className="stat-meter" role="img" aria-label={t('heroStreakGoal').replace('{n}', String(goal.remaining)).replace('{target}', String(goal.target))}><i style={{ width: goal.progress * 100 + '%' }}/></span>}
            {!!freeze?.available && <span className="stat-shield" title={t('freezeExplain')}><ShieldCheck size={13} strokeWidth={2.6} aria-hidden="true"/><span className="sr-only">{t('freezeReady').replace('{n}', String(freeze.available))}</span><span aria-hidden="true">{freeze.available}</span></span>}
          </li>
          <li className="hero-stat stat-today">
            <span className="hero-stat-icon" aria-hidden="true"><Target size={26} strokeWidth={2.2}/></span>
            <span>{ready ? <b>{completed}/5</b> : <Skeleton className="sk-num"/>}<small>{t('heroStatToday')}</small></span>
          </li>
          <li className="hero-stat stat-points">
            <button type="button" onClick={() => go('/leaderboard')}>
              <span className="hero-stat-icon" aria-hidden="true"><Star size={26} strokeWidth={2}/></span>
              <span>{competition ? <b>{n(pointsToday)}</b> : <Skeleton className="sk-num"/>}<small>{t('heroStatPoints')}</small></span>
            </button>
          </li>
        </ul>
        {ready && pointsGoal && <p className="hero-nudge"><Trophy size={16} aria-hidden="true"/>{pointsGoal}</p>}
      </div>
      <MascotRing states={states} mood={mood} bubble={bubble}/>
    </section>

    <section className="home-section trip-v2" aria-labelledby="trip-title">
      <SectionHeader id="trip-title" kicker={t('tripKicker')} title={t('tripMixTitle')} action={<A href="/scoring" className="text-link">{t('howScoring')}<ArrowRight size={16} aria-hidden="true"/></A>}/>
      <p className="trip-summary"><span>{allDone && <Check size={17} strokeWidth={3} aria-hidden="true"/>}{t('journeyProgress').replace('{n}', String(completed))}</span><span className="trip-points"><Trophy size={16} aria-hidden="true"/>{n(pointsToday)}<small> / {n(5000)}</small></span></p>
      <ol className="tstops">{DAILY_MODES.map((mode, i) => {
        const state = states[i], isNext = !allDone && mode === next, points = scoreOf(mode);
        return <li key={mode} className={'tstop is-' + state + (isNext ? ' is-next' : '')}>
          <button type="button" onClick={() => open(mode)} disabled={busy} aria-label={`${i + 1}. ${name(mode)} · ${t(state === 'done' ? 'journeyStopDone' : state === 'active' ? 'journeyStopActive' : 'journeyStopNew')}`}>
            <span className="tstop-art"><CoverArt mode={mode}/><span className="tstop-num">{state === 'done' ? <Check size={15} strokeWidth={3}/> : i + 1}</span></span>
            <span className="tstop-body">
              <strong>{name(mode)}</strong>
              <small>{state === 'done' && points !== undefined ? t('journeyPoints').replace('{n}', n(points)) : isNext ? t('tripUpNext') : t(state === 'active' ? 'journeyStopActive' : 'tripUpTo')}</small>
            </span>
          </button>
        </li>;
      })}</ol>
    </section>

    <section className="home-section motivation" aria-label={t('allGamesYourDay')}>
      <div className="motivation-quests"><DailyQuests date={date} sessions={sessions ?? []} t={t} compact art onPick={pickQuest}/></div>
      <div className="motivation-week journey-card">
        <header><span className="week-flame" aria-hidden="true">{streak > 0 ? <Flame size={24} strokeWidth={2.2}/> : <CalendarDays size={24} strokeWidth={2.2}/>}</span><div><h2>{streak > 0 ? t('statusStreak').replace('{n}', String(streak)) : t('statusStreakZero')}</h2><p>{streak > 0 ? t('heroStreakGoal').replace('{n}', String(goal.remaining)).replace('{target}', String(goal.target)) : t('streakStartCopy')}</p></div><img className="card-corner-art" src="/art/journey-scene.webp" alt="" aria-hidden="true" width={203} height={232} loading="lazy" decoding="async"/></header>
        {today?.week ? <WeekDots week={today.week} frozen={freeze?.frozenDates ?? []} locale={locale}/> : <Skeleton className="sk-block sk-week"/>}
        <A href="/scoring#streaks" className="week-shield"><ShieldCheck size={18} aria-hidden="true"/><span>{freeze?.available ? t('freezeReady').replace('{n}', String(freeze.available)) : t('freezeNext').replace('{n}', String(freeze?.nextIn ?? 7))}</span><ChevronRight size={18} aria-hidden="true"/></A>
      </div>
    </section>

    <section className="home-section" aria-labelledby="more-title">
      <SectionHeader id="more-title" title={t('moreTitle')} action={<A href="/daily" className="text-link">{t('viewAllGames')}<ArrowRight size={16} aria-hidden="true"/></A>}/>
      <div className="card-row more-row">
        <GameCard mode="duel" title={t('duel')} tagline={t('cardDuelTag')} meta={t('cardNoPoints')} cta={t('cardPlay')} onClick={() => go('/duel')}/>
        <GameCard mode="mystery" title={t('cardMysteryTitle')} tagline={t('cardMysteryTag')} meta={t('cardNoPoints')} cta={t('cardOpen')} onClick={() => setMysteryOpen(true)}/>
        <GameCard mode="classic" title={t('cardClassicTitle')} tagline={t('cardClassicTag')} meta={t('cardNoPoints')} cta={t('cardOpen')} onClick={() => go('/daily#classic')}/>
      </div>
    </section>


    <Dialog open={mysteryOpen} onOpenChange={setMysteryOpen}>
      <DialogContent className="app-modal mystery-modal">
        <DialogTitle className="sr-only">{t('cardMysteryTitle')}</DialogTitle>
        <DialogDescription className="sr-only">{t('cardMysteryTag')}</DialogDescription>
        {mysteryOpen && <MysteryCountry key={date} date={date} t={t} locale={locale}/>}
      </DialogContent>
    </Dialog>
  </div>;
}
