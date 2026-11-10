// 1.61: the public landing pages people can find in a search engine, in English, Dutch and Spanish.
// One page per quiz (flags, capitals, map, mixed) and per part of the world, each with its own address per language:
//   /europe-flags-quiz · /nl/vlaggen-europa-quiz · /es/quiz-de-banderas-de-europa
// Dutch and Spanish pages live under /nl and /es, so a search engine sees real pages in that language (before 1.61 the
// language only changed in the browser). This file is small on purpose: the app's router reads it on every page.
export type Lang = 'en' | 'nl' | 'es';
export const LANGS: Lang[] = ['en', 'nl', 'es'];
export type LandingMode = 'flags' | 'capitals' | 'pinpoint' | 'mixed';
export const LANDING_MODES: LandingMode[] = ['flags', 'capitals', 'pinpoint', 'mixed'];
export const LANDING_REGIONS = ['World', 'Europe', 'Africa', 'Asia', 'North America', 'South America', 'Oceania'] as const;
export type LandingRegion = typeof LANDING_REGIONS[number];
export type Landing = { id: string; mode: LandingMode; region: LandingRegion; slug: Record<Lang, string> };

const REGION_SLUG: Record<Lang, Record<LandingRegion, string>> = {
  en: { World: '', Europe: 'europe', Africa: 'africa', Asia: 'asia', 'North America': 'north-america', 'South America': 'south-america', Oceania: 'oceania' },
  nl: { World: '', Europe: 'europa', Africa: 'afrika', Asia: 'azie', 'North America': 'noord-amerika', 'South America': 'zuid-amerika', Oceania: 'oceanie' },
  es: { World: '', Europe: 'europa', Africa: 'africa', Asia: 'asia', 'North America': 'america-del-norte', 'South America': 'america-del-sur', Oceania: 'oceania' },
};
const MODE_SLUG: Record<Lang, Record<LandingMode, string>> = {
  en: { flags: 'flags', capitals: 'capitals', pinpoint: 'map', mixed: 'geography' },
  nl: { flags: 'vlaggen', capitals: 'hoofdsteden', pinpoint: 'topografie', mixed: 'aardrijkskunde' },
  es: { flags: 'banderas', capitals: 'capitales', pinpoint: 'mapas', mixed: 'geografia' },
};
/** The English addresses that existed before 1.61 keep working as they were. */
const EN_WORLD: Record<LandingMode, string> = { flags: 'flags-quiz', capitals: 'capitals-quiz', pinpoint: 'country-map-quiz', mixed: 'world-geography-quiz' };
function slugFor(lang: Lang, mode: LandingMode, region: LandingRegion) {
  const r = REGION_SLUG[lang][region], m = MODE_SLUG[lang][mode];
  if (lang === 'en') return region === 'World' ? EN_WORLD[mode] : `${r}-${m}-quiz`;
  if (lang === 'nl') return r ? `${m}-${r}-quiz` : `${m}-quiz`;
  return r ? `quiz-de-${m}-de-${r}` : `quiz-de-${m}`;
}
export const LANDINGS: Landing[] = LANDING_REGIONS.flatMap(region => LANDING_MODES.map(mode => ({
  id: slugFor('en', mode, region), mode, region,
  slug: { en: slugFor('en', mode, region), nl: slugFor('nl', mode, region), es: slugFor('es', mode, region) },
})));
const BY_SLUG: Record<Lang, Map<string, Landing>> = { en: new Map(), nl: new Map(), es: new Map() };
for (const l of LANDINGS) for (const lang of LANGS) BY_SLUG[lang].set(l.slug[lang], l);
export const landingBySlug = (lang: Lang, slug: string) => BY_SLUG[lang].get(slug) ?? null;
export const landingById = (id: string) => BY_SLUG.en.get(id) ?? null;
export const landingFor = (mode: LandingMode, region: LandingRegion) => LANDINGS.find(l => l.mode === mode && l.region === region)!;

/** App pages that also exist under /nl and /es (public pages worth finding; everything else stays without a prefix). */
export const LOCAL_PAGES = ['daily', 'how-to-play', 'learn', 'explore', 'multiplayer', 'scoring'];
const prefix = (lang: Lang) => lang === 'en' ? '' : '/' + lang;
/** The public address of a landing page or app page in a language. `page` is '' for the homepage. */
export const landingPath = (l: Landing, lang: Lang) => prefix(lang) + '/' + l.slug[lang];
export const localPath = (page: string, lang: Lang) => (prefix(lang) + (page ? '/' + page : '')) || '/';

/**
 * Reads an address: which language it asks for (null without /nl or /es) and the app's own path for it. A Dutch or
 * Spanish landing address maps to the English one, which is what the app's router knows:
 *   /nl/vlaggen-quiz -> { lang: 'nl', path: '/flags-quiz' };  /es -> { lang: 'es', path: '/' };  /daily -> { lang: null, path: '/daily' }
 * `known` is false for an address under /nl or /es that does not exist.
 */
export function readLocalePath(pathname: string): { lang: Lang | null; path: string; known: boolean } {
  const parts = pathname.split('/').filter(Boolean);
  if (parts[0] !== 'nl' && parts[0] !== 'es') return { lang: null, path: pathname, known: true };
  const lang = parts[0] as Lang;
  if (parts.length === 1) return { lang, path: '/', known: true };
  if (parts.length === 2) {
    const l = landingBySlug(lang, parts[1]);
    if (l) return { lang, path: '/' + l.id, known: true };
    if (LOCAL_PAGES.includes(parts[1])) return { lang, path: '/' + parts[1], known: true };
  }
  return { lang, path: '/' + parts.slice(1).join('/'), known: false };
}
/** Every address of one page, per language, for hreflang and the sitemap. `path` is the app's own (English) path. */
export function alternatesFor(path: string): Record<Lang, string> | null {
  const page = path.replace(/^\//, ''), l = landingById(page);
  if (l) return { en: landingPath(l, 'en'), nl: landingPath(l, 'nl'), es: landingPath(l, 'es') };
  if (page === '' || LOCAL_PAGES.includes(page)) return { en: localPath(page, 'en'), nl: localPath(page, 'nl'), es: localPath(page, 'es') };
  return null;
}
/** All addresses for the sitemap: each entry is one page with its three language versions. */
export function sitemapEntries(): Record<Lang, string>[] {
  return [alternatesFor('/')!, ...LOCAL_PAGES.map(p => alternatesFor('/' + p)!), ...LANDINGS.map(l => alternatesFor('/' + l.id)!)];
}
