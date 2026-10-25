'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Check, RotateCcw, X } from 'lucide-react';
import { LOOKALIKES, REVIEW_SIZE, applyAnswer, bossQuestions, examQuestions, itemKey, localDay, passMark, practiceQuestions, rng, routeCountries, routeOf, routeState, stepOf, testQuestions, type Card, type Progress, type Question, type Route, type Step } from '@/lib/learn';
import { sound } from '@/lib/client';
import { Character } from '../ds/Character';
import { ErrorState, PageSkeleton as Loading } from '../ds/States';
import { GameHeader } from '../game/GameHeader';
import { useApp } from '../app/context';
import { Medal } from './LearnPage';
import { LearnMap, type MapMark } from './LearnMap';
import { DayNudge } from '../atelier/DayNudge';
import { similarFor, useCountries, useLearn, type LearnCountry } from './useLearn';

type Kind = 'lesson' | 'exam' | 'review' | 'boss';
type Phase = 'meet' | 'practice' | 'intro' | 'test' | 'done';
type Goal = { kind: Kind; route: Route; step?: Step; index?: number };
const LETTERS = ['A', 'B', 'C', 'D'];
const GAME_MODE: Record<string, string> = { flags: 'flags', capitals: 'capitals', map: 'pinpoint' };

/** What the address asks for: a lesson, a midway test, a route's review pile or its border check. */
function target(id: string): Goal | null {
  if (id.startsWith('review-')) { const route = routeOf(id.slice(7)); return route ? { kind: 'review', route } : null; }
  if (id.startsWith('boss-')) { const route = routeOf(id.slice(5)); return route ? { kind: 'boss', route } : null; }
  const found = stepOf(id);
  return found ? { kind: found.step.kind, route: found.route, step: found.step, index: found.index } : null;
}

/**
 * One lesson, midway test, review or border check (1.38). A lesson: meet the countries, practise each once (a
 * miss comes back at the end), then show each once between similar ones. "I know these" skips straight to that
 * test. Only the tests change medals, and only by the first answer per country.
 */
