import { dailyScore, dailyRoundPoints, COMPETITION_SUFFIX } from '../lib/daily-scoring';
import { recordCompetition } from './competition';
import { validAnswer } from '../lib/game-engine/validate-answer';
import { reviewSession } from './reviews';
import { dailyContent } from './daily-content';
import { prepareGeography, enrichMapFeedback } from './geography';
import { one, rows, run, batch } from './db';
import { AppError } from './auth';
import { generateQuestions, publicQuestion, type Settings } from '../lib/game-engine/questions';
import { learningSolution, evaluateLearning } from '../lib/game-engine/learning';
import { resultStatement } from './stats';
import type { Solo, Env, User } from './types';
function learningState(s: Solo): Solo {
    if (s.competition) return {...s, score:dailyScore(s)};
    return { ...s, settings: { ...s.settings, timer: 0 }, score: 0, xp: 0, personalBest: 0, answers: s.answers.map(a => ({ ...a, points: 0, risk: 0 })) };
}
export function soloView(stored: Solo) {
    const s = learningState(stored), q = s.questions[s.round];
    const cluesShown = s.cluesShown?.[s.round] ?? 1;
    const question: any = s.phase === 'finished' ? null : { ...publicQuestion(q,s.phase === 'reveal'), cluesShown, solution: learningSolution(q) };
    if(question && q.flag && (s.competition || /^[a-z]+:[0-9a-f-]{36}$/.test(q.id))) question.flagUrl='/api/game-asset/'+s.id+'/'+s.round;
    if (question && s.competition) {
        delete question.solution;
        question.dailyPoints = true;
        if (q.clues) { question.clueCount = q.clues.length; question.clues = q.clues.slice(0,s.phase === 'reveal' ? 4 : cluesShown); question.availablePoints = dailyRoundPoints('trail',{correct:true,cluesUsed:cluesShown}); }
        if (q.flag) { question.flag = 'private'; question.flagUrl = '/api/game-asset/' + s.id + '/' + s.round; }
    }
    // While the player reads the answer, hand the browser the next flag's opaque address so it can load in the background.
    // Only for plain flag questions: in Clue Trail the flag is the last hidden clue and stays private until earned.
    const upcoming = s.phase === 'reveal' ? s.questions[s.round + 1] : undefined;
    const preloadFlag = upcoming?.flag && upcoming.mode === 'flags'
      ? (s.competition || /^[a-z]+:[0-9a-f-]{36}$/.test(upcoming.id) ? '/api/game-asset/' + s.id + '/' + (s.round + 1) : '/api/flag/' + encodeURIComponent(String(publicQuestion(upcoming).flag)))
      : undefined;
    return { id: s.id, preloadFlag, practice: !!s.practice, settings: s.settings, phase: s.phase, round: s.round, total: s.questions.length, startAt: s.startAt, deadline: null, competition:s.competition, score:s.score, streak: s.streak, bestStreak: s.bestStreak, question, feedback: s.phase === 'reveal' ? s.answers[s.round] : null, answers: s.phase === 'finished' ? s.answers : undefined, xp: 0, daily: s.daily, serverTime: Date.now(), learning: true, datasetVersion: s.datasetVersion };
}
export async function startSolo(env: Env, user: User, settings: Settings, practice = false, focus?: string, competition = false) {
    settings = { ...settings, timer: 0 };
    const trail = settings.mode === 'daily-trail';
    const daily = settings.mode === 'daily' || trail ? new Date().toISOString().slice(0, 10) : null;
    const ranked = !!daily && competition;
    const kind = (trail ? 'daily-trail' : settings.mode) + (ranked ? COMPETITION_SUFFIX : '');
    if (daily) {
        settings = { mode: trail ? 'trail' : 'daily', count: 5, timer: 0, difficulty: 'medium', region: 'World' };
        const existing = await one(env, "SELECT state FROM game_sessions WHERE user_id=? AND date=? AND kind=? ORDER BY created_at DESC LIMIT 1", user.id, daily, kind);
        if (existing)
            return soloView(JSON.parse(existing.state));
    }
    const disabled = (await rows(env, 'SELECT question_id FROM disabled_questions')).map((d: any) => d.question_id);
    const weak = practice ? (await rows(env, 'SELECT country_id FROM concept_performance WHERE user_id=? AND correct<attempts ORDER BY (1.0*correct/attempts) LIMIT 20', user.id)).map((x: any) => x.country_id) : [];
    const id = crypto.randomUUID();
    const content = daily ? await dailyContent(env, daily, kind, seed => ({ questions: prepareGeography(generateQuestions(settings, seed, disabled, [], undefined, disabled)).map(q => ranked ? {...q,id:q.mode+':'+crypto.randomUUID()} : q), settings })) : { questions: prepareGeography(generateQuestions(settings, id, disabled, weak, focus, disabled)), settings, datasetVersion: undefined };
    if (content.questions.some((q:any) => disabled.includes(q.id))) throw new AppError('QUESTION_UNAVAILABLE',503);
    const s: Solo = { id, ...(ranked ? {competition:{version:1,mode:trail?'trail':'daily'} as const} : {}), datasetVersion: content.datasetVersion, questions: content.questions, settings: content.settings, round: 0, startAt: Date.now(), startedAt: Date.now(), score: 0, streak: 0, bestStreak: 0, answers: [], phase: 'question', daily, xp: 0, personalBest: 0 };
    const inserted = await run(env, 'INSERT OR IGNORE INTO game_sessions(id,user_id,kind,date,state,created_at) VALUES (?,?,?,?,?,?)', id, user.id, kind, daily, JSON.stringify(s), Date.now());
    if (!inserted.meta.changes && daily) {
        const saved = await one(env, "SELECT state FROM game_sessions WHERE user_id=? AND date=? AND kind=?", user.id, daily, kind);
        return soloView(JSON.parse(saved.state));
    }
    return soloView(s);
}
export async function soloAction(env: Env, user: User, id: string, action: string, body: any) {
    const row = await one(env, 'SELECT * FROM game_sessions WHERE id=? AND user_id=?', id, user.id);
    if (!row || row.kind.startsWith('puzzle:') || row.kind.startsWith('rank'))
        throw new AppError('GAME_NOT_FOUND', 404);
    const s: Solo = learningState(JSON.parse(row.state));
    if (action === 'get') { await reviewSession(env, user, s, row.created_at); if(s.phase==='finished') await recordSolo(env,user,s); return soloView(s); }
    if (action === 'hint') {
        if (s.phase !== 'question' || body.round !== s.round || !s.questions[s.round].clues || !Number.isInteger(body.count) || body.count < 1 || body.count > 4) throw new AppError('INVALID_INPUT');
        s.cluesShown ??= {}; s.cluesShown[s.round] = Math.max(s.cluesShown[s.round] ?? 1, body.count);
    }
    else if (action === 'answer') {
        if (s.phase !== 'question' || body.round !== s.round)
            throw new AppError('ANSWER_LOCKED', 409);
        const elapsed = Date.now() - s.startAt;
        if (elapsed < 0)
            throw new AppError('ROUND_NOT_STARTED', 409);
        const value = body.answer;
        if (!validAnswer(s.questions[s.round], value)) throw new AppError('INVALID_INPUT');
        const result = enrichMapFeedback(s.questions[s.round], value, { ...evaluateLearning(s.questions[s.round], value, s.streak), responseTime: Math.max(0, elapsed) });
        s.answers.push({ ...result, value, at: Date.now(), cluesUsed: s.questions[s.round].clues ? s.cluesShown?.[s.round] ?? 1 : undefined, questionId: s.questions[s.round].id });
        if(s.competition) { const a=s.answers.at(-1)!; a.points=dailyRoundPoints(s.competition.mode,a); s.score=dailyScore(s); }
        s.streak = result.streak;
        s.bestStreak = Math.max(s.bestStreak, s.streak);
        s.phase = 'reveal';
    }
    else if (action === 'next') {
        if (s.phase !== 'reveal')
            throw new AppError('ANSWER_REQUIRED', 409);
        if (s.round + 1 === s.questions.length) {
            s.phase = 'finished';
        }
        else {
            s.round++;
            s.startAt = Date.now();
            s.phase = 'question';
        }
    }
    else
        throw new AppError('INVALID_ACTION');
    const updated = await run(env, 'UPDATE game_sessions SET state=?,version=version+1,score=?,completed=? WHERE id=? AND version=?', JSON.stringify(s), s.score, s.phase === 'finished' ? 1 : 0, id, row.version);
    if (!updated.meta.changes)
        throw new AppError('STATE_CHANGED', 409);
    if (action === 'answer') {
        const a = s.answers[s.round];
        await run(env, 'INSERT OR IGNORE INTO answers(session_id,round,user_id,question_id,country_id,mode,answer,correct,points,response_time,risk,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)', id, s.round, user.id, a.questionId, a.countryId, a.mode, JSON.stringify(a.value ?? null), +a.correct, a.points, a.responseTime, a.risk, Date.now());
    }
    if (action === 'answer') await reviewSession(env, user, s, row.created_at);
    if (s.phase === 'finished')
        await recordSolo(env, user, s);
    return soloView(s);
}
export async function recordSolo(env: Env, user: User, stored: Solo) {
    const s = learningState(stored);
    const statements = [resultStatement(s.id, user.id, s), ...s.answers.map((a: any, i: number) => ({ sql: 'INSERT OR IGNORE INTO answers(session_id,round,user_id,question_id,country_id,mode,answer,correct,points,response_time,risk,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)', args: [s.id, i, user.id, a.questionId, a.countryId, a.mode, JSON.stringify(a.value ?? null), +a.correct, a.points, a.responseTime, a.risk, Date.now()] }))];
    if (s.daily)
        statements.push({ sql: 'INSERT OR IGNORE INTO daily_challenge_results(user_id,date,result_id,score) VALUES (?,?,?,?)', args: [user.id, s.daily, s.id, s.score] });
    await batch(env, statements);
    await recordCompetition(env,user,s);
    // Derive practice aggregates from immutable answers, so retried completion is idempotent.
    for (const key of new Set(s.answers.map(a => a.countryId + ':' + a.mode))) {
        const [country, mode] = key.split(':');
        await run(env, `INSERT INTO concept_performance(user_id,country_id,mode,correct,attempts) SELECT ?,?,?,COALESCE(SUM(correct),0),COUNT(*) FROM answers WHERE user_id=? AND country_id=? AND mode=? ON CONFLICT(user_id,country_id,mode) DO UPDATE SET correct=excluded.correct,attempts=excluded.attempts`, user.id, country, mode, user.id, country, mode);
    }
}
