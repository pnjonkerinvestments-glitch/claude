// Telegram-commando's: aandelen volgen, filters en de screener instellen, en bepalen waar de
// meldingen heen gaan. In de meldingengroep mag iedereen de volglijst en filterwoorden beheren;
// een paar commando's die alles voor iedereen omgooien blijven bij de eigenaar. Buiten die
// groep luistert de bot alleen naar de eigenaar.

import {
  ALERT_CHAT_KEY,
  ALERT_THREAD_KEY,
  OWNER_USER_KEY,
  TARGETS,
  WATCHLIST,
  alertChat,
  filterCategory,
  loadRoutes,
  migrateChat,
  ownerUser,
  saveRoutes,
} from "./alerts.ts";
import type { Config } from "./config.ts";
import { DEFAULT_FILTERS } from "./config.ts";
import { PRIMED_PREFIX } from "./check.ts";
import {
  CAP_MAX_KEY,
  CAP_MIN_KEY,
  DIGEST_ONLY_KEY,
  EUROPE_FILTERS_KEY,
  digestOnlyFilters,
  europeFilters,
  UNIVERSE_DONE_KEY,
  UNIVERSE_JOB_KEY,
  capRange,
  countryName,
  findMatches,
  formatCap,
  groupFilters,
} from "./screener.ts";
import { addDays, formatDay, localTime, relativeDay } from "./dates.ts";
import { DIGEST, OFF_KEY, SENT_DATE_KEY, nextDigest, previewDigest } from "./morning.ts";
import type { Store, WatchEntry } from "./store.ts";
import { TARGETS_OFF_KEY } from "./targets.ts";
import type { Telegram, TelegramMessage } from "./telegram.ts";
import { escapeHtml, formatNewsMessage } from "./telegram.ts";
import type { Fetch } from "./tradingview.ts";
import { fetchNews, searchSymbol } from "./tradingview.ts";

export const OFFSET_KEY = "telegram_offset";
export const LAST_RUN_KEY = "last_run";
export const LAST_SCREEN_KEY = "last_screen";
export const LAST_MORNING_KEY = "last_morning";

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
  "/bereik ipo europa|selectie · filter over heel Europa of alleen de small caps 🔒",
  "",
  "<b>Ochtendoverzicht</b> (werkdagen 08:40)",
  "/ochtend · overzicht nu tonen, en wanneer het volgende komt",
  "/ochtend aan|uit · ochtendoverzicht aan- of uitzetten 🔒",
  "/direct overname aan|uit · filter ook direct melden, of alleen in het ochtendoverzicht 🔒",
  "/agenda · deadlines, PDUFA-datums, eerste handelsdagen, ex-dividend, ...",
  "/agenda 23-10 PFSE einde aanmeldtermijn · zelf iets in de agenda zetten",
  "/agendaweg 12 · agendapunt weghalen",
  "",
  "<b>Screener</b>",
  "/marktwaarde 2,5 500 · bandbreedte in miljoen euro 🔒",
  "/screener · hoeveel aandelen er in de selectie zitten",
  "",
  "<b>Onderwerpen (Topics)</b>",
  "/onderwerpen · waar welke melding heen gaat",
  "/onderwerpen maak · onderwerpen Volglijst, Emissies, IPO's, Koersdoelen en Ochtendoverzicht aanmaken 🔒",
  "/hier emissie · meldingen van deze soort naar dit onderwerp 🔒",
  "/hier · alle overige meldingen naar deze chat of dit onderwerp 🔒",
  "",
  "<b>Overig</b>",
  "/status · wanneer ik voor het laatst gekeken heb",
  "",
  "🔒 = alleen de beheerder",
].join("\n");

/** Commando's die alles voor iedereen omgooien; die blijven bij de eigenaar. */
const OWNER_ONLY = new Set(["/hier", "/filterweg", "/bereik", "/direct"]);

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

