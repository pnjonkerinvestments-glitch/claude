import type { Question } from './questions';
export function validAnswer(q: Question, value: unknown) {
    if (q.mode === 'pinpoint') return Array.isArray(value) && value.length === 2 && value.every(x => typeof x === 'number' && Number.isFinite(x)) && Math.abs(value[0]) <= 90 && Math.abs(value[1]) <= 180;
    if (q.mode === 'order') return Array.isArray(value) && value.length === q.options.length && new Set(value).size === value.length && value.every(x => typeof x === 'string' && q.options.some(o => o.id === x));
    if (q.typed) return typeof value === 'string' && value.trim().length > 0 && value.length <= 100;
    return typeof value === 'string' && q.options.some(o => o.id === value);
}
