'use client';
import React, { useEffect, useRef, useState } from 'react';
import { GameScene } from '../ds/GameScene';
import { ArrowRight, Heart, Trophy, Users } from 'lucide-react';
import { api, post } from '@/lib/client';
import { SURVIVAL_MODES, SURVIVAL_ROUNDS, type SurvivalMode, type SurvivalSession } from '@/lib/survival';
import { GameIcon } from '../atelier/GameIcon';

type LaunchApp = { go: (path: string) => void; fail: (e: unknown) => void; t: (k: string) => string };

/** Opens (or resumes) today's survival run of one mode, with a lock so a double tap never starts two. */
export function useSurvivalLaunch(app: LaunchApp) {
  const lock = useRef(false), [launching, setLaunching] = useState('');
  const open = async (mode: SurvivalMode) => {
    if (lock.current) return; lock.current = true; setLaunching(mode);
    try { const game = await post('/survival', { mode }); app.go('/game/' + game.id); } catch (e) { app.fail(e); } finally { lock.current = false; setLaunching(''); }
  };
  return { open, launching };
}

/**
 * Survival: three daily runs that end at your first mistake. Shown on the all-games page and, after 6/6,
 * on the homepage (`compact`: no intro line and no pictures there). Trip style: one white card with three rows.
 */
export function SurvivalRuns({ app, survival, busy, compact }: { app: LaunchApp; survival?: SurvivalSession[]; busy?: boolean; compact?: boolean }) {
  const { t } = app;
  const { open, launching } = useSurvivalLaunch(app);
  return <section className={'home-section survival sv-trip' + (compact ? ' is-compact' : '')} aria-labelledby="survival-title">
    <header className="survival-head">
      <p className="t-kicker is-caps"><Heart size={14} fill="currentColor" aria-hidden="true"/>{t('survivalKicker')}</p>
      <h2 id="survival-title">{t('survivalTitle')}</h2>
      {!compact && <p className="muted">{t('survivalCopy')}</p>}
    </header>
    <ol className="survival-grid">{SURVIVAL_MODES.map(mode => {
      const saved = survival?.find(s => s.mode === mode), done = !!saved?.completed;
      return <li key={mode} className={'survival-card tone-' + mode + (done ? ' is-done' : saved ? ' is-active' : '')}>
        <button type="button" disabled={busy || !!launching} aria-busy={launching === mode} onClick={() => open(mode)}>
          {!compact && <span className="survival-art" aria-hidden="true"><GameScene mode={mode} shape="wide"/></span>}
          <span className="survival-body"><GameIcon mode={mode} size="sm"/><span>
            <strong>{t(mode === 'shape' ? 'shape' : mode)}{mode === 'shape' && !done && <em className="survival-new">{t('survivalNew')}</em>}</strong>
            <small>{done ? t(saved?.out ? 'survivalReached' : 'survivalAll').replace('{n}', String(saved?.score ?? 0)).replace('{total}', String(SURVIVAL_ROUNDS)) : saved ? t('journeyStopActive') : t('survival' + mode[0].toUpperCase() + mode.slice(1))}</small>
          </span>{done ? <b className="survival-score">{saved?.score ?? 0}</b> : <span className="t-pill sv-play" aria-hidden="true">{t('todayGo')}<ArrowRight size={16}/></span>}</span>
        </button>
      </li>;
    })}</ol>
  </section>;
}

/** Under a finished run: one card with how far you got against today's players, the day's longest run and the next run. */
export function SurvivalResult({ app, mode, score, out }: { app: LaunchApp; mode: string; score: number; out?: boolean }) {
  const { t } = app;
  const [standing, setStanding] = useState<{ players: number; beaten: number; top?: number } | null>(null), [left, setLeft] = useState<SurvivalMode | null | undefined>();
  const { open, launching } = useSurvivalLaunch(app);
  useEffect(() => {
    let active = true;
    api('/survival/standing?mode=' + encodeURIComponent(mode)).then(r => { if (active) setStanding(r); }).catch(() => {});
    api('/puzzles/today?competition=1').then(r => { if (active) setLeft(SURVIVAL_MODES.find(m => m !== mode && !r.survival?.some((s: SurvivalSession) => s.mode === m && s.completed)) ?? null); }).catch(() => { if (active) setLeft(null); });
    return () => { active = false; };
  }, [mode]);
  const pct = standing && standing.players > 0 ? Math.round(standing.beaten / standing.players * 100) : null;
  return <section className="daily-result has-stage survival-result" aria-label={t('survivalKicker')}>
    <p className="sr-only">{t(out ? 'survivalOutAt' : 'survivalAllTitle').replace('{n}', String(score))}</p>
    <div className="daily-result-compare">
      <p><Users size={18} aria-hidden="true"/>{!standing ? t('loading') : pct === null ? t('bonusFirst') : pct === 0 ? t('beatenZero') : t('bonusBeaten').replace('{n}', String(pct))}</p>
      {!!pct && <span className="daily-result-bar" aria-hidden="true"><i style={{ width: Math.max(4, pct) + '%' }}/></span>}
      {standing?.top ? <small className="survival-top"><Trophy size={14} aria-hidden="true"/>{t('survivalTop').replace('{n}', String(standing.top))}</small> : null}
    </div>
    {left ? <button className="btn primary btn-lg daily-result-next" disabled={!!launching} aria-busy={!!launching} onClick={() => open(left)}><GameIcon mode={left} size="sm"/><span>{launching ? t('loading') : t('survivalNext').replace('{game}', t(left))}</span><ArrowRight size={19} aria-hidden="true"/></button> : null}
  </section>;
}
