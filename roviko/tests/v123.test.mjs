import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import fs from 'node:fs';

// 1.23: Dutch capitals, Eswatini, singular forms, warm feedback, finish headlines, share text, sound/vibration.
fs.mkdirSync('.test-runtime', { recursive: true });
await build({ stdin: { contents: "export {generateQuestions,evaluate,COUNTRIES} from './lib/game-engine/questions';export {dutchCapital} from './i18n/capitals-nl';export {plural} from './lib/plural';export {feedbackHeading,finishKey,finishMood,inARow} from './lib/feel-copy';export {editionNumber,squares,shareCard,shareResult,readChallenge,challengeExtras,rememberStanding,sharedName} from './lib/share';export {parseShareText} from './lib/share-image';export {sound,soundDefault,formatScore} from './lib/client';export {messages} from './i18n/messages';export {withSpanish} from './i18n/content';", resolveDir: process.cwd() }, bundle: true, outfile: '.test-runtime/v123.mjs', format: 'esm', platform: 'node', logLevel: 'error' });
const lib = await import('../.test-runtime/v123.mjs');
const settings = (mode, typed = false) => ({ mode, count: 5, timer: 0, difficulty: 'medium', region: 'World', typed });
const t = locale => k => lib.messages[locale][k] ?? lib.messages.en[k] ?? k;

test('capital questions use Dutch names in Dutch and accept them when typed', () => {
  const [q] = lib.generateQuestions(settings('capitals'), 'v123-nl', [], [], 'AUT');
  assert.equal(q.countryId, 'AUT');
  const vienna = q.options.find(o => o.id === 'AUT');
  assert.equal(vienna.en, 'Vienna'); assert.equal(vienna.nl, 'Wenen');
  assert.equal(q.answerLabel.nl, 'Wenen'); assert.match(q.fact.nl, /hoofdstad Wenen/);
  const [typed] = lib.generateQuestions(settings('capitals', true), 'v123-typed', [], [], 'POL');
  for (const answer of ['Warschau', 'Warsaw', 'Varsovia']) assert.equal(lib.evaluate(typed, answer, 0, 0, 0).correct, true, answer);
  const [bolivia] = lib.generateQuestions(settings('capitals', true), 'v123-bol', [], [], 'BOL');
  assert.equal(lib.evaluate(bolivia, 'La Paz', 0, 0, 0).correct, true);
  assert.equal(lib.evaluate(bolivia, 'Sucre', 0, 0, 0).correct, true);
  assert.equal(lib.dutchCapital('Nairobi'), 'Nairobi');
});

test('content saved before 1.23 also shows Dutch capitals', () => {
  const [opt, country, list, clue, fact] = lib.withSpanish([{ en: 'Vienna', nl: 'Vienna' }, { en: 'Austria', nl: 'Oostenrijk' }, { en: 'Pretoria / Cape Town / Bloemfontein', nl: 'Pretoria / Cape Town / Bloemfontein' }, { en: 'My capital is Lisbon.', nl: 'Mijn hoofdstad is Lisbon.' }, { en: 'x', nl: 'Oostenrijk: hoofdstad Vienna. 83.871 km² oppervlakte.' }]);
  assert.equal(opt.nl, 'Wenen'); assert.equal(opt.es, 'Viena'); assert.equal(country.nl, 'Oostenrijk');
  assert.equal(list.nl, 'Pretoria / Kaapstad / Bloemfontein'); assert.equal(clue.nl, 'Mijn hoofdstad is Lissabon.');
  assert.equal(fact.nl, 'Oostenrijk: hoofdstad Wenen. 83.871 km² oppervlakte.');
  const [border] = lib.withSpanish([{ en: 'Which country shares a land border with Belarus?', nl: 'Welk land heeft een landgrens met Wit-Rusland?' }]);
  assert.equal(border.nl, 'Welk land heeft een landgrens met Belarus?');
  assert.equal(lib.COUNTRIES.find(c => c.id === 'BLR').nl, 'Belarus');
});

test('Eswatini has its current name and both capitals', () => {
  const swz = lib.COUNTRIES.find(c => c.id === 'SWZ');
  assert.equal(swz.nl, 'Eswatini');
  assert.deepEqual(swz.capitals, ['Mbabane', 'Lobamba']);
  const [q] = lib.generateQuestions(settings('capitals', true), 'v123-swz', [], [], 'SWZ');
  assert.match(q.prompt.en, /Which is a capital of Eswatini/);
  for (const answer of ['Mbabane', 'Lobamba']) assert.equal(lib.evaluate(q, answer, 0, 0, 0).correct, true, answer);
});

