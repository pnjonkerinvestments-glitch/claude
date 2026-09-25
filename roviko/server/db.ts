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
