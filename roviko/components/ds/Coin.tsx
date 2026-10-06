'use client';
import React, { useEffect, useRef, useState } from 'react';
import { formatScore } from '@/lib/client';

/** A small gold coin with Roviko's R, for scores. Decorative: the number next to it carries the meaning. */
export function Coin({ size = 22, className = '' }: { size?: number; className?: string }) {
  return <svg className={'coin' + (className ? ' ' + className : '')} viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false">
    <circle cx="12" cy="12" r="11" fill="#E9A23B"/>
    <circle cx="12" cy="11" r="10" fill="#F6B84B"/>
    <circle cx="12" cy="11" r="7.4" fill="none" stroke="#E29A2E" strokeWidth="1.4"/>
    <path d="M9.6 15.2V7.4h2.9c1.7 0 2.7.9 2.7 2.3 0 1-.5 1.7-1.4 2l1.7 3.5h-1.9l-1.5-3.2h-.8v3.2z M11.3 10.6h1.1c.6 0 1-.3 1-.9s-.4-.9-1-.9h-1.1z" fill="#B66F12"/>
    <ellipse cx="8.4" cy="6.6" rx="2.2" ry="1.1" fill="#fff" opacity=".45" transform="rotate(-28 8.4 6.6)"/>
  </svg>;
}

/**
 * The white score pill of every game: a coin and the points so far. When the score goes up, the pill pops
 * and the gain floats up from it ("+50"). Only presentation: the number is whatever the game already shows.
 */
export function CoinPill({ value, label, className = '' }: { value: number; label: string; className?: string }) {
  const last = useRef(value), [gain, setGain] = useState<{ n: number; key: number } | null>(null);
  useEffect(() => {
    const diff = value - last.current;
    last.current = value;
    if (diff > 0) setGain(g => ({ n: diff, key: (g?.key ?? 0) + 1 }));
  }, [value]);
  return <span className={'coin-pill' + (gain ? ' is-gain' : '') + (className ? ' ' + className : '')} key={gain?.key ?? 0} aria-label={label}>
    <Coin size={22}/><b aria-hidden="true">{formatScore(value)}</b>
    {gain && <span className="coin-gain" aria-hidden="true">+{formatScore(gain.n)}</span>}
  </span>;
}

/** The streak flame, two-tone, for the gold streak pill. Decorative. */
export function FlameMark({ size = 20, off = false }: { size?: number; off?: boolean }) {
  return <svg className={'flame-mark' + (off ? ' is-off' : '')} viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false">
    <path d="M12.2 1.8c.7 3.3-1.1 5-2.8 6.8C7.7 10.4 6 12.2 6 15c0 4 2.7 7.2 6 7.2s6.1-3 6.1-7c0-2.4-1-4.2-2.4-5.7.1 1.7-.5 3-1.6 3.5.4-3.9-.8-8.2-1.9-11.2z" fill={off ? '#E4C9A8' : '#F0642B'}/>
    <path d="M12.1 22.2c-2.1 0-3.6-1.6-3.6-3.8 0-2.1 1.6-3.2 2.7-4.7.3 1.3 1 2.1 2 2.4-.2-1.1.2-2.1.9-2.7 1 1.3 1.6 2.7 1.6 4.4 0 2.5-1.5 4.4-3.6 4.4z" fill={off ? '#F3E3CC' : '#FFC93D'}/>
  </svg>;
}
