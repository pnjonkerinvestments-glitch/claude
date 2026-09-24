'use client';
import React from 'react';
import { ArrowRight, Crown, Flame, Sparkles, Timer, Users, RotateCcw } from 'lucide-react';
import { DAILY_MODES } from '@/lib/daily-loop';
import { useApp } from '../app/context';
import { A } from '../app/shared';
import { GameIcon } from '../atelier/GameIcon';
import { dailyTitleKey } from '../atelier/DailyLoop';
import { PageHeader } from '../ds/States';

const RULES: Record<string, string> = { rank: 'competitionRankRule', daily: 'competitionDaily', compare: 'competitionCompare', mosaic: 'competitionMosaic', trail: 'competitionTrail' };

/** Everything about points in one place, so the homepage never has to explain it. */
export function ScoringPage() {
  const { t, locale } = useApp();
  const n = (v: number) => v.toLocaleString(locale);
  return <div className="page scoring-page">
    <PageHeader art="spot-country-mosaic" kicker={t('scoringKicker')} title={t('scoringTitle')} lead={t('scoringLead')}/>
    <ul className="fact-tiles">
      <li><Sparkles size={22} aria-hidden="true"/><strong>{n(1000)}</strong><span>{t('scoringPerGame')}</span></li>
      <li><Crown size={22} aria-hidden="true"/><strong>{n(5000)}</strong><span>{t('scoringPerDay')}</span></li>
      <li><RotateCcw size={22} aria-hidden="true"/><strong>1×</strong><span>{t('scoringOnce')}</span></li>
      <li><Timer size={22} aria-hidden="true"/><strong>∞</strong><span>{t('scoringNoTimer')}</span></li>
    </ul>
    <div className="points-bar" aria-hidden="true">{DAILY_MODES.map(m => <span key={m} className={'points-seg seg-' + m}><GameIcon mode={m} size="sm"/>{n(1000)}</span>)}</div>
    <section className="page-section" aria-labelledby="scoring-games">
      <h2 id="scoring-games">{t('allGamesDaily')}</h2>
      <div className="rule-grid">{DAILY_MODES.map(m => <article key={m} className="rule-card">
        <GameIcon mode={m}/>
        <div><h3>{t(dailyTitleKey(m))}</h3><p>{t(RULES[m])}</p></div>
      </article>)}</div>
      <p className="muted small-print">{t('competitionGeneral')} {t('scoringTies')}</p>
    </section>
    <section className="page-section" aria-labelledby="scoring-more">
      <h2 id="scoring-more">{t('navMore')}</h2>
      <div className="rule-grid">
        <article className="rule-card"><span className="rule-icon" aria-hidden="true"><Flame size={22}/></span><div><h3>{t('scoringStreak')}</h3><p>{t('scoringStreakCopy')}</p></div></article>
        <article className="rule-card"><span className="rule-icon" aria-hidden="true"><Crown size={22}/></span><div><h3>{t('scoringQuests')}</h3><p>{t('scoringQuestsCopy')}</p></div></article>
        <article className="rule-card"><span className="rule-icon" aria-hidden="true"><Users size={22}/></span><div><h3>{t('scoringFriends')}</h3><p>{t('scoringFriendsCopy')}</p></div></article>
        <article className="rule-card"><span className="rule-icon" aria-hidden="true"><Sparkles size={22}/></span><div><h3>{t('scoringExtras')}</h3><p>{t('scoringExtrasCopy')}</p></div></article>
      </div>
    </section>
    <div className="page-cta"><A href="/" className="btn primary btn-lg">{t('tripStart')}<ArrowRight size={19} aria-hidden="true"/></A><A href="/how-to-play" className="text-link">{t('howToLink')}</A></div>
  </div>;
}
