// Content-week banners, one per post (1080x1920):  node build/week-banners.mjs [id ...]  ->  ../roviko-week/D<n>/banners/<id>-banner.png
import { chromium } from '../../roviko-launch-film/node_modules/playwright/index.mjs';
import { resolve } from 'node:path'; import { pathToFileURL } from 'node:url'; import { mkdirSync } from 'node:fs';
const ids = process.argv.slice(2).length ? process.argv.slice(2) : [1, 2, 3, 4, 5, 6, 7].flatMap(d => [1, 2, 3, 4, 5].map(p => `D${d}P${p}`));
const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: 1080, height: 1920 } });
page.on('pageerror', e => console.error('ERR', e.message));
for (const id of ids) {
  await page.goto(pathToFileURL(resolve('wk-banner.html')).href + '?id=' + id); await page.evaluate(() => window.filmReady);
  mkdirSync(`../roviko-week/D${id[1]}/banners`, { recursive: true });
  await page.screenshot({ path: `../roviko-week/D${id[1]}/banners/${id}-banner.png` });
}
console.log(ids.length, 'banners'); await b.close();
