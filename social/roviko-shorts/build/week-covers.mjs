// Covers for the content-week reels: a frame where the hook and the challenge are both on screen.
//   node build/week-covers.mjs  ->  ../roviko-week/D<n>/<id>-cover.jpg (1080x1920; the middle 1080x1440 reads as a 3:4 grid tile)
import { chromium } from '../../roviko-launch-film/node_modules/playwright/index.mjs';
import { resolve } from 'node:path'; import { pathToFileURL } from 'node:url'; import { mkdirSync } from 'node:fs';
const PAGE = { P1: 'wk-country', P2: 'wk-flag', P3: 'wk-chal', P4: 'wk-comm' };
const T = { P1: null, P2: 1.7, P3: 1.9, P4: { 2: 1.9, 4: 1.1, 6: 5.2 } };   // P1: one beat after the last clue lands
const ids = []; for (let d = 1; d <= 7; d++) { ids.push(`D${d}P1`, `D${d}P3`); if (d !== 6) ids.push(`D${d}P2`); if ([2, 4, 6].includes(d)) ids.push(`D${d}P4`); }
const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: 1080, height: 1920 } });
page.on('pageerror', e => console.error('ERR', e.message));
for (const id of ids) {
  const d = +id[1], p = id.slice(2), t = T[p] && typeof T[p] === 'object' ? T[p][d] : T[p];
  await page.goto(pathToFileURL(resolve(PAGE[p] + '.html')).href + '?d=' + d); await page.evaluate(() => window.filmReady);
  const tt = p === 'P1' ? await page.evaluate('(TL.c[2] + 1) * 60 / TEMPO') : t;
  await page.evaluate(t => window.seek(t), tt);
  mkdirSync(`../roviko-week/D${d}`, { recursive: true });
  await page.screenshot({ path: `../roviko-week/D${d}/${id}-cover.jpg`, type: 'jpeg', quality: 92 });
}
console.log(ids.length, 'covers'); await b.close();
