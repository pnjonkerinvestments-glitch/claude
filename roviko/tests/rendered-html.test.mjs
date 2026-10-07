import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";

test("renders the playable branded homepage before hydration", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  const html = await response.text();
  assert.match(html, /<title>Roviko/);
  assert.doesNotMatch(html, /codex-preview/);
  // The calm trip hero (1.23 trip style): one heading, one primary action (the Daily Detour) and Roviko waving.
  // The streak sits in the gold pill of the site header (after boot), so the hero does not repeat it.
  assert.equal((html.match(/<h1/g)||[]).length, 1);
  assert.match(html, /A small geography trip/);
  assert.match(html, /Start today(&#x27;|’|')s trip/);
  assert.match(html, /class="character pose-wave mood-happy[^"]*hero-character/);
  // Today's trip: one segment per scored game and a readable "0/6 today" line for screen readers.
  const segs = html.slice(html.indexOf('class="th-segs"'), html.indexOf('</ol>', html.indexOf('class="th-segs"')));
  assert.equal((segs.match(/<li /g)||[]).length, 6);
  assert.match(html, /0\/6 today/);
  // Today: the Daily Detour and the five daily games as one short list, in the official order.
  assert.equal((html.match(/class="today-row /g)||[]).length, 6);
  const trip=html.slice(html.indexOf('class="today-list"'));
  // 1.24: from SHUFFLE_FROM (UTC) the daily Size Shuffle is the fourth daily game instead of Country Mosaic.
  const shuffleFrom=fs.readFileSync('lib/daily-loop.ts','utf8').match(/SHUFFLE_FROM = '([\d-]+)'/)[1];
  const fourth=new Date().toISOString().slice(0,10)>=shuffleFrom?'Size Shuffle':'Country Mosaic';
  const order=['Daily Detour','Rank Radar','World Duel','Side by Side',fourth,'Daily Clue Trail'].map(n=>trip.indexOf(n));
  assert.ok(order.every((v,i)=>v>0&&(i===0||v>order[i-1])), 'games in order');
  // One side column: the rankings and the daily quests (folded), and a way to all games.
  assert.match(html, /Daily quests/);
  assert.match(html, /class="side-row quests-fold"/);
  assert.match(html, /href="\/leaderboard"/);
  assert.match(html, /href="\/daily"/);
  // Calm: no extra card rows, week panel or bonus blocks before the six games are done.
  assert.doesNotMatch(html, /class="game-card game-card-/);
  assert.doesNotMatch(html, /class="motivation-week[ "]/);
  assert.doesNotMatch(html, /class="together"/);
  // No rules or formulas on the homepage.
  assert.doesNotMatch(html, /Your daily scorecard/);
  assert.doesNotMatch(html, /competition-rules/);
  // Shell: skip link, the three main destinations and the passport, brand assets.
  assert.match(html, /Skip to content/);
  assert.match(html, /href="\/explore"/);
  assert.match(html, /href="\/multiplayer"/);
  assert.match(html, /href="\/profile"/);
  assert.match(html, /data-theme="light"/);
  assert.match(html, /globe-logo.webp/);
});


test('built Mosaic CSS preserves full width and automatic height instead of utility sizing', async () => {
  const fs = await import('node:fs/promises');
  const { default: postcss } = await import('postcss');
  const files = (await fs.readdir('dist/client/assets')).filter(name => name.endsWith('.css'));
  const styles = postcss.parse((await Promise.all(files.map(name => fs.readFile('dist/client/assets/' + name, 'utf8')))).join('\n'));
  const boardRules=[];
  styles.walkRules(rule => { if(rule.selector === '.mosaic-board') boardRules.push(rule); });
  assert.ok(boardRules.length, 'Mosaic layout must be emitted in the production CSS');
  const declarations=boardRules.flatMap(rule=>rule.nodes.filter(n=>n.type==='decl'));
  assert.ok(declarations.some(d=>d.prop==='width'&&d.value==='100%'));
  assert.ok(declarations.some(d=>d.prop==='height'&&d.value==='auto'));
  assert.ok(declarations.some(d=>d.prop==='display'&&d.value==='grid'));
  for(const rule of boardRules) for(const d of rule.nodes) {
    if(['width','height','max-width','max-height'].includes(d.prop)) assert.ok(!d.value.includes('--spacing'), 'Board must never inherit icon-sized dimensions');
  }
});
