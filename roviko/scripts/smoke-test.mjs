// Rooktest tegen een draaiende Roviko-site (lokaal of het Cloudflare-testadres).
// Gebruik: node scripts/smoke-test.mjs https://roviko.pnjonkerinvestments.workers.dev
// Vereist Playwright (in de beheerde omgeving globaal aanwezig; anders PW_EXECUTABLE/`npx playwright`).
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require(require('node:child_process').execSync('npm root -g').toString().trim() + '/playwright')); }

const base = (process.argv[2] ?? 'http://127.0.0.1:8799').replace(/\/$/, '');
const executablePath = process.env.PW_EXECUTABLE ?? (require('node:fs').existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok }); console.log(`${ok ? 'OK  ' : 'FOUT'} ${name}${detail ? ' — ' + detail : ''}`); };

const browser = await chromium.launch({ executablePath });
const context = await browser.newContext();
const page = await context.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text() + (m.location()?.url ? ' (' + m.location().url + ')' : '')); });
// ERR_ABORTED = verzoek afgebroken doordat de test naar een volgende pagina navigeert.
page.on('requestfailed', r => r.failure()?.errorText === 'net::ERR_ABORTED' || errors.push('verzoek mislukt: ' + r.url() + ' ' + (r.failure()?.errorText ?? '')));

for (const path of ['/', '/daily', '/explore', '/friends']) {
  const res = await page.goto(base + path, { waitUntil: 'load' }).then(async r => { await page.waitForTimeout(1500); return r; });
  const text = (await page.locator('body').innerText()).trim();
  check(`pagina ${path}`, res.status() === 200 && text.length > 50, `HTTP ${res.status()}, ${text.length} tekens`);
}

// Service worker en offlinepagina.
await page.goto(base + '/', { waitUntil: 'load' }).then(async r => { await page.waitForTimeout(1500); return r; });
const sw = await page.evaluate(async () => { if (!('serviceWorker' in navigator)) return 'geen'; const r = await Promise.race([navigator.serviceWorker.ready, new Promise(r => setTimeout(() => r(null), 8000))]); if (!r) return 'niet actief'; const c = await caches.open('roviko-shell-' + (r.active?.scriptURL ? 'x' : 'x')).catch(() => null); const keys = await caches.keys(); let offline = false; for (const k of keys) offline ||= !!(await (await caches.open(k)).match('/offline.html')); return `actief, offline.html in cache: ${offline}`; });
check('service worker', sw.startsWith('actief') && sw.endsWith('true'), sw);

// Vlaggen: laad de vlag-API en een statische vlag.
const flags = await page.evaluate(async () => { const a = await fetch('/flags/nl.svg'); return `${a.status} ${a.headers.get('content-type')}`; });
check('vlag /flags/nl.svg', flags.startsWith('200') && flags.includes('svg'), flags);
await page.goto(base + '/explore', { waitUntil: 'load' }).then(async r => { await page.waitForTimeout(1500); return r; });
const imgs = await page.evaluate(() => [...document.images].map(i => ({ src: i.currentSrc, ok: i.complete && i.naturalWidth > 0 })));
const broken = imgs.filter(i => !i.ok);
check('afbeeldingen op /explore', broken.length === 0, `${imgs.length} geladen, ${broken.length} kapot ${broken.slice(0, 3).map(b => b.src).join(' ')}`);

// API: gezondheid + volledige Rank Radar (officieel dagspel) als gast.
const api = (p, body) => page.evaluate(async ([p, body]) => { const r = await fetch('/api/' + p, body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); return { status: r.status, data: await r.json().catch(() => null) }; }, [p, body]);
const health = await api('health');
check('API /api/health (D1)', health.status === 200 && health.data?.ok === true, JSON.stringify(health.data));
const boot = await api('bootstrap');
check('gastaccount via /api/bootstrap', boot.status === 200 && !!boot.data?.user?.id);
let game = (await api('ranks', { daily: true, competition: true })).data;
let steps = 0;
while (game && game.phase !== 'finished' && steps++ < 40) {
  if (game.phase === 'question') { const q = game.question ?? game.current ?? game.questions?.[game.round]; const opt = q?.options?.[0]?.id; game = (await api(`ranks/${game.id}/answer`, { version: game.version, answer: opt })).data; }
  else game = (await api(`ranks/${game.id}/next`, { version: game.version })).data;
}
check('Rank Radar volledig gespeeld', game?.phase === 'finished', `fase ${game?.phase}, ${game?.answers?.length ?? '?'} antwoorden${game?.score !== undefined ? ', dagpunten ' + JSON.stringify(game.score) : ''}`);
const again = (await api('ranks', { daily: true, competition: true })).data;
check('dagspel is eenmalig (hervat afgerond spel)', again?.id === game?.id && again?.phase === 'finished');

// Multiplayer: kamer aanmaken, openen, WebSocket.
const room = await api('rooms', { settings: {} });
if (room.status !== 200) console.log(JSON.stringify(room.data));
const code = room.data?.code;
check('kamer aanmaken', room.status === 200 && !!code, `code ${code}`);
const got = await api(`rooms/${code}`);
check('kamer openen (GET)', got.status === 200, `fase ${got.data?.phase}`);
const ws = await page.evaluate(code => new Promise(res => { const s = new WebSocket(location.origin.replace(/^http/, 'ws') + `/api/rooms/${code}/socket`); const t = setTimeout(() => res('timeout'), 10000); s.onmessage = e => { clearTimeout(t); const m = JSON.parse(e.data); s.close(); res(m.type + ':' + (m.phase ?? m.code ?? '')); }; s.onerror = () => { clearTimeout(t); res('error'); }; }), code);
check('WebSocket kamer', ws.startsWith('state:'), ws);
await page.goto(base + `/room/${code}`, { waitUntil: 'load' }).then(async r => { await page.waitForTimeout(1500); return r; }).catch(() => {});
check('kamerpagina in browser', (await page.locator('body').innerText()).includes(code), `/room/${code}`);

// Lokaal via http verwijzen sommige absolute links (favicon) naar https op dezelfde host: niet relevant.
const realErrors = errors.filter(e => !(base.startsWith('http://') && e.includes('https://' + new URL(base).host)));
check('geen JavaScript-fouten in de console', realErrors.length === 0, realErrors.slice(0, 3).join(' | '));
await browser.close();
const failed = results.filter(r => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} controles geslaagd tegen ${base}`);
process.exit(failed ? 1 : 0);
