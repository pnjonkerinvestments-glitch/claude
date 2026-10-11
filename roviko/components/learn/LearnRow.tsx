'use client';
import { ChevronRight } from 'lucide-react';
import { dueEverywhere, localDay, routeFor, routeState } from '@/lib/learn';
import { RovikoIcon } from '../ds/RovikoIcons';
import { useApp } from '../app/context';
import { A } from '../app/shared';
import { routeTitle } from './LearnPage';
import { useLearn, useLearnPick } from './useLearn';

/** The way into Learn on the home page (1.38): the route you were on, how far you are, and what waits for review. */
export function LearnRow() {
  const { t } = useApp();
  const { progress, ready } = useLearn();
  const [pick] = useLearnPick();
  const today = localDay(), route = routeFor(pick.topic, pick.continent), s = routeState(route, progress, today), due = dueEverywhere(progress, today);
  const sub = t('learnHomeSub').replace('{route}', routeTitle(t, route)).replace('{n}', String(s.learned)).replace('{total}', String(s.total));
  return <A href="/learn" className="side-row side-learn">
    <span className="side-icon" aria-hidden="true"><RovikoIcon name="graduation" size={26}/></span>
    <span className="side-copy"><strong>{t('learnTab')}</strong><small>{sub}</small></span>
    {ready && due > 0 && <b className="learn-due" aria-label={t('learnHomeDue').replace('{n}', String(due))}>{due > 99 ? '99+' : due}</b>}
    <ChevronRight size={18} aria-hidden="true"/>
  </A>;
}
