'use client';
import React, { useEffect, useState } from 'react';
import { Check, Share2 } from 'lucide-react';
import { api, post, sound, formatScore } from '@/lib/client';
import { plural } from '@/lib/plural';
import { finishKey, finishMood } from '@/lib/feel-copy';
import { NAMED_COUNTRIES, countryName } from '@/lib/puzzles/country-names';
import { DailyFinish } from '../atelier/DailyFinish';
import { HowToPlayButton } from '../atelier/HowToPlay';
import { GameHeader, editionLabel } from '../game/GameHeader';
import { Loading } from '../app/shared';

type Lang = 'en' | 'nl' | 'es';
type Topic = 'population' | 'area' | 'economy';
type Round = { topic: Topic; target: number | null; max: number; drawn: { id: string; value: number }[]; next: string | null;
  wouldBe: { id: string; value: number } | null; total: number; held: boolean; bust: boolean; points: number; started: boolean };
export type CloseCallView = { id: string; mode: 'closecall'; daily: string; edition: number; version: number; phase: 'playing' | 'finished';
  competition: { version: 1; mode: 'closecall' } | null; round: number; rounds: Round[]; score: number };
const fill = (text: string, values: Record<string, string | number>) => Object.entries(values).reduce((s, [k, v]) => s.replaceAll('{' + k + '}', String(v)), text);
const byId = new Map(NAMED_COUNTRIES.map(c => [c.id, c]));
const TOPIC_ICON: Record<Topic, string> = { population: '👥', area: '📐', economy: '💰' };

/**
 * Daily Close Call (1.57): three rounds. Each round has a target; you see the next country but not its number. Draw adds
 * it, Hold stops; go over the target and the round is a bust. Everyone gets the same rounds each day; no timer.
 * Rules and the rounds of the day live in lib/puzzles/close-call.ts. Built only from the app's existing pieces.
 */
