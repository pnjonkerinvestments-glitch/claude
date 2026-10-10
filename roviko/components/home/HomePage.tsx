'use client';
import { plural } from '@/lib/plural';
import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, ChevronRight, Clock } from 'lucide-react';
import { RovikoIcon } from '../ds/RovikoIcons';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { completedDailies, dailyStateOf, dayModesFor, nextDailyMode, streakAtRisk, type DayMode } from '@/lib/daily-loop';
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
import { WelcomeTour, tourSeen } from './WelcomeTour';
import { ContinentCard } from './ContinentWeek';
import { AppPrompt, useAppPrompt } from './AppPrompt';
import { challengeLine, challengeRank, clearChallenge, useChallenge } from './ChallengeBanner';
import { BONUS_MODES, bonusStateOf, nextBonusMode } from '@/lib/bonus';

/** The key words of a headline in brand green, as in the captions of the Roviko videos. */
function Highlight({ text, hl }: { text: string; hl: string }) {
  const i = hl && hl !== 'homeTitleHl' ? text.lastIndexOf(hl) : -1;
  return i < 0 ? <>{text}</> : <>{text.slice(0, i)}<span className="hl">{hl}</span>{text.slice(i + hl.length)}</>;
}

/**
 * The homepage (1.23, trip style, after the owner's mock-ups): on the cream canvas Roviko with a speech bubble,
 * one headline and one forest pill to the next game. Under it today's trip as one white card: the progress
 * (six segments, games done, points) and the six games as a route. Then quietly the league or the rankings
 * and the folded daily quests. The bonus tour and survival only appear once the six scored games are done.
 * A shared link (?shared=daily&s=820) turns the top into the friend's challenge.
 */
