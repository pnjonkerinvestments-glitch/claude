// Export a short's sound events (window.EVENTS) for build/mix.py.
//   node build/events.mjs short-1-sydney.html sydney [query]  ->  audio/sydney/events.json
import { chromium } from '../../roviko-launch-film/node_modules/playwright/index.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const [html, name, query = 'format=vertical'] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage();
p.on('pageerror', e => { console.error('page error:', e.message); process.exit(1); });
await p.goto(pathToFileURL(resolve(html)).href + '?' + query);
await p.evaluate(() => window.filmReady);
const ev = await p.evaluate(() => window.EVENTS);
mkdirSync(`audio/${name}`, { recursive: true });
writeFileSync(`audio/${name}/events.json`, JSON.stringify(ev, null, 1));
console.log(`${ev.length} events -> audio/${name}/events.json`);
await b.close();
