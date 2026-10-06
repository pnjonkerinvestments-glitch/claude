import type { AgendaItem, EventRecord, FilterWord, Listing, Store, TargetSnapshot, UniverseEntry, WatchEntry } from "../src/store.ts";
import { Telegram } from "../src/telegram.ts";
import type { Fetch } from "../src/tradingview.ts";
import { loadConfig } from "../src/config.ts";

export class MemoryStore implements Store {
  watch: Array<WatchEntry & { order: number }> = [];
  seen = new Map<string, number>();
  settings = new Map<string, string>();
  private order = 0;

  async listWatch() {
    return [...this.watch].sort((a, b) => a.order - b.order).map(({ symbol, name }) => ({ symbol, name }));
  }
  async addWatch(entry: WatchEntry) {
    const existing = this.watch.find((w) => w.symbol === entry.symbol);
    if (existing) existing.name = entry.name;
    else this.watch.push({ ...entry, order: this.order++ });
  }
  async removeWatch(symbol: string) {
    const before = this.watch.length;
    this.watch = this.watch.filter((w) => w.symbol !== symbol);
    return this.watch.length < before;
  }
  async seenIds(ids: string[]) {
    return new Set(ids.filter((id) => this.seen.has(id)));
  }
  async markSeen(ids: string[], _symbol: string, now: number) {
    for (const id of ids) if (!this.seen.has(id)) this.seen.set(id, now);
  }
  async pruneSeen(olderThan: number) {
    for (const [id, at] of this.seen) if (at < olderThan) this.seen.delete(id);
  }
  async getSetting(key: string) {
    return this.settings.get(key) ?? null;
  }
  async setSetting(key: string, value: string) {
    this.settings.set(key, value);
  }
  async deleteSetting(key: string) {
    this.settings.delete(key);
  }
  async tryLock(key: string, now: number, ttl: number) {
    const current = Number(this.settings.get(key) ?? 0);
    if (current > now) return false;
    this.settings.set(key, String(now + ttl));
    return true;
  }

  words: FilterWord[] = [];
  universe = new Map<string, UniverseEntry & { batch: string }>();

  async listFilterWords() {
    return [...this.words].sort((a, b) => a.filter.localeCompare(b.filter) || a.word.localeCompare(b.word));
  }
  async addFilterWord(filter: string, word: string) {
    if (!this.words.some((w) => w.filter === filter && w.word === word)) this.words.push({ filter, word });
  }
  async addFilterWords(filter: string, words: string[]) {
    for (const word of words) await this.addFilterWord(filter, word);
  }
  async removeFilterWord(filter: string, word: string) {
    const before = this.words.length;
    this.words = this.words.filter((w) => !(w.filter === filter && w.word.toLowerCase() === word.toLowerCase()));
    return this.words.length < before;
  }
  async removeFilter(filter: string) {
    const before = this.words.length;
    this.words = this.words.filter((w) => w.filter !== filter);
    return before - this.words.length;
  }
  async putUniverse(entries: UniverseEntry[], batch: string) {
    for (const entry of entries) this.universe.set(entry.symbol, { ...entry, batch });
  }
  async pruneUniverse(batch: string) {
    for (const [symbol, entry] of this.universe) if (entry.batch !== batch) this.universe.delete(symbol);
  }
  async lookupUniverse(symbols: string[]) {
    return symbols.flatMap((s) => {
      const entry = this.universe.get(s);
      return entry ? [{ symbol: entry.symbol, name: entry.name, capEur: entry.capEur, country: entry.country }] : [];
    });
  }
  async countUniverse() {
    return this.universe.size;
  }

  targets = new Map<string, TargetSnapshot>();
  async getTargets(symbols: string[]) {
    return symbols.flatMap((s) => (this.targets.has(s) ? [{ ...this.targets.get(s)! }] : []));
  }
  async putTargets(rows: TargetSnapshot[]) {
    for (const row of rows) this.targets.set(row.symbol, { ...row });
  }