test('singular forms in all three languages', () => {
  assert.equal(lib.plural(t('nl'), 'guestBannerTitle', 1), 'Je reeks van 1 dag staat alleen op dit apparaat');
  assert.equal(lib.plural(t('nl'), 'guestBannerTitle', 4), 'Je reeks van 4 dagen staat alleen op dit apparaat');
  assert.equal(lib.plural(t('nl'), 'rankingsPlayers', 1), '1 speler');
  assert.equal(lib.plural(t('nl'), 'competitionRank', 1, '{count}').replace('{rank}', '1'), '#1 van 1 speler');
  assert.equal(lib.plural(t('en'), 'trailUsed', 1), '1 clue used · 1 guess');
  assert.equal(lib.plural(t('es'), 'exploreResults', 1), '1 país');
  assert.equal(lib.plural(t('es'), 'exploreResults', 2), '2 países');
  assert.equal(lib.plural(t('en'), 'rankingsPlayers', 1234, '{n}', '1,234'), '1,234 players');
  // Every singular has its plural, in every language.
  for (const locale of ['en', 'nl', 'es']) for (const key of Object.keys(lib.messages[locale]).filter(k => k.endsWith('_one'))) assert.ok(lib.messages[locale][key.slice(0, -4)], locale + ' ' + key);
});

test('answer headings are warm, stable per question, with a combo and a near miss', () => {
  const en = t('en');
  const a = lib.feedbackHeading(en, { correct: true, seed: 'q1' }), b = lib.feedbackHeading(en, { correct: true, seed: 'q1' });
  assert.equal(a, b);
  assert.ok(['Correct!', 'Nice one!', 'Spot on!', 'You got it!'].includes(a));
  assert.equal(lib.feedbackHeading(t('nl'), { correct: true, seed: 'x', streak: 4 }), '4 op rij!');
  assert.equal(lib.feedbackHeading(t('nl'), { correct: false, seed: 'x', distanceKm: 240, locale: 'nl' }), 'Bijna! 240 km ernaast');
  assert.ok(!/Bijna/.test(lib.feedbackHeading(t('nl'), { correct: false, seed: 'x', distanceKm: 900 })));
  for (const locale of ['en', 'nl', 'es']) for (const k of ['fbRight1', 'fbRight2', 'fbRight3', 'fbRight4', 'fbWrong1', 'fbWrong2', 'fbWrong3', 'fbWrong4', 'fbStreak', 'fbNear', 'finishTop', 'finishStrong', 'finishTomorrow']) assert.ok(lib.messages[locale][k], locale + ' ' + k);
  assert.equal(lib.inARow([{ correct: true }, { correct: false }, { correct: true }, { correct: true }]), 2);
});

test('finish headlines follow the score (Mosaic with 0 points is no longer "Perfect!")', () => {
  assert.equal(lib.finishKey(0, false), 'finishTomorrow');
  assert.equal(lib.finishKey(0.5, false), 'finishNice');
  assert.equal(lib.finishKey(0.75, false), 'finishStrong');
  assert.equal(lib.finishKey(0.95, false), 'finishTop');
  assert.equal(lib.finishKey(0.2, true), 'finishPerfect');
  assert.equal(lib.finishMood(0.1), 'wink');
  assert.equal(lib.finishMood(0.8), 'cheer');
  const puzzle = fs.readFileSync('components/puzzles/PuzzleGame.tsx', 'utf8');
  assert.doesNotMatch(puzzle, /game\.mode === 'mosaic' \|\| correct === game\.total \? 'finishPerfect'/);
});

test('share text has an edition number, squares, points and streak, and never a solution', () => {
  assert.equal(lib.editionNumber('2026-09-25'), 1);
  assert.equal(lib.editionNumber('2026-10-06'), 12);
  assert.equal(lib.editionNumber('2026-09-01'), null);
  assert.equal(lib.editionNumber(null), null);
  assert.equal(lib.squares(Array.from({ length: 12 }, (_, i) => i % 3 !== 0)), '🟥🟩🟩🟥🟩🟩🟥🟩🟩🟥\n🟩🟩');
  const text = lib.shareCard({ label: 'Rank Radar', date: '2026-10-06', trail: '🟩🟨', score: '820/1,000 points', streak: 1, url: 'https://roviko.app/daily?shared=rank' });
  assert.equal(text, 'Roviko #12 · Rank Radar\n🟩🟨\n820/1,000 points\nhttps://roviko.app/daily?shared=rank');
});

