import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { build } from 'esbuild';
fs.mkdirSync('.test-runtime', { recursive: true });
await build({ stdin: { contents: "export * from './lib/puzzles/generate'; export * from './lib/puzzles/model'; export * from './lib/puzzles/topics'; export * from './lib/puzzles/country-facts';", resolveDir: process.cwd() }, outfile: '.test-runtime/puzzles.mjs', bundle: true, format: 'esm', platform: 'node' });
const { TOPICS, generateComparisons, generateMosaic, dailyTopic, checkMosaic, selectMosaicTile, mosaicHint, formatMetric, numericCountryFact, factCoverage, refreshMosaicFacts } = await import('../.test-runtime/puzzles.mjs');

test('all 14 topics generate ten reproducible, unambiguous comparisons from dated sources', () => {
  assert.equal(TOPICS.length, 14);
  for (const topic of TOPICS) {
    const rounds = generateComparisons(topic.id, 'comparison-validation');
    assert.deepEqual(rounds, generateComparisons(topic.id, 'comparison-validation'));
    assert.equal(rounds.length, 10);
    assert.equal(new Set(rounds.map(q => q.countries.map(c => c.id).sort().join(':'))).size, 10);
    for (const q of rounds) {
      assert.equal(q.correct, [...q.countries].sort((a, b) => b.value - a.value)[0].id);
      assert.notEqual(formatMetric(q.countries[0].value, topic.unit, 'en'), formatMetric(q.countries[1].value, topic.unit, 'en'));
      assert.ok(q.countries.every(c => Number.isFinite(c.value) && c.name.en && c.name.nl && fs.existsSync('public' + c.flag)));
      assert.equal(q.referenceYear, ['area','borders','equator','north'].includes(topic.id) ? null : 2023);
      assert.ok(q.sourceUrl.startsWith('https://data.worldbank.org/indicator/') || q.sourceUrl === '/sources');
    }
  }
  assert.throws(() => generateComparisons('invented-topic', 'x'));
});

test('UTC rotation visits every topic in a cycle and the next day has a fresh puzzle', () => {
  const firstDay = Math.floor(Date.parse('2026-09-09T00:00:00Z') / 86400000 / 14) * 14;
  const dates = Array.from({ length: 14 }, (_, i) => new Date((firstDay + i) * 86400000).toISOString().slice(0,10));
  assert.equal(new Set(dates.map(d => dailyTopic(d).id)).size, 14);
  assert.deepEqual(dailyTopic(dates[0]), dailyTopic(dates[0]));
  assert.notDeepEqual(generateComparisons(dailyTopic(dates[0]).id, dates[0]), generateComparisons(dailyTopic(dates[1]).id, dates[1]));
});

test('12-, 16- and 20-tile mosaics have exactly four complete, distinct country groups', () => {
  for (const size of [3,4,5]) for (let seed = 0; seed < 40; seed++) {
    const b = generateMosaic(size, 'mosaic:' + seed);
    assert.deepEqual(b, generateMosaic(size, 'mosaic:' + seed));
    assert.equal(b.tiles.length, size * 4);
    assert.equal(new Set(b.tiles.map(t => t.id)).size, size * 4);
    assert.equal(new Set(b.countries.map(c => c.id)).size, 4);
    const facts = b.tiles.filter(t => t.kind === 'fact');
    assert.equal(new Set(facts.map(t => t.text.en)).size, facts.length);
    for (const country of b.countries) {
      const group = b.tiles.filter(t => t.countryId === country.id);
      assert.equal(group.length, size);
      assert.equal(new Set(group.map(t => t.kind)).size, size);
      assert.ok(group.find(t => t.kind === 'shape').path.startsWith('M'));
      assert.ok(!group.find(t => t.kind === 'shape').path.includes('NaN'));
      assert.equal(checkMosaic(b, [], group.map(t => t.id)).correct, true);
      assert.equal(checkMosaic(b, [country.id], group.map(t => t.id)).valid, false);
    }
  }
});

test('matching rejects duplicate and unknown tiles, and identifies a near match without consuming a life', () => {
  const b = generateMosaic(4, 'validation');
  const first = b.tiles.filter(t => t.countryId === b.countries[0].id).map(t => t.id);
  const other = b.tiles.find(t => t.countryId !== b.countries[0].id).id;
  assert.equal(checkMosaic(b, [], [first[0], first[0], first[1], first[2]]).valid, false);
  assert.equal(checkMosaic(b, [], ['unknown', ...first.slice(1)]).valid, false);
  const close = checkMosaic(b, [], [...first.slice(0,3), other]);
  assert.equal(close.valid, true); assert.equal(close.correct, false); assert.equal(close.closest, 3);
  assert.equal(checkMosaic(b, [], first).correct, true);
});

