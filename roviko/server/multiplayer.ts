import { reviewStatement } from './reviews';
import { measure } from './telemetry';
import { validAnswer } from '../lib/game-engine/validate-answer';
import { prepareGeography, enrichMapFeedback } from './geography';
import { one, rows, run, batch } from './db';
import { AppError, requireUser, checkOrigin, nameSchema } from './auth';
import { roomCode, random } from '../lib/game-engine/scoring';
import { generateQuestions, evaluate, publicQuestion, type Settings, type Question } from '../lib/game-engine/questions';
import { resultStatement } from './stats';
import type { Room, Player, Env, User } from './types';
const TTL = 30 * 60000;
const savedMatches = new Set<string>();
const savingMatches = new Map<string, Promise<void>>();
function player(u: User): Player { return { id: u.id, name: u.name, avatar: u.avatar, ready: false, lastSeen: Date.now(), score: 0, streak: 0, bestStreak: 0, correct: 0, results: [] }; }
export async function createRoom(env: Env, user: User, settings: Settings) { for (let i = 0; i < 8; i++) {
    const code = roomCode();
    const r: Room = { code, name: user.name + "'s room", host: user.id, settings, players: [player(user)], phase: 'lobby', questions: [], round: 0, startAt: 0, deadline: 0, revealUntil: 0, matchId: crypto.randomUUID(), answers: {}, previousQuestions: [], createdAt: Date.now(), updatedAt: Date.now(), expiresAt: Date.now() + TTL, events: ['room_created'] };
    try {
        await run(env, 'INSERT INTO multiplayer_rooms(code,state,updated_at,expires_at) VALUES (?,?,?,?)', code, JSON.stringify(r), r.updatedAt, r.expiresAt);
        return roomView(r, user.id);
    }
    catch (e: any) {
        if (!String(e.message).includes('UNIQUE'))
            throw e;
    }
} throw new AppError('ROOM_UNAVAILABLE', 503); }
export function tick(r: Room, now: number) {
    let changed = false;
    const active = r.players.filter(p => now - p.lastSeen < 45000 || p.bot);
    const host = r.players.find(p => p.id === r.host);
    if ((!host || now - host.lastSeen > 30000) && active.some(p => !p.bot && p.id !== r.host)) {
        r.host = active.find(p => !p.bot && p.id !== r.host)!.id;
        changed = true;
        r.events = ['host_changed'];
    }
    if (r.phase === 'countdown' && now >= r.startAt) {
        r.phase = 'question';
        r.events = ['round_started'];
        changed = true;
    }
    if (r.phase === 'question') {
        for (const p of r.players.filter(p => p.bot && !r.answers[p.id]))
            if (now - r.startAt > 2200) {
                const rng = random(r.matchId + ':' + r.round + ':' + p.id);
                const q = r.questions[r.round];
                r.answers[p.id] = { value: rng() < .7 ? q.correct : q.options[0]?.id ?? null, at: now };
                changed = true;
            }
        const everyoneAnswered = active.length > 0 && active.every(p => r.answers[p.id]);
        if (everyoneAnswered && !r.answersCompleteAt) {
            r.answersCompleteAt = Math.max(...active.map(p => r.answers[p.id].at)) + 1000;
            changed = true;
        } else if (!everyoneAnswered && r.answersCompleteAt) {
            r.answersCompleteAt = undefined;
            changed = true;
        }
        if (r.answersCompleteAt ? now >= r.answersCompleteAt : (r.deadline && now >= r.deadline)) {
            const before = [...r.players].sort((a, b) => b.score - a.score);
            r.players.forEach(p => { const q = r.questions[r.round], a = r.answers[p.id]; const result = enrichMapFeedback(q, a?.value ?? null, evaluate(q, a?.value ?? null, a ? Math.max(0, a.at - r.startAt) : r.settings.timer * 1000, r.settings.timer * 1000, p.streak)); p.previousRank = before.findIndex(x => x.id === p.id) + 1; p.delta = result.points; p.score += result.points; p.streak = result.streak; p.bestStreak = Math.max(p.bestStreak, p.streak); p.correct += +result.correct; p.results.push({ ...result, at:now, questionId: q.id, value: a?.value ?? null }); });
            r.phase = 'reveal';
            r.revealUntil = now + 3500;
            r.events = ['round_finished', 'leaderboard_updated'];
            changed = true;
        }
    }
    if (r.phase === 'reveal' && now >= r.revealUntil) {
        if (r.round + 1 >= r.questions.length) {
            r.phase = 'finished';
            r.events = ['game_finished'];
        }
        else {
            r.round++;
            r.phase = 'countdown';
            r.startAt = now + 3000;
            r.deadline = r.settings.timer ? r.startAt + r.settings.timer * 1000 : 0;
            r.answers = {};
            r.answersCompleteAt = undefined;
            r.events = ['countdown'];
        }
        changed = true;
    }
    return changed;
}
type Label = { en: string; nl: string; es?: string };
/** A readable version of a player's answer, only ever sent after the round is revealed. */
function answerLabel(q: Question, value: unknown): Label | null {
    const option = (id: unknown) => q.options.find(o => o.id === id) as (Label & { id: string }) | undefined;
    if (typeof value === 'string') { const o = option(value); return o ? { en: o.en, nl: o.nl, ...(o.es ? { es: o.es } : {}) } : { en: value, nl: value, es: value }; }
    if (Array.isArray(value) && q.mode === 'order') { const names = value.map(id => option(id)); return { en: names.map(o => o?.en ?? '?').join(' › '), nl: names.map(o => o?.nl ?? '?').join(' › ') }; }
    return null;
}
/** Every player's answer, correctness and points for one round (for the reveal and the match review). */
function roundAnswers(r: Room, round: number) {
    const q = r.questions[round];
    return r.players.map(p => { const res = p.results[round]; return { id: p.id, name: p.name, avatar: p.avatar, answered: !!res && res.value !== null && res.value !== undefined, correct: !!res?.correct, points: res?.points ?? 0, distance: res?.distance ?? null, answer: res && q ? answerLabel(q, res.value) : null }; });
}
export function roomView(r: Room, userId: string) { const p = r.players.find(p => p.id === userId); if (!p)
    throw new AppError('NOT_IN_ROOM', 403); const reveal = r.phase === 'reveal' || r.phase === 'finished'; return { code: r.code, name: r.name, host: r.host, settings: r.settings, phase: r.phase, round: r.round, total: r.questions.length, startAt: r.startAt, deadline: r.deadline, revealUntil: r.revealUntil, answersCompleteAt: r.answersCompleteAt, matchId: r.matchId, events: r.events, serverTime: Date.now(), players: [...r.players].sort((a, b) => b.score - a.score).map(p => ({ id: p.id, name: p.name, avatar: p.avatar, ready: p.ready, rank: 1 + r.players.filter(x => x.score > p.score).length, connected: Date.now() - p.lastSeen < 20000 || p.bot, score: p.score, streak: p.streak, correct: p.correct, delta: p.delta, previousRank: p.previousRank, answered: !!r.answers[p.id], bot: !!p.bot })), question: r.questions[r.round] && ['question','reveal'].includes(r.phase) ? publicQuestion(r.questions[r.round],reveal) : null, feedback: reveal ? p.results[r.round] ?? null : null, results: r.phase === 'finished' ? p.results : undefined, roundAnswers: reveal && r.questions[r.round] ? roundAnswers(r, r.round) : undefined, history: r.phase === 'finished' ? r.questions.map((q, i) => ({ round: i, mode: q.mode, prompt: q.prompt, answerLabel: q.answerLabel, players: roundAnswers(r, i) })) : undefined, answered: !!r.answers[userId], score: p.score }; }
