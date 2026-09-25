'use client';
import { useEffect, useMemo, useState } from 'react';
import { withSpanish, spanishCountry } from '../../i18n/content';
import { Check, Lightbulb, Search, X } from 'lucide-react';
import { mysteryOfTheDay, type MysteryCountryData, type MysteryFact } from '@/lib/daily-loop';
import { ResetCountdown } from './ResetCountdown';
import { HowToPlayButton } from './HowToPlay';
import { notifyProgress } from './DailyQuests';

type MysteryData = [{ facts: MysteryFact[] }, MysteryCountryData[]];
let dataPromise: Promise<MysteryData> | null = null;
const loadData = () => dataPromise ??= (Promise.all([fetch('/data/mosaic-facts.json').then(r => r.json()), fetch('/data/countries.json').then(r => r.json())]) as Promise<MysteryData>).catch(e => { dataPromise = null; throw e; });


type Saved = { hints?: number; picked?: string | null };
function readSaved(key: string): Saved | null { try { return JSON.parse(localStorage.getItem(key) ?? 'null'); } catch { return null; } }
function writeSaved(key: string, value: Saved) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage may be unavailable; the puzzle still works */ } notifyProgress(); }

/** A small daily curiosity puzzle on the homepage: guess the country behind a sourced heritage fact. */
export function MysteryCountry({ date, t, locale }: { date: string; t: (k: string) => string; locale: 'en' | 'nl' | 'es' }) {
  // Rendered only after the data has loaded in the browser, so reading saved progress up front cannot mismatch SSR.
  const key = 'roviko:mystery:' + date;
  const [data, setData] = useState<MysteryData | null>(null), [failed, setFailed] = useState(false);
  const [hints, setHints] = useState(() => typeof window === 'undefined' ? 1 : readSaved(key)?.hints ?? 1);
  const [picked, setPicked] = useState<string | null>(() => typeof window === 'undefined' ? null : readSaved(key)?.picked ?? null);
  useEffect(() => { let active = true; loadData().then(d => { if (active) setData(withSpanish(d)); }).catch(() => { if (active) setFailed(true); }); return () => { active = false; }; }, []);
  const puzzle = useMemo(() => data ? mysteryOfTheDay(date, data[0].facts, data[1]) : null, [data, date]);
  if (failed || !puzzle) return null;
  const { fact, answer, options } = puzzle;
  const name = (c: MysteryCountryData) => locale === 'es' ? spanishCountry(c.name) : locale === 'nl' ? c.nl : c.name;
  const clues = [fact.clues[0]?.[locale], fact.clues[1]?.[locale], t('mysteryRegionClue').replace('{region}', t(answer.region))].filter(Boolean) as string[];
  const answered = picked !== null, correct = picked === answer.id;
  const pickedCountry = options.find(o => o.id === picked);
  const moreHints = () => { const n = Math.min(clues.length, hints + 1); setHints(n); writeSaved(key, { hints: n, picked }); };
  const choose = (id: string) => { if (answered) return; setPicked(id); writeSaved(key, { hints, picked: id }); };
  return <section className={'mystery-card' + (answered ? correct ? ' is-right' : ' is-wrong' : '')} aria-labelledby="mystery-title">
    <div className="mystery-head">
      <span className="mystery-badge" aria-hidden="true">{answered ? <img src={answer.flag} alt=""/> : <Search size={26} strokeWidth={2.3}/>}</span>
      <div><span className="mystery-kicker">{t('competitionWarmup')}</span><h2 id="mystery-title">{t('mysteryTitle')}</h2></div>
      <HowToPlayButton mode="mystery" t={t} locale={locale}/>
    </div>
    <ol className="mystery-clues">{clues.slice(0, answered ? clues.length : hints).map((clue, i) => <li key={i}><span aria-hidden="true">{i + 1}</span>{clue}</li>)}</ol>
    {!answered && hints < clues.length && <button className="text-link mystery-hint" onClick={moreHints}><Lightbulb size={16}/>{t('mysteryHint')} · {hints}/{clues.length}</button>}
    <div className="mystery-options" role="group" aria-label={t('mysteryTitle')}>
      {options.map(o => { const right = answered && o.id === answer.id, wrong = answered && o.id === picked && !right; return <button key={o.id} className={'mystery-option' + (right ? ' is-correct' : wrong ? ' is-wrong' : '')} disabled={answered} onClick={() => choose(o.id)}>
        {answered && <img src={o.flag} alt=""/>}<span>{name(o)}</span>{right && <Check size={18} aria-label={t('correctAnswerLabel')}/>}{wrong && <X size={18} aria-label={t('yourAnswer')}/>}
      </button>; })}
    </div>
    {answered && <div className="mystery-reveal" role="status">
      <strong className="mystery-verdict">{correct ? '🎉 ' + t('mysteryRight') : t('mysteryWrong')}</strong>
      {!correct && pickedCountry && <p>{t('mysteryYouPicked').replace('{pick}', name(pickedCountry)).replace('{answer}', name(answer))}</p>}
      <p>{fact.explanation[locale]}</p>
      <p className="mystery-source">{t('mysterySource')}: <a href={fact.source.url} target="_blank" rel="noopener noreferrer">{fact.source.title}</a> · UNESCO World Heritage Centre · CC BY-SA 3.0 IGO</p>
      <ResetCountdown label={t('mysteryNext')} t={t}/>
    </div>}
  </section>;
}
