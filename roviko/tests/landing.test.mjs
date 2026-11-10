// 1.61: the landing pages people find in a search engine (lib/landing.ts, lib/landing-copy.ts).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { build } from 'esbuild';
fs.mkdirSync('.test-runtime', { recursive: true });
await build({ stdin: { contents: "export * from './lib/landing'; export * from './lib/landing-copy'; export * from './lib/landing-count';", resolveDir: process.cwd() }, outfile: '.test-runtime/landing.mjs', bundle: true, format: 'esm', platform: 'node', logLevel: 'silent' });
const x = await import('../.test-runtime/landing.mjs');
const countries = JSON.parse(fs.readFileSync('lib/data/countries.json', 'utf8'));

test('landing pages: every quiz for every part of the world, with its own address per language', () => {
  assert.equal(x.LANDINGS.length, 28);
  for (const lang of x.LANGS) assert.equal(new Set(x.LANDINGS.map(l => l.slug[lang])).size, 28, 'unique addresses in ' + lang);
  // The addresses that existed before 1.61 stay.
  for (const old of ['world-geography-quiz', 'flags-quiz', 'capitals-quiz', 'country-map-quiz', 'europe-geography-quiz', 'africa-geography-quiz']) assert.ok(x.landingById(old), old);
  assert.equal(x.landingPath(x.landingFor('flags', 'Europe'), 'nl'), '/nl/vlaggen-europa-quiz');
  assert.equal(x.landingPath(x.landingFor('pinpoint', 'World'), 'nl'), '/nl/topografie-quiz');
  assert.equal(x.landingPath(x.landingFor('capitals', 'Africa'), 'es'), '/es/quiz-de-capitales-de-africa');
  for (const l of x.LANDINGS) for (const lang of x.LANGS) assert.match(l.slug[lang], /^[a-z-]+$/);
});

test('landing pages: an address is read back to its language and the app path', () => {
  assert.deepEqual(x.readLocalePath('/nl/vlaggen-europa-quiz'), { lang: 'nl', path: '/europe-flags-quiz', known: true });
  assert.deepEqual(x.readLocalePath('/es'), { lang: 'es', path: '/', known: true });
  assert.deepEqual(x.readLocalePath('/nl/daily'), { lang: 'nl', path: '/daily', known: true });
  assert.deepEqual(x.readLocalePath('/daily'), { lang: null, path: '/daily', known: true });
  assert.equal(x.readLocalePath('/nl/profile').known, false);
  assert.equal(x.readLocalePath('/nl/flags-quiz').known, false);
  for (const l of x.LANDINGS) for (const lang of ['nl', 'es']) assert.equal(x.readLocalePath(x.landingPath(l, lang)).path, '/' + l.id);
  assert.deepEqual(x.alternatesFor('/'), { en: '/', nl: '/nl', es: '/es' });
  assert.equal(x.alternatesFor('/profile'), null);
  assert.equal(x.sitemapEntries().length, 1 + x.LOCAL_PAGES.length + 28);
});

test('landing pages: titles and texts are complete in three languages and use the real number of countries', () => {
  for (const region of x.LANDING_REGIONS) assert.equal(x.COUNTRY_COUNT[region], countries.filter(c => region === 'World' || c.region === region).length, region);
  const titles = new Set();
  for (const l of x.LANDINGS) for (const lang of x.LANGS) {
    const c = x.landingCopy(l, lang, x.COUNTRY_COUNT[l.region]), all = JSON.stringify(c);
    assert.doesNotMatch(all, /\{(of|region|n)\}/, l.id + ' ' + lang);
    assert.ok(c.title.endsWith(' | Roviko') && c.title.length <= 75, c.title);
    assert.ok(c.description.length >= 80 && c.description.length <= 170, c.description.length + ' ' + c.description);
    assert.equal(c.faq.length, 4); assert.equal(c.how.length, 3);
    titles.add(lang + c.title);
  }
  assert.equal(titles.size, 84);
  for (const lang of x.LANGS) for (const page of ['', ...x.LOCAL_PAGES]) assert.ok(x.PAGE_META[lang][page]?.title && x.PAGE_META[lang][page]?.description, lang + ' ' + page);
  // House rule: texts never count the games ("six").
  assert.doesNotMatch(JSON.stringify(x.PAGE_META) + JSON.stringify(x.LANDINGS.map(l => x.LANGS.map(g => x.landingCopy(l, g, 1)))), /\b(six|zes|seis)\b/i);
});
