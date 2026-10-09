'use client';
import { feedbackHeading } from '@/lib/feel-copy';
import { plural } from '@/lib/plural';
import React, { useEffect, useLayoutEffect, useRef, useState, lazy, Suspense } from 'react';
import { Peek } from '../ds/Character';
import { ArrowUp, ArrowDown, Check, X, LockKeyhole, Flag, GripVertical, Navigation } from 'lucide-react';
const BorderMap = lazy(() => import('./BorderMap'));
const WorldMap = lazy(() => import('./WorldMap'));
export function Question({ question: q, feedback, locked, onAnswer, t, locale, onReport, busy, competitive = true, onHint, deadline, streak = 0, label, answerMarks }: {
    question: any; feedback: any; locked: boolean; onAnswer: (answer: any) => void;
    t: (k: string) => string; locale: 'en' | 'nl' | 'es'; onReport: () => void; busy?: boolean; competitive?: boolean; onHint?: (count: number) => void | Promise<any>;
    /** Timed rounds: when the round closes, in this device's clock. A sorted list or placed pin is then sent for you. */
    deadline?: number | null;
    /** Right answers in a row including this one, for the "3 in a row!" heading. */
    streak?: number;
    /** The small green line at the top of the question card ("Daily Detour · 1/20"); defaults to the question type. */
    label?: React.ReactNode;
    /** Multiplayer reveal: something to show on an answer pill (who picked it), by option id. */
    answerMarks?: Record<string, React.ReactNode>;
}) {
    const [cluesShown, setCluesShown] = useState(q?.cluesShown ?? 1);
    // Multiplayer: clues appear one by one, every 2 seconds, so fast readers don't see everything at once.
    const clueTotal = q?.clues?.length ?? 0;
    const [live, setLive] = useState({ id: q?.id, n: 1 });
    useEffect(() => {
        if (!competitive || !clueTotal || feedback) return;
        const id = q?.id, timer = setInterval(() => setLive(prev => ({ id, n: prev.id === id ? Math.min(clueTotal, prev.n + 1) : 2 })), 2000);
        return () => clearInterval(timer);
    }, [competitive, clueTotal, feedback, q?.id]);
    const liveClues = live.id === q?.id ? live.n : 1;
    // Every clue has a fixed slot from the start, so answers never move down while clues appear.
    const clueSlots = q?.clueCount ?? q?.clues?.length ?? 0;
    const openClues = feedback ? clueSlots : competitive ? liveClues : cluesShown;
    const flagSrc = q?.flag ? q.flagUrl ?? ('/api/flag/' + encodeURIComponent(q.flag) + '?v=3') : '';
    const [hintPending,setHintPending]=useState(false);
    useEffect(()=>{if(q?.dailyPoints)setCluesShown(q.cluesShown??1);},[q?.cluesShown,q?.id]);
    const [answer, setAnswer] = useState<any>(null);
    const [order, setOrder] = useState<any[]>(q?.options ?? []);
    // Size Shuffle drag: a pointer (finger or mouse) lifts a row; the others slide aside; dropping commits the move.
    const [sort, setSort] = useState<{ id: string; from: number; to: number; dy: number; pitch: number } | null>(null);
    const sortRef = useRef<{ stop: () => void } | null>(null), listRef = useRef<HTMLDivElement>(null);
    const settle = useRef<{ id: string; offset: number } | null>(null);
    const [moved, setMoved] = useState('');
    useEffect(() => { setAnswer(null); setOrder(q?.options ?? []); setCluesShown(q?.cluesShown ?? 1); setMoved(''); }, [q?.id]);
    useEffect(() => {
        if (!q || locked || busy || hintPending || q.typed || ['pinpoint', 'order'].includes(q.mode)) return;
        const handler = (e: KeyboardEvent) => {
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName) || document.querySelector('[role=dialog]')) return;
            const n = Number(e.key); if (n >= 1 && n <= q.options.length) { setAnswer(q.options[n - 1].id); onAnswer(q.options[n - 1].id); }
        };
        window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler);
    }, [q, locked, busy, hintPending, onAnswer]);
    // Timed rounds: a list you sorted or a pin you placed still counts if the time runs out before you confirm.
    const touched = useRef(false), latest = useRef({ order, answer, locked, busy, sort });
    latest.current = { order, answer, locked, busy, sort };
    useEffect(() => { touched.current = false; }, [q?.id]);
    useEffect(() => {
        if (!competitive || !deadline || locked || !q || !['order', 'pinpoint'].includes(q.mode)) return;
        const timer = setTimeout(() => {
            const now = latest.current;
            if (now.locked || now.busy) return;
            // A row still being dragged when time runs out counts where it hovers.
            const list = now.sort && now.sort.to !== now.sort.from ? reorder(now.order, now.sort.from, now.sort.to) : now.order;
            if (q.mode === 'order' && (touched.current || list !== now.order)) onAnswer(list.map((o: any) => o.id));
            else if (q.mode === 'pinpoint' && Array.isArray(now.answer)) onAnswer(now.answer);
        }, Math.max(0, deadline - Date.now() - 700));
        return () => clearTimeout(timer);
    }, [competitive, deadline, locked, q, onAnswer]);
    // On a phone the way on is a bar fixed to the bottom. After an answer, scroll just enough that the
    // heading of the explanation clears that bar, without pushing the right answer off the top.
    const revealed = !!feedback;
    useEffect(() => {
        if (!revealed) return;
        const frame = requestAnimationFrame(() => {
            const heading = document.querySelector('#answer-explanation .feedback-heading'), right = document.querySelector('.answer-option.is-correct, .correct-order, .world-map, .order-list');
            if (!heading) return;
            const bar = Array.from(document.querySelectorAll<HTMLElement>('.solo-next-row, .puzzle-bottom')).find(el => getComputedStyle(el).position === 'fixed');
            const limit = bar ? bar.getBoundingClientRect().top : window.innerHeight;
            const need = heading.getBoundingClientRect().bottom + 16 - limit;
            if (need <= 0) return;
            const room = right ? right.getBoundingClientRect().top - 72 : need;
            const by = Math.min(need, Math.max(0, room));
            if (by > 0) window.scrollBy({ top: by, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
        });
        return () => cancelAnimationFrame(frame);
    }, [revealed, q?.id]);
    // Stop a drag when the question locks, changes or the component goes away.
    useEffect(() => { if (locked) sortRef.current?.stop(); }, [locked]);
    useEffect(() => () => sortRef.current?.stop(), [q?.id]);
    // After a drop the lifted row glides from where it was let go into its new slot.
    useLayoutEffect(() => {
        const p = settle.current; if (!p) return; settle.current = null;
        const el = listRef.current?.querySelector<HTMLElement>('[data-row="' + p.id + '"]');
        if (el && p.offset && typeof el.animate === 'function' && !matchMedia('(prefers-reduced-motion: reduce)').matches) el.animate([{ transform: 'translateY(' + p.offset + 'px) scale(1.03)' }, { transform: 'none' }], { duration: 180, easing: 'cubic-bezier(.2,.8,.3,1)' });
    }, [order, sort]);
    if (!q) return null;
    const chosen = feedback?.value ?? answer;
    const unanswered = !!feedback && (chosen === null || chosen === undefined);
    const correctOrder = q.mode === 'order' && Array.isArray(feedback?.correctAnswer) ? feedback.correctAnswer : [];
    // Without an answer the reveal shows the right order, never the unconfirmed list as if it had counted.
    const shownOrder = feedback ? (Array.isArray(chosen) ? chosen : correctOrder).map((id: string) => q.options.find((o: any) => o.id === id)).filter(Boolean) : order;
    const misplaced = shownOrder.filter((o: any, i: number) => correctOrder[i] !== o.id).length;
    const pickedLabel = q.typed ? chosen : q.options?.find((o: any) => o.id === chosen)?.[locale];
    const move = (from: number, to: number) => {
        if (to < 0 || to >= order.length || latest.current.locked) return;
        touched.current = true;
        const o = order[from];
        setOrder(prev => reorder(prev, from, to));
        if (o) setMoved(plural(t, 'orderMoved', to + 1).split('{country}').join(o[locale]));
    };
    const startSort = (e: React.PointerEvent<HTMLDivElement>, from: number, id: string) => {
        if (locked || feedback || sortRef.current || !e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0) || (e.target as HTMLElement).closest('button')) return;
        const rows = Array.from(listRef.current?.children ?? []) as HTMLElement[];
        if (rows.length < 2) return;
        if (e.pointerType === 'mouse') e.preventDefault();
        // Measured without transforms (offsetTop), per row: a long country name can make one row taller than the others.
        const tops = rows.map(r => r.offsetTop), hs = rows.map(r => r.offsetHeight), n = rows.length;
        const gap = Math.max(0, tops[1] - tops[0] - hs[0]), h = hs[from], pitch = h + gap;
        // Where the lifted row's top lands if it is dropped at slot `to` (the rows in between close the gap it leaves).
        const slotTop = (to: number) => to > from ? tops[to] + hs[to] - h : tops[to];
        const s = { y: e.clientY, startY: e.clientY, startScroll: window.scrollY, active: false, raf: 0, to: from, dy: 0 };
        const min = slotTop(0) - tops[from] - h * .35, max = slotTop(n - 1) - tops[from] + h * .35;
        const measure = () => {
            const raw = s.y - s.startY + window.scrollY - s.startScroll;
            s.dy = Math.max(min, Math.min(max, raw));
            // The new slot: the one whose landing place is closest to where the lifted row is now.
            const at = tops[from] + s.dy;
            s.to = tops.reduce((best, _, j) => Math.abs(slotTop(j) - at) < Math.abs(slotTop(best) - at) ? j : best, from);
            setSort({ id, from, to: s.to, dy: s.dy, pitch });
        };
        // Near the top or bottom of the screen the page scrolls along, faster the closer the finger gets.
        const frame = () => {
            const edge = 80, bottom = window.innerHeight - edge;
            // It stops once the row has reached the top or bottom of the list.
            // Only in the direction the finger is going, so a row that starts near the edge does not run off on its own.
            const v = s.y < edge && s.y < s.startY && s.dy > min ? -Math.ceil((edge - s.y) / edge * 16) : s.y > bottom && s.y > s.startY && s.dy < max ? Math.ceil((s.y - bottom) / edge * 16) : 0;
            if (v) { window.scrollBy({ top: v, behavior: 'instant' as ScrollBehavior }); measure(); }
            s.raf = requestAnimationFrame(frame);
        };
        const onMove = (ev: PointerEvent) => {
            if (ev.pointerId !== e.pointerId) return;
            s.y = ev.clientY;
            if (!s.active) { if (Math.abs(s.y - s.startY) < 5) return; s.active = true; s.raf = requestAnimationFrame(frame); }
            ev.preventDefault(); measure();
        };
        const onTouch = (ev: TouchEvent) => { if (s.active && ev.cancelable) ev.preventDefault(); };
        const stop = () => {
            cancelAnimationFrame(s.raf); sortRef.current = null;
            window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onEnd); window.removeEventListener('pointercancel', onEnd); window.removeEventListener('touchmove', onTouch);
            setSort(null);
        };
        function onEnd(ev: PointerEvent) {
            if (ev.pointerId !== e.pointerId) return;
            const wasActive = s.active;
            stop();
            if (!wasActive || latest.current.locked) return;
            if (s.to !== from) { settle.current = { id, offset: tops[from] + s.dy - slotTop(s.to) }; move(from, s.to); }
            else settle.current = { id, offset: s.dy };
        }
        sortRef.current = { stop };
        window.addEventListener('pointermove', onMove, { passive: false }); window.addEventListener('pointerup', onEnd); window.addEventListener('pointercancel', onEnd); window.addEventListener('touchmove', onTouch, { passive: false });
    };
    const submit = (value: any) => { if (locked || busy || hintPending) return; setAnswer(value); onAnswer(value); };
    const countryLabel = (o: any) => <span className="option-country">{o.flag && q.mode!=='trail' && (q.mode!=='flags' || feedback) && <img src={o.flag} alt=""/>}<span>{o[locale]}</span></span>;
    const peekMood = feedback ? feedback.correct ? 'cheer' : 'shock' : 'happy';
    return <div className="question-content">
        <section className={'q-card' + (feedback ? feedback.correct ? ' is-right' : ' is-wrong' : '')} aria-labelledby={'q-' + q.id}>
            <Peek mood={peekMood} key={peekMood}/>
            <div className="question-heading"><span className="eyebrow q-kicker">{label ?? t(q.mode + 'Hint')}</span><h1 id={'q-' + q.id}>{q.prompt[locale]}</h1>{q.country && <span className="question-country"><img src={q.country.flag} alt=""/>{q.country[locale]}</span>}</div>
            {q.shape && <div className="shape-stage"><svg viewBox="-10 -8 120 96" role="img" aria-label={t('shapeAlt')} preserveAspectRatio="xMidYMid meet"><path d={q.shape}/></svg></div>}
            {q.flag && q.mode !== 'trail' && <div className="flag-stage"><img fetchPriority="high" decoding="async" src={flagSrc} alt={feedback ? feedback.answerLabel[locale] : t('flags')} draggable="false"/></div>}
        </section>
        {q.clues && <section className="trail-clues" aria-label={t('trailClues')}><p>{t(competitive ? 'trailMultiplayerRule' : q.dailyPoints?'competitionTrail':'trailRule')}</p><ol className="clue-slots">{Array.from({ length: clueSlots }, (_, i) => { const clue = q.clues[i], open = !!clue && i < openClues; return <li key={i} className={open ? 'is-open' : 'is-pending'} aria-hidden={open ? undefined : true}><span>{i + 1}</span>{open ? <>{clue[locale]}{i === 3 && q.flag && <img className="clue-flag" src={flagSrc} alt={feedback ? feedback.answerLabel[locale] : t('flags')} draggable="false"/>}</> : <em>{t('trailCluePending')}</em>}</li>; })}</ol>{!competitive && !locked && <button className="btn secondary trail-more" disabled={hintPending||busy||cluesShown >= clueSlots} onClick={async () => { const n = cluesShown + 1; if(!q.dailyPoints)setCluesShown(n); setHintPending(true); try{await onHint?.(n);}finally{setHintPending(false);} }}>{t('trailNextClue')} · {cluesShown}/{q.clueCount??q.clues.length}</button>}{!feedback && q.dailyPoints && <strong className="trail-available">{t('competitionAvailable').replace('{n}',String(q.availablePoints))}</strong>}{feedback && <small>{plural(t, 'trailUsed', feedback.cluesUsed ?? cluesShown)}</small>}</section>}
        {q.mode === 'pinpoint' ? <>
            <Suspense fallback={<div className="map-loading">{t('loading')}</div>}><WorldMap t={t} value={chosen} onChange={setAnswer} onConfirm={submit} onTap={competitive ? undefined : submit} disabled={locked} target={feedback?.correctAnswer} correct={feedback?.correct}/></Suspense>
            {!locked && <><p className="question-help">{t(competitive ? 'mapHint' : 'mapTapHint')}</p>{competitive && <button className="btn primary answer-submit" disabled={!answer || busy} onClick={() => submit(answer)}><Navigation size={17}/>{t('lockAnswer')}</button>}</>}
        </> : q.mode === 'order' ? <>
            <p className="question-help">{t(feedback ? 'orderReviewHelp' : 'orderHintGame')}</p>
            <div className={'order-list' + (sort ? ' is-sorting' : '')} ref={listRef}>{shownOrder.map((o: any, i: number) => {
                const right = !!feedback && correctOrder[i] === o.id;
                const place = correctOrder.indexOf(o.id) + 1;
                const lifted = sort?.id === o.id;
                // While a row is dragged, the rows between its old and new place slide one slot aside.
                const shift = !sort || lifted ? 0 : sort.from < sort.to && i > sort.from && i <= sort.to ? -1 : sort.to < sort.from && i >= sort.to && i < sort.from ? 1 : 0;
                const shown = lifted ? sort!.to : i + shift;
                const sortable = !feedback && !locked;
                return <div className={'order-item' + (feedback ? unanswered ? ' order-solution' : right ? ' order-correct' : ' order-wrong' : '') + (sortable ? ' is-sortable' : '') + (lifted ? ' is-lifted' : '')} key={o.id} data-row={o.id}
                    style={lifted ? { transform: 'translateY(' + sort!.dy + 'px) scale(1.03)' } : shift ? { transform: 'translateY(' + shift * sort!.pitch + 'px)' } : undefined}
                    onPointerDown={sortable ? e => startSort(e, i, o.id) : undefined}>
                    <span className="order-num">{shown + 1}</span>{!feedback && <GripVertical size={17} aria-hidden="true"/>}{countryLabel(o)}
                    {feedback ? unanswered ? null : <span className={'order-verdict ' + (right ? 'right' : 'wrong')}>{right ? <Check size={18}/> : <X size={18}/>}<span>{right ? t('rightPlace') : t('correctPlace').replace('{n}', String(place))}</span></span> : <div className="order-controls"><button className="icon-btn" aria-label={t('moveUp') + ' ' + o[locale]} disabled={locked || shown === 0} onClick={() => move(i, i - 1)}><ArrowUp size={18}/></button><button className="icon-btn" aria-label={t('moveDown') + ' ' + o[locale]} disabled={locked || shown === order.length - 1} onClick={() => move(i, i + 1)}><ArrowDown size={18}/></button></div>}
                </div>;
            })}</div>
            {!feedback && <p className="sr-only" aria-live="polite">{moved}</p>}
            {!locked && <button className="btn primary answer-submit" disabled={busy} onClick={() => submit(order.map(o => o.id))}>{t('confirmOrder')}<Check size={18}/></button>}
        </> : q.typed ? <form className="typed-form" onSubmit={e => { e.preventDefault(); submit(answer); }}>
            <label className="sr-only" htmlFor="capital-answer">{t('capital')}</label><input id="capital-answer" className={'text-input' + (feedback ? feedback.correct ? ' input-correct' : ' input-wrong' : '')} aria-invalid={feedback ? !feedback.correct : undefined} aria-describedby={feedback ? 'answer-explanation' : undefined} placeholder={t('capitalPlaceholder')} autoComplete="off" autoFocus disabled={locked} value={chosen ?? ''} onChange={e => setAnswer(e.target.value)} maxLength={100}/>{!locked && <button className="btn primary" disabled={!answer || busy}>{t('lockAnswer')}</button>}
        </form> : <div className="answer-grid">{q.options.map((o: any, i: number) => {
            const right = feedback?.correctAnswer === o.id, picked = chosen === o.id;
            return <button className={'answer-option ' + (feedback ? right ? 'is-correct ' : picked ? 'is-wrong ' : '' : '') + (picked ? 'is-selected' : '')} key={o.id} onClick={() => submit(o.id)} disabled={locked || busy || hintPending} aria-keyshortcuts={String(i + 1)}>
                {countryLabel(o)}
                {answerMarks?.[o.id] && <span className="answer-marks">{answerMarks[o.id]}</span>}
                {picked && !feedback && <LockKeyhole className="answer-lock" size={15}/>}{feedback && (picked || right) && <span className="answer-status">{t(right ? 'correctAnswerLabel' : 'yourAnswer')}</span>}
                {(right || (feedback && picked)) && <span className="answer-key" aria-hidden="true">{right ? <Check size={18} strokeWidth={3}/> : <X size={18} strokeWidth={3}/>}</span>}
            </button>;
        })}</div>}
        {locked && !feedback && <div className="locked-note" role="status"><LockKeyhole size={17}/>{t(busy ? 'answerSending' : 'answerLocked')}</div>}
        {feedback && <div id="answer-explanation" className={'answer-feedback ' + (feedback.correct ? 'good' : 'bad')} role="status">
            <div className="feedback-heading">{feedback.correct ? <span aria-hidden="true">🎉</span> : <X size={22}/>}<strong>{feedbackHeading(t, { correct: !!feedback.correct, seed: String(q.id), streak, distanceKm: feedback.distance, locale })}</strong>{(competitive || q.dailyPoints) && <span>+{(feedback.points??0).toLocaleString(locale)} {t('points')}</span>}</div>
            {q.mode === 'order' ? <><p>{unanswered ? t('noAnswerInTime') : feedback.correct ? t('orderAllRight') : plural(t, 'orderWrongCount', misplaced)}</p>{competitive && !feedback.correct && !unanswered && (feedback.points ?? 0) > 0 && <p className="order-partial">{plural(t, 'orderPartial', shownOrder.length - misplaced).split('{total}').join(String(shownOrder.length))}</p>}<strong className="correction-label">{t('correctOrder')}</strong><ol className="correct-order">{correctOrder.map((id: string) => { const o = q.options.find((o: any) => o.id === id); return o ? <li key={id}>{countryLabel(o)}</li> : null; })}</ol></> : <>
                {!feedback.correct && pickedLabel && <p className="your-answer-copy">{t('yourAnswer')}: <strong>{pickedLabel}</strong></p>}
                <small className="correction-label">{t('correctAnswerLabel')}</small><p className="correct-answer">{feedback.answerLabel[locale]}</p>
            </>}
            {q.mode === 'pinpoint' && <p>{t(feedback.mapRelation ?? (feedback.correct ? 'mapExact' : 'mapDistanceCredit'))}</p>}
            {typeof feedback.distance === 'number' && <p>{t(feedback.mapRule === 'country-v1' ? 'mapBoundaryDistance' : 'mapDistanceExplanation').replace('{n}', feedback.distance.toLocaleString(locale))}</p>}
            <p className="fact">{feedback.fact[locale]}</p>
        </div>}
        {feedback?.borderCountries && <Suspense fallback={<p>{t('loading')}</p>}><BorderMap ids={feedback.borderCountries} names={[q.country?.[locale] ?? '', feedback.answerLabel[locale]]} picked={!feedback.correct && feedback.value ? { id: feedback.value, name: pickedLabel } : null} t={t}/></Suspense>}
        <button className="report-link" onClick={onReport}><Flag size={13}/>{t('report')}</button>
    </div>;
}

/** The list with the item at `from` moved to `to`. */
function reorder<T>(list: T[], from: number, to: number) { const a = [...list]; a.splice(to, 0, a.splice(from, 1)[0]); return a; }
