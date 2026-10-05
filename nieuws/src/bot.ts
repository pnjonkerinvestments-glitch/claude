// Telegram-commando's: aandelen volgen, filters en de screener instellen, en bepalen waar de
// meldingen heen gaan. In de meldingengroep mag iedereen de volglijst en filterwoorden beheren;
// een paar commando's die alles voor iedereen omgooien blijven bij de eigenaar. Buiten die
// groep luistert de bot alleen naar de eigenaar.

import { ALERT_CHAT_KEY, OWNER_USER_KEY, alertChat, ownerUser } from "./alerts.ts";
import type { Config } from "./config.ts";
import { PRIMED_PREFIX } from "./check.ts";
import {
  CAP_MAX_KEY,
  CAP_MIN_KEY,
  UNIVERSE_DONE_KEY,
  UNIVERSE_JOB_KEY,
  capRange,
  countryName,
  findMatches,
  formatCap,
  groupFilters,
} from "./screener.ts";
import type { Store, WatchEntry } from "./store.ts";
import { TARGETS_OFF_KEY } from "./targets.ts";
import type { Telegram, TelegramMessage } from "./telegram.ts";
import { escapeHtml, formatNewsMessage } from "./telegram.ts";
import type { Fetch } from "./tradingview.ts";
import { fetchNews, searchSymbol } from "./tradingview.ts";

export const OFFSET_KEY = "telegram_offset";
export const LAST_RUN_KEY = "last_run";
export const LAST_SCREEN_KEY = "last_screen";

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
  "Elke minuut kijk ik naar het TradingView-nieuws. Je krijgt een melding bij nieuws over een aandeel op je lijst, en bij koppen met je filterwoorden over Europese small caps.",
  "",
  "<b>Volglijst</b>",
  "/volg 1INN · aandeel toevoegen (ticker of naam; meerdere met komma's)",
  "/stop 1INN · weghalen",
  "/lijst · wat ik volg",
  "/laatste 1INN · laatste drie koppen, om te testen",
  "",
  "<b>Filters</b>",
  "/filters · filters en woorden",
  "/woord dividend Sonderdividende · woord toevoegen aan een filter",
  "/woordweg dividend Sonderdividende · woord weghalen",
  "/filterweg dividend · hele filter weghalen 🔒",
  "/filtertest · treffers van de afgelopen uren tonen, zonder te melden",
  "/koersdoel aan|uit · meldingen bij een nieuw hoogste of laagste analistenkoersdoel",
  "",
  "<b>Screener</b>",
  "/marktwaarde 2,5 500 · bandbreedte in miljoen euro 🔒",
  "/screener · hoeveel aandelen er in de selectie zitten",
  "",
  "<b>Overig</b>",
  "/hier · meldingen voortaan naar deze chat of groep sturen 🔒",
  "/status · wanneer ik voor het laatst gekeken heb",
  "",
  "🔒 = alleen de beheerder",
].join("\n");

