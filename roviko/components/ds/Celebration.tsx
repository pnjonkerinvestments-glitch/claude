'use client';
import React, { useEffect, useState } from 'react';
import { Crown, Flame, Sparkles, Star } from 'lucide-react';

export type Stage = { key: 'points' | 'best' | 'streak' | 'quest'; text: string };
const ICONS = { points: Sparkles, best: Star, streak: Flame, quest: Crown };

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!query) return;
    const update = () => setReduced(query.matches);
    update(); query.addEventListener?.('change', update);
    return () => query.removeEventListener?.('change', update);
  }, []);
  return reduced;
}

/** Counts up to a number once, quickly; shows it straight away when motion is reduced. */
export function CountUp({ value, format }: { value: number; format: (n: number) => string }) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (reduced || value <= 0) return;
    let frame = 0; const start = performance.now(), duration = 700;
    const tick = (now: number) => { const p = Math.min(1, (now - start) / duration); setShown(Math.round(value * (1 - (1 - p) ** 3))); if (p < 1) frame = requestAnimationFrame(tick); };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, reduced]);
  return <>{format(reduced || value <= 0 ? value : shown)}</>;
}

/**
 * A staged, calm celebration after a daily game: points first, then a personal best,
 * then the streak, then a finished quest. Each stage arrives a beat after the previous one;
 * with reduced motion they are simply there. Screen readers hear one polite summary.
 */
export function Celebration({ stages, points, format }: { stages: Stage[]; points?: number; format: (n: number) => string }) {
  if (!stages.length) return null;
  return <div className="celebration" role="status" aria-live="polite">
    <span className="sr-only">{stages.map(s => s.text).join('. ')}</span>
    {stages.map((s, i) => { const Icon = ICONS[s.key]; return <span key={s.key} className={'celebrate-chip is-' + s.key} style={{ animationDelay: i * 450 + 'ms' }} aria-hidden="true">
      <Icon size={s.key === 'points' ? 22 : 18} strokeWidth={2.3}/>
      {s.key === 'points' && points !== undefined ? <b>+<CountUp value={points} format={format}/></b> : null}
      <span>{s.key === 'points' && points !== undefined ? s.text.replace(/^\+?[\d.,\s]+/, '') : s.text}</span>
    </span>; })}
  </div>;
}
