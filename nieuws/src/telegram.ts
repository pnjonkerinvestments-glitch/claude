import type { Fetch, NewsItem } from "./tradingview.ts";
import { chartUrl } from "./tradingview.ts";
import type { WatchEntry } from "./store.ts";

export interface TelegramMessage {
  chatId: string;
  text: string;
  fromName: string;
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
    const body = (await response.json().catch(() => null)) as { ok?: boolean; result?: unknown; description?: string } | null;
    if (!response.ok || !body?.ok) {
      throw new Error(`Telegram ${method} mislukt: ${response.status} ${body?.description ?? ""}`.trim());
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
      if (!message || typeof message.text !== "string" || !message.chat) continue;
      messages.push({
        chatId: String(message.chat.id),
        text: message.text,
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

export function formatNewsMessage({ entry, item, summary, timeZone }: NewsMessageInput): string {
  const ticker = entry.symbol.split(":").pop() ?? entry.symbol;
  const head = entry.name ? `${escapeHtml(ticker)} · ${escapeHtml(entry.name)}` : escapeHtml(entry.symbol);
  const lines = [`📰 <b>${head}</b>`, "", `<b>${escapeHtml(item.title)}</b>`];
  if (summary) lines.push("", escapeHtml(summary));
  const meta = [`🕒 ${escapeHtml(formatTime(item.published, timeZone))}`];
  if (item.provider) meta.push(escapeHtml(item.provider));
  lines.push("", meta.join(" · "));

  const links: string[] = [];
  if (item.link) links.push(`<a href="${escapeHtml(item.link)}">Origineel artikel</a>`);
  if (item.storyUrl) links.push(`<a href="${escapeHtml(item.storyUrl)}">TradingView</a>`);
  links.push(`<a href="${escapeHtml(chartUrl(entry.symbol))}">Grafiek</a>`);
  lines.push(links.join(" · "));
  return lines.join("\n");
}
