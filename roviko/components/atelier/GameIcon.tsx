import React from 'react';

/*
 * One logo per game, used everywhere the interface names a game: game headers, cards, tabs, quests,
 * scoring and the room settings. Each logo is a small two-tone picture on a soft tile in the game's
 * own colour (see `game-icon-<mode>` in design.css). Shapes use currentColor, lighter parts use
 * opacity and "cut-outs" use the tile colour, so every logo also works in dark mode.
 */
const CUT = 'var(--gi-bg, #fff)';

const LOGOS: Record<string, React.ReactNode> = {
  // Rank Radar: a radar screen with a sweep and one bright blip.
  rank: <>
    <circle cx="16" cy="16" r="12" fill="currentColor" opacity=".16"/>
    <path d="M16 16 16 4a12 12 0 0 1 10.4 6Z" fill="currentColor" opacity=".45"/>
    <circle cx="16" cy="16" r="12" fill="none" stroke="currentColor" strokeWidth="2.2"/>
    <circle cx="16" cy="16" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" opacity=".55"/>
    <circle cx="16" cy="16" r="2.2" fill="currentColor"/>
    <circle cx="21.6" cy="10.6" r="2.3" fill="currentColor"/>
  </>,
  // World Trip: a small globe with a plane on a dotted route.
  daily: <>
    <circle cx="13.5" cy="18" r="9.5" fill="currentColor" opacity=".2"/>
    <circle cx="13.5" cy="18" r="9.5" fill="none" stroke="currentColor" strokeWidth="2"/>
    <ellipse cx="13.5" cy="18" rx="4" ry="9.5" fill="none" stroke="currentColor" strokeWidth="1.4" opacity=".6"/>
    <path d="M4 18h19" stroke="currentColor" strokeWidth="1.4" opacity=".6"/>
    <path d="M7 7.5c3-3 8-4.4 12-3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="1.6 2.4"/>
    <g transform="translate(24 8.5) rotate(-30)">
      <path d="M-7 0 5.6-1.5Q8.6 0 5.6 1.5Z M-1-.9-4.6-7h2.4l4.6 6.1Z M-1 .9-4.6 7h2.4l4.6-6.1Z M-6-.6-7.8-3.6h1.4l2.2 3Z M-6 .6-7.8 3.6h1.4l2.2-3Z" fill="currentColor" stroke={CUT} strokeWidth="1.1" strokeLinejoin="round" paintOrder="stroke"/>
    </g>
  </>,
  // Side by Side: a balance that weighs two countries.
  compare: <>
    <path d="M6 10.5h20" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
    <rect x="14.9" y="7" width="2.2" height="17.5" rx="1.1" fill="currentColor"/>
    <rect x="10" y="24" width="12" height="3.2" rx="1.6" fill="currentColor"/>
    <circle cx="16" cy="7" r="2.2" fill="currentColor"/>
    <path d="M6 10.5 2.8 18M6 10.5 9.2 18M26 10.5 22.8 18M26 10.5 29.2 18" stroke="currentColor" strokeWidth="1.3" opacity=".7"/>
    <path d="M2.2 18h7.6a3.8 3.8 0 0 1-7.6 0Z" fill="currentColor" opacity=".5"/>
    <path d="M22.2 18h7.6a3.8 3.8 0 0 1-7.6 0Z" fill="currentColor"/>
  </>,
  // Country Mosaic: four tiles: a flag, a fact star, a globe and a solid tile.
  mosaic: <>
    <rect x="4.5" y="4.5" width="10.5" height="10.5" rx="2.6" fill="currentColor"/>
    <rect x="4.5" y="8.3" width="10.5" height="2.9" fill={CUT} opacity=".85"/>
    <rect x="17" y="4.5" width="10.5" height="10.5" rx="2.6" fill="currentColor" opacity=".35"/>
    <path d="m22.25 6.7 1 2.1 2.3.3-1.7 1.6.4 2.3-2-1.1-2 1.1.4-2.3-1.7-1.6 2.3-.3Z" fill="currentColor"/>
    <rect x="4.5" y="17" width="10.5" height="10.5" rx="2.6" fill="currentColor" opacity=".35"/>
    <circle cx="9.75" cy="22.25" r="3" fill="none" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M9.75 19.25v6M6.75 22.25h6" stroke="currentColor" strokeWidth="1"/>
    <rect x="17" y="17" width="10.5" height="10.5" rx="2.6" fill="currentColor" opacity=".75"/>
  </>,
  // Clue Trail: a folded map, a dotted route and the pin at the end.
  trail: <>
    <path d="M4 8.5 11 5.5l7 3 7-3v18l-7 3-7-3-7 3Z" fill="currentColor" opacity=".2"/>
    <path d="M4 8.5 11 5.5l7 3 7-3v18l-7 3-7-3-7 3Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
    <path d="M11 5.5v18M18 8.5v18" stroke="currentColor" strokeWidth="1.2" opacity=".45"/>
    <path d="M7.5 22.5c2.5-5 5.5-.5 8.5-5.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeDasharray="1.5 2.2"/>
    <path d="M22.5 20.5s-5-4.6-5-8.3a5 5 0 0 1 10 0c0 3.7-5 8.3-5 8.3Z" fill="currentColor" stroke={CUT} strokeWidth="1.2" paintOrder="stroke"/>
    <circle cx="22.5" cy="12.2" r="1.8" fill={CUT}/>
  </>,
  // World Duel: two playing cards, the front one with a star.
  duel: <>
    <rect x="5.5" y="6" width="13" height="18.5" rx="2.8" fill="currentColor" opacity=".35" transform="rotate(-12 12 15.25)"/>
    <rect x="5.5" y="6" width="13" height="18.5" rx="2.8" fill="none" stroke="currentColor" strokeWidth="1.6" opacity=".6" transform="rotate(-12 12 15.25)"/>
    <rect x="13" y="8" width="13" height="18.5" rx="2.8" fill="currentColor" transform="rotate(10 19.5 17.25)"/>
    <path d="m19.5 12.6 1.3 2.8 3 .3-2.3 2 .7 3-2.7-1.6-2.7 1.6.7-3-2.3-2 3-.3Z" fill={CUT}/>
  </>,
  // Mystery country: a magnifying glass with a question mark.
  mystery: <>
    <circle cx="13.5" cy="13.5" r="8.5" fill="currentColor" opacity=".18"/>
    <circle cx="13.5" cy="13.5" r="8.5" fill="none" stroke="currentColor" strokeWidth="2.4"/>
    <path d="m19.8 19.8 6.4 6.4" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round"/>
    <path d="M11.1 11.1a2.5 2.5 0 1 1 3.6 2.3c-.8.4-1.2.9-1.2 1.8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="13.5" cy="18.4" r="1.2" fill="currentColor"/>
  </>,
  // City Circuit: a skyline with the capital star above it.
  capitals: <>
    <rect x="4.5" y="14" width="6.5" height="13" rx="1.2" fill="currentColor" opacity=".45"/>
    <rect x="12" y="10" width="8" height="17" rx="1.2" fill="currentColor"/>
    <rect x="21" y="16" width="6.5" height="11" rx="1.2" fill="currentColor" opacity=".45"/>
    <path d="M14.3 13.2h1.4M16.3 13.2h1.4M14.3 16.7h1.4M16.3 16.7h1.4M14.3 20.2h1.4M16.3 20.2h1.4" stroke={CUT} strokeWidth="1.7"/>
    <rect x="3" y="26.3" width="26" height="2.2" rx="1.1" fill="currentColor"/>
    <path d="m16 2.2 1.1 2.3 2.5.3-1.8 1.7.5 2.5L16 7.8l-2.3 1.2.5-2.5-1.8-1.7 2.5-.3Z" fill="currentColor"/>
  </>,
  // Flag Signal: a waving flag on a pole.
  flags: <>
    <rect x="5.6" y="4.5" width="2.3" height="23.5" rx="1.15" fill="currentColor"/>
    <circle cx="6.75" cy="4.2" r="1.9" fill="currentColor"/>
    <path d="M7.9 6.5c4-2.2 7 1.8 11 0 2.4-1.1 4.4-1.1 7-.3v11.6c-2.6-.8-4.6-.8-7 .3-4 1.8-7-2.2-11 0Z" fill="currentColor" opacity=".9"/>
    <path d="M7.9 10.4c4-2.2 7 1.8 11 0 2.4-1.1 4.4-1.1 7-.3v3.6c-2.6-.8-4.6-.8-7 .3-4 1.8-7-2.2-11 0Z" fill={CUT} opacity=".55"/>
  </>,
  // Pinpoint: a map pin landing on a target.
  pinpoint: <>
    <ellipse cx="16" cy="25.5" rx="10.5" ry="3.3" fill="currentColor" opacity=".22"/>
    <ellipse cx="16" cy="25.5" rx="5.8" ry="1.8" fill="none" stroke="currentColor" strokeWidth="1.4" opacity=".55"/>
    <path d="M16 24.3s-7.5-7-7.5-12.6a7.5 7.5 0 0 1 15 0c0 5.6-7.5 12.6-7.5 12.6Z" fill="currentColor"/>
    <circle cx="16" cy="11.7" r="2.9" fill={CUT}/>
  </>,
  // Next Door: a signpost pointing two ways.
  borders: <>
    <rect x="14.8" y="4.5" width="2.4" height="23" rx="1.2" fill="currentColor"/>
    <path d="M17 7.5h8.2l3 3.2-3 3.2H17Z" fill="currentColor"/>
    <path d="M15 15.5H6.8l-3 3.2 3 3.2H15Z" fill="currentColor" opacity=".5"/>
    <ellipse cx="16" cy="27.6" rx="5.5" ry="1.5" fill="currentColor" opacity=".3"/>
  </>,
  // Size Shuffle: three globes on pedestals, small to large.
  order: <>
    <rect x="3.5" y="21" width="7.5" height="6.5" rx="1.4" fill="currentColor" opacity=".35"/>
    <rect x="12.25" y="17" width="7.5" height="10.5" rx="1.4" fill="currentColor" opacity=".6"/>
    <rect x="21" y="12.5" width="7.5" height="15" rx="1.4" fill="currentColor"/>
    <circle cx="7.25" cy="17.8" r="2.4" fill="currentColor" opacity=".5"/>
    <circle cx="16" cy="12.6" r="3.2" fill="currentColor" opacity=".75"/>
    <circle cx="24.75" cy="6.8" r="4" fill="currentColor"/>
  </>,
  // Around the World: a globe with an orbit.
  mixed: <>
    <circle cx="16" cy="16" r="9" fill="currentColor" opacity=".22"/>
    <circle cx="16" cy="16" r="9" fill="none" stroke="currentColor" strokeWidth="2"/>
    <ellipse cx="16" cy="16" rx="3.8" ry="9" fill="none" stroke="currentColor" strokeWidth="1.4" opacity=".6"/>
    <path d="M7 16h18" stroke="currentColor" strokeWidth="1.4" opacity=".6"/>
    <ellipse cx="16" cy="16" rx="14" ry="5" fill="none" stroke="currentColor" strokeWidth="1.8" transform="rotate(-22 16 16)"/>
    <circle cx="28.3" cy="11" r="2" fill="currentColor"/>
  </>,
  // Rooms with friends: two players side by side.
  room: <>
    <circle cx="11.5" cy="10.5" r="4.2" fill="currentColor" opacity=".45"/>
    <path d="M3.5 24.5a8 7.2 0 0 1 16 0Z" fill="currentColor" opacity=".45"/>
    <circle cx="20.5" cy="13.5" r="4.8" fill="currentColor" stroke={CUT} strokeWidth="1.4" paintOrder="stroke"/>
    <path d="M11.5 28a9 8 0 0 1 18 0Z" fill="currentColor" stroke={CUT} strokeWidth="1.4" paintOrder="stroke"/>
  </>,
};
LOGOS['daily-trail'] = LOGOS.trail;

/** A soft tile with the game's logo. The colour comes from the `game-icon-<mode>` class. */
export function GameIcon({ mode, size = 'md', className = '' }: { mode: string; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  return <span className={`game-icon game-icon-${mode} game-icon-${size} ${className}`} aria-hidden="true">
    <svg viewBox="0 0 32 32" className="game-logo" focusable="false">{LOGOS[mode] ?? LOGOS.mixed}</svg>
  </span>;
}
