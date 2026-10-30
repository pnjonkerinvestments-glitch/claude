'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronRight, Eye, Lightbulb, MapPin, Route, Share2, Sparkles, Undo2 } from 'lucide-react';
import { api, post, sound, formatScore } from '@/lib/client';
import { plural } from '@/lib/plural';
import { finishKey, finishMood } from '@/lib/feel-copy';
import { NAMED_COUNTRIES, countryName } from '@/lib/puzzles/country-names';
import { ROAD_TRIP_PEEK_MS } from '@/lib/puzzles/road-trip-points';
import { DailyFinish } from '../atelier/DailyFinish';
import { HowToPlayButton } from '../atelier/HowToPlay';
import { GameHeader, editionLabel } from '../game/GameHeader';
import { Loading } from '../app/shared';
import { RoadTripMap, type RoadStop } from './RoadTripMap';

type Lang = 'en' | 'nl' | 'es';
type Text = Record<Lang, string>;
export type RoadTripView = {
  id: string; mode: 'roadtrip'; daily: string; edition: number; version: number; phase: 'playing' | 'finished'; competition: { version: 1; mode: 'roadtrip' } | null;
  start: string; finish: string; shortest: number; frame: [number, number, number, number];
  route: RoadStop[]; options: string[]; middles: Record<string, [number, number]>; facts: Record<string, Text | null>;
  detours: number; peeks: number; score: number; best: string[] | null;
};
const fill = (text: string, values: Record<string, string | number>) => Object.entries(values).reduce((s, [k, v]) => s.replaceAll('{' + k + '}', String(v)), text);
const byId = new Map(NAMED_COUNTRIES.map(c => [c.id, c]));

/**
 * Daily Road Trip (1.56): drive over land from start to finish, one neighbour at a time, through the fog. Every tap is
 * final. Everyone gets the same trip each day; no timer. Rules and the trip of the day live in lib/puzzles/road-trip.ts.
 */
