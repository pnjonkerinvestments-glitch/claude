import { spanishCountry } from '../i18n/content';
export type CountryStamp = { id: string; numeric: string; name: { en:string; nl:string; es:string }; flag:string; region:string; subjects:string[]; seals:string[] };
export const STAMP_REGIONS = ['Europe','Africa','Asia','North America','South America','Oceania'];
/** Aggregates come from distinct persisted sessions, never client totals. */
export function collectStamps(records: {country_id:string;mode:string;games:number}[], countries: any[]): CountryStamp[] {
  const catalog = new Map(countries.map(c => [c.id,c]));
  const stamps = new Map<string,CountryStamp>();
  for (const record of records) {
    const country=catalog.get(record.country_id); if (!country || record.games < 1) continue;
    const stamp:CountryStamp=stamps.get(country.id) ?? {id:country.id,numeric:country.numeric,name:{en:country.name,nl:country.nl,es:spanishCountry(country.name)},flag:country.flag,region:country.region,subjects:[],seals:[]};
    if (!stamp.subjects.includes(record.mode)) stamp.subjects.push(record.mode);
    if (record.games >= 3 && !stamp.seals.includes(record.mode)) stamp.seals.push(record.mode);
    stamps.set(country.id,stamp);
  }
  return [...stamps.values()].sort((a,b) => a.id.localeCompare(b.id));
}
export function passportMilestone(stamps: CountryStamp[]) {
  return STAMP_REGIONS.map(region => ({ region, count:stamps.filter(s=>s.region===region).length, target:5 }))
    .filter(r => r.count<r.target).sort((a,b)=> b.count-a.count)[0] ?? null;
}
