import React from 'react';

/*
 * Small drawing pieces in Roviko's illustration style (1.23.1), shared by the game logos (GameIcon)
 * and the interface icons. Everything is plain SVG to put inside another <svg>: soft flat shapes,
 * warm colours, navy only for small details (eyes, hands), a gentle shine and a soft shadow.
 * Pieces that need a clipPath make their own id with useId, so the same piece can appear twice on a page.
 */

/** The brand and illustration colours. */
export const RV = {
  ink: '#06224F',
  forest: '#163B32',
  green: '#1F806B',
  mint: '#DDEDE6',
  cream: '#F6F3E9',
  paper: '#FFFDF7',
  gold: '#F6B84B',
  goldDeep: '#E39A1F',
  goldLight: '#FFD98A',
  ocean: '#33B3FB',
  oceanDeep: '#1E8FE0',
  land: '#5ED34F',
  landDeep: '#3DB35A',
  coral: '#F0644A',
  coralDeep: '#D24A33',
  red: '#EF4F3F',
  blue: '#3D8EF0',
  blueDeep: '#2A6FD0',
  purple: '#7C5CD6',
  purpleLight: '#A893F0',
  orange: '#F28C28',
  rose: '#FF6F9F',
  blush: '#FF8FA3',
  sky: '#A8DCF8',
  wood: '#A0693B',
} as const;

export type GlobeMood = 'happy' | 'wink' | 'cheer' | 'curious' | 'calm' | 'none';

/**
 * Roviko as a small globe, drawn in a local box of radius 10 and placed with x, y and r.
 * `look` moves the face sideways (-1 left … 1 right). `ocean` and `land` recolour it (a rival planet).
 */
export function MiniGlobe({ x, y, r, mood = 'happy', look = 0, ocean = RV.ocean, land = RV.land, shade = true }: {
  x: number; y: number; r: number; mood?: GlobeMood; look?: number; ocean?: string; land?: string; shade?: boolean;
}) {
  const id = 'rvg' + React.useId().replace(/[^a-zA-Z0-9]/g, '');
  const fx = look * 2.2;
  return <g transform={`translate(${x} ${y}) scale(${r / 10})`}>
    <defs><clipPath id={id}><circle r="10"/></clipPath></defs>
    <circle r="10" fill={ocean}/>
    <g clipPath={`url(#${id})`}>
      <g fill={land}>
        {/* the Americas on the left edge, Europe and Africa on the right, two little islands */}
        <path d="M-11 -6.2C-8.6 -7.4-6.4-5.6-6.9-3.1-7.3-1-5.2-.2-5.6 2.4-6 4.6-4.3 5.6-4.9 8-5.3 9.6-7.6 10.4-11 9Z"/>
        <path d="M11 -7.6C8.6-8.1 6.6-6.4 7.2-4.2 7.7-2.4 6-1.3 6.6.9 7.1 2.8 6.1 4.4 7.3 6.1 8.3 7.4 10 7 11 6Z"/>
        <path d="M-5.6-9.6C-3.6-10.8-1.2-9.6-2.4-8-3.4-6.8-5.8-7.4-5.6-9.6Z"/>
        <path d="M2.6-9.2C4.4-10.4 6.6-9.8 6-8.5 5.4-7.4 3.4-7.6 2.6-9.2Z"/>
      </g>
      {shade && <path d="M-12-12H12V12H-12ZM-1.6-1.8m-10.6 0a10.6 10.6 0 1 0 21.2 0a10.6 10.6 0 1 0-21.2 0" fill={RV.ink} fillRule="evenodd" opacity=".13"/>}
    </g>
    {shade && <ellipse cx="-5" cy="-5.6" rx="2.6" ry="1.4" transform="rotate(-38 -5 -5.6)" fill="#fff" opacity=".5"/>}
    {mood !== 'none' && <g transform={`translate(${fx} 0)`}><GlobeFace mood={mood}/></g>}
  </g>;
}

