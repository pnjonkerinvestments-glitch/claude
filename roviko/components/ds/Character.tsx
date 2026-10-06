import React from 'react';

/**
 * Roviko as it walks through the social videos: the globe with arms, legs and a face that reacts.
 * Same drawing as the video engine (social/roviko-shorts/lib/core.js): a 340 box around a globe of radius 100.
 * Decorative: the text around it always says what the mood means.
 */
export type CharacterMood = 'happy' | 'cheer' | 'wink' | 'worried' | 'shock' | 'sad' | 'curious' | 'sleepy' | 'cool';
export type CharacterPose = 'stand' | 'wave' | 'cheer' | 'shrug' | 'point' | 'hips';
const INK = '#06224F', BLUSH = '#FF8FA3';

/** Quadratic limb from (ax,ay) to (bx,by) that bends sideways by `bend`, as in the videos. */
const limb = (ax: number, ay: number, bx: number, by: number, bend: number) => {
  const mx = (ax + bx) / 2, my = (ay + by) / 2, dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1;
  return `M${ax} ${ay}Q${(mx - dy / L * bend).toFixed(1)} ${(my + dx / L * bend).toFixed(1)} ${bx} ${by}`;
};
// Hand positions per pose: [x, y, bend] for the left and the right arm (shoulders at ±86, 26).
const ARMS: Record<CharacterPose, [number, number, number][]> = {
  stand: [[-104, 92, 14], [104, 92, 14]],
  wave: [[-104, 92, 14], [122, -70, -20]],
  cheer: [[-122, -88, -22], [122, -88, -22]],
  shrug: [[-142, 6, 26], [142, 6, 26]],
  point: [[-104, 92, 14], [150, -8, -8]],
  hips: [[-118, 58, -40], [118, 58, -40]],
};

export function Face({ mood }: { mood: CharacterMood }) {
  const eye = (cx: number, big = 1) => <g><ellipse cx={cx} cy={-5.7} rx={11 * big} ry={11 * big} fill={INK}/><ellipse cx={cx - 3.5 * big} cy={-10.2} rx={3.6 * big} ry={3.4 * big} fill="#fff"/></g>;
  const happyEye = (cx: number) => <path d={`M${cx - 11} -2.7q11 -13 22 0`} stroke={INK} strokeWidth="5.4" strokeLinecap="round" fill="none"/>;
  const cheeks = <g fill={BLUSH} opacity=".55"><ellipse cx="-45" cy="10" rx="9" ry="5"/><ellipse cx="46" cy="10" rx="9" ry="5"/></g>;
  const smile = <path d="M-11.3 7.7Q0 18.4 11.3 7.7" stroke={INK} strokeWidth="5.2" strokeLinecap="round" fill="none"/>;
  const open = <><path d="M-12 7q12 17 24 0z" fill={INK} stroke={INK} strokeWidth="3" strokeLinejoin="round"/><path d="M-6 14.5q6 4 12 0" fill={BLUSH}/></>;
  const grin = <><path d="M-17 6q17 24 34 0z" fill={INK} stroke={INK} strokeWidth="3" strokeLinejoin="round"/><path d="M-9 17q9 5 18 0" fill={BLUSH}/></>;
  switch (mood) {
    case 'cheer': return <>{happyEye(-30.4)}{happyEye(30.9)}{cheeks}{grin}</>;
    case 'wink': return <>{eye(-30.4)}{happyEye(30.9)}{cheeks}{smile}</>;
    case 'worried': return <>{eye(-30.4)}{eye(30.9)}<path d="M-40 -27l17 -6M40 -27l-17 -6" stroke={INK} strokeWidth="4.4" strokeLinecap="round"/><path d="M-13 13l6.5 -4 6.5 4 6.5 -4 6.5 4" stroke={INK} strokeWidth="4.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/><path transform="translate(60 -26)" d="M0 -12C4 -5 8 0 8 5a8 8 0 0 1 -16 0c0 -5 4 -10 8 -17z" fill="#BFE4F8" stroke="#fff" strokeWidth="2"/></>;
    case 'shock': return <>{eye(-30.4, 1.35)}{eye(30.9, 1.35)}<path d="M-41 -35q10 -7 20 0M21 -35q10 -7 20 0" stroke={INK} strokeWidth="4.4" strokeLinecap="round" fill="none"/><ellipse cx="1" cy="15" rx="7" ry="8.8" fill={INK}/></>;
    case 'sad': return <>{eye(-30.4)}{eye(30.9)}<path d="M-40 -27l17 -6M40 -27l-17 -6" stroke={INK} strokeWidth="4.4" strokeLinecap="round"/><path d="M-10 16Q0 8 10 16" stroke={INK} strokeWidth="5" strokeLinecap="round" fill="none"/></>;
    case 'curious': return <>{eye(-30.4)}{eye(30.9, 1.15)}<path d="M20 -31l19 -5" stroke={INK} strokeWidth="4.4" strokeLinecap="round"/><ellipse cx="1" cy="13" rx="5.2" ry="6.5" fill={INK}/></>;
    case 'sleepy': return <><path d="M-41 -6q10 9 20 0M20 -6q10 9 20 0" stroke={INK} strokeWidth="5" strokeLinecap="round" fill="none"/><ellipse cx="1" cy="13" rx="5" ry="4.5" fill={INK}/></>;
    case 'cool': return <><g transform="translate(0 -5.7)"><path d="M-47 -12h36a4 4 0 0 1 4 4v6c0 9 -7 15 -16 15h-12c-9 0 -16 -6 -16 -15v-6a4 4 0 0 1 4 -4zM11 -12h36a4 4 0 0 1 4 4v6c0 9 -7 15 -16 15h-12c-9 0 -16 -6 -16 -15v-6a4 4 0 0 1 4 -4z" fill={INK}/><path d="M-7 -8q7 -5 18 0" stroke={INK} strokeWidth="4" fill="none"/><path d="M-40 -6l9 0M18 -6l9 0" stroke="#fff" strokeOpacity=".55" strokeWidth="3" strokeLinecap="round"/></g>{grin}</>;
    default: return <>{eye(-30.4)}{eye(30.9)}{smile}</>;
  }
}

