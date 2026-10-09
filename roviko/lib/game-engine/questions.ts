import { spanishCapital, spanishCountry } from '../../i18n/content';
import { dutchCapital } from '../../i18n/capitals-nl';
import data from '../data/countries.json';
import silhouettes from '../data/silhouettes.json';
import { locateInCountry, type Polygons } from './geometry';
import { random, shuffle, matches, haversine, scoreAnswer, mapScore, mapAccuracyPoints, seedHash, orderPlacement, partialOrderPoints, derangedStart } from './scoring';
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
    /** Survival runs (1.21): questions climb from easy to hard over the run. */
    ramp?: boolean;
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
    /** Shape Shift (1.21): the country outline as an SVG path in a 100 × 80 box. */
    shape?: string;
    mapRule?: 'country-v1';
    toleranceKm?: number;
    geometry?: Polygons;
    /** Before 1.23.1 a small pinpoint country opened zoomed in on this [south, west, north, east] box. Since then every map
     *  opens on the whole world (the box gave the region away); the field only survives in stored older games and is ignored. */
    zoom?: [number, number, number, number];
};
const familiar = ['USA', 'CAN', 'MEX', 'BRA', 'ARG', 'PER', 'CHL', 'COL', 'GBR', 'FRA', 'ESP', 'ITA', 'DEU', 'NLD', 'BEL', 'GRC', 'PRT', 'SWE', 'NOR', 'CHE', 'AUT', 'POL', 'RUS', 'CHN', 'JPN', 'IND', 'IDN', 'THA', 'KOR', 'TUR', 'SAU', 'AUS', 'NZL', 'FJI', 'EGY', 'ZAF', 'MAR', 'KEN', 'NGA', 'GHA'];
/** How recognisable a country is, 0 (very) to 2 (hardly): the familiar list first, then by size. */
const bySize = COUNTRIES.filter(c => !familiar.includes(c.id)).sort((a, b) => b.area - a.area).map(c => c.id);
export function fame(c: Country) { return familiar.includes(c.id) ? 0 : 1 + bySize.indexOf(c.id) / Math.max(1, bySize.length - 1); }
const SHAPES = silhouettes as Record<string, string>;
/** In a survival run question i of n sits at level 0 (easy) to 1 (hard): pick candidates around that fame. */
function rampWindow<T extends Country>(candidates: T[], level: number) {
    const sorted = [...candidates].sort((a, b) => fame(a) - fame(b)), size = Math.max(6, Math.round(sorted.length * .16));
    const start = Math.max(0, Math.min(sorted.length - size, Math.round(level * (sorted.length - size))));
    return sorted.slice(start, start + size);
}
/** Four countries for Size Shuffle whose areas sit far apart (easy) or close together (hard). */
function rampOrder(c: Country, pool: Country[], level: number, rng: () => number) {
    const lo = 1.12 + (1 - level) * 2.4, hi = level > .6 ? lo * 1.9 : Infinity;
    for (let tries = 0; tries < 200; tries++) {
        const list = [c, ...shuffle(pool.filter(x => x.id !== c.id), rng).slice(0, 3)].sort((a, b) => b.area - a.area);
        if (list.every((x, i) => i === 0 || (list[i - 1].area / x.area >= lo && list[i - 1].area / x.area <= hi))) return list;
    }
    return null;
}
const aliases: Record<string, string[]> = { CHN: ['Peking'], UKR: ['Kiev', 'Kyiv'], MEX: ['Mexico City', 'Mexico-stad', 'Ciudad de Mexico'], CZE: ['Prague', 'Praag', 'Praha'], RUS: ['Moscow', 'Moskou', 'Moskva'], EGY: ['Cairo', 'Caïro'], ITA: ['Rome', 'Roma'], AUT: ['Vienna', 'Wenen', 'Wien'], BEL: ['Brussels', 'Brussel', 'Bruxelles'], DNK: ['Copenhagen', 'Kopenhagen'], GRC: ['Athens', 'Athene'], POL: ['Warsaw', 'Warschau'], PRT: ['Lisbon', 'Lissabon', 'Lisboa'], SWE: ['Stockholm'], HUN: ['Budapest', 'Boedapest'], ROU: ['Bucharest', 'Boekarest'], SRB: ['Belgrade', 'Belgrado'], ESP: ['Madrid'], KOR: ['Seoul'], THA: ['Bangkok', 'Krung Thep'], BOL: ['La Paz'] };
/** Pin questions only use countries a player can realistically find and tap on a phone-sized world map:
 *  at least 3,000 km² (so Fiji, Vanuatu and Cyprus count, tiny atolls and microstates do not). The map always opens on the whole world. */
