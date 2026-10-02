// Opslag in D1: de volglijst, welke berichten al gemeld zijn en wat losse instellingen
// (eigenaar van de bot, Telegram-offset). De tabellen worden bij de eerste run aangemaakt.

export interface WatchEntry {
  symbol: string;
  name: string;
}

export interface Store {
  listWatch(): Promise<WatchEntry[]>;
  addWatch(entry: WatchEntry): Promise<void>;
  removeWatch(symbol: string): Promise<boolean>;
  /** Geeft terug welke van deze ids al eerder gezien zijn. */
  seenIds(ids: string[]): Promise<Set<string>>;
  markSeen(ids: string[], symbol: string, now: number): Promise<void>;
  pruneSeen(olderThan: number): Promise<void>;
  getSetting(key: string): Promise<string | null>;
  setSetting(key: string, value: string): Promise<void>;
  deleteSetting(key: string): Promise<void>;
  /** Neemt een slot voor `ttl` seconden; false als een andere run het al heeft. */
  tryLock(key: string, now: number, ttl: number): Promise<boolean>;
}

const SCHEMA = [
  "CREATE TABLE IF NOT EXISTS watch (symbol TEXT PRIMARY KEY, name TEXT NOT NULL DEFAULT '', added_at INTEGER NOT NULL)",
  "CREATE TABLE IF NOT EXISTS seen (id TEXT PRIMARY KEY, symbol TEXT NOT NULL, seen_at INTEGER NOT NULL)",
  "CREATE INDEX IF NOT EXISTS seen_at_idx ON seen (seen_at)",
  "CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)",
];

// D1 staat maximaal 100 gebonden parameters per query toe.
const CHUNK = 90;

function chunks<T>(list: T[], size = CHUNK): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

let schemaReady: Promise<unknown> | null = null;

export class D1Store implements Store {
  private readonly db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  private ready(): Promise<unknown> {
    schemaReady ??= this.db.batch(SCHEMA.map((sql) => this.db.prepare(sql))).catch((error) => {
      schemaReady = null;
      throw error;
    });
    return schemaReady;
  }

  async listWatch(): Promise<WatchEntry[]> {
    await this.ready();
    const { results } = await this.db.prepare("SELECT symbol, name FROM watch ORDER BY added_at, symbol").all<WatchEntry>();
    return results;
  }

  async addWatch(entry: WatchEntry): Promise<void> {
    await this.ready();
    await this.db
      .prepare("INSERT INTO watch (symbol, name, added_at) VALUES (?, ?, ?) ON CONFLICT(symbol) DO UPDATE SET name = excluded.name")
      .bind(entry.symbol, entry.name, Date.now())
      .run();
  }

  async removeWatch(symbol: string): Promise<boolean> {
    await this.ready();
    const result = await this.db.prepare("DELETE FROM watch WHERE symbol = ?").bind(symbol).run();
    return (result.meta.changes ?? 0) > 0;
  }

  async seenIds(ids: string[]): Promise<Set<string>> {
    await this.ready();
    const seen = new Set<string>();
    for (const part of chunks(ids)) {
      const placeholders = part.map(() => "?").join(",");
      const { results } = await this.db
        .prepare(`SELECT id FROM seen WHERE id IN (${placeholders})`)
        .bind(...part)
        .all<{ id: string }>();
      for (const row of results) seen.add(row.id);
    }
    return seen;
  }

  async markSeen(ids: string[], symbol: string, now: number): Promise<void> {
    if (!ids.length) return;
    await this.ready();
    const statement = this.db.prepare("INSERT OR IGNORE INTO seen (id, symbol, seen_at) VALUES (?, ?, ?)");
    await this.db.batch(ids.map((id) => statement.bind(id, symbol, now)));
  }

  async pruneSeen(olderThan: number): Promise<void> {
    await this.ready();
    await this.db.prepare("DELETE FROM seen WHERE seen_at < ?").bind(olderThan).run();
  }

  async getSetting(key: string): Promise<string | null> {
    await this.ready();
    const row = await this.db.prepare("SELECT value FROM settings WHERE key = ?").bind(key).first<{ value: string }>();
    return row?.value ?? null;
  }

  async setSetting(key: string, value: string): Promise<void> {
    await this.ready();
    await this.db
      .prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
      .bind(key, value)
      .run();
  }

  async deleteSetting(key: string): Promise<void> {
    await this.ready();
    await this.db.prepare("DELETE FROM settings WHERE key = ?").bind(key).run();
  }

  async tryLock(key: string, now: number, ttl: number): Promise<boolean> {
    await this.ready();
    // Eén statement, dus atomair: alleen schrijven als er geen slot is of het oude verlopen is.
    const result = await this.db
      .prepare(
        "INSERT INTO settings (key, value) VALUES (?1, ?2) " +
          "ON CONFLICT(key) DO UPDATE SET value = excluded.value WHERE CAST(settings.value AS INTEGER) <= ?3",
      )
      .bind(key, String(now + ttl), now)
      .run();
    return (result.meta.changes ?? 0) > 0;
  }
}
