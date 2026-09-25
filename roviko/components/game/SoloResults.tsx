'use client';
import { ArrowRight, Flame, RefreshCw, Share2, Sprout, Sparkles, Sun, Target } from 'lucide-react';
import { Mascot } from '../ds/Mascot';
import { GameIcon } from '../atelier/GameIcon';

export function SoloResults({ result, t, locale, onAgain, onShare, onHome, followUp, dailyStreak }: any) {
    const answers = result.answers ?? [];
    const correct = answers.filter((a: any) => a.correct).length;
    const wrong = answers.filter((a: any) => !a.correct);
    const perfect = correct === answers.length;
    const daily = !!result.competition;
    return <div className={'results-page learning-results' + (daily ? ' is-daily' : '')}>
        <Mascot mood={perfect ? 'cheer' : correct / Math.max(1, answers.length) >= .5 ? 'happy' : 'wink'} size={132} className="result-mascot"/>
        <span className="eyebrow">{t(result.competition?.mode === 'trail' ? 'dailyTrail' : result.daily ? 'dailyTitle' : result.settings?.mode ?? 'mixed')}</span>
        <h1>{t(perfect ? 'learningPerfectTitle' : 'learningResultTitle')}</h1>
        {!daily && <p className="results-subtitle">{t('learningResultCopy')}</p>}
        <div className="learning-total"><strong>{correct}<span> / {answers.length}</span></strong><p>{t('correctAnswers')}</p></div>
        <div className="answer-trail" aria-label={`${correct} / ${answers.length} ${t('correctAnswers')}`}>
            {answers.map((a: any, i: number) => <span key={i} className={a.correct ? 'found' : 'discovered'} title={`${i + 1}: ${t(a.correct ? 'correct' : 'incorrect')}`} aria-hidden="true">{a.correct ? '✓' : '✕'}</span>)}
        </div>

        {!daily && <div className="learning-highlights"><span><Target size={17} aria-hidden="true"/><b>{answers.length ? Math.round(correct / answers.length * 100) : 0}%</b> {t('accuracy')}</span><span><Flame size={17} aria-hidden="true"/><b>{result.bestStreak ?? 0}</b> {t('bestStreak')}</span>{result.daily && <span><Sun size={17} aria-hidden="true"/><b>{dailyStreak}</b> {t('days')}</span>}</div>}
        {result.practice && <p className="muted">{t('practiceSaved')}</p>}
        {followUp}
        <div className="results-actions"><button className="btn secondary" onClick={onHome}>{t('finishForNow')}</button><button className="btn ghost" onClick={onShare}><Share2 size={17}/>{t('share')}</button>{!daily && <button className="btn ghost" onClick={onAgain}><RefreshCw size={18}/>{t('playAgain')}</button>}</div>
        <details className="review-section result-review"><summary><h2>{wrong.length ? <><Sprout size={20} aria-hidden="true"/> {t('learningReview')}</> : <><Sparkles size={20} aria-hidden="true"/> {t('perfect')}</>}</h2></summary>{wrong.length ? <><p>{t('learningReviewCopy')}</p><div className="review-list">{wrong.map((a: any, i: number) => <div key={i}><GameIcon mode={a.mode}/><div><strong>{a.answerLabel[locale]}</strong><p>{a.fact[locale]}</p></div><ArrowRight size={18}/></div>)}</div></> : <p>{t('learningPerfectCopy')}</p>}</details>
    </div>;
}
