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
  assert.match(html, /Your daily detour/);
  assert.doesNotMatch(html, /journey-route/);
  assert.equal((html.match(/class="daily-card daily-card-/g)||[]).length,5);
  assert.ok(html.indexOf('daily-card-daily') < html.indexOf('daily-card-compare'));
  assert.match(html, /Side by Side/);
  assert.match(html, /Country Mosaic/);
  assert.match(html, /Rank Radar/);
  assert.match(html, /Daily Clue Trail/);
  assert.match(html, /Your daily scorecard/);
  assert.ok(html.indexOf('daily-card-rank') < html.indexOf('daily-card-daily'));
  assert.match(html, /Explore all 14 topics/);
  assert.ok(html.indexOf('Side by Side') < html.indexOf('Flag Signal'));
  assert.match(html, /data-theme="light"/);
  assert.match(html, /Flag Signal/);
  assert.match(html, /Create a room/);
  assert.match(html, /globe-logo.webp/);
  assert.match(html, /🧭/);
  assert.match(html, /Surprise me/);
  assert.match(html, /2–12 players/);
  assert.equal((html.match(/class="quick-game-card/g)||[]).length,6);
  assert.doesNotMatch(html, /2–3 min/);
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
