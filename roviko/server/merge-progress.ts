import { batch, rows } from './db';
import { AppError } from './auth';
import type { Env, User } from './types';
/** Password/OAuth verification MUST complete before this function is called.
 * Guest bearer sessions are revoked, never promoted to account sessions. */
export async function mergeProgress(env: Env, guest: User | null, accountId: string) {
    if (!guest?.guest || guest.id === accountId) return;
    const active = await rows(env, 'SELECT state FROM multiplayer_rooms WHERE expires_at>? AND instr(state,?)>0', Date.now(), guest.id);
    if (active.some((r:any) => { const s=JSON.parse(r.state); return !['lobby','finished'].includes(s.phase) && s.players.some((p:any) => p.id===guest.id && Date.now()-p.lastSeen<45000); })) throw new AppError('FINISH_MATCH_TO_SIGN_IN', 409);
    await batch(env, [
        // Keep both played sessions, but the established account's first daily stays canonical.
        { sql: `UPDATE game_sessions SET date=NULL,state=json_set(state,'$.daily',NULL) WHERE user_id=? AND date IS NOT NULL AND EXISTS (SELECT 1 FROM game_sessions a WHERE a.user_id=? AND a.date=game_sessions.date AND a.kind=game_sessions.kind)`, args:[guest.id,accountId] },
        { sql: 'UPDATE game_sessions SET user_id=? WHERE user_id=?', args:[accountId,guest.id] },
        { sql: 'UPDATE game_results SET user_id=? WHERE user_id=?', args:[accountId,guest.id] },
        { sql: 'UPDATE OR IGNORE answers SET user_id=? WHERE user_id=?', args:[accountId,guest.id] },
        { sql: 'INSERT OR IGNORE INTO daily_challenge_results(user_id,date,result_id,score) SELECT ?,date,result_id,score FROM daily_challenge_results WHERE user_id=?', args:[accountId,guest.id] },
        { sql: 'INSERT OR IGNORE INTO user_achievements(user_id,achievement_id,earned_at) SELECT ?,achievement_id,earned_at FROM user_achievements WHERE user_id=?', args:[accountId,guest.id] },
        { sql: `INSERT INTO learning_reviews(user_id,key,country_id,mode,topic,content,missed,resolved,updated_at) SELECT ?,key,country_id,mode,topic,content,missed,resolved,updated_at FROM learning_reviews WHERE user_id=? ON CONFLICT(user_id,key) DO UPDATE SET content=excluded.content,resolved=excluded.resolved,updated_at=excluded.updated_at WHERE excluded.updated_at>learning_reviews.updated_at`, args:[accountId,guest.id] },
        { sql: 'UPDATE question_reports SET user_id=? WHERE user_id=?', args:[accountId,guest.id] },
        { sql: 'DELETE FROM auth_sessions WHERE user_id=?', args:[guest.id] },
        { sql: 'DELETE FROM users WHERE id=? AND guest=1', args:[guest.id] },
        { sql: `INSERT INTO concept_performance(user_id,country_id,mode,correct,attempts) SELECT user_id,country_id,mode,SUM(correct),COUNT(*) FROM answers WHERE user_id=? GROUP BY user_id,country_id,mode ON CONFLICT(user_id,country_id,mode) DO UPDATE SET correct=excluded.correct,attempts=excluded.attempts`, args:[accountId] }
    ]);
}
