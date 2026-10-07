// node render.mjs [post ...]  ->  post-N-<name>/tiktok/NN.png (1080x1440) and /instagram/NN.png (1080x1350)
import { chromium } from '../../roviko-launch-film/node_modules/playwright/index.mjs';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const NAMES = { 1: ['six-games', 8], 2: ['whole-map', 5], 3: ['game-night', 6] };
const list = process.argv.slice(2).map(Number); const posts = list.length ? list : [1, 2, 3];
const b = await chromium.launch({ args: ['--font-render-hinting=none', '--force-color-profile=srgb'] });
const page = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
page.on('pageerror', e => { console.error('page error:', e.message); process.exit(1); });
for (const n of posts) {
  const [name, count] = NAMES[n], dir = `post-${n}-${name}`;
  for (const f of ['tiktok', 'instagram']) mkdirSync(`${dir}/${f}`, { recursive: true });
  for (let s = 0; s < count; s++) {
    await page.goto(pathToFileURL(resolve('real.html')).href + `?post=${n}&slide=${s}`);
    await page.evaluate(() => window.filmReady);
    const nn = String(s + 1).padStart(2, '0');
    await page.screenshot({ path: `${dir}/tiktok/${nn}.png`, clip: { x: 0, y: 150, width: 1080, height: 1440 } });
    await page.screenshot({ path: `${dir}/instagram/${nn}.png`, clip: { x: 0, y: 285, width: 1080, height: 1350 } });
  }
  console.log(dir, count, 'slides');
}
await b.close();
