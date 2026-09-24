'use client';
import React from 'react';
import { Anchor, Bird, Check, Compass, Leaf, Mountain, Rocket, Ship, Sunrise } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { BRAND } from '@/lib/config';
import { GameIcon } from '../atelier/GameIcon';
import { useApp } from './context';
export { EmptyState as Empty, PageSkeleton as Loading } from '../ds/States';

export const avatars = [Compass, Rocket, Mountain, Anchor, Leaf, Bird, Sunrise, Ship];
export function Avatar({ id = 0, size = '', name }: { id?: number; size?: string; name?: string }) {
    const emoji = ['🧭', '🚀', '🏔️', '⚓', '🌿', '🦜', '🌅', '⛵'][id % 8] ?? '🧭';
    return <span className={'avatar avatar-' + id + ' ' + size} aria-label={name}><span className="avatar-emoji" aria-hidden="true">{emoji}</span></span>;
}
export function ModeEmoji({ mode }: { mode: string }) { return <GameIcon mode={mode} className="mode-emoji"/>; }
export function Logo() { return <span className="logo"><img src="/globe-logo.webp" alt=""/><span>{BRAND.name.toLowerCase()}<span className="logo-period">.</span></span></span>; }
export function A({ href, children, className = '', ...rest }: any) { const { go } = useApp(); return <a href={href} className={className} onClick={e => { if (!e.metaKey && !e.ctrlKey && !e.shiftKey) {
    e.preventDefault();
    go(href);
} }} {...rest}>{children}</a>; }
export function Choice({ label, value, onChange, options, disabled = false }: {
    label: string;
    value: string | number;
    onChange: (v: string) => void;
    options: any[];
    disabled?: boolean;
}) { return <label className="field"><span>{label}</span><Select value={String(value)} onValueChange={onChange} disabled={disabled}><SelectTrigger className="select-trigger" aria-label={label}><SelectValue /></SelectTrigger><SelectContent>{options.map(o => <SelectItem key={typeof o === 'string' ? o : o.value} value={String(typeof o === 'string' ? o : o.value)}>{typeof o === 'string' ? o : o.label}</SelectItem>)}</SelectContent></Select></label>; }
export function AvatarPicker({ value, onChange }: any) { const { t } = useApp(); return <fieldset className="avatar-picker"><legend>{t('avatar')}</legend><div>{avatars.map((Icon, i) => <button type="button" key={i} className={value === i ? 'selected' : ''} aria-label={t('avatar') + ' ' + (i + 1)} aria-pressed={value === i} onClick={() => onChange(i)}><Avatar id={i}/>{value === i && <Check size={12}/>}</button>)}</div></fieldset>; }
