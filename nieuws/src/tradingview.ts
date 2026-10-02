// Nieuws en symbolen van TradingView. Dit zijn dezelfde (ongedocumenteerde) endpoints die
// tradingview.com zelf gebruikt; de parsers accepteren daarom zowel het nieuwe als het oude
// antwoordformaat en slaan items over die ze niet begrijpen in plaats van te crashen.

export interface NewsItem {
  id: string;
  title: string;
  /** Unix-tijd in seconden. */
  published: number;
  provider: string;
  /** Link naar het oorspronkelijke artikel, als TradingView die meegeeft. */
  link?: string;
  /** Pagina op tradingview.com met het volledige bericht (en daar de bronlink). */
  storyUrl?: string;
  /** Hoe dringend TradingView het bericht vindt (1 = breaking). */
  urgency?: number;
  symbols: string[];
}

export interface SymbolMatch {
  /** Volledig symbool, bijvoorbeeld "XETR:1INN". */
  symbol: string;
  name: string;
  exchange: string;
  type: string;
  country?: string;
}

const ORIGIN = "https://www.tradingview.com";
const HEADERS = {
  Accept: "application/json",
  Origin: ORIGIN,
  Referer: `${ORIGIN}/`,
  "User-Agent": "Mozilla/5.0 (compatible; nieuws-alert/1.0)",
};

export type Fetch = (input: string, init?: RequestInit) => Promise<Response>;

export function newsFlowUrl(symbol: string, lang: string): string {
  const params = new URLSearchParams();
  if (lang) params.append("filter", `lang:${lang}`);
  params.append("filter", `symbol:${symbol}`);
  params.append("client", "screener");
  params.append("streaming", "false");
  return `https://news-mediator.tradingview.com/news-flow/v2/news?${params}`;
}

export function headlinesUrl(symbol: string, lang: string): string {
  const params = new URLSearchParams({ client: "web", symbol, streaming: "false" });
  if (lang) params.set("lang", lang);
  return `https://news-headlines.tradingview.com/v2/headlines?${params}`;
}

export function storyApiUrl(id: string, lang: string): string {
  const params = new URLSearchParams({ id, lang: lang || "en" });
  return `https://news-headlines.tradingview.com/v3/story?${params}`;
}

export function chartUrl(symbol: string): string {
  return `${ORIGIN}/chart/?symbol=${encodeURIComponent(symbol)}`;
}

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function num(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const asNumber = Number(value);
    if (Number.isFinite(asNumber)) return asNumber;
    const asDate = Date.parse(value);
    if (Number.isFinite(asDate)) return asDate / 1000;
  }
  return 0;
}

function absolute(url: string): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/")) return ORIGIN + url;
  return undefined;
}

function providerName(raw: Record<string, unknown>): string {
  const provider = raw.provider;
  if (provider && typeof provider === "object") {
    const name = str((provider as Record<string, unknown>).name) || str((provider as Record<string, unknown>).id);
    if (name) return name;
  }
  return str(provider) || str(raw.source);
}

/** Zet één ruw nieuwsitem om; geeft null terug als id of kop ontbreekt. */
export function parseNewsItem(raw: unknown): NewsItem | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  const id = str(item.id) || (typeof item.id === "number" ? String(item.id) : "");
  const title = str(item.title);
  if (!id || !title) return null;

  let published = num(item.published);
  // Sommige varianten geven milliseconden.
  if (published > 1e12) published = Math.floor(published / 1000);

  const symbols: string[] = [];
  if (Array.isArray(item.relatedSymbols)) {
    for (const related of item.relatedSymbols) {
      const symbol = typeof related === "string" ? related : str((related as Record<string, unknown>)?.symbol);
      if (symbol) symbols.push(symbol);
    }
  }

  const urgency = num(item.urgency);
  return {
    id,
    title,
    published,
    provider: providerName(item),
    link: absolute(str(item.link)),
    storyUrl: absolute(str(item.storyPath)),
    urgency: urgency || undefined,
    symbols,
  };
}

