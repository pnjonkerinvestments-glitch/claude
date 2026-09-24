import React from 'react';
import { GameCover } from '../atelier/GameCover';

/**
 * The cover illustration for every game card. Every card uses the flat cartoon artwork
 * with Roviko the globe (from the 1.16 style sheet).
 * Decorative only: never used as quiz geography.
 */
export type CoverMode = 'rank' | 'daily' | 'compare' | 'mosaic' | 'trail' | 'duel' | 'mystery' | 'classic' | 'room';

/** Mockup-style scenes for the extras; padded to 3:2 so they also fit the wide explore cards. */
function Scene({ name }: { name: 'duel' | 'mystery' | 'classic' }) {
  return <img className="game-cover-image cover-scene" src={'/art/' + name + '-480.webp'} srcSet={'/art/' + name + '-480.webp 480w, /art/' + name + '-720.webp 720w'} sizes="(max-width: 760px) 90vw, 330px" width="720" height="480" alt="" decoding="async"/>;
}

export function CoverArt({ mode }: { mode: CoverMode }) {
  if (mode === 'duel' || mode === 'mystery' || mode === 'classic') return <Scene name={mode}/>;
  if (mode === 'room') return <img className="game-cover-image" src="/art/lobby-create.webp" width="964" height="522" alt="" decoding="async"/>;
  return <GameCover mode={mode}/>;
}
