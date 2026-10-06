import React from 'react';
import { X } from 'lucide-react';
import { GameIcon } from '../atelier/GameIcon';
import { CoinPill } from '../ds/Coin';

/**
 * The one header every game uses, as in the trip style: a round close button, a thin progress bar and a
 * white score pill with a coin. Under it a small green line says which game and where you are
 * ("Daily Detour · 1/20"); games that show that line inside their own card pass `kicker={false}`.
 */
export function GameHeader({ mode, title, edition, count, unit, progress, onExit, exitLabel, help, children, score, scoreLabel, kicker = true }: {
  mode: string; title: string; edition?: string | null; count?: string; unit?: string; progress: number;
  onExit: () => void; exitLabel: string; help?: React.ReactNode; children?: React.ReactNode;
  /** Points so far, shown in the coin pill. Leave out for games without a running score. */
  score?: number | null; scoreLabel?: string; kicker?: boolean;
}) {
  const pct = Math.max(0, Math.min(1, progress)) * 100;
  return <header className={'game-header trip-top tone-' + mode + (kicker ? '' : ' no-kicker')}>
    <div className="game-header-row">
      <button className="icon-btn game-exit" onClick={onExit} aria-label={exitLabel}><X size={20} strokeWidth={2.6}/></button>
      <div className="game-progress-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)} aria-label={count ? title + ' · ' + count : title}><i style={{ width: pct + '%' }}/></div>
      {children}
      {score !== undefined && score !== null && <CoinPill value={score} label={scoreLabel ?? String(score)}/>}
      {help}
    </div>
    <p className={'game-kicker' + (kicker ? '' : ' sr-only')}>
      <GameIcon mode={mode} size="sm"/>
      <span className="game-title"><strong>{title}</strong>{count && <span className="game-count" aria-label={unit ? count + ' ' + unit : count}> · <b>{count}</b></span>}</span>
      {edition && <small>{edition}</small>}
    </p>
  </header>;
}

/** "24 September" for a daily edition, or a practice label. */
export function editionLabel(date: string | null | undefined, locale: string, practice: string) {
  return date ? new Date(date + 'T12:00:00Z').toLocaleDateString(locale, { day: 'numeric', month: 'long', timeZone: 'UTC' }) : practice;
}
