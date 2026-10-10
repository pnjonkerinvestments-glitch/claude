'use client';
import { ProfileEditDialog } from './AccountPage';
import React, { useState, useSyncExternalStore } from 'react';
import { ArrowRight, Check, LockKeyhole, Settings2 } from 'lucide-react';
import { RovikoIcon, type RovikoIconName } from '../ds/RovikoIcons';
import { plural } from '@/lib/plural';
import { Progress } from '@/components/ui/progress';
import { ACHIEVEMENTS } from '@/lib/achievements';
import { DEFAULT_SETTINGS } from '@/lib/config';
import { post, formatScore } from '@/lib/client';
import type { Locale } from '@/i18n/messages';
import { useApp } from '../app/context';
import { A, Avatar, ModeEmoji } from '../app/shared';
import { PassportCollection } from '../atelier/PassportCollection';
import { GameIcon } from '../atelier/GameIcon';
import { PageHeader, SectionHeader } from '../ds/States';

type Review = { key: string; country_id: string; mode: string; content: { country?: { flag?: string; name?: Record<string, string> }; countries?: { id: string; name: Record<string, string> }[]; answerLabel?: Record<string, string>; fact?: Record<string, string>; topic?: { label: Record<string, string>; explanation: Record<string, string> } } };
type Recent = { id: string; mode: string; created_at: number; multiplayer: number | boolean; score: number; correct: number; total: number };

const crownsSnapshot = () => { try { const v = JSON.parse(localStorage.getItem('roviko:crowns') ?? '[]'); return Array.isArray(v) ? v.length : 0; } catch { return 0; } };
const subscribeCrowns = (cb: () => void) => { window.addEventListener('roviko:progress', cb); window.addEventListener('storage', cb); return () => { window.removeEventListener('roviko:progress', cb); window.removeEventListener('storage', cb); }; };
/** Every achievement has its own Roviko-style icon (a collection should look like one); achievements for one game show that game's own logo. */
const BADGE_ICON: Record<string, RovikoIconName> = {
  first: 'footprints', games10: 'map', games50: 'explore', games100: 'plane', games500: 'earth',
  correct10: 'bulb', correct100: 'brain', correct1000: 'graduation', xp500: 'sparkles', xp2500: 'star', xp10000: 'rocket', xp50000: 'crown',
  streak5: 'zap', streak10: 'target', streak20: 'medal', daily1: 'sunrise', daily7: 'calendar', daily30: 'flame',
  win1: 'trophy', win10: 'award', win100: 'gem', multi1: 'friends', multi25: 'party', perfect1: 'checkCircle', perfect10: 'badgeCheck',
};
const GAME_METRICS = ['flags', 'capitals', 'pinpoint', 'borders', 'order'];

/** One number in the travel log. */
function PassportStat({ value, label, icon }: { value: React.ReactNode; label: string; icon?: RovikoIconName }) {
  return <div className="passport-stat">{icon && <RovikoIcon name={icon} size={26} className="passport-stat-icon"/>}<strong>{value}</strong><span>{label}</span></div>;
}

