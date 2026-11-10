import RovikoApp from '@/components/RovikoApp';
import {challengeMetadata, siteMetadata} from '@/lib/site-metadata';
import {alternatesFor} from '@/lib/landing';
import {PAGE_META} from '@/lib/landing-copy';
import {siteJsonLd} from '@/lib/json-ld';
export async function generateMetadata({searchParams}:{searchParams?:Promise<Record<string,string|string[]|undefined>>}={}){const shared=await challengeMetadata('/',await searchParams);if(shared)return shared;return siteMetadata('/',PAGE_META.en[''].title,PAGE_META.en[''].description,'en',alternatesFor('/')!);}
export default function Home(){return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:siteJsonLd('en')}}/><RovikoApp initialPath="/"/></>;}
