'use client';
import { ArrowRight, Check, RefreshCw, Share2, Sprout, Sparkles } from 'lucide-react';
import { FinishStage } from '../ds/FinishStage';
import { GameIcon } from '../atelier/GameIcon';

/**
 * The end of a practice game, a bonus game or a survival run, in the same trip style as the daily games:
 * Roviko and the score on the cream canvas, one card with the way on (`followUp`, with the one forest pill),
 * then quiet pills for another round, Share and Done, and the review folded.
 */
export function SoloResults({ result, t, locale, onAgain, onShare, onHome, followUp, dailyStreak }: any) {
    const answers = result.answers ?? [];
    const correct = answers.filter((a: any) => a.correct).length;
    const wrong = answers.filter((a: any) => !a.correct);
    const perfect = correct === answers.length;
    const daily = !!result.competition, survival = !!result.survival;
    return <div className={'results-page learning-results' + (daily ? ' is-daily' : '') + (survival ? ' is-survival' : '')}>
        <FinishStage game={(survival ? t('finSurvival') + ' · ' : result.bonus ? t('bonusKicker') + ' · ' : '') + t(result.competition?.mode === 'trail' ? 'dailyTrail' : result.daily ? 'dailyTitle' : survival ? (result.settings?.mode === 'shape' ? 'shape' : result.settings?.mode ?? 'mixed') : result.settings?.mode ?? 'mixed')}
            headline={t(survival ? (result.out ? 'finishOut' : 'finishPerfect') : perfect ? 'learningPerfectTitle' : 'learningResultTitle')}
            mood={survival && result.out ? (correct >= 10 ? 'wink' : 'worried') : perfect ? 'cheer' : correct / Math.max(1, answers.length) >= .5 ? 'happy' : 'wink'}
            tone={survival ? (result.out ? (correct >= 15 ? 'forest' : 'out') : 'gold') : undefined}
            score={correct} max={survival ? undefined : answers.length} unit={t(survival ? 'survivalInARow' : 'correctAnswers')} locale={locale}
            chips={!daily && !survival ? [{ icon: 'target', value: (answers.length ? Math.round(correct / answers.length * 100) : 0) + '%', label: t('accuracy') }, { icon: 'flame', value: String(result.bestStreak ?? 0), label: t('bestStreak') }, ...(result.daily ? [{ icon: 'clock' as const, value: String(dailyStreak), label: t('days') }] : [])] : undefined}
            trail={answers.map((a: any) => !!a.correct)}/>
        {result.practice && <p className="results-note">{t('practiceSaved')}</p>}
        {followUp}
        <div className="results-actions finish-actions">
            {!daily && !survival && !result.bonus && <button className="finish-quiet" onClick={onAgain}><RefreshCw size={16} aria-hidden="true"/>{t('playAgain')}</button>}
            <button className="finish-quiet" onClick={onShare}><Share2 size={16} aria-hidden="true"/>{t('share')}</button>
            <button className="finish-quiet" onClick={onHome}><Check size={16} strokeWidth={2.6} aria-hidden="true"/>{t('finishForNow')}</button>
        </div>
        <details className="review-section result-review"><summary><h2>{wrong.length ? <><Sprout size={20} aria-hidden="true"/> {t('learningReview')}</> : <><Sparkles size={20} aria-hidden="true"/> {t('perfect')}</>}</h2></summary>{wrong.length ? <><p>{t('learningReviewCopy')}</p><div className="review-list">{wrong.map((a: any, i: number) => <div key={i}><GameIcon mode={a.mode}/><div><strong>{a.answerLabel[locale]}</strong><p>{a.fact[locale]}</p></div><ArrowRight size={18} aria-hidden="true"/></div>)}</div></> : <p>{t('learningPerfectCopy')}</p>}</details>
    </div>;
}
