'use client';
import { plural } from '@/lib/plural';
import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, ChevronRight, Flame, ShieldCheck, Star, Target, Trophy } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DAY_MODES, completedDailies, dailyStateOf, nextDailyMode, streakAtRisk, type DayMode } from '@/lib/daily-loop';
import { DAILY_TOTAL_MAX } from '@/lib/daily-scoring';
import { useApp } from '../app/context';
import { A } from '../app/shared';
import { dailyTitleKey } from '../atelier/DailyLoop';
import { DailyQuests, useQuests, type Quest } from '../atelier/DailyQuests';
import { GameIcon } from '../atelier/GameIcon';
import { MysteryCountry } from '../atelier/MysteryCountry';
import type { MascotMood } from '../ds/Mascot';
import { Character, type CharacterMood, type CharacterPose } from '../ds/Character';
import { Skeleton } from '../ds/States';
import { launchDaily } from '../puzzles/PuzzleDeck';
import { useCompetition, useLeague, useResetLabel, useToday } from './useDay';
import { TierBadge, leagueLine } from '../atelier/League';
import { BonusTour, useBonusLaunch } from './BonusTour';
import { SurvivalRuns } from './Survival';
import { WelcomeCard, WelcomeTour, tourSeen } from './WelcomeTour';
import { AppPrompt, useAppPrompt } from './AppPrompt';
import { BONUS_MODES, bonusStateOf, nextBonusMode } from '@/lib/bonus';

/** The globe with one arc per scored game (the Daily Detour first); finished games light up in their own colour. */
/** The key words of a headline in brand green, as in the captions of the Roviko videos. */
function Highlight({ text, hl }: { text: string; hl: string }) {
  const i = hl && hl !== 'homeTitleHl' ? text.lastIndexOf(hl) : -1;
  return i < 0 ? <>{text}</> : <>{text.slice(0, i)}<span className="hl">{hl}</span>{text.slice(i + hl.length)}</>;
}

/** The home mascot is the video character: the same moods, with arms and legs that match them. */
const MOOD: Record<MascotMood, CharacterMood> = { happy: 'happy', cheer: 'cheer', wink: 'wink', worried: 'worried', sleepy: 'sleepy', curious: 'curious' };
const POSE: Record<MascotMood, CharacterPose> = { happy: 'wave', cheer: 'cheer', wink: 'hips', worried: 'shrug', sleepy: 'stand', curious: 'point' };

function MascotRing({ states, mood, bubble }: { states: ('new' | 'active' | 'done')[]; mood: MascotMood; bubble: string }) {
  const ring = 2 * Math.PI * 46, arc = ring / DAY_MODES.length;
  return <div className="hero-mascot" aria-hidden="true">
    <span className="hero-bubble" key={bubble}>{bubble}</span>
    <svg className="hero-ring" viewBox="0 0 100 100">
      <circle className="hero-ring-track" cx="50" cy="50" r="46"/>
      {DAY_MODES.map((mode, i) => <circle key={mode} className={'hero-ring-arc tone-' + mode + ' is-' + states[i]} cx="50" cy="50" r="46" strokeDasharray={`${arc - 7} ${ring - arc + 7}`} strokeDashoffset={-(arc * i) - 3.5}/>)}
    </svg>
    <Character mood={MOOD[mood]} pose={POSE[mood]} size={340} className="hero-character"/>
  </div>;
}

