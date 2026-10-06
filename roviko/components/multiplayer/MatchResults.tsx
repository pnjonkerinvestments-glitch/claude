'use client';
import React, { useEffect } from 'react';
import { ArrowUpRight, Check, ChevronDown, Home, RefreshCw, X } from 'lucide-react';
import { formatScore, sound } from '@/lib/client';
import { plural } from '@/lib/plural';
import { warmShareImage } from '@/lib/share-image';
import { GameIcon } from '../atelier/GameIcon';
import { Character } from '../ds/Character';
import { CountUp } from '../ds/Celebration';
import { Coin } from '../ds/Coin';
import { GlobeAvatar } from '../ds/GlobeAvatar';
import { LiveBoard, RoundDots, type LivePlayer, type RoundAnswer } from './Live';

type T = (key: string) => string;
type Label = { en: string; nl: string; es?: string } | null | undefined;
type Player = LivePlayer & { rematch?: boolean; connected?: boolean };
type HistoryRound = { round: number; mode: string; prompt: Label; answerLabel: Label; players: RoundAnswer[] };
export type FinishedRoom = { code: string; players: Player[]; total?: number; results?: { correct?: boolean }[]; history?: HistoryRound[] };

const text = (v: Label, locale: string) => (v as Record<string, string> | null | undefined)?.[locale] ?? v?.en ?? '';
/** 1st, 2nd · 1e, 2e · 1.º, 2.º */
export function ordinal(n: number, locale: string) {
  if (locale === 'nl') return n + 'e';
  if (locale === 'es') return n + '.º';
  const rule = new Intl.PluralRules('en', { type: 'ordinal' }).select(n);
  return n + (({ one: 'st', two: 'nd', few: 'rd' } as Record<string, string>)[rule] ?? 'th');
}

/** "Play again": everyone still in the room taps it; the new match starts as soon as all have. */
export function RematchButton({ room, me, send, t }: { room: { players: Player[] }; me: string; send: (type: string) => boolean; t: T }) {
  const mine = room.players.find(p => p.id === me)?.rematch;
  const waiting = room.players.filter(p => !p.bot && p.connected && !p.rematch && p.id !== me).map(p => p.name);
  return <>
    <button className="btn primary btn-lg mpr-again" disabled={!!mine} onClick={() => send('rematch')}>{mine ? <Check size={19} aria-hidden="true"/> : <RefreshCw size={19} aria-hidden="true"/>}{t('mpPlayAgain')}</button>
    {mine && waiting.length > 0 && <p className="mpr-wait" role="status">{t('rematchWaiting').replace('{names}', waiting.join(', '))}</p>}
  </>;
}

/** Every round folded: the question, the right answer and what everyone picked. */
export function MatchReview({ history, me, t, locale }: { history: HistoryRound[]; me: string; t: T; locale: string }) {
  return <ol className="mpr-review">{history.map(h => {
    const players = [...h.players].sort((a, b) => b.points - a.points), mine = h.players.find(p => p.id === me);
    return <li key={h.round}><details>
      <summary>
        <span className={'mpr-review-num' + (mine ? mine.correct ? ' is-right' : ' is-wrong' : '')}>{h.round + 1}</span>
        <GameIcon mode={h.mode} size="sm"/>
        <span className="mpr-review-q"><strong>{text(h.prompt, locale)}</strong><small><Check size={13} strokeWidth={3} aria-hidden="true"/>{text(h.answerLabel, locale)}</small></span>
        <ChevronDown size={18} className="mpr-chevron" aria-hidden="true"/>
      </summary>
      <ul>{players.map(p => <li key={p.id} className={(p.correct ? 'was-right' : 'was-wrong') + (p.id === me ? ' is-me' : '')}>
        <GlobeAvatar id={p.avatar} size={30}/>
        <strong>{p.id === me ? t('youLabel') : p.name}</strong>
        <span className="mpr-review-pick">{p.correct ? <Check size={14} strokeWidth={3} aria-label={t('mpRowRight')}/> : <X size={14} strokeWidth={3} aria-label={t('mpRowWrong')}/>}{p.answered ? text(p.answer, locale) || (typeof p.distance === 'number' ? p.distance.toLocaleString(locale) + ' km' : '—') : t('mpNoAnswer')}</span>
        <b>+{formatScore(p.points)}</b>
      </li>)}</ul>
    </details></li>;
  })}</ol>;
}

/**
 * The end of a match, after the owner's mock-up: everyone's avatars on top, "FINAL RESULTS · 10 ROUNDS" with
 * your rounds as dots, the headline for your place, your points, Roviko cheering above a three-step podium
 * and one big "Play again". Share and home come after it; the full ranking and every round are folded below.
 */
