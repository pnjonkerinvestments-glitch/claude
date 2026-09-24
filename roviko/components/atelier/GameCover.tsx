import React from 'react';

const covers = { daily: 'world-trip', compare: 'side-by-side', mosaic: 'country-mosaic', rank: 'rank-radar', trail:'clue-trail' } as const;

/** Original decorative artwork, separate from factual quiz flags and shapes. */
export function GameCover({ mode }: { mode: keyof typeof covers }) {
  if(mode==='trail') return <svg className="game-cover-image trail-cover" viewBox="0 0 480 320" role="presentation" aria-hidden="true"><rect width="480" height="320" fill="#d9f0e4"/><path d="M-20 235Q65 132 161 225T310 127T500 144" fill="none" stroke="#b4dbc9" strokeWidth="82"/><path d="M34 302Q16 184 142 204T324 143T407 37" fill="none" stroke="#fffaf0" strokeWidth="33"/><path d="M34 302Q16 184 142 204T324 143T407 37" fill="none" stroke="#6a9980" strokeWidth="3" strokeDasharray="7 11"/><g transform="translate(213 116) rotate(-12)"><rect x="-59" y="-70" width="118" height="140" rx="20" fill="#2e6654"/><rect x="-52" y="-65" width="104" height="126" rx="16" fill="#fffcf0"/><circle r="35" fill="#e8b94f"/><path d="M0-27L12 12L-12 12Z" fill="#d65b4d"/><path d="M0 27L12 12L-12 12Z" fill="#2e6654"/><circle r="5" fill="#fffcf0"/></g><circle cx="345" cy="87" r="28" fill="#fffaf0"/><path d="M331 87l10 10 18-21" fill="none" stroke="#2e6654" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/><circle cx="105" cy="240" r="12" fill="#e8b94f"/></svg>;
  const name = covers[mode];
  return <img className="game-cover-image" src={'/art/' + name + '-480.webp'} srcSet={'/art/' + name + '-480.webp 480w, /art/' + name + '-960.webp 960w'} sizes="(max-width: 760px) 34vw, 225px" width="960" height="640" alt="" decoding="async"/>;
}
