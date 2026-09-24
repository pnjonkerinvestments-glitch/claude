import React from 'react';
import { Check } from 'lucide-react';
import { GameIcon } from '../atelier/GameIcon';
import type { DailyMode, DailyState } from '@/lib/daily-loop';

type Stop = { mode: DailyMode; name: string; state: DailyState; points?: number };

/** Today's five daily games as stops on one route. Finished stops are ticked, the next one is ringed. State is always in text too, never colour alone. */
export function ProgressRoute({ stops, next, onOpen, disabled, t, format }: { stops: Stop[]; next: DailyMode | null; onOpen: (mode: DailyMode) => void; disabled?: boolean; t: (key: string) => string; format: (n: number) => string }) {
  return <ol className="route">
    {stops.map((stop, i) => {
      const isNext = stop.mode === next;
      const state = t(stop.state === 'done' ? 'journeyStopDone' : stop.state === 'active' ? 'journeyStopActive' : 'journeyStopNew');
      return <li key={stop.mode} className={'route-stop is-' + stop.state + (isNext ? ' is-next' : '')} aria-current={isNext ? 'step' : undefined}>
        <button type="button" onClick={() => onOpen(stop.mode)} disabled={disabled} aria-label={`${i + 1}. ${stop.name} · ${state}${stop.points !== undefined ? ' · ' + t('journeyPoints').replace('{n}', format(stop.points)) : ''}`}>
          <span className="route-dot" aria-hidden="true">{stop.state === 'done' ? <Check size={20} strokeWidth={3}/> : <GameIcon mode={stop.mode} size="sm"/>}</span>
          <span className="route-name">{stop.name}</span>
          <span className="route-meta" aria-hidden="true">{stop.state === 'done' && stop.points !== undefined ? t('journeyPoints').replace('{n}', format(stop.points)) : state}</span>
        </button>
      </li>;
    })}
  </ol>;
}
