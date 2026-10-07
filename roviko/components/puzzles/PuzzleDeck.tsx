'use client';
import React, { useRef, useState } from 'react';
import { ArrowRight, Check, ChevronRight, CircleHelp, Shuffle } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GameIcon } from '../atelier/GameIcon';
import { post } from '@/lib/client';
import { DEFAULT_SETTINGS } from '@/lib/config';
import { TOPICS } from '@/lib/puzzles/topics';
import type { PuzzleMode } from '@/lib/puzzles/model';
import { dailyStateOf, dayModesFor, nextDailyMode, type DayMode } from '@/lib/daily-loop';
import { dailyTitleKey } from '../atelier/DailyLoop';
import { MysteryCountry } from '../atelier/MysteryCountry';
import { NativeReminder } from '../atelier/NativeReminder';
import { useCompetition, useToday } from '../home/useDay';
import { ResetCountdown } from '../atelier/ResetCountdown';
import { Coin } from '../ds/Coin';
import { A } from '../app/shared';
import { plural } from '@/lib/plural';

/** Start (or resume) a daily or practice puzzle and open it. */
type PuzzleLauncher = { boot: { user: { id: string } }; refresh: () => Promise<unknown>; go: (href: string) => void };
export async function openPuzzle(app: PuzzleLauncher, mode: PuzzleMode | 'rank', daily = true, options: { topic?: string; size?: number } = {}) {
  if (!app.boot.user.id) { const ready = await app.refresh(); if (!ready) throw new Error('SESSION_EXPIRED'); }
  const game = await post(mode === 'rank' ? '/ranks' : '/puzzles', { mode, daily, competition: daily, ...options });
  app.go((mode === 'rank' ? '/rank/' : '/puzzle/') + game.id);
}

/** Open one of today's daily games: resumes it when it was started, shows the result when it is done. */
export async function launchDaily(app: PuzzleLauncher & { start: (settings: Record<string, unknown>) => Promise<void> }, mode: DayMode) {
  if (mode === 'daily') return app.start({ ...DEFAULT_SETTINGS, mode: 'daily' });
  // The daily Clue Trail and (1.24) the daily Size Shuffle are solo sessions with competition mode 'trail' / 'order'.
  if (mode === 'trail' || mode === 'order') return app.start({ ...DEFAULT_SETTINGS, mode: 'daily-' + mode });
  if (mode === 'duel') return app.go('/duel');
  return openPuzzle(app, mode);
}

/** One short line per game for the compact lists on the All games page. */
const LINE: Record<string, string> = { daily: 'agLineDaily', rank: 'agLineRank', duel: 'agLineDuel', compare: 'agLineCompare', order: 'agLineOrder', mosaic: 'agLineMosaic', trail: 'agLineTrail' };

/**
 * The practice set-up for Side by Side (a topic) and Country Mosaic (board size): unranked, never today's shared puzzle.
 * Used by the Mosaic extra and by the practice list.
 */
