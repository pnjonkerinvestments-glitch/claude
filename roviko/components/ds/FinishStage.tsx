'use client';
import React, { useEffect, useRef } from 'react';
import { sound } from '@/lib/client';
import { warmShareImage } from '@/lib/share-image';
import { Check, Clock, Flame, Target, Trophy } from 'lucide-react';
import { Character, type CharacterMood, type CharacterPose } from './Character';
import type { MascotMood } from './Mascot';
import { CountUp } from './Celebration';
import { Coin } from './Coin';

export type StageChip = { label: string; value: string; icon?: 'check' | 'flame' | 'clock' | 'target' | 'trophy' };
export type StageTone = 'forest' | 'gold' | 'out';
export type FinishStageProps = {
  game: string; headline: string; mood: MascotMood | CharacterMood; score?: number | null; max?: number; unit?: string; locale: string;
  chips?: StageChip[]; trail?: boolean[]; tone?: StageTone; titleId?: string; children?: React.ReactNode;
  /** Show the gold coin next to the score (for real points, not for "7 correct"). */
  coin?: boolean;
};

const ICON = { check: Check, flame: Flame, clock: Clock, target: Target, trophy: Trophy };
const POSE: Partial<Record<string, CharacterPose>> = { cheer: 'cheer', happy: 'wave', wink: 'hips', worried: 'shrug', sad: 'shrug', shock: 'shrug', curious: 'point', sleepy: 'stand', cool: 'hips' };

/** Scrolls an end screen into view from its top (a game often ends with the page scrolled down to its button). */
export function toTop() { try { if (window.scrollY > 0) window.scrollTo(0, 0); } catch { /* no window */ } }
/** When the button that ended the game is gone, focus lands on the page body: move it to the headline so a
 * screen reader announces the result and Tab continues from there. Never takes focus from anything else. */
export function focusHeadline(el: HTMLElement | null) { try { const a = document.activeElement; if (el && (!a || a === document.body)) el.focus({ preventScroll: true }); } catch { /* no document */ } }

/** Roviko big on the cream canvas, standing on a soft halo: mint, gold for a top result, rose when a run is over. */
export function FinishHero({ mood, tone = 'forest' }: { mood: CharacterMood; tone?: StageTone }) {
  return <div className={'fs-hero tone-' + tone} aria-hidden="true">
    <span className="fs-halo"/>
    <Character mood={mood} pose={POSE[mood] ?? 'wave'} size={190} className="fs-character"/>
  </div>;
}

/** Where each confetti piece starts (% from the left) and how late it falls (s): scattered, so they never form a line. */
const CONFETTI: [number, number][] = [[8, 0], [62, .55], [31, .2], [88, .9], [47, .35], [18, .75], [75, .1], [55, 1.15], [4, .6], [39, .95], [83, .4], [25, 1.3]];
/** A little confetti for a top result: a few soft pieces in the trip colours that fall twice and stop. */
export function FinishConfetti() {
  return <div className="fs-confetti" aria-hidden="true">{CONFETTI.map(([x, d], i) => <i key={i} style={{ '--i': i, '--x': x + '%', '--d': d + 's' } as React.CSSProperties}/>)}</div>;
}

/**
 * The end of a game in the trip style (1.23): Roviko big on the cream canvas, reacting to the result; the
 * headline big in forest green; the score big with a gold coin; the stats as small mint pills and the
 * answers as a row of dots. Gold (a halo and a little confetti) only for a top result.
 * The props are shared by every game's end screen, so keep them compatible.
 */
export function FinishStage({ game, headline, mood, score, max, unit, locale, chips, trail, tone, titleId, children, coin }: FinishStageProps) {
  const fmt = (n: number) => n.toLocaleString(locale);
  const ratio = score != null && max ? score / max : trail?.length ? trail.filter(Boolean).length / trail.length : 0;
  const shade: StageTone = tone ?? (ratio >= 0.8 ? 'gold' : 'forest');
  const face = (mood === 'happy' && shade === 'gold' ? 'cheer' : mood) as CharacterMood;
  // A fanfare (and in the app a firm buzz) for a top result, a friendly close otherwise. Once per screen.
  // The end screen starts at the top, even when the last answer was tapped further down the page.
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => { sound(shade === 'gold' ? 'win' : 'finish'); warmShareImage(); toTop(); focusHeadline(title.current); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return <section className={'finish-stage is-trip tone-' + shade} aria-label={game}>
    {shade === 'gold' && <FinishConfetti/>}
    <FinishHero mood={face} tone={shade}/>
    <p className="fs-kicker">{game}</p>
    <h1 className="fs-title" id={titleId} ref={title} tabIndex={-1}>{headline}</h1>
    {score !== undefined && <p className={'fs-score' + (coin ? ' has-coin' : '')}>
      {coin && <Coin size={44} className="fs-coin"/>}
      <strong>{score === null ? '…' : <CountUp value={score} format={fmt}/>}</strong>
      {(max || unit) ? <span className="fs-of">{max ? <>/ {fmt(max)}</> : null}{max && unit ? ' ' : null}{unit}</span> : null}
    </p>}
    {chips && chips.length > 0 && <ul className="fs-chips">{chips.map(c => { const Icon = ICON[c.icon ?? 'check']; return <li key={c.label}><Icon size={15} strokeWidth={2.6} aria-hidden="true"/><b>{c.value}</b><span>{c.label}</span></li>; })}</ul>}
    {trail && trail.length > 0 && <ol className="fs-trail" aria-hidden="true">{trail.map((ok, i) => <li key={i} className={ok ? 'is-done' : 'is-miss'} style={{ '--i': i } as React.CSSProperties}/>)}</ol>}
    {children}
  </section>;
}
