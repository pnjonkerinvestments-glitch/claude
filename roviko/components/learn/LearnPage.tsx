'use client';
import React from 'react';
import { ArrowRight, Check, LockKeyhole } from 'lucide-react';
import { BOSS_PASS, BOSS_SIZE, ROUTES, itemKey, localDay, routeState, type Lesson } from '@/lib/learn';
import { continentArt } from '@/lib/continent-week';
import { plural } from '@/lib/plural';
import { useApp } from '../app/context';
import { A } from '../app/shared';
import { ErrorState, PageHeader } from '../ds/States';
import { useCountries, useLearn, type LearnCountry } from './useLearn';

/** A medal: a small round ribbon seal in bronze, silver or gold (drawn, so it stays crisp at every size). */
export function Medal({ tier, size = 22 }: { tier: 1 | 2 | 3; size?: number }) {
  return <svg className={'learn-medal is-' + ['', 'bronze', 'silver', 'gold'][tier]} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path className="lm-ribbon" d="M8 13l-2.6 8.2 3.6-1.6 2.2 3 1.3-7.8zM16 13l2.6 8.2-3.6-1.6-2.2 3-1.3-7.8z"/>
    <circle className="lm-disc" cx="12" cy="9.5" r="7.2"/>
    <circle className="lm-ring" cx="12" cy="9.5" r="5" fill="none" strokeWidth="1.3"/>
    <path className="lm-star" d="M12 6.3l1 2.1 2.3.3-1.7 1.6.4 2.3-2-1.1-2 1.1.4-2.3-1.7-1.6 2.3-.3z"/>
  </svg>;
}

/** Three flags of a lesson, fanned like cards. */
function FlagFan({ ids, byId, dim = false }: { ids: string[]; byId: Map<string, LearnCountry>; dim?: boolean }) {
  const show = ids.slice(0, 3);
  return <span className={'learn-fan' + (dim ? ' is-dim' : '')} aria-hidden="true">
    {show.map((id, i) => { const c = byId.get(id); return c ? <img key={id} src={c.flag} alt="" width={60} height={40} decoding="async" style={{ ['--i' as any]: i - (show.length - 1) / 2 }}/> : null; })}
  </span>;
}

/**
 * Learn (1.38): the route of one topic and continent. Lessons in a winding path (done, next, locked), the review
 * pile on top and the border check at the end. Starts with the flags of Europe; more routes follow.
 */
