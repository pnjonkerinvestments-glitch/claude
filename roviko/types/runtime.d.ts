interface Fetcher {
    fetch(request: Request): Promise<Response>;
}
interface D1Database {
    prepare(sql: string): {
        bind(...args: unknown[]): any;
        first<T = unknown>(): Promise<T>;
        all<T = unknown>(): Promise<{
            results: T[];
        }>;
        run(): Promise<any>;
    };
    batch(statements: any[]): Promise<any[]>;
}
declare module 'cloudflare:workers' {
    export const env: {
        DB: D1Database;
        [key: string]: any;
    };
}
