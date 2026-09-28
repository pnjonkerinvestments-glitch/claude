// Export the film's sound events (window.EVENTS) to audio/events.json for build/mix.py.
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const b = await chromium.launch();
const p = await b.newPage();
await p.goto(pathToFileURL(resolve('film.html')).href);
await p.evaluate(() => window.filmReady);
const ev = await p.evaluate(() => window.EVENTS);
writeFileSync('audio/events.json', JSON.stringify(ev, null, 1));
console.log(`${ev.length} events -> audio/events.json`);
await b.close();
