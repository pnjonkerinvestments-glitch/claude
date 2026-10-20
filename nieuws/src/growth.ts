// Euronext Growth Oslo telt niet mee: geen meldingen, niet in het ochtendoverzicht. TradingView
// zet die aandelen gewoon onder OSL, net als Oslo Børs, dus de lijst komt van Euronext zelf
// (dezelfde download als "Export" op live.euronext.com). Eén keer per dag ververst.

import type { Store } from "./store.ts";
import type { Fetch } from "./tradingview.ts";

export const GROWTH_KEY = "growth_oslo";
const URL = "https://live.euronext.com/en/pd_es/data/stocks/download?mics=MERK";

export interface GrowthList {
  /** Lokale datum van de laatste verversing. */
  date: string;
  /** TradingView-symbolen, "OSL:DVD". */
  symbols: string[];
  isins: string[];
}

/** De CSV van Euronext: Name;ISIN;Symbol;Market;... met een paar kopregels. */
export function parseGrowthCsv(csv: string): { symbols: string[]; isins: string[] } {
  const symbols: string[] = [];
  const isins: string[] = [];
  for (const line of csv.split(/\r?\n/)) {
    const cells = line.split(";").map((c) => c.replace(/^"|"$/g, "").trim());
    const [, isin = "", symbol = "", market = ""] = cells;
    if (!/^[A-Z]{2}[A-Z0-9]{9}\d$/.test(isin) || !/growth oslo/i.test(market) || !symbol) continue;
    symbols.push(`OSL:${symbol.toUpperCase()}`);
    isins.push(isin);
  }
  return { symbols, isins };
}

export async function fetchGrowthOslo(fetcher: Fetch): Promise<{ symbols: string[]; isins: string[] }> {
  const response = await fetcher(URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "Mozilla/5.0 (compatible; nieuws-alert/1.0)" },
    body: "args%5Bfe_type%5D=csv&args%5Bfe_decimal%5D=.&args%5Bfe_date_format%5D=d%2Fm%2FY",
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`Euronext Growth Oslo HTTP ${response.status}`);
  const list = parseGrowthCsv(await response.text());
  // Een lege of halve lijst is een storing, geen beurs die leegloopt.
  if (list.symbols.length < 20) throw new Error(`Euronext Growth Oslo: maar ${list.symbols.length} aandelen`);
  return list;
}

/** Ververst de lijst als die van een eerdere dag is. Geeft terug of er iets gedaan is. */
export async function refreshGrowthOslo(store: Store, fetcher: Fetch, today: string): Promise<boolean> {
  const raw = await store.getSetting(GROWTH_KEY);
  if (raw && (JSON.parse(raw) as GrowthList).date === today) return false;
  const list = await fetchGrowthOslo(fetcher);
  await store.setSetting(GROWTH_KEY, JSON.stringify({ date: today, ...list } satisfies GrowthList));
  return true;
}

export async function growthSymbols(store: Store): Promise<Set<string>> {
  const raw = await store.getSetting(GROWTH_KEY);
  try {
    const list = raw ? (JSON.parse(raw) as GrowthList) : null;
    return new Set([...(list?.symbols ?? []), ...(list?.isins ?? [])]);
  } catch {
    return new Set();
  }
}

/** Over een aandeel op Euronext Growth Oslo (symbool of ISIN), of noemt de kop die markt? */
export function isGrowthOslo(title: string, symbols: string[], growth: Set<string>): boolean {
  if (/euronext growth oslo|merkur market/i.test(title)) return true;
  return symbols.length > 0 && growth.has(symbols[0].toUpperCase());
}
