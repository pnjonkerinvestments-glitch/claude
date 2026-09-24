'use client';
import React from 'react';
import { Compass, type LucideIcon } from 'lucide-react';
import { useApp } from '../app/context';

/**
 * Shared page states. Loading reserves the space the content will take (no layout shift),
 * empty and error states always offer a way on.
 */

export function Skeleton({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return <span className={'sk ' + className} style={style} aria-hidden="true"/>;
}

type SkeletonVariant = 'page' | 'game' | 'list' | 'cards' | 'passport';
/** A calm placeholder in the shape of the page that is on its way. */
export function PageSkeleton({ variant = 'page', label }: { variant?: SkeletonVariant; label?: string }) {
  const app = useApp();
  const text = label ?? app?.t('loading') ?? 'Loading';
  const rows = (n: number, cls: string) => Array.from({ length: n }, (_, i) => <Skeleton key={i} className={cls}/>);
  return <div className={'page-skeleton sk-' + variant} role="status" aria-live="polite" aria-busy="true">
    <span className="sr-only">{text}</span>
    {variant === 'game' ? <>
      <div className="sk-row"><Skeleton className="sk-circle"/><Skeleton className="sk-line sk-w40"/><Skeleton className="sk-pill"/></div>
      <Skeleton className="sk-bar"/>
      <Skeleton className="sk-block sk-tall"/>
      <div className="sk-grid sk-grid-2">{rows(4, 'sk-block sk-option')}</div>
    </> : <>
      <div className="sk-head"><Skeleton className="sk-line sk-w20"/><Skeleton className="sk-title"/><Skeleton className="sk-line sk-w60"/></div>
      {variant === 'passport' && <Skeleton className="sk-block sk-hero"/>}
      {variant === 'list' ? <div className="sk-list">{rows(6, 'sk-block sk-list-row')}</div>
        : <div className="sk-grid">{rows(variant === 'cards' ? 9 : 6, 'sk-block sk-card')}</div>}
    </>}
  </div>;
}

/** Nothing here yet: says what the place is for and what to do next. */
export function EmptyState({ title, copy, icon: Icon = Compass, art, children, className = '' }: { title: React.ReactNode; copy?: React.ReactNode; icon?: LucideIcon; art?: React.ReactNode; children?: React.ReactNode; className?: string }) {
  return <div className={'state state-empty ' + className}>
    {art ?? <span className="state-icon" aria-hidden="true"><Icon size={28} strokeWidth={2}/></span>}
    <h2 className="state-title">{title}</h2>
    {copy && <p className="state-copy">{copy}</p>}
    {children && <div className="state-actions">{children}</div>}
  </div>;
}

/** Something went wrong: human words, a retry and a way back. */
export function ErrorState({ title, copy, onRetry, retryLabel, children }: { title: React.ReactNode; copy?: React.ReactNode; onRetry?: () => void; retryLabel?: string; children?: React.ReactNode }) {
  return <div className="state state-error" role="alert">
    <span className="state-icon" aria-hidden="true"><img src="/globe-logo.webp" alt="" width={56} height={56} className="state-globe"/></span>
    <h2 className="state-title">{title}</h2>
    {copy && <p className="state-copy">{copy}</p>}
    <div className="state-actions">{onRetry && <button className="btn primary" onClick={onRetry}>{retryLabel}</button>}{children}</div>
  </div>;
}

/** Heading for a page section, with an optional quiet link on the right. */
export function SectionHeader({ id, title, kicker, action }: { id?: string; title: React.ReactNode; kicker?: React.ReactNode; action?: React.ReactNode }) {
  return <div className="section-header">
    <div>{kicker && <p className="kicker">{kicker}</p>}<h2 id={id}>{title}</h2></div>
    {action}
  </div>;
}

/** Page title block: small kicker, one H1, one calm sentence. */
export function PageHeader({ kicker, title, lead, art, children }: { kicker?: React.ReactNode; title: React.ReactNode; lead?: React.ReactNode; art?: string; children?: React.ReactNode }) {
  return <header className={'page-header' + (art ? ' has-art' : '')}>
    {art && <img className="page-header-art" src={'/art/' + art + '.webp'} alt="" aria-hidden="true" decoding="async" fetchPriority="high"/>}
    {kicker && <p className="kicker">{kicker}</p>}
    <h1>{title}</h1>
    {lead && <p className="lead">{lead}</p>}
    {children}
  </header>;
}
