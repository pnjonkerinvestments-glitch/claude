'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, Flame, ShieldCheck } from 'lucide-react';
import { GameIcon } from './GameIcon';
import { api, post } from '@/lib/client';
import { DEFAULT_SETTINGS } from '@/lib/config';
import { DAY_MODES, STREAK_MILESTONES, completedDailies, dailyStateOf, nextDailyMode, streakMilestone, type DayMode } from '@/lib/daily-loop';
import { ResetCountdown } from './ResetCountdown';
import { DailyQuests } from './DailyQuests';

export const DAILY_EMOJI: Record<DayMode, string> = { rank: '🎯', daily: '✈️', duel: '⚔️', compare: '⚖️', mosaic: '🧩', trail:'🧭' };
export const dailyTitleKey = (mode: DayMode) => mode === 'daily' ? 'dailyTitle' : mode === 'trail' ? 'dailyTrail' : mode === 'rank' ? 'rankRadar' : mode === 'duel' ? 'duel' : mode;

/** Shown when a daily game is finished: today's streak, what is still open and a direct way on. */
export function DailyLoop({ app }: { app: any }) {
  const { t, locale, boot, go, fail, start } = app;
  const [today, setToday] = useState<{ date: string; sessions: { mode: string; completed?: boolean }[]; tomorrowTopic?: { emoji?: string; label: Record<string, string> } } | null>(null), [busy, setBusy] = useState(false);
  const lock = useRef(false);
  useEffect(() => { let active = true; api('/puzzles/today?competition=1').then(s => { if (active) setToday(s); }).catch(() => {}); return () => { active = false; }; }, [boot.stats.dailyStreak, boot.stats.dailyCount]);
  if (!today) return null;
  const streak = boot.stats.dailyStreak ?? 0, done = completedDailies(today.sessions), left = DAY_MODES.length - done;
  const next = nextDailyMode(today.sessions), goal = streakMilestone(streak);
  const freeze = boot.stats.streakFreezes as { available: number; nextIn: number } | undefined;
  async function launch(mode: DayMode) {
    if (lock.current) return; lock.current = true; setBusy(true);
    try {
      if (mode === 'daily' || mode === 'trail') await start({ ...DEFAULT_SETTINGS, mode: mode==='trail'?'daily-trail':'daily' });
      else if (mode === 'duel') go('/duel');
      else { const game = await post(mode === 'rank' ? '/ranks' : '/puzzles', { mode, daily: true, competition:true }); go((mode === 'rank' ? '/rank/' : '/puzzle/') + game.id); }
    } catch (e) { fail(e); } finally { lock.current = false; setBusy(false); }
  }
  return <section className={'daily-loop' + (next ? '' : ' is-complete')} aria-labelledby="daily-loop-title">
    <div className="loop-streak">
      <span className="loop-flame" aria-hidden="true"><Flame size={26} strokeWidth={2.2}/></span>
      <div className="loop-streak-copy">
        <strong><b>{streak}</b> {t('loopStreakLabel')}</strong>
        {STREAK_MILESTONES.includes(streak) && boot.stats.dailyDone
          ? <span className="loop-milestone-hit">🏅 {t('loopMilestoneHit').replace('{n}', String(streak))}</span>
          : <span className="loop-goal"><span className="goal-bar" aria-hidden="true"><i style={{ width: goal.progress * 100 + '%' }}/></span>{t('heroStreakGoal').replace('{n}', String(goal.remaining)).replace('{target}', String(goal.target))}</span>}
        {freeze && <span className="loop-freeze" title={t('freezeExplain')}><ShieldCheck size={14} strokeWidth={2.6} aria-hidden="true"/>{freeze.available ? t('freezeReady').replace('{n}', String(freeze.available)) + ' · ' : ''}{freeze.nextIn ? t('freezeNext').replace('{n}', String(freeze.nextIn)) : t('freezeFull')}</span>}
      </div>
    </div>
    <h2 id="daily-loop-title">{!next ? t('loopAllDone') : left === 1 ? t('loopTitleOne') : t('loopTitle').replace('{n}', String(left))}</h2>
    <ol className="loop-games">
      {DAY_MODES.map(mode => { const state = dailyStateOf(today.sessions, mode); return <li key={mode} className={'state-' + state}>
        <span className="loop-game-icon" aria-hidden="true">{state === 'done' ? <Check size={16} strokeWidth={2.6}/> : <GameIcon mode={mode} size="sm"/>}</span>
        <span>{t(dailyTitleKey(mode))}</span>
        <span className="sr-only">{t(state === 'done' ? 'dailyDoneState' : state === 'active' ? 'dailyActiveState' : 'dailyNewState')}</span>
      </li>; })}
    </ol>
    <DailyQuests compact date={today.date} sessions={today.sessions} t={t}/>
    {next
      ? <button className="btn hero-cta loop-next" disabled={busy || app.busy} onClick={() => launch(next)}>{busy ? t('loading') : t('loopNext').replace('{game}', t(dailyTitleKey(next)))}<ArrowRight size={20}/></button>
      : <div className="loop-reset"><ResetCountdown label={t('heroResetIn')} t={t}/>{today.tomorrowTopic && <p>{t('loopTomorrow').replace('{topic}', (today.tomorrowTopic.emoji ? today.tomorrowTopic.emoji + ' ' : '') + today.tomorrowTopic.label[locale])}</p>}</div>}
  </section>;
}
