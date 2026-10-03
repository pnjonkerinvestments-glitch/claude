import type { Fetch, NewsItem } from "./tradingview.ts";
import { chartUrl } from "./tradingview.ts";
import type { WatchEntry } from "./store.ts";

export interface TelegramMessage {
  chatId: string;
  /** "private", "group", "supergroup" of "channel". */
  chatType: string;
  text: string;
  fromId: string;
  fromName: string;
  /** Gezet als een groep is omgezet naar een supergroep (die krijgt een nieuw chat-id). */
  migrateTo?: string;
}

export class TelegramError extends Error {
  /** Nieuw chat-id als de groep intussen een supergroep is geworden. */
  readonly migrateTo?: string;

  constructor(message: string, migrateTo?: string) {
    super(message);
    this.migrateTo = migrateTo;
  }
}

export interface TelegramUpdates {
  messages: TelegramMessage[];
  /** Offset voor de volgende getUpdates-aanroep, of null als er niets nieuws was. */
  nextOffset: number | null;
}

export class Telegram {
  private readonly token: string;
  private readonly fetcher: Fetch;

  constructor(token: string, fetcher: Fetch) {
    this.token = token;
    this.fetcher = fetcher;
  }

  private async call(method: string, payload: Record<string, unknown>): Promise<unknown> {
    const response = await this.fetcher(`https://api.telegram.org/bot${this.token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    });
    const body = (await response.json().catch(() => null)) as {
      ok?: boolean;
      result?: unknown;
      description?: string;
      parameters?: { migrate_to_chat_id?: number };
    } | null;
    if (!response.ok || !body?.ok) {
      const migrateTo = body?.parameters?.migrate_to_chat_id;
      throw new TelegramError(
        `Telegram ${method} mislukt: ${response.status} ${body?.description ?? ""}`.trim(),
        migrateTo === undefined ? undefined : String(migrateTo),
      );
    }
    return body.result;
  }

  async send(chatId: string, html: string): Promise<void> {
    await this.call("sendMessage", {
      chat_id: chatId,
      text: html,
      parse_mode: "HTML",
      link_preview_options: { is_disabled: true },
    });
  }

  async updates(offset: number | null): Promise<TelegramUpdates> {
    const payload: Record<string, unknown> = { timeout: 0, allowed_updates: ["message"] };
    if (offset !== null) payload.offset = offset;
    const result = (await this.call("getUpdates", payload)) as Array<Record<string, any>>;
    let nextOffset: number | null = null;
    const messages: TelegramMessage[] = [];
    for (const update of result ?? []) {
      if (typeof update.update_id === "number") nextOffset = Math.max(nextOffset ?? 0, update.update_id + 1);
      const message = update.message;
      if (!message?.chat) continue;
      if (message.migrate_to_chat_id !== undefined) {
        messages.push({
          chatId: String(message.chat.id),
          chatType: String(message.chat.type ?? ""),
          text: "",
          fromId: String(message.from?.id ?? ""),
          fromName: "",
          migrateTo: String(message.migrate_to_chat_id),
        });
        continue;
      }
      if (typeof message.text !== "string") continue;
      messages.push({
        chatId: String(message.chat.id),
        chatType: String(message.chat.type ?? ""),
        text: message.text,
        fromId: String(message.from?.id ?? ""),
        fromName: String(message.from?.first_name ?? ""),
      });
    }
    return { messages, nextOffset };
  }
}

export function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function formatTime(unixSeconds: number, timeZone: string): string {
  if (!unixSeconds) return "tijd onbekend";
  return new Intl.DateTimeFormat("nl-NL", {
    timeZone,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(unixSeconds * 1000));
}

export interface NewsMessageInput {
  entry: WatchEntry;
  item: NewsItem;
  summary?: string;
  timeZone: string;
}

function header(entry: WatchEntry): string {
  const ticker = entry.symbol.split(":").pop() ?? entry.symbol;
  const head = entry.name ? `${escapeHtml(ticker)} · ${escapeHtml(entry.name)}` : escapeHtml(entry.symbol);
  return `📰 <b>${head}</b>`;
}

export function meta(item: NewsItem, timeZone: string): string {
  const parts = [`🕒 ${escapeHtml(formatTime(item.published, timeZone))}`];
  if (item.provider) parts.push(escapeHtml(item.provider));
  return parts.join(" · ");
}

export function links(item: NewsItem, symbol?: string): string {
  const parts: string[] = [];
  if (item.link) parts.push(`<a href="${escapeHtml(item.link)}">Origineel artikel</a>`);
  if (item.storyUrl) parts.push(`<a href="${escapeHtml(item.storyUrl)}">TradingView</a>`);
  if (symbol) parts.push(`<a href="${escapeHtml(chartUrl(symbol))}">Grafiek</a>`);
  return parts.join(" · ");
}

export function formatNewsMessage({ entry, item, summary, timeZone }: NewsMessageInput): string {
  const lines = [header(entry), "", `<b>${escapeHtml(item.title)}</b>`];
  if (summary) lines.push("", escapeHtml(summary));
  lines.push("", meta(item, timeZone), links(item, entry.symbol));
  return lines.join("\n");
}

/** Telegram weigert berichten boven 4096 tekens. */
const MAX_LENGTH = 4000;

/**
 * Meerdere nieuwe koppen over hetzelfde aandeel in één bericht. Bij groot nieuws komt hetzelfde
 * vaak in drie of vier varianten binnen (persbericht in het Duits en Engels, Reuters, ...);
 * zo krijg je één melding in plaats van vier. Nieuwste bovenaan.
 */
export function formatNewsDigest(entry: WatchEntry, items: NewsItem[], timeZone: string, more = 0): string {
  const sorted = [...items].sort((a, b) => b.published - a.published);
  for (let count = sorted.length; count >= 1; count--) {
    const shown = sorted.slice(0, count);
    const hidden = more + sorted.length - count;
    const lines = [header(entry)];
    for (const item of shown) {
      lines.push("", `<b>${escapeHtml(item.title)}</b>`, meta(item, timeZone));
      const itemLinks = links(item);
      if (itemLinks) lines.push(itemLinks);
    }
    if (hidden) lines.push("", `… en nog ${hidden} oudere bericht(en); zie TradingView.`);
    lines.push("", `<a href="${escapeHtml(chartUrl(entry.symbol))}">Grafiek</a>`);
    const text = lines.join("\n");
    if (text.length <= MAX_LENGTH || count === 1) return text.slice(0, MAX_LENGTH);
  }
  return header(entry);
}
