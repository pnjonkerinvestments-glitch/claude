'use client';
import { plural } from '@/lib/plural';
import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, ChevronRight, Clock, Lock, Target, Trophy } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DAY_MODES, completedDailies, dailyStateOf, nextDailyMode, streakAtRisk, type DayMode } from '@/lib/daily-loop';
import { useApp } from '../app/context';
import { A } from '../app/shared';
import { dailyTitleKey } from '../atelier/DailyLoop';
import { DailyQuests, useQuests, type Quest } from '../atelier/DailyQuests';
import { GameIcon } from '../atelier/GameIcon';
import { MysteryCountry } from '../atelier/MysteryCountry';
import { Character, type CharacterMood, type CharacterPose } from '../ds/Character';
import { Coin, FlameMark } from '../ds/Coin';
import { launchDaily } from '../puzzles/PuzzleDeck';
import { useCompetition, useLeague, useResetLabel, useToday } from './useDay';
import { TierBadge, leagueLine } from '../atelier/League';
import { BonusTour, useBonusLaunch } from './BonusTour';
import { SurvivalRuns } from './Survival';
import { WelcomeCard, WelcomeTour, tourSeen } from './WelcomeTour';
import { AppPrompt, useAppPrompt } from './AppPrompt';
import { BONUS_MODES, bonusStateOf, nextBonusMode } from '@/lib/bonus';

/** The key words of a headline in brand green, as in the captions of the Roviko videos. */
function Highlight({ text, hl }: { text: string; hl: string }) {
  const i = hl && hl !== 'homeTitleHl' ? text.lastIndexOf(hl) : -1;
  return i < 0 ? <>{text}</> : <>{text.slice(0, i)}<span className="hl">{hl}</span>{text.slice(i + hl.length)}</>;
}

