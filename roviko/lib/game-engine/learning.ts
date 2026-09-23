import { haversine, matches } from './scoring';
import { locateInCountry } from './geometry';
import type { Question } from './questions';

// A single current-round solution supports immediate, unranked learning feedback.
// This serializer is never used in multiplayer; future questions stay on the server.
export type LearningSolution = Pick<Question, 'mode' | 'correct' | 'aliases' | 'typed' | 'answerLabel' | 'fact' | 'countryId' | 'geometry' | 'mapRule' | 'toleranceKm'>;
export function learningSolution(q: Question): LearningSolution {
    return { geometry: q.geometry, mapRule: q.mapRule, toleranceKm: q.toleranceKm, mode: q.mode, correct: q.correct, aliases: q.aliases, typed: q.typed, answerLabel: q.answerLabel, fact: q.fact, countryId: q.countryId };
}
export function evaluateLearning(q: LearningSolution, answer: unknown, streak = 0) {
    let correct = false, distance: number | null = null;
    if (q.mode === 'pinpoint') {
        if (Array.isArray(answer) && answer.length === 2 && answer.every(v => typeof v === 'number' && Number.isFinite(v)) && Math.abs(answer[0]) <= 90 && Math.abs(answer[1]) <= 180) {
            distance = Math.round(haversine(answer, q.correct as number[]));
            if (q.geometry && q.mapRule === 'country-v1') { const located = locateInCountry(answer, q.geometry, q.toleranceKm); correct = located.correct; distance = located.distance; } else correct = distance < 700;
        }
    } else {
        correct = q.typed && typeof answer === 'string' ? matches(answer, q.aliases ?? []) : Array.isArray(q.correct) ? Array.isArray(answer) && JSON.stringify(answer) === JSON.stringify(q.correct) : answer === q.correct;
    }
    return { correct, distance, mapRule: q.mapRule, borderCountries: q.mode === 'borders' ? [q.countryId, q.correct] : undefined, streak: correct ? streak + 1 : 0, answerLabel: q.answerLabel, fact: q.fact, correctAnswer: q.correct, countryId: q.countryId, mode: q.mode, points: 0, risk: 0, responseTime: 0 };
}