test('statistical snapshots retain indicator attribution, licences and real reference years', () => {
  const source = JSON.parse(fs.readFileSync('lib/data/comparisons.json'));
  assert.equal(Object.keys(source.topics).length, 10);
  assert.equal(source.reference_year, 2023);
  assert.equal(fs.readFileSync('lib/data/comparisons.json','utf8'), fs.readFileSync('public/data/comparisons.json','utf8'));
  for (const t of Object.values(source.topics)) {
    assert.ok(Object.keys(t.values).length >= 160);
    assert.equal(t.license, 'CC BY-4.0'); assert.ok(t.provider); assert.equal(t.reference_year, 2023);
    assert.equal(t.license_metadata_url, 'https://data.worldbank.org/indicator/' + t.indicator);
  }
  assert.equal(Object.keys(JSON.parse(fs.readFileSync('public/data/silhouettes.json'))).length, 195);
});


test('comparisons carry left to right exactly once and retire the old baseline', () => {
  for (const topic of TOPICS) {
    const q = generateComparisons(topic.id, 'rolling');
    assert.equal(new Set(q.flatMap(q => q.countries.map(c => c.id))).size, 11);
    for (let i = 1; i < q.length; i++) {
      assert.equal(q[i].countries[1].id, q[i - 1].countries[0].id);
      assert.equal(q[i].carried, true);
      assert.ok(!q.slice(0,i).flatMap(q => q.countries.map(c => c.id)).includes(q[i].countries[0].id));
    }
    const tail = generateComparisons(topic.id, 'legacy', 3, q[0].countries[0].id, q.slice(0,3).flatMap(q => q.countries.map(c => c.id)));
    assert.equal(tail[0].countries[1].id, q[0].countries[0].id);
  }
});
test('Mosaic full selections accept same-type replacements, toggles, and progressive hints', () => {
  for (const size of [3,4,5]) {
    const board = generateMosaic(size, 'selection');
    const group = board.tiles.filter(t => t.countryId === board.countries[0].id);
    let selected = group.reduce((ids,t) => selectMosaicTile(board, [], ids, t.id), []);
    const replacement = board.tiles.find(t => t.kind === group[0].kind && t.countryId !== group[0].countryId);
    selected = selectMosaicTile(board, [], selected, replacement.id);
    assert.equal(selected.length, size); assert.ok(selected.includes(replacement.id)); assert.ok(!selected.includes(group[0].id));
    selected = selectMosaicTile(board, [], selected, replacement.id); assert.equal(selected.length, size-1);
    assert.deepEqual(selectMosaicTile(board, [replacement.countryId], selected, replacement.id), selected);
    assert.deepEqual(selectMosaicTile(board, [], selected, 'missing'), selected);
    let hint = mosaicHint(board, [], []); assert.equal(hint.length, 2);
    while(hint.length < size) { const old = hint; hint = mosaicHint(board, [], hint); assert.equal(hint.length, old.length+1); }
    assert.equal(checkMosaic(board, [], hint).correct, true);
  }
});


test('numeric facts cover all 195 countries, change subject every UTC day and retain observation years',()=>{
 const coverage=factCoverage();assert.equal(Object.keys(coverage).length,195);
 for(const [id,subjects] of Object.entries(coverage)){
  assert.ok(subjects.length>=2,id+' needs daily variety');
  let previous;
  for(let i=0;i<32;i++){
   const date=new Date(Date.UTC(2026,8,1+i)).toISOString().slice(0,10),f=numericCountryFact(id,date);
   assert.deepEqual(f,numericCountryFact(id,date));assert.ok(f.fact.stat.rawValue>0);
   assert.notEqual(f.fact.category,previous,id+' must rotate');previous=f.fact.category;
   assert.doesNotMatch(f.text.en,/Find me in|capital|continent/i);
   assert.ok(f.fact.source.license && f.fact.source.url);assert.ok(f.fact.stat.reference.en);
   if(['age','population','life','income','economy','forest','farmland','internet','births','exports','urban'].includes(f.fact.category))assert.ok(f.fact.stat.referenceYear>=2023);
  }
 }
 const raw=fs.readFileSync('lib/data/country-metrics.json','utf8');assert.equal(raw,fs.readFileSync('public/data/country-metrics.json','utf8'));
 const archive=JSON.parse(raw);assert.ok(!archive.records.NLD.highest);assert.equal(archive.records.DEU.highest.value,2962);
 assert.ok(fs.readFileSync('public/licenses/factbook-CC0.txt','utf8').includes('CC0'));
});

test('legacy Mosaic hints upgrade without replacing tile IDs, order, or solved country matches',()=>{
 const b=generateMosaic(4,'saved-daily',undefined,'2026-09-20');
 const old=structuredClone(b);delete old.factEdition;delete old.factDate;
 for(const tile of old.tiles)if(tile.kind==='fact'){tile.text={en:'Find me in Europe',nl:'Zoek mij in Europa'};delete tile.fact;}
 const upgraded=refreshMosaicFacts(old,'2026-09-20');
 assert.deepEqual(upgraded.tiles.map(t=>[t.id,t.kind,t.countryId]),old.tiles.map(t=>[t.id,t.kind,t.countryId]));
 assert.deepEqual(upgraded,b);assert.equal(refreshMosaicFacts(upgraded,'2026-09-21'),upgraded);
 assert.ok(old.tiles.some(t=>t.text?.en==='Find me in Europe'),'Do not mutate saved evidence');
});
