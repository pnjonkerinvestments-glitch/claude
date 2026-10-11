'use client';
import { ChevronRight } from 'lucide-react';
import { ROUTES, localDay, routeState } from '@/lib/learn';
import { RovikoIcon } from '../ds/RovikoIcons';
import { useApp } from '../app/context';
import { A } from '../app/shared';
import { useLearn } from './useLearn';

/** The way into Learn on the home page (1.38): how far you are and, when there is one, the review pile. */
export function LearnRow() {
  const { t } = useApp();
  const { progress, ready } = useLearn();
  const s = routeState(ROUTES[0], progress, localDay());
  const sub = t('learnHomeSub').replace('{n}', String(s.learned)).replace('{total}', String(s.total));
  return <A href="/learn" className="side-row side-learn">
    <span className="side-icon" aria-hidden="true"><RovikoIcon name="graduation" size={26}/></span>
    <span className="side-copy"><strong>{t('learnTab')}</strong><small>{sub}</small></span>
    {ready && s.due.length > 0 && <b className="learn-due" aria-label={t('learnHomeDue').replace('{n}', String(s.due.length))}>{s.due.length > 99 ? '99+' : s.due.length}</b>}
    <ChevronRight size={18} aria-hidden="true"/>
  </A>;
}
