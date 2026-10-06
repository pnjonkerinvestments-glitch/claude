import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// 1.23: a guard on every data import. Facts in the games come from these files; values outside what is
// physically or statistically possible, or a sudden drop in coverage, must stop a release before players see them.
const comparisons = JSON.parse(fs.readFileSync('lib/data/comparisons.json', 'utf8'));
const countries = JSON.parse(fs.readFileSync('lib/data/countries.json', 'utf8'));
const RANGES = { population: [5e3, 2e9], life: [40, 90], births: [0.7, 8], urban: [0, 100], forest: [0, 100], farmland: [0, 100], internet: [0, 100], income: [100, 300000], economy: [1e7, 4e13], exports: [0, 400] };

test('every comparison topic has wide coverage and plausible values', () => {
  const ids = new Set(countries.map(c => c.id));
  for (const [topic, data] of Object.entries(comparisons.topics)) {
    const values = Object.entries(data.values ?? {});
    assert.ok(values.length >= 150, `${topic}: only ${values.length} countries`);
    for (const [id, raw] of values) {
      const v = typeof raw === 'number' ? raw : raw?.value;
      assert.ok(ids.has(id), `${topic}: unknown country ${id}`);
      assert.ok(Number.isFinite(v), `${topic}/${id}: not a number`);
      const range = RANGES[topic];
      if (range) assert.ok(v >= range[0] && v <= range[1], `${topic}/${id}: ${v} is outside ${range.join('–')}`);
    }
    assert.ok(Number(data.reference_year) >= 2015 && Number(data.reference_year) <= new Date().getUTCFullYear(), `${topic}: odd reference year ${data.reference_year}`);
  }
});

test('the country catalogue is complete and consistent', () => {
  assert.equal(countries.length, 195);
  const ids = new Set(countries.map(c => c.id));
  for (const c of countries) {
    assert.ok(c.name && c.nl, c.id + ' needs an English and a Dutch name');
    assert.ok(c.area > 0, c.id + ' area');
    assert.ok(Math.abs(c.latlng[0]) <= 90 && Math.abs(c.latlng[1]) <= 180, c.id + ' position');
    for (const b of c.borders) assert.ok(ids.has(b), `${c.id} borders unknown ${b}`);
    for (const b of c.borders) assert.ok(countries.find(x => x.id === b).borders.includes(c.id), `${c.id}–${b} border is one-sided`);
  }
  // Names the owner decided on (1.23).
  assert.equal(countries.find(c => c.id === 'BLR').nl, 'Belarus');
  assert.equal(countries.find(c => c.id === 'SWZ').nl, 'Eswatini');
});
