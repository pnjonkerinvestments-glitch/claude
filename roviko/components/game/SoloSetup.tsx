'use client';
import React from 'react';
import { Switch } from '@/components/ui/switch';
import { REGIONS } from '@/lib/config';

/**
 * 1.43: the choices for a classic game, shown straight away when you pick it: where (a continent or the world),
 * how hard, and how many questions, with "All" (count 0: every country of the region once).
 */
export type SoloSettings = { mode: string; count: number; difficulty: string; region: string; typed?: boolean; [k: string]: unknown };
export function SoloSetup({ value, onChange, t }: { value: SoloSettings; onChange: (v: SoloSettings) => void; t: (k: string) => string }) {
  const set = (k: string, v: unknown) => onChange({ ...value, [k]: v });
  const group = (id: string, label: string, items: { v: string | number; label: string }[], current: unknown, key: string, cls = '') =>
    <fieldset className={'setup-group ' + cls} aria-labelledby={id}>
      <legend id={id}>{label}</legend>
      <div className="setup-chips">{items.map(i => <button key={String(i.v)} type="button" aria-pressed={current === i.v} className={'setup-chip' + (current === i.v ? ' is-on' : '')} onClick={() => set(key, i.v)}>{i.label}</button>)}</div>
    </fieldset>;
  return <div className="solo-setup">
    {group('setup-where', t('setupWhere'), REGIONS.map(r => ({ v: r, label: t(r) })), value.region, 'region', 'is-regions')}
    {group('setup-level', t('setupLevel'), ['easy', 'medium', 'hard', 'mixed'].map(d => ({ v: d, label: t(d === 'mixed' ? 'difficultyMixed' : d) })), value.difficulty, 'difficulty')}
    {group('setup-count', t('setupCount'), [5, 10, 20, 0].map(n => ({ v: n, label: n ? String(n) : t('setupAll') })), value.count, 'count', 'is-count')}
    {value.count === 0 && <p className="setup-all-note">{t('setupAllNote').replace('{region}', value.region === 'World' ? t('setupWorld') : t(value.region))}</p>}
    {value.mode === 'capitals' && <div className="switch-field"><div><label htmlFor="typed-choice">{t('typed')}</label><p>{t('typedHelp')}</p></div><Switch id="typed-choice" checked={!!value.typed} onCheckedChange={v => set('typed', v)}/></div>}
  </div>;
}
