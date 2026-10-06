// Opslag in D1: de volglijst, welke berichten al gemeld zijn en wat losse instellingen
// (eigenaar van de bot, Telegram-offset). De tabellen worden bij de eerste run aangemaakt.

export interface WatchEntry {
  symbol: string;
  name: string;
}

export interface FilterWord {
  filter: string;
  word: string;
}

export interface UniverseEntry {
  symbol: string;
  name: string;
  /** Marktwaarde in euro. */
  capEur: number;
  country: string;
}

/** Koersdoelen van analisten, in de eigen munt van het aandeel (GBX, SEK, EUR, ...). */
export interface TargetSnapshot {
  symbol: string;
  high: number;
  low: number;
  analysts: number;
  currency: string;
}

/** Een treffer van een woordfilter, bewaard voor het ochtendoverzicht. */
export interface EventRecord {
  /** Id van het nieuwsbericht. */
  id: string;
  filter: string;
  /** Aandeel uit de selectie, of het eerste aandeel bij het bericht; leeg als er geen is. */
  symbol: string;
  name: string;
  title: string;
  url: string;
  lang: string;
  published: number;
  /** Wanneer de bot het zag (seconden). */
  recordedAt?: number;
  /** Aanvullende gegevens uit het bericht, zoals het dividendbedrag (JSON). */
  extra?: string;
}

/** Iets met een datum: deadline van een bod, PDUFA-datum, eerste handelsdag, ex-dividend, ... */
export interface AgendaItem {
  /** Volgnummer om het te kunnen weghalen (/agendaweg). */
  nr?: number;
  /** Uniek per gebeurtenis, zodat hetzelfde bericht in twee talen één agendapunt geeft. */
  key: string;
  /** "2026-10-23" */
  date: string;
  /** Waar het vandaan komt: een filternaam, "dividend", "ipo" of "eigen". */
  kind: string;
  label: string;
  symbol: string;
  name: string;
  title: string;
  url: string;
}

/** Een notering op een beurs (primair of een tweede notering). */
export interface Listing {
  symbol: string;
  name: string;
  exchange: string;
  country: string;
  isin: string;
  primary: boolean;
  /** Wanneer de bot hem voor het eerst zag (seconden). */
  firstSeen?: number;
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

  listFilterWords(): Promise<FilterWord[]>;
  addFilterWord(filter: string, word: string): Promise<void>;
  addFilterWords(filter: string, words: string[]): Promise<void>;
  removeFilterWord(filter: string, word: string): Promise<boolean>;
  removeFilter(filter: string): Promise<number>;

  /** Schrijft een deel van de screener-selectie weg onder een ververs-id. */
  putUniverse(entries: UniverseEntry[], batch: string): Promise<void>;
  /** Haalt alles weg wat niet bij deze verversing hoort. */
  pruneUniverse(batch: string): Promise<void>;
  lookupUniverse(symbols: string[]): Promise<UniverseEntry[]>;
  countUniverse(): Promise<number>;

  getTargets(symbols: string[]): Promise<TargetSnapshot[]>;
  putTargets(rows: TargetSnapshot[], now: number): Promise<void>;

  /** Bewaart treffers; een bericht dat er al staat (zelfde id en filter) blijft ongewijzigd. */
  recordEvents(rows: EventRecord[], now: number): Promise<void>;
  /** Treffers die de bot sinds dit moment heeft gezien. */
  eventsSince(since: number): Promise<EventRecord[]>;
  /** Treffers van één filter voor deze aandelen, sinds dit moment (voor clusters van insiders). */
  eventsForSymbols(filter: string, symbols: string[], since: number): Promise<EventRecord[]>;
  /** Treffers van deze filters waarvan het bericht nog niet is gelezen (nieuwste eerst). */
  uncheckedEvents(filters: string[], limit: number): Promise<EventRecord[]>;
  markEventsChecked(ids: string[], extra?: Record<string, string>): Promise<void>;
  pruneEvents(olderThan: number): Promise<void>;

