// Trend posts as PNG:  node build/trends-png.mjs <out_dir> [id ...]   ->  <out>/<post>/tiktok/NN.png (1080x1920) + instagram/NN.png (1080x1350)
import { chromium } from '../../roviko-launch-film/node_modules/playwright/index.mjs';
import { resolve } from 'node:path'; import { pathToFileURL } from 'node:url'; import { mkdirSync } from 'node:fs';
const out = process.argv[2], ids = process.argv.slice(3);
const COUNT = { italy: 4, trend: 3, forest: 3, size: 3, score: 3 };
const all = Object.entries(COUNT).flatMap(([p, n]) => Array.from({ length: n }, (_, i) => `${p}-${i + 1}`));
const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: 1080, height: 1920 } });
page.on('pageerror', e => console.error('ERR', e.message));
for (const id of ids.length ? ids : all) {
  const [p, n] = id.split('-'), nn = String(n).padStart(2, '0');
  for (const [plat, q, clip] of [['tiktok', '', null], ['instagram', '&ig=1', { x: 0, y: 300, width: 1080, height: 1350 }]]) {
    mkdirSync(`${out}/${p}/${plat}`, { recursive: true });
    await page.goto(pathToFileURL(resolve('trends.html')).href + '?id=' + id + q); await page.evaluate(() => window.filmReady);
    await page.screenshot({ path: `${out}/${p}/${plat}/${nn}.png`, ...(clip ? { clip } : {}) });
  }
  console.log(id);
}
await b.close();
