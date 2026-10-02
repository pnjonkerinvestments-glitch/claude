import React from 'react';
import { GameScene, type SceneShape } from '../ds/GameScene';

/**
 * The cover illustration for every game card: since 1.22 a vector scene in the style of the social videos
 * (Roviko with arms and legs), sharp on every screen. Decorative only: never used as quiz geography.
 */
export type CoverMode = 'rank' | 'daily' | 'compare' | 'mosaic' | 'trail' | 'duel' | 'mystery' | 'classic' | 'room';

export function CoverArt({ mode, shape = 'card' }: { mode: CoverMode; shape?: SceneShape }) {
  return <GameScene mode={mode} shape={shape} className="game-cover-image"/>;
}
