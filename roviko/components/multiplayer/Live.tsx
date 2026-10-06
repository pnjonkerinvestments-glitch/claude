'use client';
import React from 'react';
import { Check, Clock, X } from 'lucide-react';
import { formatScore } from '@/lib/client';
import { plural } from '@/lib/plural';
import { Character } from '../ds/Character';
import { GlobeAvatar } from '../ds/GlobeAvatar';
import { PlayerActions } from './PlayerActions';

/**
 * The live room in the trip style (1.23): the round line with dots on the question card, the timer pill,
 * the countdown with Roviko, who picked what on the answer pills, the points you won and the standings.
 * Only presentation: everything shown here is what the server already sent for this moment.
 */
type T = (key: string) => string;
type Label = { en: string; nl: string; es?: string } | null | undefined;
export type RoundAnswer = { id: string; name: string; avatar: number; answered: boolean; correct: boolean; points: number; distance?: number | null; answer?: Label };
export type LivePlayer = { id: string; name: string; avatar: number; score: number; rank?: number; answered?: boolean; bot?: boolean; streak?: number };

export const difficultyLabel = (t: T, d: unknown) => t(d === 'mixed' ? 'difficultyMixed' : typeof d === 'string' ? d : 'medium');
const label = (v: Label, locale: string) => (v as Record<string, string> | null | undefined)?.[locale] ?? v?.en ?? '';

/** A dot per round: green for one you got right, red for one you missed, the current one wide. Decorative. */
export function RoundDots({ round, total, marks, finished = false }: { round: number; total: number; marks: Record<number, boolean>; finished?: boolean }) {
  return <ol className="t-dots mp-dots" aria-hidden="true">{Array.from({ length: total }, (_, i) => {
    const m = marks[i];
    const cls = m === true ? 'is-done' : m === false ? 'is-miss' : finished || i < round ? 'is-past' : i === round ? 'is-now' : '';
    return <li key={i} className={cls}/>;
  })}</ol>;
}

/** "ROUND 1/10 · MEDIUM" with the round dots under it, for the top of the question card. */
export function RoundLabel({ round, total, difficulty, marks, t }: { round: number; total: number; difficulty: unknown; marks: Record<number, boolean>; t: T }) {
  return <span className="mp-kicker">
    <span className="t-kicker is-caps">{t('mpRoundOf').replace('{round}', String(round + 1)).replace('{total}', String(total))} · {difficultyLabel(t, difficulty)}</span>
    <RoundDots round={round} total={total} marks={marks}/>
  </span>;
}

/** Seconds left in the round; red and pulsing for the last five. */
export function TimerPill({ ms, t }: { ms: number; t: T }) {
  const s = Math.max(0, Math.ceil(ms / 1000)), urgent = s < 6;
  return <span className={'mp-timer' + (urgent ? ' is-urgent' : '')} role="timer" aria-label={plural(t, 'mpSecondsLeft', s)}>
    <Clock size={17} strokeWidth={2.6} aria-hidden="true"/><b key={urgent ? s : 'calm'} aria-hidden="true">{s}</b>
  </span>;
}

/** Between rounds: the round line, a big number in a white circle and Roviko pointing at it. */
export function CountdownStage({ left, round, total, difficulty, marks, t }: { left: number; round: number; total: number; difficulty: unknown; marks: Record<number, boolean>; t: T }) {
  const go = left <= 0;
  return <section className="mp-countdown" aria-labelledby="mp-countdown-title">
    <RoundLabel round={round} total={total} difficulty={difficulty} marks={marks} t={t}/>
    <h1 id="mp-countdown-title" className="mp-countdown-title">{t('countdown')}</h1>
    <div className="mp-countdown-row">
      <Character mood={go ? 'cheer' : 'happy'} pose={go ? 'cheer' : 'point'} size={128} className="mp-countdown-roviko"/>
      <div className="mp-countdown-ring" aria-live="polite" aria-atomic="true"><strong key={go ? 'go' : left} className={go ? 'is-go' : ''}>{go ? t('countdownGo') : left}</strong></div>
    </div>
  </section>;
}

/**
 * Who picked which answer, as stacked mini avatars on the answer pills (by option id). Matches the revealed
 * answer label against the options, so the room payload stays as it is. Map and order rounds get none.
 */
