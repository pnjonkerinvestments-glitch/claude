import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { build } from 'esbuild';
fs.mkdirSync('.test-runtime', { recursive: true });
await build({ stdin: { contents: "export * from './lib/name-filter';", resolveDir: process.cwd() }, outfile: '.test-runtime/name-filter.mjs', bundle: true, format: 'esm', platform: 'node', logLevel: 'error' });
const { nameAllowed } = await import('../.test-runtime/name-filter.mjs');

test('offensive names are refused, also with leetspeak, accents, spacing and repeated letters', () => {
  for (const bad of ['fuck', 'FuCk you', 'f.u.c.k', 'f u c k', 'fuuuuck', 'Sh1t', 'K4nk3r', 'kanker', 'kut', 'Neuken', 'hoer', 'puta', 'Mierda', 'cabrón', 'gilipollas', 'nazi', 'Hitler88', 'www.site.com', 'me@mail', 'dick', 'n1gg3r', '$lut'])
    assert.equal(nameAllowed(bad), false, bad);
});

test('ordinary names pass, including ones that contain a short word inside', () => {
  for (const ok of ['Pepijn', 'Explorer 7160', 'Grapefruit', 'Catering Carla', 'Fukuoka', 'Vergara', 'Dickens', 'Scunthorpe fan', 'Hoera', 'Computadora', 'Anna-Lisa', 'María José', 'Ali_99', 'Kees'])
    assert.equal(nameAllowed(ok), true, ok);
});
