'use client';
import React, { useEffect } from 'react';
import { sound } from '@/lib/client';
import { Check, Clock, Flame, Target, Trophy, X } from 'lucide-react';
import { Character, type CharacterMood, type CharacterPose } from './Character';
import type { MascotMood } from './Mascot';
import { CountUp } from './Celebration';

export type StageChip = { label: string; value: string; icon?: 'check' | 'flame' | 'clock' | 'target' | 'trophy' };
export type StageTone = 'forest' | 'gold' | 'out';
export type FinishStageProps = {
  game: string; headline: string; mood: MascotMood | CharacterMood; score?: number | null; max?: number; unit?: string; locale: string;
  chips?: StageChip[]; trail?: boolean[]; tone?: StageTone; titleId?: string; children?: React.ReactNode;
};

const ICON = { check: Check, flame: Flame, clock: Clock, target: Target, trophy: Trophy };
const POSE: Partial<Record<string, CharacterPose>> = { cheer: 'cheer', happy: 'wave', wink: 'hips', worried: 'shrug', sad: 'shrug', shock: 'shrug', curious: 'point', sleepy: 'stand', cool: 'hips' };

/** The headline as a white speech bubble; the last word (or the part after a comma) is coloured, like in the videos. */
function Bubble({ text, id }: { text: string; id?: string }) {
  const m = text.match(/^(.*?)([^\s,]+[!?.…]*)$/u);
  return <h1 className="fs-bubble" id={id}>{m && m[1].trim() ? <>{m[1]}<span className="hl">{m[2]}</span></> : <span className="hl">{text}</span>}</h1>;
}

/**
 * The end of a game as a scene from the social videos: a full-colour stage with Roviko reacting, the score
 * huge in white, the stats as dark pills and the answer trail as dots. Gold for a great result, forest
 * green otherwise, with a red accent when a run is over.
 */
export function FinishStage({ game, headline, mood, score, max, unit, locale, chips, trail, tone, titleId, children }: FinishStageProps) {
  const fmt = (n: number) => n.toLocaleString(locale);
  const ratio = score != null && max ? score / max : trail?.length ? trail.filter(Boolean).length / trail.length : 0;
  const shade: StageTone = tone ?? (ratio >= 0.8 ? 'gold' : 'forest');
  const face = (mood === 'happy' && shade === 'gold' ? 'cheer' : mood) as CharacterMood;
  // A fanfare (and in the app a firm buzz) for a top result, a friendly close otherwise. Once per screen.
  useEffect(() => { sound(shade === 'gold' ? 'win' : 'finish'); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return <section className={'finish-stage tone-' + shade} aria-label={game}>
    {shade === 'gold' && <div className="fs-confetti" aria-hidden="true">{Array.from({ length: 14 }, (_, i) => <i key={i} style={{ '--i': i } as React.CSSProperties}/>)}</div>}
    <p className="fs-kicker">{game}</p>
    <Bubble text={headline} id={titleId}/>
    <div className="fs-main">
      <Character mood={face} pose={POSE[face] ?? 'wave'} size={150} className="fs-character"/>
      {score !== undefined && <div className="fs-score">
        <strong>{score === null ? '…' : <CountUp value={score} format={fmt}/>}{max ? <small> / {fmt(max)}</small> : null}</strong>
        {unit && <span>{unit}</span>}
      </div>}
    </div>
    {chips && chips.length > 0 && <ul className="fs-chips">{chips.map(c => { const Icon = ICON[c.icon ?? 'check']; return <li key={c.label}><Icon size={16} strokeWidth={2.6} aria-hidden="true"/><b>{c.value}</b><span>{c.label}</span></li>; })}</ul>}
    {trail && trail.length > 0 && <ol className="fs-trail" aria-label={chips?.[0]?.label}>{trail.map((ok, i) => <li key={i} className={ok ? 'is-right' : 'is-wrong'} style={{ '--i': i } as React.CSSProperties} aria-label={String(i + 1)}>{ok ? <Check size={13} strokeWidth={3.4}/> : <X size={13} strokeWidth={3.4}/>}</li>)}</ol>}
    {children}
  </section>;
}
