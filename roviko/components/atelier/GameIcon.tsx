import React from 'react';
import { Building2, CircleHelp, Compass, Earth, Flag, ListOrdered, MapPin, Plane, Puzzle, Radar, Route, Scale, Swords, Users, type LucideIcon } from 'lucide-react';

/** One consistent line icon per game, used everywhere the interface names a game. */
const ICONS: Record<string, LucideIcon> = {
  rank: Radar, daily: Plane, compare: Scale, mosaic: Puzzle, trail: Compass, 'daily-trail': Compass, duel: Swords, mystery: CircleHelp,
  capitals: Building2, flags: Flag, pinpoint: MapPin, borders: Route, order: ListOrdered, mixed: Earth, room: Users,
};

/** A tinted tile with the game's icon. The colour comes from the `game-icon-<mode>` class (see polish.css). */
export function GameIcon({ mode, size = 'md', className = '' }: { mode: string; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const Icon = ICONS[mode] ?? Earth;
  return <span className={`game-icon game-icon-${mode} game-icon-${size} ${className}`} aria-hidden="true"><Icon strokeWidth={2.1}/></span>;
}
