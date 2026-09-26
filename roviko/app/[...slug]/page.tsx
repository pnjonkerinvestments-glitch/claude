import RovikoApp from '@/components/RovikoApp';
import {notFound} from 'next/navigation';
import {pageTitle} from '@/lib/page-title';
import {messages} from '@/i18n/messages';
import {BRAND} from '@/lib/config';
import {siteMetadata} from '@/lib/site-metadata';
const descriptions:Record<string,string>={'flags-quiz':'Meet the world one flag at a time. Try Flag Signal, learn from each answer and challenge friends in a private room.','capitals-quiz':'Connect countries with their capitals in City Circuit. Choose your region, type your answers or play a quick multiple-choice game.','world-geography-quiz':'Follow country clues, spot flags and place pins. Take a short geography trip across the world, alone or with your friends.','country-map-quiz':'A world map, one country and your best instinct. Drop a pin and discover how close you got.','europe-geography-quiz':'From Atlantic capitals to Alpine neighbours, put your knowledge of Europe to the test with a new mix of questions.','africa-geography-quiz':'Explore African capitals, flags and borders in a short game built for curious minds.','how-to-play':'How every Roviko game works: short rules, scoring and an example for each daily, classic and multiplayer game.',
  daily:'All Roviko games in one place: the Daily Detour, five daily games with points, extras and classic flag, capital and map games.',
  scoring:'How you earn up to 6,000 points a day across six daily games, plus streaks, shields, quests and room points.',
  leaderboard:'Today\u2019s Roviko rankings: see how your daily points compare with players around the world.',
  explore:'Explore every country by region: flags, capitals, neighbours and facts. Then put your knowledge to the test.',
  multiplayer:'Play geography games with friends in a private room, against a random player or against the computer. No account needed.',
  duel:'World Duel: five country cards against Roviko. Pick the right card for each subject and win up to 1,000 daily points.',
  sources:'Where Roviko\u2019s country data comes from: sources, licences, data years and the choices behind the questions.',
  privacy:'How Roviko handles your data: what we store, why, for how long, and how to delete it.',
  terms:'The terms for playing Roviko.'};
/** First path segments the app can show; anything else is a real 404. */
const KNOWN=new Set(['account','settings','daily','scoring','multiplayer','room','game','rank','puzzle','duel','how-to-play','leaderboard','profile','friends','explore','admin','privacy','terms','sources','flags-quiz','capitals-quiz','world-geography-quiz','country-map-quiz','europe-geography-quiz','africa-geography-quiz']);
const known=(slug:string[])=>KNOWN.has(slug[0])&&(slug.length===1||['room','game','rank','puzzle'].includes(slug[0])&&slug.length===2||slug.join('/')==='duel/practice');
export async function generateMetadata({params}:{params:Promise<{slug:string[]}>}){const {slug}=await params;if(!known(slug))return {title:'Roviko',robots:{index:false,follow:false}};const title=pageTitle('/'+slug.join('/'), key => (messages.en as any)[key] ?? key);const meta=await siteMetadata('/'+slug.join('/'),title,descriptions[slug[0]]??'Stay curious. Play original geography games and challenge friends in live private rooms.');const hidden=['room','game','puzzle','rank','profile','friends','account','settings','admin'].includes(slug[0]);
// Private pages are never indexed and carry no canonical link.
return hidden?{...meta,alternates:undefined,robots:{index:false,follow:false}}:meta;}
export default async function Page({params}:{params:Promise<{slug:string[]}>}){const {slug}=await params;if(!known(slug))notFound();return <RovikoApp initialPath={'/'+slug.join('/')}/>;}
