import React from 'react';
import { Face, type CharacterMood } from './Character';

/**
 * Player avatars as little Roviko globes with an accessory (1.23), like the friends in the social videos:
 * the same globe and faces as `Character`, no emoji. Ids 0–7 are the eight player avatars, 100+ the computer.
 * Decorative: the player's name is always written next to it.
 */
const INK = '#06224F';
type Look = { mood: CharacterMood; extra?: React.ReactNode };
const LOOKS: Look[] = [
  // 0 explorer: just the smile
  { mood: 'happy' },
  // 1 sunglasses (the cool face draws them)
  { mood: 'cool' },
  // 2 beanie with a bobble
  { mood: 'cheer', extra: <g><path d="M-80 -46C-78 -100 78 -100 80 -46Z" fill="#7B5CD6"/><rect x="-86" y="-56" width="172" height="20" rx="10" fill="#F28C28"/><circle cx="0" cy="-104" r="15" fill="#F28C28"/></g> },
  // 3 flower
  { mood: 'wink', extra: <g transform="translate(62 -72)">{[0, 72, 144, 216, 288].map(a => <circle key={a} cx={Math.cos(a * Math.PI / 180) * 14} cy={Math.sin(a * Math.PI / 180) * 14} r="12" fill="#FF6F9F"/>)}<circle r="9" fill="#F6C343"/></g> },
  // 4 cap
  { mood: 'happy', extra: <g><path d="M-74 -50C-70 -112 70 -112 74 -50Z" fill="#F6B84B"/><path d="M10 -56C52 -66 94 -60 116 -46C86 -40 44 -42 8 -46Z" fill="#E39A1F"/><circle cx="0" cy="-100" r="6" fill="#E39A1F"/></g> },
  // 5 round glasses
  { mood: 'happy', extra: <g fill="none" stroke={INK} strokeWidth="5"><circle cx="-30" cy="-6" r="19"/><circle cx="31" cy="-6" r="19"/><path d="M-11 -8q11 -7 23 0M-49 -10l-26 -8M50 -10l26 -8"/></g> },
  // 6 headphones
  { mood: 'wink', extra: <g><path d="M-92 -14C-96 -120 96 -120 92 -14" fill="none" stroke="#FF6F9F" strokeWidth="13" strokeLinecap="round"/><rect x="-112" y="-38" width="30" height="52" rx="14" fill="#FF6F9F"/><rect x="82" y="-38" width="30" height="52" rx="14" fill="#FF6F9F"/></g> },
  // 7 safari hat
  { mood: 'curious', extra: <g><ellipse cx="0" cy="-58" rx="108" ry="18" fill="#E2BE7E"/><path d="M-56 -62C-54 -116 54 -116 56 -62Z" fill="#EBCB91"/><rect x="-56" y="-74" width="112" height="12" fill="#8B5E3C"/></g> },
];

function Bot() {
  return <g>
    <path d="M0 -100V-126" stroke={INK} strokeWidth="6" strokeLinecap="round"/><circle cx="0" cy="-132" r="10" fill="#F6B84B"/>
    <rect x="-62" y="-30" width="124" height="44" rx="22" fill="#0F2C25"/>
    <ellipse cx="-26" cy="-8" rx="10" ry="11" fill="#7CF3D4"/><ellipse cx="26" cy="-8" rx="10" ry="11" fill="#7CF3D4"/>
    <path d="M-14 34q14 12 28 0" stroke={INK} strokeWidth="5" strokeLinecap="round" fill="none"/>
  </g>;
}

/** The face and accessory of avatar `id`, in the globe's own coordinates (radius 100), for scenes. */
export function lookOf(id: number) { return id >= 100 ? null : LOOKS[((id % 8) + 8) % 8]; }

export function GlobeAvatar({ id = 0, size = 48, className = '' }: { id?: number; size?: number; className?: string }) {
  const bot = id >= 100, look = LOOKS[((id % 8) + 8) % 8];
  return <svg className={'globe-avatar ' + className} viewBox="-122 -146 244 244" width={size} height={size} aria-hidden="true" focusable="false">
    <image href="/mascot-body.svg" x="-100" y="-100" width="200" height="200"/>
    {bot ? <Bot/> : <><g className="character-face"><Face mood={look.mood}/></g>{look.extra}</>}
  </svg>;
}