const PIN_MIN_AREA = 3000;
export function pinnable(c: Country) { return c.area >= PIN_MIN_AREA; }
/** Below this size the Daily Detour keeps a pinpoint country out of its first five questions. */
export const PIN_SMALL_AREA = 50000;
function namesOverlap(a: Country, b: Country) { return [a.name, a.nl, spanishCountry(a.name)].some((name,i) => name.toLocaleLowerCase().includes([b.name,b.nl,spanishCountry(b.name)][i].toLocaleLowerCase())); }
function nameOption(c: Country): Option { return { id: c.id, en: c.name, nl: c.nl, flag: c.flag }; }
function capitalOption(c: Country): Option { return { id: c.id, en: c.capitals[0], nl: dutchCapital(c.capitals[0]) }; }
const REGION_NL: Record<string, string> = { Europe: 'Europa', Asia: 'Azië', Africa: 'Afrika', 'North America': 'Noord-Amerika', 'South America': 'Zuid-Amerika', Oceania: 'Oceanië' };
const REGION_ES: Record<string, string> = { Europe: 'Europa', Asia: 'Asia', Africa: 'África', 'North America': 'América del Norte', 'South America': 'América del Sur', Oceania: 'Oceanía' };
/** Subregions as a clue: [English phrase, Dutch, Spanish]. */
const SUBREGION: Record<string, [string, string, string]> = {
    'Southern Asia': ['southern Asia', 'Zuid-Azië', 'el sur de Asia'], 'Middle Africa': ['central Africa', 'Centraal-Afrika', 'África central'],
    'Southeast Europe': ['southeastern Europe', 'Zuidoost-Europa', 'el sudeste de Europa'], 'Southern Europe': ['southern Europe', 'Zuid-Europa', 'el sur de Europa'],
    'Western Asia': ['western Asia', 'West-Azië', 'Asia occidental'], 'South America': ['South America', 'Zuid-Amerika', 'América del Sur'],
    Caribbean: ['the Caribbean', 'het Caribisch gebied', 'el Caribe'], 'Australia and New Zealand': ['the southwest Pacific', 'het zuidwesten van de Grote Oceaan', 'el suroeste del Pacífico'],
    'Central Europe': ['central Europe', 'Centraal-Europa', 'Europa central'], 'Eastern Africa': ['eastern Africa', 'Oost-Afrika', 'África oriental'],
    'Western Europe': ['western Europe', 'West-Europa', 'Europa occidental'], 'Western Africa': ['western Africa', 'West-Afrika', 'África occidental'],
    'Eastern Europe': ['eastern Europe', 'Oost-Europa', 'Europa oriental'], 'Central America': ['Central America', 'Midden-Amerika', 'América Central'],
    'South-Eastern Asia': ['southeastern Asia', 'Zuidoost-Azië', 'el sudeste asiático'], 'Southern Africa': ['southern Africa', 'zuidelijk Afrika', 'África austral'],
    'North America': ['northern North America', 'het noorden van Noord-Amerika', 'el norte de América del Norte'], 'Eastern Asia': ['eastern Asia', 'Oost-Azië', 'Asia oriental'],
    'Northern Europe': ['northern Europe', 'Noord-Europa', 'el norte de Europa'], 'Northern Africa': ['northern Africa', 'Noord-Afrika', 'el norte de África'],
    Melanesia: ['Melanesia, in the Pacific', 'Melanesië, in de Grote Oceaan', 'Melanesia, en el Pacífico'], Micronesia: ['Micronesia, in the Pacific', 'Micronesië, in de Grote Oceaan', 'Micronesia, en el Pacífico'],
    'Central Asia': ['central Asia', 'Centraal-Azië', 'Asia central'], Polynesia: ['Polynesia, in the Pacific', 'Polynesië, in de Grote Oceaan', 'Polinesia, en el Pacífico']
};
type Clue = { en: string; nl: string; es: string };
/** A size in two significant figures: 41,850 → 42,000. */
function roundedArea(area: number) { const step = 10 ** Math.max(0, Math.floor(Math.log10(Math.max(1, area))) - 1); return Math.round(area / step) * step; }
/**
 * Clue Trail (1.25): four clues from vague to sharp, and the order changes from question to question.
 * Clue 1 is one of the vague ones (continent, part of the world, hemispheres, size, number of neighbours),
 * clue 2 another vague one or the first letter of the capital, clue 3 a neighbour or the capital,
 * clue 4 is always the flag (the screen shows the flag image with it, and the flag is only served after clue 4).
 * The continent clue is only used when it does not rule out more than one of the four answers.
 */