async function saveMatch(env: Env, r: Room) {
    if (r.phase !== 'finished') return;
    if (!savingMatches.has(r.matchId)) { const task = writeMatch(env,r).finally(() => savingMatches.delete(r.matchId)); savingMatches.set(r.matchId,task); }
    await savingMatches.get(r.matchId);
}
async function writeMatch(env: Env, r: Room) { if (r.phase !== 'finished' || savedMatches.has(r.matchId))
    return; const best = Math.max(...r.players.map(p => p.score)); const people = r.players.filter(p => !p.bot); const statements: any[] = []; for (const p of people) {
    if (!await one(env, 'SELECT id FROM users WHERE id=?', p.id))
        continue;
    statements.push(resultStatement(r.matchId + ':' + p.id, p.id, { ...p, settings: r.settings }, 1, r.players.length > 1 && p.score === best ? 1 : 0));
    for (let i = 0; i < p.results.length; i++) {
        const a = p.results[i], q = r.questions[i];
        statements.push(reviewStatement(p.id, { countryId:q.countryId,mode:q.mode,content:{...q,origin:r.matchId},correct:a.correct,at:a.at ?? r.updatedAt }));
        statements.push({ sql: 'INSERT OR IGNORE INTO answers(session_id,round,user_id,question_id,country_id,mode,answer,correct,points,response_time,risk,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)', args: [r.matchId, i, p.id, a.questionId, a.countryId, a.mode, JSON.stringify(a.value ?? null), +a.correct, a.points, a.responseTime, a.risk, Date.now()] });
    }
} for (let i = 0; i < statements.length; i += 40)
    await batch(env, statements.slice(i, i + 40)); if (savedMatches.size > 500)
    savedMatches.clear(); savedMatches.add(r.matchId); }
