import { spanishCapital, spanishCountry } from '../../i18n/content';
import data from '../data/countries.json';
import { locateInCountry, type Polygons } from './geometry';
import { random, shuffle, matches, haversine, scoreAnswer, mapScore, mapAccuracyPoints, seedHash } from './scoring';
import { GEOGRAPHY_POLICY, MODES } from '../config';
export type Country = {
    id: string;
    iso2: string;
    name: string;
    nl: string; es?: string;
    official: string;
    capitals: string[];
    region: string;
    subregion: string;
    latlng: number[];
    borders: string[];
    area: number;
    languages: string[];
    currencies: string[];
    flag: string;
    numeric: string;
};
export const COUNTRIES = data as Country[];
export type Settings = {
    mode: string;
    count: number;
    timer: number;
    difficulty: string;
    region: string;
    typed?: boolean;
    enabledModes?: string[];
};
export type Option = {
    id: string;
    en: string;
    nl: string; es?: string;
    flag?: string;
};
export type Question = {
    id: string;
    mode: string;
    countryId: string;
    prompt: {
        en: string;
        nl: string; es?: string;
    };
    options: Option[];
    flag?: string;
    correct: string | string[] | number[];
    aliases?: string[];
    fact: {
        en: string;
        nl: string; es?: string;
    };
    answerLabel: {
        en: string;
        nl: string; es?: string;
    };
    difficulty: string;
    typed?: boolean;
    clues?: { en: string; nl: string; es?: string }[];
    mapRule?: 'country-v1';
    toleranceKm?: number;
    geometry?: Polygons;
    /** Pinpoint on a small country: the map opens on this [south, west, north, east] box around its subregion. */
    zoom?: [number, number, number, number];
};
const familiar = ['USA', 'CAN', 'MEX', 'BRA', 'ARG', 'PER', 'CHL', 'COL', 'GBR', 'FRA', 'ESP', 'ITA', 'DEU', 'NLD', 'BEL', 'GRC', 'PRT', 'SWE', 'NOR', 'CHE', 'AUT', 'POL', 'RUS', 'CHN', 'JPN', 'IND', 'IDN', 'THA', 'KOR', 'TUR', 'SAU', 'AUS', 'NZL', 'FJI', 'EGY', 'ZAF', 'MAR', 'KEN', 'NGA', 'GHA'];
const aliases: Record<string, string[]> = { CHN: ['Peking'], UKR: ['Kiev', 'Kyiv'], MEX: ['Mexico City', 'Mexico-stad', 'Ciudad de Mexico'], CZE: ['Prague', 'Praag', 'Praha'], RUS: ['Moscow', 'Moskou', 'Moskva'], EGY: ['Cairo', 'Caïro'], ITA: ['Rome', 'Roma'], AUT: ['Vienna', 'Wenen', 'Wien'], BEL: ['Brussels', 'Brussel', 'Bruxelles'], DNK: ['Copenhagen', 'Kopenhagen'], GRC: ['Athens', 'Athene'], POL: ['Warsaw', 'Warschau'], PRT: ['Lisbon', 'Lissabon', 'Lisboa'], SWE: ['Stockholm'], HUN: ['Budapest', 'Boedapest'], ROU: ['Bucharest', 'Boekarest'], SRB: ['Belgrade', 'Belgrado'], ESP: ['Madrid'], KOR: ['Seoul'], THA: ['Bangkok', 'Krung Thep'] };
/** Pin questions only use countries a player can realistically find and tap on a phone-sized world map:
 *  at least 10,000 km², and in Oceania only the three large countries (no scattered island states). */
