'use client';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronRight, List, RefreshCw, Share2, X } from 'lucide-react';
import { api, post, copyText, sound } from '@/lib/client';
import { BRAND } from '@/lib/config';
import { formatMetric } from '@/lib/puzzles/topics';
import { duelWon, type DuelBoard, type DuelCard, type DuelRound } from '@/lib/puzzles/duel-shared';
import { ResetCountdown } from '../atelier/ResetCountdown';
import { HowToPlayButton } from '../atelier/HowToPlay';
import { DailyFinish } from '../atelier/DailyFinish';
import { FinishStage } from '../ds/FinishStage';
import { GameHeader, editionLabel } from '../game/GameHeader';
import { Mascot } from '../ds/Mascot';
import { notifyProgress } from '../atelier/DailyQuests';

type Board = DuelBoard & { date: string | null };
/** The scored daily duel comes from a server session; a blind duel hides every value until the last card is down. */
type Session = Board & { id: string; version: number; plays: string[]; phase: string; competition?: unknown; score?: number };
const storageKey = (board: Board) => 'roviko:duel:' + (board.date ?? board.seed);
function readPlays(board: Board): string[] { try { const v = JSON.parse(localStorage.getItem(storageKey(board)) ?? '[]'); return Array.isArray(v) ? v.filter(x => typeof x === 'string').slice(0, board.rounds.length) : []; } catch { return []; } }
function writePlays(board: Board, plays: string[]) { try { localStorage.setItem(storageKey(board), JSON.stringify(plays)); } catch { /* progress still works for this visit */ } notifyProgress(); }
const fill = (text: string, values: Record<string, string | number>) => Object.entries(values).reduce((s, [k, v]) => s.replaceAll('{' + k + '}', String(v)), text);

/**
 * World Duel: beat Roviko's country on each subject with a card from your hand, every card once.
 * Since 1.21 there are seven rounds and the duel is blind: you lay down all seven cards first and only then see,
 * country by country, who won.
 */
