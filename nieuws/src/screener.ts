// Screener: alle Europese aandelen binnen een marktwaarde-bandbreedte, en een melding zodra
// een nieuwskop over een van die aandelen een van je filterwoorden bevat (bijvoorbeeld
// "Sonderdividende"). Anders dan de volglijst kijkt dit niet per aandeel, maar leest het een
// handvol nieuwsstromen per land en taal; zo passen duizenden aandelen in één minuut.

import type { Config, Feed } from "./config.ts";
import type { Store, UniverseEntry } from "./store.ts";
import { escapeHtml, links, meta } from "./telegram.ts";
import type { Fetch, NewsItem } from "./tradingview.ts";
import { chartUrl, cleanSummary, fetchStory, parseNewsResponse } from "./tradingview.ts";

export const CAP_MIN_KEY = "screen_cap_min";
export const CAP_MAX_KEY = "screen_cap_max";
export const UNIVERSE_DONE_KEY = "universe_done";
export const UNIVERSE_RANGE_KEY = "universe_range";
export const UNIVERSE_JOB_KEY = "universe_job";
const STARTED_KEY = "screen_started";

/** Rijen per screener-verzoek; de selectie wordt over een paar runs opgehaald. */
const PAGE = 1000;
/** Selectie elke dag opnieuw ophalen (marktwaarden veranderen, beursgangen, delistings). */
const REFRESH_SECONDS = 20 * 3600;
/** Zo ver terug kijken we in de nieuwsstromen; vangt ook berichten op die laat binnenkomen. */
const LOOKBACK_SECONDS = 2 * 3600;
/** Gezien-ids van de screener krijgen een eigen voorvoegsel, los van de volglijst. */
const SEEN_PREFIX = "f:";

const HEADERS = {
  Accept: "application/json",
  Origin: "https://www.tradingview.com",
  Referer: "https://www.tradingview.com/",
  "User-Agent": "Mozilla/5.0 (compatible; nieuws-alert/1.0)",
};

const COUNTRY_NL: Record<string, string> = {
  Germany: "Duitsland",
  France: "Frankrijk",
  Italy: "Italië",
  Spain: "Spanje",
  Portugal: "Portugal",
  Netherlands: "Nederland",
  Belgium: "België",
  Luxembourg: "Luxemburg",
  Denmark: "Denemarken",
  Sweden: "Zweden",
  Norway: "Noorwegen",
  Finland: "Finland",
  "United Kingdom": "Verenigd Koninkrijk",
  Switzerland: "Zwitserland",
  Austria: "Oostenrijk",
};

// ---------------------------------------------------------------- selectie

export interface CapRange {
  min: number;
  max: number;
}

export async function capRange(store: Store, config: Config): Promise<CapRange> {
  const min = Number(await store.getSetting(CAP_MIN_KEY));
  const max = Number(await store.getSetting(CAP_MAX_KEY));
  return {
    min: Number.isFinite(min) && min > 0 ? min : config.capMinEur,
    max: Number.isFinite(max) && max > 0 ? max : config.capMaxEur,
  };
}

export function scannerPayload(config: Config, range: CapRange, offset: number, size = PAGE): unknown {
  return {
    filter: [
      { left: "market_cap_basic", operation: "in_range", right: [range.min, range.max] },
      { left: "type", operation: "equal", right: "stock" },
      { left: "is_primary", operation: "equal", right: true },
    ],
    options: { lang: "en" },
    markets: config.screenMarkets,
    columns: ["description", "market_cap_basic", "country"],
    sort: { sortBy: "name", sortOrder: "asc" },
    range: [offset, offset + size],
    // Marktwaarde in euro, ook voor Britse, Zweedse en Zwitserse aandelen.
    price_conversion: { to_currency: "eur" },
  };
}

