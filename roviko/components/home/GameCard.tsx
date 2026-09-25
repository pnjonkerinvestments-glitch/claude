import React from 'react';
import { ArrowRight } from 'lucide-react';
import { CoverArt, type CoverMode } from './CoverArt';

/** A game as a cover: illustration, title, one line, quiet metadata and a single action. The whole card is the button. */
export function GameCard({ mode, title, tagline, meta, cta, onClick, disabled = false, badge }: { mode: CoverMode; title: string; tagline: string; meta?: React.ReactNode; cta: string; onClick: () => void; disabled?: boolean; badge?: React.ReactNode }) {
  return <button type="button" className={'game-card game-card-' + mode} onClick={onClick} disabled={disabled}>
    <span className="game-card-art"><CoverArt mode={mode}/>{badge && <span className="game-card-badge">{badge}</span>}</span>
    <span className="game-card-body">
      <strong className="game-card-title">{title}</strong>
      <span className="game-card-tagline">{tagline}</span>
      <span className="game-card-foot">{meta && <small className="game-card-meta">{meta}</small>}<span className="game-card-cta">{cta}<ArrowRight size={16} aria-hidden="true"/></span></span>
    </span>
  </button>;
}