/** Roviko's face for a globe of radius 10: big navy eyes with a shine, blush and a small smile. */
export function GlobeFace({ mood = 'happy' }: { mood?: Exclude<GlobeMood, 'none'> }) {
  const eye = (cx: number) => <g key={cx}><ellipse cx={cx} cy="-.8" rx="1.45" ry="1.6" fill={RV.ink}/><circle cx={cx - .5} cy="-1.45" r=".55" fill="#fff"/></g>;
  const arc = (cx: number) => <path key={cx} d={`M${cx - 1.5} -.3q1.5 -1.9 3 0`} stroke={RV.ink} strokeWidth=".85" strokeLinecap="round" fill="none"/>;
  const cheeks = <g fill={RV.blush} opacity=".7"><ellipse cx="-5.2" cy="1.5" rx="1.25" ry=".7"/><ellipse cx="5.2" cy="1.5" rx="1.25" ry=".7"/></g>;
  const smile = <path d="M-1.4 1.2Q0 2.6 1.4 1.2" stroke={RV.ink} strokeWidth=".8" strokeLinecap="round" fill="none"/>;
  switch (mood) {
    case 'cheer': return <>{arc(-3.4)}{arc(3.4)}{cheeks}<path d="M-1.9 1.1q1.9 3 3.8 0z" fill={RV.ink} stroke={RV.ink} strokeWidth=".5" strokeLinejoin="round"/><path d="M-.9 2.3q.9 .6 1.8 0" fill={RV.blush}/></>;
    case 'wink': return <>{eye(-3.4)}{arc(3.4)}{cheeks}{smile}</>;
    case 'curious': return <>{eye(-3.4)}{eye(3.4)}<path d="M2.2-3.9l2.6-.7" stroke={RV.ink} strokeWidth=".7" strokeLinecap="round"/>{cheeks}<ellipse cx=".1" cy="1.9" rx=".75" ry=".95" fill={RV.ink}/></>;
    case 'calm': return <>{arc(-3.4)}{arc(3.4)}{cheeks}{smile}</>;
    default: return <>{eye(-3.4)}{eye(3.4)}{cheeks}{smile}</>;
  }
}

/** A four-point sparkle centred on x, y. */
export function Sparkle({ x, y, s = 1, fill = RV.gold, opacity = 1 }: { x: number; y: number; s?: number; fill?: string; opacity?: number }) {
  return <path transform={`translate(${x} ${y}) scale(${s})`} d="M0-2.6C.3-.9.9-.3 2.6 0 .9.3.3.9 0 2.6-.3.9-.9.3-2.6 0-.9-.3-.3-.9 0-2.6Z" fill={fill} opacity={opacity}/>;
}

/** The soft shadow an object casts on the ground. */
export function GroundShadow({ x, y, rx, ry = rx * .16, opacity = .12 }: { x: number; y: number; rx: number; ry?: number; opacity?: number }) {
  return <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={RV.ink} opacity={opacity}/>;
}

/** A little white plane seen from above, nose to the right, about 13 wide; place and turn it with x, y, angle. */
export function Plane({ x, y, s = 1, angle = 0 }: { x: number; y: number; s?: number; angle?: number }) {
  return <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${s})`}>
    <path d="M-.6-1.1-3.4-5.6h1.9L3.1-1.1ZM-.6 1.1-3.4 5.6h1.9L3.1 1.1ZM-4.9-.9-6.4-3.5h1.4L-2.9-.9ZM-4.9.9-6.4 3.5h1.4L-2.9.9Z" fill={RV.blue} stroke={RV.blue} strokeWidth=".5" strokeLinejoin="round"/>
    <path d="M-6.3 0C-6.3-.9-5.6-1.35-4.4-1.35H4.2C5.8-1.35 6.9-.6 6.9 0S5.8 1.35 4.2 1.35H-4.4C-5.6 1.35-6.3.9-6.3 0Z" fill="#fff"/>
    <path d="M4.5-.75C5.4-.7 6.1-.4 6.3 0H4.5Z" fill={RV.blueDeep}/>
  </g>;
}

/** A red map pin with its point at x, y (about 7 wide and 10 tall at s=1). */
export function Pin({ x, y, s = 1, fill = RV.red }: { x: number; y: number; s?: number; fill?: string }) {
  return <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M0 0C0 0-3.6-3.7-3.6-6.6a3.6 3.6 0 0 1 7.2 0C3.6-3.7 0 0 0 0Z" fill={fill}/>
    <path d="M0 0C0 0 3.6-3.7 3.6-6.6A3.6 3.6 0 0 0 1.2-10C2.4-8.4 2.2-4.4 0 0Z" fill={RV.ink} opacity=".12"/>
    <circle cy="-6.6" r="1.45" fill="#fff"/>
  </g>;
}

/** Roviko's navy hand, for holding the edge of something. */
export function Hand({ x, y, s = 1, angle = 0 }: { x: number; y: number; s?: number; angle?: number }) {
  return <ellipse cx={x} cy={y} rx={1.7 * s} ry={1.15 * s} transform={angle ? `rotate(${angle} ${x} ${y})` : undefined} fill={RV.ink}/>;
}
