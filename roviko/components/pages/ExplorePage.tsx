'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ArrowUpRight, Search, Shuffle, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DEFAULT_SETTINGS, REGIONS } from '@/lib/config';
import { formatScore } from '@/lib/client';
import { spanishCountry, spanishCapital, spanishContent } from '../../i18n/content';
import { useApp } from '../app/context';
import { A } from '../app/shared';
import { EmptyState, ErrorState, PageHeader, SectionHeader, Skeleton } from '../ds/States';

type Country = { id: string; name: string; nl: string; official: string; capitals: string[]; region: string; subregion?: string; area: number; languages: string[]; currencies: string[]; borders: string[]; flag: string };
const RECENT = 'roviko:explore:recent';
const REGION_ART: Record<string, string> = { Europe: 'europe', Africa: 'africa', Asia: 'asia', 'North America': 'north-america', 'South America': 'south-america', Oceania: 'oceania' };

function readRecent(): string[] { try { const v = JSON.parse(localStorage.getItem(RECENT) ?? '[]'); return Array.isArray(v) ? v.slice(0, 8) : []; } catch { return []; } }
function hash(text: string) { let h = 2166136261; for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

/** A small, friendly card for one country. */
function CountryCard({ country, name, capital, region, onOpen }: { country: Country; name: string; capital: string; region?: string; onOpen: () => void }) {
  return <button type="button" className="country-tile" onClick={onOpen}>
    <img src={country.flag} alt="" width={56} height={40} loading="lazy" decoding="async"/>
    <span><strong>{name}</strong><small>{capital}{region ? ' · ' + region : ''}</small></span>
    <ArrowUpRight size={17} aria-hidden="true"/>
  </button>;
}

export function ExplorePage() {
  const { t, locale, boot, start, busy } = useApp();
  const [data, setData] = useState<Country[] | null>(null), [error, setError] = useState(false), [reload, setReload] = useState(0);
  const [query, setQuery] = useState(''), [region, setRegion] = useState('World'), [selected, setSelected] = useState<Country | null>(null);
  const [recent, setRecent] = useState<string[]>([]), [showAll, setShowAll] = useState(false);
  useEffect(() => {
    let active = true;
    fetch('/data/countries.json', { signal: AbortSignal.timeout(10000) }).then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(v => { if (active) { setData(v); setError(false); } }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [reload]);
  // Read this browser's recently opened countries once mounted, so the server render stays stable.
  // A link such as /explore#north-america (from the passport) opens that region.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setRecent(readRecent()); const slug = window.location.hash.slice(1); const hit = Object.keys(REGION_ART).find(r => REGION_ART[r] === slug); if (hit) setRegion(hit); }, []);

  const name = (c: Country) => locale === 'es' ? spanishCountry(c.name) : locale === 'nl' ? c.nl : c.name;
  const capital = (c: Country) => c.capitals.map(n => locale === 'es' ? spanishCapital(n) : n).join(' / ');
  const byId = useMemo(() => new Map((data ?? []).map(c => [c.id, c])), [data]);
  const today = new Date().toISOString().slice(0, 10);
  const picks = useMemo(() => data ? [...data].sort((a, b) => hash(today + a.id) - hash(today + b.id)).slice(0, 3) : [], [data, today]);
  const filtering = showAll || query.trim() !== '' || region !== 'World';
  const reset = () => { setQuery(''); setRegion('World'); setShowAll(false); };
  const visible = (data ?? []).filter(c => (region === 'World' || c.region === region) && [c.name, c.nl, spanishCountry(c.name), ...c.capitals, ...c.capitals.map(spanishCapital)].join(' ').toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => name(a).localeCompare(name(b), locale));
  const stamps: { id: string }[] = boot.stats.stamps ?? [];
  const discovered = stamps.map(s => byId.get(s.id)).filter((c): c is Country => !!c).slice(-6).reverse();
  const continued = recent.map(id => byId.get(id)).filter((c): c is Country => !!c).slice(0, 4);

  const open = (c: Country) => {
    setSelected(c);
    const next = [c.id, ...readRecent().filter(id => id !== c.id)].slice(0, 8);
    try { localStorage.setItem(RECENT, JSON.stringify(next)); } catch { /* storage unavailable */ }
    setRecent(next);
  };
  const surprise = () => { if (data?.length) open(data[Math.floor(Math.random() * data.length)]); };
  const card = (c: Country, showRegion = false) => <CountryCard key={c.id} country={c} name={name(c)} capital={capital(c)} region={showRegion ? t(c.region) : undefined} onOpen={() => open(c)}/>;

  return <div className="page explore">
    <PageHeader art="explore-hero" kicker={t('exploreKicker')} title={t('exploreTitle2')} lead={t('exploreLead')}/>
    <div className="explore-bar" role="search">
      <label className="search-field"><Search size={19} aria-hidden="true"/><input type="search" aria-label={t('searchCountries')} placeholder={t('searchCountries')} value={query} onChange={e => setQuery(e.target.value)}/>{query && <button className="icon-btn" aria-label={t('exploreClear')} onClick={() => setQuery('')}><X size={18}/></button>}</label>
      <button className="btn secondary" onClick={surprise} disabled={!data}><Shuffle size={18} aria-hidden="true"/>{t('exploreSurprise')}</button>
    </div>
    <div className="chip-row" role="group" aria-label={t('region')}>{REGIONS.map(r => <button key={r} className="chip" aria-pressed={region === r && (r !== 'World' || showAll)} onClick={() => { setRegion(r); setShowAll(r === 'World'); }}>{r === 'World' ? t('allRegions') : t(r)}</button>)}</div>

    {error ? <ErrorState title={t('stateErrorTitle')} copy={t('stateErrorCopy')} onRetry={() => setReload(n => n + 1)} retryLabel={t('retry')}/>
      : !data ? <div className="country-grid-v2" aria-busy="true">{Array.from({ length: 9 }, (_, i) => <Skeleton key={i} className="sk-country"/>)}<span className="sr-only" role="status">{t('loading')}</span></div>
      : filtering ? <section className="page-section" aria-labelledby="explore-results">
          <SectionHeader id="explore-results" title={region === 'World' ? t('exploreAll') : t(region)} action={<span className="results-meta"><span className="muted">{t('exploreResults').replace('{n}', String(visible.length))}</span><button className="text-link" onClick={reset}>{t('exploreClear')}</button></span>}/>
          {visible.length ? <div className="country-grid-v2">{visible.map(c => card(c, region === 'World'))}</div>
            : <EmptyState icon={Search} title={t('exploreEmptyTitle')} copy={t('exploreEmptyCopy')}><button className="btn secondary" onClick={reset}>{t('exploreClear')}</button></EmptyState>}
        </section>
      : <>
        {continued.length > 0 && <section className="page-section" aria-labelledby="explore-continue"><SectionHeader id="explore-continue" title={t('exploreContinue')}/><div className="country-grid-v2">{continued.map(c => card(c, true))}</div></section>}
        <section className="page-section" aria-labelledby="explore-picks">
          <SectionHeader id="explore-picks" title={t('explorePicks')} kicker={new Date(today + 'T12:00:00Z').toLocaleDateString(locale, { day: 'numeric', month: 'long', timeZone: 'UTC' })}/>
          <div className="pick-row">{picks.map((c, i) => <button key={c.id} type="button" className={'pick-card' + (picks.slice(0, i).filter(p => p.region === c.region).length % 2 ? '' : ' is-mirrored')} onClick={() => open(c)}>
            <span className="pick-flag"><img className="pick-scene" src={'/art/pick-' + (REGION_ART[c.region] ?? 'europe') + '.webp'} alt="" width={815} height={406} loading="lazy" decoding="async"/><span className="pick-postcard"><img src={c.flag} alt="" width={120} height={84} loading="lazy"/></span></span>
            <span className="pick-copy"><small>{t(c.region)}</small><strong>{name(c)}</strong><span>{capital(c)}</span></span>
            <span className="round-go" aria-hidden="true"><ArrowRight size={17}/></span>
          </button>)}</div>
        </section>
        <section className="page-section" aria-labelledby="explore-regions">
          <SectionHeader id="explore-regions" title={t('exploreByRegion')} action={<button className="text-link" onClick={() => { setShowAll(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>{t('exploreAll')}<ArrowRight size={16} aria-hidden="true"/></button>}/>
          <div className="region-grid">{REGIONS.filter(r => r !== 'World').map(r => <button key={r} type="button" className="region-card scene-card" onClick={() => { setRegion(r); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
            <picture className="region-art"><source media="(min-width: 761px)" srcSet={'/art/banner-' + REGION_ART[r] + '.webp'} width={658} height={210}/><img src={'/art/scene-' + REGION_ART[r] + '.webp'} alt="" width={627} height={465} loading="lazy" decoding="async"/></picture>
            <span className="region-copy"><strong>{t(r)}</strong><small>{t('exploreResults').replace('{n}', String(data.filter(c => c.region === r).length))}</small></span>
            <span className="round-go" aria-hidden="true"><ArrowRight size={17}/></span>
          </button>)}</div>
        </section>
        <section className="page-section" aria-labelledby="explore-recent">
          <SectionHeader id="explore-recent" title={t('exploreRecent')}/>
          {discovered.length ? <div className="country-grid-v2">{discovered.map(c => card(c, true))}</div>
            : <div className="soft-note"><p>{t('exploreRecentEmpty')}</p><A href="/" className="text-link">{t('tripStart')}<ArrowRight size={16} aria-hidden="true"/></A></div>}
        </section>
      </>}
    <A href="/sources" className="text-link data-notice">{t('dataNotice')}<ArrowUpRight size={15} aria-hidden="true"/></A>

    <Dialog open={!!selected} onOpenChange={v => !v && setSelected(null)}>
      <DialogContent className="app-modal country-modal">{selected && <>
        <img src={selected.flag} alt="" className="country-detail-flag"/>
        <DialogTitle className="modal-title">{name(selected)}</DialogTitle>
        <DialogDescription>{selected.official}</DialogDescription>
        <dl className="country-facts">{[['capital', capital(selected)], ['region', t(selected.region)], ['area', formatScore(selected.area) + ' km²'], ['currency', selected.currencies.map(n => locale === 'es' ? spanishContent(n) : n).join(', ')], ['languages', selected.languages.map(n => locale === 'es' ? spanishContent(n) : n).join(', ')], ['landBorders', selected.borders.map(id => { const c = byId.get(id); return c ? name(c) : id; }).join(', ') || t('noBorder')]].map(([k, v]) => <div key={k}><dt>{t(k)}</dt><dd>{v}</dd></div>)}</dl>
        <button className="btn primary wide" disabled={busy} onClick={() => start({ ...DEFAULT_SETTINGS, mode: 'mixed', region: selected.region, count: 5 })}>{t('exploreDetailPlay')}<ArrowRight size={18} aria-hidden="true"/></button>
        <A href="/sources" className="text-link">{t('sources')}<ArrowUpRight size={15} aria-hidden="true"/></A>
      </>}</DialogContent>
    </Dialog>
  </div>;
}