export function CloseCallGame({ app }: { app: any }) {
  const { t, locale, go, backToStart, fail } = app;
  const lang = locale as Lang;
  const [game, setGame] = useState<CloseCallView | null>(null), [error, setError] = useState(false), [busy, setBusy] = useState(false);
  // The round shown: a finished round stays on screen (with its outcome) until "Next round".
  const [shown, setShown] = useState(0), [result, setResult] = useState(false);
  const name = (id: string) => { const c = byId.get(id); return c ? countryName(c, lang) : id; };
  const load = async () => { setError(false); try { const g: CloseCallView = await post('/closecall'); setGame(g); setShown(g.phase === 'finished' ? 2 : g.round); setResult(g.phase === 'finished'); } catch { setError(true); } };
  useEffect(() => { void load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) return <div className="puzzle-error" role="alert"><span>{t('puzzleLoadError')}</span><button className="btn secondary" onClick={() => void load()}>{t('retry')}</button></div>;
  if (!game) return <Loading variant="game"/>;

  const nf = (n: number, digits = 0) => n.toLocaleString(locale, { maximumFractionDigits: digits, minimumFractionDigits: 0 });
  /** A number in the round's own words: "47 million people", "322,000 km²", "$427 billion". */
  const amount = (topic: Topic, v: number) => {
    if (topic === 'population') return v >= 1e9 ? fill(t('ccPeopleBillion'), { n: nf(v / 1e9, 2) }) : fill(t('ccPeople'), { n: nf(v / 1e6, v < 10e6 ? 1 : 0) });
    if (topic === 'area') return v >= 1e6 ? fill(t('ccAreaMillion'), { n: nf(v / 1e6, 2) }) : fill(t('ccArea'), { n: nf(Math.round(v / 1000) * 1000) });
    return v >= 1e12 ? fill(t('ccMoneyTrillion'), { n: nf(v / 1e12, 2) }) : fill(t('ccMoneyBillion'), { n: nf(v / 1e9, 0) });
  };
  const finished = game.phase === 'finished';
  const exit = () => backToStart ? backToStart() : go('/daily');
  const r = game.rounds[shown], over = r.held || r.bust;
  const pct = r.target ? Math.min(100, r.total / r.target * 100) : 0;
  const holdPoints = r.target ? Math.round(r.max * Math.min(1, r.total / r.target)) : 0;

  async function act(action: 'draw' | 'hold') {
    if (busy || !game) return;
    setBusy(true);
    try {
      const g: CloseCallView = await post('/closecall/' + game.id + '/' + action, { version: game.version });
      const done = g.rounds[shown];
      if (done.bust) sound('incorrect'); else if (action === 'hold' || done.held) sound('correct'); else sound('tap');
      setGame(g);
    } catch (e: any) {
      if (e?.message === 'STATE_CHANGED' || e?.message === 'ANSWER_LOCKED') { const g = await api('/closecall/' + game.id).catch(() => null); if (g) { setGame(g); setShown(g.phase === 'finished' ? 2 : g.round); } }
      else fail(e);
    } finally { setBusy(false); }
  }

  // Share: one row per round, 🟩 for every safe draw, then 🟪 for a hold or 🟥 for the draw that went over.
  const rowOf = (x: Round) => x.drawn.map((_, i) => x.bust && i === x.drawn.length - 1 ? '🟥' : '🟩').join('') + (x.held ? '🟪' : '');
  const shareText = () => [fill(t('ccShareTitle'), { n: game.edition }), game.rounds.map(rowOf).join(' / '), fill(t('ccShareLine'), { points: formatScore(game.score) }), 'roviko.app'].join('\n');
  const share = () => (app.share ?? app.copy)(shareText());
  const playedRounds = game.rounds.filter(x => x.held || x.bust).length;

  const header = <GameHeader mode="closecall" title={t('closecall')} edition={editionLabel(game.daily, lang, t('ccPractice'))} count={Math.min(3, shown + 1) + ' / 3'} unit={t('ccRounds')}
    progress={playedRounds / 3} onExit={exit} exitLabel={t('back')} help={<HowToPlayButton mode="closecall" t={t} locale={lang} auto={!finished}/>} kicker={false}
    score={game.competition && !finished ? game.score : undefined} scoreLabel={plural(t, 'scorePill', game.score, '{n}', formatScore(game.score))}/>;

  const rounds = <ol className="cc-rounds" aria-label={t('ccRounds')}>{game.rounds.map((x, i) => <li key={i} className={(i === shown ? 'is-now ' : '') + (x.bust ? 'is-bust' : x.held ? 'is-held' : '')}>
    <span>{TOPIC_ICON[x.topic]} {t('ccTopic_' + x.topic)}</span><b>{x.held || x.bust ? fill(t('ccPoints'), { n: formatScore(x.points) }) : '·'}</b></li>)}</ol>;

  const resultCard = <section className="cc-result tp-card" aria-labelledby="cc-result-title">
    <h2 id="cc-result-title">{t('ccResultTitle')}</h2>
    <ul className="cc-result-rows">{game.rounds.map((x, i) => <li key={i} className={x.bust ? 'is-bust' : ''}>
      <span>{TOPIC_ICON[x.topic]} {t('ccTopic_' + x.topic)}</span>
      <small>{x.bust ? t('ccBustTag') : (x.target ? Math.round(x.total / x.target * 100) + '%' : '')}</small>
      <b>{fill(t('ccPoints'), { n: formatScore(x.points) })}</b></li>)}</ul>
    {!game.competition && <button className="btn primary finish-share" onClick={share}><Share2 size={17} aria-hidden="true"/>{t('shareChallenge')}</button>}
  </section>;

  if (finished && game.competition && result) return <div className="puzzle-game cc-game is-finished">{header}
    <DailyFinish app={app} date={game.daily} mode="closecall" game={t('closecall')} headline={t(finishKey(game.score / 1000, game.score >= 900))} mood={finishMood(game.score / 1000, game.score >= 900)}
      summary={game.rounds.map((x, i) => ({ icon: x.bust ? 'flame' as const : 'check' as const, value: formatScore(x.points), label: fill(t('ccRoundLine'), { n: i + 1 }) }))}
      onShare={share} onDone={exit}>
      {resultCard}
    </DailyFinish>
  </div>;

  return <div className={'puzzle-game cc-game' + (finished ? ' is-finished' : '')}>
    {header}
    {rounds}
    <section className="cc-card tp-card" aria-live="polite">
      <p className="cc-kicker">{fill(t('ccRound'), { n: shown + 1 })} · {TOPIC_ICON[r.topic]} {t('ccTopic_' + r.topic)}</p>
      <p className="cc-target"><small>{t('ccTarget')}</small><strong>{r.target ? amount(r.topic, r.target) : '…'}</strong></p>
      <div className={'cc-bar' + (r.bust ? ' is-bust' : '')} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)} aria-label={t('ccTotal')}>
        <i style={{ width: (r.bust ? 100 : pct) + '%' }}/>
      </div>
      <p className="cc-total"><span>{t('ccTotal')}</span><b>{amount(r.topic, r.total)}</b><small>{r.target ? Math.round(r.total / r.target * 100) + '%' : ''}</small></p>
      <ul className="cc-drawn" aria-label={t('ccDrawn')}>{r.drawn.length ? r.drawn.map((d, i) => { const c = byId.get(d.id);
        return <li key={d.id} className={r.bust && i === r.drawn.length - 1 ? 'is-bust' : ''}>{c && <img src={c.flag} alt=""/>}<span>{name(d.id)}</span><b>{amount(r.topic, d.value)}</b></li>; })
        : <li className="cc-empty">{t('ccNone')}</li>}</ul>
      {!over && r.next ? <div className="cc-next">
        <small>{t('ccNext')}</small>
        <div className="cc-next-country">{byId.get(r.next) && <img src={byId.get(r.next)!.flag} alt=""/>}<strong>{name(r.next)}</strong><span aria-hidden="true">?</span></div>
        <div className="cc-actions">
          <button type="button" className="btn primary btn-lg" disabled={busy} onClick={() => void act('draw')}>{t('ccDraw')}</button>
          <button type="button" className="btn secondary btn-lg" disabled={busy || r.drawn.length === 0} title={r.drawn.length ? undefined : t('ccDrawFirst')} onClick={() => void act('hold')}>
            {r.drawn.length ? fill(t('ccHoldFor'), { n: formatScore(holdPoints) }) : t('ccHold')}</button>
        </div>
      </div> : <div className={'cc-outcome' + (r.bust ? ' is-bust' : ' is-held')}>
        <p>{r.bust ? fill(t('ccBust'), { over: amount(r.topic, r.total - (r.target ?? 0)) }) : fill(t('ccHeld'), { pct: Math.round(r.total / (r.target || 1) * 100), n: formatScore(r.points) })}</p>
        {r.wouldBe && <small>{fill(t('ccWouldBe'), { country: name(r.wouldBe.id), value: amount(r.topic, r.wouldBe.value) })}</small>}
        {shown < 2 ? <button type="button" className="btn primary btn-lg" onClick={() => setShown(shown + 1)}>{t('ccNextRound')}</button>
          : finished && game.competition ? <button type="button" className="btn primary btn-lg" onClick={() => setResult(true)}>{t('ccSeeResult')}</button> : null}
      </div>}
    </section>
    {game.competition && !finished && <p className="cc-rule muted">{t('ccRuleShort')}</p>}
    {finished && !game.competition && <>{resultCard}<div className="finish-actions"><button className="finish-quiet" onClick={exit}><Check size={16} strokeWidth={2.6} aria-hidden="true"/>{t('finishDone')}</button></div></>}
  </div>;
}