  addAgenda(items: AgendaItem[], now: number): Promise<void>;
  /** Agenda van `from` tot en met `to` ("2026-10-06"), op datum. */
  listAgenda(from: string, to: string): Promise<AgendaItem[]>;
  removeAgenda(nr: number): Promise<AgendaItem | null>;
  pruneAgenda(before: string): Promise<void>;

  /** Nieuwe noteringen toevoegen; wat er al staat blijft ongewijzigd (dus ook de eerste keer gezien). */
  putListings(rows: Listing[], now: number): Promise<void>;
  listingsSince(since: number): Promise<Listing[]>;
  listingsByIsin(isins: string[]): Promise<Listing[]>;
}

const SCHEMA = [
  "CREATE TABLE IF NOT EXISTS watch (symbol TEXT PRIMARY KEY, name TEXT NOT NULL DEFAULT '', added_at INTEGER NOT NULL)",
  "CREATE TABLE IF NOT EXISTS seen (id TEXT PRIMARY KEY, symbol TEXT NOT NULL, seen_at INTEGER NOT NULL)",
  "CREATE INDEX IF NOT EXISTS seen_at_idx ON seen (seen_at)",
  "CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS filter_words (filter TEXT NOT NULL, word TEXT NOT NULL, PRIMARY KEY (filter, word))",
  "CREATE TABLE IF NOT EXISTS universe (symbol TEXT PRIMARY KEY, name TEXT NOT NULL, cap_eur REAL NOT NULL, country TEXT NOT NULL, batch TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS targets (symbol TEXT PRIMARY KEY, high REAL NOT NULL, low REAL NOT NULL, analysts INTEGER NOT NULL, currency TEXT NOT NULL, updated_at INTEGER NOT NULL)",
  "CREATE TABLE IF NOT EXISTS events (id TEXT NOT NULL, filter TEXT NOT NULL, symbol TEXT NOT NULL, name TEXT NOT NULL, title TEXT NOT NULL, url TEXT NOT NULL, lang TEXT NOT NULL, published INTEGER NOT NULL, recorded_at INTEGER NOT NULL, checked INTEGER NOT NULL DEFAULT 0, extra TEXT NOT NULL DEFAULT '', PRIMARY KEY (id, filter))",
  "CREATE INDEX IF NOT EXISTS events_recorded_idx ON events (recorded_at)",
  "CREATE TABLE IF NOT EXISTS agenda (key TEXT PRIMARY KEY, date TEXT NOT NULL, kind TEXT NOT NULL, label TEXT NOT NULL, symbol TEXT NOT NULL, name TEXT NOT NULL, title TEXT NOT NULL, url TEXT NOT NULL, created_at INTEGER NOT NULL)",
  "CREATE INDEX IF NOT EXISTS agenda_date_idx ON agenda (date)",
  "CREATE TABLE IF NOT EXISTS listings (symbol TEXT PRIMARY KEY, name TEXT NOT NULL, exchange TEXT NOT NULL, country TEXT NOT NULL, isin TEXT NOT NULL, is_primary INTEGER NOT NULL, first_seen INTEGER NOT NULL)",
  "CREATE INDEX IF NOT EXISTS listings_seen_idx ON listings (first_seen)",
  "CREATE INDEX IF NOT EXISTS listings_isin_idx ON listings (isin)",
];

const EVENT_COLUMNS =
  "id, filter, symbol, name, title, url, lang, published, recorded_at AS recordedAt, extra";
const AGENDA_COLUMNS = "rowid AS nr, key, date, kind, label, symbol, name, title, url";
const LISTING_COLUMNS = "symbol, name, exchange, country, isin, is_primary AS isPrimary, first_seen AS firstSeen";

function listing(row: Omit<Listing, "primary"> & { isPrimary: number }): Listing {
  const { isPrimary, ...rest } = row;
  return { ...rest, primary: isPrimary === 1 };
}

// Workers Free staat 50 databasevragen per aanroep toe. Lijsten gaan daarom als één
// JSON-parameter naar binnen (json_each) in plaats van als tientallen losse vragen, en de
// instellingen worden één keer per run in hun geheel gelezen.

let schemaReady: Promise<unknown> | null = null;