/** The drawing itself, in the 340-wide box around a globe of radius 100 (for use inside other SVG scenes). */
export function CharacterArt({ mood = 'happy', pose = 'stand' }: { mood?: CharacterMood; pose?: CharacterPose }) {
  const arms = ARMS[pose];
  return <>
    <ellipse className="character-shadow" cx="0" cy="158" rx="70" ry="9" fill={INK} opacity=".12"/>
    <g className="character-body">
      <g className="character-legs">{[-1, 1].map(s => <g key={s}><path d={limb(30 * s, 90, 42 * s, 148, -6 * s)} stroke={INK} strokeWidth="8.5" strokeLinecap="round" fill="none"/><ellipse cx={49 * s} cy={151} rx="14" ry="8" fill={INK}/></g>)}</g>
      {arms.map(([hx, hy, bend], i) => { const s = i ? 1 : -1; return <g key={i} className={'character-arm arm-' + (i ? 'right' : 'left')} style={{ transformOrigin: `${86 * s}px 26px` }}>
        <path d={limb(86 * s, 26, hx, hy, bend * s)} stroke={INK} strokeWidth="8.5" strokeLinecap="round" fill="none"/><circle cx={hx} cy={hy} r="10" fill={INK}/></g>; })}
      <image href="/mascot-body.svg" x="-100" y="-100" width="200" height="200"/>
      <g className="character-face"><Face mood={mood}/></g>
    </g>
  </>;
}

export function Character({ mood = 'happy', pose = 'stand', size = 160, className = '', animate = true }: { mood?: CharacterMood; pose?: CharacterPose; size?: number; className?: string; animate?: boolean }) {
  return <svg className={'character pose-' + pose + ' mood-' + mood + (animate ? ' is-animated' : '') + (className ? ' ' + className : '')} viewBox="-170 -120 340 290" width={size} height={size * 290 / 340} aria-hidden="true" focusable="false">
    <CharacterArt mood={mood} pose={pose}/>
  </svg>;
}