/** Accepteert {items: [...]}, een kale array, of {data: [...]}. */
export function parseNewsResponse(body: unknown): NewsItem[] {
  let list: unknown[] = [];
  if (Array.isArray(body)) list = body;
  else if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    if (Array.isArray(record.items)) list = record.items;
    else if (Array.isArray(record.data)) list = record.data;
  }
  const items: NewsItem[] = [];
  for (const raw of list) {
    const item = parseNewsItem(raw);
    if (item) items.push(item);
  }
  return items;
}

async function getJson(fetcher: Fetch, url: string): Promise<unknown> {
  const response = await fetcher(url, { headers: HEADERS, signal: AbortSignal.timeout(10_000) });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`HTTP ${response.status} van ${new URL(url).host}: ${text.slice(0, 200)}`);
  }
  return response.json();
}

/**
 * Haalt het nieuws voor één symbool en één taal op. Probeert eerst het endpoint van de
 * huidige site en valt bij een fout terug op het oudere headlines-endpoint.
 */
export async function fetchNews(fetcher: Fetch, symbol: string, lang: string): Promise<NewsItem[]> {
  try {
    return parseNewsResponse(await getJson(fetcher, newsFlowUrl(symbol, lang)));
  } catch (primaryError) {
    try {
      return parseNewsResponse(await getJson(fetcher, headlinesUrl(symbol, lang)));
    } catch {
      throw primaryError;
    }
  }
}

export interface StoryDetails {
  link?: string;
  summary?: string;
}

/** Korte samenvatting en bronlink van één bericht. Mag mislukken; dan blijft de melding kaal. */
export async function fetchStory(fetcher: Fetch, id: string, lang: string): Promise<StoryDetails> {
  const body = (await getJson(fetcher, storyApiUrl(id, lang))) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") return {};
  const summary = str(body.shortDescription) || str(body.description);
  return {
    link: absolute(str(body.link)),
    summary: summary ? stripTags(summary).slice(0, 600) : undefined,
  };
}

function stripTags(text: string): string {
  return text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Maakt een samenvatting bruikbaar naast de kop: persberichten (EQS) beginnen vaak met
 * "Bedrijf / Schlagwort(e): ... <kop>", en sommige samenvattingen zijn niet meer dan de ticker.
 * Geeft undefined als er na het opschonen niets zinnigs overblijft.
 */
export function cleanSummary(summary: string | undefined, title: string): string | undefined {
  if (!summary) return undefined;
  let text = summary.trim();
  const at = text.indexOf(title);
  if (at >= 0) text = text.slice(at + title.length);
  text = text.replace(/^[\s:.,;\-–—]+/, "").trim();
  if (text.length < 40) return undefined;
  return text.length > 350 ? text.slice(0, 349).trimEnd() + "…" : text;
}

export function parseSymbolSearch(body: unknown): SymbolMatch[] {
  let list: unknown[] = [];
  if (Array.isArray(body)) list = body;
  else if (body && typeof body === "object" && Array.isArray((body as Record<string, unknown>).symbols)) {
    list = (body as Record<string, unknown>).symbols as unknown[];
  }
  const matches: SymbolMatch[] = [];
  for (const raw of list) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as Record<string, unknown>;
    const ticker = stripTags(str(item.symbol));
    const exchange = str(item.prefix) || str(item.exchange) || str(item.source_id);
    if (!ticker || !exchange) continue;
    matches.push({
      symbol: `${exchange}:${ticker}`.toUpperCase(),
      name: stripTags(str(item.description)),
      exchange,
      type: str(item.type),
      country: str(item.country) || undefined,
    });
  }
  return matches;
}

/** Zoekt een aandeel op ticker of naam. Aandelen gaan voor; daarbinnen houdt het de volgorde van TradingView. */
export async function searchSymbol(fetcher: Fetch, text: string): Promise<SymbolMatch[]> {
  const params = new URLSearchParams({ text, hl: "0", lang: "en", search_type: "stocks", domain: "production" });
  const url = `https://symbol-search.tradingview.com/symbol_search/v3/?${params}`;
  const matches = parseSymbolSearch(await getJson(fetcher, url));
  const stocks = matches.filter((m) => m.type === "stock" || m.type === "dr" || m.type === "fund");
  return stocks.length ? stocks : matches;
}
