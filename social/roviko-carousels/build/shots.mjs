// Render every slide of every post: TikTok photo mode 3:4 (1080x1440, band y 150..1590) and Instagram 4:5 (1080x1350, band y 285..1635).
//   node build/shots.mjs [post ...]   ->  out/post-N/tiktok/NN.png, out/post-N/instagram/NN.png
import { chromium } from '../../roviko-launch-film/node_modules/playwright/index.mjs';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const posts = process.argv.slice(2).map(Number);
const list = posts.length ? posts : [1, 2, 3, 4, 5];
const b = await chromium.launch({ args: ['--font-render-hinting=none', '--force-color-profile=srgb'] });
const page = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
page.on('pageerror', e => { console.error('page error:', e.message); process.exit(1); });
for (const n of list) {
  for (const f of ['tiktok', 'instagram']) mkdirSync(`out/post-${n}/${f}`, { recursive: true });
  for (let s = 0; s < 12; s++) {
    await page.goto(pathToFileURL(resolve('carousel.html')).href + `?post=${n}&slide=${s}`);
    await page.evaluate(() => window.filmReady);
    const nn = String(s + 1).padStart(2, '0');
    await page.screenshot({ path: `out/post-${n}/tiktok/${nn}.png`, clip: { x: 0, y: 150, width: 1080, height: 1440 } });
    await page.screenshot({ path: `out/post-${n}/instagram/${nn}.png`, clip: { x: 0, y: 285, width: 1080, height: 1350 } });
  }
  console.log(`post ${n}: 12 slides`);
}
await b.close();
