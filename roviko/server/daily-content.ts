import { one, run } from './db';
import type { Env } from './types';
export const DATASET_VERSION = 'atlas-2026-09-22-r5';
export const utcDate = (time = Date.now()) => new Date(time).toISOString().slice(0, 10);
/** One published content snapshot per UTC day and mode. Never rewritten on deploy.
 * Adopt already-started content when upgrading from releases without snapshots. */
export async function dailyContent(env: Env, date: string, kind: string, generate: (seed: string) => any) {
    let saved = await one(env, 'SELECT content,dataset_version FROM daily_content WHERE date=? AND kind=?', date, kind);
    if (!saved) {
        const old = await one(env, 'SELECT state FROM game_sessions WHERE date=? AND kind=? ORDER BY created_at LIMIT 1', date, kind);
        const previous = old ? JSON.parse(old.state) : null;
        const content = previous ? { questions: previous.questions, board: previous.board ?? null, settings: previous.settings } : generate('daily:' + date + ':' + kind + ':' + DATASET_VERSION);
        await run(env, 'INSERT OR IGNORE INTO daily_content(date,kind,dataset_version,content,created_at) VALUES (?,?,?,?,?)', date, kind, previous ? 'legacy-v1' : DATASET_VERSION, JSON.stringify(content), Date.now());
        saved = await one(env, 'SELECT content,dataset_version FROM daily_content WHERE date=? AND kind=?', date, kind);
    }
    return { ...JSON.parse(saved.content), datasetVersion: saved.dataset_version };
}