/** The Roviko Passport: who you are, where you have been, what you collected. Guests see a preview and can save it, never forced. */
export function PassportPage() {
  const { t, boot, setModal, fail, go, start, locale } = useApp();
  const s = boot.stats, u = boot.user;
  const crowns = useSyncExternalStore(subscribeCrowns, crownsSnapshot, () => 0);
  const [edit, setEdit] = useState(false);
  const levelName = t(s.level >= 100 ? 'master' : s.level >= 50 ? 'cartographer' : s.level >= 25 ? 'navigator' : s.level >= 10 ? 'explorerLevel' : 'beginner');
  const openEdit = () => setEdit(true);
  const reviews: Review[] = s.reviews ?? [];
  const recent: Recent[] = s.recent ?? [];
  const L = locale as Locale;
  /** What an achievement still asks for, e.g. "10 games played" or "10 games of Flag Signal". */
  const goal = (metric: string, n: number) => GAME_METRICS.includes(metric)
    ? plural(t, 'pgGoal_mode', n, '{n}', n.toLocaleString(locale)).replace('{game}', t(metric))
    : plural(t, 'pgGoal_' + metric, n, '{n}', n.toLocaleString(locale));

  return <div className="page passport trip-page">
    <PageHeader art="spot-world-trip" kicker={t('passportKicker')} title={t('passportTitle')} lead={t('passportSub')}/>

    <section className={'passport-cover' + (u.guest ? ' is-guest' : '')} aria-label={t('navPassport')}>
      <div className="passport-cover-id">
        <Avatar id={u.avatar} size="large"/>
        <div>
          {u.guest && <span className="passport-preview">{t('passportPreview')}</span>}
          <h2>{u.name}</h2>
          <p>{t('passportLevel').replace('{n}', String(s.level))} · {levelName}</p>
          <Progress value={s.levelProgress} className="passport-xp" aria-label={t('level') + ' ' + s.level}/>
          {/* 1.36: the level grows from daily games and practice too; say how close the next one is. */}
          {s.xpToNext > 0 && <small className="passport-next">{t('xpToNext').replace('{n}', Number(s.xpToNext).toLocaleString()).replace('{level}', String(s.level + 1))}</small>}
        </div>
        {!u.guest && <button className="btn ghost on-dark" onClick={openEdit}><Settings2 size={17} aria-hidden="true"/>{t('editProfile')}</button>}
      </div>
      <div className="passport-stats">
        <PassportStat value={formatScore(s.dailyCount ?? 0)} label={t('statDays')} icon="calendar"/>
        <PassportStat value={formatScore(s.discovered ?? 0)} label={t('statCountries')} icon="earth"/>
        <PassportStat value={formatScore(s.games)} label={t('statGames')} icon="map"/>
        <PassportStat value={s.accuracy + '%'} label={t('statAccuracy')} icon="target"/>
        <PassportStat value={crowns} label={t('statCrowns')} icon="crown"/>
      </div>
      {u.guest && <div className="passport-save">
        <div><h3>{t('passportGuestTitle')}</h3><p>{t('pgPassportSave')}</p></div>
        <div className="passport-save-actions"><button className="btn primary" onClick={() => setModal('signup')}>{t('passportSave')}<ArrowRight size={18} aria-hidden="true"/></button><button className="text-link on-dark" onClick={() => setModal('login')}>{t('signIn')}</button></div>
      </div>}
    </section>

    <PassportCollection stats={s} t={t} locale={locale} go={go} onStart={() => start({ ...DEFAULT_SETTINGS, mode: 'flags', count: 5 })}/>

    {reviews.length > 0 && <section className="page-section" aria-labelledby="passport-review">
      <SectionHeader id="passport-review" title={t('reviewKnowledge')} action={<button className="text-link" onClick={() => start({ ...DEFAULT_SETTINGS, mode: 'mixed' }, true)}>{t('reviewCardCta')}<ArrowRight size={16} aria-hidden="true"/></button>}/>
      <div className="review-grid">{reviews.slice(0, 3).map(r => <article className="review-tile" key={r.key}>
        {r.content.country?.flag && <img src={r.content.country.flag} alt="" width={40} height={28}/>}
        <div><strong>{r.content.country?.name?.[L] ?? r.content.countries?.find(c => c.id === r.country_id)?.name?.[L] ?? r.content.answerLabel?.[L] ?? r.country_id}</strong><small>{t(r.mode)}{r.content.topic && ' · ' + r.content.topic.label[L]}</small></div>
        <button className="btn secondary" onClick={async () => { try { const game = await post('/practice/' + encodeURIComponent(r.key)); go(game.href); } catch (e) { fail(e); } }}>{t('reviewAgain')}</button>
      </article>)}</div>
    </section>}

    <section className="page-section" aria-labelledby="passport-achievements">
      <SectionHeader id="passport-achievements" title={t('passportAchievements')} action={<span className="muted">{s.achievements.length} / {ACHIEVEMENTS.length} {t('unlocked')}</span>}/>
      {(() => {
        const badge = (a: typeof ACHIEVEMENTS[number]) => { const earned = s.achievements.includes(a.id); return <div className={'badge' + (earned ? ' is-earned' : '')} key={a.id}>
          <span className="badge-seal" aria-hidden="true">{GAME_METRICS.includes(a.metric) ? <GameIcon mode={a.metric} size="sm"/> : <RovikoIcon name={BADGE_ICON[a.id] ?? 'sparkles'} size={30}/>}{!earned && <LockKeyhole size={12} className="badge-lock"/>}</span>
          <strong>{a[L] ?? a.en}</strong>
          <small>{earned ? <><Check size={12} aria-hidden="true"/>{t('unlocked')}</> : goal(a.metric, a.target)}</small>
        </div>; };
        const sorted = [...ACHIEVEMENTS].sort((a, b) => Number(s.achievements.includes(b.id)) - Number(s.achievements.includes(a.id)));
        return <><div className="badge-grid">{sorted.slice(0, 6).map(badge)}</div>
          {sorted.length > 6 && <details className="badge-more"><summary>{t('showAll')} ({sorted.length - 6})</summary><div className="badge-grid">{sorted.slice(6).map(badge)}</div></details>}</>;
      })()}
    </section>

    {recent.length > 0 && <section className="page-section" aria-labelledby="passport-recent">
      <SectionHeader id="passport-recent" title={t('recentGames')}/>
      <ul className="recent-list">{recent.slice(0, 4).map(g => <li key={g.id}>
        <ModeEmoji mode={g.mode}/><div><strong>{t(g.mode)}</strong><small>{new Date(g.created_at).toLocaleDateString(locale)} · {t(g.multiplayer ? 'multiplayer' : 'soloLearning')}</small></div>
        <b>{g.multiplayer ? formatScore(g.score) + ' ' + t('points') : `${g.correct}/${g.total}`}</b>
      </li>)}</ul>
    </section>}

    <section className="page-section" aria-label={t('passportSettings')}>
      <div className="settings-card">
        <A href="/account" className="settings-card-row"><RovikoIcon name="account" size={22} className="row-icon"/><span><strong>{t('accountAndPrivacy')}</strong><small>{t('accountAndPrivacyNote')}</small></span><ArrowRight size={17} aria-hidden="true"/></A>
        <A href="/friends" className="settings-card-row"><RovikoIcon name="friends" size={22} className="row-icon"/><span><strong>{t('friendsList')}</strong><small>{t('friendsListCopy')}</small></span><ArrowRight size={17} aria-hidden="true"/></A>
      </div>
    </section>

    <ProfileEditDialog open={edit} onOpenChange={setEdit}/>
  </div>;
}