export function pickMarks(question: { mode?: string; options?: { id: string; en: string }[] } | null | undefined, answers: RoundAnswer[] | undefined, me: string, t: T) {
  if (!question?.options?.length || !answers?.length || question.mode === 'order' || question.mode === 'pinpoint') return undefined;
  const marks: Record<string, React.ReactNode> = {};
  for (const o of question.options) {
    const who = answers.filter(a => a.answered && a.answer?.en === o.en).sort((a, b) => Number(b.id === me) - Number(a.id === me));
    if (!who.length) continue;
    const shown = who.length > 3 ? who.slice(0, 2) : who, more = who.length - shown.length;
    marks[o.id] = <span className="t-stack mp-picks">
      {shown.map(a => <GlobeAvatar key={a.id} id={a.avatar} size={28} className={a.id === me ? 'is-me' : ''}/>)}
      {more > 0 && <b className="mp-picks-more" aria-hidden="true">+{more}</b>}
      <span className="sr-only">{t('mpPickedBy').replace('{names}', who.map(a => a.id === me ? t('youLabel') : a.name).join(', '))}</span>
    </span>;
  }
  return marks;
}

/** The points you won this round, as a gold pill that pops on the edge of the question card. */
export function PointsPop({ points, t }: { points: number; t: T }) {
  return <p className={'mp-points-pop' + (points ? '' : ' is-zero')}>
    <span className="t-points" aria-hidden="true">+{formatScore(points)}</span>
    <span className="sr-only">{plural(t, 'mpGained', points, '{n}', formatScore(points))}</span>
  </p>;
}

/**
 * The standings as one clean white card: rank, avatar, name and score. During a round a small tick shows who
 * has answered; after it, right or wrong and the points each player won. `list` keeps it a list on phones
 * too (the final results); otherwise phones get one compact row of avatars.
 */
export function LiveBoard({ players, me, answers, showStatus = false, locale, t, title, list = false, actions = false, room }: {
  players: LivePlayer[]; me: string; answers?: RoundAnswer[]; showStatus?: boolean; locale: string; t: T; title: string; list?: boolean; actions?: boolean; room?: string;
}) {
  const answerText = (a: RoundAnswer) => a.answered ? label(a.answer, locale) || (typeof a.distance === 'number' ? a.distance.toLocaleString(locale) + ' km' : t('mpNoAnswer')) : t('mpNoAnswer');
  return <section className={'mp-board t-card' + (list ? ' is-list' : '')}>
    <h2 className="mp-board-title t-kicker is-caps">{title}</h2>
    <ol className="mp-board-list">{players.map((p, i) => {
      const a = answers?.find(x => x.id === p.id), done = showStatus && p.answered;
      const state = a ? (a.correct ? t('mpRowRight') : t('mpRowWrong')) : done ? t('mpRowAnswered') : '';
      return <li key={p.id} className={'mp-row' + (p.id === me ? ' is-me' : '') + (a ? a.correct ? ' was-right' : ' was-wrong' : '') + (done ? ' has-answered' : '')}>
        <span className="mp-row-rank" aria-hidden="true">{p.rank ?? i + 1}</span>
        <span className="mp-row-avatar"><GlobeAvatar id={p.avatar} size={40}/>
          {(a || done) && <span className={'mp-row-badge' + (a ? a.correct ? ' is-right' : ' is-wrong' : ' is-done')} aria-hidden="true">{a && !a.correct ? <X size={11} strokeWidth={3.6}/> : <Check size={11} strokeWidth={3.6}/>}</span>}
        </span>
        <span className="mp-row-name"><strong>{p.id === me ? t('youLabel') : p.name}</strong>{a && <small>{answerText(a)}</small>}</span>
        {a && a.points > 0 && <span className="mp-row-gain" aria-hidden="true">+{formatScore(a.points)}</span>}
        <span className="mp-row-score" aria-hidden="true">{formatScore(p.score)}</span>
        <span className="sr-only">{(p.rank ?? i + 1) + '. ' + (p.id === me ? t('youLabel') : p.name) + ', ' + plural(t, 'scorePill', p.score, '{n}', formatScore(p.score)) + (state ? ', ' + state : '') + (a?.points ? ', +' + formatScore(a.points) : '')}</span>
        {actions && !p.bot && p.id !== me && <PlayerActions player={p} t={t} room={room}/>}
      </li>;
    })}</ol>
  </section>;
}