  events: Array<EventRecord & { recordedAt: number; checked: boolean; extra: string }> = [];
  async recordEvents(rows: EventRecord[], now: number) {
    for (const row of rows) {
      if (this.events.some((e) => e.id === row.id && e.filter === row.filter)) continue;
      this.events.push({ ...row, recordedAt: now, checked: false, extra: "" });
    }
  }
  async eventsSince(since: number) {
    return this.events.filter((e) => e.recordedAt >= since).sort((a, b) => b.published - a.published).map((e) => ({ ...e }));
  }
  async eventsForSymbols(filter: string, symbols: string[], since: number) {
    return this.events.filter((e) => e.filter === filter && e.recordedAt >= since && symbols.includes(e.symbol)).map((e) => ({ ...e }));
  }
  async uncheckedEvents(filters: string[], limit: number) {
    return this.events
      .filter((e) => !e.checked && filters.includes(e.filter))
      .sort((a, b) => b.recordedAt - a.recordedAt)
      .slice(0, limit)
      .map((e) => ({ ...e }));
  }
  async markEventsChecked(ids: string[], extra: Record<string, string> = {}) {
    for (const e of this.events) {
      if (!ids.includes(e.id)) continue;
      e.checked = true;
      if (extra[e.id]) e.extra = extra[e.id];
    }
  }
  async pruneEvents(olderThan: number) {
    this.events = this.events.filter((e) => e.recordedAt >= olderThan);
  }

  agenda: Array<AgendaItem & { nr: number }> = [];
  private agendaNr = 0;
  async addAgenda(items: AgendaItem[], _now?: number) {
    for (const item of items) if (!this.agenda.some((a) => a.key === item.key)) this.agenda.push({ ...item, nr: ++this.agendaNr });
  }
  async listAgenda(from: string, to: string) {
    return this.agenda
      .filter((a) => a.date >= from && a.date <= to)
      .sort((a, b) => a.date.localeCompare(b.date) || a.symbol.localeCompare(b.symbol) || a.nr - b.nr)
      .map((a) => ({ ...a }));
  }
  async removeAgenda(nr: number) {
    const item = this.agenda.find((a) => a.nr === nr);
    this.agenda = this.agenda.filter((a) => a.nr !== nr);
    return item ?? null;
  }
  async pruneAgenda(before: string) {
    this.agenda = this.agenda.filter((a) => a.date >= before);
  }

  listings = new Map<string, Listing & { firstSeen: number }>();
  async putListings(rows: Listing[], now: number) {
    for (const row of rows) if (!this.listings.has(row.symbol)) this.listings.set(row.symbol, { ...row, firstSeen: now });
  }
  async listingsSince(since: number) {
    return [...this.listings.values()].filter((l) => l.firstSeen >= since).map((l) => ({ ...l }));
  }
  async listingsByIsin(isins: string[]) {
    return [...this.listings.values()].filter((l) => l.isin && isins.includes(l.isin)).map((l) => ({ ...l }));
  }
}

export interface Sent {
  chatId: string;
  text: string;
}

/** Nep-internet: routes op host + pad, en Telegram-berichten worden verzameld. */
export class FakeNet {
  sent: Sent[] = [];
  requests: string[] = [];
  telegramFails = false;
  updates: unknown[] = [];
  news = new Map<string, unknown>();
  search: unknown = { symbols: [] };
  story: unknown = {};
  newsStatus = 200;
  /** Nieuwsstromen van de screener, per taal. */
  feeds = new Map<string, unknown>();
  feedRequests: string[] = [];
  scannerRows: unknown[] = [];
  /** Rijen voor de koersdoel-vraag (herkend aan de kolom price_target_high). */
  targetRows: unknown[] = [];
  scannerBodies: any[] = [];
  /** Eigen antwoord op een screener-vraag; null = de standaard (selectie of koersdoelen). */
  scannerHandler: ((body: any) => unknown[] | null) | null = null;
  /** Berichttekst per id (anders `story`). */
  stories = new Map<string, unknown>();
  /** message_thread_id per verstuurd bericht (zelfde volgorde als sent). */
  sentThreads: Array<number | undefined> = [];
  /** Aangemaakte onderwerpen. */
  topics: string[] = [];
  topicsFail = false;
  /** Telegram-fout met migrate_to_chat_id bij het eerste bericht naar deze chat. */
  migrateFrom: string | null = null;

