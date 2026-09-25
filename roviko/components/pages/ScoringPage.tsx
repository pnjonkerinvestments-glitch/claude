'use client';
import React from 'react';
import { ArrowRight, Crown, Flame, Infinity as InfinityIcon, RotateCcw, Sparkles, Users } from 'lucide-react';
import { DAY_MODES } from '@/lib/daily-loop';
import { DAILY_TOTAL_MAX } from '@/lib/daily-scoring';
import { useApp } from '../app/context';
import { A } from '../app/shared';
import { GameIcon } from '../atelier/GameIcon';
import { dailyTitleKey } from '../atelier/DailyLoop';
import { PageHeader } from '../ds/States';

const RULES: Record<string, string> = { rank: 'competitionRankRule', daily: 'competitionDaily', compare: 'competitionCompare', mosaic: 'competitionMosaic', trail: 'competitionTrail', duel: 'competitionDuel' };

/** Everything about points in one place, so the homepage never has to explain it. */
export function ScoringPage() {
  const { t, locale } = useApp();
  const n = (v: number) => v.toLocaleString(locale);
  const facts: [string, React.ReactNode, string, string, string][] = [
    ['points', <Sparkles key="i" size={26} strokeWidth={2}/>, n(1000), t('scoringPerGame'), 'fact-points'],
    ['day', <Crown key="i" size={26} strokeWidth={2}/>, n(DAILY_TOTAL_MAX), t('scoringPerDay'), 'fact-day'],
    ['once', <RotateCcw key="i" size={26} strokeWidth={2}/>, '1×', t('scoringOnce'), 'fact-once'],
    ['timer', <InfinityIcon key="i" size={28} strokeWidth={2.2}/>, '∞', t('scoringNoTimer'), 'fact-timer'],
  ];
  return <div className="page scoring-page">
    <PageHeader back={t('backLabel')} art="scoring-hero" kicker={t('scoringKicker')} title={t('scoringTitle')} lead={t('scoringLead')}/>
    <ul className="fact-cards">{facts.map(([key, icon, big, label, art]) => <li key={key} className={'fact-card fact-' + key}>
      <div className="fact-card-top"><span className="fact-icon" aria-hidden="true">{icon}</span><div><strong>{big}</strong><span>{label}</span></div></div>
      <img className="fact-art" src={'/art/' + art + '.webp'} alt="" aria-hidden="true" width={794} height={266} loading="lazy" decoding="async"/>
    </li>)}</ul>
    <section className="page-section" aria-labelledby="scoring-five">
      <header className="section-header"><div><h2 id="scoring-five">{t('scoringFiveTitle')}</h2><p className="muted">{t('scoringFiveLead')}</p></div></header>
      <div className="five-games">{DAY_MODES.map(m => <A key={m} href={'/how-to-play#' + m} className="five-game"><GameIcon mode={m} size="lg"/><span>{t(dailyTitleKey(m))}</span></A>)}</div>
      <div className="rule-grid">{DAY_MODES.map(m => <article key={m} className="rule-card">
        <GameIcon mode={m}/>
        <div><h3>{t(dailyTitleKey(m))}</h3><p>{t(RULES[m])}</p></div>
      </article>)}</div>
      <p className="muted small-print">{t('competitionGeneral')} {t('scoringTies')}</p>
    </section>
    <section className="page-section" aria-labelledby="scoring-more">
      <h2 id="scoring-more">{t('navMore')}</h2>
      <div className="rule-grid">
        <article className="rule-card" id="streaks"><span className="rule-icon" aria-hidden="true"><Flame size={22}/></span><div><h3>{t('scoringStreak')}</h3><p>{t('scoringStreakCopy')}</p></div></article>
        <article className="rule-card"><span className="rule-icon" aria-hidden="true"><Crown size={22}/></span><div><h3>{t('scoringQuests')}</h3><p>{t('scoringQuestsCopy')}</p></div></article>
        <article className="rule-card"><span className="rule-icon" aria-hidden="true"><Users size={22}/></span><div><h3>{t('scoringFriends')}</h3><p>{t('scoringFriendsCopy')}</p></div></article>
        <article className="rule-card"><span className="rule-icon" aria-hidden="true"><Sparkles size={22}/></span><div><h3>{t('scoringExtras')}</h3><p>{t('scoringExtrasCopy')}</p></div></article>
      </div>
    </section>
    <div className="page-cta"><A href="/" className="btn primary btn-lg">{t('tripStart')}<ArrowRight size={19} aria-hidden="true"/></A><A href="/how-to-play" className="text-link">{t('howToLink')}</A></div>
  </div>;
}
