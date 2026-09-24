import React from 'react';
import { GameCover } from '../atelier/GameCover';

/**
 * The cover illustration for every game card. The four daily games use their original
 * clay-style artwork; the others get small vector scenes in the same soft palette.
 * Decorative only: never used as quiz geography.
 */
export type CoverMode = 'rank' | 'daily' | 'compare' | 'mosaic' | 'trail' | 'duel' | 'mystery' | 'classic' | 'room';

const shade = (id: string, from: string, to: string) => <radialGradient id={id} cx="35%" cy="30%" r="80%"><stop offset="0" stopColor={from}/><stop offset="1" stopColor={to}/></radialGradient>;

function Duel() {
  return <svg viewBox="0 0 480 320" className="cover-svg" aria-hidden="true" focusable="false">
    <defs>{shade('duel-a', '#fffaf2', '#efe4d2')}{shade('duel-b', '#2a4a6b', '#17304a')}{shade('duel-g', '#8fd3c0', '#3e9c83')}</defs>
    <rect width="480" height="320" fill="#f4dde4"/>
    <ellipse cx="240" cy="262" rx="150" ry="16" fill="#d9b8c3" opacity=".7"/>
    <g transform="rotate(-11 180 160)"><rect x="118" y="62" width="124" height="170" rx="20" fill="url(#duel-a)"/><rect x="134" y="80" width="92" height="64" rx="12" fill="#bfe3d6"/><path d="M142 134l24-28 18 16 16-14 18 26z" fill="#3e9c83"/><rect x="138" y="160" width="62" height="10" rx="5" fill="#c9b9a3"/><rect x="138" y="180" width="84" height="10" rx="5" fill="#e3d6c3"/></g>
    <g transform="rotate(10 300 160)"><rect x="240" y="58" width="124" height="170" rx="20" fill="url(#duel-b)"/><circle cx="302" cy="120" r="34" fill="url(#duel-g)"/><path d="M280 112c10 4 16-6 24-2s6 14 16 12" stroke="#1f5d4f" strokeWidth="5" fill="none" strokeLinecap="round"/><rect x="262" y="176" width="62" height="10" rx="5" fill="#f6b84b"/><rect x="262" y="196" width="80" height="10" rx="5" fill="#3a5a7c"/></g>
    <circle cx="243" cy="236" r="26" fill="#f6b84b"/><text x="243" y="245" textAnchor="middle" fontFamily="Fredoka, sans-serif" fontSize="24" fontWeight="700" fill="#18211d">vs</text>
  </svg>;
}

function Mystery() {
  return <svg viewBox="0 0 480 320" className="cover-svg" aria-hidden="true" focusable="false">
    <defs>{shade('my-card', '#fffaf2', '#ece2d0')}{shade('my-glass', '#ffffff', '#dfe8f5')}</defs>
    <rect width="480" height="320" fill="#e3def5"/>
    <ellipse cx="238" cy="266" rx="160" ry="15" fill="#c6bee6" opacity=".75"/>
    <g transform="rotate(-6 220 160)"><rect x="112" y="70" width="220" height="150" rx="18" fill="url(#my-card)"/><path d="M222 88v112" stroke="#d8ccb6" strokeWidth="3" strokeDasharray="6 8"/><rect x="132" y="96" width="70" height="10" rx="5" fill="#c9b9a3"/><rect x="132" y="118" width="58" height="10" rx="5" fill="#e3d6c3"/><rect x="132" y="140" width="66" height="10" rx="5" fill="#e3d6c3"/>
      <rect x="248" y="90" width="64" height="76" rx="8" fill="#6b5aa8"/><rect x="254" y="96" width="52" height="64" rx="5" fill="none" stroke="#fffaf2" strokeWidth="2" strokeDasharray="3 4"/><text x="280" y="143" textAnchor="middle" fontFamily="Fredoka, sans-serif" fontSize="40" fontWeight="600" fill="#fffaf2">?</text></g>
    <g transform="translate(318 178) rotate(28)"><rect x="-8" y="30" width="16" height="62" rx="8" fill="#163b32"/><circle r="40" fill="url(#my-glass)" stroke="#163b32" strokeWidth="11"/><path d="M-18-14a24 24 0 0 1 20-10" stroke="#fff" strokeWidth="6" strokeLinecap="round" fill="none"/></g>
  </svg>;
}

function Classic() {
  return <svg viewBox="0 0 480 320" className="cover-svg" aria-hidden="true" focusable="false">
    <defs>{shade('cl-hill', '#9fd6bf', '#4f9e82')}{shade('cl-pin', '#ff9a86', '#d4553f')}</defs>
    <rect width="480" height="320" fill="#dcece4"/>
    <ellipse cx="240" cy="258" rx="170" ry="16" fill="#b9d6c8" opacity=".8"/>
    <path d="M92 252c30-86 110-120 150-120s118 34 148 120z" fill="url(#cl-hill)"/>
    <path d="M150 214c22-8 38 6 58-2" stroke="#e9f6ef" strokeWidth="6" strokeLinecap="round" fill="none" opacity=".7"/>
    <rect x="232" y="54" width="8" height="112" rx="4" fill="#163b32"/>
    <path d="M240 58h74l-14 22 14 22h-74z" fill="#f6b84b"/><path d="M240 80h66" stroke="#fffaf2" strokeWidth="6"/>
    <g transform="translate(330 148)"><path d="M0 44c-4-10-30-32-30-54a30 30 0 0 1 60 0c0 22-26 44-30 54z" fill="url(#cl-pin)"/><circle cy="-10" r="11" fill="#fffaf2"/></g>
    <g transform="translate(150 150) rotate(-8)"><rect x="-26" y="-18" width="52" height="36" rx="6" fill="#fffaf2"/><rect x="-26" y="-18" width="18" height="36" rx="3" fill="#1f806b"/><rect x="8" y="-18" width="18" height="36" rx="3" fill="#e0664f"/></g>
  </svg>;
}

function Room() {
  return <svg viewBox="0 0 480 320" className="cover-svg" aria-hidden="true" focusable="false">
    <rect width="480" height="320" fill="#163b32"/>
    <circle cx="240" cy="170" r="92" fill="#1f806b" opacity=".55"/>
    {[[160, 150, '#f6b84b'], [240, 118, '#ddede6'], [320, 150, '#e0664f'], [196, 214, '#9fd6bf'], [284, 214, '#b8c9fc']].map(([x, y, c], i) => <g key={i}><circle cx={x} cy={y} r="30" fill={c as string}/><circle cx={+x - 9} cy={+y - 4} r="3.5" fill="#163b32"/><circle cx={+x + 9} cy={+y - 4} r="3.5" fill="#163b32"/><path d={`M${+x - 9} ${+y + 8}q9 7 18 0`} stroke="#163b32" strokeWidth="3" fill="none" strokeLinecap="round"/></g>)}
  </svg>;
}

export function CoverArt({ mode }: { mode: CoverMode }) {
  if (mode === 'duel') return <Duel/>;
  if (mode === 'mystery') return <Mystery/>;
  if (mode === 'classic') return <Classic/>;
  if (mode === 'room') return <Room/>;
  return <GameCover mode={mode}/>;
}
