// Country names for typing a country (1.55, Daily Crossroads): English, Dutch, Spanish and official names plus common short
// forms (UK, Czech Republic, DRC, Holland, Türkiye, ...). Small and free of the big data files, so the device can load it
// for the autocomplete and the server uses the very same list.
import data from '../data/countries.json';
import { spanishCountry } from '../../i18n/content';
import { normalize } from '../game-engine/scoring';

export type NamedCountry = { id: string; name: string; nl: string; official?: string; flag: string; iso2: string; region: string; capitals: string[] };
export const NAMED_COUNTRIES = data as NamedCountry[];
export const countryName = (c: { name: string; nl: string }, locale: 'en' | 'nl' | 'es') => locale === 'nl' ? c.nl : locale === 'es' ? spanishCountry(c.name) : c.name;

/**
 * Names a player may type for a country, normalised: English, Dutch, Spanish and official names plus common short forms.
 * Shared by the autocomplete on the device and the check on the server.
 */
const EXTRA: Record<string, string[]> = {
  GBR: ['UK', 'U.K.', 'Great Britain', 'Britain', 'Groot-Brittannië', 'Reino Unido'],
  USA: ['USA', 'US', 'U.S.', 'America', 'United States of America', 'VS', 'Amerika', 'EEUU', 'Estados Unidos'],
  CZE: ['Czech Republic', 'Tsjechische Republiek', 'Chequia', 'República Checa'],
  COD: ['DRC', 'DR Congo', 'Democratic Republic of the Congo', 'Congo-Kinshasa', 'Zaire', 'Congo Kinshasa', 'RDC', 'Democratische Republiek Congo'],
  COG: ['Congo-Brazzaville', 'Congo Brazzaville', 'Republic of Congo', 'Congo Republic'],
  NLD: ['Holland', 'The Netherlands', 'Países Bajos', 'Holanda'],
  TUR: ['Turkey', 'Turkiye', 'Turquía'],
  ARE: ['UAE', 'Emirates', 'VAE', 'Emiraten', 'EAU'],
  CIV: ["Côte d'Ivoire", 'Cote dIvoire', 'Costa de Marfil'],
  MMR: ['Burma', 'Birma'],
  SWZ: ['Swaziland', 'Swaziland', 'Suazilandia'],
  MKD: ['Macedonia', 'Macedonië'],
  CPV: ['Cabo Verde'],
  TLS: ['East Timor', 'Timor Leste', 'Timor Oriental'],
  KOR: ['Korea', 'Republic of Korea', 'Corea del Sur'],
  PRK: ['DPRK', 'Corea del Norte'],
  VAT: ['Vatican', 'Holy See', 'Vaticaan', 'Vaticano'],
  BIH: ['Bosnia', 'Bosnië'],
  CAF: ['CAR'],
  VNM: ['Viet Nam'],
  PSE: ['Palestina', 'State of Palestine'],
  RUS: ['Russian Federation'],
  BHS: ['The Bahamas', 'Bahamas'],
  GMB: ['The Gambia'],
  FSM: ['Federated States of Micronesia'],
  STP: ['Sao Tome and Principe', 'Sao Tome'],
  KNA: ['St Kitts and Nevis', 'St. Kitts and Nevis'],
  LCA: ['St Lucia', 'St. Lucia'],
  VCT: ['St Vincent', 'St. Vincent and the Grenadines'],
  TTO: ['Trinidad'], ATG: ['Antigua'], PNG: ['PNG'], NZL: ['NZ', 'Aotearoa'], DEU: ['Deutschland'], CHE: ['Schweiz', 'Suisse'],
  ESP: ['España'], IRL: ['Eire', 'Éire'], GRC: ['Hellas'], BLR: ['Belarus', 'Wit-Rusland', 'Byelorussia', 'Bielorrusia'], MDA: ['Moldavia'], KGZ: ['Kirgizstan', 'Kirghizia'],
};
export function namesOf(c: NamedCountry | { id: string; name: string; nl: string }): string[] {
  return [...new Set([c.name, c.nl, spanishCountry(c.name), (c as any).official, ...(EXTRA[c.id] ?? [])].filter(Boolean) as string[])];
}
const INDEX = new Map<string, string>();
for (const c of NAMED_COUNTRIES) for (const name of namesOf(c)) { const key = normalize(name); if (key && !INDEX.has(key)) INDEX.set(key, c.id); }
/** The country a typed name means, or null for an unknown name. */
export function resolveCountry(text: string): string | null {
  const key = normalize(text);
  return key ? INDEX.get(key) ?? null : null;
}

/** Up to `limit` countries whose name (in any language, or a short form) starts with or contains the typed text. */
export function suggestCountries(text: string, locale: 'en' | 'nl' | 'es', limit = 6): NamedCountry[] {
  const key = normalize(text);
  if (!key) return [];
  const scored: { c: NamedCountry; rank: number }[] = [];
  for (const c of NAMED_COUNTRIES) {
    const names = namesOf(c).map(normalize), own = normalize(countryName(c, locale));
    const rank = own.startsWith(key) ? 0 : names.some(n => n.startsWith(key)) ? 1 : names.some(n => n.includes(key)) ? 2 : -1;
    if (rank >= 0) scored.push({ c, rank });
  }
  return scored.sort((a, b) => a.rank - b.rank || countryName(a.c, locale).localeCompare(countryName(b.c, locale))).slice(0, limit).map(x => x.c);
}
