import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { build } from 'esbuild';
fs.mkdirSync('.test-runtime', { recursive: true });
await build({ stdin: { contents: "export * from './lib/puzzles/crossroads';", resolveDir: process.cwd() }, outfile: '.test-runtime/crossroads.mjs', bundle: true, format: 'esm', platform: 'node', logLevel: 'error' });
const x = await import('../.test-runtime/crossroads.mjs');

// The owner's fixed grid (1.55).
const FIXTURE = { rows: ['continent:Europe', 'continent:Africa', 'continent:South America'], cols: ['landlocked', 'capital:B', 'popOver:50'] };
const cell = (row, col) => row * 3 + col;

test('Daily Crossroads: the next 365 grids all meet every rule', () => {
  const kinds = new Set(), shapes = new Set(), seen = new Map();
  for (let i = 0; i < 365; i++) {
    const date = new Date(Date.parse('2026-10-31T00:00:00Z') + i * 86400000).toISOString().slice(0, 10);
    const grid = x.crossroadsFor(date);
    assert.deepEqual(x.crossroadsFor(date), grid, 'the same date always gives the same grid');
    assert.deepEqual(x.gridProblems(grid), [], date + ' breaks a rule');
    const cells = grid.rows.flatMap(r => grid.cols.map(c => x.answersFor(r, c)));
    assert.ok(cells.every(list => list.length >= x.MIN_ANSWERS), date + ': every square has at least four answers');
    const solution = x.solveGrid(cells);
    assert.ok(solution && new Set(solution).size === 9, date + ': a full solution with nine different countries');
    assert.deepEqual(x.tooClose(grid), [], date + ': no country within 3% of a number line it crosses');
    for (const id of [...grid.rows, ...grid.cols]) kinds.add(id.split(':')[0]);
    shapes.add(grid.rows.filter(r => r.startsWith('continent')).length + grid.cols.filter(c => c.startsWith('continent')).length);
    const key = [...grid.rows, ...grid.cols].sort().join('|');
    for (const [day, other] of seen) if (other === key) assert.ok(i - day > 7, date + ': the same six categories came back within a week');
    seen.set(i, key);
  }
  assert.ok(shapes.size >= 3, 'not every day three continents: ' + [...shapes]);
  assert.ok(['continent', 'region', 'landlocked', 'island', 'capital', 'popOver', 'areaOver', 'areaUnder', 'neighbours'].every(k => kinds.has(k)), 'all kinds of category appear: ' + [...kinds]);
  assert.ok(new Set(seen.values()).size > 300, 'grids differ from day to day: ' + new Set(seen.values()).size);
});

test('Daily Crossroads: the fixed grid takes the owner\'s solution and rejects the traps', () => {
  const solution = [['LIE', 'BEL', 'FRA'], ['TCD', 'GMB', 'NGA'], ['PRY', 'ARG', 'BRA']];
  solution.forEach((row, r) => row.forEach((id, c) => assert.equal(x.judge(FIXTURE, cell(r, c), id).ok, true, id + ' fits')));
  const wrong = (r, c, id) => { const v = x.judge(FIXTURE, cell(r, c), id); assert.equal(v.ok, false, id + ' must not fit'); return v.reason; };
  assert.equal(wrong(0, 2, 'ESP').key, 'xrPopClose', 'Spain: "So close", about 49 million');
  assert.equal(wrong(0, 2, 'ESP').value, 49);
  assert.equal(wrong(1, 1, 'BDI').key, 'xrBurundi', 'Burundi moved its capital to Gitega');
  assert.equal(wrong(0, 1, 'BGR').value, 'Sofia');
  assert.equal(wrong(0, 1, 'BLR').value, 'Minsk');
  assert.equal(wrong(2, 0, 'BRA').key, 'xrCoast', 'Brazil is not landlocked');
  assert.equal(wrong(2, 2, 'ARG').key, 'xrPopClose', 'Argentina, about 46 million: so close');
  assert.equal(wrong(1, 2, 'GHA').key, 'xrPop', 'Ghana is far below 50 million');
  assert.equal(wrong(1, 0, 'ESP').key, 'xrContinent');
  // The generator would never pick this grid on its own: Spain sits within 3% of 50 million and crosses "In Europe",
  // and South America has only three capitals on B (Buenos Aires, Brasília, Bogotá).
  assert.ok(x.tooClose(FIXTURE).some(p => p.startsWith('Spain')));
  assert.ok(x.gridProblems(FIXTURE).some(p => p.includes('3 answers')));
});

test('Daily Crossroads: names and short forms find the right country; unknown names find none', () => {
  for (const [text, id] of [['UK', 'GBR'], ['united kingdom', 'GBR'], ['Czech Republic', 'CZE'], ['Czechia', 'CZE'], ['Tsjechië', 'CZE'], ['DRC', 'COD'], ['Holland', 'NLD'], ['Nederland', 'NLD'], ['Türkiye', 'TUR'], ['Turkey', 'TUR'], ['turkije', 'TUR'], ['Ivory Coast', 'CIV'], ["Côte d'Ivoire", 'CIV'], ['USA', 'USA'], ['Alemania', 'DEU'], ['Duitsland', 'DEU'], ['Burma', 'MMR'], ['Swaziland', 'SWZ']])
    assert.equal(x.resolveCountry(text), id, text);
  for (const text of ['', 'Atlantis', 'England', 'Wakanda']) assert.equal(x.resolveCountry(text), null, text);
});

test('Daily Crossroads: points are 100 per square plus 100 for a full grid; rarity never counts', () => {
  assert.equal(x.crossroadsPoints(9), 1000);
  assert.equal(x.crossroadsPoints(6), 600);
  assert.equal(x.crossroadsPoints(0), 0);
  assert.equal(x.pickShare(5, 19), null, 'fewer than 20 players: Early pick');
  assert.equal(x.pickShare(31, 100), 31);
  assert.equal(x.isRare(x.pickShare(2, 100)), true);
  assert.equal(x.isRare(x.pickShare(6, 100)), false);
});
