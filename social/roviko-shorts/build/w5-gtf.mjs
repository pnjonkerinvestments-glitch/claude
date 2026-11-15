// Week-5 "What flag is this?" carousels as PNG (1080x1350):  node build/w5-gtf.mjs <out_dir> [day ...]  ->  <out>/gtf<d>/NN.png
import { chromium } from '../../roviko-launch-film/node_modules/playwright/index.mjs';
import { resolve } from 'node:path'; import { pathToFileURL } from 'node:url'; import { mkdirSync } from 'node:fs';
const out = process.argv[2], days = process.argv.slice(3).map(Number);
const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: 1080, height: 1350 } });
page.on('pageerror', e => console.error('ERR', e.message));
for (const d of days.length ? days : [1, 2, 3, 4, 5, 6, 7]) {
  mkdirSync(`${out}/gtf${d}`, { recursive: true });
  for (let n = 1; n <= 16; n++) {
    await page.goto(pathToFileURL(resolve('w5-gtf.html')).href + `?d=${d}&n=${n}`); await page.evaluate(() => window.filmReady);
    await page.screenshot({ path: `${out}/gtf${d}/${String(n).padStart(2, '0')}.png` });
  }
  console.log('gtf' + d);
}
await b.close();
