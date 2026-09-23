import React from 'react';

const covers = { daily: 'world-trip', compare: 'side-by-side', mosaic: 'country-mosaic', rank: 'rank-radar' } as const;

/** Original decorative artwork, separate from factual quiz flags and shapes. */
export function GameCover({ mode }: { mode: keyof typeof covers }) {
  const name = covers[mode];
  return <img className="game-cover-image" src={'/art/' + name + '-480.webp'} srcSet={'/art/' + name + '-480.webp 480w, /art/' + name + '-960.webp 960w'} sizes="(max-width: 760px) 34vw, 225px" width="960" height="640" alt="" decoding="async"/>;
}
