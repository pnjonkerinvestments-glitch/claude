'use client';
import React, { useState, useSyncExternalStore } from 'react';
import { ArrowRight, Check, Copy, Download, LockKeyhole, LogOut, Settings2, Trash2, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { ACHIEVEMENTS } from '@/lib/achievements';
import { DEFAULT_SETTINGS } from '@/lib/config';
import { api, post, formatScore } from '@/lib/client';
import type { Locale } from '@/i18n/messages';
import { useApp } from '../app/context';
import { A, Avatar, AvatarPicker, ModeEmoji } from '../app/shared';
import { PassportCollection } from '../atelier/PassportCollection';
import { EmptyState, PageHeader, SectionHeader } from '../ds/States';

type Review = { key: string; country_id: string; mode: string; content: { country?: { flag?: string; name?: Record<string, string> }; countries?: { id: string; name: Record<string, string> }[]; answerLabel?: Record<string, string>; fact?: Record<string, string>; topic?: { label: Record<string, string>; explanation: Record<string, string> } } };
type Recent = { id: string; mode: string; created_at: number; multiplayer: number | boolean; score: number; correct: number; total: number };

const crownsSnapshot = () => { try { const v = JSON.parse(localStorage.getItem('roviko:crowns') ?? '[]'); return Array.isArray(v) ? v.length : 0; } catch { return 0; } };
const subscribeCrowns = (cb: () => void) => { window.addEventListener('roviko:progress', cb); window.addEventListener('storage', cb); return () => { window.removeEventListener('roviko:progress', cb); window.removeEventListener('storage', cb); }; };
const METRIC_KEYS: Record<string, string> = { games: 'gamesPlayed', correct: 'correctAnswer', xp: 'xp', bestStreak: 'streak', dailyCount: 'daily', dailyStreak: 'dailyStreak', wins: 'wins', multiGames: 'multiplayer', perfect: 'perfect' };
const BADGES = ['🧭', '🏔️', '⭐', '🚩', '🏆', '☀️'];

/** One number in the travel log. */
function PassportStat({ value, label }: { value: React.ReactNode; label: string }) {
  return <div className="passport-stat"><strong>{value}</strong><span>{label}</span></div>;
}

/** The Roviko Passport: who you are, where you have been, what you collected. Guests see a preview and can save it, never forced. */
export function PassportPage() {
  const { t, boot, refresh, setModal, fail, go, start, copy, locale, measurement, setMeasurement } = useApp();
  const s = boot.stats, u = boot.user;
  const crowns = useSyncExternalStore(subscribeCrowns, crownsSnapshot, () => 0);
  const [edit, setEdit] = useState(false), [name, setName] = useState(u.name), [avatar, setAvatar] = useState(u.avatar), [discoverable, setDiscoverable] = useState(u.discoverable), [deleting, setDeleting] = useState(false), [busy, setBusy] = useState(false);
  const levelName = t(s.level >= 100 ? 'master' : s.level >= 50 ? 'cartographer' : s.level >= 25 ? 'navigator' : s.level >= 10 ? 'explorerLevel' : 'beginner');
  const openEdit = () => { setName(u.name); setAvatar(u.avatar); setDiscoverable(u.discoverable); setEdit(true); };
  const save = async (e: React.FormEvent) => { e.preventDefault(); setBusy(true); try { await api('/profile', { method: 'PATCH', body: JSON.stringify({ name, avatar, discoverable }) }); await refresh(); setEdit(false); } catch (err) { fail(err); } finally { setBusy(false); } };
  const reviews: Review[] = s.reviews ?? [];
  const recent: Recent[] = s.recent ?? [];
  const L = locale as Locale;

  return <div className="page passport">
    <PageHeader art="spot-world-trip" kicker={t('passportKicker')} title={t('passportTitle')} lead={t('passportSub')}/>

    <section className={'passport-cover' + (u.guest ? ' is-guest' : '')} aria-label={t('navPassport')}>
      <div className="passport-cover-id">
        <Avatar id={u.avatar} size="large"/>
        <div>
          {u.guest && <span className="passport-preview">{t('passportPreview')}</span>}
          <h2>{u.name}</h2>
          <p>{t('passportLevel').replace('{n}', String(s.level))} · {levelName}</p>
          <Progress value={s.levelProgress} className="passport-xp" aria-label={t('level') + ' ' + s.level}/>
        </div>
        {!u.guest && <button className="btn ghost on-dark" onClick={openEdit}><Settings2 size={17} aria-hidden="true"/>{t('editProfile')}</button>}
      </div>
      <div className="passport-stats">
        <PassportStat value={formatScore(s.dailyCount ?? 0)} label={t('statDays')}/>
        <PassportStat value={formatScore(s.discovered ?? 0)} label={t('statCountries')}/>
        <PassportStat value={formatScore(s.games)} label={t('statGames')}/>
        <PassportStat value={s.accuracy + '%'} label={t('statAccuracy')}/>
        <PassportStat value={crowns} label={t('statCrowns')}/>
      </div>
      {u.guest && <div className="passport-save">
        <div><h3>{t('passportGuestTitle')}</h3><p>{t('passportGuestCopy')}</p></div>
        <div className="passport-save-actions"><button className="btn gold" onClick={() => setModal('signup')}>{t('passportSave')}<ArrowRight size={18} aria-hidden="true"/></button><button className="text-link on-dark" onClick={() => setModal('login')}>{t('signIn')}</button></div>
      </div>}
    </section>

    <PassportCollection stats={s} t={t} locale={locale} go={go} onStart={() => start({ ...DEFAULT_SETTINGS, mode: 'flags', count: 5 })}/>

    <section className="page-section" aria-labelledby="passport-review">
      <SectionHeader id="passport-review" title={t('reviewKnowledge')} action={reviews.length > 0 && <button className="text-link" onClick={() => start({ ...DEFAULT_SETTINGS, mode: 'mixed' }, true)}>{t('reviewCardCta')}<ArrowRight size={16} aria-hidden="true"/></button>}/>
      {reviews.length ? <div className="review-grid">{reviews.slice(0, 6).map(r => <article className="review-tile" key={r.key}>
        {r.content.country?.flag && <img src={r.content.country.flag} alt="" width={40} height={28}/>}
        <div><strong>{r.content.country?.name?.[L] ?? r.content.countries?.find(c => c.id === r.country_id)?.name?.[L] ?? r.content.answerLabel?.[L] ?? r.country_id}</strong><small>{t(r.mode)}{r.content.topic && ' · ' + r.content.topic.label[L]}</small></div>
        <button className="btn secondary" onClick={async () => { try { const game = await post('/practice/' + encodeURIComponent(r.key)); go(game.href); } catch (e) { fail(e); } }}>{t('reviewAgain')}</button>
      </article>)}</div> : <div className="soft-note"><p>{t('emptyPractice')}</p></div>}
    </section>

    <section className="page-section" aria-labelledby="passport-achievements">
      <SectionHeader id="passport-achievements" title={t('passportAchievements')} action={<span className="muted">{s.achievements.length} / {ACHIEVEMENTS.length} {t('unlocked')}</span>}/>
      {(() => {
        const badge = (a: typeof ACHIEVEMENTS[number]) => { const i = ACHIEVEMENTS.indexOf(a), earned = s.achievements.includes(a.id); return <div className={'badge' + (earned ? ' is-earned' : '')} key={a.id}>
          <span className="badge-seal" aria-hidden="true">{BADGES[i % 6]}{!earned && <LockKeyhole size={12} className="badge-lock"/>}</span>
          <strong>{a[L] ?? a.en}</strong>
          <small>{earned ? <><Check size={12} aria-hidden="true"/>{t('unlocked')}</> : a.target + ' ' + t(METRIC_KEYS[a.metric] ?? a.metric)}</small>
        </div>; };
        const sorted = [...ACHIEVEMENTS].sort((a, b) => Number(s.achievements.includes(b.id)) - Number(s.achievements.includes(a.id)));
        return <><div className="badge-grid">{sorted.slice(0, 12).map(badge)}</div>
          {sorted.length > 12 && <details className="badge-more"><summary>{t('showAll')} ({sorted.length - 12})</summary><div className="badge-grid">{sorted.slice(12).map(badge)}</div></details>}</>;
      })()}
    </section>

    <section className="page-section" aria-labelledby="passport-recent">
      <SectionHeader id="passport-recent" title={t('recentGames')}/>
      {recent.length ? <ul className="recent-list">{recent.map(g => <li key={g.id}>
        <ModeEmoji mode={g.mode}/><div><strong>{t(g.mode)}</strong><small>{new Date(g.created_at).toLocaleDateString(locale)} · {t(g.multiplayer ? 'multiplayer' : 'soloLearning')}</small></div>
        <b>{g.multiplayer ? formatScore(g.score) + ' ' + t('points') : `${g.correct}/${g.total}`}</b>
      </li>)}</ul> : <EmptyState title={t('noGames')} copy={t('exploreRecentEmpty')}><A href="/" className="btn primary">{t('tripStart')}</A></EmptyState>}
    </section>

    <section className="page-section" aria-labelledby="passport-account">
      <SectionHeader id="passport-account" title={t('passportSettings')}/>
      <div className="settings-card">
        <A href="/friends" className="settings-card-row"><Users size={19} aria-hidden="true"/><span><strong>{t('friendsList')}</strong><small>{t('friendsListCopy')}</small></span><ArrowRight size={17} aria-hidden="true"/></A>
        {!u.guest && <button className="settings-card-row" onClick={() => copy(u.friendCode)}><Copy size={19} aria-hidden="true"/><span><strong>{t('friendCode')}</strong><small>{u.friendCode}</small></span></button>}
        <div className="settings-card-row"><span className="row-icon" aria-hidden="true"/><label htmlFor="metrics-choice"><strong>{t('optionalMetrics')}</strong><small>{t('optionalMetricsCopy')}</small></label><Switch id="metrics-choice" checked={measurement} onCheckedChange={setMeasurement}/></div>
        <a href="/api/export" className="settings-card-row" download><Download size={19} aria-hidden="true"/><span><strong>{t('export')}</strong></span></a>
        {!u.guest && <button className="settings-card-row" onClick={async () => { try { await post('/auth/logout'); await refresh(); go('/'); } catch (e) { fail(e); } }}><LogOut size={19} aria-hidden="true"/><span><strong>{t('logout')}</strong></span></button>}
        <button className="settings-card-row is-danger" onClick={() => setDeleting(true)}><Trash2 size={19} aria-hidden="true"/><span><strong>{t('deleteAccount')}</strong></span></button>
      </div>
    </section>

    <Dialog open={edit} onOpenChange={setEdit}><DialogContent className="app-modal"><DialogTitle className="modal-title">{t('editProfile')}</DialogTitle><DialogDescription>{t('nameHint')}</DialogDescription><form onSubmit={save} className="form-stack"><label className="field"><span>{t('displayName')}</span><input className="text-input" value={name} onChange={e => setName(e.target.value)} minLength={2} maxLength={24} required/></label><AvatarPicker value={avatar} onChange={setAvatar}/><div className="switch-field"><label htmlFor="discoverable">{t('discoverable')}</label><Switch id="discoverable" checked={discoverable} onCheckedChange={setDiscoverable}/></div><button className="btn primary" disabled={busy}>{t('save')}<Check size={17}/></button></form></DialogContent></Dialog>
    <AlertDialog open={deleting} onOpenChange={setDeleting}><AlertDialogContent className="app-modal"><AlertDialogTitle>{t('deleteTitle')}</AlertDialogTitle><AlertDialogDescription>{t('deleteCopy')}</AlertDialogDescription><AlertDialogFooter><AlertDialogCancel>{t('cancel')}</AlertDialogCancel><AlertDialogAction className="delete-button" onClick={async () => { try { await api('/profile', { method: 'DELETE' }); await refresh(); go('/'); } catch (e) { fail(e); } }}>{t('deleteConfirm')}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}
