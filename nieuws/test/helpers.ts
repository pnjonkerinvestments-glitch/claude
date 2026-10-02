import type { Store, WatchEntry } from "../src/store.ts";
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

  fetch: Fetch = async (input, init) => {
    const url = new URL(input);
    this.requests.push(input);
    if (url.host === "api.telegram.org") {
      const method = url.pathname.split("/").pop();
      const body = JSON.parse(String(init?.body ?? "{}"));
      if (method === "sendMessage") {
        if (this.telegramFails) return Response.json({ ok: false, description: "kapot" }, { status: 500 });
        this.sent.push({ chatId: String(body.chat_id), text: body.text });
        return Response.json({ ok: true, result: {} });
      }
      if (method === "getUpdates") {
        const result = this.updates;
        this.updates = [];
        return Response.json({ ok: true, result });
      }
    }
    if (url.host === "news-mediator.tradingview.com") {
      if (this.newsStatus !== 200) return new Response("nee", { status: this.newsStatus });
      const symbol = url.searchParams.getAll("filter").find((f) => f.startsWith("symbol:"))!.slice(7);
      return Response.json(this.news.get(symbol) ?? { items: [] });
    }
    if (url.host === "news-headlines.tradingview.com" && url.pathname.includes("story")) {
      return Response.json(this.story);
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
