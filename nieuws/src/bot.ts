// Telegram-commando's: aandelen toevoegen en weghalen, de lijst tonen en het laatste nieuws
// opvragen. De bot luistert alleen naar zijn eigenaar.

import type { Config } from "./config.ts";
import { PRIMED_PREFIX } from "./check.ts";
import type { Store, WatchEntry } from "./store.ts";
import type { Telegram, TelegramMessage } from "./telegram.ts";
import { escapeHtml, formatNewsMessage } from "./telegram.ts";
import type { Fetch } from "./tradingview.ts";
import { fetchNews, searchSymbol } from "./tradingview.ts";

export const OWNER_KEY = "owner_chat";
export const OFFSET_KEY = "telegram_offset";
export const LAST_RUN_KEY = "last_run";

export interface BotDeps {
  store: Store;
  telegram: Telegram;
  fetcher: Fetch;
  config: Config;
  /** Vaste chat uit TELEGRAM_CHAT_ID, als die gezet is. */
  fixedChatId?: string;
}

export const HELP = [
  "<b>Nieuwsmelder</b>",
  "Ik kijk elke minuut of TradingView nieuws heeft over de aandelen op je lijst en stuur je dan meteen de kop.",
  "",
  "/volg 1INN · een aandeel toevoegen (ticker of naam; meerdere mag, met komma's)",
  "/volg XETR:1INN · precies deze notering",
  "/stop 1INN · weghalen",
  "/lijst · wat ik volg",
  "/laatste 1INN · de laatste drie koppen, om te testen",
  "/status · wanneer ik voor het laatst gekeken heb",
].join("\n");

export async function ownerChat(store: Store, fixedChatId?: string): Promise<string | null> {
  return fixedChatId?.trim() || (await store.getSetting(OWNER_KEY));
}

function findInList(watch: WatchEntry[], query: string): WatchEntry | undefined {
  const wanted = query.trim().toUpperCase();
  return (
    watch.find((entry) => entry.symbol === wanted) ??
    watch.find((entry) => entry.symbol.split(":").pop() === wanted) ??
    watch.find((entry) => entry.name.toUpperCase() === wanted)
  );
}

async function resolve(deps: BotDeps, query: string): Promise<{ entry: WatchEntry; others: string[] } | null> {
  const text = query.trim();
  const explicit = /^[A-Za-z0-9_.!-]+:[A-Za-z0-9_.!/-]+$/.test(text) ? text.toUpperCase() : null;
  let matches: Awaited<ReturnType<typeof searchSymbol>> = [];
  try {
    matches = await searchSymbol(deps.fetcher, explicit ? explicit.split(":")[1] : text);
  } catch (error) {
    if (!explicit) throw error;
  }
  if (explicit) {
    const match = matches.find((m) => m.symbol === explicit);
    return { entry: { symbol: explicit, name: match?.name ?? "" }, others: [] };
  }
  if (!matches.length) return null;
  const [first, ...rest] = matches;
  return {
    entry: { symbol: first.symbol, name: first.name },
    others: rest.slice(0, 4).map((m) => m.symbol),
  };
}

async function follow(deps: BotDeps, args: string): Promise<string> {
  const queries = args.split(",").map((q) => q.trim()).filter(Boolean);
  if (!queries.length) return "Welk aandeel? Bijvoorbeeld: /volg 1INN";
  const lines: string[] = [];
  for (const query of queries.slice(0, 10)) {
    try {
      const found = await resolve(deps, query);
      if (!found) {
        lines.push(`❓ ${escapeHtml(query)}: niet gevonden. Probeer de notering, bijvoorbeeld XETR:1INN.`);
        continue;
      }
      await deps.store.addWatch(found.entry);
      let line = `✅ ${escapeHtml(found.entry.symbol)}${found.entry.name ? ` (${escapeHtml(found.entry.name)})` : ""}`;
      if (found.others.length) line += `\n   andere noteringen: ${found.others.map(escapeHtml).join(", ")}`;
      lines.push(line);
    } catch (error) {
      lines.push(`⚠️ ${escapeHtml(query)}: zoeken mislukt (${escapeHtml(String(error instanceof Error ? error.message : error))})`);
    }
  }
  lines.push("", "Nieuws dat er nu al staat sla ik over; je krijgt alleen wat hierna verschijnt.");
  return lines.join("\n");
}

async function unfollow(deps: BotDeps, args: string): Promise<string> {
  const watch = await deps.store.listWatch();
  const entry = findInList(watch, args);
  if (!entry) return `${escapeHtml(args.trim() || "?")} staat niet op je lijst. Zie /lijst.`;
  await deps.store.removeWatch(entry.symbol);
  await deps.store.deleteSetting(PRIMED_PREFIX + entry.symbol);
  return `🗑️ ${escapeHtml(entry.symbol)} weggehaald.`;
}