export function RoadTripGame({ app }: { app: any }) {
  const { t, locale, go, backToStart, fail } = app;
  const lang = locale as Lang;
  const [game, setGame] = useState<RoadTripView | null>(null), [error, setError] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'good' | 'bad' | 'info'; text: string } | null>(null), [busy, setBusy] = useState(false);
  const [peeking, setPeeking] = useState(false);
  const peekTimer = useRef<number | undefined>(undefined), stripRef = useRef<HTMLOListElement>(null);
  useEffect(() => { const el = stripRef.current; if (el?.scrollTo) el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' }); }, [game?.route.length]);
  const name = (id: string) => { const c = byId.get(id); return c ? countryName(c, lang) : id; };
  const load = async () => { setError(false); try { setGame(await post('/roadtrip')); } catch { setError(true); } };
  useEffect(() => { void load(); return () => window.clearTimeout(peekTimer.current); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) return <div className="puzzle-error" role="alert"><span>{t('puzzleLoadError')}</span><button className="btn secondary" onClick={() => void load()}>{t('retry')}</button></div>;
  if (!game) return <Loading variant="game"/>;

  const finished = game.phase === 'finished';
  const exit = () => backToStart ? backToStart() : go('/daily');
  const detoursText = (n: number) => n === 1 ? t('rtDetourOne') : fill(t('rtDetourMany'), { n });
  const peeksText = (n: number) => n === 1 ? t('rtPeekOne') : fill(t('rtPeekMany'), { n });
  const last = game.route.at(-1)!;
  const lastPicked = [...game.route].reverse().find(r => !r.auto && r.closer !== null);
  const fact = lastPicked ? game.facts[lastPicked.country]?.[lang] ?? game.facts[lastPicked.country]?.en : null;

  async function refresh() { const g = await api('/roadtrip/' + game!.id).catch(() => null); if (g) setGame(g); }
  async function drive(id: string) {
    if (busy || finished) return;
    setBusy(true);
    try {
      const g: RoadTripView = await post('/roadtrip/' + game!.id + '/drive', { version: game!.version, country: id });
      setGame(g);
      const stop = g.route.find((r, i) => i === game!.route.length);
      if (stop?.closer) { sound('correct'); setNotice({ tone: 'good', text: g.phase === 'finished' ? fill(t('rtAutoDrive'), { country: name(id), finish: name(g.finish) }) : t('rtCloser') }); }
      else { sound('incorrect'); setNotice({ tone: 'bad', text: t('rtDetour') }); }
    } catch (e: any) {
      if (e?.message === 'STATE_CHANGED' || e?.message === 'ANSWER_LOCKED') await refresh();
      else if (e?.message === 'NOT_A_NEIGHBOUR') setNotice({ tone: 'info', text: t('rtNotNeighbour') });
      else fail(e);
    } finally { setBusy(false); }
  }
  async function peek() {
    if (busy || finished || peeking) return;
    setBusy(true);
    try {
      const g: RoadTripView = await post('/roadtrip/' + game!.id + '/peek', { version: game!.version });
      setGame(g); setPeeking(true); setNotice({ tone: 'info', text: t('rtPeeking') });
      window.clearTimeout(peekTimer.current);
      peekTimer.current = window.setTimeout(() => { setPeeking(false); setNotice(null); }, ROAD_TRIP_PEEK_MS);
    } catch (e: any) { if (e?.message === 'STATE_CHANGED') await refresh(); else fail(e); } finally { setBusy(false); }
  }

  // Share blocks: 📍 start, 🟩 closer, 🟧 detour, 🏁 finish.
  const blocks = game.route.map((r, i) => i === 0 ? '📍' : finished && i === game.route.length - 1 ? '🏁' : r.closer ? '🟩' : '🟧');
  const shareText = () => [fill(t('rtShareTitle'), { n: game.edition, start: name(game.start), finish: name(game.finish) }), blocks.join(''),
    fill(t('rtShareLine'), { points: formatScore(game.score), detours: detoursText(game.detours), peeks: peeksText(game.peeks) }), 'roviko.app'].join('\n');
  const share = () => (app.share ?? app.copy)(shareText());
  const stopsTaken = game.route.length - 1;

  const header = <GameHeader mode="roadtrip" title={t('roadtrip')} edition={editionLabel(game.daily, lang, t('rtPractice'))} count={String(stopsTaken)} unit={t('rtRoute')}
    progress={finished ? 1 : Math.min(.9, stopsTaken / (game.shortest + 1))} onExit={exit} exitLabel={t('back')} help={<HowToPlayButton mode="roadtrip" t={t} locale={lang} auto={!finished}/>} kicker={false}
    score={game.competition && !finished ? game.score : undefined} scoreLabel={plural(t, 'scorePill', game.score, '{n}', formatScore(game.score))}/>;

  const flagOf = (id: string) => byId.get(id)?.flag;
  // The ticket: start and finish with their flags, a little road between them and the shortest route underneath.
  const stats = <>
    <section className="rt-ticket" aria-label={t('rtToday') + ': ' + name(game.start) + ' → ' + name(game.finish)}>
      <small className="rt-ticket-kicker">{t('rtToday')}</small>
      <div className="rt-ticket-row">
        <span className="rt-ticket-end">{flagOf(game.start) && <img src={flagOf(game.start)} alt=""/>}<strong>{name(game.start)}</strong></span>
        <span className="rt-ticket-road" aria-hidden="true"><ChevronRight size={20} strokeWidth={2.6}/></span>
        <span className="rt-ticket-end is-finish">{flagOf(game.finish) && <img src={flagOf(game.finish)} alt=""/>}<strong>{name(game.finish)}</strong></span>
      </div>
      <p className="rt-shortest"><Route size={14} aria-hidden="true"/>{fill(t('rtShortest'), { n: game.shortest })}</p>
    </section>
    <div className="rt-stats">
      <div className={'rt-stat' + (game.detours + game.peeks > 0 ? ' is-cost' : '')}><span className="rt-stat-icon" aria-hidden="true"><Undo2 size={18}/></span><span><small>{t('rtDetoursPeeks')}</small><strong>{game.detours} · {game.peeks}</strong></span></div>
      <div className="rt-stat is-points"><span className="rt-stat-icon" aria-hidden="true"><Sparkles size={18}/></span><span><small>{t('rtPoints')}</small><strong>{fill(t('rtPointsOf'), { n: formatScore(game.score) })}</strong></span></div>
    </div>
  </>;

  const map = <RoadTripMap start={game.start} finish={game.finish} frame={game.frame} route={game.route} options={game.options} middles={game.middles} best={finished ? game.best : null}
    peeking={peeking} disabled={busy || finished} name={name} onPick={id => void drive(id)} failText={t('mapFailed')} retryText={t('retry')}
    label={fill(t('rtMapLabel'), { start: name(game.start), finish: name(game.finish) })}/>;

  const legend = <ul className="rt-legend" aria-label={t('rtLegend')}>
    <li><i className="is-end"/>{t('rtLegendEnds')}</li>
    {!finished && <li><i className="is-option"/>{t('rtLegendCan')}</li>}
    <li><i className="is-closer"/>{t('rtLegendCloser')}</li>
    <li><i className="is-detour"/>{t('rtLegendDetour')}</li>
    {finished && game.best && <li><i className="is-best"/>{t('rtBest')}</li>}
  </ul>;

  const chips = <ol className="rt-chips" aria-label={t('rtRoute')} ref={stripRef}>
    {game.route.map((r, i) => { const end = i === 0 || r.country === game.finish, kind = end ? 'end' : r.closer ? 'closer' : 'detour';
      const status = i === 0 ? t('rtStopStart') : r.country === game.finish ? t('rtStopFinish') : r.closer ? t('rtStopCloser') : t('rtStopDetour');
      const flag = byId.get(r.country)?.flag;
      return <li key={i} className={'rt-chip is-' + kind + (i === game.route.length - 1 && !finished ? ' is-here' : '')} aria-label={fill(t('rtStop'), { n: i, country: name(r.country) }) + ' · ' + status}>
        <b aria-hidden="true">{i === 0 ? <MapPin size={11} strokeWidth={3}/> : r.country === game.finish ? '🏁' : i}</b>{flag && <img src={flag} alt=""/>}<span>{name(r.country)}</span></li>; })}
  </ol>;

  const factCard = fact && lastPicked ? <p className="rt-fact" aria-live="polite"><Lightbulb size={15} aria-hidden="true"/><span><strong>{name(lastPicked.country)}:</strong> {fact}</span></p> : null;

  const resultCard = <section className="rt-result tp-card" aria-labelledby="rt-result-title">
    <div className="rt-result-flag" aria-hidden="true">{flagOf(game.finish) && <img src={flagOf(game.finish)} alt=""/>}</div>
    <h2 id="rt-result-title">{fill(t('rtArrived'), { country: name(game.finish) })}</h2>
    <p className="rt-result-points"><strong>{formatScore(game.score)}</strong><span>{t('rtOutOf')} {t('points')}</span></p>
    <ul className="rt-result-chips"><li className={game.detours ? 'is-cost' : ''}><Undo2 size={14} aria-hidden="true"/>{detoursText(game.detours)}</li><li className={game.peeks ? 'is-cost' : ''}><Eye size={14} aria-hidden="true"/>{peeksText(game.peeks)}</li></ul>
    <div className="rt-blocks" aria-hidden="true">{game.route.map((r, i) => <i key={i} className={i === 0 || (finished && i === game.route.length - 1) ? 'is-end' : r.closer ? 'is-closer' : 'is-detour'}/>)}</div>
    {game.best && <div className="rt-best"><small>{t('rtBest')}</small><ol>{game.best.map((c, i) => <li key={c}>{flagOf(c) && <img src={flagOf(c)} alt=""/>}<span>{name(c)}</span>{i < game.best!.length - 1 && <ChevronRight size={13} aria-hidden="true"/>}</li>)}</ol></div>}
    {!game.competition && <button className="btn primary finish-share" onClick={share}><Share2 size={17} aria-hidden="true"/>{t('shareChallenge')}</button>}
  </section>;

  if (finished && game.competition) return <div className="puzzle-game rt-game is-finished">{header}
    <DailyFinish app={app} date={game.daily} mode="roadtrip" game={t('roadtrip')} headline={t(game.detours + game.peeks === 0 ? 'rtDone' : finishKey(game.score / 1000, false))} mood={finishMood(game.score / 1000, game.detours + game.peeks === 0)}
      summary={[{ icon: 'route', value: String(game.detours), label: t(game.detours === 1 ? 'rtSumDetour' : 'rtSumDetours') }, { icon: 'eye', value: String(game.peeks), label: t(game.peeks === 1 ? 'rtSumPeek' : 'rtSumPeeks') }]}
      onShare={share} onDone={exit}>
      {resultCard}{map}{legend}{chips}
    </DailyFinish>
  </div>;

  return <div className={'puzzle-game rt-game' + (finished ? ' is-finished' : '')}>
    {header}
    {stats}
    <p className={'rt-notice' + (notice ? ' is-' + notice.tone : ' is-hint')} role="status" key={notice ? notice.text + game.route.length + game.peeks : 'hint'}>
      {notice?.tone === 'good' ? <Check size={16} strokeWidth={3} aria-hidden="true"/> : notice?.tone === 'bad' ? <Undo2 size={16} strokeWidth={2.6} aria-hidden="true"/> : notice?.tone === 'info' ? <Eye size={16} aria-hidden="true"/> : <MapPin size={16} aria-hidden="true"/>}
      <span>{notice?.text ?? (finished ? t('rtDone') : stopsTaken === 0 ? fill(t('rtStartHint'), { country: name(last.country) }) : fill(t('rtNextHint'), { country: name(last.country) }))}</span></p>
    {map}
    {legend}
    {chips}
    {factCard}
    {finished ? <>{resultCard}<div className="finish-actions"><button className="finish-quiet" onClick={exit}><Check size={16} strokeWidth={2.6} aria-hidden="true"/>{t('finishDone')}</button></div></>
      : <section className="rt-drive" aria-labelledby="rt-drive-title">
        <h2 id="rt-drive-title" className="rt-drive-title">{t('rtDriveTo')}</h2>
        <div className="rt-options">{game.options.map(id => { const flag = byId.get(id)?.flag;
          return <button key={id} type="button" className="rt-option" disabled={busy} onClick={() => void drive(id)}>{flag && <img src={flag} alt=""/>}<span>{name(id)}</span><ChevronRight className="rt-option-go" size={18} aria-hidden="true"/></button>; })}</div>
        <button type="button" className="btn secondary rt-peek" disabled={busy || peeking} onClick={() => void peek()}><Eye size={17} aria-hidden="true"/>{t('rtPeek')}</button>
        {game.competition && <p className="rt-rule muted">{t('rtRuleShort')}</p>}
      </section>}
  </div>;
}
