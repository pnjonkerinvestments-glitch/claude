import RovikoApp from '@/components/RovikoApp';
import {BRAND} from '@/lib/config';
import {siteMetadata} from '@/lib/site-metadata';
export async function generateMetadata(){return siteMetadata('/',BRAND.name+' — Small planet. Big rivalries.','Six original geography games, a daily world expedition and live rooms with friends. Stay curious. Play together.');}
export default function Home(){return <RovikoApp initialPath="/"/>;}