export function HomePage() {
  const app = useApp(), { t, locale, boot, bootLoaded, go, fail } = app;
  const { data: today, error: todayError, retry } = useToday(boot);
  const { data: competition } = useCompetition(boot, today?.date, !!today || todayError);
  const [fallbackDate] = useState(() => new Date().toISOString().slice(0, 10));
  const date = today?.date ?? fallbackDate;
  const [mysteryOpen, setMysteryOpen] = useState(false), [launching, setLaunching] = useState('');
  const lock = useRef(false);
  const reset = useResetLabel(t);
  const n = (v: number) => v.toLocaleString(locale);

  const sessions = today?.sessions;
  const ready = bootLoaded && !!today;
  const states = DAY_MODES.map(m => dailyStateOf(sessions, m));
  const completed = completedDailies(sessions), left = DAY_MODES.length - completed;
  const next = today ? nextDailyMode(sessions) : 'daily';
  const allDone = !!today && completed === DAY_MODES.length;
  // Once the scored games are done, the bonus tour takes over the hero: six classic games with today's countries.
  const bonus = today?.bonus, nextBonus = nextBonusMode(bonus), bonusLeft = BONUS_MODES.filter(m => bonusStateOf(bonus, m) !== 'done').length;
  const bonusLaunch = useBonusLaunch(app);
  // The hero button is the Daily Detour until it is finished, then it leads on to the next daily game.
  const detour = dailyStateOf(sessions, 'daily'), heroMode: DayMode | null = detour === 'done' ? next : 'daily';
  const streak = boot.stats.dailyStreak ?? 0;
  const freeze = boot.stats.streakFreezes as { available: number; nextIn: number; frozenDates: string[] } | undefined;
  const atRisk = !!today && streakAtRisk(streak, completed);
  const yesterdayDate = new Date(Date.parse(date + 'T00:00:00Z') - 86400000).toISOString().slice(0, 10);
  const savedByShield = !!today && completed === 0 && !!freeze?.frozenDates.includes(yesterdayDate);
  const firstVisit = bootLoaded && (boot.stats.dailyCount ?? 0) === 0 && completed === 0;
  // The welcome tour: once on a first visit, and whenever the menu asks for it.
  const [tourOpen, setTourOpen] = useState(false);
  useEffect(() => {
    const ask = () => { try { sessionStorage.removeItem('roviko:tour-open'); } catch { /* ignore */ } setTourOpen(true); };
    let asked = false; try { asked = sessionStorage.getItem('roviko:tour-open') === '1'; } catch { /* ignore */ }
    if (asked) ask();
    window.addEventListener('roviko:tour', ask);
    return () => window.removeEventListener('roviko:tour', ask);
  }, []);
  // iPhone visitors in the browser first get the app screen; the tour follows only if they stay here.
  const appPrompt = useAppPrompt();
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  useEffect(() => { if (appPrompt.decided && !appPrompt.open && firstVisit && !tourSeen()) setWelcomeOpen(true); }, [firstVisit, appPrompt.decided, appPrompt.open]);
  const pointsToday = competition?.today.score ?? 0;
  const scoreOf = (mode: string) => competition?.scores.find(s => s.mode === mode)?.score;
  const name = (mode: DayMode) => t(dailyTitleKey(mode));

  // What the globe says, from most to least urgent.
  const [mood, bubble]: [MascotMood, string] = !ready ? ['happy', t('heroBubble')]
    : allDone ? (nextBonus ? ['cheer', bonusLeft === BONUS_MODES.length ? t('mascotBonus') : t('mascotBonusLeft').replace('{n}', String(bonusLeft))] : ['cheer', t('mascotDone')])
    : savedByShield ? ['wink', t('freezeSaved')]
    : atRisk ? ['worried', plural(t, 'mascotRisk', streak)]
    : firstVisit ? ['happy', t('mascotFirst')]
    : completed > 0 ? ['cheer', t(left === 1 ? 'mascotLeftOne' : 'mascotLeft').replace('{n}', String(left)).replace('{game}', next ? name(next) : '')]
    : ['happy', t('mascotStart')];

  async function open(mode: DayMode) {
    if (lock.current) return; lock.current = true; setLaunching(mode);
    try { await launchDaily(app, mode); } catch (e) { fail(e); } finally { lock.current = false; setLaunching(''); }
  }
  const busy = !ready || !!launching || !!bonusLaunch.launching || app.busy;
  const pickQuest = (q: Quest) => { if (busy) return; if (q.kind === 'mode' && q.mode) open(q.mode as DayMode); else if (q.kind === 'mystery') setMysteryOpen(true); else if (q.kind === 'detour') open('daily'); else if (next) open(next); };
  const cta = allDone ? (nextBonus ? t('bonusCta').replace('{game}', t(nextBonus)) : t('tripDoneCta')) : detour === 'new' ? t('tripStart') : detour === 'active' ? t('heroDetourContinue') : t('tripContinue').replace('{game}', heroMode ? name(heroMode) : '');
  const standing = competition?.today;

  const week = competition?.week;
  const weekLine = week?.place ? t('weekRankLine').replace('{rank}', n(week.place)).replace('{count}', n(week.participants)) : standing?.place ? t('resultDayRank').replace('{rank}', n(standing.place)).replace('{count}', n(standing.participants)) : '';
  const questsDone = useQuests(date, sessions ?? []).quests.filter(q => q.done).length;
  const { data: league } = useLeague(boot);
  const leagueRow = leagueLine(t, league);

  return <div className="home home-calm">
    <section className={'home-hero-v2' + (atRisk ? ' is-at-risk' : '') + (allDone ? ' is-done' : '')} aria-labelledby="home-title">
      <div className="hero-copy">
        <h1 id="home-title"><Highlight text={t('homeTitle')} hl={t('homeTitleHl')}/></h1>
        {(atRisk || allDone) && <p className="lead">{atRisk ? t('streakAtRiskNote') : nextBonus ? t('bonusLead') : reset ? t('tripDoneCopy').replace('{time}', reset) : ''}</p>}
        <div className="hero-actions">
          <button className="btn primary btn-lg" disabled={busy} aria-busy={!!launching} onClick={() => allDone ? (nextBonus ? bonusLaunch.open(nextBonus) : go('/leaderboard')) : heroMode && open(heroMode)}>{cta}<ArrowRight size={20} aria-hidden="true"/></button>
        </div>
        {todayError && <p className="inline-error" role="alert">{t('dailyStatusUnavailable')} <button className="text-link" onClick={retry}>{t('retry')}</button></p>}
        {firstVisit ? <p className="hero-first">{t('heroFirstTrip')}</p> : <ul className="hero-stats" aria-label={t('statusLabel')}>
          <li className={'hero-stat stat-streak' + (streak > 0 ? ' is-on' : '') + (atRisk ? ' is-at-risk' : '')}>
            <span className="hero-stat-icon" aria-hidden="true"><Flame size={22} strokeWidth={2}/></span>
            <span>{ready ? <b>{streak}</b> : <Skeleton className="sk-num"/>}<small>{t('heroStatStreak')}</small></span>
            {!!freeze?.available && <span className="stat-shield" title={t('freezeExplain')}><ShieldCheck size={13} strokeWidth={2.6} aria-hidden="true"/><span className="sr-only">{t('freezeReady').replace('{n}', String(freeze.available))}</span><span aria-hidden="true">{freeze.available}</span></span>}
          </li>
          <li className="hero-stat stat-today">
            <span className="hero-stat-icon" aria-hidden="true"><Target size={22} strokeWidth={2.2}/></span>
            <span>{ready ? <b>{completed}/{DAY_MODES.length}</b> : <Skeleton className="sk-num"/>}<small>{t('heroStatToday')}</small></span>
          </li>
          <li className="hero-stat stat-points">
            <button type="button" onClick={() => go('/leaderboard')}>
              <span className="hero-stat-icon" aria-hidden="true"><Star size={22} strokeWidth={2}/></span>
              <span>{competition ? <b>{n(pointsToday)}</b> : <Skeleton className="sk-num"/>}<small>{t('heroStatPoints')}</small></span>
            </button>
          </li>
        </ul>}
      </div>
      <MascotRing states={states} mood={mood} bubble={bubble}/>
    </section>

    {allDone && <BonusTour app={app} bonus={bonus} busy={busy} featured/>}
    {allDone && <SurvivalRuns app={app} survival={today?.survival} busy={busy}/>}

    {ready && boot.user.guest && (boot.stats.dailyCount ?? 0) > 0 && <aside className="guest-banner" aria-labelledby="guest-banner-title">
      <span className="guest-banner-icon" aria-hidden="true"><Flame size={20}/></span>
      <div><strong id="guest-banner-title">{plural(t, 'guestBannerTitle', Math.max(1, streak))}</strong></div>
      <button className="btn gold" onClick={() => app.setModal('signup')}>{t('savePromptCta')}<ArrowRight size={17} aria-hidden="true"/></button>
    </aside>}

    <div className="home-grid">
      <section className="home-today" aria-labelledby="today-title">
        <header className="today-head">
          <h2 id="today-title">{t('todayTitle')}</h2>
          <span className="today-meta"><b>{completed}/{DAY_MODES.length}</b> · <Trophy size={15} aria-hidden="true"/>{n(pointsToday)}<small> / {n(DAILY_TOTAL_MAX)}</small></span>
        </header>
        <ol className="today-list">{DAY_MODES.map(mode => {
          const state = dailyStateOf(sessions, mode), isNext = !allDone && mode === next, points = scoreOf(mode);
          return <li key={mode} className={'today-row is-' + state + (isNext ? ' is-next' : '')}>
            <button type="button" onClick={() => open(mode)} disabled={busy} aria-label={name(mode) + ' · ' + t(state === 'done' ? 'journeyStopDone' : state === 'active' ? 'journeyStopActive' : 'journeyStopNew')}>
              <span className="today-icon"><GameIcon mode={mode}/></span>
              <span className="today-name"><strong>{name(mode)}</strong><small>{state === 'done' ? t('todayDone') : state === 'active' ? t('journeyStopActive') : isNext ? t('tripUpNext') : t('tripUpTo')}</small></span>
              <span className="today-end">{state === 'done' ? <><b>{points !== undefined ? n(points) : ''}</b><Check size={18} strokeWidth={3} aria-hidden="true"/></> : isNext ? <span className="today-play">{t('todayGo')}<ArrowRight size={16} aria-hidden="true"/></span> : <ChevronRight size={18} aria-hidden="true"/>}</span>
            </button>
          </li>;
        })}</ol>
        <p className="today-foot">{reset && <span>{t('heroResetIn')} <b>{reset}</b></span>}<A href="/daily" className="text-link">{t('todayAllGames')}<ArrowRight size={15} aria-hidden="true"/></A></p>
      </section>
      <aside className="home-side" aria-label={t('allGamesYourDay')}>
        {boot.user.guest
          ? <A href="/leaderboard" className="side-row side-rank"><span className="side-icon" aria-hidden="true"><Trophy size={20}/></span><span><strong>{t('leaderboard')}</strong><small>{weekLine || t('weekRankEmpty')}</small></span><ChevronRight size={18} aria-hidden="true"/></A>
          : <A href="/leaderboard#league" className="side-row side-league"><span className="side-icon side-tier" aria-hidden="true"><TierBadge tier={league?.tier ?? 0} size={26}/></span><span><strong>{leagueRow.title}</strong><small>{leagueRow.sub || t('loading')}</small></span><ChevronRight size={18} aria-hidden="true"/></A>}
        <details className="side-row quests-fold">
          <summary><span className="side-icon" aria-hidden="true"><Target size={20}/></span><span><strong>{t('questsTitle')}</strong><small>{t('questsLead')}</small></span><b className="fold-count">{questsDone}/3</b><ChevronRight size={18} className="fold-chevron" aria-hidden="true"/></summary>
          <DailyQuests date={date} sessions={sessions ?? []} t={t} compact onPick={pickQuest}/>
        </details>
      </aside>
    </div>

    <AppPrompt open={appPrompt.open} onClose={appPrompt.close} t={t}/>
    <WelcomeCard open={welcomeOpen} onOpenChange={setWelcomeOpen} t={t} onStart={() => open('daily')}/>
    <WelcomeTour open={tourOpen} onOpenChange={setTourOpen} guest={!!boot.user.guest} t={t} onStart={() => { if (!allDone && heroMode) open(heroMode); }} onSignup={() => app.setModal('signup')}/>

    <Dialog open={mysteryOpen} onOpenChange={setMysteryOpen}>
      <DialogContent className="app-modal mystery-modal">
        <DialogTitle className="sr-only">{t('cardMysteryTitle')}</DialogTitle>
        <DialogDescription className="sr-only">{t('cardMysteryTag')}</DialogDescription>
        {mysteryOpen && <MysteryCountry key={date} date={date} t={t} locale={locale}/>}
      </DialogContent>
    </Dialog>
  </div>;
}
