'use client';
import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Mascot } from '../ds/Mascot';

export const TOUR_KEY = 'roviko:tour';
export const tourSeen = () => { try { return localStorage.getItem(TOUR_KEY) === 'done'; } catch { return true; } };
const markSeen = () => { try { localStorage.setItem(TOUR_KEY, 'done'); } catch { /* shows again next visit, that is fine */ } };

type Step = { key: string; art?: string };
const STEPS: Step[] = [{ key: 'tourStep1' }, { key: 'tourStep2', art: '/art/world-trip-480.webp' }, { key: 'tourStep3', art: '/art/classic-480.webp' }, { key: 'tourStep4', art: '/art/rank-radar-480.webp' }];
const ACCOUNT: Step = { key: 'tourStep5', art: '/art/join-mascot.webp' };

/**
 * A short welcome for first-time visitors (and from the menu): what Roviko is, the daily trip, what comes
 * after it, the rankings, and for guests a last step with what a free account adds.
 */
export function WelcomeTour({ open, onOpenChange, guest, t, onStart, onSignup }: { open: boolean; onOpenChange: (v: boolean) => void; guest: boolean; t: (k: string) => string; onStart: () => void; onSignup: () => void }) {
  const steps = guest ? [...STEPS, ACCOUNT] : STEPS;
  const [i, setI] = useState(0);
  useEffect(() => { if (open) setI(0); }, [open]);
  const step = steps[i], last = i === steps.length - 1;
  const close = () => { markSeen(); onOpenChange(false); };
  return <Dialog open={open} onOpenChange={v => { if (!v) close(); }}>
    <DialogContent className="app-modal welcome-tour">
      <div className="tour-art" aria-hidden="true">{step.art ? <img src={step.art} alt="" width={480} height={270} decoding="async"/> : <Mascot mood="cheer" size={150}/>}</div>
      <p className="tour-step">{t('tourStepOf').replace('{n}', String(i + 1)).replace('{total}', String(steps.length))}</p>
      <DialogTitle className="modal-title">{t(step.key + 'Title')}</DialogTitle>
      <DialogDescription>{t(step.key + 'Copy')}</DialogDescription>
      {step === ACCOUNT && <ul className="tour-perks">{['tourPerk1', 'tourPerk2', 'tourPerk3', 'tourPerk4'].map(k => <li key={k}><Check size={16} strokeWidth={3} aria-hidden="true"/>{t(k)}</li>)}</ul>}
      <ol className="tour-dots" aria-hidden="true">{steps.map((s, n) => <li key={s.key} className={n === i ? 'is-on' : ''}/>)}</ol>
      {step === ACCOUNT
        ? <div className="tour-actions is-final"><button className="btn gold btn-lg" onClick={() => { close(); onSignup(); }}>{t('tourSignup')}<ArrowRight size={18} aria-hidden="true"/></button><button className="btn ghost" onClick={() => { close(); onStart(); }}>{t('tourGuest')}</button></div>
        : <div className="tour-actions">
            {i > 0 ? <button className="btn ghost" onClick={() => setI(i - 1)}><ArrowLeft size={17} aria-hidden="true"/>{t('tourBack')}</button> : <button className="btn ghost" onClick={close}>{t('tourSkip')}</button>}
            {last ? <button className="btn primary" onClick={() => { close(); onStart(); }}>{t('tourStart')}<ArrowRight size={17} aria-hidden="true"/></button> : <button className="btn primary" onClick={() => setI(i + 1)}>{t('tourNext')}<ArrowRight size={17} aria-hidden="true"/></button>}
          </div>}
    </DialogContent>
  </Dialog>;
}
