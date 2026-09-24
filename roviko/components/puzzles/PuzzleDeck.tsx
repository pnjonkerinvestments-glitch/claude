'use client';
import { CompetitionPanel } from '../atelier/Competition';
import React, { useRef, useState } from 'react';
import { ArrowRight, Check, Flame, Medal, Shuffle, ShieldCheck, Trophy } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GameCover } from '../atelier/GameCover';
import { DailyRhythm } from '../atelier/DailyRhythm';
import { post } from '@/lib/client';
import { DEFAULT_SETTINGS } from '@/lib/config';
import { TOPICS } from '@/lib/puzzles/topics';
import type { PuzzleMode } from '@/lib/puzzles/model';
import { ACHIEVEMENTS } from '@/lib/achievements';
import { DAILY_MODES, dailyStateOf, nearestAchievement, streakMilestone, type DailyMode } from '@/lib/daily-loop';
import { dailyTitleKey } from '../atelier/DailyLoop';
import { MysteryCountry } from '../atelier/MysteryCountry';
import { NativeReminder } from '../atelier/NativeReminder';
import { HowToPlayButton } from '../atelier/HowToPlay';
import { DailyQuests } from '../atelier/DailyQuests';
import { useToday } from '../home/useDay';
import { GameCard } from '../home/GameCard';

const PRACTICE_LABELS: Record<DailyMode, string> = { rank: 'tilePracticeRank', daily: 'tilePracticeDaily', compare: 'puzzleBrowseTopics', mosaic: 'tilePracticeMosaic', trail: 'tilePracticeTrail' };

/** Start (or resume) a daily or practice puzzle and open it. */
type PuzzleLauncher = { boot: { user: { id: string } }; refresh: () => Promise<unknown>; go: (href: string) => void };
export async function openPuzzle(app: PuzzleLauncher, mode: PuzzleMode | 'rank', daily = true, options: { topic?: string; size?: number } = {}) {
  if (!app.boot.user.id) { const ready = await app.refresh(); if (!ready) throw new Error('SESSION_EXPIRED'); }
  const game = await post(mode === 'rank' ? '/ranks' : '/puzzles', { mode, daily, competition: daily, ...options });
  app.go((mode === 'rank' ? '/rank/' : '/puzzle/') + game.id);
}

/** Open one of today's five daily games: resumes it when it was started, shows the result when it is done. */
export async function launchDaily(app: PuzzleLauncher & { start: (settings: Record<string, unknown>) => Promise<void> }, mode: DailyMode) {
  if (mode === 'daily' || mode === 'trail') return app.start({ ...DEFAULT_SETTINGS, mode: mode === 'trail' ? 'daily-trail' : 'daily' });
  return openPuzzle(app, mode);
}

