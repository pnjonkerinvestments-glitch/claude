'use client';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, RefreshCw, Share2, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { api, copyText, sound } from '@/lib/client';
import { BRAND } from '@/lib/config';
import { formatMetric } from '@/lib/puzzles/topics';
import { DUEL_ROUNDS, duelWon, type DuelBoard, type DuelCard, type DuelRound } from '@/lib/puzzles/duel';
import { ResetCountdown } from '../atelier/ResetCountdown';
import { HowToPlayButton } from '../atelier/HowToPlay';
import { notifyProgress } from '../atelier/DailyQuests';

type Board = DuelBoard & { date: string | null };
const storageKey = (board: Board) => 'roviko:duel:' + (board.date ?? board.seed);
function readPlays(board: Board): string[] { try { const v = JSON.parse(localStorage.getItem(storageKey(board)) ?? '[]'); return Array.isArray(v) ? v.filter(x => typeof x === 'string').slice(0, DUEL_ROUNDS) : []; } catch { return []; } }
function writePlays(board: Board, plays: string[]) { try { localStorage.setItem(storageKey(board), JSON.stringify(plays)); } catch { /* progress still works for this visit */ } notifyProgress(); }

/** World Duel: beat Roviko's country on each subject with a card from your hand, every card once. */
export function DuelGame({ app, practice = false }: { app: any; practice?: boolean }) {
  const { t, locale, go } = app;
  const loc = locale as 'en' | 'nl' | 'es';
  const tr = (v: { en: string; nl: string; es?: string }) => v[loc] ?? v.en;
  const [board, setBoard] = useState<Board | null>(null), [error, setError] = useState(false);
  const [plays, setPlays] = useState<string[]>([]), [step, setStep] = useState(0);
  const [nonce, setNonce] = useState<string | null>(() => practice ? Math.random().toString(36).slice(2, 10) : null);
  const [reload, setReload] = useState(0), [copied, setCopied] = useState(false);
  useEffect(() => {
    let active = true;
    api(nonce ? '/duel/practice/' + nonce : '/duel/today').then((b: Board) => {
      if (!active) return;
      const saved = readPlays(b);
      setBoard(b); setPlays(saved); setStep(Math.min(saved.length, DUEL_ROUNDS)); setError(false);
    }).catch(() => active && setError(true));
    return () => { active = false; };
  }, [nonce, reload]);
  const name = (c: DuelCard) => tr(c.name);
  const value = (round: DuelRound, v: number) => formatMetric(v, round.category.unit, loc) + (round.category.unit === 'm' ? ' m' : '');
  const results = useMemo(() => board ? plays.map((id, i) => duelWon(board.rounds[i], id)) : [], [board, plays]);
  if (error) return <div className="puzzle-game duel-game"><p className="inline-error" role="alert">{t('puzzleLoadError')} <button className="text-link" onClick={() => { setError(false); setReload(n => n + 1); }}>{t('retry')}</button></p></div>;
  if (!board) return <div className="puzzle-game duel-game"><p className="duel-loading">{t('loading')}</p></div>;

  const finished = step >= DUEL_ROUNDS;
  const round = board.rounds[Math.min(step, DUEL_ROUNDS - 1)];
  const played = plays[step];
  const revealed = !finished && played !== undefined;
  const wins = results.filter(Boolean).length;
  const cardOf = (id: string) => board.hand.find(c => c.id === id)!;
  function play(cardId: string) {
    if (!board || revealed || finished || plays.includes(cardId)) return;
    const next = [...plays, cardId];
    setPlays(next); writePlays(board, next);
    sound(duelWon(board.rounds[step], cardId) ? 'correct' : 'incorrect');
  }
  async function share() {
    const trail = results.map(ok => ok ? '🟢' : '🔴').join('');
    const url = new URL('/duel', window.location.origin).toString();
    const text = `${BRAND.name} · ${t('duel')} · ${board!.date ?? ''}\n${trail} ${wins}/${DUEL_ROUNDS}\n${url}`;
    try { if (navigator.share) { await navigator.share({ text }); return; } } catch { /* fall back to copying */ }
    await copyText(text); setCopied(true);
  }
  const newPractice = () => { setBoard(null); setPlays([]); setStep(0); setCopied(false); setNonce(Math.random().toString(36).slice(2, 10)); };

  return <section className="puzzle-game duel-game" aria-labelledby="duel-title">
    <div className="puzzle-top">
      <button className="icon-btn" onClick={() => go('/')} aria-label={t('back')}><ArrowLeft size={20}/></button>
      <div><strong><span aria-hidden="true">⚔️</span> {t('duel')}</strong><small>{board.date ?? t('duelPractice')}</small></div>
      <span className="puzzle-count">{Math.min(step + 1, DUEL_ROUNDS)} / {DUEL_ROUNDS}<small>{t('duelRounds')}</small></span>
      <HowToPlayButton mode="duel" t={t} locale={loc} auto={!finished}/>
    </div>
    <Progress className="puzzle-progress" value={(Math.min(plays.length, DUEL_ROUNDS) / DUEL_ROUNDS) * 100}/>

    <ol className="duel-route" aria-label={t('duelRoute')}>
      {board.rounds.map((r, i) => <li key={r.category.id} className={(i < results.length ? results[i] ? 'is-won' : 'is-lost' : '') + (i === step && !finished ? ' is-current' : '')}>
        <span aria-hidden="true">{i < results.length ? results[i] ? '✓' : '✕' : r.category.emoji}</span>
        <small>{tr(r.category.label)}</small>
      </li>)}
    </ol>

    {!finished ? <>
      <div className="duel-arena">
        <div className="duel-side duel-roviko">
          <img className="duel-mascot" src="/globe-logo.webp" alt="" width={64} height={64}/>
          <span className="duel-label">{t('duelRovikoPlays')}</span>
          <div className={'duel-card is-roviko' + (revealed ? duelWon(round, played) ? ' is-beaten' : ' is-winner' : '')}>
            <img src={round.roviko.flag} alt=""/><strong>{name(round.roviko)}</strong>
            {revealed && <b className="duel-value">{value(round, round.roviko.value)}</b>}
          </div>
        </div>
        <span className="duel-vs" aria-hidden="true">VS</span>
        <div className="duel-side duel-you">
          <span className="duel-subject"><span aria-hidden="true">{round.category.emoji}</span>{tr(round.category.label)}</span>
          {revealed ? <div className={'duel-card is-yours ' + (duelWon(round, played) ? 'is-winner' : 'is-beaten')}>
            <img src={cardOf(played).flag} alt=""/><strong>{name(cardOf(played))}</strong>
            <b className="duel-value">{value(round, round.hand[played].value)}</b>
          </div> : <div className="duel-card is-empty" aria-hidden="true">?</div>}
        </div>
      </div>

      {!revealed ? <>
        <h1 id="duel-title" className="duel-prompt">{t('duelPrompt').replace('{subject}', tr(round.category.label).toLowerCase())}</h1>
        <p className="duel-hint">{t(step === 0 ? 'duelIntro' : 'duelPlanAhead')}</p>
        <div className="duel-hand" role="group" aria-label={t('duelYourHand')}>
          {board.hand.map(c => { const used = plays.includes(c.id); return <button key={c.id} className="duel-card duel-pick" disabled={used} onClick={() => play(c.id)}>
            <img src={c.flag} alt=""/><strong>{name(c)}</strong>{used && <small>{t('duelUsed')}</small>}
          </button>; })}
        </div>
      </> : <div className={'duel-reveal ' + (duelWon(round, played) ? 'good' : 'bad')} role="status">
        <strong className="duel-verdict">{duelWon(round, played) ? <><Check size={22}/>{t('duelWin')}</> : <><X size={22}/>{t('duelLose')}</>}</strong>
        <div className="duel-bars">
          {[{ c: cardOf(played), v: round.hand[played] }, { c: round.roviko as DuelCard, v: round.roviko }].map(({ c, v }) => <div key={c.id} className="duel-bar">
            <span><img src={c.flag} alt=""/>{name(c)}</span>
            <i style={{ width: Math.max(4, v.value / Math.max(round.roviko.value, round.hand[played].value) * 100) + '%' }}/>
            <b>{value(round, v.value)} · #{v.rank}/{v.coverage}</b>
          </div>)}
        </div>
        {!duelWon(round, played) && board.solution[step] !== played && <p>{t('duelTip').replace('{card}', name(cardOf(board.solution[step])))}</p>}
        <p className="duel-explain">{tr(round.category.explanation)} <small>{round.roviko.referenceYear ? round.roviko.referenceYear + ' · ' : ''}<a href={round.roviko.sourceUrl} target="_blank" rel="noopener noreferrer">{round.roviko.source}</a></small></p>
        <button className="btn hero-cta duel-next" onClick={() => setStep(s => s + 1)}>{t(step + 1 >= DUEL_ROUNDS ? 'duelResults' : 'duelNext')}<ArrowRight size={20}/></button>
      </div>}
    </> : <div className="duel-finished">
      <img className="duel-mascot big" src="/globe-logo.webp" alt="" width={120} height={120}/>
      <h1 id="duel-title">{wins === DUEL_ROUNDS ? t('duelPerfect') : t('duelResultTitle').replace('{n}', String(wins))}</h1>
      <div className="duel-trail" aria-label={t('duelResultTitle').replace('{n}', String(wins))}>{results.map((ok, i) => <span key={i} className={ok ? 'won' : 'lost'} aria-hidden="true">{ok ? '✓' : '✕'}</span>)}</div>
      <section className="duel-solution">
        <h2>{t('duelRoute')}</h2>
        <ol>{board.rounds.map((r, i) => { const best = cardOf(board.solution[i]), mine = plays[i]; return <li key={r.category.id} className={results[i] ? 'won' : 'lost'}>
          <span className="duel-solution-subject"><span aria-hidden="true">{r.category.emoji}</span>{tr(r.category.label)}</span>
          <span><img src={best.flag} alt=""/>{name(best)} <b>{value(r, r.hand[best.id].value)}</b></span>
          <span className="duel-solution-vs">{t('duelVs')} <img src={r.roviko.flag} alt=""/>{name(r.roviko)} <b>{value(r, r.roviko.value)}</b></span>
          {mine && mine !== best.id && <small className={results[i] ? 'also-won' : ''}>{t('duelYourPick')}: {name(cardOf(mine))} ({value(r, r.hand[mine].value)})</small>}
        </li>; })}</ol>
      </section>
      <div className="duel-actions">
        <button className="btn secondary" onClick={share}><Share2 size={18}/>{t(copied ? 'copied' : 'share')}</button>
        <button className="btn primary" onClick={newPractice}><RefreshCw size={18}/>{t('duelNew')}</button>
      </div>
      {board.date && <ResetCountdown label={t('duelNextDaily')} t={t}/>}
    </div>}
  </section>;
}
