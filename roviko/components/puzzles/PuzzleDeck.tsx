'use client';
import React, { useRef, useState } from 'react';
import { ArrowRight, Check, Shuffle } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GameIcon } from '../atelier/GameIcon';
import { post } from '@/lib/client';
import { DEFAULT_SETTINGS } from '@/lib/config';
import { TOPICS } from '@/lib/puzzles/topics';
import type { PuzzleMode } from '@/lib/puzzles/model';
import { DAY_MODES, dailyStateOf, nextDailyMode, type DailyMode, type DayMode } from '@/lib/daily-loop';
import { dailyTitleKey } from '../atelier/DailyLoop';
import { MysteryCountry } from '../atelier/MysteryCountry';
import { NativeReminder } from '../atelier/NativeReminder';
import { useCompetition, useToday } from '../home/useDay';
import { plural } from '@/lib/plural';
import { Coin } from '../ds/Coin';
import { ResetCountdown } from '../atelier/ResetCountdown';

const PRACTICE_LABELS: Record<DailyMode, string> = { rank: 'tilePracticeRank', duel: 'tilePracticeDuel', compare: 'puzzleBrowseTopics', mosaic: 'tilePracticeMosaic', trail: 'tilePracticeTrail' };

/** Start (or resume) a daily or practice puzzle and open it. */
type PuzzleLauncher = { boot: { user: { id: string } }; refresh: () => Promise<unknown>; go: (href: string) => void };
export async function openPuzzle(app: PuzzleLauncher, mode: PuzzleMode | 'rank', daily = true, options: { topic?: string; size?: number } = {}) {
  if (!app.boot.user.id) { const ready = await app.refresh(); if (!ready) throw new Error('SESSION_EXPIRED'); }
  const game = await post(mode === 'rank' ? '/ranks' : '/puzzles', { mode, daily, competition: daily, ...options });
  app.go((mode === 'rank' ? '/rank/' : '/puzzle/') + game.id);
}

/** Open one of today's five daily games: resumes it when it was started, shows the result when it is done. */
export async function launchDaily(app: PuzzleLauncher & { start: (settings: Record<string, unknown>) => Promise<void> }, mode: DayMode) {
  if (mode === 'daily' || mode === 'trail') return app.start({ ...DEFAULT_SETTINGS, mode: mode === 'trail' ? 'daily-trail' : 'daily' });
  if (mode === 'duel') return app.go('/duel');
  return openPuzzle(app, mode);
}

/**
 * The daily games on "All games" (1.24): one white card with the six scored games as a list, like "Today's trip" on the
 * homepage (logo, name, status or points, one action), then the two extras as short rows. Practising the daily games
 * lives behind the Practise tab (`section="practice"`), with the classic games.
 */