export function parseScannerRows(body: unknown): { rows: UniverseEntry[]; total: number } {
  const record = (body && typeof body === "object" ? body : {}) as { data?: unknown; totalCount?: unknown };
  const rows: UniverseEntry[] = [];
  for (const raw of Array.isArray(record.data) ? record.data : []) {
    const row = raw as { s?: unknown; d?: unknown[] };
    if (typeof row?.s !== "string" || !Array.isArray(row.d)) continue;
    const [name, cap, country] = row.d;
    if (typeof cap !== "number" || !Number.isFinite(cap)) continue;
    rows.push({
      symbol: row.s.toUpperCase(),
      name: typeof name === "string" ? name : "",
      capEur: cap,
      country: typeof country === "string" ? country : "",
    });
  }
  return { rows, total: typeof record.totalCount === "number" ? record.totalCount : rows.length };
}

async function fetchUniversePage(fetcher: Fetch, payload: unknown): Promise<{ rows: UniverseEntry[]; total: number }> {
  const response = await fetcher("https://scanner.tradingview.com/global/scan?label-product=screener-stock", {
    method: "POST",
    headers: { ...HEADERS, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`screener HTTP ${response.status}`);
  return parseScannerRows(await response.json());
}

interface UniverseJob {
  batch: string;
  offset: number;
  min: number;
  max: number;
}

/**
 * Ververst de selectie als dat nodig is, één pagina per run. Geeft terug of er iets gedaan is.
 * De oude selectie blijft bruikbaar tot de nieuwe compleet is.
 */
export async function refreshUniverse(store: Store, config: Config, fetcher: Fetch, now: number): Promise<boolean> {
  const range = await capRange(store, config);
  const rangeKey = `${range.min}-${range.max}`;
  const rawJob = await store.getSetting(UNIVERSE_JOB_KEY);
  let job: UniverseJob | null = rawJob ? (JSON.parse(rawJob) as UniverseJob) : null;
  if (!job) {
    const done = Number(await store.getSetting(UNIVERSE_DONE_KEY)) || 0;
    const doneRange = await store.getSetting(UNIVERSE_RANGE_KEY);
    if (now - done < REFRESH_SECONDS && doneRange === rangeKey) return false;
    job = { batch: String(now), offset: 0, min: range.min, max: range.max };
  }

  const page = await fetchUniversePage(fetcher, scannerPayload(config, job, job.offset));
  await store.putUniverse(page.rows, job.batch);
  job.offset += PAGE;
  if (job.offset >= page.total || page.rows.length === 0) {
    // Lege eerste pagina is vrijwel zeker een storing bij TradingView: dan niets weggooien.
    if (page.total > 0) await store.pruneUniverse(job.batch);
    await store.setSetting(UNIVERSE_DONE_KEY, String(now));
    await store.setSetting(UNIVERSE_RANGE_KEY, `${job.min}-${job.max}`);
    await store.deleteSetting(UNIVERSE_JOB_KEY);
  } else {
    await store.setSetting(UNIVERSE_JOB_KEY, JSON.stringify(job));
  }
  return true;
}

// ---------------------------------------------------------------- woorden

/** Kleine letters, zonder accenten en leestekens, met spaties eromheen. */
export function normalize(text: string): string {
  const plain = text
    .toLowerCase()
    .replace(/ß/g, "ss")
    .replace(/æ/g, "ae")
    .replace(/ø/g, "o")
    .replace(/œ/g, "oe")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  return ` ${plain} `;
}

export interface Hit {
  filter: string;
  word: string;
}

/**
 * Welke filters treffen deze kop? Een woord moet aan het begin van een woord in de kop staan,
 * maar mag langer doorlopen: "Sonderdividende" vindt ook "Sonderdividenden", en
 * "special dividend" ook "special dividends". Eén treffer per filter is genoeg.
 */
export function matchFilters(title: string, filters: Map<string, string[]>): Hit[] {
  const haystack = normalize(title);
  const hits: Hit[] = [];
  for (const [filter, words] of filters) {
    for (const word of words) {
      const needle = normalize(word).trimEnd();
      if (needle.trim() && haystack.includes(needle)) {
        hits.push({ filter, word });
        break;
      }
    }
  }
  return hits;
}

export function groupFilters(words: Array<{ filter: string; word: string }>): Map<string, string[]> {
  const filters = new Map<string, string[]>();
  for (const { filter, word } of words) {
    const list = filters.get(filter) ?? [];
    list.push(word);
    filters.set(filter, list);
  }
  return filters;
}

// ---------------------------------------------------------------- nieuws

export function feedUrl(feed: Feed): string {
  // TradingView wil de filters in alfabetische volgorde.
  const params = new URLSearchParams();
  params.append("filter", `lang:${feed.lang}`);
  params.append("filter", "market:stock");
  params.append("filter", `market_country:${feed.countries.join(",")}`);
  params.append("client", "screener");
  params.append("streaming", "false");
  return `https://news-mediator.tradingview.com/news-flow/v2/news?${params}`;
}

interface FeedItem extends NewsItem {
  lang: string;
}

export async function fetchFeeds(fetcher: Fetch, feeds: Feed[], errors: string[]): Promise<FeedItem[]> {
  const results = await Promise.allSettled(
    feeds.map(async (feed) => {
      const response = await fetcher(feedUrl(feed), { headers: HEADERS, signal: AbortSignal.timeout(10_000) });
      if (!response.ok) throw new Error(`nieuwsstroom ${feed.lang}:${feed.countries.join(",")} HTTP ${response.status}`);
      return parseNewsResponse(await response.json()).map((item) => ({ ...item, lang: feed.lang }));
    }),
  );
  const items = new Map<string, FeedItem>();
  for (const result of results) {
    if (result.status === "rejected") {
      errors.push(result.reason instanceof Error ? result.reason.message : String(result.reason));
      continue;
    }
    for (const item of result.value) if (!items.has(item.id)) items.set(item.id, item);
  }
  return [...items.values()];
}

// ---------------------------------------------------------------- melding

export function formatCap(eur: number): string {
  const nl = (value: number) => value.toLocaleString("nl-NL", { maximumFractionDigits: 1, minimumFractionDigits: 1 });
  if (eur >= 1e9) return `€${nl(eur / 1e9)} mld`;
  return `€${nl(eur / 1e6)} mln`;
}

export function countryName(country: string): string {
  return COUNTRY_NL[country] ?? country;
}

export interface ScreenerMessageInput {
  entry: UniverseEntry;
  items: NewsItem[];
  hits: Hit[];
  summary?: string;
  timeZone: string;
}

export function formatScreenerMessage({ entry, items, hits, summary, timeZone }: ScreenerMessageInput): string {
  const ticker = entry.symbol.split(":").pop() ?? entry.symbol;
  const filters = [...new Set(hits.map((h) => h.filter))];
  const words = [...new Set(hits.map((h) => h.word))];
  const lines = [
    `🔎 <b>Filter: ${escapeHtml(filters.join(", "))}</b> · "${escapeHtml(words.join('", "'))}"`,
    `📰 <b>${escapeHtml(ticker)} · ${escapeHtml(entry.name)}</b>`,
    `${escapeHtml(countryName(entry.country))} · marktwaarde ${formatCap(entry.capEur)}`,
  ];
  const sorted = [...items].sort((a, b) => b.published - a.published);
  for (const item of sorted) {
    lines.push("", `<b>${escapeHtml(item.title)}</b>`);
    if (summary && sorted.length === 1) lines.push("", escapeHtml(summary), "");
    lines.push(meta(item, timeZone));
    const itemLinks = links(item);
    if (itemLinks) lines.push(itemLinks);
  }
  lines.push("", `<a href="${escapeHtml(chartUrl(entry.symbol))}">Grafiek</a>`);
  return lines.join("\n").slice(0, 4000);
}

// ---------------------------------------------------------------- ronde

export interface ScreenDeps {
  store: Store;
  fetcher: Fetch;
  config: Config;
  send: (html: string) => Promise<void>;
  /** Huidige tijd in seconden. */
  now: number;
  log?: (message: string) => void;
}

export interface ScreenResult {
  scanned: number;
  matched: number;
  alerted: number;
  errors: string[];
}

export interface Match {
  item: FeedItem;
  hits: Hit[];
  entry: UniverseEntry;
}

/** Zoekt in de huidige nieuwsstromen naar treffers binnen de selectie, zonder iets te onthouden. */
export async function findMatches(
  deps: Pick<ScreenDeps, "store" | "fetcher" | "config">,
  filters: Map<string, string[]>,
  since: number,
  errors: string[],
): Promise<{ scanned: number; matches: Match[] }> {
  const items = await fetchFeeds(deps.fetcher, deps.config.screenFeeds, errors);
  const candidates = items
    .filter((item) => item.symbols.length && (!item.published || item.published >= since))
    .map((item) => ({ item, hits: matchFilters(item.title, filters) }))
    .filter((c) => c.hits.length);
  if (!candidates.length) return { scanned: items.length, matches: [] };

  const universe = new Map(
    (await deps.store.lookupUniverse([...new Set(candidates.flatMap((c) => c.item.symbols))])).map((e) => [e.symbol, e]),
  );
  const matches: Match[] = [];
  for (const candidate of candidates) {
    const symbol = candidate.item.symbols.find((s) => universe.has(s));
    if (symbol) matches.push({ ...candidate, entry: universe.get(symbol)! });
  }
  return { scanned: items.length, matches };
}

export async function checkScreener(deps: ScreenDeps): Promise<ScreenResult> {
  const { store, config, now } = deps;
  const result: ScreenResult = { scanned: 0, matched: 0, alerted: 0, errors: [] };
  const filters = groupFilters(await store.listFilterWords());
  if (!filters.size) return result;

  // Eerste keer: alleen het startpunt vastleggen, anders krijg je alle treffers van de
  // afgelopen uren in één klap.
  const started = Number(await store.getSetting(STARTED_KEY));
  if (!started) {
    await store.setSetting(STARTED_KEY, String(now));
    return result;
  }

  const { scanned, matches } = await findMatches(deps, filters, Math.max(started, now - LOOKBACK_SECONDS), result.errors);
  result.scanned = scanned;
  if (!matches.length) return result;

  // Al gemeld door de screener (f:id), of al via de volglijst gemeld (kale id)? Dan niet nog eens.
  const seen = await store.seenIds(matches.flatMap((m) => [SEEN_PREFIX + m.item.id, m.item.id]));
  const fresh = matches.filter((m) => !seen.has(SEEN_PREFIX + m.item.id) && !seen.has(m.item.id));
  result.matched = fresh.length;

  // Per aandeel één bericht, ook als het nieuws in meerdere talen binnenkomt.
  const bySymbol = new Map<string, Match[]>();
  for (const match of fresh) bySymbol.set(match.entry.symbol, [...(bySymbol.get(match.entry.symbol) ?? []), match]);

  for (const [symbol, group] of bySymbol) {
    try {
      let summary: string | undefined;
      if (group.length === 1 && config.storyDetails) {
        try {
          const story = await fetchStory(deps.fetcher, group[0].item.id, group[0].item.lang);
          summary = cleanSummary(story.summary, group[0].item.title);
          group[0].item.link ??= story.link;
        } catch (error) {
          deps.log?.(`${group[0].item.id}: details niet opgehaald (${error instanceof Error ? error.message : error})`);
        }
      }
      await deps.send(
        formatScreenerMessage({
          entry: group[0].entry,
          items: group.map((m) => m.item),
          hits: group.flatMap((m) => m.hits),
          summary,
          timeZone: config.timeZone,
        }),
      );
      await store.markSeen(group.map((m) => SEEN_PREFIX + m.item.id), symbol, now);
      result.alerted += group.length;
    } catch (error) {
      result.errors.push(`${symbol}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return result;
}
