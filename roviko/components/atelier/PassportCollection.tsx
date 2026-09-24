'use client';
import React, { useEffect, useState } from 'react';
import { ArrowRight, BookOpen, Check } from 'lucide-react';
import { passportMilestone, STAMP_REGIONS, type CountryStamp } from '@/lib/passport';

export function PassportPeek({stats,t,onOpen}:any) {
  const stamps:CountryStamp[]=stats.stamps ?? [], next=passportMilestone(stamps);
  return <section className="passport-peek"><span className="passport-mini-stamp" aria-hidden="true"><BookOpen/></span><div><h2>{stamps.length ? t('passportPeek').replace('{n}',String(stamps.length)) : t('passportEmpty')}</h2><p>{stamps.length && next ? t('stampMilestone').replace('{n}',String(next.target-next.count)).replace('{region}',t(next.region)) : t('passportKeep')}</p></div><button className="text-link" onClick={onOpen}>{t('openPassport')}<ArrowRight size={17}/></button></section>;
}

const REGION_SLUG:Record<string,string>={Europe:'europe',Africa:'africa',Asia:'asia','North America':'north-america','South America':'south-america',Oceania:'oceania'};

export function PassportCollection({stats,t,locale,onStart,go}:any) {
  const stamps:CountryStamp[]=stats.stamps ?? [], next=passportMilestone(stamps);
  const [paths,setPaths]=useState<{id:string;path:string}[]>([]),[failed,setFailed]=useState(false),[reload,setReload]=useState(0);
  useEffect(()=>{
    const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),10000);let active=true;setFailed(false);
    fetch('/data/world-map.json',{signal:abort.signal}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(v=>{if(active)setPaths(v);}).catch(()=>{if(active)setFailed(true);}).finally(()=>clearTimeout(timer));
    return ()=>{active=false;clearTimeout(timer);abort.abort();};
  },[reload]);
  const discovered=new Map(stamps.map(s=>[String(Number(s.numeric)),s]));
  const sealCount=stamps.reduce((n,s)=>n+s.seals.length,0);
  return <section className="passport-collection" aria-labelledby="collection-title"><div className="atelier-section-heading"><h2 id="collection-title">{t('stampCollection')}</h2><span>{stamps.length}/195</span></div><p className="stamp-rule">{t('stampRule')}</p>
    <div className="discovery-atlas"><div className="discovery-counts"><div><strong>{stamps.length}</strong><span>{t('stampDiscovered')}</span></div><div><strong>{sealCount}</strong><span>{t('stampMastered')}</span></div><p>{next ? t('stampMilestone').replace('{n}',String(next.target-next.count)).replace('{region}',t(next.region)) : t('stampMilestoneDone')}</p></div>
      <div className="passport-map">{failed ? <div className="passport-map-message" role="status"><p>{t('mapFailed')}</p><button className="btn secondary" onClick={()=>setReload(n=>n+1)}>{t('retry')}</button></div> : paths.length ? <svg viewBox="0 0 1000 500" role="img" aria-label={t('stampCountryCount').replace('{n}',String(stamps.length))}><rect width="1000" height="500" rx="22" fill="var(--map-water)"/>{paths.map((p,i)=>{const country=discovered.get(String(Number(p.id)));return <path key={p.id+':'+i} d={p.path} fill={country ? 'var(--primary)' : 'var(--map-land)'} stroke="var(--map-border)" strokeWidth=".75">{country && <title>{country.name[locale as 'en'|'nl'|'es']}: {t('stampDiscovered')}</title>}</path>;})}</svg> : <p className="passport-map-message" role="status">{t('loading')}</p>}<p>{t('stampMapLegend')} <a href="/sources">{t('sources')}</a></p></div></div>
    <div className="region-grid passport-regions">{STAMP_REGIONS.map(region=>{const count=stamps.filter(c=>c.region===region).length,slug=REGION_SLUG[region]??'europe';return <a href={'/explore#'+slug} onClick={e=>{if(go&&!e.metaKey&&!e.ctrlKey&&!e.shiftKey){e.preventDefault();go('/explore#'+slug);}}} className={'region-card scene-card passport-region'+(count>=5?' is-earned':'')} key={region}>
      <picture className="region-art"><source media="(min-width: 761px)" srcSet={'/art/banner-'+slug+'.webp'} width={658} height={210}/><img src={'/art/scene-'+slug+'.webp'} alt="" width={627} height={465} loading="lazy" decoding="async"/></picture>
      <span className="region-copy"><strong>{t(region)}</strong><b className="region-count">{count>=5 && <Check size={15} strokeWidth={3} aria-hidden="true"/>}{Math.min(count,5)}/5<span className="sr-only"> {t('countries')}</span></b></span>
      <span className="round-go" aria-hidden="true"><ArrowRight size={17}/></span>
    </a>;})}</div><p className="stamp-region-rule">{t('regionStampRule')}</p>
    {stamps.length ? <details className="country-stamps"><summary>{t('showStamps').replace('{n}',String(stamps.length))}</summary><div className="country-stamp-grid">{[...stamps].sort((a,b)=>a.name[locale as 'en'|'nl'|'es'].localeCompare(b.name[locale as 'en'|'nl'|'es'],locale)).map(c=><article className="country-stamp" key={c.id}><div><span>{c.id}</span><span><Check size={13}/>{t('stampDiscovered')}</span></div><img src={c.flag} alt="" width="60" height="42" loading="lazy"/><h3>{c.name[locale as 'en'|'nl'|'es']}</h3><p>{c.seals.length ? t('masteredSubjects').replace('{subjects}',c.seals.map(t).join(' · ')) : t('noSealsYet')}</p></article>)}</div></details> : <div className="stamp-empty"><div className="stamp-empty-copy"><p>{t('stampEmpty')}</p><button className="btn primary" onClick={onStart}>{t('stampStart')}<ArrowRight size={17}/></button></div><img className="stamp-empty-art" src="/art/passport-stamps.webp" alt="" aria-hidden="true" width={399} height={270} loading="lazy" decoding="async"/></div>}
  </section>;
}