export async function mutateRoom(env: Env, code: string, user: User | null, action: string, body: any = {}) {
    if (!/^[A-Z2-9]{5}$/.test(code))
        throw new AppError('INVALID_ROOM_CODE');
    for (let attempt = 0; attempt < 24; attempt++) {
        const row = await one(env, 'SELECT * FROM multiplayer_rooms WHERE code=?', code);
        if (!row)
            throw new AppError('ROOM_NOT_FOUND', 404);
        if (row.expires_at < Date.now())
            throw new AppError('ROOM_EXPIRED', 410);
        const r: Room = JSON.parse(row.state);
        let changed = tick(r, Date.now());
        const p = user ? r.players.find(p => p.id === user.id) : null;
        if (user && action === 'join') {
            if (!p) {
                if (r.phase !== 'lobby' && r.phase !== 'finished')
                    throw new AppError('MATCH_IN_PROGRESS', 409);
                if (r.players.length >= 12)
                    throw new AppError('ROOM_FULL', 409);
                r.players.push(player(user));
            }
            else {
                p.lastSeen = Date.now();
                p.name = user.name;
                p.avatar = user.avatar;
            }
            r.events = ['player_joined'];
            changed = true;
        }
        else if (user && action !== 'get') {
            if (!p)
                throw new AppError('NOT_IN_ROOM', 403);
            if (action === 'connect') { p.connectionToken = body.connectionToken; p.lastSeen = Date.now(); changed = true; }
            else if (action === 'ping') {
                p.lastSeen = Date.now();
                changed = true;
            }
            else if (action === 'ready') {
                if (r.phase !== 'lobby')
                    throw new AppError('MATCH_IN_PROGRESS', 409);
                p.ready = !!body.ready;
                p.lastSeen = Date.now();
                r.events = ['player_ready'];
                changed = true;
            }
            else if (action === 'answer') {
                if (r.phase !== 'question' || Date.now() < r.startAt || (r.deadline && Date.now() > r.deadline) || body.round !== r.round || body.matchId !== r.matchId)
                    throw new AppError('ROUND_CLOSED', 409);
                if (r.answers[user.id])
                    throw new AppError('ANSWER_LOCKED', 409);
                if (!validAnswer(r.questions[r.round], body.answer)) throw new AppError('INVALID_INPUT');
                r.answers[user.id] = { value: body.answer, at: Date.now() };
                r.events = ['answer_submitted'];
                changed = true;
            }
            else if (action === 'leave') {
                if (r.phase === 'lobby' || r.phase === 'finished')
                    r.players = r.players.filter(x => x.id !== user.id);
                else
                    p.lastSeen = 0;
                if (r.host === user.id)
                    r.host = r.players.find(x => x.id !== user.id && !x.bot)?.id ?? '';
                r.events = ['player_left'];
                changed = true;
            }
            else if (action === 'disconnect' && (!body.connectionToken || p.connectionToken === body.connectionToken)) {
                p.lastSeen = Math.min(p.lastSeen, Date.now() - 21000);
                r.events = ['player_left'];
                changed = true;
            }
            else if (action === 'disconnect') { return { state: r, version: row.version }; }
            else {
                if (r.host !== user.id)
                    throw new AppError('HOST_ONLY', 403);
                if (action === 'settings') {
                    if (r.phase !== 'lobby')
                        throw new AppError('MATCH_IN_PROGRESS', 409);
                    r.settings = body.settings;
                    r.players.forEach(x => x.ready = false);
                    changed = true;
                }
                else if (action === 'start') {
                    if (r.phase !== 'lobby')
                        throw new AppError('MATCH_IN_PROGRESS', 409);
                    const disabled = (await rows(env, 'SELECT question_id FROM disabled_questions')).map((d: any) => d.question_id);
                    r.matchId = crypto.randomUUID();
                    r.questions = prepareGeography(generateQuestions(r.settings, r.matchId, [...r.previousQuestions, ...disabled], [], undefined, disabled));
                    r.phase = 'countdown';
                    r.round = 0;
                    r.answers = {};
                    r.answersCompleteAt = undefined;
                    r.startAt = Date.now() + 3000;
                    r.deadline = r.settings.timer ? r.startAt + r.settings.timer * 1000 : 0;
                    r.players.forEach(x => { x.score = 0; x.streak = 0; x.bestStreak = 0; x.results = []; x.correct = 0; });
                    r.events = ['game_started'];
                    changed = true;
                }
                else if (action === 'rematch') {
                    if (r.phase !== 'finished')
                        throw new AppError('MATCH_NOT_FINISHED', 409);
                    r.previousQuestions = r.questions.map(q => q.id);
                    r.questions = [];
                    r.phase = 'lobby';
                    r.answersCompleteAt = undefined;
                    r.players.forEach(x => { x.ready = false; x.score = 0; x.delta = 0; });
                    r.events = ['lobby'];
                    changed = true;
                }
                else if (action === 'advance') {
                    if (r.phase !== 'question' || r.settings.timer !== 0)
                        throw new AppError('INVALID_ACTION');
                    r.deadline = Date.now();
                    changed = true;
                }
                else if (action === 'bot') {
                    if (env.ENVIRONMENT !== 'development' || env.DEV_MULTIPLAYER_BOTS !== 'true')
                        throw new AppError('FORBIDDEN', 403);
                    if (r.phase !== 'lobby' || r.players.length >= 12)
                        throw new AppError('INVALID_ACTION');
                    r.players.push({ ...player({ id: 'bot-' + crypto.randomUUID(), name: 'Practice bot', avatar: 3 } as User), bot: true, ready: true });
                    changed = true;
                }
                else
                    throw new AppError('INVALID_ACTION');
            }
        }
        // Re-evaluate after the last submitted answer, not only on the next heartbeat.
        changed = tick(r, Date.now()) || changed;
        if (!changed) {
            await saveMatch(env, r);
            return { state: r, version: row.version };
        }
        r.updatedAt = Date.now();
        if (r.players.some(p => Date.now() - p.lastSeen < 45000))
            r.expiresAt = Date.now() + TTL;
        const updated = await run(env, 'UPDATE multiplayer_rooms SET state=?,version=version+1,updated_at=?,expires_at=? WHERE code=? AND version=?', JSON.stringify(r), r.updatedAt, r.expiresAt, code, row.version);
        if (updated.meta.changes) {
            await saveMatch(env, r);
            return { state: r, version: row.version + 1 };
        }
    }
    throw new AppError('ROOM_BUSY', 409);
}
export async function connectSocket(req: Request, env: Env, ctx?: {
    waitUntil: (p: Promise<any>) => void;
}) {
    checkOrigin(req);
    const user = await requireUser(req, env);
    const code = new URL(req.url).pathname.split('/')[3]?.toUpperCase();
    if (!code)
        throw new AppError('INVALID_ROOM_CODE');
    await mutateRoom(env, code, user, 'join');
    const connectionToken = crypto.randomUUID();
    await mutateRoom(env, code, user, 'connect', { connectionToken });
    const Pair = (globalThis as any).WebSocketPair;
    const pair = new Pair();
    const client = pair[0], server = pair[1];
    server.accept();
    let closed = false, busy = false, lastVersion = -1, lastHeartbeat = 0;
    let chain = Promise.resolve();
    let revealTimer: ReturnType<typeof setTimeout> | undefined;
    let messages = 0, windowStart = Date.now();
    const send = (x: any) => { if (!closed)
        try {
            server.send(JSON.stringify(x));
        }
        catch {
            close();
        } };
    const pump = async () => { if (busy || closed)
        return; busy = true; try {
        const { state, version } = await mutateRoom(env, code, null, 'get');
        if (state.players.find(p => p.id === user.id)?.connectionToken !== connectionToken) { send({ type: 'error', code: 'DUPLICATE_SESSION' }); close(); return; }
        if (version !== lastVersion || Date.now() - lastHeartbeat > 8000) {
            if (state.phase !== 'lobby' && state.phase !== 'finished') await measure(req, env, user, 'match_started', state.settings.mode, state.matchId);
            if (state.phase === 'finished') await measure(req, env, user, 'match_completed', state.settings.mode, state.matchId);
            send({ type: 'state', ...roomView(state, user.id) });
            lastVersion = version;
            clearTimeout(revealTimer);
            if (state.phase === 'question' && state.answersCompleteAt) revealTimer = setTimeout(pump, Math.max(1, state.answersCompleteAt - Date.now()));
            lastHeartbeat = Date.now();
        }
    }
    catch (e: any) {
        send({ type: 'error', code: e.code ?? 'SERVER_UNAVAILABLE' });
    }
    finally {
        busy = false;
    } };
    const interval = setInterval(pump, 750);
    function close() { if (closed)
        return; closed = true; clearInterval(interval); clearTimeout(revealTimer); try {
        server.close(1000, 'Disconnected');
    }
    catch { } const final = mutateRoom(env, code, user, 'disconnect', { connectionToken }).catch(() => { }); if (ctx)
        ctx.waitUntil(final); }
    server.addEventListener('close', close);
    server.addEventListener('error', close);
    server.addEventListener('message', (event: any) => { chain = chain.then(async () => { try {
        if (typeof event.data !== 'string' || event.data.length > 2048)
            throw new AppError('INVALID_MESSAGE');
        if (Date.now() - windowStart > 60000) {
            messages = 0;
            windowStart = Date.now();
        }
        if (++messages > 100)
            throw new AppError('TOO_MANY_REQUESTS', 429);
        const m = JSON.parse(event.data);
        const snapshot = await one(env, 'SELECT state FROM multiplayer_rooms WHERE code=?', code);
        if (JSON.parse(snapshot.state).players.find((p:any) => p.id === user.id)?.connectionToken !== connectionToken) throw new AppError('DUPLICATE_SESSION', 409);
        if (!['answer', 'ready', 'ping', 'start', 'rematch', 'advance'].includes(m.type))
            throw new AppError('INVALID_ACTION');
        const { state, version } = await mutateRoom(env, code, user, m.type, m);
        if (m.type === 'start') await measure(req, env, user, 'match_started', state.settings.mode, state.matchId);
        lastVersion = version;
        clearTimeout(revealTimer);
        if (state.phase === 'question' && state.answersCompleteAt) revealTimer = setTimeout(pump, Math.max(1, state.answersCompleteAt - Date.now()));
        send({ type: 'state', ...roomView(state, user.id) });
    }
    catch (e: any) {
        send({ type: 'error', code: e.code ?? 'INVALID_MESSAGE' });
    } }); });
    await pump();
    return new Response(null, { status: 101, webSocket: client } as any);
}