export function DuelGame({ app, practice = false }: { app: any; practice?: boolean }) {
  const { t, locale, go } = app;
  const loc = locale as 'en' | 'nl' | 'es';
  const tr = (v: { en: string; nl: string; es?: string }) => v[loc] ?? v.en;
  const [board, setBoard] = useState<Board | null>(null), [error, setError] = useState(false);
  const [plays, setPlays] = useState<string[]>([]), [step, setStep] = useState(0);
  const [nonce, setNonce] = useState<string | null>(() => practice ? Math.random().toString(36).slice(2, 10) : null);
  const [reload, setReload] = useState(0), [copied, setCopied] = useState(false);
  const [session, setSession] = useState<Session | null>(null), [sending, setSending] = useState(false);
  const [detail, setDetail] = useState<number | null>(null);
  useEffect(() => {
    let active = true;
    (nonce ? api('/duel/practice/' + nonce) : post('/duels', { competition: true })).then((b: Board | Session) => {
      if (!active) return;
      const saved = 'plays' in b ? b.plays : readPlays(b);
      setSession('plays' in b ? b : null);
      setBoard(b); setPlays(saved); setStep(Math.min(saved.length, b.rounds.length)); setError(false); setDetail(null);
    }).catch(() => active && setError(true));
    return () => { active = false; };
  }, [nonce, reload]);
  const total = board?.rounds.length ?? 7, blind = !!board?.blind;
  const name = (c: DuelCard) => tr(c.name);
  const value = (round: DuelRound, v: number) => formatMetric(v, round.category.unit, loc) + (round.category.unit === 'm' ? ' m' : '');
  // Values of a blind daily duel only reach the browser once it is finished.
  const known = (i: number) => !!board && board.rounds[i] && Object.keys(board.rounds[i].hand).length > 0;
  const results = useMemo(() => board ? plays.map((id, i) => known(i) ? duelWon(board.rounds[i], id) : false) : [], [board, plays]);
  if (error) return <div className="puzzle-game duel-game"><p className="inline-error" role="alert">{t('puzzleLoadError')} <button className="text-link" onClick={() => { setError(false); setReload(n => n + 1); }}>{t('retry')}</button></p></div>;
  if (!board) return <div className="puzzle-game duel-game"><p className="duel-loading">{t('loading')}</p></div>;

  const finished = step >= total && (!session || session.phase === 'finished');
  const round = board.rounds[Math.min(step, total - 1)];
  const played = plays[step];
  const revealed = !blind && !finished && played !== undefined;
  const wins = results.filter(Boolean).length;
  const cardOf = (id: string) => board.hand.find(c => c.id === id)!;
  async function play(cardId: string) {
    if (!board || revealed || finished || sending || plays.includes(cardId)) return;
    if (session) {
      setSending(true);
      try {
        const next: Session = await post('/duels/' + session.id + '/play', { version: session.version, card: cardId });
        setSession(next); setBoard(next); setPlays(next.plays); notifyProgress();
        if (blind) { sound(next.phase === 'finished' ? 'win' : 'tap'); setStep(next.plays.length); }
        else sound(next.rounds[step] && duelWon(next.rounds[step], cardId) ? 'correct' : 'incorrect');
      } catch { setReload(n => n + 1); } finally { setSending(false); }
      return;
    }
    const next = [...plays, cardId];
    setPlays(next); writePlays(board, next);
    if (blind) { sound(next.length === total ? 'win' : 'tap'); setStep(next.length); }
    else sound(duelWon(board.rounds[step], cardId) ? 'correct' : 'incorrect');
  }
  async function share() {
    const trail = results.map(ok => ok ? '🟢' : '🔴').join('');
    const url = new URL('/duel', window.location.origin).toString();
    const text = `${BRAND.name} · ${t('duel')} · ${board!.date ?? ''}\n${trail} ${wins}/${total}\n${url}`;
    try { if (navigator.share) { await navigator.share({ text }); return; } } catch { /* fall back to copying */ }
    await copyText(text); setCopied(true);
  }
  const newPractice = () => { setSession(null); setBoard(null); setPlays([]); setStep(0); setCopied(false); setDetail(null); setNonce(Math.random().toString(36).slice(2, 10)); };
  const exit = () => app.backToStart ? app.backToStart() : go('/');

  const header = <GameHeader mode="duel" title={t('duel')} edition={editionLabel(board.date, loc, t('duelPractice'))} count={Math.min(step + 1, total) + ' / ' + total} unit={t('duelRounds')} progress={Math.min(plays.length, total) / total} onExit={exit} exitLabel={t('back')} help={<HowToPlayButton mode="duel" t={t} locale={loc} auto={!finished}/>}/>;

  // The route: every subject with Roviko's country up front, so the whole hand can be planned.
  const route = <ol className={'duel-route' + (blind ? ' is-blind' : '')} aria-label={t('duelRoute')}>
    {board.rounds.map((r, i) => { const mine = plays[i], done = finished || (!blind && i < results.length);
      return <li key={r.category.id} className={(done ? results[i] ? 'is-won' : 'is-lost' : mine ? 'is-played' : '') + (i === step && !finished ? ' is-current' : '')}>
        <span aria-hidden="true">{done ? results[i] ? '✓' : '✕' : r.category.emoji}</span>
        {blind && <span className="duel-route-flags" aria-hidden="true"><img src={r.roviko.flag} alt=""/>{mine && <img src={cardOf(mine).flag} alt=""/>}</span>}
        <small>{tr(r.category.label)}</small>
      </li>; })}
  </ol>;

  if (finished) {
    const overview = <DuelOverview board={board} plays={plays} results={results} detail={detail} setDetail={setDetail} t={t} tr={tr} value={value}/>;
    const headline = wins === total ? t('duelPerfect') : fill(t('duelResultTitle'), { n: wins });
    if (session?.competition) return <section className="puzzle-game duel-game" aria-labelledby="duel-title">{header}
      <DailyFinish app={app} date={board.date!} mode="duel" game={t('duel')} headline={headline} mood={wins === total ? 'cheer' : wins >= 4 ? 'happy' : 'wink'}
        summary={[{ icon: 'check', value: wins + '/' + total, label: t('duelWonShort') }]} trail={results} onShare={share} onDone={exit} onAgain={newPractice}>{overview}</DailyFinish>
    </section>;
    return <section className="puzzle-game duel-game" aria-labelledby="duel-title">{header}
      <div className="duel-finished">
        <FinishStage game={t('duel')} headline={headline} mood={wins === total ? 'cheer' : wins >= 4 ? 'happy' : 'wink'} locale={locale} score={wins} max={total} unit={t('duelWonShort')} trail={results} titleId="duel-title"/>
        {overview}
        <div className="duel-actions">
          <button className="btn secondary" onClick={share}><Share2 size={18}/>{t(copied ? 'copied' : 'share')}</button>
          <button className="btn primary" onClick={newPractice}><RefreshCw size={18}/>{t('duelNew')}</button>
        </div>
        {board.date && !session?.competition && <ResetCountdown label={t('duelNextDaily')} t={t}/>}
      </div>
    </section>;
  }

  return <section className="puzzle-game duel-game" aria-labelledby="duel-title">{header}{route}
    <div className="duel-arena">
      <div className="duel-side duel-roviko">
        <Mascot mood="curious" size={64} className="duel-mascot"/>
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
      <p className="duel-hint">{blind ? t(step === 0 ? 'duelBlindIntro' : 'duelBlindHint') : t(step === 0 ? 'duelIntro' : 'duelPlanAhead')}</p>
      <div className="duel-hand" role="group" aria-label={t('duelYourHand')}>
        {board.hand.map(c => { const at = plays.indexOf(c.id), used = at >= 0; return <button key={c.id} className="duel-card duel-pick" disabled={used || sending} onClick={() => play(c.id)}>
          <img src={c.flag} alt=""/><strong>{name(c)}</strong>{used && <small>{blind ? board.rounds[at].category.emoji + ' ' + t('duelUsed') : t('duelUsed')}</small>}
        </button>; })}
      </div>
      {blind && step === total && session && session.phase !== 'finished' ? <p className="duel-hint">{t('loading')}</p> : null}
    </> : <div className={'duel-reveal ' + (duelWon(round, played) ? 'good' : 'bad')} role="status">
      <strong className="duel-verdict">{duelWon(round, played) ? <><Check size={22}/>{t('duelWin')}</> : <><X size={22}/>{t('duelLose')}</>}</strong>
      <DuelBars round={round} card={cardOf(played)} name={name} value={value}/>
      {!duelWon(round, played) && board.solution[step] !== played && <p>{t('duelTip').replace('{card}', name(cardOf(board.solution[step])))}</p>}
      <p className="duel-explain">{tr(round.category.explanation)} <small>{round.roviko.referenceYear ? round.roviko.referenceYear + ' · ' : ''}<a href={round.roviko.sourceUrl} target="_blank" rel="noopener noreferrer">{round.roviko.source}</a></small></p>
      <button className="btn hero-cta duel-next" onClick={() => setStep(s => s + 1)}>{t(step + 1 >= total ? 'duelResults' : 'duelNext')}<ArrowRight size={20}/></button>
    </div>}
  </section>;
}

