'use client';
import { useEffect, useState, lazy, Suspense } from 'react';
import { ArrowUp, ArrowDown, Check, X, LockKeyhole, Flag, GripVertical, Navigation } from 'lucide-react';
const BorderMap = lazy(() => import('./BorderMap'));
const WorldMap = lazy(() => import('./WorldMap'));
export function Question({ question: q, feedback, locked, onAnswer, t, locale, onReport, busy, competitive = true, onHint }: {
    question: any; feedback: any; locked: boolean; onAnswer: (answer: any) => void;
    t: (k: string) => string; locale: 'en' | 'nl'; onReport: () => void; busy?: boolean; competitive?: boolean; onHint?: (count: number) => void;
}) {
    const [cluesShown, setCluesShown] = useState(q?.cluesShown ?? 1);
    const [answer, setAnswer] = useState<any>(null);
    const [order, setOrder] = useState<any[]>(q?.options ?? []);
    const [drag, setDrag] = useState<number | null>(null);
    useEffect(() => { setAnswer(null); setOrder(q?.options ?? []); setCluesShown(q?.cluesShown ?? 1); }, [q?.id]);
    useEffect(() => {
        if (!q || locked || q.typed || ['pinpoint', 'order'].includes(q.mode)) return;
        const handler = (e: KeyboardEvent) => {
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName) || document.querySelector('[role=dialog]')) return;
            const n = Number(e.key); if (n >= 1 && n <= q.options.length) { setAnswer(q.options[n - 1].id); onAnswer(q.options[n - 1].id); }
        };
        window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler);
    }, [q, locked, onAnswer]);
    if (!q) return null;
    const chosen = feedback?.value ?? answer;
    const shownOrder = feedback && Array.isArray(chosen) ? chosen.map((id: string) => q.options.find((o: any) => o.id === id)).filter(Boolean) : order;
    const correctOrder = q.mode === 'order' && Array.isArray(feedback?.correctAnswer) ? feedback.correctAnswer : [];
    const misplaced = shownOrder.filter((o: any, i: number) => correctOrder[i] !== o.id).length;
    const pickedLabel = q.typed ? chosen : q.options?.find((o: any) => o.id === chosen)?.[locale];
    const move = (from: number, to: number) => {
        if (to < 0 || to >= order.length || locked) return;
        setOrder(prev => { const a = [...prev]; a.splice(to, 0, a.splice(from, 1)[0]); return a; });
    };
    const submit = (value: any) => { if (locked || busy) return; setAnswer(value); onAnswer(value); };
    const countryLabel = (o: any) => <span className="option-country">{o.flag && (q.mode !== 'flags' || feedback) && <img src={o.flag} alt=""/>}<span>{o[locale]}</span></span>;
    return <div className="question-content">
        <div className="question-heading"><span className="eyebrow">{t(q.mode + 'Hint')}</span><h1>{q.prompt[locale]}</h1>{q.country && <span className="question-country"><img src={q.country.flag} alt=""/>{q.country[locale]}</span>}</div>
        {q.clues && <section className="trail-clues" aria-label={t('trailClues')}><p>{t(competitive ? 'trailMultiplayerRule' : 'trailRule')}</p><ol>{q.clues.slice(0, competitive || feedback ? 4 : cluesShown).map((clue: any, i: number) => <li key={i}><span>{i+1}</span>{clue[locale]}</li>)}</ol>{!competitive && !locked && cluesShown < q.clues.length && <button className="btn secondary" onClick={() => { const n = cluesShown + 1; setCluesShown(n); onHint?.(n); }}>{t('trailNextClue')} · {cluesShown}/{q.clues.length}</button>}{feedback && <small>{t('trailUsed').replace('{n}', String(feedback.cluesUsed ?? cluesShown))}</small>}</section>}
        {q.mode === 'pinpoint' && <p className="map-rule">{t(q.mapRule === 'country-v1' ? 'mapCountryRule' : 'mapLegacyRule')}</p>}
        {q.flag && (q.mode !== 'trail' || competitive || feedback || cluesShown >= 3) && <div className="flag-stage"><img src={'/api/flag/' + encodeURIComponent(q.flag)} alt={feedback ? feedback.answerLabel[locale] : t('flags')} draggable="false"/></div>}
        {q.mode === 'pinpoint' ? <>
            <Suspense fallback={<div className="map-loading">{t('loading')}</div>}><WorldMap t={t} value={chosen} onChange={setAnswer} onConfirm={submit} disabled={locked} target={feedback?.correctAnswer} correct={feedback?.correct}/></Suspense>
            {!locked && <><p className="question-help">{t('mapHint')}</p><button className="btn primary answer-submit" disabled={!answer || busy} onClick={() => submit(answer)}><Navigation size={17}/>{t('lockAnswer')}</button></>}
        </> : q.mode === 'order' ? <>
            <p className="question-help">{t(feedback ? 'orderReviewHelp' : 'orderHintGame')}</p>
            <div className="order-list">{shownOrder.map((o: any, i: number) => {
                const right = !!feedback && correctOrder[i] === o.id;
                const place = correctOrder.indexOf(o.id) + 1;
                return <div className={'order-item' + (feedback ? right ? ' order-correct' : ' order-wrong' : '')} key={o.id} draggable={!locked} onDragStart={() => setDrag(i)} onDragOver={e => e.preventDefault()} onDrop={() => { if (drag !== null) move(drag, i); setDrag(null); }}>
                    <span className="order-num">{i + 1}</span>{!feedback && <GripVertical size={17}/>}{countryLabel(o)}
                    {feedback ? <span className={'order-verdict ' + (right ? 'right' : 'wrong')}>{right ? <Check size={18}/> : <X size={18}/>}<span>{right ? t('rightPlace') : t('correctPlace').replace('{n}', String(place))}</span></span> : <div className="order-controls"><button className="icon-btn" aria-label={t('moveUp') + ' ' + o[locale]} disabled={locked || i === 0} onClick={() => move(i, i - 1)}><ArrowUp size={18}/></button><button className="icon-btn" aria-label={t('moveDown') + ' ' + o[locale]} disabled={locked || i === order.length - 1} onClick={() => move(i, i + 1)}><ArrowDown size={18}/></button></div>}
                </div>;
            })}</div>
            {!locked && <button className="btn primary answer-submit" disabled={busy} onClick={() => submit(order.map(o => o.id))}>{t('lockAnswer')}<Check size={18}/></button>}
        </> : q.typed ? <form className="typed-form" onSubmit={e => { e.preventDefault(); submit(answer); }}>
            <label className="sr-only" htmlFor="capital-answer">{t('capital')}</label><input id="capital-answer" className={'text-input' + (feedback ? feedback.correct ? ' input-correct' : ' input-wrong' : '')} aria-invalid={feedback ? !feedback.correct : undefined} aria-describedby={feedback ? 'answer-explanation' : undefined} placeholder={t('capitalPlaceholder')} autoComplete="off" autoFocus disabled={locked} value={chosen ?? ''} onChange={e => setAnswer(e.target.value)} maxLength={100}/>{!locked && <button className="btn primary" disabled={!answer || busy}>{t('lockAnswer')}</button>}
        </form> : <div className="answer-grid">{q.options.map((o: any, i: number) => {
            const right = feedback?.correctAnswer === o.id, picked = chosen === o.id;
            return <button className={'answer-option ' + (feedback ? right ? 'is-correct ' : picked ? 'is-wrong ' : '' : '') + (picked ? 'is-selected' : '')} key={o.id} onClick={() => submit(o.id)} disabled={locked || busy}>
                <span className="answer-key">{right ? <Check size={17}/> : feedback && picked ? <X size={17}/> : i + 1}</span>{countryLabel(o)}
                {picked && !feedback && <LockKeyhole className="answer-lock" size={15}/>}{feedback && (picked || right) && <span className="answer-status">{t(right ? 'correctAnswerLabel' : 'yourAnswer')}</span>}
            </button>;
        })}</div>}
        {locked && !feedback && <div className="locked-note" role="status"><LockKeyhole size={17}/>{t(busy ? 'answerSending' : 'answerLocked')}</div>}
        {feedback && <div id="answer-explanation" className={'answer-feedback ' + (feedback.correct ? 'good' : 'bad')} role="status">
            <div className="feedback-heading">{feedback.correct ? <span aria-hidden="true">🎉</span> : <X size={22}/>}<strong>{t(feedback.correct ? 'correct' : 'incorrect')}</strong>{competitive && <span>+{feedback.points.toLocaleString()} {t('points')}</span>}</div>
            {q.mode === 'order' ? <><p>{feedback.correct ? t('orderAllRight') : t('orderWrongCount').replace('{n}', String(misplaced))}</p><strong className="correction-label">{t('correctOrder')}</strong><ol className="correct-order">{correctOrder.map((id: string) => { const o = q.options.find((o: any) => o.id === id); return o ? <li key={id}>{countryLabel(o)}</li> : null; })}</ol></> : <>
                {!feedback.correct && pickedLabel && <p className="your-answer-copy">{t('yourAnswer')}: <strong>{pickedLabel}</strong></p>}
                <small className="correction-label">{t('correctAnswerLabel')}</small><p className="correct-answer">{feedback.answerLabel[locale]}</p>
            </>}
            {typeof feedback.distance === 'number' && <p>{t(feedback.mapRule === 'country-v1' ? 'mapBoundaryDistance' : 'mapDistanceExplanation').replace('{n}', feedback.distance.toLocaleString(locale))}</p>}
            <p className="fact">{feedback.fact[locale]}</p>
        </div>}
        {feedback?.borderCountries && <Suspense fallback={<p>{t('loading')}</p>}><BorderMap ids={feedback.borderCountries} names={[q.country?.[locale] ?? '', feedback.answerLabel[locale]]} t={t}/></Suspense>}
        <button className="report-link" onClick={onReport}><Flag size={13}/>{t('report')}</button>
    </div>;
}