export function LearnSession({ id }: { id: string }) {
  const { t, go } = useApp();
  const { progress, save, ready } = useLearn();
  const { byId, loaded, error, retry } = useCountries();
  const goal = useMemo(() => target(id), [id]);
  const [round, setRound] = useState(0);
  const [seed, setSeed] = useState(() => (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0);
  const today = localDay();
  // The questions are fixed once the progress and countries are known, so a save does not reshuffle them.
  const [plan, setPlan] = useState<{ practice: Question[]; test: Question[] } | null>(null);
  useEffect(() => {
    if (!goal || !ready || !loaded || plan) return;
    const rand = rng(seed), pool = routeCountries(goal.route), similar = similarFor(goal.route.topic, byId);
    if (goal.kind === 'lesson') setPlan({ practice: practiceQuestions(goal.step!, rand), test: testQuestions(goal.step!.countries, pool, rand, similar) });
    else if (goal.kind === 'exam') setPlan({ practice: [], test: examQuestions(goal.route, goal.step!, progress, rand, similar) });
    else if (goal.kind === 'review') setPlan({ practice: [], test: testQuestions(routeState(goal.route, progress, today).due.slice(0, REVIEW_SIZE), pool, rand, similar, true) });
    else setPlan({ practice: [], test: bossQuestions(goal.route, progress, rand, similar) });
  }, [goal, ready, loaded, plan, seed, progress, today, byId]);
  const again = () => { setPlan(null); setSeed(s => (s * 31 + 7) >>> 0); setRound(r => r + 1); window.scrollTo({ top: 0 }); };

  if (!goal) return <div className="learn-session"><ErrorState title={t('learnLoadError')} copy="" onRetry={() => go('/learn')} retryLabel={t('learnBackRoute')}/></div>;
  if (error) return <div className="learn-session"><ErrorState title={t('learnLoadError')} copy="" onRetry={retry} retryLabel={t('retry')}/></div>;
  if (!loaded || !plan) return <Loading variant="game"/>;
  if (plan.test.length === 0) return <div className="learn-session"><div className="ln-card t-card ln-empty"><Character mood="happy" pose="wave" size={150}/><p>{t('learnReviewNone')}</p><button className="btn primary btn-lg" onClick={() => go('/learn')}>{t('learnBackRoute')}</button></div></div>;
  return <Run key={id + ':' + round} goal={goal} plan={plan} byId={byId} progress={progress} save={save} today={today} onAgain={again}/>;
}

function Run({ goal, plan, byId, progress, save, today, onAgain }: { goal: Goal; plan: { practice: Question[]; test: Question[] }; byId: Map<string, LearnCountry>; progress: Progress; save: (p: Progress) => void; today: string; onAgain: () => void }) {
  const { t, go } = useApp();
  const { route, step } = goal, topic = route.topic, lesson = goal.kind === 'lesson' && step?.kind === 'lesson' ? step : null;
  const [phase, setPhase] = useState<Phase>(lesson ? 'meet' : 'test');
  const [meet, setMeet] = useState(0);
  const [queue, setQueue] = useState<Question[]>(lesson ? plan.practice : plan.test);
  const [at, setAt] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [answers, setAnswers] = useState<{ q: Question; pick: string }[]>([]);
  const [before] = useState<Progress>(progress);
  const requeued = useRef(new Set<string>());
  const savedOnce = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const name = (cid: string) => byId.get(cid)?.name ?? cid;
  const capital = (cid: string) => byId.get(cid)?.capital ?? '';
  const title = lesson ? t('learnL_' + lesson.key) : goal.kind === 'exam' ? t('learnExam').replace('{n}', String(step!.n)) : goal.kind === 'review' ? t('learnReviewTitle') : t('learnBoss');
  const q = queue[at];
  const stepLabel = phase === 'meet' ? t('learnStepMeet') : phase === 'practice' ? t('learnStepPractice') : lesson ? t('learnStepTest') : t('learnTopic_' + topic);

  const total = lesson ? lesson.countries.length + plan.practice.length + plan.test.length : plan.test.length;
  const doneSoFar = !lesson ? at : phase === 'meet' ? meet : phase === 'practice' ? lesson.countries.length + Math.min(at, plan.practice.length) : phase === 'intro' ? lesson.countries.length + plan.practice.length : lesson.countries.length + plan.practice.length + at;
  const fraction = phase === 'done' ? 1 : Math.min(1, doneSoFar / total);

  const firsts = useMemo(() => { const m = new Map<string, boolean>(); for (const a of answers) if (!m.has(a.q.id)) m.set(a.q.id, a.pick === a.q.id); return m; }, [answers]);

  function advance() { if (timer.current) clearTimeout(timer.current); timer.current = null; setPicked(null); setAt(i => i + 1); }
  function choose(option: string) {
    if (picked || !q) return;
    const right = option === q.id;
    setPicked(option); sound(right ? 'correct' : 'incorrect');
    if (phase !== 'practice') setAnswers(a => [...a, { q, pick: option }]);
    else if (!right && !requeued.current.has(q.id)) { requeued.current.add(q.id); setQueue(list => [...list, { ...q, options: [...q.options].reverse() }]); }
    if (right) timer.current = setTimeout(advance, 700);
  }

  useEffect(() => {
    if (phase === 'practice' && at >= queue.length && queue.length) setPhase('intro');
    if (phase === 'test' && at >= queue.length && queue.length) setPhase('done');
  }, [at, queue.length, phase]);

  const score = [...firsts.values()].filter(Boolean).length;
  const graded = goal.kind === 'exam' || goal.kind === 'boss';
  const passed = !graded || score >= passMark(plan.test.length);
  // The result is saved once, as soon as the session is done.
  useEffect(() => {
    if (phase !== 'done' || savedOnce.current) return;
    savedOnce.current = true;
    const now = Date.now(), cards: Progress = {};
    let i = 0;
    for (const [cid, right] of firsts) cards[itemKey(topic, cid)] = applyAnswer(before[itemKey(topic, cid)], right, today, now + i++, goal.kind === 'lesson');
    const keyed = goal.kind === 'boss' ? 'boss:' + route.id : step ? 'lesson:' + step.id : null;
    if (keyed) { const prev = before[keyed]; cards[keyed] = { t: now, ...(prev?.day ? { day: prev.day } : passed ? { day: today } : {}), best: Math.max(prev?.best ?? 0, score), of: plan.test.length }; }
    save(cards);
    sound(passed && score === firsts.size ? 'win' : 'finish');
  }, [phase, firsts, before, goal, route, step, topic, plan.test.length, save, today, passed, score]);

  const header = <GameHeader mode={GAME_MODE[topic]} title={title} count={stepLabel} progress={fraction} onExit={() => go('/learn')} exitLabel={t('learnStop')}/>;
  const toTest = () => { if (timer.current) clearTimeout(timer.current); setPicked(null); setQueue(plan.test); setAt(0); setPhase('test'); };

  if (phase === 'meet' && lesson) {
    const cid = lesson.countries[meet], c = byId.get(cid);
    const like = topic === 'flags' ? (LOOKALIKES[cid] ?? []).find(x => routeCountries(route).includes(x)) : undefined;
    const last = meet === lesson.countries.length - 1;
    return <div className="learn-session">{header}
      <section className={'ln-card t-card ln-meet is-' + topic} aria-live="polite">
        <p className="t-kicker">{meet + 1} / {lesson.countries.length}</p>
        {topic === 'flags' && <div className="ln-flag-stage"><img key={cid} src={c?.flag} alt={c?.name ?? ''} width={300} height={200}/></div>}
        {topic === 'map' && <LearnMap className="ln-map" region={route.region} frame={lesson.countries} marks={lesson.countries.map((x): MapMark => ({ id: x, tone: x === cid ? 'focus' : 'soft' }))} label={c?.name ?? ''}/>}
        {topic === 'capitals' && <img className="ln-mini-flag" src={c?.flag} alt="" width={84} height={56}/>}
        <h2 className="ln-name">{c?.name}</h2>
        {topic === 'capitals'
          ? <p className="ln-capital-big"><span>{t('learnCapital')}</span><b>{c?.capitals.join(' / ')}</b></p>
          : c?.capital && <p className="ln-capital"><span>{t('learnCapital')}</span><b>{c.capitals.join(' / ')}</b></p>}
        {like && <p className="ln-like"><img src={byId.get(like)?.flag} alt="" width={36} height={24}/>{t('learnLooksLike').replace('{name}', name(like))}</p>}
        {meet === 0 && <p className="ln-hint">{t('learnMeetHint_' + topic)}</p>}
        <div className="ln-dots" role="tablist" aria-label={t('learnStepMeet')}>{lesson.countries.map((x, i) => <button key={x} type="button" role="tab" aria-selected={i === meet} aria-label={name(x)} className={i === meet ? 'is-on' : i < meet ? 'is-seen' : ''} onClick={() => setMeet(i)}/>)}</div>
        <button className="btn primary btn-lg ln-next" onClick={() => { sound('tap'); if (last) { setPhase('practice'); setAt(0); } else setMeet(meet + 1); }}>{last ? t('learnToPractice') : t('learnNext')}<ArrowRight size={19} aria-hidden="true"/></button>
        <button className="text-link ln-skip" onClick={toTest}>{t('learnKnowThese')}</button>
      </section>
    </div>;
  }

  if (phase === 'intro') return <div className="learn-session">{header}
    <section className="ln-card t-card ln-intro">
      <Character mood="cool" pose="hips" size={170}/>
      <h2>{t('learnStepTest')}</h2>
      <p>{t('learnTestIntro')}</p>
      <button className="btn primary btn-lg" onClick={toTest}>{t('learnToTest')}<ArrowRight size={19} aria-hidden="true"/></button>
    </section>
  </div>;

  if (phase === 'done') return <Result goal={goal} plan={plan} firsts={firsts} before={before} byId={byId} today={today} score={score} passed={passed} onAgain={onAgain}/>;

  if (!q) return <Loading variant="game"/>;
  const right = picked === q.id, c = byId.get(q.id);
  const status = (o: string) => !picked ? '' : o === q.id ? ' is-right' : o === picked ? ' is-wrong' : ' is-out';
  const after = (o: string) => !!picked && (o === q.id || o === picked);
  const ask = (key: string, value: string) => { const [a, b = ''] = t(key).split('{name}'), tail = b.trim().length <= 2 ? b.trim() : ''; return <p className="ln-ask">{a}<strong>{value}{tail}</strong>{tail ? '' : b}</p>; };
  const nameOptions = <div className="ln-options">{q.options.map(o => <button key={o} type="button" className={'ln-option' + status(o)} disabled={!!picked} onClick={() => choose(o)}><span>{name(o)}</span>{picked && o === q.id && <Check size={18} strokeWidth={3}/>}{picked && o === picked && o !== q.id && <X size={18} strokeWidth={3}/>}</button>)}</div>;
  let body: React.ReactNode;
  if (topic === 'flags') body = q.kind === 'toName' ? <>
    <p className="ln-ask">{t('learnQFlag')}</p>
    <div className="ln-flag-stage"><img src={c?.flag} alt={t('learnQFlag')} width={300} height={200}/></div>
    {nameOptions}
  </> : <>
    {ask('learnQName', c?.name ?? '')}
    <div className="ln-options is-flags">{q.options.map((o, i) => <button key={o} type="button" className={'ln-option ln-flag-option' + status(o)} disabled={!!picked} onClick={() => choose(o)} aria-label={picked ? name(o) : LETTERS[i]}><img src={byId.get(o)?.flag} alt="" width={150} height={100}/>{after(o) && <small>{name(o)}</small>}</button>)}</div>
  </>;
  else if (topic === 'capitals') body = q.kind === 'toName' ? <>
    {ask('learnQCapitalOf', capital(q.id))}
    {nameOptions}
  </> : <>
    {ask('learnQCapital', c?.name ?? '')}
    <div className="ln-options">{q.options.map(o => <button key={o} type="button" className={'ln-option ln-capital-option' + status(o)} disabled={!!picked} onClick={() => choose(o)}><span>{capital(o)}</span>{after(o) && <small>{name(o)}</small>}</button>)}</div>
  </>;
  else body = q.kind === 'toName' ? <>
    <p className="ln-ask">{t('learnQMap')}</p>
    <LearnMap className="ln-map" region={route.region} frame={q.options} marks={picked ? [{ id: q.id, tone: 'right' }, ...(picked !== q.id ? [{ id: picked, tone: 'wrong' as const }] : [])] : [{ id: q.id, tone: 'focus' }]} label={t('learnQMap')}/>
    {nameOptions}
  </> : <>
    {ask('learnQWhere', c?.name ?? '')}
    <LearnMap className="ln-map" region={route.region} frame={q.options} onPick={choose} disabled={!!picked} label={t('learnQWhere').replace('{name}', c?.name ?? '')}
      marks={q.options.map((o, i): MapMark => ({ id: o, tone: !picked ? 'option' : o === q.id ? 'right' : o === picked ? 'wrong' : 'option', label: LETTERS[i] }))}/>
    <div className="ln-options is-letters">{q.options.map((o, i) => <button key={o} type="button" className={'ln-option' + status(o)} disabled={!!picked} onClick={() => choose(o)} aria-label={picked ? LETTERS[i] + ' · ' + name(o) : LETTERS[i]}><b className="ln-letter">{LETTERS[i]}</b>{after(o) && <span>{name(o)}</span>}</button>)}</div>
  </>;

  return <div className="learn-session">{header}
    <section className={'ln-card t-card ln-question is-' + topic + ' is-' + q.kind} key={at}>
      {body}
      {picked && !right && <div className="ln-feedback" role="status" ref={el => { el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }}>
        {topic === 'flags' && <div className="ln-compare">
          <figure className="is-right"><img src={c?.flag} alt="" width={120} height={80}/><figcaption><Check size={14} strokeWidth={3.2}/>{name(q.id)}</figcaption></figure>
          <figure className="is-wrong"><img src={byId.get(picked)?.flag} alt="" width={120} height={80}/><figcaption><X size={14} strokeWidth={3.2}/>{name(picked)}</figcaption></figure>
        </div>}
        {topic === 'capitals' && <ul className="ln-pairs">
          <li className="is-right"><Check size={15} strokeWidth={3.2}/><span>{name(q.id)}</span><b>{capital(q.id)}</b></li>
          <li className="is-wrong"><X size={15} strokeWidth={3.2}/><span>{name(picked)}</span><b>{capital(picked)}</b></li>
        </ul>}
        <p><b>{topic === 'capitals' ? t('learnWrongCapital').replace('{capital}', capital(q.id)).replace('{name}', name(q.id)) : t('learnWrong').replace('{name}', name(q.id))}</b>{phase === 'practice' ? ' ' + t('learnComesBack') : ''}</p>
        <button className="btn primary btn-lg" autoFocus onClick={advance}>{t('learnContinue')}<ArrowRight size={19} aria-hidden="true"/></button>
      </div>}
      {picked && right && <p className="ln-right" role="status"><Check size={18} strokeWidth={3}/>{t('learnRight')}</p>}
    </section>
  </div>;
}

function Result({ goal, plan, firsts, before, byId, today, score, passed, onAgain }: { goal: Goal; plan: { test: Question[] }; firsts: Map<string, boolean>; before: Progress; byId: Map<string, LearnCountry>; today: string; score: number; passed: boolean; onAgain: () => void }) {
  const { t, go } = useApp();
  const { route } = goal, total = firsts.size, perfect = score === total;
  const graded = goal.kind === 'exam' || goal.kind === 'boss', need = passMark(plan.test.length);
  const next = goal.index !== undefined && passed ? route.steps[goal.index + 1] : undefined;
  const lvlBefore = (cid: string) => before[itemKey(route.topic, cid)]?.lvl ?? 0;
  const lvlAfter = (cid: string) => applyAnswer(before[itemKey(route.topic, cid)] as Card | undefined, !!firsts.get(cid), today, 0, goal.kind === 'lesson').lvl ?? 0;
  const continent = t(route.region);
  const heading = goal.kind === 'lesson' ? t('learnDoneTitle') : goal.kind === 'review' ? t('learnReviewDone') : goal.kind === 'exam' ? (passed ? t('learnExamPassed') : t('learnExam').replace('{n}', String(goal.step!.n))) : passed ? t('learnBossStamp').replace('{continent}', continent) : t('learnBoss');
  const line = graded ? (passed ? (goal.kind === 'boss' ? t('learnBossWin').replace('{continent}', continent) : t('learnExamWin')) : t('learnNeed').replace('{need}', String(need)).replace('{total}', String(plan.test.length))) : perfect ? t('learnDonePerfect').replace('{n}', String(total)) : t('learnDoneMissed');
  const nextLabel = next ? (next.kind === 'exam' ? t('learnToExam') : t('learnNextLesson')) : '';
  const toBoss = !next && passed && goal.index === route.steps.length - 1;
  return <div className="learn-session">
    <section className={'ln-card t-card ln-result' + ((graded ? passed : perfect) ? ' is-great' : '')}>
      <Character mood={perfect || (graded && passed) ? 'cheer' : graded ? 'worried' : 'happy'} pose={perfect || (graded && passed) ? 'cheer' : 'wave'} size={170}/>
      <h1>{heading}</h1>
      <p className="ln-score"><b>{score}</b> / {total}</p>
      <p className="ln-line">{line}</p>
      <ul className="ln-recap">{plan.test.map(q => q.id).filter((v, i, a) => a.indexOf(v) === i).map(cid => {
        const ok = !!firsts.get(cid), up = lvlAfter(cid) > lvlBefore(cid) && lvlAfter(cid) > 0;
        return <li key={cid} className={ok ? 'is-right' : 'is-wrong'}>
          <img src={byId.get(cid)?.flag} alt="" width={48} height={32}/>
          <span>{byId.get(cid)?.name}{route.topic === 'capitals' && <small>{byId.get(cid)?.capital}</small>}</span>
          {up ? <Medal tier={Math.min(3, lvlAfter(cid)) as 1 | 2 | 3} size={22}/> : ok ? <Check size={18} strokeWidth={3}/> : <RotateCcw size={16} strokeWidth={2.6} aria-label={t('learnMedalDown')}/>}
        </li>;
      })}</ul>
      <div className="ln-actions">
        {next && <button className="btn primary btn-lg" onClick={() => go('/learn/' + next.id)}>{nextLabel}<ArrowRight size={19} aria-hidden="true"/></button>}
        {toBoss && <button className="btn primary btn-lg is-gold" onClick={() => go('/learn/boss-' + route.id)}>{t('learnBossGo')}<ArrowRight size={19} aria-hidden="true"/></button>}
        {graded && !passed && <button className="btn primary btn-lg" onClick={onAgain}>{t('learnTryAgain')}<RotateCcw size={18} aria-hidden="true"/></button>}
        <button className={'btn btn-lg ' + (next || toBoss || (graded && !passed) ? 'secondary' : 'primary')} onClick={() => go('/learn')}>{t('learnBackRoute')}</button>
      </div>
      <DayNudge/>
    </section>
  </div>;
}
