import React from 'react';
import { GameScene } from '../ds/GameScene';

/** Original decorative artwork, separate from factual quiz flags and shapes (a vector scene since 1.22). */
export function GameCover({ mode }: { mode: 'daily' | 'compare' | 'mosaic' | 'rank' | 'trail' | 'duel' }) {
  return <GameScene mode={mode} className="game-cover-image"/>;
}
