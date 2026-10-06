'use client';
import { finishKey } from '@/lib/feel-copy';
import { sound, formatScore } from '@/lib/client';
import { plural } from '@/lib/plural';
import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, Flag, Lock } from 'lucide-react';
import type { RankView } from '@/lib/puzzles/rank';
import { DailyFinish } from '../atelier/DailyFinish';
import { FinishStage } from '../ds/FinishStage';
import { Peek, type CharacterMood } from '../ds/Character';
import { HowToPlayButton } from '../atelier/HowToPlay';
import { GameHeader, editionLabel } from '../game/GameHeader';

type Lang = 'en' | 'nl' | 'es';
const fill = (text: string, values: Record<string, string | number>) => Object.entries(values).reduce((s, [k, v]) => s.replaceAll('{' + k + '}', String(v)), text);
/** After a pick the next country comes by itself; the button is there for anyone who is quicker. */
const AUTO_NEXT_MS = 2200;

/**
 * Rank Radar (1.22), played like GeoRankle: one country at a time and you never know the next one.
 * Pick the subject in which this country ranks highest in the world; each subject once. After a pick
 * only that subject's world place (#) appears, with the country's flag. The full radar comes at the end.
 */
export function RankBoardGame({ game, app, busy, error, save, again, share }: { game: RankView; app: any; busy: boolean; error: string; save: (action: 'answer' | 'next', answer?: string) => void; again: () => void; share: () => void }) {
  const { t, locale, go, report, backToStart } = app;
  const lang = locale as Lang, board = game.board!;
  const [pick, setPick] = useState<string | null>(null);
  useEffect(() => setPick(null), [game.round, game.phase]);
  useEffect(() => { if (game.phase === 'reveal') sound('tap'); }, [game.phase, game.round]);
  const reveal = game.phase === 'reveal', finished = game.phase === 'finished', last = game.round + 1 === game.total;
  const round = board.rounds[Math.min(game.round, board.rounds.length - 1)], answer = reveal ? game.answers.at(-1) : undefined;
  const cat = (id?: string) => board.categories.find(c => c.id === id);
  const name = (r: { country?: { name: Record<string, string> } }) => r.country ? r.country.name[lang] ?? r.country.name.en : '';
  const total = game.answers.reduce((n, a) => n + (a.points ?? 0), 0), bestPicks = game.answers.filter(a => a.correct).length;
  const exit = () => backToStart ? backToStart() : go('/daily');

  // The next country arrives by itself a moment after the place is shown (not after the last one).
  const saveRef = useRef(save);
  useEffect(() => { saveRef.current = save; });
  useEffect(() => {
    if (!reveal || last || busy || error) return;
    const timer = window.setTimeout(() => saveRef.current('next'), AUTO_NEXT_MS);
    return () => window.clearTimeout(timer);
  }, [reveal, last, busy, error, game.round]);

  // Daily games show the running points in the coin pill; practice has no points.
  const score = game.competition && !finished ? game.score ?? total : undefined;
  const header = <GameHeader mode="rank" title={t('rankRadar')} edition={editionLabel(game.daily, lang, t('puzzleStartPractice'))} count={Math.min(game.round + 1, game.total) + ' / ' + game.total} unit={t('countries')} progress={game.answers.length / game.total} onExit={exit} exitLabel={t('back')} help={<HowToPlayButton mode="rank" t={t} locale={lang} auto={!finished}/>}
    kicker={false} score={score} scoreLabel={score === undefined ? undefined : plural(t, 'scorePill', score, '{n}', formatScore(score))}/>;

  if (finished) {
    const review = <details className="result-review rb-review" open={!game.competition}><summary>{t('rankReview')}</summary><ol>{board.rounds.map((r, i) => {
      const a = game.answers[i], s = a && r.stats?.[a.value], best = r.best?.[0], bestStat = best && r.stats?.[best];
      return <li key={r.id} className={a?.correct ? 'is-best' : ''}>
        {r.country && <img className="flag-img" src={r.country.flag} alt=""/>}
        <div><strong>{name(r)}</strong><span><i aria-hidden="true">{cat(a?.value)?.emoji}</i> {cat(a?.value)?.label[lang]}{s ? <b className="rb-hash">#{s.rank}</b> : null}</span>
          {best && best !== a?.value && bestStat ? <small>{fill(t('rbBestHere'), { subject: cat(best)?.label[lang] ?? '', rank: bestStat.rank })}</small> : null}</div>
        <b className="rb-points">+{a?.points ?? 0}</b></li>;
    })}</ol></details>;
    const summary = [{ icon: 'check' as const, value: bestPicks + '/' + game.total, label: t('rbBestPicks') }, ...(board.optimal ? [{ icon: 'flame' as const, value: board.optimal.toLocaleString(locale), label: t('rbOptimalShort') }] : [])];
    const mood = bestPicks >= 6 ? 'cheer' as const : bestPicks >= 3 ? 'happy' as const : 'wink' as const;
    return <section className="puzzle-game rank-game rank-board">{header}
      {game.competition
        ? <DailyFinish app={app} date={game.daily!} mode="rank" game={t('rankRadar')} headline={t(finishKey(total / 1000, bestPicks === game.total))} mood={mood} summary={summary} onShare={share} onDone={exit} onAgain={again} busy={busy}>{review}</DailyFinish>
        : <div className="daily-finish">
          <FinishStage game={t('rankRadar')} headline={t(finishKey(total / 1000, bestPicks === game.total))} mood={mood} score={total} max={1000} unit={t('points')} locale={locale}
            chips={summary}/>
          <div className="finish-actions"><button className="btn primary" disabled={busy} onClick={again}>{t('rankMore')}<ArrowRight size={17}/></button><button className="btn secondary" onClick={share}>{t('share')}</button></div>{review}</div>}
    </section>;
  }

  const chosen = answer && cat(answer.value), chosenStat = chosen ? round.stats?.[chosen.id] : undefined;
  const usedBy = new Map(game.answers.map((a, i) => [a.value, i]));
  // Roviko reacts to the pick: a hop for the country's best subject, a wink for a good one, a gasp for a weak one.
  const gained = answer?.points ?? 0;
  const mood: CharacterMood = !reveal || !answer ? 'happy' : answer.correct ? 'cheer' : gained >= 60 ? 'wink' : 'shock';
  return <section className="puzzle-game rank-game rank-board">{header}
    <header className={'rb-hero tp-card' + (reveal ? answer?.correct ? ' is-right' : ' is-revealed' : '')} key={round.id}>
      <Peek mood={mood} key={mood}/>
      <p className="tp-kicker">{fill(t('questionOf'), { game: t('rankRadar'), n: Math.min(game.round + 1, game.total), total: game.total })}</p>
      {round.country && <span className="rb-hero-flag"><img className="flag-img" src={round.country.flag} alt=""/></span>}
      <h1>{name(round)}</h1>
      {reveal && game.competition && answer
        ? <p className="rb-ask rb-gain"><span className="t-points" aria-hidden="true">+{formatScore(gained)}</span><span className="sr-only">{plural(t, 'tpPointsGained', gained, '{n}', formatScore(gained))}</span></p>
        : <p className="rb-ask">{fill(t('rbPrompt'), { country: name(round) })}</p>}
    </header>
    {error && <div className="puzzle-error" role="alert"><span>{t(error)}</span></div>}
    <p className="sr-only" role="status">{reveal && chosen && chosenStat ? fill(t('rbPicked'), { subject: chosen.label[lang] ?? chosen.label.en, rank: chosenStat.rank, count: chosenStat.coverage }) : ''}</p>
    <ul className="rb-list" role="group" aria-label={t('rbSubjects')}>{board.categories.map(c => {
      const by = usedBy.get(c.id), owner = by !== undefined ? board.rounds[by] : undefined, stat = owner?.stats?.[c.id];
      const isNow = reveal && answer?.value === c.id, isUsed = by !== undefined && !isNow;
      return <li key={c.id}><button type="button" className={'rb-row' + (pick === c.id ? ' is-picked' : '') + (isUsed ? ' is-used' : '') + (isNow ? ' is-now' : '')}
        disabled={reveal || by !== undefined || busy || !!error} aria-pressed={pick === c.id} onClick={() => setPick(c.id)}>
        <span className="rb-emoji" aria-hidden="true">{c.emoji}</span>
        <strong>{c.label[lang] ?? c.label.en}</strong>
        {stat && owner?.country ? <span className="rb-place"><img className="flag-img" src={owner.country.flag} alt={name(owner)}/><b>#{stat.rank}</b></span>
          : pick === c.id ? <span className="rb-tick" aria-hidden="true"><Check size={16} strokeWidth={3}/></span> : null}
      </button></li>;
    })}</ul>
    <div className="rb-actions">
      {reveal
        ? <button className="btn primary btn-lg rb-next" disabled={busy || !!error} onClick={() => save('next')}>{t(last ? 'finish' : 'rbNextCountry')}<ArrowRight size={18}/>{!last && <i className="rb-timer" style={{ animationDuration: AUTO_NEXT_MS + 'ms' }} aria-hidden="true"/>}</button>
        : <button className="btn primary btn-lg" disabled={!pick || busy || !!error} onClick={() => pick && save('answer', pick)}>{pick ? <><Lock size={17} aria-hidden="true"/>{fill(t('rbLock'), { subject: cat(pick)?.label[lang] ?? '' })}</> : t('rbChoose')}</button>}
    </div>
    <div className="rank-footer"><button className="text-link muted" onClick={() => report({ id: round.id, mode: 'rank' })}><Flag size={14}/>{t('reportIssue')}</button><a href="/sources">{t('sources')}</a></div>
  </section>;
}
