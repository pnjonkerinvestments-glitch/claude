'use client';
import React, { useRef, useState } from 'react';
import { ArrowRight, Check, Clock, Trophy, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DAILY_MODES, completedDailies, dailyStateOf, nextDailyMode, streakAtRisk, type DailyMode } from '@/lib/daily-loop';
import { useApp } from '../app/context';
import { A, Avatar } from '../app/shared';
import { dailyTitleKey } from '../atelier/DailyLoop';
import { DailyQuests, useQuests } from '../atelier/DailyQuests';
import { MysteryCountry } from '../atelier/MysteryCountry';
import { SectionHeader } from '../ds/States';
import { launchDaily } from '../puzzles/PuzzleDeck';
import { CoverArt } from './CoverArt';
import { GameCard } from './GameCard';
import { ProgressRoute } from './ProgressRoute';
import { StatusBar } from './StatusBar';
import { useCompetition, useResetLabel, useToday } from './useDay';

/**
 * The homepage has one job: start today's trip. Everything else is one quiet step away.
 * Order: hero with the featured daily game, status, more to explore, today's route, play together.
 */
export function HomePage() {
  const app = useApp(), { t, locale, boot, bootLoaded, go, fail, setModal } = app;
  const { data: today, error: todayError, retry } = useToday(boot);
  const { data: competition } = useCompetition(boot, today?.date);
  const [fallbackDate] = useState(() => new Date().toISOString().slice(0, 10));
  const date = today?.date ?? fallbackDate;
  const { finished: questsDone } = useQuests(date, today?.sessions ?? []);
  const [questsOpen, setQuestsOpen] = useState(false), [mysteryOpen, setMysteryOpen] = useState(false);
  const [launching, setLaunching] = useState<string>('');
  const lock = useRef(false);
  const reset = useResetLabel(t);
  const format = (n: number) => n.toLocaleString(locale);

  const sessions = today?.sessions;
  const completed = completedDailies(sessions);
  const next = today ? nextDailyMode(sessions) : DAILY_MODES[0];
  const allDone = !!today && completed === DAILY_MODES.length;
  const featured: DailyMode = next ?? DAILY_MODES[0];
  const streak = boot.stats.dailyStreak ?? 0;
  const shields = boot.stats.streakFreezes?.available ?? 0;
  const atRisk = !!today && streakAtRisk(streak, completed);
  const scoreOf = (mode: string) => competition?.scores.find(s => s.mode === mode)?.score;
  const pointsToday = competition ? competition.today.score : null;
  const name = (mode: DailyMode) => t(dailyTitleKey(mode));

  async function open(mode: DailyMode) {
    if (lock.current) return; lock.current = true; setLaunching(mode);
    try { await launchDaily(app, mode); } catch (e) { fail(e); } finally { lock.current = false; setLaunching(''); }
  }
  const ready = bootLoaded && !!today;
  const busy = !ready || !!launching || app.busy;
  const featuredState = dailyStateOf(sessions, featured);
  const cta = allDone ? t('tripDoneCta') : completed === 0 && featuredState === 'new' ? t('tripStart') : t('tripContinue').replace('{game}', name(featured));

  return <div className="home">
    <section className="home-hero" aria-labelledby="home-title">
      <div className="home-hero-intro">
        <p className="kicker">{t('homeKicker')}</p>
        <h1 id="home-title">{t('homeTitle')}</h1>
        <p className="lead">{t('homeLead')}</p>
      </div>

      <article className={'trip-card trip-' + featured + (allDone ? ' is-done' : '')} aria-labelledby="trip-title">
        <div className="trip-copy">
          <p className="trip-kicker"><span>{t('tripKicker')}</span>{today && !allDone && <span className="trip-stop">{t('tripStopOf').replace('{n}', String(DAILY_MODES.indexOf(featured) + 1))}</span>}</p>
          {allDone ? <>
            <h2 id="trip-title" className="trip-title">{t('tripDoneTitle')}</h2>
            <p className="trip-tagline">{reset ? t('tripDoneCopy').replace('{time}', reset) : ' '}</p>
          </> : <>
            <h2 id="trip-title" className="trip-title">{name(featured)}</h2>
            <p className="trip-tagline">{t(featured + 'CardCopy')}</p>
          </>}
          <p className="trip-meta"><Clock size={15} aria-hidden="true"/>{t('tripMeta')}</p>
          <div className="trip-actions">
            <button className="btn primary btn-lg" disabled={busy} aria-busy={!!launching} onClick={() => allDone ? go('/leaderboard') : open(featured)}>{cta}<ArrowRight size={20} aria-hidden="true"/></button>
            <A href="/how-to-play" className="text-link">{t('howToLink')}</A>
          </div>
          {todayError && <p className="inline-error" role="alert">{t('dailyStatusUnavailable')} <button className="text-link" onClick={retry}>{t('retry')}</button></p>}
        </div>
        <div className="trip-art" aria-hidden="true">{allDone ? <img className="trip-globe" src="/globe-logo.webp" alt="" width={220} height={220}/> : <CoverArt mode={featured}/>}</div>
      </article>

      <StatusBar ready={ready} streak={streak} shields={shields} atRisk={atRisk} quests={questsDone} points={pointsToday} onQuests={() => setQuestsOpen(true)} onPoints={() => go('/leaderboard')} t={t} format={format}/>
      {ready && atRisk && <p className="status-note">{t('streakAtRiskNote')}</p>}
    </section>

    <section className="home-section" aria-labelledby="more-title">
      <SectionHeader id="more-title" title={t('moreTitle')} action={<A href="/daily" className="text-link">{t('viewAllGames')}<ArrowRight size={16} aria-hidden="true"/></A>}/>
      <div className="card-row">
        <GameCard mode="duel" title={t('duel')} tagline={t('cardDuelTag')} meta={t('cardNoPoints')} cta={t('cardPlay')} onClick={() => go('/duel')}/>
        <GameCard mode="mystery" title={t('cardMysteryTitle')} tagline={t('cardMysteryTag')} meta={t('cardNoPoints')} cta={t('cardOpen')} onClick={() => setMysteryOpen(true)}/>
        <GameCard mode="classic" title={t('cardClassicTitle')} tagline={t('cardClassicTag')} meta={t('cardNoPoints')} cta={t('cardOpen')} onClick={() => go('/daily#classic')}/>
      </div>
    </section>

    <section className="home-section journey" aria-labelledby="journey-title">
      <SectionHeader id="journey-title" title={t('journeyTitle')} action={<A href="/scoring" className="text-link">{t('howScoring')}<ArrowRight size={16} aria-hidden="true"/></A>}/>
      <div className="journey-card">
        <p className="journey-summary">
          <span className="journey-count">{allDone && <Check size={18} strokeWidth={3} aria-hidden="true"/>}{t('journeyProgress').replace('{n}', String(completed))}</span>
          <span className="journey-points"><Trophy size={16} aria-hidden="true"/>{t('journeyPoints').replace('{n}', format(pointsToday ?? 0))}<small> / {format(5000)}</small></span>
        </p>
        <ProgressRoute stops={DAILY_MODES.map(mode => ({ mode, name: name(mode), state: dailyStateOf(sessions, mode), points: scoreOf(mode) }))} next={allDone ? null : next} onOpen={open} disabled={busy} t={t} format={format}/>
      </div>
    </section>

    <section className="together" aria-labelledby="together-title">
      <div className="together-art" aria-hidden="true"><div className="avatar-stack"><Avatar id={0}/><Avatar id={4}/><Avatar id={1}/><Avatar id={6}/></div></div>
      <div className="together-copy">
        <p className="kicker"><Users size={15} aria-hidden="true"/>{t('togetherKicker')}</p>
        <h2 id="together-title">{t('togetherTitle')}</h2>
        <p>{t('togetherCopy')}</p>
      </div>
      <div className="together-actions">
        <button className="btn gold btn-lg" onClick={() => setModal('room')}>{t('createRoom')}<ArrowRight size={19} aria-hidden="true"/></button>
        <A href="/multiplayer" className="text-link on-dark">{t('togetherJoin')} {t('join')}</A>
      </div>
    </section>

    <Dialog open={questsOpen} onOpenChange={setQuestsOpen}>
      <DialogContent className="app-modal quests-modal">
        <DialogTitle className="sr-only">{t('questsTitle')}</DialogTitle>
        <DialogDescription className="sr-only">{t('questsIntro')}</DialogDescription>
        <DailyQuests date={date} sessions={sessions ?? []} t={t}/>
      </DialogContent>
    </Dialog>
    <Dialog open={mysteryOpen} onOpenChange={setMysteryOpen}>
      <DialogContent className="app-modal mystery-modal">
        <DialogTitle className="sr-only">{t('mysteryTitle')}</DialogTitle>
        <DialogDescription className="sr-only">{t('cardMysteryTag')}</DialogDescription>
        {mysteryOpen && <MysteryCountry key={date} date={date} t={t} locale={locale}/>}
      </DialogContent>
    </Dialog>
  </div>;
}
