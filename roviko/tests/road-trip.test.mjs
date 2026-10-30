import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { build } from 'esbuild';
fs.mkdirSync('.test-runtime', { recursive: true });
await build({ stdin: { contents: "export * from './lib/puzzles/road-trip'; export * from './lib/puzzles/road-trip-points';", resolveDir: process.cwd() }, outfile: '.test-runtime/road-trip.mjs', bundle: true, format: 'esm', platform: 'node', logLevel: 'error' });
const x = await import('../.test-runtime/road-trip.mjs');
const date = i => new Date(Date.parse('2026-10-31T00:00:00Z') + i * 86400000).toISOString().slice(0, 10);

test('Daily Road Trip: the next 365 trips all meet every rule', () => {
  const seen = new Map(), regions = new Map();
  let traps = 0;
  for (let i = 0; i < 365; i++) {
    const d = date(i), trip = x.roadTripFor(d);
    assert.deepEqual(x.roadTripFor(d), trip, 'the same date always gives the same trip');
    assert.deepEqual(x.tripProblems(trip.start, trip.finish, x.lengthFor(d)), [], d + ' breaks a rule');
    assert.equal(trip.shortest, x.lengthFor(d));
    // Monday to Wednesday 3, Thursday to Saturday 4, Sunday 5 countries in between.
    assert.equal(trip.shortest, [5, 3, 3, 3, 4, 4, 4][new Date(d + 'T00:00:00Z').getUTCDay()], d);
    // Same landmass: there is a road at all; no country over 3 million km² on any shortest route.
    for (const id of x.onShortestRoutes(trip.start, trip.finish)) assert.ok(x.COUNTRIES.find(c => c.id === id).area <= 3_000_000, d + ' ' + id);
    const key = [trip.start, trip.finish].sort().join('|');
    if (seen.has(key)) assert.ok(i - seen.get(key) >= 60, d + ': ' + key + ' again after ' + (i - seen.get(key)) + ' days');
    seen.set(key, i);
    regions.set(x.regionOfTrip(d), (regions.get(x.regionOfTrip(d)) ?? 0) + 1);
    if (x.hasTrap(trip.start, trip.finish)) traps++;
  }
  // The regions take turns: never the same region three days running, and all four show up.
  for (let i = 2; i < 365; i++) assert.ok(!(x.regionOfTrip(date(i)) === x.regionOfTrip(date(i - 1)) && x.regionOfTrip(date(i)) === x.regionOfTrip(date(i - 2))), date(i));
  assert.deepEqual([...regions.keys()].sort(), ['Africa', 'Americas', 'Asia', 'Europe']);
  assert.ok(traps > 365 * .7, 'most trips have a trap: ' + traps);
});

test('Daily Road Trip: the neighbour graph is land only, plus the Channel Tunnel and the Øresund Bridge', () => {
  assert.ok(x.neighboursOf('GBR').includes('FRA') && x.neighboursOf('FRA').includes('GBR'), 'Channel Tunnel');
  assert.ok(x.neighboursOf('DNK').includes('SWE') && x.neighboursOf('SWE').includes('DNK'), 'Øresund Bridge');
  assert.ok(!x.neighboursOf('FRA').includes('BRA') && !x.neighboursOf('FRA').includes('SUR'), 'French Guiana is not a border');
  for (const c of x.COUNTRIES) for (const n of x.neighboursOf(c.id)) assert.ok(x.neighboursOf(n).includes(c.id), c.id + '–' + n + ' both ways');
  assert.equal(x.distancesTo('AUS').get('NZL'), undefined, 'no road across the sea');
});

test('Daily Road Trip fixtures: Nigeria → Kenya and Ghana → Kenya', () => {
  const k = x.distancesTo('KEN');
  assert.equal(k.get('NGA') - 1, 3, 'Nigeria → Kenya: shortest route 3');
  assert.ok(k.get('COD') >= k.get('CAF'), 'from the Central African Republic, DR Congo is a detour');
  assert.ok(x.neighboursOf('CAF').includes('COD'));
  assert.equal(k.get('GHA') - 1, 5, 'Ghana → Kenya: shortest route 5');
  for (const [a, b] of [['GHA', 'BFA'], ['BFA', 'NER'], ['NER', 'TCD'], ['TCD', 'SDN'], ['SDN', 'ETH'], ['ETH', 'KEN']]) { assert.ok(x.neighboursOf(a).includes(b), a + '–' + b); assert.equal(k.get(b), k.get(a) - 1, b + ' is closer'); }
  assert.ok(k.get('TGO') >= k.get('GHA'), 'from Ghana, Togo is a detour');
  assert.deepEqual(x.tripProblems('NGA', 'KEN', 3), []);
  assert.deepEqual(x.tripProblems('GHA', 'KEN', 5), []);
  assert.ok(x.tripProblems('PER', 'URY').length, 'Brazil (over 3 million km²) gives that route away');
  assert.equal(x.shortestRoute('NGA', 'KEN').length, 5);
});

test('Daily Road Trip points: 1,000 − 150 per detour − 200 per peek, at least 100', () => {
  assert.equal(x.roadTripPoints(0, 0), 1000);
  assert.equal(x.roadTripPoints(1, 0), 850);
  assert.equal(x.roadTripPoints(1, 1), 650);
  assert.equal(x.roadTripPoints(10, 5), 100);
  assert.ok(x.factFor('KEN', '2026-11-01')?.en, 'a fact for every stop');
  for (const c of x.COUNTRIES) if (x.neighboursOf(c.id).length) assert.ok(x.factFor(c.id, '2026-11-01'), c.id + ' has a fact');
  const f = x.frameOf('NGA', 'KEN');
  assert.ok(f[0] < 3 && f[2] > 42 && f[1] < -2 && f[3] > 14, 'the frame holds the whole trip: ' + f);
});