test('a shared daily score travels in the link and opens as a challenge', () => {
  const text = lib.shareResult({ mode: 'daily', label: 'Daily Detour', date: '2026-10-06', correct: 15, total: 20, answers: [true, false], detail: '820/1,000 points', points: 820, streak: 3, origin: 'https://roviko.app' });
  assert.match(text, /https:\/\/roviko\.app\/daily\?shared=daily&s=820$/);
  assert.deepEqual(lib.readChallenge('?shared=daily&s=820'), { mode: 'daily', points: 820 });
  assert.deepEqual(lib.readChallenge('?shared=duel&s=600'), { mode: 'duel', points: 600 });
  assert.deepEqual(lib.readChallenge('?shared=day&s=4210'), { mode: 'day', points: 4210 });
  assert.equal(lib.readChallenge('?shared=day&s=7000'), null);
  for (const bad of ['?shared=daily', '?shared=daily&s=1200', '?shared=flags&s=8', '?shared=daily&s=-1', '?shared=daily&s=1e3', '?shared=<b>&s=5']) assert.equal(lib.readChallenge(bad), null, bad);
  const parsed = lib.parseShareText(text);
  assert.equal(parsed.head, 'Roviko #12'); assert.equal(parsed.game, 'Daily Detour'); assert.equal(parsed.score, '820/1,000 points'); assert.equal(parsed.streak, '3'); assert.deepEqual(parsed.rows, [['🟩', '🟥']]);
});

test('a share carries your name and place of the day, and a shared link shows it safely (1.26)', () => {
  const t = k => lib.messages.nl[k] ?? lib.messages.en[k] ?? k;
  lib.rememberStanding('day', '2026-10-08', 1, 230);
  const extras = lib.challengeExtras(t, 'nl', 'day', '2026-10-08', 'Pietje');
  assert.equal(extras.rankLine, '🏆 Pietje: nummer 1 van de wereld vandaag (230 spelers)');
  const text = lib.shareCard({ label: 'Dagtotaal', date: '2026-10-08', trail: '🟩🟨🟩🟩🟥🟩', score: '3.879/6.000 punten', streak: 5, url: 'https://roviko.app/?shared=day', points: 3879, extras });
  assert.match(text, /\nKun jij dat verslaan\?\nhttps:\/\/roviko\.app\/\?shared=day&s=3879&n=Pietje&r=1&p=230&l=nl$/);
  const parsed = lib.parseShareText(text);
  assert.equal(parsed.score, '3.879/6.000 punten'); assert.equal(parsed.streak, '5'); assert.equal(parsed.rank, 'Pietje: nummer 1 van de wereld vandaag (230 spelers)');
  assert.deepEqual(lib.readChallenge(new URL(text.split('\n').at(-1)).search), { mode: 'day', points: 3879, name: 'Pietje', place: 1, players: 230 });
  lib.rememberStanding('daily', '2026-10-08', 12, 230);
  assert.equal(lib.challengeExtras(t, 'nl', 'daily', '2026-10-08').rankLine, '🏆 #12 van 230 spelers wereldwijd vandaag');
  assert.equal(lib.challengeExtras(t, 'nl', 'rank', '2026-10-08').rankLine, undefined, 'no place known: no rank line');
  // Links are typed by anyone: rude or odd names and impossible places are dropped, the points still count.
  assert.deepEqual(lib.readChallenge('?shared=day&s=100&n=<script>&r=5&p=3'), { mode: 'day', points: 100 });
  assert.equal(lib.sharedName('Kut'), undefined); assert.equal(lib.sharedName('Kapitein Kaas'), 'Kapitein Kaas'); assert.equal(lib.sharedName('x'), undefined);
});

test('sound follows the setting everywhere; the app vibrates, the website never does', () => {
  const store = new Map();
  globalThis.localStorage = { getItem: k => store.has(k) ? store.get(k) : null, setItem: (k, v) => store.set(k, String(v)) };
  const calls = [];
  globalThis.window = {};
  assert.equal(lib.soundDefault(), 'off');
  lib.sound('correct'); // website, sound off: no audio, no vibration, no error
  globalThis.window = { Capacitor: { isNativePlatform: () => true, Plugins: { Haptics: { notification: o => { calls.push(o.type); return Promise.resolve(); }, impact: o => { calls.push(o.style); return Promise.resolve(); } } } } };
  assert.equal(lib.soundDefault(), 'on');
  store.set('rv_sound', 'off');
  lib.sound('correct'); lib.sound('incorrect'); lib.sound('win'); lib.sound('tap');
  assert.deepEqual(calls, ['SUCCESS', 'ERROR', 'HEAVY', 'LIGHT']);
  store.set('rv_haptics', 'off'); lib.sound('correct');
  assert.equal(calls.length, 4);
  for (const file of ['components/puzzles/DuelGame.tsx', 'components/puzzles/PuzzleGame.tsx', 'components/puzzles/RankGame.tsx']) assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /!muted\)?\s*sound\(/, file);
  delete globalThis.window; delete globalThis.localStorage;
});

test('numbers follow the page language, not the device', () => {
  globalThis.document = { documentElement: { lang: 'nl' } };
  assert.equal(lib.formatScore(1493), '1.493');
  globalThis.document.documentElement.lang = 'en';
  assert.equal(lib.formatScore(1493), '1,493');
  delete globalThis.document;
});
