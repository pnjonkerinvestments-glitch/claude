'use client';
import React, { useEffect, useState } from 'react';
import { ArrowRight, CircleHelp, Lightbulb } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { GameIcon } from './GameIcon';
import { CoverArt, type CoverMode } from '../home/CoverArt';
import { HOW_TO_PLAY, HOW_TO_PLAY_GROUPS, HOW_TO_PLAY_ORDER, HOW_TO_PLAY_TITLE } from '@/lib/how-to-play';

type T = (key: string) => string;
type Loc = 'en' | 'nl' | 'es';
const seenKey = (mode: string) => 'roviko:howto:' + mode;
function hasSeen(mode: string) { try { return localStorage.getItem(seenKey(mode)) === '1'; } catch { return true; } }
function markSeen(mode: string) { try { localStorage.setItem(seenKey(mode), '1'); } catch { /* the guide simply shows again next time */ } }
export const howToGame = (mode: string, t: T) => t(HOW_TO_PLAY_TITLE[mode] ?? mode);
/** "How to play Rank Radar", or a game's own phrasing when the template reads oddly. */
export function howToTitle(mode: string, t: T) { const own = t('howToTitle_' + mode); return own !== 'howToTitle_' + mode ? own : t('howToTitle').replace('{game}', howToGame(mode, t)); }

/** Three numbered steps and one tip for a game. */
export function HowToSteps({ mode, t, locale }: { mode: string; t: T; locale: Loc }) {
  const guide = HOW_TO_PLAY[mode];
  if (!guide) return null;
  return <>
    <ol className="howto-steps">{guide.steps.map((step, i) => <li key={i}>
      <span className="howto-step-num" aria-hidden="true">{i + 1}</span>
      <p>{step.text[locale]}</p>
    </li>)}</ol>
    <p className="howto-tip"><Lightbulb size={18} aria-hidden="true"/><span><b>{t('howToTip')}:</b> {guide.tip[locale]}</span></p>
  </>;
}

export function HowToDialog({ mode, open, onOpenChange, t, locale }: { mode: string; open: boolean; onOpenChange: (open: boolean) => void; t: T; locale: Loc }) {
  const guide = HOW_TO_PLAY[mode];
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className={'app-modal howto-modal howto-' + mode}>{guide && <>
    <GameIcon mode={mode} size="lg" className="howto-badge"/>
    <DialogTitle className="modal-title">{howToTitle(mode, t)}</DialogTitle>
    <DialogDescription className="sr-only">{t('howToSteps')}</DialogDescription>
    <HowToSteps mode={mode} t={t} locale={locale}/>
    <button className="btn primary wide howto-go" onClick={() => onOpenChange(false)}>{t('howToGotIt')}<ArrowRight size={18}/></button>
  </>}</DialogContent></Dialog>;
}

/** A "?" button in a game header. With `auto`, the guide also opens by itself the first time someone plays that game. */
export function HowToPlayButton({ mode, t, locale, auto = false, link = false }: { mode: string; t: T; locale: Loc; auto?: boolean; link?: boolean }) {
  // Game screens only render after their data has loaded in the browser, so reading storage here cannot mismatch SSR.
  const [open, setOpen] = useState(() => auto && typeof window !== 'undefined' && !!HOW_TO_PLAY[mode] && !hasSeen(mode));
  if (!HOW_TO_PLAY[mode]) return null;
  const change = (next: boolean) => { setOpen(next); if (!next) markSeen(mode); };
  return <>
    {link
      ? <button type="button" className="text-link howto-link" onClick={() => setOpen(true)}><CircleHelp size={16}/>{howToTitle(mode, t)}</button>
      : <button type="button" className="icon-btn howto-button" aria-label={t('howToOpen').replace('{game}', howToGame(mode, t))} title={t('howTo')} onClick={() => setOpen(true)}><CircleHelp size={20}/></button>}
    <HowToDialog mode={mode} open={open} onOpenChange={change} t={t} locale={locale}/>
  </>;
}

const RULE_KEYS: Record<string, string> = { rank: 'competitionRankRule', daily: 'competitionDaily', compare: 'competitionCompare', mosaic: 'competitionMosaic', trail: 'competitionTrail' };
const COVER: Record<string, CoverMode> = { rank: 'rank', daily: 'daily', compare: 'compare', mosaic: 'mosaic', trail: 'trail', duel: 'duel', mystery: 'mystery', room: 'room' };

