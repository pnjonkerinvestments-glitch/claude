'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Flame, Plus, Share2, Sparkles } from 'lucide-react';
import { api, post, sound, formatScore } from '@/lib/client';
import { plural } from '@/lib/plural';
import { finishKey, finishMood } from '@/lib/feel-copy';
import { NAMED_COUNTRIES, countryName, resolveCountry, suggestCountries } from '@/lib/puzzles/country-names';
import { dutchCapital } from '@/i18n/capitals-nl';
import { spanishCapital } from '@/i18n/content';
import { CONTINENT_NAMES } from '@/i18n/v155';
import { DailyFinish } from '../atelier/DailyFinish';
import { HowToPlayButton } from '../atelier/HowToPlay';
import { GameHeader, editionLabel } from '../game/GameHeader';
import { Peek, type CharacterMood } from '../ds/Character';
import { Loading } from '../app/shared';

type Lang = 'en' | 'nl' | 'es';
type Category = { id: string; kind: string; icon: string; label: Record<Lang, string> };
type Reason = { key: string; country: string; value?: number | string; other?: string; category?: string };
type Cell = { country: string; share: number | null; rare: boolean } | null;
export type CrossroadsView = {
  id: string; mode: 'crossroads'; daily: string; edition: number; version: number; phase: 'playing' | 'finished'; competition: { version: 1; mode: 'crossroads' } | null;
  rows: Category[]; cols: Category[]; cells: Cell[]; guessesLeft: number; guessesTotal: number;
  last: { cell: number; country: string; ok: boolean; reason?: Reason } | null; score: number; wrong?: number; tricky?: boolean; examples: (string | null)[] | null;
};
const fill = (text: string, values: Record<string, string | number>) => Object.entries(values).reduce((s, [k, v]) => s.replaceAll('{' + k + '}', String(v)), text);
const byId = new Map(NAMED_COUNTRIES.map(c => [c.id, c]));
const nextEmpty = (cells: Cell[], from: number) => { for (let i = 1; i <= 9; i++) { const k = (from + i) % 9; if (!cells[k]) return k; } return -1; };

/**
 * Daily Crossroads (1.55): fill a 3×3 grid with countries that fit both their row and their column. Everyone gets the
 * same grid each day; 12 guesses, no timer. Rules, categories and the grid of the day live in lib/puzzles/crossroads.ts.
 */
