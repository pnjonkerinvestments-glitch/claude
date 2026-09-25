import RovikoApp from '@/components/RovikoApp';
import {BRAND} from '@/lib/config';
import {siteMetadata} from '@/lib/site-metadata';
export async function generateMetadata(){return siteMetadata('/',BRAND.name+' — Small planet. Big rivalries.','A small daily trip around the world: the Daily Detour plus five geography games, up to 6,000 points a day, and rooms with friends, a random player or the computer.');}
export default function Home(){return <RovikoApp initialPath="/"/>;}
