import data from '../data/countries.json';
import { locateInCountry, type Polygons } from './geometry';
import { random, shuffle, matches, haversine, scoreAnswer, mapScore, seedHash } from './scoring';
import { GEOGRAPHY_POLICY, MODES } from '../config';
export type Country = {
    id: string;
    iso2: string;
    name: string;
    nl: string;
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
};
export type Option = {
    id: string;
    en: string;
    nl: string;
    flag?: string;
};
export type Question = {
    id: string;
    mode: string;
    countryId: string;
    prompt: {
        en: string;
        nl: string;
    };
    options: Option[];
    flag?: string;
    correct: string | string[] | number[];
    aliases?: string[];
    fact: {
        en: string;
        nl: string;
    };
    answerLabel: {
        en: string;
        nl: string;
    };
    difficulty: string;
    typed?: boolean;
    clues?: { en: string; nl: string }[];
    mapRule?: 'country-v1';
    toleranceKm?: number;
    geometry?: Polygons;
};
const familiar = ['USA', 'CAN', 'MEX', 'BRA', 'ARG', 'PER', 'CHL', 'COL', 'GBR', 'FRA', 'ESP', 'ITA', 'DEU', 'NLD', 'BEL', 'GRC', 'PRT', 'SWE', 'NOR', 'CHE', 'AUT', 'POL', 'RUS', 'CHN', 'JPN', 'IND', 'IDN', 'THA', 'KOR', 'TUR', 'SAU', 'AUS', 'NZL', 'FJI', 'EGY', 'ZAF', 'MAR', 'KEN', 'NGA', 'GHA'];
const aliases: Record<string, string[]> = { CHN: ['Peking'], UKR: ['Kiev', 'Kyiv'], MEX: ['Mexico City', 'Mexico-stad', 'Ciudad de Mexico'], CZE: ['Prague', 'Praag', 'Praha'], RUS: ['Moscow', 'Moskou', 'Moskva'], EGY: ['Cairo', 'Caïro'], ITA: ['Rome', 'Roma'], AUT: ['Vienna', 'Wenen', 'Wien'], BEL: ['Brussels', 'Brussel', 'Bruxelles'], DNK: ['Copenhagen', 'Kopenhagen'], GRC: ['Athens', 'Athene'], POL: ['Warsaw', 'Warschau'], PRT: ['Lisbon', 'Lissabon', 'Lisboa'], SWE: ['Stockholm'], HUN: ['Budapest', 'Boedapest'], ROU: ['Bucharest', 'Boekarest'], SRB: ['Belgrade', 'Belgrado'], ESP: ['Madrid'], KOR: ['Seoul'], THA: ['Bangkok', 'Krung Thep'] };
function nameOption(c: Country): Option { return { id: c.id, en: c.name, nl: c.nl, flag: c.flag }; }
function capitalOption(c: Country): Option { return { id: c.id, en: c.capitals[0], nl: c.capitals[0] }; }
export function generateQuestions(settings: Settings, seed: string, exclude: string[] = [], weak: string[] = [], focus?: string, blocked: string[] = []) {
    const rng = random(seed);
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
    let used = new Set(exclude);
    let attempts = 0;
    while (result.length < settings.count && attempts++ < settings.count * 200) {
        const i = result.length;
        const daily = seed.startsWith('daily:');
        const mode = settings.mode === 'daily' ? ['flags', 'capitals', 'pinpoint', 'borders', 'order'][i % 5] : settings.mode === 'mixed' ? MODES[Math.floor(rng() * MODES.length)] : settings.mode;
        let candidates = pool.filter(c => !(mode === 'capitals' || mode === 'trail') || (!GEOGRAPHY_POLICY.excludeSensitiveCapitalQuestions.includes(c.id) && c.capitals.length));
        if (mode === 'borders')
            candidates = candidates.filter(c => c.borders.some(id => COUNTRIES.some(n => n.id === id)) && !['PSE', 'ISR', 'RUS', 'UKR'].includes(c.id));
        if (mode === 'pinpoint')
            candidates = candidates.filter(c => c.area > 25 && !GEOGRAPHY_POLICY.puzzleSensitiveCountries.includes(c.id));
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
            q.aliases = [...c.capitals, ...(aliases[c.id] ?? [])];
            q.typed = !!settings.typed;
        }
        else if (mode === 'trail') {
            q.prompt = { en: 'Follow the trail. Which country am I?', nl: 'Volg het spoor. Welk land ben ik?' };
            const regionNL: Record<string,string> = { Europe:'Europa', Asia:'Azië', Africa:'Afrika', 'North America':'Noord-Amerika', 'South America':'Zuid-Amerika', Oceania:'Oceanië' };
            const neighbor = COUNTRIES.find(n => c.borders.includes(n.id));
            q.clues = [
                { en: 'Start your search in ' + c.region + '.', nl: 'Begin je zoektocht in ' + (regionNL[c.region] ?? c.region) + '.' },
                { en: neighbor ? 'I share a land border with ' + neighbor.name + '.' : 'I have no land borders with other countries in this atlas.', nl: neighbor ? 'Ik deel een landgrens met ' + neighbor.nl + '.' : 'Ik heb geen landgrenzen met andere landen in deze atlas.' },
                { en: 'My flag looks like this.', nl: 'Mijn vlag ziet er zo uit.' },
                { en: 'A capital city is ' + c.capitals[0] + '.', nl: 'Een hoofdstad is ' + c.capitals[0] + '.' }
            ];
            q.flag = c.iso2;
            q.options = shuffle([c, ...plausible.slice(0, 3)], rng).map(nameOption);
        }
        else if (mode === 'pinpoint') {
            q.prompt = { en: `Drop a pin in ${c.name}.`, nl: `Zet een pin in ${c.nl}.` };
            q.correct = c.latlng;
            q.fact = { en: `The target is a representative point in ${c.name}. Distance is measured to this point.`, nl: `Het doel is een representatief punt in ${c.nl}. De afstand wordt tot dit punt gemeten.` };
        }
        else if (mode === 'borders') {
            const n = shuffle(COUNTRIES.filter(x => c.borders.includes(x.id)), rng)[0];
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
export function publicQuestion(q: Question) { const { correct, aliases, fact, answerLabel, countryId, geometry, ...safe } = q; const country = COUNTRIES.find(c => c.id === countryId); return { ...safe, options: safe.options.map(o => ({ ...o, flag: q.mode === 'capitals' ? undefined : COUNTRIES.find(c => c.id === o.id)?.flag })), country: ['capitals','borders','pinpoint'].includes(q.mode) && country ? { en: country.name, nl: country.nl, flag: country.flag } : undefined, flag: q.flag ? q.id : undefined }; }
export function evaluate(q: Question, answer: unknown, elapsed: number, limit: number, streak: number) {
    let correct = false, distance: number | null = null;
    let points = 0;
    if (q.mode === 'pinpoint' && Array.isArray(answer) && answer.length === 2 && answer.every(v => typeof v === 'number' && Number.isFinite(v)) && Math.abs(answer[0]) <= 90 && Math.abs(answer[1]) <= 180) {
        distance = Math.round(haversine(answer, q.correct as number[]));
        if (q.geometry && q.mapRule === 'country-v1') { const located = locateInCountry(answer, q.geometry, q.toleranceKm); correct = located.correct; distance = located.distance; points = correct ? scoreAnswer(true, elapsed, limit, streak + 1) : Math.round(900 * Math.exp(-distance / 1000)); }
        else { correct = distance < 700; points = mapScore(distance, elapsed, limit); }
    }
    else {
        correct = q.typed && typeof answer === 'string' ? matches(answer, q.aliases ?? []) : Array.isArray(q.correct) ? Array.isArray(answer) && JSON.stringify(answer) === JSON.stringify(q.correct) : answer === q.correct;
        points = scoreAnswer(correct, elapsed, limit, correct ? streak + 1 : 0);
    }
    return { correct, points, distance, responseTime: elapsed, streak: correct ? streak + 1 : 0, risk: elapsed < 200 ? 1 : 0, answerLabel: q.answerLabel, fact: q.fact, correctAnswer: q.correct, countryId: q.countryId, mode: q.mode, mapRule: q.mapRule, borderCountries: q.mode === 'borders' ? [q.countryId, q.correct] : undefined };
}
