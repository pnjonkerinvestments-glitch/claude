'use client';
import { ArrowRight, X } from 'lucide-react';
import { useState } from 'react';
import { GlobeAvatar } from '../ds/GlobeAvatar';

/**
 * 1.52 · guests play under a name Roviko made up for them ("Swift Otter 42"). This asks them, kindly, to choose their
 * own name with a free account: on the result of the Daily Detour (and the other daily games) and on the home screen.
 * Never twice on one day, at most 4 times in all per device, and "Later" is always there. The sign-up keeps every point
 * and the streak (the guest's progress moves into the account).
 */
const KEY = 'roviko:name-prompt', MAX = 4;
type Asks = { n: number; day: string };
const read = (): Asks => { try { const v = JSON.parse(localStorage.getItem(KEY) ?? '{}'); return { n: Number(v.n) || 0, day: String(v.day ?? '') }; } catch { return { n: MAX, day: '' }; } };
const write = (a: Asks) => { try { localStorage.setItem(KEY, JSON.stringify(a)); } catch { /* shows again, harmless */ } };

/** Whether the prompt may show today. A "Later" (or a shown result card) counts as one ask for that day. */
export function useNamePrompt(guest: boolean, today: string) {
  const [asks] = useState<Asks>(() => typeof window === 'undefined' ? { n: MAX, day: '' } : read());
  const [hidden, setHidden] = useState(false);
  const show = guest && !hidden && asks.n < MAX && asks.day !== today;
  return { show, later: () => { write({ n: asks.n + 1, day: today }); setHidden(true); }, used: () => write({ n: asks.n + 1, day: today }) };
}

export function NamePrompt({ name, avatar, place, t, onChoose, onLater, compact = false }: { name: string; avatar: number; place?: number | null; t: (k: string) => string; onChoose: () => void; onLater: () => void; compact?: boolean }) {
  return <aside className={'name-prompt' + (compact ? ' is-compact' : '')} aria-labelledby="name-prompt-title">
    <span className="np-avatar" aria-hidden="true"><GlobeAvatar id={avatar} size={compact ? 46 : 58}/></span>
    <div className="np-text">
      <small className="np-kicker">{t('npKicker')}</small>
      <strong id="name-prompt-title">{t('npTitle').replace('{name}', name)}</strong>
      {!compact && <p>{place ? t('npPlace').replace('{rank}', String(place)).replace('{name}', name) + ' ' : ''}{t('npCopy')}</p>}
    </div>
    <div className="np-actions">
      <button className="btn secondary np-go" onClick={onChoose}>{t('npCta')}<ArrowRight size={17} aria-hidden="true"/></button>
      <button className="np-later" onClick={onLater} aria-label={t('npLater')}>{compact ? <X size={18} aria-hidden="true"/> : t('npLater')}</button>
    </div>
  </aside>;
}
