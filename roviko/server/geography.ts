import boundaries from '../public/data/boundaries.json';
import { locateInCountry, type Polygons } from '../lib/game-engine/geometry';
import type { Question } from '../lib/game-engine/questions';
/** Server-only dataset. Only the current learning question includes its geometry. */
export function prepareGeography(questions: Question[]) {
    return questions.map(q => {
        if (q.mode !== 'pinpoint') return q;
        const geometry = (boundaries as Record<string, Polygons>)[q.countryId];
        if (!geometry?.length) throw new Error('QUESTION_UNAVAILABLE');
        let point = q.correct as number[];
        if (!locateInCountry(point, geometry, 0).correct) {
            const p = [...geometry].sort((a, b) => b[0].length - a[0].length)[0][0][0];
            point = [p[1], p[0]];
        }
        return { ...q, correct: point, geometry, mapRule: 'country-v1' as const, toleranceKm: 25,
            fact: { en: 'A pin inside the country or within 25 km of its mapped boundary is accepted. Included islands count too.', nl: 'Een pin in het land of binnen 25 km van de kaartgrens telt als goed. Opgenomen eilanden tellen mee.' } };
    });
}
