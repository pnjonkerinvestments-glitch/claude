'use client';
import React, { useRef, useState } from 'react';
import { ArrowRight, Check, Shuffle, Trophy } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GameCover } from '../atelier/GameCover';
import { GameIcon } from '../atelier/GameIcon';
import { post } from '@/lib/client';
import { DEFAULT_SETTINGS } from '@/lib/config';
import { TOPICS } from '@/lib/puzzles/topics';
import type { PuzzleMode } from '@/lib/puzzles/model';
import { DAILY_MODES, dailyStateOf, type DailyMode } from '@/lib/daily-loop';
import { dailyTitleKey } from '../atelier/DailyLoop';
import { MysteryCountry } from '../atelier/MysteryCountry';
import { NativeReminder } from '../atelier/NativeReminder';
import { HowToPlayButton } from '../atelier/HowToPlay';
import { useToday } from '../home/useDay';
import { ResetCountdown } from '../atelier/ResetCountdown';
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
  const [mysteryOpen, setMysteryOpen] = useState(false);
  const stateLabel = (state: string) => t(!today ? 'dailyStatusPending' : state === 'done' ? 'dailyDoneState' : state === 'active' ? 'dailyActiveState' : 'dailyNewState');
  return <><section className={'puzzle-deck-section deck-v3 ' + (dailyPage ? 'daily-deck' : '')} aria-labelledby="today-title">
    <header className="section-header deck-head">
      <div><h2 id="today-title">{t('allGamesDaily')}</h2><p className="muted">{t('allGamesDailyNote')}</p></div>
      {dailyPage && <ResetCountdown className="deck-reset" label={t('resetIn').split('{time}')[0].trim()} t={t}/>}
    </header>
    <div className="dgrid">
      {modes.map(mode => {
        const state = stateOf(mode), name = title(mode);
        const cta = t(state === 'done' ? 'puzzleViewResult' : state === 'active' ? 'puzzleResume' : 'dailyStart');
        return <article key={mode} className={'dcard dcard-' + mode + ' is-' + state}>
          <div className="dcard-art">
            <GameCover mode={mode}/>
            <span className={'dcard-state state-' + state}>{state === 'done' ? <Check size={13} strokeWidth={3} aria-hidden="true"/> : <i aria-hidden="true"/>}{stateLabel(state)}</span>
            <span className="dcard-help"><HowToPlayButton mode={mode} t={t} locale={locale}/></span>
          </div>
          <div className="dcard-body">
            <GameIcon mode={mode} className="dcard-logo"/>
            <h3>{name}</h3>
            <p>{t(mode + 'CardCopy')}</p>
            <small className="dcard-points"><Trophy size={14} strokeWidth={2.4} aria-hidden="true"/>{t('competitionGameMax')}</small>
            <button className="btn primary dcard-start" disabled={app.busy || !!busy} onClick={() => launch(mode)} aria-label={cta + ' · ' + name}>{app.busy || busy === mode ? t('loading') : cta}<ArrowRight size={18} aria-hidden="true"/></button>
            <button className="text-link dcard-practice" disabled={app.busy || !!busy} onClick={() => practiceFor(mode)}><Shuffle size={15} aria-hidden="true"/>{t(PRACTICE_LABELS[mode])}</button>
          </div>
        </article>;
      })}
    </div>
    {loadError && <p className="inline-error" role="alert">{t('dailyStatusUnavailable')} <button className="text-link" onClick={retry}>{t('retry')}</button></p>}
    {extras && <div className="deck-extras" id="extras">
      <header className="section-header"><div><h2>{t('allGamesExtras')}</h2><p className="muted">{t('allGamesExtrasNote')}</p></div></header>
      <div className="card-row extras-row">
        <GameCard mode="duel" title={t('duel')} tagline={t('cardDuelTag')} meta={t('cardNoPoints')} cta={t('cardPlay')} onClick={() => go('/duel')}/>
        <GameCard mode="mystery" title={t('cardMysteryTitle')} tagline={t('cardMysteryTag')} meta={t('cardNoPoints')} cta={t('cardOpen')} onClick={() => setMysteryOpen(true)}/>
      </div>
      <Dialog open={mysteryOpen} onOpenChange={setMysteryOpen}>
        <DialogContent className="app-modal mystery-modal">
          <DialogTitle className="sr-only">{t('cardMysteryTitle')}</DialogTitle>
          <DialogDescription className="sr-only">{t('cardMysteryTag')}</DialogDescription>
          {mysteryOpen && today && <MysteryCountry key={today.date} date={today.date} t={t} locale={locale}/>}
        </DialogContent>
      </Dialog>
    </div>}
    {extras && <NativeReminder t={t}/>}
    <Dialog open={!!practice} onOpenChange={v => !v && setPractice(null)}><DialogContent className="app-modal puzzle-setup"><GameIcon mode={practice ?? 'compare'} size="lg" className="modal-logo"/><DialogTitle className="modal-title">{t(practice ?? 'compare')}</DialogTitle><DialogDescription>{t('puzzlePracticeCopy')}</DialogDescription>{practice === 'compare' ? <label className="field"><span>{t('puzzleTopic')}</span><Select value={topic} onValueChange={setTopic}><SelectTrigger className="select-trigger" aria-label={t('puzzleTopic')}><SelectValue/></SelectTrigger><SelectContent>{TOPICS.map(topic => <SelectItem value={topic.id} key={topic.id}>{topic.emoji} {topic.label[locale as 'en' | 'nl' | 'es']}</SelectItem>)}</SelectContent></Select></label> : <><p className="field-label">{t('puzzleCluesPerCountry')}</p><Tabs value={size} onValueChange={setSize}><TabsList className="app-tabs puzzle-size-tabs">{['3','4','5'].map(n => <TabsTrigger key={n} value={n}>{n} {t('puzzleClues')}<small>{+n * 4} {t('puzzleTiles')}</small></TabsTrigger>)}</TabsList></Tabs><p className="muted">{t('puzzleSize' + size)}</p></>}<button className="btn primary wide" disabled={!!busy} onClick={() => play(practice!, false)}><Shuffle size={18}/>{busy ? t('loading') : t('puzzleStartPractice')}</button></DialogContent></Dialog>
  </section></>;
}
