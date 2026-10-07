import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import fs from 'node:fs/promises';
import { Miniflare } from 'miniflare';

// 1.23 weekly leagues on a real D1 database with every migration: joining, groups of 20, moving up and down.
let mf, db, lib, env;
before(async () => {
  await fs.mkdir('.test-runtime', { recursive: true });
  await build({ stdin: { contents: "export {ensureLeague,leagueStanding,nextTier,LEAGUE_GROUP} from './server/league';export {recordCompetition} from './server/competition';", resolveDir: process.cwd() }, bundle: true, outfile: '.test-runtime/league.mjs', format: 'esm', platform: 'node', logLevel: 'error' });
  lib = await import('../.test-runtime/league.mjs?' + Date.now());
  mf = new Miniflare({ modules: true, script: 'export default {fetch(){return new Response("ok")}}', compatibilityDate: '2025-03-01', d1Databases: ['DB'] });
  db = await mf.getD1Database('DB'); env = { DB: db };
  for (const file of (await fs.readdir('drizzle')).filter(x => x.endsWith('.sql')).sort()) for (const stmt of (await fs.readFile('drizzle/' + file, 'utf8')).split('--> statement-breakpoint')) if (stmt.trim()) await db.prepare(stmt.trim()).run();
});
after(async () => { await mf?.dispose(); });

const user = (id, guest = false) => ({ id, name: id, avatar: 0, guest, discoverable: true });
async function addUser(id, guest = false) { await db.prepare('INSERT INTO users(id,name,avatar,guest,discoverable,blocked,created_at) VALUES (?,?,0,?,1,0,?)').bind(id, id, guest ? 1 : 0, Date.now()).run(); return user(id, guest); }
async function score(id, date, mode, points) {
  const session = id + ':' + date + ':' + mode;
  await db.prepare('INSERT INTO game_sessions(id,user_id,kind,date,state,completed,created_at) VALUES (?,?,?,?,?,1,?)').bind(session, id, mode, date, '{}', Date.now()).run();
  await db.prepare('INSERT INTO daily_scores(user_id,date,mode,session_id,score,scoring_version,created_at) VALUES (?,?,?,?,?,1,?)').bind(id, date, mode, session, points, Date.now()).run();
}

test('accounts join a bronze group with their first points; guests and players without points do not', async () => {
  const a = await addUser('lg-a'), g = await addUser('lg-guest', true), idle = await addUser('lg-idle');
  assert.equal(await lib.ensureLeague(env, a, '2026-10-06'), null, 'no points yet');
  await score('lg-a', '2026-10-06', 'daily', 640);
  const joined = await lib.ensureLeague(env, a, '2026-10-06');
  assert.deepEqual({ week: joined.week, tier: joined.tier, group: joined.group_no }, { week: '2026-10-05', tier: 0, group: 1 });
  assert.deepEqual(await lib.ensureLeague(env, a, '2026-10-07'), joined, 'idempotent within the week');
  const guest = await lib.leagueStanding(env, g, '2026-10-06');
  assert.equal(guest.joined, false); assert.equal(guest.guest, true);
  const waiting = await lib.leagueStanding(env, idle, '2026-10-06');
  assert.equal(waiting.joined, false); assert.equal(waiting.tier, 0);
  const standing = await lib.leagueStanding(env, a, '2026-10-06');
  assert.equal(standing.joined, true); assert.equal(standing.tierName, 'bronze'); assert.equal(standing.place, 1); assert.equal(standing.members[0].score, 640); assert.equal(standing.members[0].me, true);
  assert.equal(standing.demote, 0, 'bronze never moves down');
});

test('groups hold at most 20 players; ties share a place', async () => {
  for (let i = 0; i < 21; i++) { const u = await addUser('lg-g' + i); await score(u.id, '2026-09-28', 'rank', i === 20 ? 300 : 500); await lib.ensureLeague(env, u, '2026-09-28'); }
  const groups = (await db.prepare("SELECT group_no,COUNT(*) n FROM league_members WHERE week='2026-09-28' AND tier=0 GROUP BY group_no ORDER BY group_no").all()).results;
  assert.deepEqual(groups.map(g => Number(g.n)), [lib.LEAGUE_GROUP, 1]);
  const first = await lib.leagueStanding(env, user('lg-g0'), '2026-09-28');
  assert.ok(first.members.every(m => m.place === 1), 'equal points share first place');
});

test('next week the top 5 move up and, in groups of at least 10, the bottom 5 move down', () => {
  assert.equal(lib.nextTier(0, 1, 20, 900), 1);
  assert.equal(lib.nextTier(0, 5, 20, 100), 1);
  assert.equal(lib.nextTier(0, 6, 20, 900), 0);
  assert.equal(lib.nextTier(0, 20, 20, 0), 0, 'bronze cannot go lower');
  assert.equal(lib.nextTier(2, 18, 20, 50), 1);
  assert.equal(lib.nextTier(2, 9, 9, 50), 2, 'small groups do not demote');
  assert.equal(lib.nextTier(4, 1, 20, 900), 4, 'diamond is the top');
  assert.equal(lib.nextTier(1, 1, 3, 0), 1, 'no promotion without points');
});

test('the promotion is applied when the player returns the next week', async () => {
  const top = await addUser('lg-top');
  await score('lg-top', '2026-09-30', 'daily', 990);
  await lib.ensureLeague(env, top, '2026-09-30');
  const last = await lib.leagueStanding(env, top, '2026-09-30');
  assert.ok(last.place <= 5);
  await score('lg-top', '2026-10-08', 'trail', 400);
  const now = await lib.leagueStanding(env, top, '2026-10-08');
  assert.equal(now.tier, 1); assert.equal(now.tierName, 'silver'); assert.equal(now.change, 'up');
  assert.equal(now.members.length, 1); assert.equal(now.members[0].score, 400, 'only this week counts');
});

test('a saved daily result joins the league; a guest result never does; an old week never does', async () => {
  const today = new Date().toISOString().slice(0, 10), old = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10);
  const acc = await addUser('lg-rec'), g = await addUser('lg-rec-guest', true), late = await addUser('lg-rec-old');
  for (const [u, date] of [[acc, today], [g, today], [late, old]]) {
    await db.prepare('INSERT INTO game_sessions(id,user_id,kind,date,state,completed,created_at) VALUES (?,?,?,?,?,1,?)').bind(u.id + ':s', u.id, 'daily', date, '{}', Date.now()).run();
    await lib.recordCompetition(env, u, { id: u.id + ':s', daily: date, phase: 'finished', answers: Array.from({ length: 20 }, () => ({ correct: true, mode: 'flags' })), competition: { version: 1, mode: 'daily' } });
  }
  assert.equal(Number((await db.prepare("SELECT COUNT(*) n FROM league_members WHERE user_id='lg-rec'").first()).n), 1);
  assert.equal(Number((await db.prepare("SELECT COUNT(*) n FROM league_members WHERE user_id='lg-rec-guest'").first()).n), 0);
  assert.equal(Number((await db.prepare("SELECT COUNT(*) n FROM league_members WHERE user_id='lg-rec-old'").first()).n), 0, 'reopening an old game starts no past membership');
});
