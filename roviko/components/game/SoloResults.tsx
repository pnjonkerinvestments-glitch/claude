'use client';
import { ArrowRight, RefreshCw, Share2 } from 'lucide-react';
import { MODE_EMOJIS } from '@/lib/config';

export function SoloResults({ result, t, locale, onAgain, onShare, onHome, followUp, dailyStreak }: any) {
    const answers = result.answers ?? [];
    const correct = answers.filter((a: any) => a.correct).length;
    const wrong = answers.filter((a: any) => !a.correct);
    const perfect = correct === answers.length;
    return <div className="results-page learning-results">
        <span className="learning-celebration" aria-hidden="true">{perfect ? '🎉' : '🌍'}</span>
        <span className="eyebrow">{t(result.daily ? 'daily' : result.settings?.mode ?? 'mixed')}</span>
        <h1>{t(perfect ? 'learningPerfectTitle' : 'learningResultTitle')}</h1>
        <p className="results-subtitle">{t('learningResultCopy')}</p>
        <div className="learning-total"><strong>{correct}<span> / {answers.length}</span></strong><p>{t('correctAnswers')}</p></div>
        <div className="answer-trail" aria-label={`${correct} / ${answers.length} ${t('correctAnswers')}`}>
            {answers.map((a: any, i: number) => <span key={i} className={a.correct ? 'found' : 'discovered'} title={`${i + 1}: ${t(a.correct ? 'correct' : 'incorrect')}`} aria-hidden="true">{a.correct ? '✓' : '✕'}</span>)}
        </div>

        {result.daily && <p className="muted">{t('streakRule')}</p>}
        <div className="learning-highlights"><span>🎯 <b>{answers.length ? Math.round(correct / answers.length * 100) : 0}%</b> {t('accuracy')}</span><span>🔥 <b>{result.bestStreak ?? 0}</b> {t('bestStreak')}</span>{result.daily && <span>☀️ <b>{dailyStreak}</b> {t('days')}</span>}</div>
        {result.practice && <p className="muted">{t('practiceSaved')}</p>}
        {followUp}
        <div className="results-actions"><button className="btn secondary" onClick={onHome}>{t('finishForNow')}</button><button className="btn ghost" onClick={onShare}><Share2 size={17}/>{t('share')}</button><button className="btn ghost" onClick={onAgain}><RefreshCw size={18}/>{t('playAgain')}</button></div>
        <section className="review-section"><h2>{wrong.length ? '🌱 ' + t('learningReview') : '✨ ' + t('perfect')}</h2>{wrong.length ? <><p>{t('learningReviewCopy')}</p><div className="review-list">{wrong.map((a: any, i: number) => <div key={i}><span className={'review-mode tone-' + a.mode} aria-hidden="true">{MODE_EMOJIS[a.mode] ?? '🌍'}</span><div><strong>{a.answerLabel[locale]}</strong><p>{a.fact[locale]}</p></div><ArrowRight size={18}/></div>)}</div></> : <p>{t('learningPerfectCopy')}</p>}</section>
    </div>;
}