export function HomePage() {
  const app = useApp(), { t, locale, boot, bootLoaded, fail } = app;
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
  // The six scored games of this UTC date (1.24: Country Mosaic before SHUFFLE_FROM, the daily Size Shuffle from then on).
  const lineup = dayModesFor(date);
  const completed = completedDailies(sessions, lineup), left = lineup.length - completed;
  const next = today ? nextDailyMode(sessions, lineup) : 'daily';
  const allDone = !!today && completed === lineup.length;
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
  // A friend's score from a shared link: Roviko says it and, while that game is still open, the pill plays it.
  const challenge = useChallenge();
  // 1.36: a challenge from an older edition is shown, but today's trip is what the button plays.
  const challengeMode: DayMode | null = !challenge || !ready || challenge.stale ? null : challenge.mode === 'day' ? upNext : dailyStateOf(sessions, challenge.mode) === 'done' ? null : challenge.mode;
  // The welcome tour: whenever the menu asks for it.
  const [tourOpen, setTourOpen] = useState(false);
  useEffect(() => {
    const ask = () => { try { sessionStorage.removeItem('roviko:tour-open'); } catch { /* ignore */ } setTourOpen(true); };
    let asked = false; try { asked = sessionStorage.getItem('roviko:tour-open') === '1'; } catch { /* ignore */ }
    if (asked) ask();
    window.addEventListener('roviko:tour', ask);
    return () => window.removeEventListener('roviko:tour', ask);
  }, []);
  // iPhone visitors in the browser first get the app screen; the tour follows only if they stay here (1.32: the
  // full tour on the first visit, ending on a free account for guests, instead of the one welcome card).
  const appPrompt = useAppPrompt();
  // A friend's challenge already gives the one next step, so the tour waits for a later visit.
  useEffect(() => { if (appPrompt.decided && !appPrompt.open && firstVisit && !challenge && !tourSeen()) setTourOpen(true); }, [firstVisit, challenge, appPrompt.decided, appPrompt.open]);
  const pointsToday = competition?.today.score ?? 0;
  const scoreOf = (mode: string) => competition?.scores.find(s => s.mode === mode)?.score;
  const name = (mode: DayMode) => t(dailyTitleKey(mode));

  // What Roviko says and how it stands there, from most to least urgent.
  const [mood, pose, bubble]: [CharacterMood, CharacterPose, string] = !ready ? ['happy', 'wave', '']
    : challenge && !allDone ? ['curious', 'point', challengeLine(t, locale, challenge) + (challengeRank(t, locale, challenge) ? ' · ' + challengeRank(t, locale, challenge) : '') + '. ' + t(challenge.stale ? 'chOldCall' : 'shareCall')]
    : allDone ? ['cheer', 'cheer', nextBonus ? (bonusLeft === BONUS_MODES.length ? t('mascotBonus') : plural(t, 'mascotBonusLeft', bonusLeft)) : t('homeDoneBubble')]
    : savedByShield ? ['wink', 'hips', t('freezeSaved')]
    : atRisk ? ['worried', 'shrug', plural(t, 'mascotRisk', streak)]
    : firstVisit ? ['happy', 'wave', t('mascotFirst')]
    : completed > 0 ? ['cheer', 'cheer', t(left === 1 ? 'mascotLeftOne' : 'mascotLeft').replace('{n}', String(left)).replace('{game}', upNext ? name(upNext) : '')]
    : ['happy', 'wave', t('mascotStart')];
  const risky = ready && atRisk && !savedByShield && !(challenge && !allDone);

  async function open(mode: DayMode) {
    if (lock.current) return; lock.current = true; setLaunching(mode);
    try { await launchDaily(app, mode); } catch (e) { fail(e); } finally { lock.current = false; setLaunching(''); }
  }
  const busy = !ready || !!launching || !!bonusLaunch.launching || app.busy;
  const pickQuest = (q: Quest) => { if (busy) return; if (q.kind === 'mode' && q.mode) open(q.mode as DayMode); else if (q.kind === 'mystery') setMysteryOpen(true); else if (q.kind === 'detour') open('daily'); else if (next) open(next); };
  const cta = challengeMode && challenge?.mode !== 'day' ? t('chPlay').replace('{game}', name(challengeMode))
    : completed === 0 && detour === 'new' ? t('tripStart') : detour === 'active' ? t('heroDetourContinue') : t('tripContinue').replace('{game}', upNext ? name(upNext) : '');
  const play = () => { const mode = challengeMode ?? upNext; if (!mode) return; if (challenge) clearChallenge(); open(mode); };

  const week = competition?.week, standing = competition?.today;
  const weekLine = week?.place ? t('weekRankLine').replace('{rank}', n(week.place)).replace('{count}', n(week.participants)) : standing?.place ? t('resultDayRank').replace('{rank}', n(standing.place)).replace('{count}', n(standing.participants)) : '';
  const questsDone = useQuests(date, sessions ?? []).quests.filter(q => q.done).length;
  const { data: league } = useLeague(boot);
  const leagueRow = leagueLine(t, league);
  const guestSave = ready && boot.user.guest && (boot.stats.dailyCount ?? 0) > 0;
  const progressLine = plural(t, 'homeProgress', completed).replace('{total}', String(lineup.length)) + ' · ' + plural(t, 'homePoints', pointsToday, '{n}', n(pointsToday));

  return <div className={'home home-trip' + (allDone ? ' is-done' : '') + (firstVisit ? ' is-first' : '') + (ready ? ' is-ready' : '')}>
    <section className="th-hero" aria-labelledby="home-title">
      <div className="th-stage">
        {/* The bubble is what Roviko says: real text, read before the headline. */}
        <p className={'th-bubble' + (risky ? ' is-risk' : '') + (bubble ? '' : ' is-empty')} key={bubble}>{risky && <FlameMark size={20}/>}{bubble || ' '}</p>
        <Character key={mood + pose} mood={mood} pose={pose} size={220} className="hero-character th-character"/>
      </div>
      <h1 id="home-title" className="th-title">{allDone ? t('homeDoneTitle') : challengeMode ? t('homeBeatIt') : <Highlight text={t('homeTitle')} hl={t('homeTitleHl')}/>}</h1>
      {allDone
        ? <p className="th-reset-line"><Clock size={17} aria-hidden="true"/>{reset ? t('resetIn').replace('{time}', reset) : ' '}</p>
        : <button className="btn primary btn-lg th-cta" disabled={busy} aria-busy={!!launching} onClick={play}>{cta}<ArrowRight size={20} aria-hidden="true"/></button>}
      {todayError && <p className="inline-error" role="alert">{t('dailyStatusUnavailable')} <button className="text-link" onClick={retry}>{t('retry')}</button></p>}
    </section>

    <div className="th-main">
      {/* 1.35: after the six games the continent of the week comes first, the bonus tour after it. */}
      {allDone && <ContinentCard featured/>}
      {allDone && <BonusTour app={app} bonus={bonus} busy={busy} compact/>}
      {allDone && <SurvivalRuns app={app} survival={today?.survival} busy={busy} compact/>}

      <section className="home-today th-trip" aria-labelledby="today-title">
        <header className="th-trip-head">
          <div className="th-trip-title">
            <h2 id="today-title">{t('tripKicker')}</h2>
            {!allDone && <p className="th-reset"><Clock size={14} aria-hidden="true"/>{reset ? t('resetIn').replace('{time}', reset) : ' '}</p>}
          </div>
          {!firstVisit && ready && (completed > 0 || pointsToday > 0) && <A href="/leaderboard" className="th-points" aria-label={plural(t, 'homePoints', pointsToday, '{n}', n(pointsToday)) + ' · ' + t('leaderboard')}><Coin size={20}/><b>{n(pointsToday)}</b></A>}
        </header>
        <div className="th-progress">
          <p className="sr-only">{progressLine}</p>
          <ol className="th-segs" aria-hidden="true">{lineup.map(mode => { const s = dailyStateOf(sessions, mode); return <li key={mode} className={'is-' + s + (mode === upNext ? ' is-next' : '')}/>; })}</ol>
          <b className="th-count" aria-hidden="true">{completed}/{lineup.length}</b>
        </div>
        {firstVisit && <p className="th-first">{t('homeFirstLine')}</p>}
        <ol className="today-list">{lineup.map(mode => {
          const state = dailyStateOf(sessions, mode), isNext = mode === upNext, points = scoreOf(mode), later = state === 'new' && !isNext;
          return <li key={mode} className={'today-row is-' + state + (isNext ? ' is-next' : '') + (later ? ' is-later' : '')}>
            <button type="button" onClick={() => open(mode)} disabled={busy} aria-busy={launching === mode} aria-label={name(mode) + ' · ' + (isNext ? t('tripUpNext') + ' · ' : '') + t(state === 'done' ? 'journeyStopDone' : state === 'active' ? 'journeyStopActive' : 'journeyStopNew') + (state === 'done' && points !== undefined ? ' · ' + plural(t, 'homePoints', points, '{n}', n(points)) : '')}>
              <span className="today-icon"><GameIcon mode={mode}/>{state === 'done' && <span className="th-tick"><Check size={12} strokeWidth={3.4}/></span>}</span>
              <span className="today-name"><strong>{name(mode)}</strong>{state === 'active' ? <small>{t('dailyActiveState')}</small> : isNext ? <small>{t('tripUpNext')}</small> : null}</span>
              <span className="today-end">{state === 'done'
                ? <span className="th-score">{points !== undefined ? <><Coin size={18}/><b>{n(points)}</b></> : <Check size={18} strokeWidth={3}/>}</span>
                : isNext ? <span className="t-pill th-play">{t('todayGo')}<ArrowRight size={16} aria-hidden="true"/></span>
                : <ChevronRight size={18} className={later ? 'th-later' : undefined}/>}</span>
            </button>
          </li>;
        })}</ol>
        <footer className="th-trip-foot">
          <A href="/daily" className="th-all">{t('todayAllGames')}<ArrowRight size={15} aria-hidden="true"/></A>
        </footer>
      </section>
    </div>

    <aside className="home-side" aria-label={t('allGamesYourDay')}>
      {guestSave && <div className="side-row guest-banner" role="group" aria-labelledby="guest-banner-title">
        <span className="side-icon side-flame" aria-hidden="true"><FlameMark size={22}/></span>
        <strong id="guest-banner-title">{plural(t, 'guestBannerTitle', Math.max(1, streak))}</strong>
        <button className="t-pill is-gold th-save" onClick={() => app.setModal('signup')}>{t('savePromptCta')}</button>
      </div>}
      {boot.user.guest
        ? <A href="/leaderboard" className="side-row side-rank"><span className="side-icon" aria-hidden="true"><RovikoIcon name="trophy" size={26}/></span><span className="side-copy"><strong>{t('leaderboard')}</strong><small>{weekLine || t('weekRankEmpty')}</small></span><ChevronRight size={18} aria-hidden="true"/></A>
        : <A href="/leaderboard#league" className="side-row side-league"><span className="side-icon side-tier" aria-hidden="true"><TierBadge tier={league?.tier ?? 0} size={26}/></span><span className="side-copy"><strong>{leagueRow.title}</strong><small>{leagueRow.sub || t('loading')}</small></span><ChevronRight size={18} aria-hidden="true"/></A>}
      <details className="side-row quests-fold">
        <summary><span className="side-icon" aria-hidden="true"><RovikoIcon name="target" size={26}/></span><span className="side-copy"><strong>{t('questsTitle')}</strong><small>{t('questsLead')}</small></span><b className="fold-count">{questsDone}/3</b><ChevronRight size={18} className="fold-chevron" aria-hidden="true"/></summary>
        <DailyQuests date={date} sessions={sessions ?? []} t={t} compact onPick={pickQuest}/>
      </details>
    </aside>

    <AppPrompt open={appPrompt.open} onClose={appPrompt.close} t={t}/>
    <WelcomeTour open={tourOpen} onOpenChange={setTourOpen} guest={!!boot.user.guest} t={t} onStart={() => { if (upNext) open(upNext); }} onSignup={() => app.setModal('signup')} onLogin={() => app.setModal('login')}/>

    <Dialog open={mysteryOpen} onOpenChange={setMysteryOpen}>
      <DialogContent className="app-modal mystery-modal">
        <DialogTitle className="sr-only">{t('cardMysteryTitle')}</DialogTitle>
        <DialogDescription className="sr-only">{t('cardMysteryTag')}</DialogDescription>
        {mysteryOpen && <MysteryCountry key={date} date={date} t={t} locale={locale}/>}
      </DialogContent>
    </Dialog>
  </div>;
}
