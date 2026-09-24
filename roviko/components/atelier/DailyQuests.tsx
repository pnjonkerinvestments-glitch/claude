'use client';
import { useSyncExternalStore } from 'react';
import { Check, ChevronRight, Crown, Flame, Gift, Target } from 'lucide-react';
import { GameIcon } from './GameIcon';
import { addCrown, allQuestsDone, questsFor, type Quest } from '@/lib/daily-quests';
export type { Quest };
import { dailyTitleKey } from './DailyLoop';
import { ResetCountdown } from './ResetCountdown';

const CROWNS = 'roviko:crowns';
function readJson<T>(key: string, fallback: T): T { try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback; } catch { return fallback; } }
/** Progress kept in this browser: the mystery answer, the duel and the crowns. One string, so React can compare snapshots. */
function localSnapshot(date: string) {
  const mystery = readJson<{ picked?: string | null }>('roviko:mystery:' + date, {}).picked != null;
  const duel = readJson<unknown[]>('roviko:duel:' + date, []).length >= 5;
  const crowns = readJson<string[]>(CROWNS, []);
  return [+mystery, +duel, crowns.length, +crowns.includes(date)].join('|');
}
function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange); window.addEventListener('roviko:progress', onChange);
  return () => { window.removeEventListener('storage', onChange); window.removeEventListener('roviko:progress', onChange); };
}
/** Tell open quest cards that local progress changed (mystery answered, duel played, crown claimed). */
export const notifyProgress = () => { try { window.dispatchEvent(new Event('roviko:progress')); } catch { /* not in a browser */ } };

type Session = { mode: string; completed?: boolean };
/** Today's three quests with local bonus progress, and the crowns collected so far. */
export function useQuests(date: string, sessions: Session[]) {
  const snapshot = useSyncExternalStore(subscribe, () => localSnapshot(date), () => '0|0|0|0');
  const [mystery, duel, crowns, crowned] = snapshot.split('|').map(Number);
  const quests = questsFor(date, { completedModes: sessions.filter(s => s.completed).map(s => s.mode), mysteryPlayed: !!mystery, duelDone: !!duel });
  return { quests, crowns, crowned: !!crowned, done: allQuestsDone(quests), finished: quests.filter(q => q.done).length };
}

export function DailyQuests({ date, sessions, t, compact = false, art = false, onPick }: { date: string; sessions: Session[]; t: (k: string) => string; compact?: boolean; art?: boolean; onPick?: (quest: Quest) => void }) {
  const { quests, crowns, crowned, done } = useQuests(date, sessions);
  const label = (q: Quest) => q.kind === 'mode' ? t('questPlayMode').replace('{game}', t(dailyTitleKey(q.mode!))) : q.kind === 'mystery' ? t('questMystery') : q.kind === 'duel' ? t('questDuel') : t('questPlayN').replace('{n}', String(q.target));
  const sub = (q: Quest) => t(q.kind === 'mode' ? 'questSubMode' : q.kind === 'mystery' ? 'questSubMystery' : q.kind === 'duel' ? 'questSubDuel' : 'questSubGames');
  const claim = () => { try { localStorage.setItem(CROWNS, JSON.stringify(addCrown(readJson<string[]>(CROWNS, []), date))); } catch { /* storage unavailable */ } notifyProgress(); };
  const titleId = 'quests-title' + (compact ? '-loop' : '');
  return <section className={'daily-quests quests-v3' + (done ? ' is-complete' : '') + (compact ? ' is-compact' : '') + (art ? ' has-art' : '')} aria-labelledby={titleId}>
    <header>
      <span className="quests-badge" aria-hidden="true">{done ? <Crown size={24} strokeWidth={2.2}/> : <Target size={24} strokeWidth={2.2}/>}</span>
      <div><h2 id={titleId}>{t('questsTitle')}</h2><p>{compact ? t('questsLead') : t('questsIntro')}</p></div>
      {crowns > 0 && <span className="quests-crowns" aria-label={t('questCrowns').replace('{n}', String(crowns))}><Crown size={15} strokeWidth={2.4} aria-hidden="true"/>{crowns}</span>}
      {art && <img className="card-corner-art" src="/art/quests-scene.webp" alt="" aria-hidden="true" width={260} height={202} loading="lazy" decoding="async"/>}
    </header>
    <ul className="quest-list">{quests.map(q => {
      const body = <>
        <span className={'quest-icon quest-icon-' + q.kind} aria-hidden="true">{q.done ? <Check size={20} strokeWidth={2.8}/> : q.kind === 'games' ? <Flame size={22} strokeWidth={2.2}/> : <GameIcon mode={q.kind === 'mode' ? q.mode! : q.kind}/>}</span>
        <span className="quest-copy"><strong>{label(q)}</strong><small>{sub(q)}</small><span className="quest-bar" aria-hidden="true"><i style={{ width: q.progress / q.target * 100 + '%' }}/></span></span>
        <b className="quest-count">{q.progress}/{q.target}<span className="sr-only"> · {t(q.done ? 'dailyDoneState' : 'dailyNewState')}</span></b>
        {onPick && !q.done && <span className="quest-go" aria-hidden="true"><ChevronRight size={18}/></span>}
      </>;
      return <li key={q.id} className={q.done ? 'is-done' : ''}>{onPick && !q.done ? <button type="button" className="quest-row" onClick={() => onPick(q)}>{body}</button> : <div className="quest-row">{body}</div>}</li>;
    })}</ul>
    {done && !crowned && <button className="btn hero-cta quest-chest" onClick={claim}><Gift size={19} strokeWidth={2.3} aria-hidden="true"/>{t('questChest')}</button>}
    {done && !!crowned && <p className="quest-crowned" role="status"><Crown size={20} strokeWidth={2.3} aria-hidden="true"/>{t('questCrownWon').replace('{n}', String(crowns))}</p>}
    {!compact && !done && <ResetCountdown className="quest-reset" label={t('questNew')} t={t}/>}
  </section>;
}