export function MatchResults({ room, me, send, onShare, onHome, t, locale }: { room: FinishedRoom; me: string; send: (type: string) => boolean; onShare: () => void; onHome: () => void; t: T; locale: string }) {
  const players = room.players ?? [];
  const self = players.find(p => p.id === me);
  const place = self ? self.rank ?? players.indexOf(self) + 1 : 0;
  const results = room.results ?? [];
  const total = room.total ?? results.length;
  const right = results.filter(r => r.correct).length;
  const marks = Object.fromEntries(results.map((r, i) => [i, !!r.correct]));
  const headline = place === 1 ? 'mpWin' : place === 2 ? 'mpSecond' : place === 3 ? 'mpThird' : 'mpGoodGame';
  const win = place === 1;
  // One fanfare for a win, a friendly close otherwise; the share image gets ready; the page starts at the top.
  useEffect(() => { sound(win ? 'win' : 'finish'); warmShareImage(); window.scrollTo(0, 0); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const crowd = players.slice(0, 8), extra = players.length - crowd.length;
  const podium = players.slice(0, 3);
  const nameOf = (p: Player) => p.id === me ? t('youLabel') : p.name;
  return <div className={'mp-results' + (win ? ' is-win' : '')}>
    <ul className="mpr-crowd" aria-hidden="true">
      {crowd.map(p => <li key={p.id} className={p.id === me ? 'is-me' : ''}><GlobeAvatar id={p.avatar} size={44}/></li>)}
      {extra > 0 && <li className="mpr-crowd-more">+{extra}</li>}
    </ul>
    <section className="mpr-card t-card" aria-labelledby="mpr-title">
      {win && <div className="mpr-confetti" aria-hidden="true">{Array.from({ length: 16 }, (_, i) => <i key={i} style={{ '--x': (i * 37 + 7) % 96 + 2 + '%', '--d': (i * 5) % 16 } as React.CSSProperties}/>)}</div>}
      <p className="t-kicker is-caps mpr-kicker">{plural(t, 'mpFinal', total)}</p>
      <RoundDots round={total} total={total} marks={marks} finished/>
      <p className="sr-only">{plural(t, 'mpRightCount', right).replace('{total}', String(total))}</p>
      <h1 id="mpr-title" className="t-title mpr-headline">{t(headline)}</h1>
      {place > 0 && <p className="mpr-place">{plural(t, 'mpPlaceOf', players.length).replace('{place}', ordinal(place, locale))}</p>}
      <p className="mpr-points"><Coin size={28}/><strong><CountUp value={self?.score ?? 0} format={n => formatScore(n)}/></strong><span>{plural(t, 'mpPointsWord', self?.score ?? 0)}</span></p>
      <div className="mpr-stage">
        <Character mood={win ? 'cheer' : place && place <= 3 ? 'happy' : 'wink'} pose={win ? 'cheer' : place && place <= 3 ? 'wave' : 'hips'} size={132} className="mpr-roviko"/>
        <ol className={'mpr-podium has-' + podium.length} aria-label={t('mpPodium')}>
          {podium.map((p, i) => <li key={p.id} className={'mpr-step place-' + (i + 1) + (p.id === me ? ' is-me' : '')}>
            <span className="mpr-step-avatar"><GlobeAvatar id={p.avatar} size={i === 0 ? 64 : 52}/></span>
            <span className="mpr-step-block">
              <b className="mpr-step-rank"><span className="sr-only">{ordinal(p.rank ?? i + 1, locale)} · </span><span aria-hidden="true">{p.rank ?? i + 1}</span></b>
              <strong className="mpr-step-name">{nameOf(p)}</strong>
              <small className="mpr-step-score">{formatScore(p.score)}</small>
            </span>
          </li>)}
        </ol>
      </div>
      <div className="mpr-actions">
        <RematchButton room={room} me={me} send={send} t={t}/>
        <div className="mpr-more">
          <button className="btn secondary" onClick={onShare}><ArrowUpRight size={17} aria-hidden="true"/>{t('share')}</button>
          <button className="btn ghost" onClick={onHome}><Home size={17} aria-hidden="true"/>{t('mpHome')}</button>
        </div>
      </div>
    </section>
    <details className="mpr-fold t-card">
      <summary><span>{t('mpAllPlayers')}</span><small>{players.length}</small><ChevronDown size={18} className="mpr-chevron" aria-hidden="true"/></summary>
      <LiveBoard players={players} me={me} locale={locale} t={t} title={t('mpAllPlayers')} list actions room={room.code}/>
    </details>
    {room.history && room.history.length > 0 && <details className="mpr-fold t-card">
      <summary><span>{t('mpReviewTitle')}</span><small>{room.history.length}</small><ChevronDown size={18} className="mpr-chevron" aria-hidden="true"/></summary>
      <MatchReview history={room.history} me={me} t={t} locale={locale}/>
    </details>}
  </div>;
}
