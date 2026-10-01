'use client';
import React, { useEffect, useState } from 'react';
import { ArrowRight, Check, Flag, Lock, Trophy } from 'lucide-react';
import { formatMetric } from '@/lib/puzzles/topics';
import type { RankView } from '@/lib/puzzles/rank';
import type { RankStat } from '@/lib/puzzles/rank-board';
import { DailyFinish } from '../atelier/DailyFinish';
import { HowToPlayButton } from '../atelier/HowToPlay';
import { GameHeader, editionLabel } from '../game/GameHeader';

type Lang = 'en' | 'nl' | 'es';
const fill = (text: string, values: Record<string, string | number>) => Object.entries(values).reduce((s, [k, v]) => s.replaceAll('{' + k + '}', String(v)), text);
const value = (s: RankStat, lang: Lang) => formatMetric(s.value, s.unit, lang) + (s.unit === 'm' ? ' m' : '');

/**
 * Rank Radar (1.21): eight countries, eight subjects, each subject once. Pick the subject in which the
 * current country ranks highest in the world; after each pick the radar shows all eight places.
 */
export function RankBoardGame({ game, app, busy, error, save, again, share }: { game: RankView; app: any; busy: boolean; error: string; save: (action: 'answer' | 'next', answer?: string) => void; again: () => void; share: () => void }) {
  const { t, locale, go, report, backToStart } = app;
  const lang = locale as Lang, board = game.board!;
  const [pick, setPick] = useState<string | null>(null);
  useEffect(() => setPick(null), [game.round, game.phase]);
  const used = new Map(game.answers.map((a, i) => [a.value, i]));
  const reveal = game.phase === 'reveal', finished = game.phase === 'finished';
  const round = board.rounds[Math.min(game.round, board.rounds.length - 1)], answer = reveal ? game.answers.at(-1) : undefined;
  const cat = (id?: string) => board.categories.find(c => c.id === id);
  const name = (r: { country: { name: Record<string, string> } }) => r.country.name[lang] ?? r.country.name.en;
  const total = game.answers.reduce((n, a) => n + (a.points ?? 0), 0), bestPicks = game.answers.filter(a => a.correct).length;

  const header = <GameHeader mode="rank" title={t('rankRadar')} edition={editionLabel(game.daily, lang, t('puzzleStartPractice'))} count={Math.min(game.round + 1, game.total) + ' / ' + game.total} unit={t('countries')} progress={game.answers.length / game.total} onExit={() => backToStart ? backToStart() : go('/daily')} exitLabel={t('back')} help={<HowToPlayButton mode="rank" t={t} locale={lang} auto={!finished}/>}/>;
  const strip = <ol className="rb-strip" aria-label={t('rbUpcoming')}>{board.rounds.map((r, i) => { const a = game.answers[i]; return <li key={r.id} className={(i === game.round && !finished ? 'is-current ' : '') + (a ? 'is-done' : '')}>
    <img src={r.country.flag} alt={name(r)} width={44} height={30}/>{a ? <span className="rb-strip-pick" aria-label={cat(a.value)?.label[lang]}>{cat(a.value)?.emoji}</span> : null}
  </li>; })}</ol>;

  if (finished) {
    const review = <details className="result-review rb-review" open={!game.competition}><summary>{t('rankReview')}</summary><ol>{board.rounds.map((r, i) => { const a = game.answers[i], s = a && r.stats?.[a.value], best = r.best?.[0]; return <li key={r.id}>
      <img src={r.country.flag} alt=""/><div><strong>{name(r)}</strong><span>{cat(a?.value)?.emoji} {cat(a?.value)?.label[lang]}{s ? ' · #' + s.rank : ''}{best && best !== a?.value && r.stats ? ' · ' + fill(t('rbBestWas'), { subject: cat(best)?.label[lang] ?? '', rank: r.stats[best].rank }) : ''}</span></div>
      <b className={a?.correct ? 'is-best' : ''}>+{a?.points ?? 0}</b></li>; })}</ol></details>;
    const summary = [{ icon: 'check' as const, value: bestPicks + '/' + game.total, label: t('rbBestPicks') }, ...(board.optimal ? [{ icon: 'flame' as const, value: board.optimal.toLocaleString(locale), label: t('rbOptimalShort') }] : [])];
    return <section className="puzzle-game rank-game rank-board">{header}
      {game.competition
        ? <DailyFinish app={app} date={game.daily!} mode="rank" game={t('rankRadar')} headline={t(bestPicks === game.total ? 'finishPerfect' : 'finishNice')} mood={bestPicks >= 6 ? 'cheer' : 'happy'} summary={summary} onShare={share} onDone={() => backToStart ? backToStart() : go('/daily')} onAgain={again} busy={busy}>{review}</DailyFinish>
        : <div className="daily-finish"><header className="finish-head"><div><small className="finish-game">{t('rankRadar')}</small><h1>{total.toLocaleString(locale)} {t('points')}</h1><p className="muted">{board.optimal ? fill(t('rbOptimal'), { n: board.optimal.toLocaleString(locale) }) : ''}</p></div></header>
          <div className="finish-actions"><button className="btn primary" disabled={busy} onClick={again}>{t('rankMore')}<ArrowRight size={17}/></button><button className="btn secondary" onClick={share}>{t('share')}</button></div>{review}</div>}
    </section>;
  }

  const stats = round.stats, chosen = answer && cat(answer.value), best = round.best ?? [];
  return <section className="puzzle-game rank-game rank-board">{header}{strip}
    <header className="rb-country">
      <div className="rb-flag"><img src={round.country.flag} alt=""/></div>
      <div><p className="rank-eyebrow">{fill(t('rbRound'), { n: game.round + 1, total: game.total })}</p><h1>{fill(t('rbPrompt'), { country: name(round) })}</h1><p className="rb-intro">{t('rbIntro')}</p></div>
    </header>
    {error && <div className="puzzle-error" role="alert"><span>{t(error)}</span></div>}
    {reveal && answer && chosen && stats && <div className={'rb-verdict' + (answer.correct ? ' is-best' : '')} role="status">
      <span className="rb-points">+{answer.points ?? 0}</span>
      <div><strong>{answer.correct ? t('rbBestPick') : chosen.emoji + ' ' + chosen.label[lang] + ': #' + stats[chosen.id].rank}</strong>
        <p>{answer.correct ? fill(t('rbRankLine'), { rank: stats[chosen.id].rank, count: stats[chosen.id].coverage }) + ' · ' + chosen.label[lang] : fill(t('rbBestWas'), { subject: cat(best[0])?.label[lang] ?? '', rank: stats[best[0]]?.rank ?? '' })}</p></div>
    </div>}
    <div className="rb-grid" role="group" aria-label={t('rbSubjects')}>{board.categories.map(c => {
      const takenBy = used.get(c.id), isTaken = takenBy !== undefined && !(reveal && takenBy === game.answers.length - 1), s = reveal ? stats?.[c.id] : undefined;
      const isChosen = reveal && answer?.value === c.id, isBest = reveal && best.includes(c.id);
      return <button key={c.id} type="button" className={'rb-tile' + (pick === c.id ? ' is-picked' : '') + (isTaken ? ' is-taken' : '') + (isChosen ? ' is-chosen' : '') + (isBest ? ' is-best' : '')}
        disabled={reveal || isTaken || busy || !!error} aria-pressed={pick === c.id} onClick={() => setPick(c.id)}>
        <span className="rb-emoji" aria-hidden="true">{c.emoji}</span>
        <strong>{c.label[lang] ?? c.label.en}</strong>
        {isTaken ? <small className="rb-taken"><img src={board.rounds[takenBy!].country.flag} alt=""/>+{game.answers[takenBy!].points ?? 0}</small>
          : s ? <><small className="rb-rank">#{s.rank} <span>/ {s.coverage}</span></small><span className="rb-bar" aria-hidden="true"><i style={{ width: Math.max(4, (1 - s.position) * 100) + '%' }}/></span><small className="rb-value">{value(s, lang)}</small></>
          : null}
        {isBest && <span className="rb-badge"><Trophy size={12} aria-hidden="true"/></span>}
      </button>;
    })}</div>
    <div className="rb-actions">
      {reveal
        ? <button className="btn primary btn-lg" disabled={busy || !!error} onClick={() => save('next')}>{t(game.round + 1 === game.total ? 'finish' : 'next')}<ArrowRight size={18}/></button>
        : <button className="btn primary btn-lg" disabled={!pick || busy || !!error} onClick={() => pick && save('answer', pick)}>{pick ? <><Lock size={17} aria-hidden="true"/>{fill(t('rbLock'), { subject: cat(pick)?.label[lang] ?? '' })}</> : t('rbChoose')}</button>}
    </div>
    <p className="rb-note"><Check size={14} aria-hidden="true"/>{t('rbRankOne')}</p>
    <div className="rank-footer"><button className="text-link muted" onClick={() => report({ id: round.id, mode: 'rank' })}><Flag size={14}/>{t('reportIssue')}</button><a href="/sources">{t('sources')}</a></div>
  </section>;
}
