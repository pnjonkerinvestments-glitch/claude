import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { build } from 'esbuild';
fs.mkdirSync('.test-runtime', { recursive: true });
await build({ stdin: { contents: "export * from './lib/how-to-play';export {messages} from './i18n/messages';export {MODES} from './lib/config';export {DAILY_MODES} from './lib/daily-loop';export {HowToSteps,HowToPlayPage,howToTitle} from './components/atelier/HowToPlay';", resolveDir: process.cwd() }, outfile: '.test-runtime/how-to-play.mjs', bundle: true, format: 'esm', platform: 'node', jsx: 'automatic', external: ['react', 'react/*', 'react-dom', 'react-dom/*', 'lucide-react', 'radix-ui'], logLevel: 'error' });
const { HOW_TO_EXAMPLES, HOW_TO_PLAY, HOW_TO_PLAY_ORDER, HOW_TO_PLAY_GROUPS, HOW_TO_PLAY_TITLE, messages, MODES, DAILY_MODES, HowToSteps, HowToPlayPage, howToTitle } = await import('../.test-runtime/how-to-play.mjs');
const { renderToStaticMarkup } = await import('react-dom/server');
const { createElement } = await import('react');

test('every game mode has a how-to-play guide', () => {
  for (const mode of [...DAILY_MODES, ...MODES, 'duel', 'mystery', 'room']) assert.ok(HOW_TO_PLAY[mode], 'missing guide for ' + mode);
  assert.deepEqual([...HOW_TO_PLAY_ORDER].sort(), Object.keys(HOW_TO_PLAY).sort());
  assert.equal(new Set(HOW_TO_PLAY_ORDER).size, HOW_TO_PLAY_ORDER.length);
  assert.deepEqual(HOW_TO_PLAY_GROUPS[0].modes, ['daily', ...DAILY_MODES]);
});

test('guides are three short steps plus a tip, in English and Dutch', () => {
  for (const [mode, guide] of Object.entries(HOW_TO_PLAY)) {
    assert.equal(guide.steps.length, 3, mode);
    for (const text of [...guide.steps.map(s => s.text), guide.tip]) for (const locale of ['en', 'nl']) {
      assert.ok(text[locale]?.trim(), `${mode} ${locale} empty`);
      assert.ok(text[locale].length <= 160, `${mode} ${locale} too long for young players: ${text[locale]}`);
    }
  }
});

test('game names and interface text exist in both languages', () => {
  const t = locale => key => messages[locale][key] ?? key;
  for (const locale of ['en', 'nl']) {
    for (const mode of HOW_TO_PLAY_ORDER) { const key = HOW_TO_PLAY_TITLE[mode] ?? mode; assert.ok(messages[locale][key], `${locale} title ${key}`); }
    for (const g of HOW_TO_PLAY_GROUPS) { assert.ok(messages[locale][g.key]); assert.ok(messages[locale][g.note]); }
    for (const key of ['howTo', 'howToTitle', 'howToOpen', 'howToGotIt', 'howToPageTitle', 'howToPageIntro', 'howToHomeLink', 'tilePracticeRank', 'tilePracticeDaily', 'tilePracticeMosaic']) assert.ok(messages[locale][key], `${locale} ${key}`);
  }
  assert.equal(howToTitle('rank', t('nl')), 'Zo speel je Rank Radar');
  assert.equal(howToTitle('room', t('en')), 'How playing together works');
});

test('the overview offers every game as a tab and explains the chosen one in full', () => {
  const t = key => messages.nl[key] ?? key;
  const html = renderToStaticMarkup(createElement(HowToPlayPage, { t, locale: 'nl', onPlay() {} }));
  assert.equal((html.match(/role="tab"/g) || []).length, HOW_TO_PLAY_ORDER.length);
  assert.equal((html.match(/aria-selected="true"/g) || []).length, 1);
  assert.equal((html.match(/role="tabpanel"/g) || []).length, 1);
  assert.ok(html.includes('Kies een spel'));
  assert.ok(html.includes('Speel Dagelijkse Omweg'));
  for (const step of HOW_TO_PLAY.daily.steps) assert.ok(html.includes(step.text.nl));
  assert.ok(html.includes(HOW_TO_PLAY.daily.tip.nl));
  assert.ok(html.includes(messages.nl.competitionDaily));
  const steps = renderToStaticMarkup(createElement(HowToSteps, { mode: 'duel', t, locale: 'en' }));
  assert.equal((steps.match(/<li>/g) || []).length, 3);
});

test('every game has a worked example in English, Dutch and Spanish, shown on the page', () => {
  for (const mode of HOW_TO_PLAY_ORDER) for (const lang of ['en', 'nl', 'es']) assert.ok(HOW_TO_EXAMPLES[mode]?.[lang]?.length > 20, mode + ' ' + lang);
  const t = key => messages.en[key] ?? key;
  const html = renderToStaticMarkup(createElement(HowToPlayPage, { t, locale: 'en', onPlay() {} }));
  assert.ok(html.includes('Example'));
  assert.ok(html.includes(HOW_TO_EXAMPLES.daily.en.slice(0, 30)));
});
