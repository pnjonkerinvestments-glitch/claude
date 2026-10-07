import { one, rows, run } from './db';
import { weekStart } from './week';
import type { Env, User } from './types';

/**
 * Weekly leagues (1.23, accounts only), like Duolingo's: every UTC week (Monday–Sunday) players are put in
 * groups of at most 20 within their tier. The group ranks by the week's daily points (the same ledger as every
 * other ranking, nothing extra is scored). Next week the top 5 move up a tier and, in groups of at least 10,
 * the bottom 5 move down. Tiers: 0 bronze, 1 silver, 2 gold, 3 emerald, 4 diamond.
 */
export const LEAGUE_TIERS = ['bronze', 'silver', 'gold', 'emerald', 'diamond'] as const;
export const LEAGUE_GROUP = 20, LEAGUE_UP = 5, LEAGUE_DOWN = 5, LEAGUE_DOWN_MIN = 10;

const addDays = (date: string, n: number) => new Date(Date.parse(date + 'T00:00:00Z') + n * 86400000).toISOString().slice(0, 10);

type Member = { user_id: string; name: string; avatar: number; score: number; joined_at: number };
async function groupTable(env: Env, week: string, tier: number, groupNo: number): Promise<Member[]> {
  const list = await rows(env, `SELECT m.user_id,CASE WHEN u.discoverable=1 THEN u.name ELSE 'Explorer' END name,u.avatar,m.joined_at,
    COALESCE((SELECT SUM(d.score) FROM daily_scores d WHERE d.user_id=m.user_id AND d.date>=? AND d.date<?),0) score
    FROM league_members m JOIN users u ON u.id=m.user_id WHERE m.week=? AND m.tier=? AND m.group_no=? AND u.blocked=0
    ORDER BY score DESC,m.joined_at ASC`, week, addDays(week, 7), week, tier, groupNo);
  return list.map((r: any) => ({ user_id: r.user_id, name: r.name, avatar: Number(r.avatar), score: Number(r.score), joined_at: Number(r.joined_at) }));
}
/** Where a final place in a group of `size` sends a player of `tier` next week. */
export function nextTier(tier: number, place: number, size: number, score: number) {
  if (score > 0 && place <= LEAGUE_UP && tier < LEAGUE_TIERS.length - 1) return tier + 1;
  if (size >= LEAGUE_DOWN_MIN && place > size - LEAGUE_DOWN && tier > 0) return tier - 1;
  return tier;
}

/**
 * Puts an account in this week's group once it has daily points this week (idempotent). Returns the membership,
 * or null for guests and players without points this week.
 */
export async function ensureLeague(env: Env, user: User, date: string): Promise<{ week: string; tier: number; group_no: number; previousTier: number | null } | null> {
  if (user.guest) return null;
  const week = weekStart(date);
  const existing = await one(env, 'SELECT tier,group_no FROM league_members WHERE week=? AND user_id=?', week, user.id);
  const previous = await one(env, 'SELECT week,tier,group_no FROM league_members WHERE user_id=? AND week<? ORDER BY week DESC LIMIT 1', user.id, week);
  if (existing) return { week, tier: Number(existing.tier), group_no: Number(existing.group_no), previousTier: previous ? Number(previous.tier) : null };
  const points = await one(env, 'SELECT COALESCE(SUM(score),0) score FROM daily_scores WHERE user_id=? AND date>=? AND date<?', user.id, week, addDays(week, 7));
  if (!Number(points?.score)) return null;
  let tier = 0;
  if (previous) {
    tier = Number(previous.tier);
    // Only last week's group moves you; after a week off you start again where you were.
    if (previous.week === addDays(week, -7)) {
      const table = await groupTable(env, previous.week, tier, Number(previous.group_no));
      const place = table.findIndex(m => m.user_id === user.id) + 1;
      if (place > 0) tier = nextTier(tier, place, table.length, table[place - 1].score);
    }
  }
  const last = await one(env, 'SELECT group_no,COUNT(*) n FROM league_members WHERE week=? AND tier=? GROUP BY group_no ORDER BY group_no DESC LIMIT 1', week, tier);
  const groupNo = !last ? 1 : Number(last.n) < LEAGUE_GROUP ? Number(last.group_no) : Number(last.group_no) + 1;
  await run(env, 'INSERT OR IGNORE INTO league_members(week,user_id,tier,group_no,joined_at) VALUES (?,?,?,?,?)', week, user.id, tier, groupNo, Date.now());
  const saved = await one(env, 'SELECT tier,group_no FROM league_members WHERE week=? AND user_id=?', week, user.id);
  return saved ? { week, tier: Number(saved.tier), group_no: Number(saved.group_no), previousTier: previous ? Number(previous.tier) : null } : null;
}

/** This week's group for the player, with the promotion and demotion zones. */
export async function leagueStanding(env: Env, user: User, date: string) {
  const week = weekStart(date), ends = addDays(week, 7);
  if (user.guest) return { joined: false, guest: true, week, ends };
  const member = await ensureLeague(env, user, date);
  if (!member) {
    const last = await one(env, 'SELECT tier FROM league_members WHERE user_id=? ORDER BY week DESC LIMIT 1', user.id);
    return { joined: false, guest: false, week, ends, tier: last ? Number(last.tier) : 0, tierName: LEAGUE_TIERS[last ? Number(last.tier) : 0] };
  }
  const table = await groupTable(env, week, member.tier, member.group_no);
  const size = table.length, top = member.tier < LEAGUE_TIERS.length - 1 ? LEAGUE_UP : 0, bottom = member.tier > 0 && size >= LEAGUE_DOWN_MIN ? LEAGUE_DOWN : 0;
  let place = 0;
  const members = table.map((m, i) => {
    // Ties share a place, like every other Roviko ranking.
    const shared = table.findIndex(x => x.score === m.score) + 1;
    if (m.user_id === user.id) place = shared;
    return { name: m.name, avatar: m.avatar, score: m.score, place: shared, me: m.user_id === user.id, zone: i < top && m.score > 0 ? 'up' : i >= size - bottom ? 'down' : null };
  });
  const change = member.previousTier === null ? null : member.tier > member.previousTier ? 'up' : member.tier < member.previousTier ? 'down' : null;
  return { joined: true, guest: false, week, ends, tier: member.tier, tierName: LEAGUE_TIERS[member.tier], group: member.group_no, size, place, promote: top, demote: bottom, change, members };
}
