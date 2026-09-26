// Screenshots every <section data-out> in build/slides.html to a 1080x1350 PNG.
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// createRequire honours NODE_PATH, so a global Playwright install works too.
const { chromium } = createRequire(import.meta.url)('playwright');
const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
await page.goto(pathToFileURL(resolve(here, 'slides.html')).href, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
const only = process.argv[2];
for (const el of await page.$$('section[data-out]')) {
  const out = await el.getAttribute('data-out');
  if (only && !out.includes(only)) continue;
  const file = resolve(root, out);
  mkdirSync(dirname(file), { recursive: true });
  await el.screenshot({ path: file });
  console.log(out);
}
await browser.close();
