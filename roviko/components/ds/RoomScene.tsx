import React from 'react';
import { CharacterArt, type CharacterPose } from './Character';
import { lookOf } from './GlobeAvatar';

/**
 * The multiplayer cover (1.23): five Roviko friends by a lake, like the room in the owner's design.
 * Vector, so it is sharp on every screen; decoration only.
 */
const FRIENDS: { x: number; y: number; s: number; id: number; pose: CharacterPose }[] = [
  { x: 112, y: 142, s: .4, id: 4, pose: 'wave' },
  { x: 222, y: 152, s: .44, id: 5, pose: 'cheer' },
  { x: 330, y: 140, s: .5, id: 0, pose: 'cheer' },
  { x: 438, y: 152, s: .44, id: 1, pose: 'hips' },
  { x: 546, y: 142, s: .4, id: 6, pose: 'wave' },
];

export function RoomScene({ className = '' }: { className?: string }) {
  return <svg className={'room-scene ' + className} viewBox="0 0 660 230" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="rs-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#CDEFF6"/><stop offset="1" stopColor="#EAF7EF"/></linearGradient>
      <linearGradient id="rs-lake" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7FD0E6"/><stop offset="1" stopColor="#5BBBD9"/></linearGradient>
    </defs>
    <rect width="660" height="230" fill="url(#rs-sky)"/>
    <circle cx="596" cy="44" r="26" fill="#FFE6A0"/>
    <path d="M0 112C70 70 140 86 210 96S350 62 430 84 560 70 660 96V140H0Z" fill="#A9DDC2"/>
    <rect y="118" width="660" height="40" fill="url(#rs-lake)"/>
    <path d="M40 132h60M150 144h44M420 130h70M540 146h50" stroke="#B6E8F4" strokeWidth="3" strokeLinecap="round"/>
    {[[30, 104, 22], [70, 98, 28], [606, 100, 26], [640, 108, 20]].map(([x, y, r]) => <g key={x}><rect x={x - 3} y={y} width="6" height="22" rx="3" fill="#8B5E3C"/><circle cx={x} cy={y - r * .4} r={r} fill="#3FAE62"/></g>)}
    <path d="M0 168C110 150 220 158 330 156S550 150 660 166V230H0Z" fill="#7CCB63"/>
    <path d="M0 196C140 182 260 192 380 188S580 182 660 194V230H0Z" fill="#62B653"/>
    {FRIENDS.map(f => { const look = lookOf(f.id); return <g key={f.id} transform={`translate(${f.x} ${f.y}) scale(${f.s})`}>
      <CharacterArt mood={look?.mood ?? 'happy'} pose={f.pose}/>
      {look?.extra}
    </g>; })}
  </svg>;
}
