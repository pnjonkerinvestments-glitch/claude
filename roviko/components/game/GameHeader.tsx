import React from 'react';
import { X } from 'lucide-react';
import { GameIcon } from '../atelier/GameIcon';

/**
 * The one header every game uses: leave, which game and which edition, where you are,
 * help, and a progress bar in the game's own colour.
 */
export function GameHeader({ mode, title, edition, count, unit, progress, onExit, exitLabel, help, children }: {
  mode: string; title: string; edition?: string | null; count?: string; unit?: string; progress: number;
  onExit: () => void; exitLabel: string; help?: React.ReactNode; children?: React.ReactNode;
}) {
  const pct = Math.max(0, Math.min(1, progress)) * 100;
  return <header className={'game-header tone-' + mode}>
    <div className="game-header-row">
      <button className="icon-btn game-exit" onClick={onExit} aria-label={exitLabel}><X size={20}/></button>
      <div className="game-title"><GameIcon mode={mode} size="sm"/><span><strong>{title}</strong>{edition && <small>{edition}</small>}</span></div>
      {children}
      {count && <span className="game-count" aria-label={unit ? count + ' ' + unit : count}><b>{count}</b>{unit && <small aria-hidden="true">{unit}</small>}</span>}
      {help}
    </div>
    <div className="game-progress-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)} aria-label={title}><i style={{ width: pct + '%' }}/></div>
  </header>;
}

/** "24 September" for a daily edition, or a practice label. */
export function editionLabel(date: string | null | undefined, locale: string, practice: string) {
  return date ? new Date(date + 'T12:00:00Z').toLocaleDateString(locale, { day: 'numeric', month: 'long', timeZone: 'UTC' }) : practice;
}
