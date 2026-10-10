'use client';
import React, { useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { continentArt, continentModes, continentOfWeek, inRegion, weekMonday } from '@/lib/continent-week';
import { GameIcon } from '../atelier/GameIcon';
import { useApp } from '../app/context';

/** Countries per week continent (195 in all; North and South America together are "Americas"). */
const SIZE: Record<string, number> = { Europe: 45, Africa: 54, Asia: 47, Americas: 35, Oceania: 14 };
const ROUNDS = [5, 10, 15, 20], LEVELS = ['easy', 'medium', 'hard', 'mixed'];

/** This week's continent and how much of it the player has discovered (passport stamps in that continent). */
export function useContinentWeek() {
  const { boot } = useApp();
  const today = new Date().toISOString().slice(0, 10);
  const region = continentOfWeek(today);
  const stamps = (boot?.stats?.stamps ?? []) as { region?: string }[];
  const found = stamps.filter(s => s.region && inRegion(s.region, region)).length;
  const next = new Date(Date.parse(weekMonday(today) + 'T00:00:00Z') + 7 * 86400000);
  const daysLeft = Math.max(1, Math.ceil((next.getTime() - Date.now()) / 86400000));
  return { region, found: Math.min(found, SIZE[region]), total: SIZE[region], daysLeft };
}

/**
 * The continent of the week (1.35): after the six daily games, a way to keep learning that has a goal. One
 * continent per week (lib/continent-week.ts), new questions every game, your discovered countries as progress.
 * Practice only: no ranking points.
 */
export function ContinentCard({ featured = false }: { featured?: boolean }) {
  const { t } = useApp();
  const { region, found, total, daysLeft } = useContinentWeek();
  const [open, setOpen] = useState(false);
  const name = t(region);
  return <section className={'continent-week t-card' + (featured ? ' is-featured' : '')} aria-labelledby="continent-week-title">
    <div className="cw-art" aria-hidden="true"><img src={continentArt(region)} alt="" width={720} height={300} decoding="async" loading="lazy"/></div>
    <div className="cw-body">
      <p className="t-kicker">{t('cwKicker')}</p>
      <h2 id="continent-week-title">{t('cwTitle').replace('{continent}', name)}</h2>
      <p className="cw-copy">{t('cwCopy')}</p>
      <div className="cw-progress" role="img" aria-label={t('cwFound').replace('{n}', String(found)).replace('{total}', String(total))}>
        <span className="cw-bar"><span style={{ width: Math.round(found / total * 100) + '%' }}/></span>
        <small><b>{found}</b> / {total} {t('cwCountries')} · {daysLeft === 1 ? t('cwLastDay') : t('cwDaysLeft').replace('{n}', String(daysLeft))}</small>
      </div>
      <button className="btn primary btn-lg cw-start" onClick={() => setOpen(true)}>{t('cwLearn').replace('{continent}', name)}<ArrowRight size={19} aria-hidden="true"/></button>
    </div>
    <ContinentSetup open={open} onOpenChange={setOpen} region={region}/>
  </section>;
}

/** Choose the number of questions, the level and the games, like the multiplayer waiting room; one tap to start. */
function ContinentSetup({ open, onOpenChange, region }: { open: boolean; onOpenChange: (v: boolean) => void; region: string }) {
  const { t, start, busy } = useApp();
  const available = useMemo(() => continentModes(region), [region]);
  const [count, setCount] = useState(10), [difficulty, setDifficulty] = useState('medium'), [modes, setModes] = useState<string[]>(available);
  const chosen = modes.filter(m => available.includes(m as any));
  const toggle = (m: string) => setModes(chosen.includes(m) ? (chosen.length > 1 ? chosen.filter(x => x !== m) : chosen) : [...chosen, m]);
  const go = async () => { onOpenChange(false); await start({ mode: 'mixed', count, difficulty, region, timer: 0, enabledModes: chosen }); };
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="app-modal continent-setup">
      <div className="cs-art" aria-hidden="true"><img src={continentArt(region)} alt="" width={720} height={300}/></div>
      <DialogTitle className="modal-title">{t('cwTitle').replace('{continent}', t(region))}</DialogTitle>
      <DialogDescription>{t('cwSetupCopy')}</DialogDescription>
      <div className="cs-setting"><span id="cs-rounds">{t('rounds')}</span>
        <div className="segmented-pill" role="radiogroup" aria-labelledby="cs-rounds">{ROUNDS.map(n => <button key={n} type="button" role="radio" aria-checked={count === n} onClick={() => setCount(n)}>{n}</button>)}</div>
      </div>
      <div className="cs-setting"><span id="cs-level">{t('difficulty')}</span>
        <div className="segmented-pill" role="radiogroup" aria-labelledby="cs-level">{LEVELS.map(v => <button key={v} type="button" role="radio" aria-checked={difficulty === v} onClick={() => setDifficulty(v)}>{t(v === 'mixed' ? 'difficultyMixed' : v)}</button>)}</div>
      </div>
      <p className="lobby-level-hint">{t('lvlHint_' + difficulty)}</p>
      <fieldset className="cs-modes"><legend>{t('cwGames')}</legend>
        <div>{available.map(m => <button key={m} type="button" aria-pressed={chosen.includes(m)} disabled={chosen.length === 1 && chosen.includes(m)} onClick={() => toggle(m)}><GameIcon mode={m} size="sm"/><span>{t(m)}</span></button>)}</div>
        <small>{t('keepOneMode')}</small>
      </fieldset>
      <button className="btn primary btn-lg cs-go" disabled={busy} aria-busy={busy} onClick={go}>{t('cwStart')}<ArrowRight size={19} aria-hidden="true"/></button>
      <p className="cs-note">{t('cwNoPoints')}</p>
    </DialogContent>
  </Dialog>;
}

/** The day summary's main button after six games (1.35): learn this week's continent; the bonus tour comes after it. */
export function ContinentCTA() {
  const { t } = useApp();
  const { region, found, total } = useContinentWeek();
  const [open, setOpen] = useState(false);
  return <>
    <button className="btn primary btn-lg ds-continent" onClick={() => setOpen(true)}>
      <span><b>{t('cwLearn').replace('{continent}', t(region))}</b><small>{t('cwKicker')} · {found}/{total} {t('cwCountries')}</small></span>
      <ArrowRight size={19} aria-hidden="true"/>
    </button>
    <ContinentSetup open={open} onOpenChange={setOpen} region={region}/>
  </>;
}
