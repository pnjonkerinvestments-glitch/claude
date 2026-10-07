'use client';
import React, { useEffect, useRef, useState } from 'react';
import { GameScene, type SceneMode } from '../ds/GameScene';
import { ArrowRight, Check, Swords, Users } from 'lucide-react';
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
 * once the scored games are done; `featured` keeps it short there) and on the all-games page.
 * Trip style (1.23): one white card, a small caps kicker with a row of dots, and six tiles.
 */
export function BonusTour({ app, bonus, busy, featured, compact }: { app: LaunchApp & { t: (k: string) => string }; bonus?: BonusSession[]; busy?: boolean; featured?: boolean; compact?: boolean }) {
  const { t } = app;
  const { open, launching } = useBonusLaunch(app);
  const done = BONUS_MODES.filter(m => bonusStateOf(bonus, m) === 'done').length, next = nextBonusMode(bonus);
  return <section className={'home-section bonus-tour bt-trip' + (featured ? ' is-featured' : '') + (compact ? ' is-compact' : '')} aria-labelledby="bonus-title">
    <header className="bonus-head">
      <p className="t-kicker is-caps">{t('bonusKicker')} · {t('bonusProgress').replace('{n}', String(done))}</p>
      <h2 id="bonus-title">{t('bonusTitle')}</h2>
      <p className="bonus-line">{featured ? t('homeBonusLine') : t('bonusCopy')}</p>
      <ol className="t-dots" aria-hidden="true">{BONUS_MODES.map(m => <li key={m} className={bonusStateOf(bonus, m) === 'done' ? 'is-done' : m === next ? 'is-now' : ''}/>)}</ol>
    </header>
    <ol className="bonus-grid">{BONUS_MODES.map(mode => {
      const state = bonusStateOf(bonus, mode), saved = bonus?.find(b => b.mode === mode), isNext = mode === next;
      return <li key={mode} className={'bonus-stop is-' + state + (isNext ? ' is-next' : '') + ' tone-' + mode}>
        <button type="button" disabled={busy || !!launching} aria-busy={launching === mode} onClick={() => open(mode)}>
          {/* `compact` (All games page, 1.24): logos only, no pictures. */}
          {!compact && <span className="bonus-art"><GameScene mode={mode as SceneMode} shape="wide"/>{state === 'done' && <span className="bonus-check"><Check size={14} strokeWidth={3}/></span>}</span>}
          <span className="bonus-body"><span className="bonus-logo"><GameIcon mode={mode} size={compact ? 'md' : 'sm'}/>{compact && state === 'done' && <span className="bonus-check"><Check size={12} strokeWidth={3.2}/></span>}</span><span><strong>{t(mode)}</strong><small>{state === 'done' ? t('bonusScore').replace('{n}', String(saved?.score ?? 0)).replace('/10', '/' + (saved?.total ?? BONUS_ROUNDS)) : isNext ? t('tripUpNext') : t('bonusQuestions')}</small></span></span>
        </button>
      </li>;
    })}</ol>
    {!next && <p className="bonus-complete"><Check size={17} strokeWidth={3} aria-hidden="true"/>{t('bonusDoneTitle')} <A href="/multiplayer" className="text-link">{t('navMultiplayer')}<ArrowRight size={15} aria-hidden="true"/></A></p>}
  </section>;
}

/** Under a finished bonus game: one card with how you did against today's players and one pill to the next bonus game. */
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
  return <section className="daily-result has-stage bonus-result" aria-label={t('bonusKicker')}>
    <div className="daily-result-compare">
      <p><Users size={18} aria-hidden="true"/>{!standing ? t('loading') : pct === null ? t('bonusFirst') : pct === 0 ? t('beatenZero') : t('bonusBeaten').replace('{n}', String(pct))}</p>
      {!!pct && <span className="daily-result-bar" aria-hidden="true"><i style={{ width: Math.max(4, pct) + '%' }}/></span>}
    </div>
    {next === undefined ? <span className="daily-result-next is-pending" aria-hidden="true"/> : next
      ? <button className="btn primary btn-lg daily-result-next" disabled={!!launching || app.busy} aria-busy={!!launching} onClick={() => open(next)}><GameIcon mode={next} size="sm"/><span>{launching ? t('loading') : t('bonusCta').replace('{game}', t(next))}</span><ArrowRight size={19} aria-hidden="true"/></button>
      : <div className="bonus-finale"><strong>{t('bonusDoneTitle')}</strong><p>{t('bonusDoneCopy')}</p><A href="/multiplayer" className="btn primary btn-lg daily-result-next"><Swords size={18} aria-hidden="true"/>{t('navMultiplayer')}<ArrowRight size={19} aria-hidden="true"/></A></div>}
  </section>;
}
