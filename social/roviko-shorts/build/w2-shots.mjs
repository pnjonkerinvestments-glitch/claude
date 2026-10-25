// Week-2 stills: reel covers and banners.  node build/w2-shots.mjs jobs.json
//   jobs: [{ page, query, t (seconds, reels only), w, h, out }]  ->  a JPG or PNG per job (by the out extension)
import { chromium } from '../../roviko-launch-film/node_modules/playwright/index.mjs';
import { resolve } from 'node:path'; import { pathToFileURL } from 'node:url'; import { readFileSync } from 'node:fs';
const jobs = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const b = await chromium.launch({ args: ['--font-render-hinting=none', '--force-color-profile=srgb'] });
for (const j of jobs) {
  const page = await b.newPage({ viewport: { width: j.w, height: j.h } });
  page.on('pageerror', e => console.error('ERR', j.out, e.message));
  await page.goto(pathToFileURL(resolve(j.page)).href + '?' + j.query); await page.evaluate(() => window.filmReady);
  if (j.t != null) await page.evaluate(t => window.seek(t), j.t);
  await page.screenshot(j.out.endsWith('.jpg') ? { path: j.out, type: 'jpeg', quality: 92 } : { path: j.out });
  await page.close();
}
console.log(jobs.length, 'stills'); await b.close();
