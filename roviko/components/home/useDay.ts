'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/client';

export type DaySession = { id?: string; mode: string; completed?: boolean; round?: number; total?: number };
export type TodayState = { date: string; sessions: DaySession[]; week?: { date: string; completed: boolean }[]; tomorrowTopic?: { emoji: string; label: Record<'en' | 'nl' | 'es', string> } };
type Standing = { participants: number; score: number; place: number | null; games: number; next?: { name: string; score: number; place: number; gap: number } | null; leaders: { name: string; avatar: number; score: number; place: number; me: number | boolean }[] };
export type CompetitionState = { date: string; today: Standing; total: Standing; week?: Standing; weekStart?: string; friends?: Standing | null; scores: { mode: string; score: number }[]; personalBest?: Record<string, { best: number; plays: number }>; bestDay?: number | null; yesterday?: { score: number; games: number }; maxPerGame: number; maxPerDay: number };
type Player = { user: { id: string } };

const untilReset = () => 86400000 - Date.now() % 86400000 + 600;

/**
 * Loads one daily endpoint for the signed-in (or guest) player, reloads it when the tab
 * becomes visible again and right after the 00:00 UTC reset.
 */
function useDaily<T>(path: string, player: Player, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null), [error, setError] = useState(false), [reload, setReload] = useState(0);
  useEffect(() => {
    if (!player.user.id) return;
    let active = true, version = 0, timer: ReturnType<typeof setTimeout>;
    const load = async () => {
      clearTimeout(timer); const mine = ++version;
      try { const result = await api(path); if (active && mine === version) { setData(result); setError(false); } }
      catch { if (active && mine === version) setError(true); }
      if (active && mine === version) timer = setTimeout(load, untilReset());
    };
    const visible = () => { if (document.visibilityState === 'visible') load(); };
    load(); document.addEventListener('visibilitychange', visible);
    return () => { active = false; clearTimeout(timer); document.removeEventListener('visibilitychange', visible); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player.user.id, path, reload, ...deps]);
  return { data, error, retry: () => setReload(n => n + 1) };
}

/** Today's five daily games and how far the player got with each. */
export const useToday = (player: Player) => useDaily<TodayState>('/puzzles/today?competition=1', player);
/** Today's points, all-time points and both rankings. */
export const useCompetition = (player: Player, date?: string) => useDaily<CompetitionState>('/competition' + (date ? '?date=' + date : '?'), player, [date]);

/** "3h 42m" until the next daily games, in the page language. Null until mounted, so server and client agree. */
export function useResetLabel(t: (key: string) => string) {
  const [ms, setMs] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setMs(86400000 - Date.now() % 86400000);
    tick(); const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);
  if (ms === null) return null;
  const minutes = Math.max(1, Math.ceil(ms / 60000)), h = Math.floor(minutes / 60), m = minutes % 60;
  return (h ? t('durHM').replace('{h}', String(h)) : t('durM')).replace('{m}', String(m));
}