function PracticeDialog({ app, mode, onClose }: { app: any; mode: 'compare' | 'mosaic' | null; onClose: () => void }) {
  const { t, locale, fail } = app;
  const [topic, setTopic] = useState(TOPICS[0].id), [size, setSize] = useState('4'), [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const play = async () => {
    if (!mode || lock.current) return; lock.current = true; setBusy(true);
    try { await openPuzzle(app, mode, false, { topic, size: +size }); onClose(); } catch (e) { fail(e); } finally { lock.current = false; setBusy(false); }
  };
  return <Dialog open={!!mode} onOpenChange={v => !v && onClose()}><DialogContent className="app-modal puzzle-setup">
    <GameIcon mode={mode ?? 'compare'} size="lg" className="modal-logo"/>
    <DialogTitle className="modal-title">{t(mode ?? 'compare')}</DialogTitle>
    <DialogDescription>{t('puzzlePracticeCopy')}</DialogDescription>
    {mode === 'compare'
      ? <label className="field"><span>{t('puzzleTopic')}</span><Select value={topic} onValueChange={setTopic}><SelectTrigger className="select-trigger" aria-label={t('puzzleTopic')}><SelectValue/></SelectTrigger><SelectContent>{TOPICS.map(item => <SelectItem value={item.id} key={item.id}>{item.emoji} {item.label[locale as 'en' | 'nl' | 'es']}</SelectItem>)}</SelectContent></Select></label>
      : <><p className="field-label">{t('puzzleCluesPerCountry')}</p><Tabs value={size} onValueChange={setSize}><TabsList className="app-tabs puzzle-size-tabs">{['3', '4', '5'].map(n => <TabsTrigger key={n} value={n}>{n} {t('puzzleClues')}<small>{+n * 4} {t('puzzleTiles')}</small></TabsTrigger>)}</TabsList></Tabs><p className="muted">{t('puzzleSize' + size)}</p></>}
    <button className="btn primary wide" disabled={busy} onClick={play}><Shuffle size={18} aria-hidden="true"/>{busy ? t('loading') : t('puzzleStartPractice')}</button>
  </DialogContent></Dialog>;
}

/**
 * The All games page, top half (1.24): today's six scored games as one white list card, like "Today's trip" on the
 * homepage (logo, name, one short line, then the points, "Continue" or "Play"), and the extras without points as
 * compact rows: Country Mosaic (a daily game until the Size Shuffle took its place), Play together and the mystery country.
 */
export function PuzzleDeck({ app, extras = false }: { app: any; dailyPage?: boolean; extras?: boolean }) {
  const { t, locale, boot, go, fail } = app;
  const { data: today, error: loadError, retry } = useToday(boot);
  const { data: competition } = useCompetition(boot, today?.date, !!today);
  const lineup = dayModesFor(today?.date);
  const [launching, setLaunching] = useState(''), lock = useRef(false);
  const [practice, setPractice] = useState<'compare' | 'mosaic' | null>(null), [mysteryOpen, setMysteryOpen] = useState(false);
  const launch = async (mode: DayMode) => {
    if (lock.current) return; lock.current = true; setLaunching(mode);
    try { await launchDaily(app, mode); } catch (e) { fail(e); } finally { lock.current = false; setLaunching(''); }
  };
  // Only the next game gets the forest pill; a started one says "Continue", a finished one shows its points.
  const next = today ? nextDailyMode(today.sessions, lineup) : null;
  const done = today ? lineup.filter(m => dailyStateOf(today.sessions, m) === 'done').length : 0;
  const n = (v: number) => v.toLocaleString(locale);
  const busy = app.busy || !!launching || !today;
  const mosaicExtra = !lineup.includes('mosaic');
  return <>
    <section className="ag-day t-card" aria-labelledby="today-title">
      <header className="ag-day-head">
        <div><h2 id="today-title">{t('allGamesDaily')}</h2><p>{t('allGamesDailyNote')}</p></div>
        <ResetCountdown className="deck-reset" label={t('resetIn').split('{time}')[0].trim()} t={t}/>
      </header>
      <p className="sr-only" aria-live="polite">{today ? plural(t, 'homeProgress', done).replace('{total}', String(lineup.length)) : t('dailyStatusPending')}</p>
      <ol className="ag-list">{lineup.map(mode => {
        const state = today ? dailyStateOf(today.sessions, mode) : 'new', isNext = mode === next, name = t(dailyTitleKey(mode));
        const points = competition?.scores.find(s => s.mode === mode)?.score;
        const status = t(!today ? 'dailyStatusPending' : state === 'done' ? 'dailyDoneState' : state === 'active' ? 'dailyActiveState' : 'dailyNewState');
        return <li key={mode} className={'ag-row is-' + state + (isNext ? ' is-next' : '')}>
          <button type="button" onClick={() => launch(mode)} disabled={busy} aria-busy={launching === mode}
            aria-label={name + ' · ' + status + (state === 'done' && points !== undefined ? ' · ' + plural(t, 'homePoints', points, '{n}', n(points)) : '') + (isNext ? ' · ' + t('tripUpNext') : '')}>
            <span className="ag-icon"><GameIcon mode={mode}/>{state === 'done' && <span className="ag-tick"><Check size={12} strokeWidth={3.4}/></span>}</span>
            <span className="ag-copy"><strong>{name}</strong><small>{state === 'active' ? t('dailyActiveState') : t(LINE[mode])}</small></span>
            <span className="ag-end" aria-hidden="true">{state === 'done'
              ? <span className="ag-score">{points !== undefined ? <><Coin size={18}/><b>{n(points)}</b></> : <Check size={18} strokeWidth={3}/>}</span>
              : state === 'active' ? <span className="t-pill ag-pill">{launching === mode ? t('loading') : t('agResume')}</span>
              : isNext ? <span className="t-pill ag-pill is-main">{launching === mode ? t('loading') : t('todayGo')}<ArrowRight size={16}/></span>
              : <ChevronRight size={18} className="ag-chev"/>}</span>
          </button>
        </li>;
      })}</ol>
      {loadError && <p className="inline-error" role="alert">{t('dailyStatusUnavailable')} <button className="text-link" onClick={retry}>{t('retry')}</button></p>}
      <footer className="ag-day-foot"><A href="/how-to-play" className="ag-foot-link"><CircleHelp size={16} aria-hidden="true"/>{t('howToLink')}</A><A href="/scoring" className="ag-foot-link">{t('scoringLink')}<ArrowRight size={15} aria-hidden="true"/></A></footer>
    </section>
    {extras && <section className="ag-extras t-card" id="extras" aria-labelledby="extras-title">
      <header className="ag-day-head"><div><h2 id="extras-title">{t('allGamesExtras')}</h2><p>{t('allGamesExtrasNote')}</p></div></header>
      <ul className="ag-list is-compact">
        {mosaicExtra && <li className="ag-row"><button type="button" disabled={app.busy} onClick={() => setPractice('mosaic')}><span className="ag-icon"><GameIcon mode="mosaic"/></span><span className="ag-copy"><strong>{t('mosaic')}</strong><small>{t('agLineMosaic')}</small></span><span className="ag-end" aria-hidden="true"><ChevronRight size={18} className="ag-chev"/></span></button></li>}
        <li className="ag-row"><button type="button" onClick={() => go('/multiplayer')}><span className="ag-icon"><GameIcon mode="room"/></span><span className="ag-copy"><strong>{t('cardRoomTitle')}</strong><small>{t('cardRoomTag')}</small></span><span className="ag-end" aria-hidden="true"><ChevronRight size={18} className="ag-chev"/></span></button></li>
        <li className="ag-row"><button type="button" disabled={!today} onClick={() => setMysteryOpen(true)}><span className="ag-icon"><GameIcon mode="mystery"/></span><span className="ag-copy"><strong>{t('cardMysteryTitle')}</strong><small>{t('cardMysteryTag')}</small></span><span className="ag-end" aria-hidden="true"><ChevronRight size={18} className="ag-chev"/></span></button></li>
      </ul>
      <Dialog open={mysteryOpen} onOpenChange={setMysteryOpen}>
        <DialogContent className="app-modal mystery-modal">
          <DialogTitle className="sr-only">{t('cardMysteryTitle')}</DialogTitle>
          <DialogDescription className="sr-only">{t('cardMysteryTag')}</DialogDescription>
          {mysteryOpen && today && <MysteryCountry key={today.date} date={today.date} t={t} locale={locale}/>}
        </DialogContent>
      </Dialog>
    </section>}
    {extras && <NativeReminder t={t}/>}
    <PracticeDialog app={app} mode={practice} onClose={() => setPractice(null)}/>
  </>;
}

/** Practice versions of the daily games for the "Practise" tab: no points, never today's shared puzzle. */
const PRACTICE: { mode: string; label: string }[] = [
  { mode: 'daily', label: 'tilePracticeDaily' }, { mode: 'rank', label: 'tilePracticeRank' }, { mode: 'duel', label: 'tilePracticeDuel' },
  { mode: 'compare', label: 'agPracticeCompare' }, { mode: 'mosaic', label: 'tilePracticeMosaic' },
];
export function DailyPractice({ app }: { app: any }) {
  const { t, go, start, fail } = app;
  const [practice, setPractice] = useState<'compare' | 'mosaic' | null>(null), [busy, setBusy] = useState(''), lock = useRef(false);
  const play = async (mode: string) => {
    if (mode === 'compare' || mode === 'mosaic') return setPractice(mode);
    if (mode === 'duel') return go('/duel/practice');
    if (lock.current) return; lock.current = true; setBusy(mode);
    try { if (mode === 'rank') await openPuzzle(app, 'rank', false); else await start({ ...DEFAULT_SETTINGS, mode: 'mixed', region: app.region ?? 'World' }); } catch (e) { fail(e); } finally { lock.current = false; setBusy(''); }
  };
  return <section className="ag-practice" aria-labelledby="practice-daily-title">
    <h3 id="practice-daily-title" className="ag-subhead">{t('agPractiseDaily')}</h3>
    <ul className="ag-tiles">{PRACTICE.map(p => <li key={p.mode}>
      <button type="button" className="ag-tile" disabled={app.busy || !!busy} aria-busy={busy === p.mode} onClick={() => play(p.mode)}>
        <GameIcon mode={p.mode}/><span><strong>{t(dailyTitleKey(p.mode as DayMode))}</strong><small>{t(p.label)}</small></span>
      </button>
    </li>)}</ul>
    <PracticeDialog app={app} mode={practice} onClose={() => setPractice(null)}/>
  </section>;
}