/**
 * The homepage (1.23, trip style): Roviko on the cream canvas with a speech bubble, one headline, one forest
 * pill to the next game and the day's progress (six segments, games done, points). Under it today's trip as
 * a route of six white rows, then quietly the league or the rankings and the folded daily quests.
 * The bonus tour and survival only appear once the six scored games are done.
 */
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
  const completed = completedDailies(sessions), left = DAY_MODES.length - completed;
  const next = today ? nextDailyMode(sessions) : 'daily';
  const allDone = !!today && completed === DAY_MODES.length;
  // Once the scored games are done, the bonus tour takes over: six classic games with today's countries.
  const bonus = today?.bonus, nextBonus = nextBonusMode(bonus), bonusLeft = BONUS_MODES.filter(m => bonusStateOf(bonus, m) !== 'done').length;
  const bonusLaunch = useBonusLaunch(app);
  // The main button is the Daily Detour until it is finished, then it leads on to the next daily game.
  // The row marked "up next" is always the game the button opens.
  const detour = dailyStateOf(sessions, 'daily'), upNext: DayMode | null = allDone ? null : detour === 'done' ? next : 'daily';
  const streak = boot.stats.dailyStreak ?? 0;
  const freeze = boot.stats.streakFreezes as { available: number; nextIn: number; frozenDates: string[] } | undefined;
  const atRisk = !!today && streakAtRisk(streak, completed);
  const yesterdayDate = new Date(Date.parse(date + 'T00:00:00Z') - 86400000).toISOString().slice(0, 10);
  const savedByShield = !!today && completed === 0 && !!freeze?.frozenDates.includes(yesterdayDate);
  const firstVisit = bootLoaded && (boot.stats.dailyCount ?? 0) === 0 && completed === 0;
  // The welcome tour: whenever the menu asks for it.
  const [tourOpen, setTourOpen] = useState(false);
  useEffect(() => {
    const ask = () => { try { sessionStorage.removeItem('roviko:tour-open'); } catch { /* ignore */ } setTourOpen(true); };
    let asked = false; try { asked = sessionStorage.getItem('roviko:tour-open') === '1'; } catch { /* ignore */ }
    if (asked) ask();
    window.addEventListener('roviko:tour', ask);
    return () => window.removeEventListener('roviko:tour', ask);
  }, []);
  // iPhone visitors in the browser first get the app screen; the welcome card follows only if they stay here.
  const appPrompt = useAppPrompt();
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  useEffect(() => { if (appPrompt.decided && !appPrompt.open && firstVisit && !tourSeen()) setWelcomeOpen(true); }, [firstVisit, appPrompt.decided, appPrompt.open]);
  const pointsToday = competition?.today.score ?? 0;
  const scoreOf = (mode: string) => competition?.scores.find(s => s.mode === mode)?.score;
  const name = (mode: DayMode) => t(dailyTitleKey(mode));

  // What Roviko says and how it stands there, from most to least urgent.
  const [mood, pose, bubble]: [CharacterMood, CharacterPose, string] = !ready ? ['happy', 'wave', t('heroBubble')]
    : allDone ? ['cheer', 'cheer', nextBonus ? (bonusLeft === BONUS_MODES.length ? t('mascotBonus') : t('mascotBonusLeft').replace('{n}', String(bonusLeft))) : t('homeDoneBubble')]
    : savedByShield ? ['wink', 'hips', t('freezeSaved')]
    : atRisk ? ['worried', 'shrug', plural(t, 'mascotRisk', streak)]
    : firstVisit ? ['happy', 'wave', t('mascotFirst')]
    : completed > 0 ? ['cheer', 'cheer', t(left === 1 ? 'mascotLeftOne' : 'mascotLeft').replace('{n}', String(left)).replace('{game}', upNext ? name(upNext) : '')]
    : ['happy', 'wave', t('mascotStart')];

  async function open(mode: DayMode) {
    if (lock.current) return; lock.current = true; setLaunching(mode);
    try { await launchDaily(app, mode); } catch (e) { fail(e); } finally { lock.current = false; setLaunching(''); }
  }
  const busy = !ready || !!launching || !!bonusLaunch.launching || app.busy;
  const pickQuest = (q: Quest) => { if (busy) return; if (q.kind === 'mode' && q.mode) open(q.mode as DayMode); else if (q.kind === 'mystery') setMysteryOpen(true); else if (q.kind === 'detour') open('daily'); else if (next) open(next); };
  const cta = completed === 0 && detour === 'new' ? t('tripStart') : detour === 'active' ? t('heroDetourContinue') : t('tripContinue').replace('{game}', upNext ? name(upNext) : '');
  const standing = competition?.today;

  const week = competition?.week;
  const weekLine = week?.place ? t('weekRankLine').replace('{rank}', n(week.place)).replace('{count}', n(week.participants)) : standing?.place ? t('resultDayRank').replace('{rank}', n(standing.place)).replace('{count}', n(standing.participants)) : '';
  const questsDone = useQuests(date, sessions ?? []).quests.filter(q => q.done).length;
  const { data: league } = useLeague(boot);
  const leagueRow = leagueLine(t, league);
  const guestSave = ready && boot.user.guest && (boot.stats.dailyCount ?? 0) > 0;

  return <div className={'home home-trip' + (allDone ? ' is-done' : '') + (firstVisit ? ' is-first' : '')}>
    <section className="th-hero" aria-labelledby="home-title">
      <div className="th-stage" aria-hidden="true">
        <span className="th-bubble" key={bubble}>{bubble}</span>
        <Character key={mood + pose} mood={mood} pose={pose} size={220} className="hero-character th-character"/>
      </div>
      <h1 id="home-title" className="th-title">{allDone ? t('homeDoneTitle') : <Highlight text={t('homeTitle')} hl={t('homeTitleHl')}/>}</h1>
      {allDone
        ? <p className="th-reset-line"><Clock size={16} aria-hidden="true"/>{reset ? t('resetIn').replace('{time}', reset) : ' '}</p>
        : <button className="btn primary btn-lg th-cta" disabled={busy} aria-busy={!!launching} onClick={() => upNext && open(upNext)}>{cta}<ArrowRight size={20} aria-hidden="true"/></button>}
      {atRisk && <p className="th-nudge"><FlameMark size={18}/>{t('streakAtRiskNote')}</p>}
      {todayError && <p className="inline-error" role="alert">{t('dailyStatusUnavailable')} <button className="text-link" onClick={retry}>{t('retry')}</button></p>}
      <div className="th-progress" role="group" aria-label={t('statusLabel')}>
        <ol className="th-segs" aria-hidden="true">{DAY_MODES.map(mode => { const s = dailyStateOf(sessions, mode); return <li key={mode} className={'is-' + s + (mode === upNext ? ' is-next' : '')}/>; })}</ol>
        {firstVisit
          ? <p className="th-progress-line">{t('homeFirstLine')}</p>
          : <p className="th-progress-line"><span><b>{plural(t, 'homeProgress', completed).replace('{total}', String(DAY_MODES.length))}</b></span><span className="th-dot" aria-hidden="true">·</span><A href="/leaderboard" className="th-points"><Coin size={20}/><b>{plural(t, 'homePoints', pointsToday, '{n}', n(pointsToday))}</b></A></p>}
      </div>
    </section>

    {allDone && <BonusTour app={app} bonus={bonus} busy={busy} featured/>}
    {allDone && <SurvivalRuns app={app} survival={today?.survival} busy={busy}/>}

    <section className="home-today th-route" aria-labelledby="today-title">
      <header className="today-head">
        <h2 id="today-title">{t('tripKicker')}</h2>
        {reset && !allDone && <span className="th-reset"><Clock size={15} aria-hidden="true"/>{t('resetIn').replace('{time}', reset)}</span>}
      </header>
      <ol className="today-list">{DAY_MODES.map(mode => {
        const state = dailyStateOf(sessions, mode), isNext = mode === upNext, points = scoreOf(mode), later = state === 'new' && !isNext;
        return <li key={mode} className={'today-row is-' + state + (isNext ? ' is-next' : '') + (later ? ' is-later' : '')}>
          <button type="button" onClick={() => open(mode)} disabled={busy} aria-label={name(mode) + ' · ' + (isNext ? t('tripUpNext') + ' · ' : '') + t(state === 'done' ? 'journeyStopDone' : state === 'active' ? 'journeyStopActive' : 'journeyStopNew') + (state === 'done' && points !== undefined ? ' · ' + plural(t, 'homePoints', points, '{n}', n(points)) : '')}>
            <span className="today-icon"><GameIcon mode={mode}/>{state === 'done' && <span className="th-tick"><Check size={12} strokeWidth={3.4}/></span>}</span>
            <span className="today-name"><strong>{name(mode)}</strong>{isNext ? <small>{state === 'active' ? t('dailyActiveState') : t('tripUpNext')}</small> : state === 'active' ? <small>{t('dailyActiveState')}</small> : null}</span>
            <span className="today-end">{state === 'done'
              ? <span className="th-score">{points !== undefined ? <><Coin size={18}/><b>{n(points)}</b></> : <Check size={18} strokeWidth={3}/>}</span>
              : isNext ? <span className="t-pill th-play">{t('todayGo')}<ArrowRight size={16} aria-hidden="true"/></span>
              : later ? <Lock size={16} strokeWidth={2.4} className="th-lock"/> : <ChevronRight size={18}/>}</span>
          </button>
        </li>;
      })}</ol>
      <p className="today-foot"><A href="/daily" className="text-link">{t('todayAllGames')}<ArrowRight size={15} aria-hidden="true"/></A></p>
    </section>

    <aside className="home-side" aria-label={t('allGamesYourDay')}>
      {guestSave && <div className="side-row guest-banner" role="group" aria-labelledby="guest-banner-title">
        <span className="side-icon side-flame" aria-hidden="true"><FlameMark size={22}/></span>
        <span><strong id="guest-banner-title">{plural(t, 'guestBannerTitle', Math.max(1, streak))}</strong></span>
        <button className="t-pill is-gold th-save" onClick={() => app.setModal('signup')}>{t('savePromptCta')}</button>
      </div>}
      {boot.user.guest
        ? <A href="/leaderboard" className="side-row side-rank"><span className="side-icon" aria-hidden="true"><Trophy size={20}/></span><span><strong>{t('leaderboard')}</strong><small>{weekLine || t('weekRankEmpty')}</small></span><ChevronRight size={18} aria-hidden="true"/></A>
        : <A href="/leaderboard#league" className="side-row side-league"><span className="side-icon side-tier" aria-hidden="true"><TierBadge tier={league?.tier ?? 0} size={26}/></span><span><strong>{leagueRow.title}</strong><small>{leagueRow.sub || t('loading')}</small></span><ChevronRight size={18} aria-hidden="true"/></A>}
      <details className="side-row quests-fold">
        <summary><span className="side-icon" aria-hidden="true"><Target size={20}/></span><span><strong>{t('questsTitle')}</strong><small>{t('questsLead')}</small></span><b className="fold-count">{questsDone}/3</b><ChevronRight size={18} className="fold-chevron" aria-hidden="true"/></summary>
        <DailyQuests date={date} sessions={sessions ?? []} t={t} compact onPick={pickQuest}/>
      </details>
    </aside>

    <AppPrompt open={appPrompt.open} onClose={appPrompt.close} t={t}/>
    <WelcomeCard open={welcomeOpen} onOpenChange={setWelcomeOpen} t={t} onStart={() => open('daily')}/>
    <WelcomeTour open={tourOpen} onOpenChange={setTourOpen} guest={!!boot.user.guest} t={t} onStart={() => { if (upNext) open(upNext); }} onSignup={() => app.setModal('signup')}/>

    <Dialog open={mysteryOpen} onOpenChange={setMysteryOpen}>
      <DialogContent className="app-modal mystery-modal">
        <DialogTitle className="sr-only">{t('cardMysteryTitle')}</DialogTitle>
        <DialogDescription className="sr-only">{t('cardMysteryTag')}</DialogDescription>
        {mysteryOpen && <MysteryCountry key={date} date={date} t={t} locale={locale}/>}
      </DialogContent>
    </Dialog>
  </div>;
}