export function CrossroadsGame({ app }: { app: any }) {
  const { t, locale, go, backToStart, fail } = app;
  const lang = locale as Lang;
  const [game, setGame] = useState<CrossroadsView | null>(null), [error, setError] = useState('');
  const [selected, setSelected] = useState(0), [text, setText] = useState(''), [active, setActive] = useState(0), [open, setOpen] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'good' | 'bad' | 'info'; text: string } | null>(null), [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<number | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const name = (id: string) => { const c = byId.get(id); return c ? countryName(c, lang) : id; };
  const load = async () => { setError(''); try { const g = await post('/crossroads'); setGame(g); setSelected(Math.max(0, g.cells.findIndex((c: Cell) => !c))); } catch (e: any) { setError(e?.message ?? 'puzzleLoadError'); } };
  useEffect(() => { void load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const suggestions = useMemo(() => text.trim().length >= 1 ? suggestCountries(text, lang, 6) : [], [text, lang]);
  useEffect(() => { setActive(0); }, [text]);

  if (error) return <div className="puzzle-error" role="alert"><span>{t(error === 'puzzleLoadError' ? 'puzzleLoadError' : 'puzzleLoadError')}</span><button className="btn secondary" onClick={() => void load()}>{t('retry')}</button></div>;
  if (!game) return <Loading variant="game"/>;

  const finished = game.phase === 'finished';
  const filled = game.cells.filter(Boolean).length;
  const row = (cell: number) => game.rows[Math.floor(cell / 3)], col = (cell: number) => game.cols[cell % 3];
  const label = (c: Category) => c.label[lang] ?? c.label.en;
  const exit = () => backToStart ? backToStart() : go('/daily');

  /** One short line for a wrong guess, in the player's language. */
  const reasonText = (r: Reason, cell: number) => {
    const country = name(r.country), other = r.other ? (byId.get(r.other) ? name(r.other) : r.other) : '';
    const capital = typeof r.value === 'string' ? (lang === 'nl' ? dutchCapital(r.value) : lang === 'es' ? spanishCapital(r.value) : r.value) : '';
    const num = typeof r.value === 'number' ? r.value.toLocaleString(locale) : '';
    switch (r.key) {
      case 'xrContinent': return fill(t('xrContinent'), { country, continent: CONTINENT_NAMES[String(r.value)]?.[lang] ?? String(r.value) });
      case 'xrCapital': return fill(t('xrCapital'), { country, capital });
      case 'xrNeighbours': return r.value === 0 ? fill(t('xrNeighboursNone'), { country }) : r.value === 1 ? fill(t('xrNeighboursOne'), { country }) : fill(t('xrNeighbours'), { country, n: num });
      case 'xrRegion': case 'xrLanguage': { const failing = [row(cell), col(cell)].find(c => c.id.endsWith(':' + r.other)); return fill(t('xrNotCategory'), { country, category: failing ? label(failing) : '' }); }
      case 'xrNoFit': return fill(t('xrNoFit'), { country, row: label(row(cell)), col: label(col(cell)) });
      default: return fill(t(r.key), { country, other, n: num });
    }
  };

  async function submit(choice?: string) {
    if (busy || finished) return;
    if (game!.cells[selected]) { setNotice({ tone: 'info', text: t('xrPickFirst') }); return; }
    const typed = text.trim();
    const id = choice ?? (open && suggestions[active] ? suggestions[active].id : resolveCountry(typed) ?? (suggestions.length === 1 ? suggestions[0].id : null));
    if (!typed && !choice) return;
    // Unknown names and countries already in the grid never cost a guess: the device answers at once.
    if (!id) { setNotice({ tone: 'info', text: fill(t('xrUnknownName'), { name: typed }) }); return; }
    if (game!.cells.some(c => c?.country === id)) { setNotice({ tone: 'info', text: fill(t('xrUsed'), { country: name(id) }) }); return; }
    setBusy(true); setOpen(false);
    try {
      const g: CrossroadsView = await post('/crossroads/' + game!.id + '/guess', { version: game!.version, cell: selected, country: id });
      setGame(g); setText('');
      if (g.last?.ok) {
        sound('correct'); setFlash(selected); window.setTimeout(() => setFlash(null), 900);
        setNotice({ tone: 'good', text: fill(t('xrRight'), { country: name(id) }) });
        // After a right answer the next empty square is picked by itself.
        const next = nextEmpty(g.cells, selected); if (next >= 0) setSelected(next);
      } else {
        sound('incorrect');
        setNotice({ tone: 'bad', text: (g.last?.reason ? reasonText(g.last.reason, selected) : fill(t('xrNoFit'), { country: name(id), row: label(row(selected)), col: label(col(selected)) })) + ' ' + t('xrPenalty') });
      }
      if (g.phase !== 'finished') window.setTimeout(() => input.current?.focus(), 30);
    } catch (e: any) {
      const code = e?.message;
      if (code === 'UNKNOWN_COUNTRY') setNotice({ tone: 'info', text: fill(t('xrUnknownName'), { name: typed }) });
      else if (code === 'COUNTRY_USED') setNotice({ tone: 'info', text: fill(t('xrUsed'), { country: name(id) }) });
      else if (code === 'STATE_CHANGED' || code === 'CELL_FILLED') { const g = await api('/crossroads/' + game!.id).catch(() => null); if (g) setGame(g); }
      else fail(e);
    } finally { setBusy(false); }
  }

  const score = game.score ?? 0, full = filled === 9;
  const shares = game.cells.filter((c): c is NonNullable<Cell> => !!c && c.share !== null);
  const average = shares.length ? Math.round(shares.reduce((n, c) => n + c.share!, 0) / shares.length) : null;
  const rarest = shares.length ? shares.reduce((a, b) => (b.share! < a.share! ? b : a)) : null;
  const blocks = game.cells.map(c => c ? (c.rare ? '🟪' : '🟩') : '⬜');
  const shareText = () => [fill(t('xrShareTitle'), { n: game.edition }), blocks.slice(0, 3).join(''), blocks.slice(3, 6).join(''), blocks.slice(6, 9).join(''),
    rarest ? fill(t('xrShareLine'), { points: formatScore(score), rarity: average ?? 0, country: name(rarest.country), n: rarest.share! }) : fill(t('xrShareLineShort'), { points: formatScore(score) }),
    'roviko.app'].join('\n');
  const share = () => (app.share ?? app.copy)(shareText());
  const mood: CharacterMood = finished ? (full ? 'cheer' : 'happy') : notice?.tone === 'good' ? 'cheer' : notice?.tone === 'bad' ? 'worried' : 'happy';

  const header = <GameHeader mode="crossroads" title={t('crossroads')} edition={editionLabel(game.daily, lang, t('xrPractice'))} count={filled + ' / 9'} unit={t('xrSquares')}
    progress={filled / 9} onExit={exit} exitLabel={t('back')} help={<HowToPlayButton mode="crossroads" t={t} locale={lang} auto={!finished}/>} kicker={false}
    score={game.competition && !finished ? score : undefined} scoreLabel={plural(t, 'scorePill', score, '{n}', formatScore(score))}/>;

  const grid = <div className={'xr-grid' + (finished ? ' is-finished' : '')} role="grid" aria-label={fill(t('xrStatus'), { filled, left: game.guessesLeft })}>
    <div className="xr-corner" aria-hidden="true"><Peek mood={mood} key={mood}/></div>
    {game.cols.map(c => <div key={c.id} className="xr-head xr-col" role="columnheader"><span className="xr-icon" aria-hidden="true">{c.icon}</span><span className="xr-label">{label(c)}</span></div>)}
    {game.rows.map((r, ri) => <React.Fragment key={r.id}>
      <div className="xr-head xr-row" role="rowheader"><span className="xr-icon" aria-hidden="true">{r.icon}</span><span className="xr-label">{label(r)}</span></div>
      {game.cols.map((c, ci) => {
        const i = ri * 3 + ci, cell = game.cells[i], example = game.examples?.[i];
        const cls = 'xr-cell' + (cell ? cell.rare ? ' is-rare' : ' is-right' : finished ? ' is-empty-end' : '') + (!finished && selected === i && !cell ? ' is-selected' : '') + (flash === i ? ' is-new' : '');
        const country = cell ? byId.get(cell.country) : undefined;
        const shareLabel = cell ? cell.share === null ? t('xrEarly') : fill(t('xrShare'), { n: cell.share }) : '';
        return <button key={c.id} type="button" role="gridcell" className={cls} disabled={finished || !!cell}
          aria-label={fill(t('xrCell'), { row: label(r), col: label(c) }) + (cell ? ' · ' + fill(t('xrCellFilled'), { country: name(cell.country), share: shareLabel }) : '')}
          aria-pressed={!cell && selected === i} onClick={() => { setSelected(i); setNotice(null); input.current?.focus(); }}>
          {cell ? <>
            {country && <img className="xr-flag" src={country.flag} alt=""/>}
            <strong className="xr-name">{name(cell.country)}</strong>
            <small className="xr-share">{cell.rare && <Sparkles size={11} aria-hidden="true"/>}{cell.rare ? t('xrRareTag') + ' · ' : ''}{shareLabel}</small>
          </> : finished ? (example ? <small className="xr-example">{fill(t('xrExample'), { country: name(example) })}</small> : null) : <Plus className="xr-plus" size={22} strokeWidth={2.4} aria-hidden="true"/>}
        </button>;
      })}
    </React.Fragment>)}
  </div>;

  const resultCard = <section className="xr-result tp-card" aria-labelledby="xr-result-title">
    <h2 id="xr-result-title">{full ? fill(t('xrFull'), { points: formatScore(score) }) : fill(t('xrPartial'), { n: filled, points: formatScore(score) })}</h2>
    <div className="xr-mini" aria-hidden="true">{game.cells.map((c, i) => <i key={i} className={c ? c.rare ? 'is-rare' : 'is-right' : ''}/>)}</div>
    {(game.wrong ?? 0) > 0 && <p className="muted">{fill(t('xrWrongLine'), { n: game.wrong!, points: game.wrong! * 25 })}</p>}
    {average !== null ? <p>{fill(t('xrAvgRarity'), { n: average })}</p> : <p className="muted">{t('xrNoRarityYet')}</p>}
    {rarest && <p className={rarest.rare ? 'xr-rarest is-rare' : 'xr-rarest'}>{fill(t('xrRarest'), { country: name(rarest.country), n: rarest.share! })}</p>}
    {!game.competition && <button className="btn primary finish-share" onClick={share}><Share2 size={17} aria-hidden="true"/>{t('shareChallenge')}</button>}
  </section>;

  if (finished && game.competition) return <div className="puzzle-game xr-game is-finished">{header}
    <DailyFinish app={app} date={game.daily} mode="crossroads" game={t('crossroads')} headline={t(full ? 'xrGridDone' : finishKey(score / 1000, full))} mood={finishMood(score / 1000, full)}
      summary={[{ icon: 'check', value: filled + '/9', label: t('xrSquares') }, ...(average !== null ? [{ icon: 'flame' as const, value: average + '%', label: t('xrRarityChip') }] : [])]}
      onShare={share} onDone={exit}>
      {resultCard}{grid}
    </DailyFinish>
  </div>;

  const combo = !game.cells[selected] ? fill(t('xrCombo'), { row: label(row(selected)), col: label(col(selected)) }) : t('xrPickSquare');
  return <div className={'puzzle-game xr-game' + (finished ? ' is-finished' : '')}>
    {header}
    <div className="xr-stats">
      <div className={'xr-stat' + (game.guessesLeft <= 3 && !finished ? ' is-low' : '')}><small>{t('xrGuessesLeft')}</small><strong>{game.guessesLeft}</strong></div>
      <div className="xr-stat"><small>{t('xrPoints')}</small><strong>{fill(t('xrPointsOf'), { n: formatScore(score) })}</strong></div>
    </div>
    {game.tricky && !finished && <p className="xr-tricky"><Flame size={14} aria-hidden="true"/>{t('xrTricky')}</p>}
    {grid}
    {finished ? <>{resultCard}<div className="finish-actions"><button className="finish-quiet" onClick={exit}><Check size={16} strokeWidth={2.6} aria-hidden="true"/>{t('finishDone')}</button></div></>
      : <form className="xr-entry" onSubmit={e => { e.preventDefault(); void submit(); }}>
        <p className="xr-combo" aria-live="polite">{combo}</p>
        <div className="xr-input-row">
          <div className="xr-input-wrap">
            <input ref={input} className="input xr-input" value={text} placeholder={t('xrPlaceholder')} aria-label={t('xrInputLabel') + ': ' + combo} autoComplete="off" autoCapitalize="words" autoCorrect="off" spellCheck={false}
              role="combobox" aria-expanded={open && suggestions.length > 0} aria-controls="xr-suggest" aria-activedescendant={open && suggestions[active] ? 'xr-opt-' + suggestions[active].id : undefined}
              onChange={e => { setText(e.target.value); setOpen(true); setNotice(null); }} onFocus={() => setOpen(true)} onBlur={() => window.setTimeout(() => setOpen(false), 120)}
              onKeyDown={e => { if (!open || !suggestions.length) return; if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => (a + 1) % suggestions.length); } else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => (a + suggestions.length - 1) % suggestions.length); } else if (e.key === 'Escape') setOpen(false); }}/>
            {open && suggestions.length > 0 && <ul id="xr-suggest" className="xr-suggest" role="listbox">{suggestions.map((c, i) => {
              const used = game.cells.some(x => x?.country === c.id);
              return <li key={c.id} id={'xr-opt-' + c.id} role="option" aria-selected={i === active} className={(i === active ? 'is-active ' : '') + (used ? 'is-used' : '')}
                onMouseDown={e => { e.preventDefault(); setText(countryName(c, lang)); void submit(c.id); }}>
                <img src={c.flag} alt=""/><span>{countryName(c, lang)}</span>{used && <Check size={14} aria-hidden="true"/>}</li>;
            })}</ul>}
          </div>
          <button className="btn primary xr-guess" disabled={busy || !text.trim()}>{t('xrGuess')}</button>
        </div>
        <p className={'xr-notice' + (notice ? ' is-' + notice.tone : '')} role="status">{notice?.text ?? ' '}</p>
        {game.competition && <p className="xr-rule muted">{t('xrRuleShort')}</p>}
      </form>}
  </div>;
}
