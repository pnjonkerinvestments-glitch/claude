import {headers} from 'next/headers';
import {BRAND} from './config';
/** Canonical home of the site; canonical links and share previews always point here, whatever host served the page. */
export const SITE_URL='https://roviko.app';
const SHARE_IMAGE={url:'/og/roviko-1200x630.png',width:1200,height:630,alt:'Roviko: a small daily trip around the world'};
export async function siteMetadata(path:string,title:string,description:string){const h=await headers();const host=h.get('host')??'';const local=/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);const origin=BRAND.url||(local?'http://'+host:SITE_URL);return {title,description,metadataBase:new URL(origin),alternates:{canonical:path},openGraph:{title,description,type:'website' as const,siteName:BRAND.name,locale:'en_GB',url:new URL(path,origin).toString(),images:[SHARE_IMAGE]},twitter:{card:'summary_large_image' as const,title,description,images:[SHARE_IMAGE.url]},other:{'roviko-version':BRAND.version}};}

/**
 * The link preview of a shared result (1.26): WhatsApp, iMessage and the like show "Pietje scored 3,879 points today"
 * and "#1 of 230 players worldwide. Can you beat that?" instead of the general Roviko text, in the sharer's language.
 * Everything comes from the link (see lib/share.ts), so it is a friendly claim; nothing is looked up or stored.
 */
export async function challengeMetadata(path: string, search: Record<string, string | string[] | undefined> | undefined) {
  const { readChallenge } = await import('./share');
  const { messages } = await import('../i18n/messages');
  const q = new URLSearchParams(Object.entries(search ?? {}).flatMap(([k, v]) => typeof v === 'string' ? [[k, v]] : []));
  const c = readChallenge('?' + q.toString());
  if (!c) return null;
  const lang = (['nl', 'es'].includes(q.get('l') ?? '') ? q.get('l') : 'en') as 'en' | 'nl' | 'es';
  const all = messages as unknown as Record<string, Record<string, string>>;
  const t = (k: string) => all[lang]?.[k] ?? all.en[k] ?? k;
  const loc = lang === 'nl' ? 'nl-NL' : lang === 'es' ? 'es-ES' : 'en-GB', n = (v: number) => v.toLocaleString(loc);
  const gameKey = c.mode === 'day' ? '' : c.mode === 'daily' ? 'dailyTitle' : c.mode === 'trail' ? 'dailyTrail' : c.mode === 'rank' ? 'rankRadar' : c.mode;
  const title = t(c.mode === 'day' ? (c.name ? 'chTitleDayNamed' : 'chTitleDay') : (c.name ? 'chTitleNamed' : 'chTitle')).replace('{name}', c.name ?? '').replace('{n}', n(c.points)).replace('{game}', gameKey ? t(gameKey) : '');
  const rank = c.place && c.players ? (c.place === 1 ? t('chRankFirst') : t('chRank').replace('{place}', n(c.place)).replace('{players}', n(c.players))) : '';
  const description = [rank ? '🏆 ' + rank + '.' : '', t('shareCall'), t('chCopy').split('. ')[0] + '.'].filter(Boolean).join(' ');
  const meta = await siteMetadata(path, title + ' · ' + BRAND.name, description);
  return { ...meta, robots: { index: false, follow: true } };
}
