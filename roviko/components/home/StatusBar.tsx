import React from 'react';
import { Crown, Flame, ShieldCheck, Sparkles } from 'lucide-react';
import { Skeleton } from '../ds/States';

/** Streak in one calm line. The shield only shows up once the player has one. */
export function StreakIndicator({ streak, shields = 0, atRisk = false, t }: { streak: number; shields?: number; atRisk?: boolean; t: (key: string) => string }) {
  return <span className={'status-item status-streak' + (atRisk ? ' is-at-risk' : '') + (streak > 0 ? ' is-on' : '')}>
    <Flame size={18} strokeWidth={2.3} aria-hidden="true"/>
    <span>{streak > 0 ? t('statusStreak').replace('{n}', String(streak)) : t('statusStreakZero')}</span>
    {shields > 0 && <span className="status-shield" title={t('freezeExplain')}><ShieldCheck size={14} strokeWidth={2.6} aria-hidden="true"/><span className="sr-only">{t('freezeReady').replace('{n}', String(shields))}</span><span aria-hidden="true">{shields}</span></span>}
  </span>;
}

export function QuestIndicator({ done, onOpen, t }: { done: number; onOpen: () => void; t: (key: string) => string }) {
  return <button type="button" className={'status-item status-quests' + (done === 3 ? ' is-complete' : '')} onClick={onOpen} aria-haspopup="dialog">
    <Crown size={18} strokeWidth={2.3} aria-hidden="true"/><span>{t('statusQuests').replace('{n}', String(done))}</span>
  </button>;
}

/** Streak · quests · points, in one compact row. Values appear only once they are known, in space already reserved for them. */
export function StatusBar({ ready, streak, shields, atRisk, quests, points, onQuests, onPoints, t, format }: { ready: boolean; streak: number; shields?: number; atRisk?: boolean; quests: number; points: number | null; onQuests: () => void; onPoints: () => void; t: (key: string) => string; format: (n: number) => string }) {
  return <section className="status-bar" aria-label={t('statusLabel')}>
    {ready ? <>
      <StreakIndicator streak={streak} shields={shields} atRisk={atRisk} t={t}/>
      <span className="status-sep" aria-hidden="true"/>
      <QuestIndicator done={quests} onOpen={onQuests} t={t}/>
      <span className="status-sep" aria-hidden="true"/>
      <button type="button" className="status-item status-points" onClick={onPoints}><Sparkles size={18} strokeWidth={2.3} aria-hidden="true"/><span>{t('statusPoints').replace('{n}', points === null ? '0' : format(points))}</span></button>
    </> : <><Skeleton className="sk-pill sk-status"/><Skeleton className="sk-pill sk-status"/><Skeleton className="sk-pill sk-status"/></>}
  </section>;
}
