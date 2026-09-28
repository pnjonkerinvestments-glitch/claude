// Frame renderer for seekable HTML films.
//
// The page must expose `window.filmReady` (a Promise) and `window.seek(t)`.
// Every output frame is built from SUB subframes spread over a 180° shutter;
// ffmpeg's tmix averages them (motion blur) and keeps one frame in SUB.
// The film is cut into work units (short frame ranges). A pool of workers, each with
// its own browser, renders the units and pipes PNGs straight into an ffmpeg per unit,
// so no subframe touches the disk. The units are joined into one lossless FFV1 master.
//
// Fast moments can take more subframes (--fast "a-b,c-d" --fastsub 32): a flood edge that
// moves 130 px per frame leaves visible bands with 8 samples, and none with 32.
//
//   node build/render.mjs film.html out/film.mkv --dur 15 [--fps 60] [--sub 8]
//        [--fast 166-216,331-362 --fastsub 32] [--w 1920 --h 1080] [--query format=vertical]
//        [--workers 4] [--from 0 --to 900]
//   node build/render.mjs film.html out/stills --stills 1.2,5.8,8.6,13.9
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const [htmlPath, outPath] = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
const FPS = +opt('fps', 60), SUB = +opt('sub', 8), FASTSUB = +opt('fastsub', 32), SHUTTER = +opt('shutter', 0.5);
const W = +opt('w', 1920), H = +opt('h', 1080);
const DUR = +opt('dur', 2), WORKERS = +opt('workers', 4), UNIT = +opt('unit', 30);
const query = opt('query', '');
const total = Math.round(DUR * FPS);
const from = +opt('from', 0), to = Math.min(+opt('to', total), total);
const fast = (opt('fast', '') || '').split(',').filter(Boolean).map(r => r.split('-').map(Number));
const url = pathToFileURL(resolve(htmlPath)).href + (query ? '?' + query : '');
const LAUNCH = { args: ['--font-render-hinting=none', '--disable-lcd-text', '--force-color-profile=srgb'] };

async function openPage(browser) {
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  page.on('pageerror', e => { console.error('page error:', e.message); process.exit(1); });
  page.on('console', m => { if (m.type() === 'error') console.error('console:', m.text()); });
  await page.goto(url);
  await page.evaluate(() => window.filmReady);
  const cdp = await page.context().newCDPSession(page);
  const shot = async t => {
    await page.evaluate(t => window.seek(t), t);
    const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true });
    return Buffer.from(data, 'base64');
  };
  return { page, shot };
}

if (opt('stills')) {
  const browser = await chromium.launch(LAUNCH);
  mkdirSync(outPath, { recursive: true });
  const { shot } = await openPage(browser);
  for (const s of opt('stills').split(',')) {
    writeFileSync(join(outPath, `still-${(+s).toFixed(2)}s.png`), await shot(+s));
    console.log('still', s);
  }
  await browser.close();
  process.exit(0);
}

// Subframe times for frame f, centred on f/FPS.
const subTimes = (f, sub) => Array.from({ length: sub }, (_, i) => (f + ((i + 0.5) / sub - 0.5) * SHUTTER) / FPS);
const subFor = f => fast.some(([a, b]) => f >= a && f <= b) ? FASTSUB : SUB;

// Work units: runs of frames with the same subframe count, at most UNIT frames long.
const units = [];
for (let f = from; f < to;) {
  const sub = subFor(f);
  let g = f;
  const maxLen = Math.max(3, Math.round(UNIT * SUB / sub));   // similar work per unit
  while (g < to && subFor(g) === sub && g - f < maxLen) g++;
  units.push({ a: f, b: g, sub });
  f = g;
}
const tmp = join(dirname(resolve(outPath)), '.chunks-' + Date.now());
mkdirSync(tmp, { recursive: true });
units.forEach((u, i) => { u.file = join(tmp, `u${String(i).padStart(4, '0')}.mkv`); });
const work = units.reduce((s, u) => s + (u.b - u.a) * u.sub, 0);

const t0 = Date.now();
let doneSubs = 0, next = 0;
const browsers = [];
await Promise.all(Array.from({ length: Math.min(WORKERS, units.length) }, async () => {
  const browser = await chromium.launch(LAUNCH);   // one browser (and raster process) per worker
  browsers.push(browser);
  const { shot } = await openPage(browser);
  while (next < units.length) {
    const u = units[next++];
    const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS * u.sub), '-c:v', 'png', '-i', '-',
      '-vf', `format=gbrp16le,tmix=frames=${u.sub},select='eq(mod(n\\,${u.sub})\\,${u.sub - 1})',setpts=N/(${FPS}*TB),format=gbrp`,
      '-r', String(FPS), '-c:v', 'ffv1', '-level', '3', u.file], { stdio: ['pipe', 'inherit', 'inherit'] });
    const closed = new Promise((res, rej) => ff.on('close', code => code ? rej(new Error('ffmpeg ' + code)) : res()));
    for (let f = u.a; f < u.b; f++) {
      for (const t of subTimes(f, u.sub)) {
        const png = await shot(t);
        if (!ff.stdin.write(png)) await new Promise(r => ff.stdin.once('drain', r));
      }
      doneSubs += u.sub;
    }
    ff.stdin.end();
    await closed;
    const el = (Date.now() - t0) / 1000;
    console.log(`unit ${u.a}-${u.b - 1} (${u.sub} sub)  ${(100 * doneSubs / work).toFixed(0)}%  ${el.toFixed(0)}s  eta ${(el / doneSubs * (work - doneSubs)).toFixed(0)}s`);
  }
}));
await Promise.all(browsers.map(b => b.close()));

// Join the units into one lossless master.
writeFileSync(join(tmp, 'list.txt'), units.map(u => `file '${u.file}'`).join('\n'));
await new Promise((res, rej) => spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', join(tmp, 'list.txt'), '-c', 'copy', resolve(outPath)], { stdio: 'inherit' })
  .on('close', code => code ? rej(new Error('concat failed')) : res()));
rmSync(tmp, { recursive: true, force: true });
const nFast = units.filter(u => u.sub !== SUB).reduce((s, u) => s + u.b - u.a, 0);
console.log(`wrote ${outPath}: ${to - from} frames (${nFast} at ${FASTSUB} subframes, the rest at ${SUB}) in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