export function PuzzleDeck({ app, section = 'daily' }: { app: any; section?: 'daily' | 'practice' }) {
  const { t, locale, boot, go, fail, start } = app;
  const launching = useRef(false);
  const { data: today, error: loadError, retry } = useToday(boot);
  const { data: competition } = useCompetition(boot, today?.date, !!today && section === 'daily');
  const [practice, setPractice] = useState<PuzzleMode | null>(null);
  const [topic, setTopic] = useState(TOPICS[0].id), [size, setSize] = useState('4'), [busy, setBusy] = useState('');
  async function play(mode: PuzzleMode | 'rank', daily = true) {
    if (launching.current) return;
    launching.current = true; setBusy(mode);
    try {
      await openPuzzle(app, mode, daily, { topic, size: +size });
      setPractice(null);
    } catch (e) { fail(e); } finally { launching.current = false; setBusy(''); }
  }
  const stateOf = (mode: DayMode) => dailyStateOf(today?.sessions, mode);
  const title = (mode: DayMode) => t(dailyTitleKey(mode));
  const launch = (mode: DayMode) => mode === 'daily' || mode === 'trail' ? start({ ...DEFAULT_SETTINGS, mode:mode==='trail'?'daily-trail':'daily' }) : mode === 'duel' ? go('/duel') : play(mode);
  // Practice: an unranked round that never touches today's shared puzzle.
  const practiceFor = (mode: DayMode) => mode === 'rank' ? play('rank', false) : mode === 'duel' ? go('/duel/practice') : mode === 'daily' || mode === 'trail' ? start({ ...DEFAULT_SETTINGS, mode: mode === 'trail' ? 'trail' : 'mixed', region: app.region ?? 'World' }) : setPractice(mode);
  const [mysteryOpen, setMysteryOpen] = useState(false);
  const next = today ? nextDailyMode(today.sessions) : null;
  const scoreOf = (mode: string) => competition?.scores.find((x: { mode: string; score: number }) => x.mode === mode)?.score;
  const n = (v: number) => v.toLocaleString(locale);
  const practiceDialog = <Dialog open={!!practice} onOpenChange={v => !v && setPractice(null)}><DialogContent className="app-modal puzzle-setup"><GameIcon mode={practice ?? 'compare'} size="lg" className="modal-logo"/><DialogTitle className="modal-title">{t(practice ?? 'compare')}</DialogTitle><DialogDescription>{t('puzzlePracticeCopy')}</DialogDescription>{practice === 'compare' ? <label className="field"><span>{t('puzzleTopic')}</span><Select value={topic} onValueChange={setTopic}><SelectTrigger className="select-trigger" aria-label={t('puzzleTopic')}><SelectValue/></SelectTrigger><SelectContent>{TOPICS.map(topic => <SelectItem value={topic.id} key={topic.id}>{topic.emoji} {topic.label[locale as 'en' | 'nl' | 'es']}</SelectItem>)}</SelectContent></Select></label> : <><p className="field-label">{t('puzzleCluesPerCountry')}</p><Tabs value={size} onValueChange={setSize}><TabsList className="app-tabs puzzle-size-tabs">{['3','4','5'].map(n => <TabsTrigger key={n} value={n}>{n} {t('puzzleClues')}<small>{+n * 4} {t('puzzleTiles')}</small></TabsTrigger>)}</TabsList></Tabs><p className="muted">{t('puzzleSize' + size)}</p></>}<button className="btn primary wide" disabled={!!busy} onClick={() => play(practice!, false)}><Shuffle size={18}/>{busy ? t('loading') : t('puzzleStartPractice')}</button></DialogContent></Dialog>;

  if (section === 'practice') return <section className="ag-practice" aria-labelledby="ag-practice-title">
    <header className="section-header"><div><h2 id="ag-practice-title">{t('agPracticeTitle')}</h2><p className="muted">{t('agPracticeNote')}</p></div></header>
    <ul className="ag-list ag-card">{DAY_MODES.map(mode => <li key={mode} className="ag-row">
      <button type="button" disabled={app.busy || !!busy} aria-busy={busy === mode} onClick={() => practiceFor(mode)}>
        <span className="ag-icon"><GameIcon mode={mode}/></span>
        <span className="ag-name"><strong>{title(mode)}</strong><small>{t(mode === 'daily' ? 'agPracticeMixed' : PRACTICE_LABELS[mode as DailyMode])}</small></span>
        <span className="ag-end"><Shuffle size={18} aria-hidden="true"/></span>
      </button>
    </li>)}</ul>
    {practiceDialog}
  </section>;

  return <><section className="puzzle-deck-section ag-daily" aria-labelledby="today-title">
    <header className="section-header deck-head">
      <div><h2 id="today-title">{t('allGamesDaily')}</h2><p className="muted">{t('allGamesDailyNote')}</p></div>
      <ResetCountdown className="deck-reset" label={t('resetIn').split('{time}')[0].trim()} t={t}/>
    </header>
    <ol className="ag-list ag-card">{DAY_MODES.map(mode => {
      const state = stateOf(mode), name = title(mode), isNext = next === mode, points = scoreOf(mode);
      const cta = t(state === 'done' ? 'puzzleViewResult' : state === 'active' ? 'agResume' : 'todayGo');
      const status = state === 'done' ? (points !== undefined ? plural(t, 'homePoints', points, '{n}', n(points)) : t('dailyDoneState')) : state === 'active' ? t('dailyActiveState') : isNext ? t('tripUpNext') : t('tripUpTo');
      return <li key={mode} className={'ag-row is-' + state + (isNext ? ' is-next' : '')}>
        <button type="button" disabled={app.busy || !!busy} aria-busy={busy === mode} onClick={() => launch(mode)} aria-label={name + ' · ' + status + ' · ' + cta}>
          <span className="ag-icon"><GameIcon mode={mode}/>{state === 'done' && <span className="ag-tick"><Check size={12} strokeWidth={3.4}/></span>}</span>
          <span className="ag-name"><strong>{name}</strong><small>{state === 'done' && points !== undefined ? <><Coin size={14}/>{n(points)}</> : status}</small></span>
          <span className={'ag-end t-pill' + (isNext ? ' is-main' : '')}>{app.busy && busy === mode ? t('loading') : cta}<ArrowRight size={16} aria-hidden="true"/></span>
        </button>
      </li>;
    })}</ol>
    {loadError && <p className="inline-error" role="alert">{t('dailyStatusUnavailable')} <button className="text-link" onClick={retry}>{t('retry')}</button></p>}
    <div className="ag-extras" id="extras">
      <header className="section-header"><div><h2>{t('allGamesExtras')}</h2><p className="muted">{t('allGamesExtrasNote')}</p></div></header>
      <ul className="ag-list ag-card">
        <li className="ag-row"><button type="button" onClick={() => go('/multiplayer')}><span className="ag-icon"><GameIcon mode="room"/></span><span className="ag-name"><strong>{t('cardRoomTitle')}</strong><small>{t('cardRoomTag')}</small></span><span className="ag-end"><ArrowRight size={18} aria-hidden="true"/></span></button></li>
        <li className="ag-row"><button type="button" onClick={() => setMysteryOpen(true)}><span className="ag-icon"><GameIcon mode="mystery"/></span><span className="ag-name"><strong>{t('cardMysteryTitle')}</strong><small>{t('cardMysteryTag')}</small></span><span className="ag-end"><ArrowRight size={18} aria-hidden="true"/></span></button></li>
      </ul>
      <Dialog open={mysteryOpen} onOpenChange={setMysteryOpen}>
        <DialogContent className="app-modal mystery-modal">
          <DialogTitle className="sr-only">{t('cardMysteryTitle')}</DialogTitle>
          <DialogDescription className="sr-only">{t('cardMysteryTag')}</DialogDescription>
          {mysteryOpen && today && <MysteryCountry key={today.date} date={today.date} t={t} locale={locale}/>}
        </DialogContent>
      </Dialog>
    </div>
    <NativeReminder t={t}/>
  </section></>;
}
