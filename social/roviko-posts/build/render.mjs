// Screenshots every <section data-out> in build/slides.html (feed posts) and build/stories.html to PNG.
import { createRequire } from 'node:module';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// createRequire honours NODE_PATH, so a global Playwright install works too.
const { chromium } = createRequire(import.meta.url)('playwright');
const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
const only = process.argv[2];
for (const html of ['slides.html', 'stories.html']) {
  if (!existsSync(resolve(here, html))) continue;
  await page.goto(pathToFileURL(resolve(here, html)).href, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  for (const el of await page.$$('section[data-out]')) {
    const out = await el.getAttribute('data-out');
    if (only && !out.includes(only)) continue;
    const file = resolve(root, out);
    mkdirSync(dirname(file), { recursive: true });
    await el.screenshot({ path: file });
    console.log(out);
  }
}
await browser.close();
