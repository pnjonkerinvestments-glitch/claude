'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Check, RotateCcw, X } from 'lucide-react';
import { BOSS_PASS, LOOKALIKES, REVIEW_SIZE, ROUTES, applyAnswer, bossQuestions, itemKey, lessonOf, localDay, practiceQuestions, rng, routeCountries, routeOf, routeState, testQuestions, type Card, type Lesson, type Progress, type Question, type Route } from '@/lib/learn';
import { sound } from '@/lib/client';
import { Character } from '../ds/Character';
import { ErrorState, PageSkeleton as Loading } from '../ds/States';
import { GameHeader } from '../game/GameHeader';
import { useApp } from '../app/context';
import { Medal } from './LearnPage';
import { useCountries, useLearn, type LearnCountry } from './useLearn';

type Kind = 'lesson' | 'review' | 'boss';
type Phase = 'meet' | 'practice' | 'intro' | 'test' | 'done';
type Answer = { q: Question; pick: string };

/** What the address asks for: a lesson, the review pile or a route's border check. */
function target(id: string): { kind: Kind; route: Route; lesson?: Lesson; index?: number } | null {
  if (id === 'review') return { kind: 'review', route: ROUTES[0] };
  if (id.startsWith('boss-')) { const route = routeOf(id.slice(5)); return route ? { kind: 'boss', route } : null; }
  const found = lessonOf(id);
  return found ? { kind: 'lesson', route: found.route, lesson: found.lesson, index: found.index } : null;
}

/**
 * One lesson, review or border check (1.38). A lesson has three steps: meet the flags, practise them (wrong
 * ones come back at the end) and show them once between look-alikes. Only that last step, the review and the
 * border check change medals, and only by the first answer per country.
 */
