'use client';
import React from 'react';
import { ArrowRight, Check, LockKeyhole } from 'lucide-react';
import { BOSS_SIZE, CONTINENTS, TOPICS, itemKey, localDay, passMark, routeCountries, routeFor, routeState, type Route, type Step } from '@/lib/learn';
import { continentArt } from '@/lib/continent-week';
import { plural } from '@/lib/plural';
import { useApp } from '../app/context';
import { A } from '../app/shared';
import { GameIcon } from '../atelier/GameIcon';
import { ErrorState, PageHeader } from '../ds/States';
import { useCountries, useLearn, useLearnPick, type LearnCountry } from './useLearn';

const GAME_MODE: Record<string, string> = { flags: 'flags', capitals: 'capitals', map: 'pinpoint' };

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

/** Route title: "Flags of Africa", "Capitals of Asia", "Map of Oceania". */
export function routeTitle(t: (k: string) => string, route: Route) { return t('learnTitle_' + route.topic).replace('{continent}', t(route.region)); }

/**
 * Learn (1.38): choose a topic (flags, capitals, the map) and a continent; then the route of that pair. Lessons in
 * a winding path, a midway test after every three lessons, the review pile on top and the border check at the end.
 */
export function LearnPage() {
  const { t, go, boot, setModal } = useApp();
  const { progress, ready, guest } = useLearn();
  const { byId, loaded, error, retry } = useCountries();
  const [pick, setPick] = useLearnPick();
  const route = routeFor(pick.topic, pick.continent);
  const today = localDay();
  const s = routeState(route, progress, today);
  if (error) return <div className="trip-page learn-page"><ErrorState title={t('learnLoadError')} copy="" onRetry={retry} retryLabel={t('retry')}/></div>;
  const unit = t('learnUnit_' + route.topic);
  const learnedIn = (ids: string[]) => ids.filter(id => (progress[itemKey(route.topic, id)]?.lvl ?? 0) >= 1).length;
  const passed = !!s.boss?.day;
  const bossSize = Math.min(BOSS_SIZE, routeCountries(route).length);
  const stopText = (step: Step) => step.kind === 'lesson'
    ? { small: t('learnLesson').replace('{n}', String(step.n)), strong: t('learnL_' + step.key) }
    : { small: t('learnExam').replace('{n}', String(step.n)), strong: t('learnExamCovers').replace('{from}', String(step.from)).replace('{to}', String(step.to)) };
  return <div className="trip-page learn-page">
    <PageHeader kicker={t('learnKicker')} title={routeTitle(t, route)} lead={t('learnLead')} art="howto-hero"/>

    <section className="learn-pick t-card" aria-label={t('learnPickTitle')}>
      <div className="lpk-topics" role="radiogroup" aria-label={t('learnPickTopic')}>
        {TOPICS.map(topic => { const st = routeState(routeFor(topic, pick.continent), progress, today); return <button key={topic} type="button" role="radio" aria-checked={pick.topic === topic} className="lpk-topic" onClick={() => setPick({ ...pick, topic })}>
          <GameIcon mode={GAME_MODE[topic]} size="sm"/><span><strong>{t('learnTopic_' + topic)}</strong><small>{st.learned}/{st.total}</small></span>
          {ready && st.due.length > 0 && <b className="lpk-due" aria-label={t('learnHomeDue').replace('{n}', String(st.due.length))}>{st.due.length}</b>}
        </button>; })}
      </div>
      <div className="lpk-continents" role="radiogroup" aria-label={t('learnPickContinent')}>
        {CONTINENTS.map(c => { const st = routeState(routeFor(pick.topic, c.id), progress, today); return <button key={c.id} type="button" role="radio" aria-checked={pick.continent === c.id} className="lpk-continent" onClick={() => setPick({ ...pick, continent: c.id })}>
          <img src={continentArt(c.region)} alt="" width={720} height={300} loading="lazy" decoding="async"/>
          <span><strong>{t(c.region)}</strong><small>{st.boss?.day ? <Check size={13} strokeWidth={3}/> : null}{st.learned}/{st.total}</small></span>
          {ready && st.due.length > 0 && <b className="lpk-due" aria-label={t('learnHomeDue').replace('{n}', String(st.due.length))}>{st.due.length}</b>}
        </button>; })}
      </div>
    </section>

    <section className="learn-summary t-card" aria-label={t('learnLearned').replace('{n}', String(s.learned)).replace('{total}', String(s.total)).replace('{unit}', unit)}>
      <div className="ls-top">
        <p className="ls-count"><b>{s.learned}</b><span>/ {s.total}</span></p>
        <p className="ls-label">{t('learnLearnedLabel').replace('{unit}', unit)}</p>
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
      <div className="lr-copy"><h2 id="learn-review-title">{t('learnReviewTitle')}</h2><p>{plural(t, 'learnReviewCopy', s.due.length).replace('{unit}', unit).replace('{unit1}', t('learnUnit1_' + route.topic))}</p></div>
      <button className="btn primary btn-lg" onClick={() => go('/learn/review-' + route.id)}>{t('learnReviewGo')}<ArrowRight size={19} aria-hidden="true"/></button>
    </section>}
    {ready && s.due.length === 0 && s.learned > 0 && <p className="learn-quiet"><Check size={16} aria-hidden="true"/>{t('learnReviewNone')}</p>}

    <ol className="learn-path" aria-label={routeTitle(t, route)} key={route.id}>
      {route.steps.map((step, i) => {
        const done = s.done[i], next = i === s.next, locked = i > s.next, text = stopText(step), exam = step.kind === 'exam';
        const card = progress['lesson:' + step.id];
        const sub = exam ? (done ? t('learnExamDone') : card?.best !== undefined ? t('learnBest').replace('{n}', String(card.best)).replace('{total}', String(card.of ?? 0)) : '') : done ? learnedIn(step.countries) + '/' + step.countries.length : '';
        return <li key={step.id} className={'lp-stop' + (exam ? ' lp-exam' : '') + (done ? ' is-done' : '') + (next ? ' is-next' : '') + (locked ? ' is-locked' : '')}>
          <button type="button" className="lp-node" disabled={locked || !loaded} onClick={() => go('/learn/' + step.id)}
            aria-label={text.small + ' · ' + text.strong + (locked ? ' · ' + t('learnLockedNote') : sub ? ' · ' + sub : '')}>
            {exam ? <span className="lp-exam-mark" aria-hidden="true"><GameIcon mode={GAME_MODE[route.topic]}/></span> : <FlagFan ids={step.countries} byId={byId} dim={locked}/>}
            {done && <span className="lp-tick" aria-hidden="true"><Check size={14} strokeWidth={3.4}/></span>}
            {locked && <span className="lp-lock" aria-hidden="true"><LockKeyhole size={14} strokeWidth={2.6}/></span>}
          </button>
          <span className={'lp-text' + (locked || !loaded ? '' : ' is-tappable')} aria-hidden="true" onClick={locked || !loaded ? undefined : () => go('/learn/' + step.id)}>
            <small>{text.small}</small>
            <strong>{text.strong}</strong>
            <em>{next ? <span className={'t-pill lp-go' + (exam ? ' is-gold' : '')}>{t('learnStart')}<ArrowRight size={15}/></span> : sub}</em>
          </span>
        </li>;
      })}
      <li className={'lp-stop lp-boss' + (passed ? ' is-done' : '') + (s.bossOpen && !passed ? ' is-next' : '') + (!s.bossOpen ? ' is-locked' : '')}>
        <button type="button" className="lp-node lp-stamp" disabled={!s.bossOpen || !loaded} onClick={() => go('/learn/boss-' + route.id)} aria-label={t('learnBoss') + ' · ' + (passed ? t('learnBossPassed') : s.bossOpen ? t('learnBossGo') : t('learnBossLocked'))}>
          <img src={continentArt(route.region)} alt="" width={720} height={300} decoding="async" loading="lazy"/>
          {passed && <span className="lp-tick" aria-hidden="true"><Check size={14} strokeWidth={3.4}/></span>}
          {!s.bossOpen && <span className="lp-lock" aria-hidden="true"><LockKeyhole size={14} strokeWidth={2.6}/></span>}
        </button>
        <span className={'lp-text' + (s.bossOpen && loaded ? ' is-tappable' : '')} aria-hidden="true" onClick={s.bossOpen && loaded ? () => go('/learn/boss-' + route.id) : undefined}>
          <small>{t('learnBoss')}</small>
          <strong>{t('learnBossStamp').replace('{continent}', t(route.region))}</strong>
          <em>{s.bossOpen ? <span className="t-pill lp-go is-gold">{passed ? t('learnAgain') : t('learnStart')}<ArrowRight size={15}/></span> : t('learnBossLocked')}</em>
        </span>
      </li>
    </ol>
    <p className="learn-boss-copy">{t('learnBossCopy').replace('{n}', String(bossSize)).replace('{need}', String(passMark(bossSize))).replace('{continent}', t(route.region))}</p>

    {guest && boot?.user && <p className="learn-guest"><span>{t('learnGuestNote')}</span><button className="text-link" onClick={() => setModal('signup')}>{t('signUp')}</button></p>}
    <p className="learn-back"><A href="/" className="text-link">{t('backHome')}</A></p>
  </div>;
}
