'use client';
import React, { useEffect, useState } from 'react';
import { ArrowRight, Trophy } from 'lucide-react';
import { api, formatScore } from '@/lib/client';
import { useApp } from '../app/context';
import { A, Avatar, Choice } from '../app/shared';
import { EmptyState, ErrorState, PageHeader, SectionHeader, Skeleton } from '../ds/States';
import { useCompetition } from '../home/useDay';

type Leader = { name: string; avatar: number; score: number; place: number; me: number | boolean };
type Entry = { id: string; name: string; avatar: number; score: number };

/** Place with a quiet medal for the top three; the number is always there too, never colour alone. */
function Place({ place }: { place: number }) {
  return <span className={'place' + (place <= 3 ? ' place-medal medal-' + place : '')}>{place}</span>;
}

function DailyRankings() {
  const { t, locale, boot } = useApp();
  const [tab, setTab] = useState<'today' | 'total'>('today');
  const { data, error, retry } = useCompetition(boot);
  const n = (v: number) => v.toLocaleString(locale);
  const standing = data?.[tab];
  return <section className="page-section" aria-labelledby="daily-rankings">
    <div className="rank-head">
      <h2 id="daily-rankings" className="sr-only">{t('rankingsKicker')}</h2>
      <div className="segmented rank-tabs" role="tablist" aria-label={t('rankingsKicker')}>
        {(['today', 'total'] as const).map(k => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{t(k === 'today' ? 'rankingsToday' : 'rankingsAllTime')}</button>)}
      </div>
      {standing && <span className="muted">{t('rankingsPlayers').replace('{n}', n(standing.participants))}</span>}
    </div>
    {error ? <ErrorState title={t('stateErrorTitle')} copy={t('stateErrorCopy')} onRetry={retry} retryLabel={t('retry')}/>
      : !standing ? <div className="rank-skeleton" aria-busy="true"><Skeleton className="sk-block sk-you"/>{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="sk-block sk-list-row"/>)}<span className="sr-only" role="status">{t('loading')}</span></div>
      : <>
        <div className={'you-card' + (standing.place ? '' : ' is-unranked')}>
          <Avatar id={boot.user.avatar}/>
          <div><small>{t('rankingsYou')}</small><strong>{standing.place ? '#' + n(standing.place) : '—'}</strong>{!standing.place && <p>{t('rankingsNotRanked')}</p>}</div>
          <div className="you-score"><strong>{n(standing.score)}</strong><small>{t('points')}{tab === 'today' ? ' / ' + n(5000) : ''}</small></div>
          {!standing.place && <A href="/" className="btn primary">{t('tripStart')}<ArrowRight size={18} aria-hidden="true"/></A>}
        </div>
        {standing.leaders.length ? <ol className="leader-list" aria-label={t('rankingsTop')}>
          {standing.leaders.map((p: Leader, i: number) => <li key={i} className={p.me ? 'is-you' : ''}>
            <Place place={p.place}/><Avatar id={p.avatar}/><span className="leader-name">{p.me ? t('competitionYou') : p.name}</span><strong>{n(p.score)}</strong>
          </li>)}
        </ol> : <EmptyState icon={Trophy} title={t('rankingsEmptyTitle')} copy={t('rankingsEmptyCopy')}><A href="/" className="btn primary">{t('tripStart')}</A></EmptyState>}
        <p className="muted small-print">{t('scoringTies')} <A href="/scoring" className="text-link">{t('scoringLink')}</A></p>
      </>}
  </section>;
}

function FriendsRankings() {
  const { t, boot } = useApp();
  const [period, setPeriod] = useState('weekly'), [category, setCategory] = useState('wins');
  const [entries, setEntries] = useState<Entry[] | null>(null), [error, setError] = useState(false), [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    api(`/leaderboard?period=${period}&category=${category}`).then(r => { if (active) { setEntries(r.entries); setError(false); } }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [period, category, retry]);
  const loading = entries === null && !error;
  return <section className="page-section" aria-labelledby="friends-rankings">
    <SectionHeader id="friends-rankings" title={t('rankingsMultiplayer')}/>
    <p className="muted section-lead">{t('rankingsMultiplayerLead')}</p>
    <div className="rank-filters">
      <div className="segmented" role="group" aria-label={t('rankingsMultiplayer')}>{[['daily', 'dailyPeriod'], ['weekly', 'weekly'], ['all', 'allTime']].map(([v, k]) => <button key={v} aria-pressed={period === v} onClick={() => { setEntries(null); setPeriod(v); }}>{t(k)}</button>)}</div>
      <Choice label={t('score')} value={category} onChange={v => { setEntries(null); setCategory(v); }} options={['wins', 'score', 'xp'].map(v => ({ value: v, label: t(v === 'score' ? 'totalScore' : v) }))}/>
    </div>
    {error ? <ErrorState title={t('stateErrorTitle')} copy={t('stateErrorCopy')} onRetry={() => { setError(false); setEntries(null); setRetry(n => n + 1); }} retryLabel={t('retry')}/>
      : loading ? <div className="rank-skeleton" aria-busy="true">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="sk-block sk-list-row"/>)}</div>
      : entries!.length ? <ol className="leader-list">{entries!.map((p, i) => <li key={p.id} className={p.id === boot.user.id ? 'is-you' : ''}><Place place={i + 1}/><Avatar id={p.avatar}/><span className="leader-name">{p.name}{p.id === boot.user.id && <small> · {t('you')}</small>}</span><strong>{formatScore(p.score)}</strong></li>)}</ol>
      : <EmptyState icon={Trophy} title={t('noResults')} copy={t('noResultsCopy')}><A href="/multiplayer" className="btn secondary">{t('togetherTitle')}</A></EmptyState>}
  </section>;
}

export function RankingsPage() {
  const { t } = useApp();
  return <div className="page rankings">
    <PageHeader art="spot-rank-radar" kicker={t('rankingsKicker')} title={t('rankingsTitle')} lead={t('rankingsLead')}/>
    <DailyRankings/>
    <FriendsRankings/>
  </div>;
}