export function LearnSession({ id }: { id: string }) {
  const { t, go } = useApp();
  const { progress, save, ready } = useLearn();
  const { byId, loaded, error, retry } = useCountries();
  const goal = useMemo(() => target(id), [id]);
  const [seed] = useState(() => (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0);
  const today = localDay();
  // The questions are fixed once the progress is known, so a save during the session does not reshuffle them.
  const [plan, setPlan] = useState<{ practice: Question[]; test: Question[] } | null>(null);
  useEffect(() => {
    if (!goal || !ready || plan) return;
    const rand = rng(seed), pool = routeCountries(goal.route);
    if (goal.kind === 'lesson') setPlan({ practice: practiceQuestions(goal.lesson!, rand), test: testQuestions(goal.lesson!.countries, pool, rand) });
    else if (goal.kind === 'review') setPlan({ practice: [], test: testQuestions(routeState(goal.route, progress, today).due.slice(0, REVIEW_SIZE), pool, rand, true) });
    else setPlan({ practice: [], test: bossQuestions(goal.route, progress, rand) });
  }, [goal, ready, plan, seed, progress, today]);

  if (!goal) return <div className="learn-session"><ErrorState title={t('learnLoadError')} copy="" onRetry={() => go('/learn')} retryLabel={t('learnBackRoute')}/></div>;
  if (error) return <div className="learn-session"><ErrorState title={t('learnLoadError')} copy="" onRetry={retry} retryLabel={t('retry')}/></div>;
  if (!loaded || !plan) return <Loading variant="game"/>;
  if (goal.kind === 'review' && plan.test.length === 0) return <div className="learn-session"><div className="ln-card t-card ln-empty"><Character mood="happy" pose="wave" size={150}/><p>{t('learnReviewNone')}</p><button className="btn primary btn-lg" onClick={() => go('/learn')}>{t('learnBackRoute')}</button></div></div>;
  return <Run key={id} goal={goal} plan={plan} byId={byId} progress={progress} save={save} today={today}/>;
}

function Run({ goal, plan, byId, progress, save, today }: { goal: NonNullable<ReturnType<typeof target>>; plan: { practice: Question[]; test: Question[] }; byId: Map<string, LearnCountry>; progress: Progress; save: (p: Progress) => void; today: string }) {
  const { t, go } = useApp();
  const lesson = goal.lesson;
  const [phase, setPhase] = useState<Phase>(goal.kind === 'lesson' ? 'meet' : 'test');
  const [meet, setMeet] = useState(0);
  const [queue, setQueue] = useState<Question[]>(goal.kind === 'lesson' ? plan.practice : plan.test);
  const [at, setAt] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [before] = useState<Progress>(progress);
  const requeued = useRef(new Map<string, number>());
  const savedOnce = useRef(false);
  const name = (cid: string) => byId.get(cid)?.name ?? cid;
  const title = goal.kind === 'lesson' ? t('learnL_' + lesson!.key) : goal.kind === 'review' ? t('learnReviewTitle') : t('learnBoss');
  const q = queue[at];
  const stepLabel = phase === 'meet' ? t('learnStepMeet') : phase === 'practice' ? t('learnStepPractice') : goal.kind === 'lesson' ? t('learnStepTest') : title;

  // Progress over the whole session: meet + practice + test for a lesson, the questions otherwise.
  const total = goal.kind === 'lesson' ? lesson!.countries.length + plan.practice.length + plan.test.length : plan.test.length;
  const doneSoFar = goal.kind !== 'lesson' ? at : phase === 'meet' ? meet : phase === 'practice' ? lesson!.countries.length + Math.min(at, plan.practice.length) : phase === 'intro' ? lesson!.countries.length + plan.practice.length : lesson!.countries.length + plan.practice.length + at;
  const fraction = phase === 'done' ? 1 : doneSoFar / total;

  const firsts = useMemo(() => { const m = new Map<string, boolean>(); for (const a of answers) if (!m.has(a.q.id)) m.set(a.q.id, a.pick === a.q.id); return m; }, [answers]);

  function choose(option: string) {
    if (picked || !q) return;
    const right = option === q.id;
    setPicked(option); sound(right ? 'correct' : 'incorrect');
    if (phase !== 'practice') setAnswers(a => [...a, { q, pick: option }]);
    else if (!right) {
      const n = requeued.current.get(q.id) ?? 0;
      if (n < 2) { requeued.current.set(q.id, n + 1); const again = { ...q, options: [...q.options].sort(() => Math.random() - .5) }; setQueue(list => [...list, again]); }
    }
    if (right) setTimeout(() => advance(), 750);
  }

  function advance() { setPicked(null); setAt(i => i + 1); }

  // Moving between steps once a queue is used up.
  useEffect(() => {
    if (phase === 'practice' && at >= queue.length && queue.length) { setPhase('intro'); }
    if (phase === 'test' && at >= queue.length && queue.length) setPhase('done');
  }, [at, queue.length, phase]);

  // The result is saved once, as soon as the session is done.
  useEffect(() => {
    if (phase !== 'done' || savedOnce.current) return;
    savedOnce.current = true;
    const now = Date.now(), cards: Progress = {};
    let i = 0;
    for (const [cid, right] of firsts) cards[itemKey(goal.route.topic, cid)] = applyAnswer(before[itemKey(goal.route.topic, cid)], right, today, now + i++, goal.kind === 'lesson');
    const score = [...firsts.values()].filter(Boolean).length;
    if (goal.kind === 'lesson') { const prev = before['lesson:' + lesson!.id]; cards['lesson:' + lesson!.id] = { t: now, day: prev?.day ?? today, best: Math.max(prev?.best ?? 0, score), of: lesson!.countries.length }; }
    if (goal.kind === 'boss') { const prev = before['boss:' + goal.route.id]; cards['boss:' + goal.route.id] = { t: now, ...(prev?.day ? { day: prev.day } : {}), ...(score >= BOSS_PASS && !prev?.day ? { day: today } : {}), best: Math.max(prev?.best ?? 0, score), of: plan.test.length }; }
    save(cards);
    sound(goal.kind === 'boss' ? (score >= BOSS_PASS ? 'win' : 'finish') : score === firsts.size ? 'win' : 'finish');
  }, [phase, firsts, before, goal, lesson, plan.test.length, save, today]);

  const exit = () => go('/learn');
  const header = <GameHeader mode="flags" title={title} count={stepLabel} progress={fraction} onExit={exit} exitLabel={t('learnStop')}/>;

  if (phase === 'meet') {
    const cid = lesson!.countries[meet], c = byId.get(cid);
    const like = (LOOKALIKES[cid] ?? []).find(x => routeCountries(goal.route).includes(x));
    const last = meet === lesson!.countries.length - 1;
    return <div className="learn-session">{header}
      <section className="ln-card t-card ln-meet" aria-live="polite">
        <p className="t-kicker">{meet + 1} / {lesson!.countries.length}</p>
        <div className="ln-flag-stage"><img key={cid} src={c?.flag} alt={c?.name ?? ''} width={300} height={200}/></div>
        <h2 className="ln-name">{c?.name}</h2>
        {c?.capital && <p className="ln-capital"><span>{t('learnCapital')}</span><b>{c.capital}</b></p>}
        {like && <p className="ln-like"><img src={byId.get(like)?.flag} alt="" width={36} height={24}/>{t('learnLooksLike').replace('{name}', name(like))}</p>}
        {meet === 0 && <p className="ln-hint">{t('learnMeetHint').replace('{n}', String(lesson!.countries.length))}</p>}
        <div className="ln-dots" role="tablist" aria-label={t('learnStepMeet')}>{lesson!.countries.map((x, i) => <button key={x} type="button" role="tab" aria-selected={i === meet} aria-label={name(x)} className={i === meet ? 'is-on' : i < meet ? 'is-seen' : ''} onClick={() => setMeet(i)}/>)}</div>
        <button className="btn primary btn-lg ln-next" onClick={() => { sound('tap'); if (last) { setPhase('practice'); setAt(0); } else setMeet(meet + 1); }}>{last ? t('learnToPractice') : t('learnNext')}<ArrowRight size={19} aria-hidden="true"/></button>
      </section>
    </div>;
  }

  if (phase === 'intro') return <div className="learn-session">{header}
    <section className="ln-card t-card ln-intro">
      <Character mood="cool" pose="hips" size={170}/>
      <h2>{t('learnStepTest')}</h2>
      <p>{t('learnTestIntro')}</p>
      <button className="btn primary btn-lg" onClick={() => { setQueue(plan.test); setAt(0); setPhase('test'); }}>{t('learnToTest')}<ArrowRight size={19} aria-hidden="true"/></button>
    </section>
  </div>;

  if (phase === 'done') return <Result goal={goal} plan={plan} firsts={firsts} before={before} byId={byId} today={today}/>;

  if (!q) return <Loading variant="game"/>;
  const right = picked === q.id, c = byId.get(q.id);
  const status = (o: string) => !picked ? '' : o === q.id ? ' is-right' : o === picked ? ' is-wrong' : ' is-out';
  return <div className="learn-session">{header}
    <section className={'ln-card t-card ln-question is-' + q.kind} key={at}>
      {q.kind === 'flag2name' ? <>
        <p className="ln-ask">{t('learnQFlag')}</p>
        <div className="ln-flag-stage"><img src={c?.flag} alt={t('learnQFlag')} width={300} height={200}/></div>
        <div className="ln-options">{q.options.map(o => <button key={o} type="button" className={'ln-option' + status(o)} disabled={!!picked} onClick={() => choose(o)}><span>{name(o)}</span>{picked && o === q.id && <Check size={18} strokeWidth={3}/>}{picked && o === picked && o !== q.id && <X size={18} strokeWidth={3}/>}</button>)}</div>
      </> : <>
        <p className="ln-ask">{t('learnQName').split('{name}')[0]}<strong>{c?.name}</strong>{t('learnQName').split('{name}')[1]}</p>
        <div className="ln-options is-flags">{q.options.map(o => <button key={o} type="button" className={'ln-option ln-flag-option' + status(o)} disabled={!!picked} onClick={() => choose(o)} aria-label={picked ? name(o) : t('learnQName').replace('{name}', c?.name ?? '') + ' · ' + (q.options.indexOf(o) + 1)}><img src={byId.get(o)?.flag} alt="" width={150} height={100}/>{picked && (o === q.id || o === picked) && <small>{name(o)}</small>}</button>)}</div>
      </>}
      {picked && !right && <div className="ln-feedback" role="status" ref={el => { el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }}>
        <div className="ln-compare">
          <figure className="is-right"><img src={c?.flag} alt="" width={120} height={80}/><figcaption><Check size={14} strokeWidth={3.2}/>{name(q.id)}</figcaption></figure>
          <figure className="is-wrong"><img src={byId.get(picked)?.flag} alt="" width={120} height={80}/><figcaption><X size={14} strokeWidth={3.2}/>{name(picked)}</figcaption></figure>
        </div>
        <p><b>{t('learnWrong').replace('{name}', name(q.id))}.</b> {t('learnYouPicked').replace('{name}', name(picked))}{phase === 'practice' ? ' ' + t('learnComesBack') : ''}</p>
        <button className="btn primary btn-lg" autoFocus onClick={advance}>{t('learnContinue')}<ArrowRight size={19} aria-hidden="true"/></button>
      </div>}
      {picked && right && <p className="ln-right" role="status"><Check size={18} strokeWidth={3}/>{t('learnRight')}</p>}
    </section>
  </div>;
}

function Result({ goal, plan, firsts, before, byId, today }: { goal: NonNullable<ReturnType<typeof target>>; plan: { test: Question[] }; firsts: Map<string, boolean>; before: Progress; byId: Map<string, LearnCountry>; today: string }) {
  const { t, go } = useApp();
  const score = [...firsts.values()].filter(Boolean).length, total = firsts.size;
  const perfect = score === total;
  const passed = goal.kind === 'boss' && score >= BOSS_PASS;
  const nextLesson = goal.kind === 'lesson' ? goal.route.lessons[(goal.index ?? 0) + 1] : undefined;
  const lvlBefore = (cid: string) => before[itemKey(goal.route.topic, cid)]?.lvl ?? 0;
  const lvlAfter = (cid: string) => applyAnswer(before[itemKey(goal.route.topic, cid)] as Card | undefined, !!firsts.get(cid), today, 0, goal.kind === 'lesson').lvl ?? 0;
  const heading = goal.kind === 'lesson' ? t('learnDoneTitle') : goal.kind === 'review' ? t('learnReviewDone') : passed ? t('learnBossPassed') : t('learnBoss');
  const line = goal.kind === 'boss' ? (passed ? t('learnBossWin') : t('learnBossFail').replace('{need}', String(BOSS_PASS))) : perfect ? t('learnDonePerfect').replace('{n}', String(total)) : '';
  return <div className="learn-session">
    <section className={'ln-card t-card ln-result' + (passed || (goal.kind !== 'boss' && perfect) ? ' is-great' : '')}>
      <Character mood={perfect || passed ? 'cheer' : 'happy'} pose={perfect || passed ? 'cheer' : 'wave'} size={170}/>
      <h1>{heading}</h1>
      <p className="ln-score"><b>{score}</b> / {total}</p>
      {line && <p className="ln-line">{line}</p>}
      {!perfect && goal.kind !== 'boss' && <p className="ln-line">{t('learnDoneMissed')}</p>}
      <ul className="ln-recap">{plan.test.map(q => q.id).filter((v, i, a) => a.indexOf(v) === i).map(cid => {
        const ok = !!firsts.get(cid), up = lvlAfter(cid) > lvlBefore(cid) && lvlAfter(cid) > 0;
        return <li key={cid} className={ok ? 'is-right' : 'is-wrong'}>
          <img src={byId.get(cid)?.flag} alt="" width={48} height={32}/>
          <span>{byId.get(cid)?.name}</span>
          {up ? <Medal tier={Math.min(3, lvlAfter(cid)) as 1 | 2 | 3} size={22}/> : ok ? <Check size={18} strokeWidth={3}/> : <RotateCcw size={16} strokeWidth={2.6} aria-label={t('learnMedalDown')}/>}
        </li>;
      })}</ul>
      <div className="ln-actions">
        {nextLesson && <button className="btn primary btn-lg" onClick={() => go('/learn/' + nextLesson.id)}>{t('learnNextLesson')}<ArrowRight size={19} aria-hidden="true"/></button>}
        <button className={'btn btn-lg ' + (nextLesson ? 'secondary' : 'primary')} onClick={() => go('/learn')}>{t('learnBackRoute')}</button>
      </div>
    </section>
  </div>;
}
