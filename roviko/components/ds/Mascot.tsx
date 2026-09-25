import React from 'react';

/**
 * Roviko, the globe. The original artwork carries the happy face; other moods are drawn
 * over a patch of its own ocean colour, so the character stays the same and only the face changes.
 * Decorative: the surrounding text always says what the mood means.
 */
export type MascotMood = 'happy' | 'cheer' | 'wink' | 'worried' | 'sleepy' | 'curious';
const INK = '#06224f', OCEAN = '#33b3fa';

const eye = (x: number, y = 126, r = 10) => <g><circle cx={x} cy={y} r={r} fill={INK}/><circle cx={x + 3} cy={y - 4} r={r * 0.32} fill="#fff"/></g>;
const happyEye = (x: number) => <path d={`M${x - 11} 130q11 -14 22 0`} stroke={INK} strokeWidth="6" strokeLinecap="round" fill="none"/>;
const closedEye = (x: number) => <path d={`M${x - 10} 124q10 9 20 0`} stroke={INK} strokeWidth="5" strokeLinecap="round" fill="none"/>;
const cheeks = <g fill="#ff8fa3" opacity=".55"><ellipse cx="86" cy="142" rx="9" ry="5"/><ellipse cx="170" cy="142" rx="9" ry="5"/></g>;

const FACES: Record<Exclude<MascotMood, 'happy'>, React.ReactNode> = {
  cheer: <>{happyEye(100)}{happyEye(156)}{cheeks}<path d="M110 138q18 22 36 0z" fill={INK}/><path d="M118 146q10 6 20 0" fill="#ff8fa3"/></>,
  wink: <>{eye(100)}{happyEye(156)}{cheeks}<path d="M114 139q14 11 28 0" stroke={INK} strokeWidth="5" strokeLinecap="round" fill="none"/></>,
  worried: <>{eye(100, 128, 9)}{eye(156, 128, 9)}<path d="M88 112l20 -5M168 112l-20 -5" stroke={INK} strokeWidth="4.5" strokeLinecap="round"/><path d="M116 146q6 -6 12 0t12 0" stroke={INK} strokeWidth="4.5" strokeLinecap="round" fill="none"/></>,
  sleepy: <>{closedEye(100)}{closedEye(156)}<ellipse cx="128" cy="143" rx="6" ry="5" fill={INK}/></>,
  curious: <>{eye(100, 126, 10)}{eye(156, 124, 12)}<path d="M150 106l18 -4" stroke={INK} strokeWidth="4.5" strokeLinecap="round"/><ellipse cx="130" cy="143" rx="7" ry="6" fill={INK}/></>,
};

export function Mascot({ mood = 'happy', size = 220, className = '' }: { mood?: MascotMood; size?: number; className?: string }) {
  return <svg className={'mascot mascot-' + mood + ' ' + className} viewBox="0 0 256 256" width={size} height={size} aria-hidden="true" focusable="false">
    <image href="/globe-logo.webp" width="256" height="256"/>
    {mood !== 'happy' && <><ellipse cx="128" cy="128" rx="52" ry="23" fill={OCEAN}/>{FACES[mood]}</>}
    {mood === 'sleepy' && <g fill={INK} fontFamily="Fredoka, sans-serif" fontWeight="700"><text x="196" y="70" fontSize="22">z</text><text x="214" y="48" fontSize="16">z</text></g>}
  </svg>;
}