export function PuzzleDeck({ app, dailyPage = false, extras = false }: { app: any; dailyPage?: boolean; extras?: boolean }) {
  const { t, locale, boot, go, fail, start } = app;
  const launching = useRef(false);
  const { data: today, error: loadError, retry } = useToday(boot);
  const [practice, setPractice] = useState<PuzzleMode | null>(null);
  const [topic, setTopic] = useState(TOPICS[0].id), [size, setSize] = useState('4'), [busy, setBusy] = useState('');
  const [fallbackDate] = useState(() => new Date().toISOString().slice(0, 10));
  async function play(mode: PuzzleMode | 'rank', daily = true) {
    if (launching.current) return;
    launching.current = true; setBusy(mode);
    try {
      await openPuzzle(app, mode, daily, { topic, size: +size });
      setPractice(null);
    } catch (e) { fail(e); } finally { launching.current = false; setBusy(''); }
  }
  const modes = DAILY_MODES;
  const stateOf = (mode: DailyMode) => dailyStateOf(today?.sessions, mode);
  const title = (mode: DailyMode) => t(dailyTitleKey(mode));
  const launch = (mode: DailyMode) => mode === 'daily' || mode === 'trail' ? start({ ...DEFAULT_SETTINGS, mode:mode==='trail'?'daily-trail':'daily' }) : play(mode);
  // Practice under each tile, like a "random" round: unranked, never touches today's shared puzzle.
  const practiceFor = (mode: DailyMode) => mode === 'rank' ? play('rank', false) : mode === 'daily' || mode === 'trail' ? start({ ...DEFAULT_SETTINGS, mode: mode === 'trail' ? 'trail' : 'mixed', region: app.region ?? 'World' }) : setPractice(mode);
  const streak = boot.stats.dailyStreak ?? 0, goal = streakMilestone(streak);
  const freeze = boot.stats.streakFreezes as { available: number; nextIn: number; frozenDates: string[] } | undefined;
  const badge = nearestAchievement(ACHIEVEMENTS, boot.stats);
  return <><section className={'puzzle-deck-section atelier-dailies ' + (dailyPage ? 'daily-deck' : '')} aria-labelledby="today-title">
    <div className="atelier-section-heading"><div><h2 id="today-title">{t('allGamesDaily')}</h2><p className="muted">{t('allGamesDailyNote')}</p></div><span>{today ? new Date(today.date + 'T12:00:00Z').toLocaleDateString(locale, { day: 'numeric', month: 'long', timeZone: 'UTC' }) : t('puzzleToday')}</span></div>
    <div className="daily-card-grid">
      {modes.map(mode => {
        const state = stateOf(mode), name = title(mode);
        const cta = t(state === 'done' ? 'puzzleViewResult' : state === 'active' ? 'puzzleResume' : 'dailyStart');
        return <article key={mode} className={'daily-card daily-card-' + mode + ' is-' + state}>
          <button className="daily-tile" disabled={app.busy || !!busy} onClick={() => launch(mode)} aria-label={cta + ' · ' + name}>
            <span className="daily-cover"><GameCover mode={mode}/><span className={'daily-state state-' + state}>{state === 'done' && <Check size={14}/>} {t(!today ? 'dailyStatusPending' : state === 'done' ? 'dailyDoneState' : state === 'active' ? 'dailyActiveState' : 'dailyNewState')}</span></span>
            <span className="daily-tile-copy"><strong className="daily-tile-title">{name}</strong><span>{t(mode + 'CardCopy')}</span><small className="daily-tile-points"><Trophy size={13} strokeWidth={2.4} aria-hidden="true"/>{t('competitionGameMax')}</small></span>
            <span className="daily-tile-cta">{app.busy || busy === mode ? t('loading') : cta}<ArrowRight size={18}/></span>
          </button>
          <div className="daily-tile-actions">
            <button className="tile-btn" disabled={app.busy || !!busy} onClick={() => practiceFor(mode)}><Shuffle size={16}/>{t(PRACTICE_LABELS[mode])}</button>
            <HowToPlayButton mode={mode} t={t} locale={locale}/>
          </div>
        </article>;
      })}
    </div>
    {loadError && <p className="inline-error" role="alert">{t('dailyStatusUnavailable')} <button className="text-link" onClick={retry}>{t('retry')}</button></p>}
    <div className="day-panels">
      <div className="day-panels-side">
        <DailyQuests date={today?.date ?? fallbackDate} sessions={today?.sessions ?? []} t={t}/>
        <section className="streak-card" aria-labelledby="streak-card-title">
          <span className="streak-card-flame" aria-hidden="true"><Flame size={22} strokeWidth={2.2}/></span>
          <div><h2 id="streak-card-title"><b>{streak}</b> {t('heroStatStreak').toLowerCase()}</h2><p>{t('heroStreakGoal').replace('{n}', String(goal.remaining)).replace('{target}', String(goal.target))}</p></div>
          <div className={'streak-card-freeze' + (freeze?.available ? ' is-ready' : '')} title={t('freezeExplain')}>
            <span aria-hidden="true"><ShieldCheck size={18} strokeWidth={2.4}/></span>
            <div><strong>{freeze?.available ? t('freezeReady').replace('{n}', String(freeze.available)) : t('freezeName')}</strong><small>{freeze && !freeze.nextIn ? t('freezeFull') : t('freezeNext').replace('{n}', String(freeze?.nextIn ?? 7))}</small></div>
          </div>
          <p className="streak-card-note">{t('freezeExplain')}</p>
        </section>
      </div>
      <CompetitionPanel app={app}/>
    </div>
    {dailyPage && <p className="practice-reset">{t('dailyResetLocal').replace('{time}', new Date(new Date().setUTCHours(24,0,0,0)).toLocaleTimeString(locale, { hour:'2-digit', minute:'2-digit', timeZoneName:'short' }))}</p>}
    {dailyPage && today?.week && today.tomorrowTopic && <DailyRhythm week={today.week} date={today.date} tomorrowTopic={today.tomorrowTopic} locale={locale} t={t} frozen={freeze?.frozenDates}/>}
    {dailyPage && badge && <div className="goal-nudge"><span className="goal-nudge-medal" aria-hidden="true"><Medal size={22} strokeWidth={2.2}/></span><div><small>{t('goalNudge')}</small><strong>{badge.name[locale as 'en' | 'nl' | 'es']}</strong></div><span className="goal-bar" aria-hidden="true"><i style={{ width: badge.progress * 100 + '%' }}/></span><b>{Math.min(badge.value, badge.target)}/{badge.target}</b></div>}
    {extras && <div className="daily-extras" id="extras">
      <div className="atelier-section-heading"><div><h2>{t('allGamesExtras')}</h2><p className="muted">{t('allGamesExtrasNote')}</p></div></div>
      <div className="daily-extras-grid">
        <GameCard mode="duel" title={t('duel')} tagline={t('cardDuelTag')} meta={t('cardNoPoints')} cta={t('cardPlay')} onClick={() => go('/duel')}/>
        {today && <MysteryCountry key={today.date} date={today.date} t={t} locale={locale}/>}
      </div>
    </div>}
    {extras && <NativeReminder t={t}/>}
    <Dialog open={!!practice} onOpenChange={v => !v && setPractice(null)}><DialogContent className="app-modal puzzle-setup"><span className="puzzle-sticker" aria-hidden="true">{practice === 'compare' ? '⚖️' : '🧩'}</span><DialogTitle className="modal-title">{t(practice ?? 'compare')}</DialogTitle><DialogDescription>{t('puzzlePracticeCopy')}</DialogDescription>{practice === 'compare' ? <label className="field"><span>{t('puzzleTopic')}</span><Select value={topic} onValueChange={setTopic}><SelectTrigger className="select-trigger" aria-label={t('puzzleTopic')}><SelectValue/></SelectTrigger><SelectContent>{TOPICS.map(topic => <SelectItem value={topic.id} key={topic.id}>{topic.emoji} {topic.label[locale as 'en' | 'nl' | 'es']}</SelectItem>)}</SelectContent></Select></label> : <><p className="field-label">{t('puzzleCluesPerCountry')}</p><Tabs value={size} onValueChange={setSize}><TabsList className="app-tabs puzzle-size-tabs">{['3','4','5'].map(n => <TabsTrigger key={n} value={n}>{n} {t('puzzleClues')}<small>{+n * 4} {t('puzzleTiles')}</small></TabsTrigger>)}</TabsList></Tabs><p className="muted">{t('puzzleSize' + size)}</p></>}<button className="btn primary wide" disabled={!!busy} onClick={() => play(practice!, false)}><Shuffle size={18}/>{busy ? t('loading') : t('puzzleStartPractice')}</button></DialogContent></Dialog>
  </section></>;
}
