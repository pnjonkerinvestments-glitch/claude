'use client';
import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Heart, Skull, Trophy, Users } from 'lucide-react';
import { api, post } from '@/lib/client';
import { SURVIVAL_MODES, SURVIVAL_ROUNDS, type SurvivalMode, type SurvivalSession } from '@/lib/survival';
import { GameIcon } from '../atelier/GameIcon';

type LaunchApp = { go: (path: string) => void; fail: (e: unknown) => void; t: (k: string) => string };
const ART: Record<SurvivalMode, string> = { order: '/art/classic-order.webp', borders: '/art/classic-borders.webp', shape: '' };

/** Opens (or resumes) today's survival run of one mode, with a lock so a double tap never starts two. */
export function useSurvivalLaunch(app: LaunchApp) {
  const lock = useRef(false), [launching, setLaunching] = useState('');
  const open = async (mode: SurvivalMode) => {
    if (lock.current) return; lock.current = true; setLaunching(mode);
    try { const game = await post('/survival', { mode }); app.go('/game/' + game.id); } catch (e) { app.fail(e); } finally { lock.current = false; setLaunching(''); }
  };
  return { open, launching };
}

/** The Shape Shift artwork: Italy's real outline from the silhouette set (100 × 80 box). */
const ITALY = 'M47.8,4.6L49.4,6.8L55.8,7.9L55.6,8.5L54.1,9.5L54.3,10.1L54.6,9.9L55.5,10.3L54.6,11.5L54.9,11.8L55.4,11.6L55.2,12.8L56.1,13.2L56.8,14.0L56.4,14.4L55.8,14.3L56.2,14.2L55.5,13.2L54.9,13.0L54.8,13.4L54.1,13.8L54.2,13.4L52.8,13.1L52.5,13.5L52.6,14.1L51.8,14.2L49.3,15.5L50.1,14.7L49.6,14.5L48.6,15.2L48.0,16.6L49.0,18.1L49.9,18.7L49.4,19.7L49.2,19.1L49.1,19.9L48.6,19.5L48.4,20.4L48.6,22.0L49.2,24.0L50.6,25.4L51.7,25.9L53.7,27.6L55.3,28.4L57.3,34.5L59.7,37.3L60.8,37.9L60.9,38.5L63.1,39.6L64.3,39.8L67.3,39.5L68.0,39.7L68.2,40.6L66.7,41.8L66.9,42.7L73.2,45.8L74.7,47.2L77.4,48.5L77.5,49.1L79.4,50.9L79.9,52.0L79.1,54.3L77.5,53.4L77.3,52.9L77.4,52.2L76.6,50.9L74.8,50.9L73.3,50.1L73.9,49.5L72.6,49.3L71.8,49.8L70.3,52.3L70.3,53.0L69.7,54.5L70.0,55.3L71.0,55.5L73.0,57.1L72.8,58.0L73.1,60.0L72.8,60.5L71.9,60.2L70.2,61.2L69.9,61.8L70.1,63.7L68.9,64.6L68.1,65.7L67.6,67.2L66.0,67.2L65.4,66.6L65.4,65.1L66.3,64.7L66.8,63.1L66.4,62.3L67.2,61.7L68.1,61.6L68.4,60.4L67.8,59.7L67.4,57.4L66.3,55.1L66.2,53.8L65.6,52.7L64.8,52.4L64.3,53.0L64.0,52.9L62.9,51.8L61.9,51.3L62.2,50.2L61.1,48.3L58.8,49.0L59.6,48.1L59.5,47.8L58.5,47.1L57.6,47.2L55.8,44.3L55.0,44.4L53.7,44.0L52.7,44.4L52.3,44.3L51.6,43.3L50.0,42.5L48.2,40.6L47.7,39.6L46.7,38.9L46.3,38.9L45.3,37.0L44.0,36.3L43.2,36.3L43.0,36.6L42.6,36.4L42.6,36.1L43.0,35.8L42.9,35.3L42.0,34.2L40.9,33.4L41.0,32.8L40.1,32.5L39.8,31.9L39.7,30.5L38.7,28.9L38.4,26.4L37.6,25.3L35.7,24.5L33.2,22.9L30.8,22.4L29.3,23.3L29.1,24.0L28.4,24.4L27.9,25.6L27.4,26.1L25.4,26.8L24.7,26.8L24.5,26.1L25.6,24.8L25.4,24.2L23.8,24.4L22.2,23.6L21.4,22.7L21.3,21.6L22.2,20.2L22.2,19.6L20.8,19.0L20.1,17.7L22.4,16.9L22.7,16.7L22.8,15.8L21.1,13.4L21.1,12.7L21.9,12.4L22.2,12.0L23.0,12.4L24.7,11.7L26.3,12.1L27.8,10.5L27.8,10.0L28.6,8.6L29.2,8.4L29.3,9.9L30.2,10.7L31.2,10.9L31.1,11.6L31.6,11.9L31.8,12.6L32.3,12.7L32.5,12.2L32.1,11.7L33.5,9.5L33.3,8.5L33.6,8.1L34.4,8.3L34.4,8.9L34.8,9.4L35.6,9.5L36.8,8.9L37.4,10.0L37.8,10.0L38.0,9.7L37.9,8.9L37.3,8.5L37.4,7.8L37.7,7.3L38.3,7.1L38.6,7.7L39.4,7.8L39.5,5.5L40.5,5.5L41.3,6.1L42.2,6.2L43.1,4.9L44.6,4.6L45.9,4.8L48.3,4.1L47.8,4.6ZM64.9,65.7L63.3,68.3L63.1,69.6L62.7,70.3L62.7,71.2L63.4,72.7L63.7,72.9L63.8,73.5L63.0,74.2L62.7,75.0L62.9,75.8L62.6,76.0L62.3,75.6L61.1,75.6L60.0,75.1L58.4,73.2L57.7,72.8L56.6,72.9L53.8,71.1L53.0,70.2L51.8,69.6L50.5,69.7L49.5,68.8L49.3,68.1L49.9,66.3L50.8,65.7L51.8,66.5L52.5,66.1L52.7,65.4L53.8,65.2L54.1,65.9L56.0,66.9L56.9,66.5L58.8,66.6L59.8,66.4L61.6,65.5L62.7,65.9L64.9,64.7L65.5,64.8L65.1,65.0L64.9,65.7ZM34.7,45.0L35.3,46.1L34.6,46.6L35.2,46.6L36.2,49.3L36.0,50.2L35.2,51.1L35.7,52.6L34.9,58.8L34.3,58.9L33.7,58.4L32.2,58.0L32.1,59.9L31.3,60.6L30.6,60.3L30.3,60.6L29.8,59.5L29.5,59.4L29.1,60.1L28.8,59.3L28.9,59.0L29.4,59.1L28.9,58.2L29.2,57.8L28.9,57.2L29.3,54.6L29.6,54.8L29.8,53.8L29.6,53.5L29.0,53.6L29.4,51.3L28.9,49.5L28.6,48.8L28.0,48.7L27.9,49.0L27.8,48.8L28.0,46.6L28.2,46.4L28.8,47.1L30.1,47.1L31.1,46.5L32.1,45.2L32.9,44.7L33.0,44.3L34.7,45.0Z';
function ShapeArt() {
  return <svg className="survival-shape-art" viewBox="-10 -8 120 96" aria-hidden="true"><path d={ITALY} fill="currentColor"/></svg>;
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
          <span className="survival-art">{ART[mode] ? <img src={ART[mode]} alt="" width={574} height={248} loading="lazy" decoding="async"/> : <ShapeArt/>}{mode === 'shape' && <span className="survival-new">{t('survivalNew')}</span>}</span>
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