/** Commando's die alles voor iedereen omgooien; die blijven bij de eigenaar. */
const OWNER_ONLY = new Set(["/hier", "/filterweg"]);

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
  const time = (at: number) =>
    new Intl.DateTimeFormat("nl-NL", { timeZone: deps.config.timeZone, hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(
      new Date(at * 1000),
    );
  const lines = [`Volglijst om ${time(run.at)}: ${run.checked} aandelen bekeken, ${run.alerted} meldingen.`];
  const rawScreen = await deps.store.getSetting(LAST_SCREEN_KEY);
  if (rawScreen) {
    const screen = JSON.parse(rawScreen) as { at: number; scanned: number; alerted: number; errors: string[] };
    lines.push(`Screener om ${time(screen.at)}: ${screen.scanned} koppen doorzocht, ${screen.alerted} meldingen.`);
    run.errors.push(...screen.errors);
  }
  const chat = await alertChat(deps.store, deps.fixedChatId);
  lines.push(`Meldingen gaan naar chat ${escapeHtml(chat ?? "?")}.`);
  if (run.errors.length) lines.push("Fouten:", ...run.errors.slice(0, 5).map((e) => `• ${escapeHtml(e)}`));
  return lines.join("\n");
}

const FILTER_NAME = /^[a-z0-9_-]{1,30}$/;

async function showFilters(deps: BotDeps): Promise<string> {
  const filters = groupFilters(await deps.store.listFilterWords());
  const lines: string[] = [];
  if (!filters.size) lines.push("Er zijn geen woordfilters. Maak er een met bijvoorbeeld /woord dividend Sonderdividende", "");
  for (const [name, words] of filters) {
    lines.push(`<b>${escapeHtml(name)}</b> (${words.length} woorden)`, words.map(escapeHtml).join(" · "), "");
  }
  lines.push(
    `🎯 <b>koersdoel</b> (street high/low): ${(await deps.store.getSetting(TARGETS_OFF_KEY)) ? "uit" : "aan"}`,
    "",
    "Hoofdletters en accenten maken niet uit; een woord vindt ook langere vormen (dividend → dividends).",
  );
  return lines.join("\n");
}

function parseFilterArgs(args: string): { filter: string; word: string } | null {
  const [filter = "", ...rest] = args.trim().split(/\s+/);
  const word = rest.join(" ").trim();
  if (!FILTER_NAME.test(filter.toLowerCase()) || !word) return null;
  return { filter: filter.toLowerCase(), word };
}

async function addWord(deps: BotDeps, args: string): Promise<string> {
  const parsed = parseFilterArgs(args);
  if (!parsed) return "Gebruik: /woord &lt;filter&gt; &lt;woord of zin&gt;\nBijvoorbeeld: /woord dividend Sonderdividende";
  if (parsed.word.length > 80) return "Dat woord is te lang (maximaal 80 tekens).";
  await deps.store.addFilterWord(parsed.filter, parsed.word);
  return `✅ "${escapeHtml(parsed.word)}" staat nu in filter <b>${escapeHtml(parsed.filter)}</b>.`;
}

async function removeWord(deps: BotDeps, args: string): Promise<string> {
  const parsed = parseFilterArgs(args);
  if (!parsed) return "Gebruik: /woordweg &lt;filter&gt; &lt;woord&gt;";
  const removed = await deps.store.removeFilterWord(parsed.filter, parsed.word);
  return removed
    ? `🗑️ "${escapeHtml(parsed.word)}" weggehaald uit <b>${escapeHtml(parsed.filter)}</b>.`
    : `"${escapeHtml(parsed.word)}" stond niet in <b>${escapeHtml(parsed.filter)}</b>. Zie /filters.`;
}

async function removeFilter(deps: BotDeps, args: string): Promise<string> {
  const name = args.trim().toLowerCase();
  if (!FILTER_NAME.test(name)) return "Gebruik: /filterweg &lt;filter&gt;";
  const count = await deps.store.removeFilter(name);
  return count ? `🗑️ Filter <b>${escapeHtml(name)}</b> weg (${count} woorden).` : `Filter ${escapeHtml(name)} bestaat niet.`;
}

/** "2,5" of "2.5" of "500" → getal; alles in miljoenen. */
function parseMillions(raw: string): number | null {
  const value = Number(raw.replace(",", "."));
  return Number.isFinite(value) && value > 0 ? value * 1e6 : null;
}

async function setCap(deps: BotDeps, args: string): Promise<string> {
  const parts = args.trim().split(/[\s-]+/).filter(Boolean);
  const min = parts[0] ? parseMillions(parts[0]) : null;
  const max = parts[1] ? parseMillions(parts[1]) : null;
  if (min === null || max === null || min >= max) {
    const range = await capRange(deps.store, deps.config);
    return `Nu: ${formatCap(range.min)} tot ${formatCap(range.max)}.\nAanpassen: /marktwaarde 2,5 500 (in miljoen euro)`;
  }
  await deps.store.setSetting(CAP_MIN_KEY, String(min));
  await deps.store.setSetting(CAP_MAX_KEY, String(max));
  // Selectie opnieuw opbouwen bij de volgende runs.
  await deps.store.deleteSetting(UNIVERSE_DONE_KEY);
  await deps.store.deleteSetting(UNIVERSE_JOB_KEY);
  return `✅ Marktwaarde ${formatCap(min)} tot ${formatCap(max)}. De selectie wordt de komende minuten opnieuw opgehaald.`;
}

async function screenerStatus(deps: BotDeps): Promise<string> {
  const range = await capRange(deps.store, deps.config);
  const count = await deps.store.countUniverse();
  const done = Number(await deps.store.getSetting(UNIVERSE_DONE_KEY));
  const busy = await deps.store.getSetting(UNIVERSE_JOB_KEY);
  const filters = groupFilters(await deps.store.listFilterWords());
  const when = done
    ? new Intl.DateTimeFormat("nl-NL", { timeZone: deps.config.timeZone, weekday: "short", hour: "2-digit", minute: "2-digit" }).format(
        new Date(done * 1000),
      )
    : "nog niet";
  return [
    `<b>Screener</b>`,
    `Selectie: ${count} aandelen, marktwaarde ${formatCap(range.min)} tot ${formatCap(range.max)}`,
    `Bijgewerkt: ${when}${busy ? " (wordt nu ververst)" : ""}`,
    `Landen: ${deps.config.screenMarkets.length} markten`,
    `Filters: ${filters.size ? [...filters].map(([n, w]) => `${escapeHtml(n)} (${w.length})`).join(", ") : "geen"}`,
  ].join("\n");
}

async function filterTest(deps: BotDeps): Promise<string> {
  const filters = groupFilters(await deps.store.listFilterWords());
  if (!filters.size) return "Er zijn geen filters om te testen.";
  if (!(await deps.store.countUniverse())) return "De selectie is nog niet opgehaald; probeer het over een paar minuten.";
  const errors: string[] = [];
  const since = Math.floor(Date.now() / 1000) - 7 * 24 * 3600;
  const { scanned, matches } = await findMatches(deps, filters, since, errors);
  const lines = [`Ik heb ${scanned} recente koppen doorzocht (de nieuwsstromen reiken een paar uur tot dagen terug).`];
  if (!matches.length) lines.push("Geen treffers binnen je selectie. Dat is normaal: speciaal dividend is zeldzaam.");
  for (const m of matches.slice(0, 10)) {
    lines.push(
      "",
      `• <b>${escapeHtml(m.entry.symbol)}</b> ${escapeHtml(m.entry.name)} (${escapeHtml(countryName(m.entry.country))}, ${formatCap(m.entry.capEur)})`,
      `  ${escapeHtml(m.item.title)}`,
      `  woord: "${escapeHtml(m.hits[0].word)}"`,
    );
  }
  if (matches.length > 10) lines.push("", `… en nog ${matches.length - 10}.`);
  if (errors.length) lines.push("", ...errors.map((e) => `⚠️ ${escapeHtml(e)}`));
  return lines.join("\n");
}

async function targetsSwitch(deps: BotDeps, args: string): Promise<string> {
  const choice = args.trim().toLowerCase();
  if (choice === "uit" || choice === "off") {
    await deps.store.setSetting(TARGETS_OFF_KEY, "1");
    return "🎯 Koersdoelmeldingen staan uit.";
  }
  if (choice === "aan" || choice === "on") {
    await deps.store.deleteSetting(TARGETS_OFF_KEY);
    return "🎯 Koersdoelmeldingen staan aan.";
  }
  const off = await deps.store.getSetting(TARGETS_OFF_KEY);
  return [
    `🎯 Koersdoelmeldingen staan <b>${off ? "uit" : "aan"}</b>.`,
    "Elk half uur kijk ik naar de analistenkoersdoelen van de aandelen in de screener. Stijgt het hoogste doel " +
      "(nieuwe street high) of daalt het laagste (nieuwe street low), dan krijg je een melding.",
    "Aan- of uitzetten: /koersdoel aan of /koersdoel uit",
  ].join("\n");
}

async function here(deps: BotDeps, message: TelegramMessage): Promise<string> {
  if (deps.fixedChatId) return "De meldingenchat staat vast via TELEGRAM_CHAT_ID; haal die secret weg om /hier te gebruiken.";
  await deps.store.setSetting(ALERT_CHAT_KEY, message.chatId);
  return message.chatType === "private"
    ? "✅ Meldingen komen vanaf nu weer hier, in je eigen chat."
    : "✅ Vanaf nu komen alle meldingen in deze groep. Iedereen hier ziet ze; alleen de eigenaar kan instellingen veranderen.";
}

/** Verwerkt één binnengekomen bericht. */
export async function handleMessage(deps: BotDeps, message: TelegramMessage): Promise<void> {
  // Groep is supergroep geworden: nieuw chat-id overnemen als dit de meldingenchat was.
  if (message.migrateTo) {
    if ((await alertChat(deps.store)) === message.chatId) await deps.store.setSetting(ALERT_CHAT_KEY, message.migrateTo);
    return;
  }
  const text = message.text.trim();
  const isGroup = message.chatType !== "private";
  // In groepen alleen op commando's reageren; gewone gesprekken gaan de bot niets aan.
  if (isGroup && !text.startsWith("/")) return;

  const owner = await ownerUser(deps.store);
  const [rawCommand = "", ...rest] = text.split(/\s+/);
  // "/volg@MijnBot 1INN" in groepen.
  const command = rawCommand.toLowerCase().replace(/@.*$/, "");
  const args = rest.join(" ");

  if (!owner) {
    if (command !== "/start") return;
    await deps.store.setSetting(OWNER_USER_KEY, message.fromId);
    await deps.store.setSetting(ALERT_CHAT_KEY, message.chatId);
    await deps.telegram.send(message.chatId, `Hoi ${escapeHtml(message.fromName)}, deze bot is nu van jou.\n\n${HELP}`);
    return;
  }
  // De eigenaar mag alles, overal. Anderen alleen in de meldingengroep, en niet alles.
  const isOwner = message.fromId === owner;
  if (!isOwner) {
    const inAlertGroup = isGroup && message.chatId === (await alertChat(deps.store, deps.fixedChatId));
    if (!inAlertGroup) return;
    if (OWNER_ONLY.has(command) || (command === "/marktwaarde" && args.trim())) {
      await deps.telegram.send(message.chatId, "🔒 Dat kan alleen de beheerder van de bot.");
      return;
    }
  }

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
    case "/hier":
      reply = await here(deps, message);
      break;
    case "/filters":
      reply = await showFilters(deps);
      break;
    case "/woord":
      reply = await addWord(deps, args);
      break;
    case "/woordweg":
      reply = await removeWord(deps, args);
      break;
    case "/filterweg":
      reply = await removeFilter(deps, args);
      break;
    case "/filtertest":
      reply = await filterTest(deps);
      break;
    case "/koersdoel":
      reply = await targetsSwitch(deps, args);
      break;
    case "/marktwaarde":
      reply = await setCap(deps, args);
      break;
    case "/screener":
      reply = await screenerStatus(deps);
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