  fetch: Fetch = async (input, init) => {
    const url = new URL(input);
    this.requests.push(input);
    if (url.host === "api.telegram.org") {
      const method = url.pathname.split("/").pop();
      const body = JSON.parse(String(init?.body ?? "{}"));
      if (method === "sendMessage") {
        if (this.telegramFails) return Response.json({ ok: false, description: "kapot" }, { status: 500 });
        if (this.migrateFrom && String(body.chat_id) === this.migrateFrom) {
          return Response.json(
            { ok: false, description: "group chat was upgraded to a supergroup chat", parameters: { migrate_to_chat_id: -100777 } },
            { status: 400 },
          );
        }
        this.sent.push({ chatId: String(body.chat_id), text: body.text });
        this.sentThreads.push(body.message_thread_id);
        return Response.json({ ok: true, result: {} });
      }
      if (method === "createForumTopic") {
        if (this.topicsFail) return Response.json({ ok: false, description: "not enough rights" }, { status: 400 });
        this.topics.push(body.name);
        return Response.json({ ok: true, result: { message_thread_id: 100 + this.topics.length } });
      }
      if (method === "getUpdates") {
        const result = this.updates;
        this.updates = [];
        return Response.json({ ok: true, result });
      }
    }
    if (url.host === "news-mediator.tradingview.com" && url.searchParams.getAll("filter").includes("market:stock")) {
      const lang = url.searchParams.getAll("filter").find((f) => f.startsWith("lang:"))!.slice(5);
      this.feedRequests.push(input);
      return Response.json(this.feeds.get(lang) ?? { items: [] });
    }
    if (url.host === "scanner.tradingview.com") {
      const body = JSON.parse(String(init?.body ?? "{}"));
      this.scannerBodies.push(body);
      const [from, to] = body.range ?? [0, 1000];
      const custom = this.scannerHandler?.(body);
      const rows = custom ?? (body.columns.includes("price_target_high") ? this.targetRows : this.scannerRows);
      return Response.json({ totalCount: rows.length, data: rows.slice(from, to) });
    }
    if (url.host === "news-mediator.tradingview.com") {
      if (this.newsStatus !== 200) return new Response("nee", { status: this.newsStatus });
      const symbol = url.searchParams.getAll("filter").find((f) => f.startsWith("symbol:"))!.slice(7);
      return Response.json(this.news.get(symbol) ?? { items: [] });
    }
    if (url.host === "news-headlines.tradingview.com" && url.pathname.includes("story")) {
      return Response.json(this.stories.get(url.searchParams.get("id") ?? "") ?? this.story);
    }
    if (url.host === "news-headlines.tradingview.com") {
      if (this.newsStatus !== 200) return new Response("nee", { status: this.newsStatus });
      return Response.json([]);
    }
    if (url.host === "symbol-search.tradingview.com") return Response.json(this.search);
    return new Response("onbekend", { status: 404 });
  };

  telegram() {
    return new Telegram("TOKEN", this.fetch);
  }
}

export function item(id: string, title: string, published: number, extra: Record<string, unknown> = {}) {
  return {
    id,
    title,
    published,
    provider: { id: "eqs", name: "EQS Newswire" },
    storyPath: `/news/${id}/`,
    relatedSymbols: [{ symbol: "XETR:1INN" }],
    ...extra,
  };
}

export const config = loadConfig({ NEWS_LANGS: "de", STORY_DETAILS: "false" } as never);

/** Bericht zoals het via getUpdates binnenkomt. */
export function msg(text: string, opts: { chatId?: string; fromId?: string; chatType?: string } = {}) {
  return {
    chatId: opts.chatId ?? "1",
    chatType: opts.chatType ?? "private",
    text,
    fromId: opts.fromId ?? opts.chatId ?? "1",
    fromName: "Pepijn",
  };
}
