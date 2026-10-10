import { MODES } from './config';

/**
 * The continent of the week (1.35): after the six daily games Roviko offers to learn one part of the world, a new
 * one every Monday (UTC) in a five-week round. North and South America share a week ("Americas"), so every week has
 * enough countries. Practice only: these games never give ranking points.
 */
export const WEEK_CONTINENTS = ['Europe', 'Africa', 'Asia', 'Americas', 'Oceania'] as const;
export type WeekContinent = typeof WEEK_CONTINENTS[number];
/** Monday 5 October 2026 starts the round with Europe. */
const ROUND_START = Date.parse('2026-10-05T00:00:00Z');
export function weekMonday(date: string) {
  const d = new Date(date + 'T00:00:00Z');
  return new Date(d.getTime() - ((d.getUTCDay() + 6) % 7) * 86400000).toISOString().slice(0, 10);
}
export function continentOfWeek(date: string): WeekContinent {
  const weeks = Math.floor((Date.parse(weekMonday(date) + 'T00:00:00Z') - ROUND_START) / (7 * 86400000));
  return WEEK_CONTINENTS[((weeks % WEEK_CONTINENTS.length) + WEEK_CONTINENTS.length) % WEEK_CONTINENTS.length];
}
/** Whether a country's region belongs to a week's continent (or to a single region in the classic settings). */
export function inRegion(countryRegion: string, region: string) {
  if (region === 'World') return true;
  if (region === 'Americas') return countryRegion === 'North America' || countryRegion === 'South America';
  return countryRegion === region;
}
/** Games that work for a continent. Oceania is almost all islands, so it has no neighbour questions. */
export function continentModes(region: string): (typeof MODES)[number][] {
  return region === 'Oceania' ? MODES.filter(m => m !== 'borders') : [...MODES];
}
/** The art for a continent card (the region scenes in public/art). */
export function continentArt(region: string) {
  return '/art/banner-' + (region === 'Americas' ? 'south-america' : region.toLowerCase().replace(' ', '-')) + '.webp';
}
