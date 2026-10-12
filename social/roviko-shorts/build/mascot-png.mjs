// Roviko as transparent PNGs in several poses:  node build/mascot-png.mjs <out_dir> [size]
import { chromium } from '../../roviko-launch-film/node_modules/playwright/index.mjs';
import { resolve } from 'node:path'; import { pathToFileURL } from 'node:url'; import { mkdirSync } from 'node:fs';
const out = process.argv[2], size = +(process.argv[3] || 2000); mkdirSync(out, { recursive: true });
const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: 1000, height: 1000 }, deviceScaleFactor: size / 1000 });
for (const pose of ['wave', 'cheer', 'wink', 'cool', 'shock', 'nervous', 'globe']) {
  await page.goto(pathToFileURL(resolve('mascot-png.html')).href + '?pose=' + pose); await page.evaluate(() => window.filmReady);
  await page.screenshot({ path: `${out}/roviko-${pose}.png`, omitBackground: true }); console.log(pose);
}
await b.close();