function DuelBars({ round, card, name, value }: { round: DuelRound; card: DuelCard; name: (c: DuelCard) => string; value: (r: DuelRound, v: number) => string }) {
  const mine = round.hand[card.id], top = Math.max(round.roviko.value, mine.value, 1e-9);
  return <div className="duel-bars">
    {[{ c: card, v: mine, you: true }, { c: round.roviko as DuelCard, v: round.roviko, you: false }].map(({ c, v, you }) => <div key={c.id} className={'duel-bar' + (you ? ' is-you' : '')}>
      <span><img src={c.flag} alt=""/>{name(c)}</span>
      <i style={{ width: Math.max(4, v.value / top * 100) + '%' }}/>
      <b>{value(round, v.value)} · #{v.rank}/{v.coverage}</b>
    </div>)}
  </div>;
}

/** After a duel: one row per country, tap a row to open that duel, then step through them one by one. */
function DuelOverview({ board, plays, results, detail, setDetail, t, tr, value }: {
  board: Board; plays: string[]; results: boolean[]; detail: number | null; setDetail: (i: number | null) => void;
  t: (k: string) => string; tr: (v: { en: string; nl: string; es?: string }) => string; value: (r: DuelRound, v: number) => string;
}) {
  const total = board.rounds.length, cardOf = (id: string) => board.hand.find(c => c.id === id)!, name = (c: DuelCard) => tr(c.name);
  if (detail !== null) {
    const r = board.rounds[detail], mine = cardOf(plays[detail]), won = results[detail], best = cardOf(board.solution[detail]);
    return <section ref={el => el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })} className={'duel-detail ' + (won ? 'good' : 'bad')} aria-live="polite">
      <header className="duel-detail-head">
        <button className="btn ghost btn-sm" onClick={() => setDetail(null)}><List size={16} aria-hidden="true"/>{t('duelOverview')}</button>
        <small>{fill(t('duelOf'), { n: detail + 1, total })}</small>
      </header>
      <p className="duel-detail-subject"><span aria-hidden="true">{r.category.emoji}</span>{tr(r.category.label)}</p>
      <strong className="duel-verdict">{won ? <><Check size={20}/>{t('duelWin')}</> : <><X size={20}/>{t('duelLose')}</>}</strong>
      <DuelBars round={r} card={mine} name={name} value={value}/>
      {best.id !== mine.id && <p className="duel-detail-best"><img src={best.flag} alt=""/>{fill(t(won ? 'duelRouteCard' : 'duelBestHere'), { card: name(best), value: value(r, r.hand[best.id].value) })}</p>}
      <p className="duel-explain">{tr(r.category.explanation)} <small>{r.roviko.referenceYear ? r.roviko.referenceYear + ' · ' : ''}<a href={r.roviko.sourceUrl} target="_blank" rel="noopener noreferrer">{r.roviko.source}</a></small></p>
      <nav className="duel-detail-nav">
        <button className="btn secondary" disabled={detail === 0} onClick={() => setDetail(detail - 1)}><ArrowLeft size={17} aria-hidden="true"/>{t('back')}</button>
        {detail + 1 < total ? <button className="btn primary" onClick={() => setDetail(detail + 1)}>{t('duelNext')}<ArrowRight size={17} aria-hidden="true"/></button>
          : <button className="btn primary" onClick={() => setDetail(null)}><List size={17} aria-hidden="true"/>{t('duelOverview')}</button>}
      </nav>
    </section>;
  }
  return <section className="duel-overview">
    <h2>{t('duelOverviewTitle')}</h2>
    <ol>{board.rounds.map((r, i) => { const mine = plays[i] ? cardOf(plays[i]) : null; return <li key={r.category.id}>
      <button className={'duel-row ' + (results[i] ? 'won' : 'lost')} onClick={() => setDetail(i)}>
        <span className="duel-row-subject"><span aria-hidden="true">{r.category.emoji}</span>{tr(r.category.label)}</span>
        <span className="duel-row-match">{mine && <><img src={mine.flag} alt=""/>{name(mine)}</>}<em>{t('duelVs')}</em><img src={r.roviko.flag} alt=""/>{name(r.roviko)}</span>
        <span className="duel-row-result" aria-label={t(results[i] ? 'duelWin' : 'duelLose')}>{results[i] ? <Check size={16} strokeWidth={3}/> : <X size={16} strokeWidth={3}/>}</span>
        <ChevronRight size={18} aria-hidden="true" className="duel-row-go"/>
      </button>
    </li>; })}</ol>
  </section>;
}