/** The "How to play" page: pick a game from the tabs, see its goal, steps, scoring and a tip, then play it. */
export function HowToPlayPage({ t, locale, onPlay, busy = false }: { t: T; locale: Loc; onPlay: (mode: string) => void; busy?: boolean }) {
  const [mode, setMode] = useState<string>('rank');
  // Deep links such as /how-to-play#trail open that game's tab once mounted.
  useEffect(() => { const hash = window.location.hash.slice(1); if (HOW_TO_PLAY[hash]) setMode(hash); }, []);
  const pick = (next: string) => { setMode(next); try { history.replaceState(history.state, '', '#' + next); } catch { /* ignore */ } };
  const guide = HOW_TO_PLAY[mode];
  const group = HOW_TO_PLAY_GROUPS.find(g => g.modes.includes(mode))!;
  const onKey = (e: React.KeyboardEvent) => {
    const i = HOW_TO_PLAY_ORDER.indexOf(mode);
    const next = e.key === 'ArrowRight' ? HOW_TO_PLAY_ORDER[(i + 1) % HOW_TO_PLAY_ORDER.length] : e.key === 'ArrowLeft' ? HOW_TO_PLAY_ORDER[(i - 1 + HOW_TO_PLAY_ORDER.length) % HOW_TO_PLAY_ORDER.length] : null;
    if (next) { e.preventDefault(); pick(next); requestAnimationFrame(() => document.getElementById('howto-tab-' + next)?.focus()); }
  };
  return <div className="page howto-v2">
    <header className="page-header"><p className="kicker">{t('howKicker')}</p><h1>{t('howTitle')}</h1><p className="lead">{t('howLead')}</p></header>
    <div className="howto-tabs" role="tablist" aria-label={t('howTitle')} onKeyDown={onKey}>
      {HOW_TO_PLAY_GROUPS.map(g => <div key={g.key} className="howto-tab-group" role="presentation"><span className="howto-tab-label" role="presentation">{t(g.key)}</span>
        {g.modes.map(m => <button key={m} id={'howto-tab-' + m} role="tab" aria-selected={mode === m} aria-controls="howto-panel" tabIndex={mode === m ? 0 : -1} className="howto-tab" onClick={() => pick(m)}><GameIcon mode={m} size="sm"/>{howToGame(m, t)}</button>)}
      </div>)}
    </div>
    {guide && <section id="howto-panel" role="tabpanel" aria-labelledby={'howto-tab-' + mode} className={'howto-panel howto-' + mode}>
      <div className="howto-art" aria-hidden="true"><CoverArt mode={COVER[mode] ?? 'classic'}/></div>
      <div className="howto-body">
        <p className="kicker">{t(group.key)}</p>
        <h2>{howToGame(mode, t)}</h2>
        <h3>{t('howGoal')}</h3>
        <p className="howto-goal">{guide.steps[0].text[locale]}</p>
        <h3>{t('howSteps')}</h3>
        <ol className="howto-steps">{guide.steps.slice(1).map((step, i) => <li key={i}><span className="howto-step-num" aria-hidden="true">{i + 1}</span><p>{step.text[locale]}</p></li>)}</ol>
        <h3>{t('howScoringLabel')}</h3>
        <p>{RULE_KEYS[mode] ? t(RULE_KEYS[mode]) : mode === 'room' ? t('scoringFriendsCopy') : t('scoringExtrasCopy')}</p>
        <p className="howto-tip"><Lightbulb size={18} aria-hidden="true"/><span><b>{t('howToTip')}:</b> {guide.tip[locale]}</span></p>
        <div className="howto-actions"><button className="btn primary btn-lg" disabled={busy} onClick={() => onPlay(mode)}>{mode === 'room' ? t('createRoom') : t('howPlayCta').replace('{game}', howToGame(mode, t))}<ArrowRight size={19} aria-hidden="true"/></button>{RULE_KEYS[mode] && <a href="/scoring" className="text-link">{t('scoringLink')}</a>}</div>
      </div>
    </section>}
  </div>;
}
