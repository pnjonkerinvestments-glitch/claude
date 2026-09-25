import {headers} from 'next/headers';
import {BRAND} from './config';
export async function siteMetadata(path:string,title:string,description:string){const h=await headers();const host=h.get('host')??'';const origin=BRAND.url||(/^[a-z0-9.-]+(?::\d+)?$/i.test(host)?'https://'+host:undefined);return {title,description,...(origin?{metadataBase:new URL(origin),alternates:{canonical:path}}:{}),openGraph:{title,description,type:'website' as const,...(origin?{url:new URL(path,origin).toString()}:{})}};}