async function latest(deps: BotDeps, message: TelegramMessage, args: string): Promise<string | null> {
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
    await deps.telegram.send(message.chatId, formatNewsMessage({ entry, item, timeZone: deps.config.timeZone }), message.threadId);
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
  const rawMorning = await deps.store.getSetting(LAST_MORNING_KEY);
  if (rawMorning) {
    const morning = JSON.parse(rawMorning) as { at: number; step: string | null; sent: number; errors: string[] };
    const what = morning.sent ? `overzicht verstuurd` : morning.step ? `stap ${morning.step}` : "niets te doen";
    lines.push(`Ochtendoverzicht om ${time(morning.at)}: ${what}.`);
    run.errors.push(...morning.errors);
  }
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
  const digestOnly = await digestOnlyFilters(deps.store);
  if (!filters.size) lines.push("Er zijn geen woordfilters. Maak er een met bijvoorbeeld /woord dividend Sonderdividende", "");
  for (const [name, words] of filters) {
    const where = digestOnly.has(name) ? " · alleen in het ochtendoverzicht" : "";
    lines.push(`<b>${escapeHtml(name)}</b> (${words.length} woorden${where})`, words.map(escapeHtml).join(" · "), "");
  }
  lines.push(
    `🎯 <b>koersdoel</b> (street high/low): ${(await deps.store.getSetting(TARGETS_OFF_KEY)) ? "uit" : "aan"}`,
    "",
    "Hoofdletters en accenten maken niet uit; een woord vindt ook langere vormen (dividend → dividends).",
    "Alle treffers staan ook in het ochtendoverzicht; /direct bepaalt of een filter daarnaast meteen meldt.",
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
  if (!matches.length) lines.push("Geen treffers. Dat is normaal: deze gebeurtenissen zijn zeldzaam.");
  for (const m of matches.slice(0, 10)) {
    const who = m.entry
      ? `<b>${escapeHtml(m.entry.symbol)}</b> ${escapeHtml(m.entry.name)} (${escapeHtml(countryName(m.entry.country))}, ${formatCap(m.entry.capEur)})`
      : `<b>${escapeHtml(m.item.symbols.slice(0, 2).join(", ") || "Europa")}</b> (buiten de selectie)`;
    lines.push(
      "",
      `• ${who}`,
      `  ${escapeHtml(m.item.title)}`,
      `  ${escapeHtml(m.hits[0].filter)}: "${escapeHtml(m.hits[0].word)}"`,
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

const CATEGORY_ALIASES: Record<string, string> = {
  volglijst: WATCHLIST,
  watchlist: WATCHLIST,
  koersdoel: TARGETS,
  koersdoelen: TARGETS,
  emissies: filterCategory("emissie"),
  ipos: filterCategory("ipo"),
  "ipo's": filterCategory("ipo"),
  ochtend: DIGEST,
  ochtendoverzicht: DIGEST,
};

const CATEGORY_LABELS: Record<string, string> = {
  [WATCHLIST]: "📰 Volglijst",
  [TARGETS]: "🎯 Koersdoelen",
  [DIGEST]: "☀️ Ochtendoverzicht",
};

function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? `🔎 Filter ${category.replace(/^filter:/, "")}`;
}

/** "emissie" → "filter:emissie", "volglijst" → "volglijst"; null als de soort niet bestaat. */
async function resolveCategory(deps: BotDeps, raw: string): Promise<string | null> {
  const name = raw.trim().toLowerCase();
  if (CATEGORY_ALIASES[name]) return CATEGORY_ALIASES[name];
  const filters = groupFilters(await deps.store.listFilterWords());
  if (filters.has(name) || DEFAULT_FILTERS[name]) return filterCategory(name);
  return null;
}

async function here(deps: BotDeps, message: TelegramMessage, args: string): Promise<string> {
  if (deps.fixedChatId) return "De meldingenchat staat vast via TELEGRAM_CHAT_ID; haal die secret weg om /hier te gebruiken.";
  const [rawCategory = "", option = ""] = args.trim().split(/\s+/);
  if (!rawCategory) {
    await deps.store.setSetting(ALERT_CHAT_KEY, message.chatId);
    if (message.threadId) await deps.store.setSetting(ALERT_THREAD_KEY, String(message.threadId));
    else await deps.store.deleteSetting(ALERT_THREAD_KEY);
    if (message.chatType === "private") return "✅ Meldingen komen vanaf nu hier, in je eigen chat.";
    return message.threadId
      ? "✅ Alle meldingen zonder eigen onderwerp komen vanaf nu in dit onderwerp."
      : "✅ Vanaf nu komen de meldingen in deze groep. Iedereen hier ziet ze; alleen de eigenaar kan dit veranderen.";
  }
  const category = await resolveCategory(deps, rawCategory);
  if (!category) {
    return `Die soort ken ik niet. Kies uit: volglijst, koersdoel, ochtend, of een filter (${[
      ...groupFilters(await deps.store.listFilterWords()).keys(),
    ].join(", ")}).`;
  }
  const routes = await loadRoutes(deps.store);
  if (["uit", "weg", "off"].includes(option.toLowerCase())) {
    delete routes[category];
    await saveRoutes(deps.store, routes);
    return `✅ ${categoryLabel(category)} gaat weer naar de standaardplek.`;
  }
  routes[category] = { chat: message.chatId, ...(message.threadId ? { thread: message.threadId } : {}) };
  await saveRoutes(deps.store, routes);
  // De groep is ook de meldingengroep (voor rechten van leden), als er nog geen was.
  if (!(await deps.store.getSetting(ALERT_CHAT_KEY))) await deps.store.setSetting(ALERT_CHAT_KEY, message.chatId);
  return `✅ ${categoryLabel(category)}: meldingen komen vanaf nu ${message.threadId ? "in dit onderwerp" : "in deze chat"}.`;
}

/** Standaardindeling bij /onderwerpen maak. */
const DEFAULT_TOPICS: Array<[string, string]> = [
  ["📰 Volglijst", WATCHLIST],
  ["💶 Emissies", filterCategory("emissie")],
  ["🚀 IPO's", filterCategory("ipo")],
  ["🎯 Koersdoelen", TARGETS],
  ["☀️ Ochtendoverzicht", DIGEST],
];

async function topics(deps: BotDeps, message: TelegramMessage, args: string): Promise<string> {
  if (args.trim().toLowerCase() === "maak") {
    if (message.chatType === "private") return "Dit werkt alleen in een groep met Topics.";
    const routes = await loadRoutes(deps.store);
    const made: string[] = [];
    const missing = DEFAULT_TOPICS.filter(([, category]) => !(routes[category]?.chat === message.chatId && routes[category]?.thread));
    if (!missing.length) return "Alle onderwerpen bestaan al. Zie /onderwerpen.";
    for (const [name, category] of missing) {
      let thread: number;
      try {
        thread = await deps.telegram.createTopic(message.chatId, name);
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        return [
          `⚠️ Onderwerp "${escapeHtml(name)}" aanmaken lukte niet (${escapeHtml(reason)}).`,
          "",
          "Controleer: Topics staat aan in de groepsinstellingen, en de bot is beheerder met het recht <b>Onderwerpen beheren</b>.",
          "Of maak de onderwerpen zelf en stuur in elk onderwerp /hier met de soort, bijvoorbeeld /hier emissie.",
          made.length ? `\nWel gelukt: ${made.join(", ")}` : "",
        ].join("\n");
      }
      routes[category] = { chat: message.chatId, thread };
      await saveRoutes(deps.store, routes);
      made.push(name);
      await deps.telegram.send(message.chatId, `Hier komen de meldingen voor <b>${escapeHtml(name)}</b>.`, thread);
    }
    // Alles zonder eigen onderwerp (dividend, insolventie, ...) gaat naar het algemene onderwerp.
    await deps.store.setSetting(ALERT_CHAT_KEY, message.chatId);
    await deps.store.deleteSetting(ALERT_THREAD_KEY);
    return `✅ Onderwerpen aangemaakt: ${made.join(", ")}. Overige meldingen komen in dit algemene onderwerp.`;
  }
  if (args.trim()) return "Gebruik /onderwerpen om de indeling te zien, of /onderwerpen maak om ze aan te maken.";

  const routes = await loadRoutes(deps.store);
  const chat = await alertChat(deps.store, deps.fixedChatId);
  const thread = await deps.store.getSetting(ALERT_THREAD_KEY);
  const filters = [...groupFilters(await deps.store.listFilterWords()).keys()].map(filterCategory);
  const lines = ["<b>Waar gaan de meldingen heen?</b>"];
  for (const category of [WATCHLIST, TARGETS, DIGEST, ...filters]) {
    const route = routes[category];
    const where = !route
      ? "standaardplek"
      : route.chat !== chat
        ? `andere chat (${escapeHtml(route.chat)})`
        : route.thread
          ? `eigen onderwerp (#${route.thread})`
          : "algemeen";
    lines.push(`${categoryLabel(category)} → ${where}`);
  }
  lines.push("", `Standaardplek: ${chat ? (thread ? `onderwerp #${thread}` : "algemeen") : "nog niet ingesteld"}`);
  lines.push("", "Aanpassen: stuur in een onderwerp /hier met de soort, bijvoorbeeld /hier emissie (/hier emissie uit zet het terug).");
  return lines.join("\n");
}

async function scope(deps: BotDeps, args: string): Promise<string> {
  const [rawName = "", choice = ""] = args.trim().toLowerCase().split(/\s+/);
  const europe = await europeFilters(deps.store);
  const filters = groupFilters(await deps.store.listFilterWords());
  if (!rawName || !filters.has(rawName) || !["europa", "selectie"].includes(choice)) {
    const list = [...filters.keys()].map((f) => `${escapeHtml(f)}: ${europe.has(f) ? "heel Europa" : "selectie"}`);
    return ["<b>Bereik per filter</b>", ...list, "", "Aanpassen: /bereik ipo europa of /bereik ipo selectie"].join("\n");
  }
  if (choice === "europa") europe.add(rawName);
  else europe.delete(rawName);
  await deps.store.setSetting(EUROPE_FILTERS_KEY, JSON.stringify([...europe]));
  return choice === "europa"
    ? `✅ Filter ${escapeHtml(rawName)} kijkt nu naar al het nieuws uit de gekozen landen, ook buiten de €2,5–500 mln-selectie.`
    : `✅ Filter ${escapeHtml(rawName)} kijkt nu alleen naar de aandelen in de selectie.`;
}

async function morning(deps: BotDeps, message: TelegramMessage, args: string): Promise<string | null> {
  const choice = args.trim().toLowerCase();
  if (choice === "uit" || choice === "off") {
    await deps.store.setSetting(OFF_KEY, "1");
    return "☀️ Het ochtendoverzicht staat uit. Aanzetten: /ochtend aan";
  }
  if (choice === "aan" || choice === "on") {
    await deps.store.deleteSetting(OFF_KEY);
    return "☀️ Het ochtendoverzicht staat aan.";
  }
  const now = Math.floor(Date.now() / 1000);
  const today = localTime(now, deps.config.timeZone).date;
  const off = await deps.store.getSetting(OFF_KEY);
  const sentToday = (await deps.store.getSetting(SENT_DATE_KEY)) === today;
  await deps.telegram.send(
    message.chatId,
    off
      ? "☀️ Het ochtendoverzicht staat <b>uit</b> (/ochtend aan). Zo zou het er nu uitzien:"
      : `☀️ Volgende ochtendoverzicht: <b>${escapeHtml(nextDigest(deps.config, now, sentToday))}</b>. Zo ziet het er nu uit:`,
    message.threadId,
  );
  for (const html of await previewDigest({ store: deps.store, config: deps.config, fetcher: deps.fetcher, now })) {
    await deps.telegram.send(message.chatId, html, message.threadId);
  }
  return null;
}

const MONTHS_IN: Record<string, number> = {
  jan: 1, feb: 2, mrt: 3, maa: 3, mar: 3, apr: 4, mei: 5, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, okt: 10, oct: 10, nov: 11, dec: 12,
};

/** "23-10", "23/10/2026", "2026-10-23", "23 okt" → "2026-10-23" (zonder jaar: eerstvolgende). */
export function parseAgendaDate(raw: string, today: string): { date: string; rest: string } | null {
  const text = raw.trim();
  let y = 0;
  let m = 0;
  let d = 0;
  let rest = "";
  let match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})\s*(.*)$/s);
  if (match) [y, m, d, rest] = [+match[1], +match[2], +match[3], match[4]];
  else if ((match = text.match(/^(\d{1,2})[-/.](\d{1,2})(?:[-/.](\d{2,4}))?\s*(.*)$/s))) {
    [d, m, rest] = [+match[1], +match[2], match[4]];
    y = match[3] ? (match[3].length === 2 ? 2000 + +match[3] : +match[3]) : 0;
  } else if ((match = text.match(/^(\d{1,2})\s+([a-z]{3})[a-z]*\.?(?:\s+(\d{4}))?\s*(.*)$/is))) {
    [d, m, rest] = [+match[1], MONTHS_IN[match[2].toLowerCase()] ?? 0, match[4]];
    y = match[3] ? +match[3] : 0;
  } else return null;
  const make = (year: number) => {
    const date = new Date(Date.UTC(year, m - 1, d));
    return date.getUTCMonth() === m - 1 && date.getUTCDate() === d ? date.toISOString().slice(0, 10) : null;
  };
  const thisYear = Number(today.slice(0, 4));
  let date = y ? make(y) : make(thisYear);
  if (!y && date && date < today) date = make(thisYear + 1);
  return date ? { date, rest: rest.trim() } : null;
}

async function agenda(deps: BotDeps, args: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const today = localTime(now, deps.config.timeZone).date;
  if (args.trim()) {
    const parsed = parseAgendaDate(args, today);
    if (!parsed || !parsed.rest) {
      return "Gebruik: /agenda &lt;datum&gt; &lt;omschrijving&gt;\nBijvoorbeeld: /agenda 23-10 PFSE einde aanmeldtermijn bod";
    }
    if (parsed.rest.length > 200) return "Die omschrijving is te lang (maximaal 200 tekens).";
    await deps.store.addAgenda(
      [{ key: `eigen:${now}:${parsed.date}:${parsed.rest}`, date: parsed.date, kind: "eigen", label: parsed.rest, symbol: "", name: "", title: "", url: "" }],
      now,
    );
    return `✅ In de agenda: <b>${escapeHtml(formatDay(parsed.date, today))}</b> (${relativeDay(parsed.date, today)}) · ${escapeHtml(parsed.rest)}`;
  }
  const items = await deps.store.listAgenda(today, addDays(today, 120));
  if (!items.length) {
    return "De agenda is leeg. De bot vult hem zelf uit persberichten (deadlines van biedingen, PDUFA-datums, eerste handelsdagen, ex-dividend), en je kunt zelf iets toevoegen: /agenda 23-10 omschrijving";
  }
  const lines = ["<b>Agenda</b> (komende 4 maanden)"];
  for (const item of items.slice(0, 60)) {
    const subject = item.symbol ? `<b>${escapeHtml(item.symbol.split(":").pop() ?? item.symbol)}</b> ${escapeHtml(item.name)} · ` : "";
    const about = item.url ? ` · <a href="${escapeHtml(item.url)}">bron</a>` : "";
    lines.push(`#${item.nr} ${escapeHtml(formatDay(item.date, today))} (${relativeDay(item.date, today)}) · ${subject}${escapeHtml(item.label)}${about}`);
  }
  if (items.length > 60) lines.push(`… en nog ${items.length - 60}`);
  lines.push("", "Weghalen: /agendaweg &lt;nummer&gt;");
  return lines.join("\n").slice(0, 4000);
}

async function agendaRemove(deps: BotDeps, args: string): Promise<string> {
  const nr = Number(args.trim().replace(/^#/, ""));
  if (!Number.isInteger(nr) || nr <= 0) return "Gebruik: /agendaweg &lt;nummer&gt; (zie /agenda)";
  const item = await deps.store.removeAgenda(nr);
  return item ? `🗑️ Weggehaald: ${escapeHtml(item.date)} · ${escapeHtml(item.label)}` : `Agendapunt #${nr} bestaat niet. Zie /agenda.`;
}

async function direct(deps: BotDeps, args: string): Promise<string> {
  const [rawName = "", choice = ""] = args.trim().toLowerCase().split(/\s+/);
  const quiet = await digestOnlyFilters(deps.store);
  const filters = groupFilters(await deps.store.listFilterWords());
  if (!rawName || !filters.has(rawName) || !["aan", "uit"].includes(choice)) {
    const list = [...filters.keys()].map((f) => `${escapeHtml(f)}: ${quiet.has(f) ? "alleen ochtendoverzicht" : "direct én in het ochtendoverzicht"}`);
    return ["<b>Direct melden per filter</b>", ...list, "", "Aanpassen: /direct overname aan of /direct overname uit"].join("\n");
  }
  if (choice === "aan") quiet.delete(rawName);
  else quiet.add(rawName);
  await deps.store.setSetting(DIGEST_ONLY_KEY, JSON.stringify([...quiet]));
  return choice === "aan"
    ? `✅ Filter ${escapeHtml(rawName)} meldt nu meteen, en staat ook in het ochtendoverzicht.`
    : `✅ Filter ${escapeHtml(rawName)} staat nu alleen nog in het ochtendoverzicht.`;
}

/** Verwerkt één binnengekomen bericht. */
export async function handleMessage(deps: BotDeps, message: TelegramMessage): Promise<void> {
  // Groep is supergroep geworden: nieuw chat-id overnemen als dit de meldingenchat was.
  if (message.migrateTo) {
    await migrateChat(deps.store, message.chatId, message.migrateTo);
    return;
  }
  // Antwoorden in hetzelfde onderwerp als de vraag.
  const answer = (html: string) => deps.telegram.send(message.chatId, html, message.threadId);
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
    await answer(`Hoi ${escapeHtml(message.fromName)}, deze bot is nu van jou.\n\n${HELP}`);
    return;
  }
  // De eigenaar mag alles, overal. Anderen alleen in de meldingengroep, en niet alles.
  const isOwner = message.fromId === owner;
  if (!isOwner) {
    const inAlertGroup = isGroup && message.chatId === (await alertChat(deps.store, deps.fixedChatId));
    if (!inAlertGroup) return;
    if (OWNER_ONLY.has(command) || (["/marktwaarde", "/onderwerpen", "/ochtend"].includes(command) && args.trim())) {
      await answer("🔒 Dat kan alleen de beheerder van de bot.");
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
      reply = await latest(deps, message, args);
      break;
    case "/status":
      reply = await status(deps);
      break;
    case "/hier":
      reply = await here(deps, message, args);
      break;
    case "/onderwerpen":
    case "/topics":
      reply = await topics(deps, message, args);
      break;
    case "/bereik":
      reply = await scope(deps, args);
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
    case "/ochtend":
    case "/overzicht":
      reply = await morning(deps, message, args);
      break;
    case "/agenda":
      reply = await agenda(deps, args);
      break;
    case "/agendaweg":
      reply = await agendaRemove(deps, args);
      break;
    case "/direct":
      reply = await direct(deps, args);
      break;
    default:
      reply = `Dat commando ken ik niet.\n\n${HELP}`;
  }
  if (reply) await answer(reply);
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
      await deps.telegram.send(message.chatId, `⚠️ Dat ging mis: ${escapeHtml(text)}`, message.threadId).catch(() => {});
    }
  }
}