async function list(deps: BotDeps): Promise<string> {
  const watch = await deps.store.listWatch();
  if (!watch.length) return "Je lijst is leeg. Voeg iets toe met /volg 1INN";
  return [
    `<b>Ik volg ${watch.length} aande${watch.length === 1 ? "el" : "len"}:</b>`,
    ...watch.map((e) => `• ${escapeHtml(e.symbol)}${e.name ? ` · ${escapeHtml(e.name)}` : ""}`),
  ].join("\n");
}

async function latest(deps: BotDeps, chatId: string, args: string): Promise<string | null> {
  const watch = await deps.store.listWatch();
  let entry = args.trim() ? findInList(watch, args) : watch[0];
  if (!entry && args.trim()) entry = (await resolve(deps, args))?.entry;
  if (!entry) return "Welk aandeel? Bijvoorbeeld: /laatste 1INN";
  const seen = new Map<string, Awaited<ReturnType<typeof fetchNews>>[number]>();
  for (const lang of deps.config.langs) {
    for (const item of await fetchNews(deps.fetcher, entry.symbol, lang)) if (!seen.has(item.id)) seen.set(item.id, item);
  }
  const items = [...seen.values()].sort((a, b) => b.published - a.published).slice(0, 3);
  if (!items.length) return `Geen nieuws gevonden voor ${escapeHtml(entry.symbol)}.`;
  for (const item of items.reverse()) {
    await deps.telegram.send(chatId, formatNewsMessage({ entry, item, timeZone: deps.config.timeZone }));
  }
  return null;
}

async function status(deps: BotDeps): Promise<string> {
  const raw = await deps.store.getSetting(LAST_RUN_KEY);
  if (!raw) return "Nog geen nieuwsronde gedraaid.";
  const run = JSON.parse(raw) as { at: number; checked: number; alerted: number; errors: string[] };
  const when = new Intl.DateTimeFormat("nl-NL", {
    timeZone: deps.config.timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(run.at * 1000));
  const lines = [`Laatste ronde om ${when}: ${run.checked} aandelen bekeken, ${run.alerted} meldingen.`];
  if (run.errors.length) lines.push("Fouten:", ...run.errors.slice(0, 5).map((e) => `• ${escapeHtml(e)}`));
  return lines.join("\n");
}

/** Verwerkt één binnengekomen bericht. */
export async function handleMessage(deps: BotDeps, message: TelegramMessage): Promise<void> {
  const owner = await ownerChat(deps.store, deps.fixedChatId);
  const [rawCommand = "", ...rest] = message.text.trim().split(/\s+/);
  // "/volg@MijnBot 1INN" in groepen.
  const command = rawCommand.toLowerCase().replace(/@.*$/, "");
  const args = rest.join(" ");

  if (!owner) {
    if (command !== "/start") return;
    await deps.store.setSetting(OWNER_KEY, message.chatId);
    await deps.telegram.send(message.chatId, `Hoi ${escapeHtml(message.fromName)}, deze bot is nu van jou.\n\n${HELP}`);
    return;
  }
  // Iedereen anders krijgt niets te zien.
  if (message.chatId !== owner) return;

  let reply: string | null;
  switch (command) {
    case "/start":
    case "/help":
    case "/hulp":
      reply = HELP;
      break;
    case "/volg":
    case "/add":
      reply = await follow(deps, args);
      break;
    case "/stop":
    case "/remove":
      reply = await unfollow(deps, args);
      break;
    case "/lijst":
    case "/list":
      reply = await list(deps);
      break;
    case "/laatste":
    case "/latest":
      reply = await latest(deps, message.chatId, args);
      break;
    case "/status":
      reply = await status(deps);
      break;
    default:
      reply = `Dat commando ken ik niet.\n\n${HELP}`;
  }
  if (reply) await deps.telegram.send(message.chatId, reply);
}

/** Haalt nieuwe Telegram-berichten op en verwerkt ze. */
export async function processUpdates(deps: BotDeps, log?: (message: string) => void): Promise<void> {
  const rawOffset = await deps.store.getSetting(OFFSET_KEY);
  const { messages, nextOffset } = await deps.telegram.updates(rawOffset ? Number(rawOffset) : null);
  // Offset eerst opslaan: een commando dat crasht mag niet elke minuut opnieuw binnenkomen.
  if (nextOffset !== null) await deps.store.setSetting(OFFSET_KEY, String(nextOffset));
  for (const message of messages) {
    try {
      await handleMessage(deps, message);
    } catch (error) {
      const text = error instanceof Error ? error.message : String(error);
      log?.(`commando "${message.text}" mislukt: ${text}`);
      await deps.telegram.send(message.chatId, `⚠️ Dat ging mis: ${escapeHtml(text)}`).catch(() => {});
    }
  }
}