export function trailClues(c: Country, options: Country[], rng: () => number): Clue[] {
    const cap = c.capitals[0], capNl = dutchCapital(cap), capEs = spanishCapital(cap);
    const neighbour = shuffle(COUNTRIES.filter(n => c.borders.includes(n.id) && !namesOverlap(n, c)), rng)[0];
    const outside = options.filter(o => o.region !== c.region).length;
    const sub = SUBREGION[c.subregion];
    const ns = c.latlng[0] >= 0, ew = c.latlng[1] >= 0;
    const size = roundedArea(c.area), n = c.borders.length;
    const vague: Clue[] = [
        ...(outside <= 1 ? [{ en: 'Start your search in ' + c.region + '.', nl: 'Begin je zoektocht in ' + (REGION_NL[c.region] ?? c.region) + '.', es: 'Empieza a buscar en ' + (REGION_ES[c.region] ?? c.region) + '.' }] : []),
        ...(sub ? [{ en: 'I lie in ' + sub[0] + '.', nl: 'Ik lig in ' + sub[1] + '.', es: 'Estoy en ' + sub[2] + '.' }] : []),
        { en: 'My centre lies ' + (ns ? 'north' : 'south') + ' of the equator and ' + (ew ? 'east' : 'west') + ' of Greenwich.', nl: 'Mijn midden ligt ten ' + (ns ? 'noorden' : 'zuiden') + ' van de evenaar en ten ' + (ew ? 'oosten' : 'westen') + ' van Greenwich.', es: 'Mi centro está al ' + (ns ? 'norte' : 'sur') + ' del ecuador y al ' + (ew ? 'este' : 'oeste') + ' de Greenwich.' },
        { en: 'My area is about ' + size.toLocaleString('en') + ' km².', nl: 'Mijn oppervlakte is ongeveer ' + size.toLocaleString('nl-NL') + ' km².', es: 'Mi superficie es de unos ' + size.toLocaleString('es-ES') + ' km².' },
        n === 0 ? { en: 'I have no land neighbours.', nl: 'Ik heb geen buurlanden over land.', es: 'No tengo vecinos por tierra.' }
            : { en: 'I have ' + n + ' land ' + (n === 1 ? 'neighbour' : 'neighbours') + '.', nl: 'Ik heb ' + n + ' ' + (n === 1 ? 'buurland' : 'buurlanden') + ' over land.', es: 'Tengo ' + n + ' ' + (n === 1 ? 'vecino' : 'vecinos') + ' por tierra.' }
    ];
    const letter: Clue = { en: 'My capital starts with the letter ' + cap.charAt(0).toUpperCase() + '.', nl: 'Mijn hoofdstad begint met de letter ' + capNl.charAt(0).toUpperCase() + '.', es: 'Mi capital empieza por la letra ' + capEs.charAt(0).toUpperCase() + '.' };
    const capital: Clue = { en: 'My capital is ' + cap + '.', nl: 'Mijn hoofdstad is ' + capNl + '.', es: 'Mi capital es ' + capEs + '.' };
    const border: Clue | null = neighbour ? { en: 'I share a land border with ' + neighbour.name + '.', nl: 'Ik deel een landgrens met ' + neighbour.nl + '.', es: 'Comparto frontera terrestre con ' + spanishCountry(neighbour.name) + '.' } : null;
    // No clue may contain the answer itself.
    const [first, ...rest] = shuffle(vague.filter(v => ![c.name, c.nl, spanishCountry(c.name)].some(name => v.en.includes(name) || v.nl.includes(name) || v.es.includes(name))), rng);
    // A capital that echoes the country's name (San Salvador, Guatemala City) would give the answer away: use the neighbour then.
    const words = (v: string) => v.toLowerCase().split(/[^a-zà-ÿ]+/).filter(w => w.length >= 4);
    const echoes = words(cap).some(w => words(c.name + ' ' + c.nl).includes(w));
    const sharp = border && (echoes || rng() < .5) ? border : capital;
    const second = shuffle([...rest, ...(sharp === capital ? [] : [letter])], rng)[0] ?? letter;
    return [first, second, sharp, { en: 'My flag looks like this.', nl: 'Mijn vlag ziet er zo uit.', es: 'Mi bandera tiene este aspecto.' }];
}
export function generateQuestions(settings: Settings, seed: string, exclude: string[] = [], weak: string[] = [], focus?: string, blocked: string[] = []) {
    const rng = random(seed);
    const enabled = shuffle(MODES.filter(m => !settings.enabledModes || settings.enabledModes.includes(m)), rng);
    if (settings.mode === 'mixed' && !enabled.length) throw new Error('Question unavailable');
    const regionPool = COUNTRIES.filter(c => settings.region === 'World' || c.region === settings.region);
    if (regionPool.length < 4)
        throw new Error('Not enough countries for these settings');
    // Difficulty (1.25 makes the three levels clearly different; medium is unchanged, so daily games stay as they were):
    // easy  = well-known countries plus the biggest others (about 60), one wrong answer from the same continent and two from elsewhere, Size Shuffle sizes
    //         at least about 2.4× apart, map targets of at least 50,000 km² (easier, but not a giveaway);
    // hard  = lesser-known countries, wrong answers from the same part of the world, sizes close together;
    // mixed = each question gets one of the three, in a shuffled rotation.
    const tierPool = (tier: string) => {
        if (tier === 'easy') { const simple = regionPool.filter(c => fame(c) < 1.12); if (simple.length >= 6) return simple; }
        if (tier === 'hard') {
            const obscure = regionPool.filter(c => !familiar.includes(c.id)), deep = obscure.filter(c => fame(c) >= 1.2);
            if (deep.length >= 12) return deep;
            if (obscure.length >= 5) return obscure;
        }
        return regionPool;
    };
    const tiers: string[] = [];
    if (settings.difficulty === 'mixed') while (tiers.length < settings.count) tiers.push(...shuffle(['easy', 'medium', 'hard'], rng));
    let pool = tierPool(settings.difficulty);
    const result: Question[] = [];
    // Daily Detour: every question type twice (ten questions since 1.32), shuffled per block of five and never the same type twice in a row.
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
        const tier = settings.ramp ? 'medium' : tiers[i] ?? settings.difficulty;
        if (tiers.length) pool = tierPool(tier);
        let candidates = pool.filter(c => !(mode === 'capitals' || mode === 'trail') || (!GEOGRAPHY_POLICY.excludeSensitiveCapitalQuestions.includes(c.id) && c.capitals.length));
        if (mode === 'capitals' || mode === 'trail') candidates = candidates.filter(c => ![...c.capitals,...c.capitals.map(spanishCapital),...c.capitals.map(dutchCapital)].some(cap => { const a = cap.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(); return [c.name,c.nl,spanishCountry(c.name)].some(n => { const b=n.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(); return b.includes(a) || a.includes(b); }); }));
        if (mode === 'borders')
            candidates = candidates.filter(c => c.borders.some(id => COUNTRIES.some(n => n.id === id && !namesOverlap(c,n))) && !['PSE', 'ISR', 'RUS', 'UKR'].includes(c.id));
        if (mode === 'pinpoint')
            candidates = candidates.filter(c => pinnable(c) && !GEOGRAPHY_POLICY.puzzleSensitiveCountries.includes(c.id) && (settings.mode !== 'daily' || i >= 5 || c.area >= PIN_SMALL_AREA));
        // The first three Detour questions are about well-known countries.
        if (settings.mode === 'daily' && i < 3) { const known = candidates.filter(c => familiar.includes(c.id)); if (known.length) candidates = known; }
        const level = settings.ramp ? i / Math.max(1, settings.count - 1) : 0;
        if (mode === 'shape') candidates = candidates.filter(c => SHAPES[c.id] && c.area >= 2000 && !GEOGRAPHY_POLICY.puzzleSensitiveCountries.includes(c.id));
        if (settings.ramp && mode !== 'order') candidates = rampWindow(candidates, level);
        if (settings.ramp && mode === 'order') candidates = candidates.filter(c => c.area >= 300);
        // Easy maps only ask for big countries; easy and hard Size Shuffle need a country that can anchor a usable list.
        if (tier === 'easy' && mode === 'pinpoint') { const big = candidates.filter(c => c.area >= PIN_SMALL_AREA); if (big.length >= 4) candidates = big; }
        if (!settings.ramp && tier !== 'medium' && mode === 'order') candidates = candidates.filter(c => c.area >= 300);
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
        const q: Question = { id, mode, countryId: c.id, prompt: { en: '', nl: '' }, options: [], correct: c.id, answerLabel: { en: c.name, nl: c.nl }, fact: { en: `${c.name} is in ${c.subregion}. ${c.capitals.length ? 'Its capital ' + (c.capitals.length > 1 ? 'cities are ' : 'is ') + c.capitals.join(' / ') + '.' : ''}`, nl: `${c.nl}: ${c.capitals.length ? 'hoofdstad' + (c.capitals.length > 1 ? 'en' : '') + ' ' + c.capitals.map(dutchCapital).join(' / ') + '. ' : ''}${c.area.toLocaleString('nl-NL')} km² oppervlakte.` }, difficulty: tiers.length ? tier : settings.difficulty };
        const others = COUNTRIES.filter(x => x.id !== c.id && x.capitals.length);
        const nearby = shuffle(others.filter(x => x.region === c.region), rng);
        const far = shuffle(others.filter(x => x.region !== c.region), rng);
        // A survival run starts with wrong options from other continents and ends with neighbours from the same subregion.
        const calm = (list: Country[]) => list.filter(x => !GEOGRAPHY_POLICY.puzzleSensitiveCountries.includes(x.id));
        const plausible = settings.ramp ? calm(level < .34 ? far : level < .67 ? shuffle(others, rng) : [...shuffle(others.filter(x => x.subregion === c.subregion), rng), ...nearby.filter(x => x.subregion !== c.subregion), ...far])
            : tier === 'easy' ? [...nearby.slice(0, 1), ...far]
            : tier === 'hard' ? [...shuffle(others.filter(x => x.subregion === c.subregion), rng), ...nearby.filter(x => x.subregion !== c.subregion), ...far]
            : [...nearby, ...far];
        if (mode === 'flags') {
            q.prompt = { en: 'Which country flies this flag?', nl: 'Bij welk land hoort deze vlag?' };
            q.flag = c.iso2;
            q.options = shuffle([c, ...plausible.slice(0, 3)], rng).map(nameOption);
        }
        else if (mode === 'capitals') {
            q.prompt = { en: `${c.capitals.length > 1 ? 'Which is a capital' : 'What is the capital'} of ${c.name}?`, nl: `${c.capitals.length > 1 ? 'Welke stad is een hoofdstad' : 'Wat is de hoofdstad'} van ${c.nl}?` };
            q.options = shuffle([c, ...plausible.filter(x => !x.capitals.some(a => c.capitals.includes(a))).filter((x, i, a) => a.findIndex(y => y.capitals[0] === x.capitals[0]) === i).slice(0, 3)], rng).map(capitalOption);
            q.answerLabel = { en: c.capitals.join(' / '), nl: c.capitals.map(dutchCapital).join(' / ') };
            q.aliases = [...c.capitals, ...c.capitals.map(spanishCapital), ...c.capitals.map(dutchCapital), ...(aliases[c.id] ?? [])];
            q.typed = !!settings.typed;
        }
        else if (mode === 'trail') {
            q.prompt = { en: 'Follow the trail. Which country am I?', nl: 'Volg het spoor. Welk land ben ik?' };
            // Wrong answers (1.25): easy keeps two from other continents, medium one, hard none (the same part of the world first).
            const sameSub = shuffle(nearby.filter(x => x.subregion === c.subregion), rng), otherSub = nearby.filter(x => x.subregion !== c.subregion);
            const wrong = tier === 'easy' ? [...nearby.slice(0, 1), ...far.slice(0, 2)] : tier === 'hard' ? [...sameSub, ...otherSub].slice(0, 3) : [...nearby.slice(0, 2), ...far.slice(0, 1)];
            const options = [c, ...wrong];
            q.clues = trailClues(c, options, rng);
            q.flag = c.iso2;
            q.options = shuffle(options, rng).map(({id,name,nl}) => ({id,en:name,nl}));
        }
        else if (mode === 'pinpoint') {
            q.prompt = { en: `Drop a pin in ${c.name}.`, nl: `Zet een pin in ${c.nl}.` };
            q.correct = c.latlng;
            q.fact = { en: `The target is a representative point in ${c.name}. Distance is measured to this point.`, nl: `Het doel is een representatief punt in ${c.nl}. De afstand wordt tot dit punt gemeten.` };
        }
        else if (mode === 'shape') {
            q.prompt = { en: 'Which country has this shape?', nl: 'Welk land heeft deze vorm?', es: '¿Qué país tiene esta forma?' };
            q.shape = SHAPES[c.id];
            q.options = shuffle([c, ...plausible.filter(x => SHAPES[x.id]).slice(0, 3)], rng).map(nameOption);
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
            // Easy lists have sizes clearly apart (about 2.4× or more), hard lists close together (the same rule as the survival climb).
            const ramped = settings.ramp ? rampOrder(c, pool.filter(x => x.area >= 300 && x.area !== c.area), level, rng)
                : tier === 'easy' || tier === 'hard' ? rampOrder(c, pool.filter(x => x.area >= 300 && x.area !== c.area), tier === 'easy' ? .45 : 1, rng) : null;
            if (settings.ramp && !ramped) continue;
            const list = ramped ?? [c, ...shuffle(pool.filter(x => x.id !== c.id && x.area !== c.area), rng).filter((x, i, a) => a.findIndex(y => y.area === x.area) === i).slice(0, 3)];
            // Since 1.23.1 no country starts in its right place: confirming the list untouched earns nothing (multiplayer gives partial points).
            q.options = derangedStart([...list].sort((a, b) => b.area - a.area), rng).map(nameOption);
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
export function publicQuestion(q: Question, reveal = false) { const { correct, aliases, fact, answerLabel, countryId, geometry, zoom: _zoom, ...safe } = q; const country = COUNTRIES.find(c => c.id === countryId); return { ...safe, options: safe.options.map(o => ({ ...o, flag: !reveal && ['capitals','flags','trail'].includes(q.mode) ? undefined : COUNTRIES.find(c => c.id === o.id)?.flag })), country: ['capitals','borders','pinpoint'].includes(q.mode) && country ? { en: country.name, nl: country.nl, flag: country.flag } : undefined, flag: q.flag ? q.id : undefined }; }
export function evaluate(q: Question, answer: unknown, elapsed: number, limit: number, streak: number) {
    let correct = false, distance: number | null = null, orderRight: number | undefined;
    let points = 0;
    if (q.mode === 'pinpoint' && Array.isArray(answer) && answer.length === 2 && answer.every(v => typeof v === 'number' && Number.isFinite(v)) && Math.abs(answer[0]) <= 90 && Math.abs(answer[1]) <= 180) {
        distance = Math.round(haversine(answer, q.correct as number[]));
        if (q.geometry && q.mapRule === 'country-v1') { const located = locateInCountry(answer, q.geometry, q.toleranceKm); correct = located.correct; distance = located.distance; points = correct ? scoreAnswer(true, elapsed, limit, streak + 1) : mapAccuracyPoints(false, distance); }
        else { correct = distance < 700; points = mapScore(distance, elapsed, limit); }
    }
    else {
        correct = q.typed && typeof answer === 'string' ? matches(answer, q.aliases ?? []) : Array.isArray(q.correct) ? Array.isArray(answer) && JSON.stringify(answer) === JSON.stringify(q.correct) : answer === q.correct;
        points = scoreAnswer(correct, elapsed, limit, correct ? streak + 1 : 0);
        // Multiplayer Size Shuffle: a partly right list earns its share of the points (never the streak bonus).
        if (q.mode === 'order' && !correct) { orderRight = orderPlacement(answer, q.correct); points = partialOrderPoints(orderRight, (q.correct as string[]).length, elapsed, limit); }
        else if (q.mode === 'order') orderRight = (q.correct as string[]).length;
    }
    return { correct, points, ...(orderRight !== undefined ? { orderRight } : {}), distance, responseTime: elapsed, streak: correct ? streak + 1 : 0, risk: elapsed < 200 ? 1 : 0, answerLabel: q.answerLabel, fact: q.fact, correctAnswer: q.correct, countryId: q.countryId, mode: q.mode, mapRule: q.mapRule, borderCountries: q.mode === 'borders' ? [q.countryId, q.correct] : undefined };
}
