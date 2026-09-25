import {headers} from 'next/headers';
import {BRAND} from './config';
/** Canonical home of the site; canonical links and share previews always point here, whatever host served the page. */
export const SITE_URL='https://roviko.app';
const SHARE_IMAGE={url:'/og/roviko-1200x630.png',width:1200,height:630,alt:'Roviko: a small daily trip around the world'};
export async function siteMetadata(path:string,title:string,description:string){const h=await headers();const host=h.get('host')??'';const local=/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);const origin=BRAND.url||(local?'http://'+host:SITE_URL);return {title,description,metadataBase:new URL(origin),alternates:{canonical:path},openGraph:{title,description,type:'website' as const,siteName:BRAND.name,locale:'en_GB',url:new URL(path,origin).toString(),images:[SHARE_IMAGE]},twitter:{card:'summary_large_image' as const,title,description,images:[SHARE_IMAGE.url]},other:{'roviko-version':BRAND.version}};}
