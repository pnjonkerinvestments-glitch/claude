'use client';
import { useState } from 'react';
import { ArrowRight, CircleHelp } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { HOW_TO_PLAY, HOW_TO_PLAY_GROUPS, HOW_TO_PLAY_ORDER, HOW_TO_PLAY_TITLE } from '@/lib/how-to-play';

type T = (key: string) => string;
type Loc = 'en' | 'nl';
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
      <span className="howto-step-icon" aria-hidden="true">{step.icon}</span>
      <p>{step.text[locale]}</p>
    </li>)}</ol>
    <p className="howto-tip"><span aria-hidden="true">💡</span><span><b>{t('howToTip')}:</b> {guide.tip[locale]}</span></p>
  </>;
}

export function HowToDialog({ mode, open, onOpenChange, t, locale }: { mode: string; open: boolean; onOpenChange: (open: boolean) => void; t: T; locale: Loc }) {
  const guide = HOW_TO_PLAY[mode];
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className={'app-modal howto-modal howto-' + mode}>{guide && <>
    <span className="howto-badge" aria-hidden="true">{guide.emoji}</span>
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

/** The "How to play" page: every game in three steps, grouped like the homepage. */
export function HowToPlayPage({ t, locale, onPlay, busy = false }: { t: T; locale: Loc; onPlay: (mode: string) => void; busy?: boolean }) {
  return <div className="howto-page">
    <div className="page-heading centered"><span className="eyebrow"><CircleHelp size={16}/>{t('howTo')}</span><h1>{t('howToPageTitle')}</h1><p>{t('howToPageIntro')}</p></div>
    <nav className="howto-jump" aria-label={t('howToJump')}>{HOW_TO_PLAY_ORDER.map(mode => <a key={mode} href={'#howto-' + mode} className={'howto-chip howto-' + mode}><span aria-hidden="true">{HOW_TO_PLAY[mode].emoji}</span>{howToGame(mode, t)}</a>)}</nav>
    {HOW_TO_PLAY_GROUPS.map(group => <section key={group.key} className="howto-group" aria-labelledby={'howto-group-' + group.key}>
      <div className="atelier-section-heading"><h2 id={'howto-group-' + group.key}>{t(group.key)}</h2><span>{t(group.note)}</span></div>
      <div className="howto-grid">{group.modes.map(mode => <article key={mode} id={'howto-' + mode} className={'howto-card howto-' + mode} aria-labelledby={'howto-title-' + mode}>
        <header><span className="howto-badge" aria-hidden="true">{HOW_TO_PLAY[mode].emoji}</span><h3 id={'howto-title-' + mode}>{howToGame(mode, t)}</h3></header>
        <HowToSteps mode={mode} t={t} locale={locale}/>
        <button className="btn secondary howto-play" disabled={busy} onClick={() => onPlay(mode)}>{mode === 'room' ? t('createRoom') : t('howToPlay').replace('{game}', howToGame(mode, t))}<ArrowRight size={18}/></button>
      </article>)}</div>
    </section>)}
  </div>;
}
