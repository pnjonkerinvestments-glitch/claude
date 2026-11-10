import RovikoApp from '@/components/RovikoApp';
import {notFound} from 'next/navigation';
import {pageTitle} from '@/lib/page-title';
import {messages} from '@/i18n/messages';
import {BRAND} from '@/lib/config';
import {challengeMetadata, siteMetadata} from '@/lib/site-metadata';
import {alternatesFor, landingById, readLocalePath} from '@/lib/landing';
import {landingCopy, PAGE_META} from '@/lib/landing-copy';
import {COUNTRY_COUNT} from '@/lib/landing-count';
import {siteJsonLd} from '@/lib/json-ld';
const descriptions:Record<string,string>={'closecall':'Daily Close Call: get close, don’t go over. Draw countries towards a target and hold in time. Three new rounds every day.','flags-quiz':'Meet the world one flag at a time. Try Flag Signal, learn from each answer and challenge friends in a private room.','capitals-quiz':'Connect countries with their capitals in City Circuit. Choose your region, type your answers or play a quick multiple-choice game.','world-geography-quiz':'Follow country clues, spot flags and place pins. Take a short geography trip across the world, alone or with your friends.','country-map-quiz':'A world map, one country and your best instinct. Drop a pin and discover how close you got.','europe-geography-quiz':'From Atlantic capitals to Alpine neighbours, put your knowledge of Europe to the test with a new mix of questions.','africa-geography-quiz':'Explore African capitals, flags and borders in a short game built for curious minds.','how-to-play':'How every Roviko game works: short rules, scoring and an example for each daily, classic and multiplayer game.',
  daily:'All Roviko games in one place: the Daily Detour, five daily games with points, extras and classic flag, capital and map games.',
  scoring:'How you earn up to 6,000 points a day across six daily games, plus streaks, shields, quests and room points.',
  leaderboard:'Today\u2019s Roviko rankings: see how your daily points compare with players around the world.',
  learn:'Learn the flags of Europe in short lessons. What you get wrong comes back until you know it, with bronze, silver and gold medals.',
  explore:'Explore every country by region: flags, capitals, neighbours and facts. Then put your knowledge to the test.',
  multiplayer:'Play geography games with friends in a private room, against a random player or against the computer. No account needed.',
  duel:'World Duel: seven country cards against Roviko. Pick the right card for each subject and see how you did at the end.',
  sources:'Where Roviko\u2019s country data comes from: sources, licences, data years and the choices behind the questions.',
  privacy:'How Roviko handles your data: what we store, why, for how long, and how to delete it.',
  terms:'The terms for playing Roviko.',
  support:'Help with Roviko: answers to common questions and how to contact us.'};
/** First path segments the app can show; anything else is a real 404. */
const KNOWN=new Set(['account','settings','daily','closecall','scoring','multiplayer','room','game','rank','puzzle','duel','how-to-play','leaderboard','profile','friends','explore','learn','admin','privacy','terms','sources','support','flags-quiz','capitals-quiz','world-geography-quiz','country-map-quiz','europe-geography-quiz','africa-geography-quiz']);
const known=(slug:string[])=>slug.length===1&&!!landingById(slug[0])||KNOWN.has(slug[0])&&(slug.length===1||['room','game','rank','puzzle','learn'].includes(slug[0])&&slug.length===2||slug.join('/')==='duel/practice');
/**
 * 1.61: an address is read in two steps: its language (/nl, /es, else English) and the app's own path. The public
 * pages get a title and description with the words people search for, and links to their other language versions.
 */
const read=(slug:string[])=>{const publicPath='/'+slug.join('/');const r=readLocalePath(publicPath);const parts=r.path.split('/').filter(Boolean);return {publicPath,lang:r.lang??'en' as const,prefixed:!!r.lang,parts,ok:r.lang?r.known:known(parts)};};
export async function generateMetadata({params,searchParams}:{params:Promise<{slug:string[]}>;searchParams?:Promise<Record<string,string|string[]|undefined>>}){const {slug}=await params;if(slug.length===1&&slug[0]==='daily'){const shared=await challengeMetadata('/daily',await searchParams);if(shared)return shared;}const {publicPath,lang,parts,ok}=read(slug);if(!ok)return {title:'Roviko',robots:{index:false,follow:false}};
const path='/'+parts.join('/'),landing=landingById(parts[0]??''),page=parts.length<=1?PAGE_META[lang][parts[0]??'']:undefined,languages=alternatesFor(path)??undefined;
if(landing){const copy=landingCopy(landing,lang,COUNTRY_COUNT[landing.region]);return siteMetadata(publicPath,copy.title,copy.description,lang,languages);}
if(page)return siteMetadata(publicPath,page.title,page.description,lang,languages);
const title=pageTitle(path, key => (messages.en as any)[key] ?? key);const meta=await siteMetadata(publicPath,title,descriptions[parts[0]]??'Stay curious. Play original geography games and challenge friends in live private rooms.');const hidden=['room','game','puzzle','rank','profile','friends','account','settings','admin'].includes(parts[0])||(parts[0]==='learn'&&parts.length>1);
// Private pages are never indexed and carry no canonical link.
return hidden?{...meta,alternates:undefined,robots:{index:false,follow:false}}:meta;}
export default async function Page({params}:{params:Promise<{slug:string[]}>}){const {slug}=await params;const {lang,prefixed,parts,ok}=read(slug);if(!ok)notFound();const path='/'+parts.join('/');return <>{prefixed&&path==='/'&&<script type="application/ld+json" dangerouslySetInnerHTML={{__html:siteJsonLd(lang)}}/>}<RovikoApp initialPath={path} initialLocale={lang}/></>;}