const PIN_MIN_AREA = 10000, PIN_OCEANIA = ['AUS', 'NZL', 'PNG'];
export function pinnable(c: Country) { return c.area >= PIN_MIN_AREA && (c.region !== 'Oceania' || PIN_OCEANIA.includes(c.id)); }
/** Below this size the map opens zoomed in on the country's subregion, and the Daily Detour keeps it out of its first five questions. */
export const PIN_SMALL_AREA = 50000;
function subregionBox(c: Country): [number, number, number, number] {
    const pts = COUNTRIES.filter(x => x.subregion === c.subregion).map(x => x.latlng);
    const lat = pts.map(p => p[0]), lng = pts.map(p => p[1]);
    const pad = 4;
    return [Math.max(-85, Math.min(...lat) - pad), Math.max(-180, Math.min(...lng) - pad), Math.min(85, Math.max(...lat) + pad), Math.min(180, Math.max(...lng) + pad)];
}
function namesOverlap(a: Country, b: Country) { return [a.name, a.nl, spanishCountry(a.name)].some((name,i) => name.toLocaleLowerCase().includes([b.name,b.nl,spanishCountry(b.name)][i].toLocaleLowerCase())); }
function nameOption(c: Country): Option { return { id: c.id, en: c.name, nl: c.nl, flag: c.flag }; }
function capitalOption(c: Country): Option { return { id: c.id, en: c.capitals[0], nl: c.capitals[0] }; }
export function generateQuestions(settings: Settings, seed: string, exclude: string[] = [], weak: string[] = [], focus?: string, blocked: string[] = []) {
    const rng = random(seed);
    const enabled = shuffle(MODES.filter(m => !settings.enabledModes || settings.enabledModes.includes(m)), rng);
    if (settings.mode === 'mixed' && !enabled.length) throw new Error('Question unavailable');
    let pool = COUNTRIES.filter(c => settings.region === 'World' || c.region === settings.region);
    if (settings.difficulty === 'easy') {
        const simple = pool.filter(c => familiar.includes(c.id));
        if (simple.length >= 6)
            pool = simple;
    }
    if (settings.difficulty === 'hard') {
        const obscure = pool.filter(c => !familiar.includes(c.id));
        if (obscure.length >= 5)
            pool = obscure;
    }
    if (pool.length < 4)
        throw new Error('Not enough countries for these settings');
    const result: Question[] = [];
    // Daily Detour: every question type, four times over, shuffled per block of five and never the same type twice in a row.
    const DETOUR = ['flags', 'capitals', 'pinpoint', 'borders', 'order'];
    const detourOrder: string[] = [];
    // The trip opens gently: a flag and a capital first, the map and the harder types after that.
    if (settings.mode === 'daily') detourOrder.push('flags', 'capitals', ...shuffle(['pinpoint', 'borders', 'order'], rng));
    if (settings.mode === 'daily') while (detourOrder.length < settings.count) {
        let block = shuffle([...DETOUR], rng);
        if (block[0] === detourOrder.at(-1)) block = [...block.slice(1), block[0]];
        detourOrder.push(...block);
    }
    let used = new Set(exclude);
    let attempts = 0;
    while (result.length < settings.count && attempts++ < settings.count * 200) {
        const i = result.length;
        const daily = seed.startsWith('daily:');
        const mode = settings.mode === 'daily' ? detourOrder[i] : settings.mode === 'mixed' ? enabled[i % enabled.length] : settings.mode;
        let candidates = pool.filter(c => !(mode === 'capitals' || mode === 'trail') || (!GEOGRAPHY_POLICY.excludeSensitiveCapitalQuestions.includes(c.id) && c.capitals.length));
        if (mode === 'capitals' || mode === 'trail') candidates = candidates.filter(c => ![...c.capitals,...c.capitals.map(spanishCapital)].some(cap => { const a = cap.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(); return [c.name,c.nl,spanishCountry(c.name)].some(n => { const b=n.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(); return b.includes(a) || a.includes(b); }); }));
        if (mode === 'borders')
            candidates = candidates.filter(c => c.borders.some(id => COUNTRIES.some(n => n.id === id && !namesOverlap(c,n))) && !['PSE', 'ISR', 'RUS', 'UKR'].includes(c.id));
        if (mode === 'pinpoint')
            candidates = candidates.filter(c => pinnable(c) && !GEOGRAPHY_POLICY.puzzleSensitiveCountries.includes(c.id) && (settings.mode !== 'daily' || i >= 5 || c.area >= PIN_SMALL_AREA));
        // The first three Detour questions are about well-known countries.
        if (settings.mode === 'daily' && i < 3) { const known = candidates.filter(c => familiar.includes(c.id)); if (known.length) candidates = known; }
        if (!candidates.length)
            throw new Error('Question unavailable');
        const weighted = focus && i === 0 ? candidates.filter(c => c.id === focus) : !daily && weak.length && rng() < .45 ? candidates.filter(c => weak.includes(c.id)) : [];
        const c = shuffle(weighted.length ? weighted : candidates, rng)[0];
        let id = mode + ':' + seedHash('roviko-v1:' + mode + ':' + c.id).toString(36);
        if (blocked.some(item => item === id || item.split('-')[0] === id)) continue;
        if (used.has(id)) {
            if (attempts > settings.count * 20) {
                // Small regions can exhaust their eligible countries. Prefer new
                // targets first, then permit a repeat with a fresh round ID.
                id += '-' + seedHash(seed + ':' + i).toString(36);
                if (used.has(id))
                    continue;
            }
            else
                continue;
        }
        used.add(id);
        const q: Question = { id, mode, countryId: c.id, prompt: { en: '', nl: '' }, options: [], correct: c.id, answerLabel: { en: c.name, nl: c.nl }, fact: { en: `${c.name} is in ${c.subregion}. ${c.capitals.length ? 'Its capital ' + (c.capitals.length > 1 ? 'cities are ' : 'is ') + c.capitals.join(' / ') + '.' : ''}`, nl: `${c.nl}: ${c.capitals.length ? 'hoofdstad' + (c.capitals.length > 1 ? 'en' : '') + ' ' + c.capitals.join(' / ') + '. ' : ''}${c.area.toLocaleString('nl-NL')} km² oppervlakte.` }, difficulty: settings.difficulty };
        const others = COUNTRIES.filter(x => x.id !== c.id && x.capitals.length);
        const nearby = shuffle(others.filter(x => x.region === c.region), rng);
        const far = shuffle(others.filter(x => x.region !== c.region), rng);
        const plausible = settings.difficulty === 'easy' ? shuffle(others, rng) : [...nearby, ...far];
        if (mode === 'flags') {
            q.prompt = { en: 'Which country flies this flag?', nl: 'Bij welk land hoort deze vlag?' };
            q.flag = c.iso2;
            q.options = shuffle([c, ...plausible.slice(0, 3)], rng).map(nameOption);
        }
        else if (mode === 'capitals') {
            q.prompt = { en: `${c.capitals.length > 1 ? 'Which is a capital' : 'What is the capital'} of ${c.name}?`, nl: `${c.capitals.length > 1 ? 'Welke stad is een hoofdstad' : 'Wat is de hoofdstad'} van ${c.nl}?` };
            q.options = shuffle([c, ...plausible.filter(x => !x.capitals.some(a => c.capitals.includes(a))).filter((x, i, a) => a.findIndex(y => y.capitals[0] === x.capitals[0]) === i).slice(0, 3)], rng).map(capitalOption);
            q.answerLabel = { en: c.capitals.join(' / '), nl: c.capitals.join(' / ') };
            q.aliases = [...c.capitals, ...c.capitals.map(spanishCapital), ...(aliases[c.id] ?? [])];
            q.typed = !!settings.typed;
        }
        else if (mode === 'trail') {
            q.prompt = { en: 'Follow the trail. Which country am I?', nl: 'Volg het spoor. Welk land ben ik?' };
            const regionNL: Record<string,string> = { Europe:'Europa', Asia:'Azië', Africa:'Afrika', 'North America':'Noord-Amerika', 'South America':'Zuid-Amerika', Oceania:'Oceanië' };
            const neighbor = COUNTRIES.find(n => c.borders.includes(n.id) && !namesOverlap(n,c));
            q.clues = [
                { en: 'Start your search in ' + c.region + '.', nl: 'Begin je zoektocht in ' + (regionNL[c.region] ?? c.region) + '.' },
                { en: neighbor ? 'I share a land border with ' + neighbor.name + '.' : 'I have no land borders with other countries in this atlas.', nl: neighbor ? 'Ik deel een landgrens met ' + neighbor.nl + '.' : 'Ik heb geen landgrenzen met andere landen in deze atlas.' },
                { en: 'My capital is ' + c.capitals[0] + '.', nl: 'Mijn hoofdstad is ' + c.capitals[0] + '.', es: 'Mi capital es ' + spanishCapital(c.capitals[0]) + '.' },
                { en: 'My flag looks like this.', nl: 'Mijn vlag ziet er zo uit.', es: 'Mi bandera tiene este aspecto.' }
            ];
            q.flag = c.iso2;
            q.options = shuffle([c, ...nearby.slice(0, 1), ...far.slice(0, 2)], rng).map(({id,name,nl}) => ({id,en:name,nl}));
        }
        else if (mode === 'pinpoint') {
            q.prompt = { en: `Drop a pin in ${c.name}.`, nl: `Zet een pin in ${c.nl}.` };
            q.correct = c.latlng;
            q.fact = { en: `The target is a representative point in ${c.name}. Distance is measured to this point.`, nl: `Het doel is een representatief punt in ${c.nl}. De afstand wordt tot dit punt gemeten.` };
            if (c.area < PIN_SMALL_AREA) q.zoom = subregionBox(c);
        }
        else if (mode === 'borders') {
            const n = shuffle(COUNTRIES.filter(x => c.borders.includes(x.id) && !namesOverlap(c,x)), rng)[0];
            const distractors = plausible.filter(x => !c.borders.includes(x.id) && x.id !== c.id).slice(0, 3);
            q.prompt = { en: `Which country shares a land border with ${c.name}?`, nl: `Welk land heeft een landgrens met ${c.nl}?` };
            q.correct = n.id;
            q.options = shuffle([n, ...distractors], rng).map(nameOption);
            q.answerLabel = { en: n.name, nl: n.nl };
            q.fact = { en: `${c.name} and ${n.name} share a land border.`, nl: `${c.nl} en ${n.nl} delen een landgrens.` };
        }
        else if (mode === 'order') {
            const list = [c, ...shuffle(pool.filter(x => x.id !== c.id && x.area !== c.area), rng).filter((x, i, a) => a.findIndex(y => y.area === x.area) === i).slice(0, 3)];
            q.options = shuffle(list, rng).map(nameOption);
            q.correct = [...list].sort((a, b) => b.area - a.area).map(x => x.id);
            q.prompt = { en: 'Put these countries in order. Largest area first.', nl: 'Zet de landen op volgorde. Grootste oppervlakte bovenaan.' };
            q.answerLabel = { en: (q.correct as string[]).map(id => list.find(c => c.id === id)!.name).join(' → '), nl: (q.correct as string[]).map(id => list.find(c => c.id === id)!.nl).join(' → ') };
            q.fact = { en: [...list].sort((a, b) => b.area - a.area).map(x => `${x.name}: ${x.area.toLocaleString('en')} km²`).join(' · '), nl: [...list].sort((a, b) => b.area - a.area).map(x => `${x.nl}: ${x.area.toLocaleString('nl')} km²`).join(' · ') };
        }
        else
            throw new Error('Unknown mode');
        result.push(q);
    }
    if (result.length !== settings.count)
        throw new Error('Question selection exhausted');
    return result;
}
export function publicQuestion(q: Question, reveal = false) { const { correct, aliases, fact, answerLabel, countryId, geometry, ...safe } = q; const country = COUNTRIES.find(c => c.id === countryId); return { ...safe, options: safe.options.map(o => ({ ...o, flag: !reveal && ['capitals','flags','trail'].includes(q.mode) ? undefined : COUNTRIES.find(c => c.id === o.id)?.flag })), country: ['capitals','borders','pinpoint'].includes(q.mode) && country ? { en: country.name, nl: country.nl, flag: country.flag } : undefined, flag: q.flag ? q.id : undefined }; }
export function evaluate(q: Question, answer: unknown, elapsed: number, limit: number, streak: number) {
    let correct = false, distance: number | null = null;
    let points = 0;
    if (q.mode === 'pinpoint' && Array.isArray(answer) && answer.length === 2 && answer.every(v => typeof v === 'number' && Number.isFinite(v)) && Math.abs(answer[0]) <= 90 && Math.abs(answer[1]) <= 180) {
        distance = Math.round(haversine(answer, q.correct as number[]));
        if (q.geometry && q.mapRule === 'country-v1') { const located = locateInCountry(answer, q.geometry, q.toleranceKm); correct = located.correct; distance = located.distance; points = correct ? scoreAnswer(true, elapsed, limit, streak + 1) : mapAccuracyPoints(false, distance); }
        else { correct = distance < 700; points = mapScore(distance, elapsed, limit); }
    }
    else {
        correct = q.typed && typeof answer === 'string' ? matches(answer, q.aliases ?? []) : Array.isArray(q.correct) ? Array.isArray(answer) && JSON.stringify(answer) === JSON.stringify(q.correct) : answer === q.correct;
        points = scoreAnswer(correct, elapsed, limit, correct ? streak + 1 : 0);
    }
    return { correct, points, distance, responseTime: elapsed, streak: correct ? streak + 1 : 0, risk: elapsed < 200 ? 1 : 0, answerLabel: q.answerLabel, fact: q.fact, correctAnswer: q.correct, countryId: q.countryId, mode: q.mode, mapRule: q.mapRule, borderCountries: q.mode === 'borders' ? [q.countryId, q.correct] : undefined };
}
