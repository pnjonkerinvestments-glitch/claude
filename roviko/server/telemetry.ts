import { digest } from './auth';
import { one, run } from './db';
import type { Env, User } from './types';
/** Optional first-party product measurement. No email, name, IP, answer or raw
 * session/room identifiers are written. Stable digests are pseudonymous. */
export async function measure(req: Request, env: Env, user: User, event: string, mode: string, context = '') {
    if (!req.headers.get('Cookie')?.split(';').some(v => v.trim() === 'rv_metrics=on')) return;
    const id = await digest('metrics:v1:' + user.id + ':' + event + ':' + context);
    try { await run(env, 'DELETE FROM analytics_events WHERE created_at<?', Date.now()-90*86400000); await run(env, 'INSERT OR IGNORE INTO analytics_events(id,event,mode,created_at) VALUES (?,?,?,?)', id, event, mode, Date.now()); }
    catch { console.warn(JSON.stringify({ event: 'measurement_unavailable' })); }
}
export async function measureStart(req: Request, env: Env, user: User, mode: string, id: string) {
    await measure(req, env, user, 'first_game_started', mode);
    await measure(req, env, user, 'game_started', mode, id);
    if (!req.headers.get('Cookie')?.includes('rv_metrics=on')) return;
    const first = await one(env, 'SELECT MIN(created_at) time FROM game_sessions WHERE user_id=?', user.id);
    const days = Math.floor(Date.now()/86400000) - Math.floor(first.time/86400000);
    if (days === 1 || days === 7) await measure(req, env, user, 'returned_day_' + days, mode);
}
