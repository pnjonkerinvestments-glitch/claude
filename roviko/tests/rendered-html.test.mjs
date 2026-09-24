import assert from "node:assert/strict";
import test from "node:test";

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
  // One clear job above the fold: the heading, today's featured game and a single primary action.
  assert.match(html, /Your daily detour/);
  assert.match(html, /Where shall we go today\?/);
  assert.equal((html.match(/<h1/g)||[]).length, 1);
  assert.match(html, /class="trip-card trip-rank/);
  assert.match(html, /Today(&#x27;|’|')s trip/);
  assert.match(html, /Start today(&#x27;|’|')s trip/);
  assert.match(html, /Rank Radar/);
  // Status space is reserved before hydration (skeleton), never filled with made-up zeros.
  assert.match(html, /class="status-bar"/);
  // More to explore: exactly three secondary cards and a way to all games.
  assert.match(html, /More to explore/);
  assert.equal((html.match(/class="game-card game-card-/g)||[]).length, 3);
  assert.match(html, /World Duel/);
  assert.match(html, /Mystery country/);
  assert.match(html, /Classic games/);
  assert.match(html, /href="\/daily"/);
  // Today's journey: all five daily games as stops, in the official order.
  assert.equal((html.match(/class="route-stop /g)||[]).length, 5);
  for (const name of ['Rank Radar','World Trip','Side by Side','Country Mosaic','Daily Clue Trail']) assert.match(html, new RegExp(name));
  assert.ok(html.indexOf('route-stop is-new is-next') < html.indexOf('World Trip'));
  assert.match(html, /How scoring works/);
  // Play together, kept simple.
  assert.match(html, /Play together/);
  assert.match(html, /One room code\. Up to 12 players\. A whole world to win\./);
  assert.match(html, /Create a room/);
  // No rules, formulas or shield explanations on the homepage.
  assert.doesNotMatch(html, /Your daily scorecard/);
  assert.doesNotMatch(html, /streak shield/i);
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
