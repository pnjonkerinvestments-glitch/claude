import { competitionSummary } from './competition';
import { startRank, rankAction } from './ranks';
import { followUp } from './follow-up';
import { measure, measureStart } from './telemetry';
import { mergeProgress } from './merge-progress';
import { z } from 'zod';
import { ensureCatalog } from './catalog';
import { seedHash } from '../lib/game-engine/scoring';
import { AppError, auth, getUser, guest, requireUser, safeUser, newSession, sessionCookie, cookieValue, digest, limit, checkOrigin, nameSchema, admin } from './auth';
import { one, rows, run, batch } from './db';
import { stats, leaderboard } from './stats';
import { startSolo, soloAction, recordSolo } from './solo';
import { startPuzzle, puzzleAction, puzzleToday } from './puzzles';
import { createRoom, mutateRoom, roomView, connectSocket } from './multiplayer';
import { COUNTRIES, type Settings } from '../lib/game-engine/questions';
import { BRAND, DEFAULT_SETTINGS, REGIONS, MODES } from '../lib/config';
import type { Env, User } from './types';
const settingsSchema = z.object({ mode: z.enum(['trail', 'capitals', 'flags', 'pinpoint', 'borders', 'order', 'mixed', 'daily', 'daily-trail']), count: z.union([z.literal(5), z.literal(10), z.literal(15), z.literal(20)]), timer: z.union([z.literal(0), z.literal(5), z.literal(10), z.literal(15), z.literal(30)]), difficulty: z.enum(['easy', 'medium', 'hard', 'mixed']), region: z.enum(['World', 'Europe', 'Africa', 'Asia', 'North America', 'South America', 'Oceania']), typed: z.boolean().optional(), enabledModes: z.array(z.enum(MODES)).min(1).max(MODES.length).refine(v => new Set(v).size === v.length).optional() });
const roomSettings = (v: any) => settingsSchema.parse({ ...DEFAULT_SETTINGS, ...v, mode: ['daily','daily-trail'].includes(v?.mode) ? 'mixed' : v?.mode ?? 'mixed' });
function json(data: any, status = 200, headers: Record<string, string> = {}) { return Response.json(data, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers } }); }
async function body(req: Request) { if (Number(req.headers.get('Content-Length') ?? 0) > 8192)
    throw new AppError('REQUEST_TOO_LARGE', 413); const raw = await req.text(); if (raw.length > 8192)
    throw new AppError('REQUEST_TOO_LARGE', 413); try {
    return raw ? JSON.parse(raw) : {};
}
catch {
    throw new AppError('INVALID_REQUEST');
} }
export async function handleApi(req: Request, env: Env, ctx?: {
    waitUntil: (p: Promise<any>) => void;
}): Promise<Response> {
    try {
        const url = new URL(req.url), path = url.pathname.split('/').filter(Boolean).slice(1), method = req.method;
        if (method !== 'GET')
            checkOrigin(req);
        if (path[0] === 'rooms' && path[2] === 'socket') {
            if (req.headers.get('Upgrade')?.toLowerCase() !== 'websocket')
                throw new AppError('WEBSOCKET_REQUIRED', 426);
            return await connectSocket(req, env, ctx);
        }
        if (path[0] === 'flag') {
            const c = COUNTRIES.find(c => ['flags','trail'].some(mode => mode + ':' + seedHash('roviko-v1:' + mode + ':' + c.id).toString(36) === decodeURIComponent(path[1] ?? '').split('-')[0]));
            if (!c)
                throw new AppError('NOT_FOUND', 404);
            const png = url.searchParams.get('format') === 'png';
            const assetRequest = new Request(new URL(png ? '/flags/png/' + c.iso2 + '.png' : c.flag, req.url));
            // Local Vite dev has no ASSETS binding; the dev server serves public/ on the same origin.
            const asset = env.ASSETS ? await env.ASSETS.fetch(assetRequest) : await fetch(assetRequest);
            return new Response(asset.body, { status: asset.status, headers: { 'Content-Type': png ? 'image/png' : 'image/svg+xml', 'Cache-Control': 'public,max-age=86400', 'X-Content-Type-Options': 'nosniff' } });
        }
        if (path[0] === 'health')
            return json({ ok: !!(await one(env, 'SELECT 1 ok')) });
        if (path[0] === 'auth' && path[1] === 'google')
            return await googleAuth(req, env);
        if (path[0] === 'bootstrap') {
            await ensureCatalog(env);
            let user = await getUser(req, env), cookie = '';
            if (!user) {
                const g = await guest(req, env);
                user = g.user;
                cookie = g.cookie;
            }
            const community = await one(env, 'SELECT COUNT(*) games,COUNT(DISTINCT user_id) players FROM game_results');
            const latest = await leaderboard(env, 'all', 'wins');
            return json({ user: safeUser(user!), stats: await stats(env, user!.id), community, countryCount: COUNTRIES.length, leaders: latest.slice(0, 3), googleEnabled: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET), isAdmin: !!env.ADMIN_USER_IDS?.split(',').includes(user!.id) }, 200, cookie ? { 'Set-Cookie': cookie } : {});
        }
        if (path[0] === 'auth' && ['signup', 'login'].includes(path[1])) {
            const result = await auth(req, env, await body(req), path[1] === 'signup');
            return json({ user: result.user }, 200, { 'Set-Cookie': result.cookie });
        }
        const user = await requireUser(req, env);
        await limit(env, 'api:' + user.id, 240);
        if (path[0] === 'auth' && path[1] === 'logout') {
            if (method !== 'POST')
                throw new AppError('METHOD_NOT_ALLOWED', 405);
            const token = cookieValue(req);
            if (token)
                await run(env, 'DELETE FROM auth_sessions WHERE token=?', await digest(token));
            return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie(req, '', 0) });
        }
        if (path[0] === 'profile') {
            if (method === 'GET')
                return json({ user: safeUser(user), stats: await stats(env, user.id) });
            if (method === 'PATCH') {
                const b = z.object({ name: nameSchema, avatar: z.number().int().min(0).max(7), discoverable: z.boolean() }).parse(await body(req));
                await run(env, 'UPDATE users SET name=?,avatar=?,discoverable=? WHERE id=?', b.name, b.avatar, +b.discoverable, user.id);
                return json({ ok: true });
            }
            if (method === 'DELETE') {
                const activeRooms = await rows(env, 'SELECT code,state,version FROM multiplayer_rooms WHERE instr(state,?)>0', user.id);
                for (const row of activeRooms) {
                    const r = JSON.parse(row.state);
                    r.players = r.players.filter((p: any) => p.id !== user.id);
                    delete r.answers[user.id];
                    if (r.host === user.id)
                        r.host = r.players[0]?.id ?? '';
                    await run(env, 'UPDATE multiplayer_rooms SET state=?,version=version+1 WHERE code=? AND version=?', JSON.stringify(r), row.code, row.version);
                }
                await run(env, 'DELETE FROM question_reports WHERE user_id=?', user.id);
                await run(env, 'DELETE FROM users WHERE id=?', user.id);
                return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie(req, '', 0) });
            }
        }
        if (path[0] === 'metrics' && method === 'POST') {
            const b = z.object({ event: z.enum(['shared_result_opened','room_connection_failed','room_reconnected','answer_save_failed']), mode: z.enum(['daily','compare','mosaic','rank','flags','capitals','trail','pinpoint','borders','order','mixed','multiplayer']), context: z.string().max(100).default('') }).parse(await body(req));
            await limit(env, 'metrics:' + user.id, 20); await measure(req, env, user, b.event, b.mode, new Date().toISOString().slice(0,10) + ':' + b.context); return json({ ok:true });
        }
        if(path[0]==='competition' && method==='GET') return json(await competitionSummary(env,user,url.searchParams.get('date')??new Date().toISOString().slice(0,10),url.searchParams.get('mode')??undefined));
        if (path[0] === 'export') {
            const data = { dailyScores:await rows(env,'SELECT * FROM daily_scores WHERE user_id=?',user.id), profile: safeUser(user), results: await rows(env, 'SELECT * FROM game_results WHERE user_id=?', user.id), answers: await rows(env, 'SELECT * FROM answers WHERE user_id=?', user.id), daily: await rows(env, 'SELECT * FROM daily_challenge_results WHERE user_id=?', user.id), achievements: await rows(env, 'SELECT * FROM user_achievements WHERE user_id=?', user.id), friends: await rows(env, 'SELECT * FROM friend_requests WHERE from_id=? OR to_id=?', user.id, user.id), reports: await rows(env, 'SELECT * FROM question_reports WHERE user_id=?', user.id), exportedAt: new Date().toISOString() };
            return json(data, 200, { 'Content-Disposition': 'attachment; filename="roviko-account.json"' });
        }
        if (path[0] === 'ranks') {
            if (method === 'POST' && !path[1]) {
                await limit(env, 'ranks:' + user.id, 30);
                const game = await startRank(env, user, await body(req)); await measureStart(req, env, user, 'rank', game.id); return json(game);
            }
            if (path[1] && ['GET','POST'].includes(method)) {
                const game = await rankAction(env, user, path[1], method === 'GET' ? 'get' : path[2], method === 'GET' ? {} : await body(req));
                if (game.phase === 'finished' && game.daily) await measure(req, env, user, 'daily_completed', 'rank', game.id);
                return json(game);
            }
            throw new AppError('METHOD_NOT_ALLOWED',405);
        }
        if (path[0] === 'puzzles') {
            if (method === 'GET' && path[1] === 'today') return json(await puzzleToday(env, user, url.searchParams.get('competition')==='1'));
            if (method === 'POST' && !path[1]) {
                await limit(env, 'puzzles:' + user.id, 30);
                const game = await startPuzzle(env, user, await body(req)); await measureStart(req, env, user, game.mode, game.id); return json(game);
            }
            if (path[1] && ['GET', 'POST'].includes(method)) { const game = await puzzleAction(env, user, path[1], method === 'GET' ? 'get' : path[2], method === 'GET' ? {} : await body(req)); if (game.phase === 'finished' && game.daily) await measure(req, env, user, 'daily_completed', game.mode, game.id); return json(game); }
            throw new AppError('METHOD_NOT_ALLOWED', 405);
        }
        if (path[0] === 'next-round' && method === 'POST') { await limit(env, 'followup:'+user.id, 30); return json(await followUp(env,user,await body(req))); }
        if (path[0] === 'practice' && method === 'POST') {
            const review = await one(env, 'SELECT * FROM learning_reviews WHERE user_id=? AND key=?', user.id, decodeURIComponent(path[1] ?? ''));
            if (!review) throw new AppError('NOT_FOUND', 404);
            if (['compare','mosaic'].includes(review.mode)) { const game = await startPuzzle(env, user, { mode: review.mode, daily: false, topic: review.topic ?? undefined }, review.country_id); return json({ href: '/puzzle/' + game.id }); }
            const game = await startSolo(env, user, { ...DEFAULT_SETTINGS, mode: review.mode, timer:0, count:5 }, false, review.country_id);
            return json({ href: '/game/' + game.id });
        }
        if(path[0]==='game-asset' && method==='GET') {
            const row=await one(env,'SELECT state FROM game_sessions WHERE id=? AND user_id=?',path[1],user.id);
            if(!row) throw new AppError('NOT_FOUND',404);
            const s=JSON.parse(row.state); let flag:string|undefined;
            if(s.board) { const tile=s.board.tiles.find((t:any)=>t.id===decodeURIComponent(path[2]??'')&&t.kind==='flag'); flag=tile?.image; }
            else { const round=Number(path[2]),q=s.questions[round]; if(!Number.isInteger(round)||round<0||round>s.round||!q?.flag||(q.mode==='trail'&&(s.cluesShown?.[round]??1)<4&&round===s.round&&s.phase==='question'))throw new AppError('NOT_FOUND',404); flag=COUNTRIES.find(c=>c.iso2===q.flag)?.flag; }
            if(!flag) throw new AppError('NOT_FOUND',404);
            const request=new Request(new URL(flag,req.url)); const asset=env.ASSETS?await env.ASSETS.fetch(request):await fetch(request);
            return new Response(asset.body,{status:asset.status,headers:{'Content-Type':'image/svg+xml','Cache-Control':'private,no-store','X-Content-Type-Options':'nosniff'}});
        }
        if (path[0] === 'games') {
            if (method === 'POST' && !path[1]) {
                await limit(env, 'games:' + user.id, 30);
                const b = await body(req);
                const settings = settingsSchema.parse({ ...DEFAULT_SETTINGS, ...b.settings });
                const game = await startSolo(env, user, settings, !!b.practice, undefined, b.competition===true); await measureStart(req, env, user, game.settings.mode, game.id); return json(game);
            }
            if (path[1]) {
                const result = await soloAction(env, user, path[1], method === 'GET' ? 'get' : path[2], method === 'GET' ? {} : await body(req));
                if (result.phase === 'finished') {
                    const row = await one(env, 'SELECT state FROM game_sessions WHERE id=? AND user_id=?', path[1], user.id);
                    await recordSolo(env, user, JSON.parse(row.state));
                    if (result.daily) await measure(req, env, user, 'daily_completed', 'daily', result.id);
                }
                return json(result);
            }
        }
        if (path[0] === 'rooms') {
            if (method === 'POST' && !path[1]) {
                await limit(env, 'rooms:' + user.id, 10);
                const room = await createRoom(env, user, roomSettings((await body(req)).settings)); await measure(req, env, user, 'room_created', room.settings.mode, room.code); return json(room);
            }
            const code = path[1]?.toUpperCase();
            const action = method === 'GET' ? 'get' : path[2];
            if (!['get','join','leave','settings','ready','start','answer','rematch','advance','bot'].includes(action)) throw new AppError('INVALID_ACTION');
            const b = method === 'GET' ? {} : await body(req);
            delete b.connectionToken;
            if (action === 'settings')
                b.settings = roomSettings(b.settings);
            const r = await mutateRoom(env, code, user, action, b);
            if (action === 'join') await measure(req, env, user, 'room_joined', r.state.settings.mode, code);
            if (action === 'start') await measure(req, env, user, 'match_started', r.state.settings.mode, r.state.matchId);
            if (r.state.phase === 'finished') await measure(req, env, user, 'match_completed', r.state.settings.mode, r.state.matchId);
            return json(action === 'leave' ? { ok: true } : roomView(r.state, user.id));
        }
        if (path[0] === 'leaderboard')
            return json({ entries: await leaderboard(env, url.searchParams.get('period') ?? 'all', url.searchParams.get('category') ?? 'xp') });
        if (path[0] === 'reports' && method === 'POST') {
            await limit(env, 'report:' + user.id, 10, 3600000);
            const b = z.object({ questionId: z.string().max(100), template: z.string().max(30), category: z.enum(['wrong', 'outdated', 'translation', 'map', 'other']), detail: z.string().max(500).optional() }).parse(await body(req));
            await run(env, 'INSERT INTO question_reports(id,user_id,question_id,template,category,detail,app_version,created_at) VALUES (?,?,?,?,?,?,?,?)', crypto.randomUUID(), user.id, b.questionId, b.template, b.category, b.detail ?? '', BRAND.version, Date.now());
            return json({ ok: true });
        }
        if (path[0] === 'friends') {
            if (user.guest)
                throw new AppError('ACCOUNT_REQUIRED', 403);
            if (method === 'GET')
                return json({ friends: await rows(env, `SELECT f.*,u.id user_id,u.name,u.avatar,COALESCE((SELECT SUM(score) FROM game_results WHERE user_id=u.id AND multiplayer=1),0) score FROM friend_requests f JOIN users u ON u.id=CASE WHEN f.from_id=? THEN f.to_id ELSE f.from_id END WHERE (f.from_id=? OR f.to_id=?) AND f.status!='rejected'`, user.id, user.id, user.id) });
            const b = await body(req);
            if (path[1]) {
                const f = await one(env, 'SELECT * FROM friend_requests WHERE id=? AND (to_id=? OR from_id=?)', path[1], user.id, user.id);
                if (!f)
                    throw new AppError('NOT_FOUND', 404);
                if (b.status === 'accepted' && (f.to_id !== user.id || f.status !== 'pending'))
                    throw new AppError('FORBIDDEN', 403);
                const status = z.enum(['accepted', 'rejected', 'blocked']).parse(b.status);
                if (f.status === 'blocked' && status !== 'blocked')
                    throw new AppError('FORBIDDEN', 403);
                await run(env, 'UPDATE friend_requests SET status=? WHERE id=?', status, f.id);
                return json({ ok: true });
            }
            await limit(env, 'friend:' + user.id, 20, 3600000);
            const code = z.string().regex(/^[A-Fa-f0-9]{8}$/).parse(b.code);
            const matches = await rows(env, 'SELECT * FROM users WHERE lower(substr(id,1,8))=? AND guest=0 AND discoverable=1 AND blocked=0', code.toLowerCase());
            if (matches.length !== 1 || matches[0].id === user.id)
                throw new AppError('FRIEND_NOT_FOUND', 404);
            const target = matches[0];
            if (await one(env, 'SELECT id FROM friend_requests WHERE (from_id=? AND to_id=?) OR (to_id=? AND from_id=?)', user.id, target.id, user.id, target.id))
                throw new AppError('REQUEST_EXISTS', 409);
            const pairId = [user.id, String(target.id)].sort().join(':');
            const inserted = await run(env, 'INSERT OR IGNORE INTO friend_requests(id,from_id,to_id,created_at) VALUES (?,?,?,?)', pairId, user.id, target.id, Date.now());
            if (!inserted.meta.changes)
                throw new AppError('REQUEST_EXISTS', 409);
            return json({ ok: true });
        }
        if (path[0] === 'admin') {
            admin(env, user);
            if (method === 'GET')
                return json({ dailyContent: (await rows(env, 'SELECT * FROM daily_content ORDER BY date DESC LIMIT 6')).map((row:any) => ({...row, content:JSON.parse(row.content)})), funnel: await rows(env, 'SELECT event,COUNT(*) count FROM analytics_events WHERE created_at>=? GROUP BY event', Date.now()-30*86400000), reports: await rows(env, 'SELECT * FROM question_reports ORDER BY created_at DESC LIMIT 100'), disabled: await rows(env, 'SELECT * FROM disabled_questions'), suspicious: await rows(env, 'SELECT r.id,u.id user_id,u.name,r.score,r.risk FROM game_results r JOIN users u ON u.id=r.user_id WHERE r.risk>=3 ORDER BY r.created_at DESC LIMIT 100'), countryCount: COUNTRIES.length, dailySeed: 'daily:' + new Date().toISOString().slice(0, 10) });
            const b = await body(req);
            if (b.action === 'resolve')
                await run(env, "UPDATE question_reports SET status='resolved' WHERE id=?", z.string().parse(b.id));
            else if (b.action === 'disable')
                await run(env, 'INSERT OR REPLACE INTO disabled_questions(question_id,reason,created_at) VALUES (?,?,?)', z.string().max(100).parse(b.id), z.string().max(300).parse(b.reason ?? 'Under review'), Date.now());
            else if (b.action === 'block')
                await run(env, 'UPDATE users SET blocked=1 WHERE id=?', z.string().parse(b.id));
            else
                throw new AppError('INVALID_ACTION');
            return json({ ok: true });
        }
        throw new AppError('NOT_FOUND', 404);
    }
    catch (e: any) {
        if (e instanceof z.ZodError)
            return json({ error: 'INVALID_INPUT', details: e.errors.map(x => ({ path: x.path.join('.'), message: x.message })) }, 400);
        if (e instanceof AppError)
            return json({ error: e.code }, e.status);
        console.error(JSON.stringify({ event:'api_failure', route:new URL(req.url).pathname.split('/').slice(0,3).join('/'), context: (await digest(new URL(req.url).pathname)).slice(0,16), code:'SERVER_UNAVAILABLE' }));
        return json({ error: 'SERVER_UNAVAILABLE' }, 503);
    }
}
async function googleAuth(req: Request, env: Env) {
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET)
        throw new AppError('PROVIDER_UNAVAILABLE', 503);
    const url = new URL(req.url);
    const redirect = url.origin + '/api/auth/google';
    if (!url.searchParams.get('code')) {
        const u = await getUser(req, env);
        if (!u)
            throw new AppError('SESSION_EXPIRED', 401);
        const state = crypto.randomUUID();
        await run(env, 'INSERT INTO auth_sessions(token,user_id,expires_at) VALUES (?,?,?)', 'oauth:' + await digest(state), u.id, Date.now() + 600000);
        const target = new URL('https://accounts.google.com/o/oauth2/v2/auth');
        target.search = new URLSearchParams({ client_id: env.GOOGLE_CLIENT_ID, redirect_uri: redirect, response_type: 'code', scope: 'openid email profile', state }).toString();
        return Response.redirect(target.toString(), 302);
    }
    const state = url.searchParams.get('state') ?? '';
    const session = await one(env, 'DELETE FROM auth_sessions WHERE token=? AND expires_at>? RETURNING user_id', 'oauth:' + await digest(state), Date.now());
    const current = await requireUser(req, env);
    if (!session || session.user_id !== current.id)
        throw new AppError('INVALID_OAUTH_STATE', 403);
    const token = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, code: url.searchParams.get('code')!, redirect_uri: redirect, grant_type: 'authorization_code' }) });
    if (!token.ok)
        throw new AppError('AUTH_FAILED', 401);
    const t: any = await token.json();
    const info = await fetch('https://openidconnect.googleapis.com/v1/userinfo', { headers: { Authorization: 'Bearer ' + t.access_token } });
    if (!info.ok)
        throw new AppError('AUTH_FAILED', 401);
    const profile: any = await info.json();
    if (!profile.email_verified)
        throw new AppError('EMAIL_UNVERIFIED', 403);
    let u = await one(env, 'SELECT * FROM users WHERE email=?', profile.email.toLowerCase());
    if (!u) {
        await run(env, 'UPDATE users SET email=?,guest=0 WHERE id=?', profile.email.toLowerCase(), current.id);
        u = current;
    }
    if (u.blocked) throw new AppError('ACCOUNT_BLOCKED', 403);
    await mergeProgress(env, current, u.id);
    return new Response(null, { status: 302, headers: { Location: '/profile', 'Set-Cookie': await newSession(req, env, u.id) } });
}
