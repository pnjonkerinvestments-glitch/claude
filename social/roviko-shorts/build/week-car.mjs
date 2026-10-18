// Content-week carousels as PNG (1080x1350):  node build/week-car.mjs <out_dir> [post ...]  ->  <out>/<post>/NN.png
import { chromium } from '../../roviko-launch-film/node_modules/playwright/index.mjs';
import { resolve } from 'node:path'; import { pathToFileURL } from 'node:url'; import { mkdirSync } from 'node:fs';
const out = process.argv[2], posts = process.argv.slice(3);
const COUNT = { friend: 8, haunted: 8, zoom: 5, monaco: 4, week: 5 };
const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: 1080, height: 1350 } });
page.on('pageerror', e => console.error('ERR', e.message));
for (const p of posts.length ? posts : Object.keys(COUNT)) {
  mkdirSync(`${out}/${p}`, { recursive: true });
  for (let n = 1; n <= COUNT[p]; n++) {
    await page.goto(pathToFileURL(resolve('wk-car.html')).href + `?id=${p}-${n}`); await page.evaluate(() => window.filmReady);
    await page.screenshot({ path: `${out}/${p}/${String(n).padStart(2, '0')}.png` });
  }
  console.log(p);
}
await b.close();