export function LearnPage() {
  const { t, go, boot, setModal } = useApp();
  const { progress, ready, guest } = useLearn();
  const { byId, loaded, error, retry } = useCountries();
  const route = ROUTES[0];
  const today = localDay();
  const s = routeState(route, progress, today);
  if (error) return <div className="trip-page learn-page"><ErrorState title={t('learnLoadError')} copy="" onRetry={retry} retryLabel={t('retry')}/></div>;
  const lessonName = (l: Lesson) => t('learnL_' + l.key);
  const learnedIn = (l: Lesson) => l.countries.filter(id => (progress[itemKey(route.topic, id)]?.lvl ?? 0) >= 1).length;
  const passed = !!s.boss?.day;
  return <div className="trip-page learn-page">
    <PageHeader kicker={t('learnKicker')} title={t('learnTitle')} lead={t('learnLead')} art="howto-hero"/>

    <section className="learn-summary t-card" aria-label={t('learnLearned').replace('{n}', String(s.learned)).replace('{total}', String(s.total))}>
      <div className="ls-top">
        <p className="ls-count"><b>{s.learned}</b><span>/ {s.total}</span></p>
        <p className="ls-label">{t('learnLearnedLabel')}</p>
      </div>
      <span className="ls-bar" aria-hidden="true">
        <i className="is-gold" style={{ width: s.medals.gold / s.total * 100 + '%' }}/>
        <i className="is-silver" style={{ width: s.medals.silver / s.total * 100 + '%' }}/>
        <i className="is-bronze" style={{ width: s.medals.bronze / s.total * 100 + '%' }}/>
      </span>
      <ul className="ls-medals">
        <li><Medal tier={1}/><b>{s.medals.bronze}</b><span>{t('learnBronze')}</span></li>
        <li><Medal tier={2}/><b>{s.medals.silver}</b><span>{t('learnSilver')}</span></li>
        <li><Medal tier={3}/><b>{s.medals.gold}</b><span>{t('learnGold')}</span></li>
      </ul>
      <p className="ls-help">{t('learnMedalHelp')}</p>
    </section>

    {ready && s.due.length > 0 && <section className="learn-review t-card" aria-labelledby="learn-review-title">
      <FlagFan ids={s.due} byId={byId}/>
      <div className="lr-copy"><h2 id="learn-review-title">{t('learnReviewTitle')}</h2><p>{plural(t, 'learnReviewCopy', s.due.length)}</p></div>
      <button className="btn primary btn-lg" onClick={() => go('/learn/review')}>{t('learnReviewGo')}<ArrowRight size={19} aria-hidden="true"/></button>
    </section>}
    {ready && s.due.length === 0 && s.learned > 0 && <p className="learn-quiet"><Check size={16} aria-hidden="true"/>{t('learnReviewNone')}</p>}

    <ol className="learn-path" aria-label={t('learnTitle')}>
      {route.lessons.map((l, i) => {
        const done = s.done[i], next = i === s.next, locked = i > s.next, n = learnedIn(l);
        const label = t('learnLesson').replace('{n}', String(i + 1)) + ' · ' + lessonName(l);
        return <li key={l.id} className={'lp-stop' + (done ? ' is-done' : '') + (next ? ' is-next' : '') + (locked ? ' is-locked' : '')}>
          <button type="button" className="lp-node" disabled={locked || !loaded} onClick={() => go('/learn/' + l.id)}
            aria-label={label + ' · ' + (locked ? t('learnLockedNote') : n + '/' + l.countries.length)}>
            <FlagFan ids={l.countries} byId={byId} dim={locked}/>
            {done && <span className="lp-tick" aria-hidden="true"><Check size={14} strokeWidth={3.4}/></span>}
            {locked && <span className="lp-lock" aria-hidden="true"><LockKeyhole size={14} strokeWidth={2.6}/></span>}
          </button>
          <span className="lp-text" aria-hidden="true">
            <small>{t('learnLesson').replace('{n}', String(i + 1))}</small>
            <strong>{lessonName(l)}</strong>
            <em>{next ? <span className="t-pill lp-go">{t('learnStart')}<ArrowRight size={15}/></span> : done ? n + '/' + l.countries.length : ''}</em>
          </span>
        </li>;
      })}
      <li className={'lp-stop lp-boss' + (passed ? ' is-done' : '') + (s.bossOpen && !passed ? ' is-next' : '') + (!s.bossOpen ? ' is-locked' : '')}>
        <button type="button" className="lp-node lp-stamp" disabled={!s.bossOpen || !loaded} onClick={() => go('/learn/boss-' + route.id)} aria-label={t('learnBoss') + ' · ' + (passed ? t('learnBossPassed') : s.bossOpen ? t('learnBossGo') : t('learnBossLocked'))}>
          <img src={continentArt(route.region)} alt="" width={720} height={300} decoding="async" loading="lazy"/>
          {passed && <span className="lp-tick" aria-hidden="true"><Check size={14} strokeWidth={3.4}/></span>}
          {!s.bossOpen && <span className="lp-lock" aria-hidden="true"><LockKeyhole size={14} strokeWidth={2.6}/></span>}
        </button>
        <span className="lp-text" aria-hidden="true">
          <small>{t('learnBoss')}</small>
          <strong>{passed ? t('learnBossPassed') : t('learnBossStamp')}</strong>
          <em>{s.bossOpen ? <span className="t-pill lp-go is-gold">{passed ? t('learnAgain') : t('learnStart')}<ArrowRight size={15}/></span> : t('learnBossLocked')}</em>
        </span>
      </li>
    </ol>
    <p className="learn-boss-copy">{t('learnBossCopy').replace('{n}', String(BOSS_SIZE)).replace('{need}', String(BOSS_PASS))}</p>

    <p className="learn-soon">{t('learnSoon')}</p>
    {guest && boot?.user && <p className="learn-guest"><span>{t('learnGuestNote')}</span><button className="text-link" onClick={() => setModal('signup')}>{t('signUp')}</button></p>}
    <p className="learn-back"><A href="/" className="text-link">{t('backHome')}</A></p>
  </div>;
}
