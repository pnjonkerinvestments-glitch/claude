import { COUNTRIES } from '../lib/game-engine/questions';
import { one, run, rows } from './db';
import type { Env, User } from './types';
type Review = { countryId: string; mode: string; topic?: string; content: any; correct: boolean; at: number };
export function reviewStatement(userId: string, value: Review) {
    const key = [value.mode, value.topic ?? '', value.countryId].join(':');
    if (value.correct) return { sql: `UPDATE learning_reviews SET resolved=1,updated_at=? WHERE user_id=? AND key=? AND updated_at<=? AND COALESCE(json_extract(content,'$.origin'),'')<>?`, args:[value.at,userId,key,value.at,value.content.origin ?? 'new'] };
    const country = COUNTRIES.find(c => c.id === value.countryId);
    const content = { ...value.content, ...(country ? { country: { id:country.id,name:{en:country.name,nl:country.nl},flag:country.flag } } : {}) };
    return { sql: `INSERT INTO learning_reviews(user_id,key,country_id,mode,topic,content,missed,resolved,updated_at) VALUES (?,?,?,?,?,?,1,0,?) ON CONFLICT(user_id,key) DO UPDATE SET content=excluded.content,resolved=0,updated_at=excluded.updated_at WHERE excluded.updated_at>learning_reviews.updated_at`, args:[userId,key,value.countryId,value.mode,value.topic ?? null,JSON.stringify(content),value.at] };
}
export async function recordReview(env: Env, user: User, value: Review) {
    if (!value.countryId) return;
    const statement = reviewStatement(user.id, value); await run(env, statement.sql, ...statement.args);
}
export async function reviewSession(env: Env, user: User, s: any, createdAt = Date.now()) {
    for (const [i, answer] of s.answers.entries()) {
        const q = s.questions?.[i], at = answer.at ?? createdAt + i;
        if (s.mode === 'compare' && q) {
            for (const country of q.countries) await recordReview(env, user, { countryId: country.id, mode: 'compare', topic: q.topic.id, content: { ...q, origin:s.id }, correct: answer.correct, at });
        } else if (s.mode === 'mosaic' && s.board) {
            const tiles = s.board.tiles.filter((t: any) => answer.value.includes(t.id));
            const anchor = tiles.find((t: any) => t.kind === 'name');
            if (!anchor) continue;
            for (const tile of tiles.filter((t: any) => t.kind !== 'name')) await recordReview(env, user, { countryId: anchor.countryId, mode: tile.kind === 'capital' ? 'capitals' : tile.kind === 'flag' ? 'flags' : 'mosaic', content: { origin:s.id, country: s.board.countries.find((c:any) => c.id === anchor.countryId), clue: tile.kind }, correct: tile.countryId === anchor.countryId, at });
        } else if (q) await recordReview(env, user, { countryId: q.countryId, mode: q.mode, content: { ...q, origin:s.id }, correct: answer.correct, at });
    }
}
export async function pendingReviews(env: Env, id: string) {
    // Bounded adoption of existing learning history; no fabricated new attempts.
    if (!await one(env, 'SELECT key FROM learning_reviews WHERE user_id=? LIMIT 1', id)) {
        const old = await rows(env, `SELECT state,created_at FROM game_sessions WHERE user_id=? AND EXISTS (SELECT 1 FROM json_each(state,'$.answers') a WHERE json_extract(a.value,'$.correct')=0) ORDER BY created_at DESC LIMIT 10`, id);
        for (const row of old.reverse()) await reviewSession(env, { id } as User, JSON.parse(row.state), row.created_at);
    }
    const list = await rows(env, 'SELECT key,country_id,mode,topic,content,updated_at FROM learning_reviews WHERE user_id=? AND resolved=0 ORDER BY updated_at DESC LIMIT 16', id);
    return list.map((r: any) => ({ ...r, content: JSON.parse(r.content) }));
}
