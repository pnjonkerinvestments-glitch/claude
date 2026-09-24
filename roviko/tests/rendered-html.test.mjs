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
  // The hero: heading, one primary action, the globe with its five-arc ring, and the streak.
  assert.match(html, /Your daily detour/);
  assert.match(html, /Where shall we go today\?/);
  assert.equal((html.match(/<h1/g)||[]).length, 1);
  assert.match(html, /Start today(&#x27;|’|')s trip/);
  assert.match(html, /class="mascot mascot-happy/);
  assert.equal((html.match(/class="hero-ring-arc /g)||[]).length, 5);
  assert.match(html, /class="hero-stat stat-streak/);
  assert.match(html, /Day streak|day streak/i);
  // Today's trip is a mix: all five daily games as stops, in the official order.
  assert.match(html, /Five stops, five different games/);
  assert.equal((html.match(/class="tstop /g)||[]).length, 5);
  const order=['Rank Radar','World Trip','Side by Side','Country Mosaic','Daily Clue Trail'].map(n=>html.indexOf(n));
  assert.ok(order.every((v,i)=>v>0&&(i===0||v>order[i-1])), 'stops in order');
  // Reasons to come back: quests and the week with the streak shield are visible on the homepage.
  assert.match(html, /Daily quests/);
  assert.match(html, /class="motivation-week"/);
  assert.match(html, /How scoring works/);
  // More to explore: exactly three secondary cards and a way to all games.
  assert.equal((html.match(/class="game-card game-card-/g)||[]).length, 3);
  assert.match(html, /href="\/daily"/);
  // Play together, kept simple.
  assert.match(html, /Play together/);
  assert.match(html, /Create a room/);
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
