import boundaries from '../public/data/boundaries.json';
import { locateInCountry, type Polygons } from '../lib/game-engine/geometry';
import { COUNTRIES, type Question } from '../lib/game-engine/questions';
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

// Bounding boxes skip unrelated polygons before the exact point-in-country check.
const boxes = new Map(COUNTRIES.map(c => [c.id, ((boundaries as Record<string, Polygons>)[c.id] ?? []).map(poly => {
    const ring=poly[0]; return [Math.min(...ring.map(p=>p[0])),Math.max(...ring.map(p=>p[0])),Math.min(...ring.map(p=>p[1])),Math.max(...ring.map(p=>p[1]))];
})]));
export function enrichMapFeedback<T extends {correct:boolean;distance:number|null}>(q: Question, answer: unknown, result: T): T & { mapRelation?: string } {
    if(q.mode!=='pinpoint'||!Array.isArray(answer)||answer.length!==2||!answer.every(Number.isFinite))return result;
    if(result.correct)return {...result,mapRelation:'mapExact'};
    const target=COUNTRIES.find(c=>c.id===q.countryId);
    const selected=COUNTRIES.find(c=>boxes.get(c.id)?.some(([west,east,south,north])=>answer[0]>=south&&answer[0]<=north&&(east-west>180||(answer[1]>=west&&answer[1]<=east)))&&locateInCountry(answer,(boundaries as Record<string, Polygons>)[c.id],0).correct);
    return {...result,mapRelation:selected && target?.borders.includes(selected.id)?'mapNeighbour':selected && target?.region===selected.region?'mapContinent':'mapDistanceCredit'};
}
