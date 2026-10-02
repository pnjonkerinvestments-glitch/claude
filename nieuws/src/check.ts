// Eén nieuwsronde: voor elk aandeel op de lijst het TradingView-nieuws ophalen, nieuwe koppen
// melden en onthouden wat al gemeld is.

import type { Config } from "./config.ts";
import type { Store, WatchEntry } from "./store.ts";
import type { Telegram } from "./telegram.ts";
import { formatNewsDigest, formatNewsMessage } from "./telegram.ts";
import type { Fetch, NewsItem } from "./tradingview.ts";
import { cleanSummary, fetchNews, fetchStory } from "./tradingview.ts";

export interface CheckDeps {
  store: Store;
  telegram: Telegram;
  fetcher: Fetch;
  chatId: string;
  config: Config;
  /** Huidige tijd in seconden. */
  now: number;
  log?: (message: string) => void;
}

export interface CheckResult {
  checked: string[];
  alerted: number;
  errors: string[];
}

export const PRIMED_PREFIX = "primed:";
const CURSOR_KEY = "cursor";
/** Hoe lang gemelde ids bewaard blijven; ruim langer dan TradingView ze in de feed laat staan. */
const KEEP_SEEN_SECONDS = 60 * 24 * 3600;

interface FetchedItem extends NewsItem {
  lang: string;
}

/** Kiest de aandelen voor deze run; bij een lange lijst schuift het venster elke run door. */
export async function pickBatch(store: Store, watch: WatchEntry[], config: Config): Promise<WatchEntry[]> {
  const perSymbol = Math.max(1, config.langs.length);
  const size = Math.max(1, Math.floor(config.maxRequests / perSymbol));
  if (watch.length <= size) return watch;
  const start = Number(await store.getSetting(CURSOR_KEY)) % watch.length || 0;
  const batch: WatchEntry[] = [];
  for (let i = 0; i < size; i++) batch.push(watch[(start + i) % watch.length]);
  await store.setSetting(CURSOR_KEY, String((start + size) % watch.length));
  return batch;
}

async function fetchAllLangs(deps: CheckDeps, symbol: string): Promise<FetchedItem[] | null> {
  const results = await Promise.allSettled(
    deps.config.langs.map(async (lang) => (await fetchNews(deps.fetcher, symbol, lang)).map((item) => ({ ...item, lang }))),
  );
  const items = new Map<string, FetchedItem>();
  let anyOk = false;
  for (const result of results) {
    if (result.status === "rejected") {
      deps.log?.(`${symbol}: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`);
      continue;
    }
    anyOk = true;
    for (const item of result.value) if (!items.has(item.id)) items.set(item.id, item);
  }
  return anyOk ? [...items.values()] : null;
}

async function checkSymbol(deps: CheckDeps, entry: WatchEntry, result: CheckResult): Promise<void> {
  const { store, config, now } = deps;
  const items = await fetchAllLangs(deps, entry.symbol);
  if (items === null) {
    result.errors.push(`${entry.symbol}: nieuws ophalen mislukt`);
    return;
  }
  result.checked.push(entry.symbol);

  const primedKey = PRIMED_PREFIX + entry.symbol;
  // Net toegevoegd: wat er nu al staat is oud nieuws. Alleen onthouden, niet melden.
  if (!(await store.getSetting(primedKey))) {
    await store.markSeen(items.map((item) => item.id), entry.symbol, now);
    await store.setSetting(primedKey, String(now));
    return;
  }
  if (!items.length) return;

  const seen = await store.seenIds(items.map((item) => item.id));
  const fresh = items.filter((item) => !seen.has(item.id));
  if (!fresh.length) return;

  const tooOld = fresh.filter((item) => item.published && item.published < now - config.maxAgeSeconds);
  const toAlert = fresh.filter((item) => !tooOld.includes(item)).sort((a, b) => b.published - a.published);
  await store.markSeen(tooOld.map((item) => item.id), entry.symbol, now);
  if (!toAlert.length) return;
  // Bij een plotselinge stortvloed alleen de nieuwste tonen; de rest wordt als aantal genoemd.
  const shown = toAlert.slice(0, config.maxAlertsPerSymbol);
  const hidden = toAlert.length - shown.length;

  let text: string;
  if (shown.length === 1 && !hidden) {
    const [item] = shown;
    let summary: string | undefined;
    let link = item.link;
    if (config.storyDetails) {
      try {
        const story = await fetchStory(deps.fetcher, item.id, item.lang);
        summary = cleanSummary(story.summary, item.title);
        link ??= story.link;
      } catch (error) {
        deps.log?.(`${item.id}: details niet opgehaald (${error instanceof Error ? error.message : error})`);
      }
    }
    text = formatNewsMessage({ entry, item: { ...item, link }, summary, timeZone: config.timeZone });
  } else {
    text = formatNewsDigest(entry, shown, config.timeZone, hidden);
  }
  // Pas na een gelukte verzending als gezien markeren, zodat een mislukte melding de
  // volgende minuut opnieuw geprobeerd wordt.
  await deps.telegram.send(deps.chatId, text);
  await store.markSeen(toAlert.map((item) => item.id), entry.symbol, now);
  result.alerted += shown.length;
}

export async function checkNews(deps: CheckDeps): Promise<CheckResult> {
  const result: CheckResult = { checked: [], alerted: 0, errors: [] };
  const watch = await deps.store.listWatch();
  if (!watch.length) return result;

  const batch = await pickBatch(deps.store, watch, deps.config);
  // Per aandeel apart afvangen: één kapot symbool mag de rest niet tegenhouden.
  await Promise.all(
    batch.map((entry) =>
      checkSymbol(deps, entry, result).catch((error) => {
        result.errors.push(`${entry.symbol}: ${error instanceof Error ? error.message : String(error)}`);
      }),
    ),
  );
  if (Math.floor(deps.now / 60) % 1440 === 0) await deps.store.pruneSeen(deps.now - KEEP_SEEN_SECONDS);
  return result;
}