export class D1Store implements Store {
  private readonly db: D1Database;
  private settings: Map<string, string> | null = null;

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
    if (!ids.length) return new Set();
    await this.ready();
    const { results } = await this.db
      .prepare("SELECT id FROM seen WHERE id IN (SELECT value FROM json_each(?))")
      .bind(JSON.stringify(ids))
      .all<{ id: string }>();
    return new Set(results.map((row) => row.id));
  }

  async markSeen(ids: string[], symbol: string, now: number): Promise<void> {
    if (!ids.length) return;
    await this.ready();
    await this.db
      .prepare("INSERT OR IGNORE INTO seen (id, symbol, seen_at) SELECT value, ?, ? FROM json_each(?)")
      .bind(symbol, now, JSON.stringify(ids))
      .run();
  }

  async pruneSeen(olderThan: number): Promise<void> {
    await this.ready();
    await this.db.prepare("DELETE FROM seen WHERE seen_at < ?").bind(olderThan).run();
  }

  private async loadSettings(): Promise<Map<string, string>> {
    if (!this.settings) {
      await this.ready();
      const { results } = await this.db.prepare("SELECT key, value FROM settings").all<{ key: string; value: string }>();
      this.settings = new Map(results.map((row) => [row.key, row.value]));
    }
    return this.settings;
  }

  async getSetting(key: string): Promise<string | null> {
    return (await this.loadSettings()).get(key) ?? null;
  }

  async setSetting(key: string, value: string): Promise<void> {
    const settings = await this.loadSettings();
    await this.db
      .prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
      .bind(key, value)
      .run();
    settings.set(key, value);
  }

  async deleteSetting(key: string): Promise<void> {
    await this.ready();
    await this.db.prepare("DELETE FROM settings WHERE key = ?").bind(key).run();
    this.settings?.delete(key);
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

  async listFilterWords(): Promise<FilterWord[]> {
    await this.ready();
    const { results } = await this.db.prepare("SELECT filter, word FROM filter_words ORDER BY filter, word").all<FilterWord>();
    return results;
  }

  async addFilterWord(filter: string, word: string): Promise<void> {
    await this.addFilterWords(filter, [word]);
  }

  async addFilterWords(filter: string, words: string[]): Promise<void> {
    if (!words.length) return;
    await this.ready();
    await this.db
      .prepare("INSERT OR IGNORE INTO filter_words (filter, word) SELECT ?, value FROM json_each(?)")
      .bind(filter, JSON.stringify(words))
      .run();
  }

  async removeFilterWord(filter: string, word: string): Promise<boolean> {
    await this.ready();
    const result = await this.db
      .prepare("DELETE FROM filter_words WHERE filter = ? AND lower(word) = lower(?)")
      .bind(filter, word)
      .run();
    return (result.meta.changes ?? 0) > 0;
  }

  async removeFilter(filter: string): Promise<number> {
    await this.ready();
    const result = await this.db.prepare("DELETE FROM filter_words WHERE filter = ?").bind(filter).run();
    return result.meta.changes ?? 0;
  }

  async putUniverse(entries: UniverseEntry[], batch: string): Promise<void> {
    if (!entries.length) return;
    await this.ready();
    const rows = JSON.stringify(entries.map((e) => [e.symbol, e.name, e.capEur, e.country]));
    // "WHERE true" is nodig: zonder WHERE leest SQLite de ON CONFLICT als deel van de SELECT.
    await this.db
      .prepare(
        "INSERT INTO universe (symbol, name, cap_eur, country, batch) " +
          "SELECT json_extract(value, '$[0]'), json_extract(value, '$[1]'), json_extract(value, '$[2]'), " +
          "json_extract(value, '$[3]'), ? FROM json_each(?) WHERE true " +
          "ON CONFLICT(symbol) DO UPDATE SET name = excluded.name, cap_eur = excluded.cap_eur, " +
          "country = excluded.country, batch = excluded.batch",
      )
      .bind(batch, rows)
      .run();
  }

  async pruneUniverse(batch: string): Promise<void> {
    await this.ready();
    await this.db.prepare("DELETE FROM universe WHERE batch != ?").bind(batch).run();
  }

  async lookupUniverse(symbols: string[]): Promise<UniverseEntry[]> {
    if (!symbols.length) return [];
    await this.ready();
    const { results } = await this.db
      .prepare(
        "SELECT symbol, name, cap_eur AS capEur, country FROM universe WHERE symbol IN (SELECT value FROM json_each(?))",
      )
      .bind(JSON.stringify(symbols))
      .all<UniverseEntry>();
    return results;
  }

  async countUniverse(): Promise<number> {
    await this.ready();
    const row = await this.db.prepare("SELECT COUNT(*) AS n FROM universe").first<{ n: number }>();
    return row?.n ?? 0;
  }

  async getTargets(symbols: string[]): Promise<TargetSnapshot[]> {
    if (!symbols.length) return [];
    await this.ready();
    const { results } = await this.db
      .prepare(
        "SELECT symbol, high, low, analysts, currency FROM targets WHERE symbol IN (SELECT value FROM json_each(?))",
      )
      .bind(JSON.stringify(symbols))
      .all<TargetSnapshot>();
    return results;
  }

  async putTargets(rows: TargetSnapshot[], now: number): Promise<void> {
    if (!rows.length) return;
    await this.ready();
    const data = JSON.stringify(rows.map((r) => [r.symbol, r.high, r.low, r.analysts, r.currency]));
    await this.db
      .prepare(
        "INSERT INTO targets (symbol, high, low, analysts, currency, updated_at) " +
          "SELECT json_extract(value, '$[0]'), json_extract(value, '$[1]'), json_extract(value, '$[2]'), " +
          "json_extract(value, '$[3]'), json_extract(value, '$[4]'), ? FROM json_each(?) WHERE true " +
          "ON CONFLICT(symbol) DO UPDATE SET high = excluded.high, low = excluded.low, analysts = excluded.analysts, " +
          "currency = excluded.currency, updated_at = excluded.updated_at",
      )
      .bind(now, data)
      .run();
  }

  async recordEvents(rows: EventRecord[], now: number): Promise<void> {
    if (!rows.length) return;
    await this.ready();
    const data = JSON.stringify(rows.map((r) => [r.id, r.filter, r.symbol, r.name, r.title, r.url, r.lang, r.published]));
    await this.db
      .prepare(
        "INSERT OR IGNORE INTO events (id, filter, symbol, name, title, url, lang, published, recorded_at) " +
          "SELECT json_extract(value, '$[0]'), json_extract(value, '$[1]'), json_extract(value, '$[2]'), " +
          "json_extract(value, '$[3]'), json_extract(value, '$[4]'), json_extract(value, '$[5]'), " +
          "json_extract(value, '$[6]'), json_extract(value, '$[7]'), ? FROM json_each(?)",
      )
      .bind(now, data)
      .run();
  }

  async eventsSince(since: number): Promise<EventRecord[]> {
    await this.ready();
    const { results } = await this.db
      .prepare(`SELECT ${EVENT_COLUMNS} FROM events WHERE recorded_at >= ? ORDER BY published DESC LIMIT 2000`)
      .bind(since)
      .all<EventRecord>();
    return results;
  }

  async eventsForSymbols(filter: string, symbols: string[], since: number): Promise<EventRecord[]> {
    if (!symbols.length) return [];
    await this.ready();
    const { results } = await this.db
      .prepare(
        `SELECT ${EVENT_COLUMNS} FROM events WHERE filter = ? AND recorded_at >= ? ` +
          "AND symbol IN (SELECT value FROM json_each(?)) ORDER BY published DESC",
      )
      .bind(filter, since, JSON.stringify(symbols))
      .all<EventRecord>();
    return results;
  }

  async uncheckedEvents(filters: string[], limit: number): Promise<EventRecord[]> {
    if (!filters.length) return [];
    await this.ready();
    const { results } = await this.db
      .prepare(
        `SELECT ${EVENT_COLUMNS} FROM events WHERE checked = 0 AND filter IN (SELECT value FROM json_each(?)) ` +
          "ORDER BY recorded_at DESC LIMIT ?",
      )
      .bind(JSON.stringify(filters), limit)
      .all<EventRecord>();
    return results;
  }

  async markEventsChecked(ids: string[], extra: Record<string, string> = {}): Promise<void> {
    if (!ids.length) return;
    await this.ready();
    const rows = JSON.stringify(ids.map((id) => [id, extra[id] ?? ""]));
    await this.db
      .prepare(
        "UPDATE events SET checked = 1, extra = CASE WHEN m.extra != '' THEN m.extra ELSE events.extra END " +
          "FROM (SELECT json_extract(value, '$[0]') AS id, json_extract(value, '$[1]') AS extra FROM json_each(?)) AS m " +
          "WHERE events.id = m.id",
      )
      .bind(rows)
      .run();
  }

  async pruneEvents(olderThan: number): Promise<void> {
    await this.ready();
    await this.db.prepare("DELETE FROM events WHERE recorded_at < ?").bind(olderThan).run();
  }

  async addAgenda(items: AgendaItem[], now: number): Promise<void> {
    if (!items.length) return;
    await this.ready();
    const data = JSON.stringify(items.map((i) => [i.key, i.date, i.kind, i.label, i.symbol, i.name, i.title, i.url]));
    await this.db
      .prepare(
        "INSERT OR IGNORE INTO agenda (key, date, kind, label, symbol, name, title, url, created_at) " +
          "SELECT json_extract(value, '$[0]'), json_extract(value, '$[1]'), json_extract(value, '$[2]'), " +
          "json_extract(value, '$[3]'), json_extract(value, '$[4]'), json_extract(value, '$[5]'), " +
          "json_extract(value, '$[6]'), json_extract(value, '$[7]'), ? FROM json_each(?)",
      )
      .bind(now, data)
      .run();
  }

  async listAgenda(from: string, to: string): Promise<AgendaItem[]> {
    await this.ready();
    const { results } = await this.db
      .prepare(`SELECT ${AGENDA_COLUMNS} FROM agenda WHERE date >= ? AND date <= ? ORDER BY date, symbol, rowid LIMIT 500`)
      .bind(from, to)
      .all<AgendaItem>();
    return results;
  }

  async removeAgenda(nr: number): Promise<AgendaItem | null> {
    await this.ready();
    const row = await this.db.prepare(`SELECT ${AGENDA_COLUMNS} FROM agenda WHERE rowid = ?`).bind(nr).first<AgendaItem>();
    if (!row) return null;
    await this.db.prepare("DELETE FROM agenda WHERE rowid = ?").bind(nr).run();
    return row;
  }

  async pruneAgenda(before: string): Promise<void> {
    await this.ready();
    await this.db.prepare("DELETE FROM agenda WHERE date < ?").bind(before).run();
  }

  async putListings(rows: Listing[], now: number): Promise<void> {
    if (!rows.length) return;
    await this.ready();
    const data = JSON.stringify(rows.map((r) => [r.symbol, r.name, r.exchange, r.country, r.isin, r.primary ? 1 : 0]));
    await this.db
      .prepare(
        "INSERT OR IGNORE INTO listings (symbol, name, exchange, country, isin, is_primary, first_seen) " +
          "SELECT json_extract(value, '$[0]'), json_extract(value, '$[1]'), json_extract(value, '$[2]'), " +
          "json_extract(value, '$[3]'), json_extract(value, '$[4]'), json_extract(value, '$[5]'), ? FROM json_each(?)",
      )
      .bind(now, data)
      .run();
  }

  async listingsSince(since: number): Promise<Listing[]> {
    await this.ready();
    const { results } = await this.db
      .prepare(`SELECT ${LISTING_COLUMNS} FROM listings WHERE first_seen >= ? ORDER BY first_seen LIMIT 500`)
      .bind(since)
      .all<Omit<Listing, "primary"> & { isPrimary: number }>();
    return results.map(listing);
  }

  async listingsByIsin(isins: string[]): Promise<Listing[]> {
    const wanted = isins.filter(Boolean);
    if (!wanted.length) return [];
    await this.ready();
    const { results } = await this.db
      .prepare(`SELECT ${LISTING_COLUMNS} FROM listings WHERE isin IN (SELECT value FROM json_each(?))`)
      .bind(JSON.stringify(wanted))
      .all<Omit<Listing, "primary"> & { isPrimary: number }>();
    return results.map(listing);
  }
}
