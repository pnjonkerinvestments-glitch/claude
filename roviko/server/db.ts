import type { Env } from './types';
export function db(env: Env) { if (!env.DB)
    throw new Error('DATABASE_UNAVAILABLE'); return env.DB; }
export async function one(env: Env, sql: string, ...args: any[]) { return db(env).prepare(sql).bind(...args).first(); }
export async function rows(env: Env, sql: string, ...args: any[]) { return (await db(env).prepare(sql).bind(...args).all()).results ?? []; }
export async function run(env: Env, sql: string, ...args: any[]) { return db(env).prepare(sql).bind(...args).run(); }
export async function batch(env: Env, statements: {
    sql: string;
    args: any[];
}[]) { return db(env).batch(statements.map(s => db(env).prepare(s.sql).bind(...s.args))); }
/**
 * The same D1 binding, counting every query it runs. A WebSocket stays one Worker invocation for its
 * whole life, and Cloudflare caps D1 queries per invocation (50 on the Free plan), so room sockets
 * watch this count and hand the player over to a fresh connection before the cap is reached.
 */
export function countingDB(db: any, add: (n: number) => void) {
    const wrap = (st: any): any => ({ __inner: st, bind: (...a: any[]) => wrap(st.bind(...a)), first: (...a: any[]) => { add(1); return st.first(...a); }, all: () => { add(1); return st.all(); }, run: () => { add(1); return st.run(); }, raw: (...a: any[]) => { add(1); return st.raw(...a); } });
    return { prepare: (sql: string) => wrap(db.prepare(sql)), batch: (list: any[]) => { add(list.length); return db.batch(list.map((s: any) => s.__inner ?? s)); }, exec: (sql: string) => { add(1); return db.exec(sql); }, dump: () => db.dump() };
}
