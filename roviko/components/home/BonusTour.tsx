'use client';
import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, Sparkles, Swords, Users } from 'lucide-react';
import { api, post } from '@/lib/client';
import { DEFAULT_SETTINGS } from '@/lib/config';
import { BONUS_MODES, BONUS_ROUNDS, bonusStateOf, nextBonusMode, type BonusMode, type BonusSession } from '@/lib/bonus';
import { A } from '../app/shared';
import { GameIcon } from '../atelier/GameIcon';

type LaunchApp = { go: (path: string) => void; fail: (e: unknown) => void };

/** Opens (or resumes) today's bonus game of one classic mode. */
export async function launchBonus(app: LaunchApp, mode: BonusMode) {
  const game = await post('/games', { settings: { ...DEFAULT_SETTINGS, mode, timer: 0 }, bonus: true });
  app.go('/game/' + game.id);
}

/** A launch helper with its own lock, so a double tap never starts two games. */
export function useBonusLaunch(app: LaunchApp) {
  const lock = useRef(false), [launching, setLaunching] = useState('');
  const open = async (mode: BonusMode) => {
    if (lock.current) return; lock.current = true; setLaunching(mode);
    try { await launchBonus(app, mode); } catch (e) { app.fail(e); } finally { lock.current = false; setLaunching(''); }
  };
  return { open, launching };
}

/**
 * Today's bonus tour: the six classic games with the day's countries. Shown on the homepage (first,
 * once the scored games are done) and on the all-games page.
 */
export function BonusTour({ app, bonus, busy, featured }: { app: LaunchApp & { t: (k: string) => string }; bonus?: BonusSession[]; busy?: boolean; featured?: boolean }) {
  const { t } = app;
  const { open, launching } = useBonusLaunch(app);
  const done = BONUS_MODES.filter(m => bonusStateOf(bonus, m) === 'done').length, next = nextBonusMode(bonus);
  return <section className={'home-section bonus-tour' + (featured ? ' is-featured' : '')} aria-labelledby="bonus-title">
    <header className="bonus-head">
      <span className="bonus-badge" aria-hidden="true"><Sparkles size={20}/></span>
      <div>
        <p className="kicker">{t('bonusKicker')} · {t('bonusProgress').replace('{n}', String(done))}</p>
        <h2 id="bonus-title">{t('bonusTitle')}</h2>
        {featured && <p className="muted">{t('bonusCopy')}</p>}
      </div>
    </header>
    <span className="bonus-meter" aria-hidden="true"><i style={{ width: done / BONUS_MODES.length * 100 + '%' }}/></span>
    <ol className="bonus-grid">{BONUS_MODES.map(mode => {
      const state = bonusStateOf(bonus, mode), saved = bonus?.find(b => b.mode === mode), isNext = mode === next;
      return <li key={mode} className={'bonus-stop is-' + state + (isNext ? ' is-next' : '') + ' tone-' + mode}>
        <button type="button" disabled={busy || !!launching} aria-busy={launching === mode} onClick={() => open(mode)}>
          <span className="bonus-art"><img src={'/art/classic-' + mode + '.webp'} alt="" width={574} height={248} loading="lazy" decoding="async"/>{state === 'done' && <span className="bonus-check"><Check size={14} strokeWidth={3}/></span>}</span>
          <span className="bonus-body"><GameIcon mode={mode} size="sm"/><span><strong>{t(mode)}</strong><small>{state === 'done' ? t('bonusScore').replace('{n}', String(saved?.score ?? 0)).replace('/10', '/' + (saved?.total ?? BONUS_ROUNDS)) : isNext ? t('tripUpNext') : t('bonusQuestions')}</small></span></span>
        </button>
      </li>;
    })}</ol>
    {!next && <p className="bonus-complete"><Check size={17} strokeWidth={3} aria-hidden="true"/>{t('bonusDoneTitle')} <A href="/multiplayer" className="text-link">{t('navMultiplayer')}<ArrowRight size={15} aria-hidden="true"/></A></p>}
  </section>;
}

/** Under a finished bonus game: how you did against today's players and the next bonus game. */
export function BonusResult({ app, mode }: { app: LaunchApp & { t: (k: string) => string; busy?: boolean }; mode: string }) {
  const { t } = app;
  const [standing, setStanding] = useState<{ players: number; beaten: number } | null>(null), [next, setNext] = useState<BonusMode | null | undefined>();
  const { open, launching } = useBonusLaunch(app);
  useEffect(() => {
    let active = true;
    api('/bonus/standing?mode=' + encodeURIComponent(mode)).then(r => { if (active) setStanding(r); }).catch(() => {});
    api('/puzzles/today?competition=1').then(r => { if (active) setNext(nextBonusMode(r.bonus)); }).catch(() => { if (active) setNext(null); });
    return () => { active = false; };
  }, [mode]);
  const pct = standing && standing.players > 0 ? Math.round(standing.beaten / standing.players * 100) : null;
  return <section className="daily-result bonus-result" aria-label={t('bonusKicker')}>
    <div className="daily-result-compare">
      <p><Users size={17} aria-hidden="true"/>{!standing ? t('loading') : pct === null ? t('bonusFirst') : t('bonusBeaten').replace('{n}', String(pct))}</p>
      {pct !== null && <span className="daily-result-bar" aria-hidden="true"><i style={{ width: Math.max(4, pct) + '%' }}/></span>}
    </div>
    {next === undefined ? null : next
      ? <button className="btn primary btn-lg daily-result-next" disabled={!!launching || app.busy} onClick={() => open(next)}>{launching ? t('loading') : t('bonusCta').replace('{game}', t(next))}<ArrowRight size={19} aria-hidden="true"/></button>
      : <div className="bonus-finale"><strong>{t('bonusDoneTitle')}</strong><p>{t('bonusDoneCopy')}</p><A href="/multiplayer" className="btn primary"><Swords size={17} aria-hidden="true"/>{t('navMultiplayer')}</A></div>}
  </section>;
}
