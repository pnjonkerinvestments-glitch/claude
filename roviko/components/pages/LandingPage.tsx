'use client';
import React from 'react';
import { ArrowRight } from 'lucide-react';
import data from '@/lib/data/countries.json';
import { DEFAULT_SETTINGS } from '@/lib/config';
import { LANDINGS, landingFor, landingPath, type Landing, type Lang } from '@/lib/landing';
import { landingCopy, landingLabel, regionName } from '@/lib/landing-copy';
import { spanishCapital, spanishCountry } from '../../i18n/content';
import { dutchCapital } from '../../i18n/capitals-nl';
import { useApp } from '../app/context';
import { A } from '../app/shared';
import { Peek } from '../ds/Character';
import { GameIcon } from '../atelier/GameIcon';

type Country = { id: string; name: string; nl: string; capitals: string[]; region: string; flag: string };
const COUNTRIES = data as Country[];
const CONTINENTS = ['Europe', 'Africa', 'Asia', 'North America', 'South America', 'Oceania'] as const;
const nameOf = (c: Country, lang: Lang) => lang === 'nl' ? c.nl : lang === 'es' ? spanishCountry(c.name) : c.name;
const capitalOf = (c: Country, lang: Lang) => c.capitals.map(x => lang === 'nl' ? dutchCapital(x) : lang === 'es' ? spanishCapital(x) : x).join(', ');
const FLAG_ALT: Record<Lang, string> = { en: 'Flag of {name}', nl: 'Vlag van {name}', es: 'Bandera de {name}' };
export const countriesOf = (region: string) => COUNTRIES.filter(c => region === 'World' || c.region === region);

/**
 * 1.61: a landing page people can find in a search engine (lib/landing.ts): what the quiz is and one button to play,
 * how it works, every country of that part of the world (flags, or countries with their capitals), a few questions
 * with answers, and links to the other quizzes. In the language of the address (/nl, /es) or of the player.
 */
export function LandingPage({ landing }: { landing: Landing }) {
  const { t, start, busy, locale } = useApp(), lang = locale as Lang;
  const list = countriesOf(landing.region).slice().sort((a, b) => nameOf(a, lang).localeCompare(nameOf(b, lang), lang));
  const copy = landingCopy(landing, lang, list.length);
  const groups = landing.region === 'World' ? CONTINENTS.map(r => ({ region: r as string, items: list.filter(c => c.region === r) })) : [{ region: landing.region as string, items: list }];
  const others = [...LANDINGS.filter(l => l.region === landing.region && l.mode !== landing.mode), ...LANDINGS.filter(l => l.mode === landing.mode && l.region !== landing.region)];
  const faqLd = { '@context': 'https://schema.org', '@type': 'FAQPage', inLanguage: lang, mainEntity: copy.faq.map(x => ({ '@type': 'Question', name: x.q, acceptedAnswer: { '@type': 'Answer', text: x.a } })) };
  return <div className="page seo-page trip-page landing-page">
    <section className="seo-card t-card" aria-labelledby="seo-title">
      <Peek mood="happy"/><GameIcon mode={landing.mode} size="lg"/>
      <p className="t-kicker is-caps">{t('pgSeoKicker')}</p>
      <h1 id="seo-title" className="t-title">{copy.h1}</h1>
      <p>{copy.intro}</p>
      <button className="btn primary btn-lg" disabled={busy} onClick={() => start({ ...DEFAULT_SETTINGS, mode: landing.mode, region: landing.region })}>{copy.play}<ArrowRight size={18} aria-hidden="true"/></button>
      <A href="/daily" className="text-link seo-more">{t('viewAllGames')}</A>
    </section>
    <section className="lp-block t-card" aria-labelledby="lp-how">
      <h2 id="lp-how">{copy.howTitle}</h2>
      <ol className="lp-steps">{copy.how.map(x => <li key={x}>{x}</li>)}</ol>
    </section>
    <section className="lp-block t-card" aria-labelledby="lp-list">
      <h2 id="lp-list">{copy.listTitle}</h2>
      {groups.map(g => <div key={g.region} className="lp-group">
        {landing.region === 'World' && <h3><A href={landingPath(landingFor(landing.mode, g.region as any), lang)}>{regionName(lang, g.region as any)} ({g.items.length})</A></h3>}
        <ul className={'lp-countries' + (landing.mode === 'capitals' ? ' with-capitals' : '')}>{g.items.map(c => <li key={c.id}>
          <img src={c.flag} alt={FLAG_ALT[lang].replace('{name}', nameOf(c, lang))} width={32} height={24} loading="lazy" decoding="async"/>
          <span>{nameOf(c, lang)}{landing.mode === 'capitals' && <small>{capitalOf(c, lang)}</small>}</span>
        </li>)}</ul>
      </div>)}
    </section>
    <section className="lp-block t-card" aria-labelledby="lp-faq">
      <h2 id="lp-faq">{copy.faqTitle}</h2>
      <dl className="lp-faq">{copy.faq.map(x => <div key={x.q}><dt>{x.q}</dt><dd>{x.a}</dd></div>)}</dl>
    </section>
    <nav className="lp-block t-card" aria-labelledby="lp-more">
      <h2 id="lp-more">{copy.moreTitle}</h2>
      <ul className="lp-links">{others.map(l => <li key={l.id}><A href={landingPath(l, lang)}>{landingLabel(l, lang)}</A></li>)}</ul>
    </nav>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd).replace(/</g, '\\u003c') }}/>
  </div>;
}
