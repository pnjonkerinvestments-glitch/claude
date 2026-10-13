// Day banners as PNG (1080x1920):  node build/banner-png.mjs <out_dir> [id ...]   (default: every banner of days 15-20)
import { chromium } from '../../roviko-launch-film/node_modules/playwright/index.mjs';
import { resolve } from 'node:path'; import { pathToFileURL } from 'node:url'; import { mkdirSync } from 'node:fs';
const out = process.argv[2], ids = process.argv.slice(3);
const all = [15, 16, 17, 18, 19, 20].flatMap(d => ['funny', 'fact', 'flag', 'viral'].filter(k => k !== 'viral' || [15, 17, 19].includes(d)).map(k => `${d}-${k}`));
const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: 1080, height: 1920 } });
page.on('pageerror', e => console.error('ERR', e.message));
for (const id of ids.length ? ids : all) {
  const [d, k] = id.split('-'); mkdirSync(`${out}/dag-${d}`, { recursive: true });
  await page.goto(pathToFileURL(resolve('banner.html')).href + '?id=' + id); await page.evaluate(() => window.filmReady);
  await page.screenshot({ path: `${out}/dag-${d}/banner-${k}.png` }); console.log(id);
}
await b.close();
