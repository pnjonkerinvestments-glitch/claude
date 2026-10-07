import React from 'react';
import { ICONS } from '../ds/RovikoIcons';

/*
 * One logo per game, used everywhere the interface names a game: game headers, cards, tabs, quests,
 * scoring and the room settings. Since 1.24 each logo is a cartoon sticker in the style of the social videos
 * (flat colours, a thick dark outline, Roviko the globe), drawn in `components/ds/RovikoIcons.tsx`, on a soft
 * tile in the game's own colour (`game-icon-<mode>` in design.css sets `--g`, which the drawing uses too).
 */
export const GAME_ICON_MODES = ['rank', 'daily', 'compare', 'mosaic', 'trail', 'daily-trail', 'duel', 'mystery', 'capitals', 'flags', 'pinpoint', 'borders', 'order', 'shape', 'mixed', 'room'] as const;

/** A soft tile with the game's logo. The colour comes from the `game-icon-<mode>` class. */
export function GameIcon({ mode, size = 'md', className = '' }: { mode: string; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  return <span className={`game-icon game-icon-${mode} game-icon-${size} ${className}`} aria-hidden="true">
    <svg viewBox="0 0 32 32" className="game-logo r-icon" focusable="false">{ICONS[mode] ?? ICONS.mixed}</svg>
  </span>;
}
