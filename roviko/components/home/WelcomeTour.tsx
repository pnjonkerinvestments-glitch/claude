'use client';
import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Character, type CharacterMood, type CharacterPose } from '../ds/Character';
import { FlameMark } from '../ds/Coin';
import { RovikoIcon, type RovikoIconName } from '../ds/RovikoIcons';

export const TOUR_KEY = 'roviko:tour';
export const tourSeen = () => { try { return localStorage.getItem(TOUR_KEY) === 'done'; } catch { return true; } };
const markSeen = () => { try { localStorage.setItem(TOUR_KEY, 'done'); } catch { /* shows again next visit, that is fine */ } };

type Where = [RovikoIconName, string];
type Step = { key: string; art?: string; mascot?: [CharacterMood, CharacterPose]; flame?: boolean; where?: Where[]; perks?: string[] };
/**
 * The tour (1.32), in the order you play: what Roviko is, the Daily Detour, the five daily games, the streak, the
 * rankings, the extra games, exploring, multiplayer. Guests end on a free account; signed-in players on today's trip.
 */
const STEPS: Step[] = [
  { key: 'g1', mascot: ['cheer', 'wave'] },
  { key: 'g2', art: '/art/world-trip-480.webp', where: [['play', 'play']] },
  { key: 'g3', art: '/art/duel-480.webp', where: [['play', 'play']] },
  { key: 'g4', mascot: ['happy', 'cheer'], flame: true, where: [['play', 'play']] },
  { key: 'g5', art: '/art/rank-radar-480.webp', where: [['trophy', 'gRankings']] },
  { key: 'g6', art: '/art/classic-480.webp', where: [['play', 'play']] },
  { key: 'g7', art: '/art/explore-hero.webp', where: [['explore', 'explore'], ['passport', 'navPassport']] },
  { key: 'g8', art: '/art/friends-row.webp', where: [['multiplayer', 'navMultiplayer']] },
];
const ACCOUNT: Step = { key: 'g9', mascot: ['wink', 'point'], perks: ['g9Perk1', 'g9Perk2', 'g9Perk3', 'g9Perk4'] };
const READY: Step = { key: 'g10', mascot: ['cheer', 'cheer'] };

/**
 * The welcome tour: on the first visit and from the menu. One short card per part of Roviko with a picture and
 * where to find it. Guests are asked for a free account on the last card (and can log in from the first one).
 */
export function WelcomeTour({ open, onOpenChange, guest, t, onStart, onSignup, onLogin }: { open: boolean; onOpenChange: (v: boolean) => void; guest: boolean; t: (k: string) => string; onStart: () => void; onSignup: () => void; onLogin?: () => void }) {
  const steps = [...STEPS, guest ? ACCOUNT : READY];
  const [i, setI] = useState(0);
  useEffect(() => { if (open) setI(0); }, [open]);
  const step = steps[i], last = i === steps.length - 1;
  const close = () => { markSeen(); onOpenChange(false); };
  const go = (n: number) => setI(Math.max(0, Math.min(steps.length - 1, n)));
  return <Dialog open={open} onOpenChange={v => { if (!v) close(); }}>
    <DialogContent className="app-modal welcome-tour" showCloseButton={false} onOpenAutoFocus={e => e.preventDefault()} onKeyDown={e => { if (e.key === 'ArrowRight' && !last) go(i + 1); if (e.key === 'ArrowLeft') go(i - 1); }}>
      {!last && <button type="button" className="tour-skip text-link" onClick={close}>{t('tourSkip')}</button>}
      <div className={'tour-art' + (step.mascot ? ' is-mascot' : '')} aria-hidden="true" key={step.key}>
        {step.mascot ? <><Character mood={step.mascot[0]} pose={step.mascot[1]} size={150}/>{step.flame && <span className="tour-flame"><FlameMark size={44}/></span>}</> : <img src={step.art} alt="" width={480} height={270} decoding="async"/>}
      </div>
      <p className="tour-step">{t('tourStepOf').replace('{n}', String(i + 1)).replace('{total}', String(steps.length))}</p>
      <DialogTitle className="modal-title">{t(step.key + 'Title')}</DialogTitle>
      <DialogDescription>{t(step.key + 'Copy')}</DialogDescription>
      {step.where && <p className="tour-where"><span>{t('gWhere')}</span>{step.where.map(([icon, label]) => <b key={label}><RovikoIcon name={icon} size={18}/>{t(label)}</b>)}</p>}
      {step.perks && <ul className="tour-perks">{step.perks.map(k => <li key={k}><Check size={16} strokeWidth={3} aria-hidden="true"/>{t(k)}</li>)}</ul>}
      <ol className="tour-dots" aria-hidden="true">{steps.map((s, n) => <li key={s.key} className={n === i ? 'is-on' : n < i ? 'is-past' : ''}/>)}</ol>
      {step === ACCOUNT
        ? <div className="tour-actions is-final"><button className="btn gold btn-lg" onClick={() => { close(); onSignup(); }}>{t('gSignup')}<ArrowRight size={18} aria-hidden="true"/></button><button className="btn ghost" onClick={() => { close(); onStart(); }}>{t('gLater')}</button></div>
        : step === READY
        ? <div className="tour-actions is-final"><button className="btn primary btn-lg" onClick={() => { close(); onStart(); }}>{t('gStart')}<ArrowRight size={18} aria-hidden="true"/></button><button className="btn ghost" onClick={() => go(i - 1)}><ArrowLeft size={17} aria-hidden="true"/>{t('tourBack')}</button></div>
        : i === 0
        ? <div className="tour-actions is-final"><button className="btn primary btn-lg" onClick={() => go(1)}>{t('gLetsGo')}<ArrowRight size={18} aria-hidden="true"/></button>{guest && onLogin && <button className="btn ghost" onClick={() => { close(); onLogin(); }}>{t('gHaveAccount')}</button>}</div>
        : <div className="tour-actions">
            <button className="btn ghost" onClick={() => go(i - 1)}><ArrowLeft size={17} aria-hidden="true"/>{t('tourBack')}</button>
            <button className="btn primary" onClick={() => go(i + 1)}>{t('tourNext')}<ArrowRight size={17} aria-hidden="true"/></button>
          </div>}
    </DialogContent>
  </Dialog>;
}
