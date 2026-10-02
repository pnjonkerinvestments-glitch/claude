'use client';
import React, { useEffect, useRef, useState } from 'react';
import { GameScene } from '../ds/GameScene';
import { ArrowRight, Heart, Skull, Trophy, Users } from 'lucide-react';
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

/** Survival: three daily runs that end at your first mistake. Shown on the all-games page and on the homepage. */
export function SurvivalRuns({ app, survival, busy }: { app: LaunchApp; survival?: SurvivalSession[]; busy?: boolean }) {
  const { t } = app;
  const { open, launching } = useSurvivalLaunch(app);
  return <section className="home-section survival" aria-labelledby="survival-title">
    <header className="survival-head">
      <span className="survival-badge" aria-hidden="true"><Heart size={20} fill="currentColor"/></span>
      <div><p className="kicker">{t('survivalKicker')}</p><h2 id="survival-title">{t('survivalTitle')}</h2><p className="muted">{t('survivalCopy')}</p></div>
    </header>
    <ol className="survival-grid">{SURVIVAL_MODES.map(mode => {
      const saved = survival?.find(s => s.mode === mode), done = !!saved?.completed;
      return <li key={mode} className={'survival-card tone-' + mode + (done ? ' is-done' : saved ? ' is-active' : '')}>
        <button type="button" disabled={busy || !!launching} aria-busy={launching === mode} onClick={() => open(mode)}>
          <span className="survival-art"><GameScene mode={mode} shape="wide"/>{mode === 'shape' && <span className="survival-new">{t('survivalNew')}</span>}</span>
          <span className="survival-body"><GameIcon mode={mode} size="sm"/><span>
            <strong>{t(mode === 'shape' ? 'shape' : mode)}</strong>
            <small>{done ? t(saved?.out ? 'survivalReached' : 'survivalAll').replace('{n}', String(saved?.score ?? 0)).replace('{total}', String(SURVIVAL_ROUNDS)) : saved ? t('journeyStopActive') : t('survival' + mode[0].toUpperCase() + mode.slice(1))}</small>
          </span>{done ? <b className="survival-score">{saved?.score ?? 0}</b> : <ArrowRight size={18} aria-hidden="true"/>}</span>
        </button>
      </li>;
    })}</ol>
  </section>;
}

/** Under a finished run: how far you got against today's players and the day's longest run. */
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
  return <section className="daily-result survival-result" aria-label={t('survivalKicker')}>
    <p className={'survival-verdict' + (out ? ' is-out' : ' is-all')}>{out ? <Skull size={18} aria-hidden="true"/> : <Trophy size={18} aria-hidden="true"/>}{t(out ? 'survivalOutAt' : 'survivalAllTitle').replace('{n}', String(score))}</p>
    <div className="daily-result-compare">
      <p><Users size={17} aria-hidden="true"/>{!standing ? t('loading') : pct === null ? t('bonusFirst') : t('bonusBeaten').replace('{n}', String(pct))}</p>
      {pct !== null && <span className="daily-result-bar" aria-hidden="true"><i style={{ width: Math.max(4, pct) + '%' }}/></span>}
      {standing?.top ? <small className="survival-top"><Trophy size={14} aria-hidden="true"/>{t('survivalTop').replace('{n}', String(standing.top))}</small> : null}
    </div>
    {left ? <button className="btn primary btn-lg daily-result-next" disabled={!!launching} onClick={() => open(left)}>{launching ? t('loading') : t('survivalNext').replace('{game}', t(left))}<ArrowRight size={19} aria-hidden="true"/></button> : null}
  </section>;
}
