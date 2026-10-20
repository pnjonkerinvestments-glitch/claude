// Claimrechten: elke ochtend alle verhandelbare rechten op de Europese beurzen ophalen (de
// zoekfunctie van TradingView kent ze als type "right"; in de screener staan ze niet). De
// omschrijving bevat de vervaldatum: "UNIPOL ASSICURAZIONI SPA Rights 2026-26.10.26 fOR Shares".
// Een nieuwe rechtenlijn betekent dat de rechtenhandel begint, en juist dan openen rechten soms
// extreem laag (UNIAXA, oktober 2026).

import { fold } from "./dates.ts";
import type { Fetch } from "./tradingview.ts";

/** Beurzen om langs te gaan. Londen niet (zie EXCLUDED_EXCHANGES); Frankfurt e.d. hebben alleen kopieën. */
export const RIGHTS_EXCHANGES = ["MIL", "EURONEXT", "XETR", "OMXSTO", "OMXCOP", "OMXHEX", "OSL", "BME", "SIX", "VIE", "NGM"];
/** Welke rechtenlijnen de bot al eens zag, en wanneer (JSON {symbool: "2026-10-12"}). */
export const RIGHTS_SEEN_KEY = "rights_seen";

export interface RightsLine {
  /** "MIL:UNIAXA" */
  symbol: string;
  /** Bedrijfsnaam zoals in de omschrijving, "UNIPOL ASSICURAZIONI SPA". */
  company: string;
  exchange: string;
  /** Vervaldatum uit de omschrijving (einde inschrijving), "2026-10-26", of leeg. */
  expiry: string;
  description: string;
  /** Aandeel van het bedrijf, als de bot het kon vinden ("MIL:UNI"). */
  companySymbol?: string;
  capEur?: number;
  /** Eerste dag dat de bot deze lijn zag. */
  firstSeen?: string;
}

/** "26.10.26" of "23.10.2026" → "2026-10-26"; de laatste datum in de omschrijving telt. */
export function rightsExpiry(description: string): string {
  const dates = [...description.matchAll(/(?<!\d)(\d{1,2})\.(\d{1,2})\.(\d{4}|\d{2})(?!\d)/g)];
  const last = dates.at(-1);
  if (!last) return "";
  const year = last[3].length === 2 ? 2000 + Number(last[3]) : Number(last[3]);
  const date = new Date(Date.UTC(year, Number(last[2]) - 1, Number(last[1])));
  return date.getUTCMonth() === Number(last[2]) - 1 ? date.toISOString().slice(0, 10) : "";
}

/** "Lenzing AG Subscription Rights 2026-20.10.26 For Shares" → "Lenzing AG". */
export function rightsCompany(description: string): string {
  return description.split(/\s+(?:subscription\s+)?rights?\b/i)[0].trim();
}

export function parseRightsSearch(body: unknown, exchange: string): RightsLine[] {
  const list = Array.isArray(body) ? body : ((body as { symbols?: unknown[] } | null)?.symbols ?? []);
  const lines: RightsLine[] = [];
  for (const raw of list) {
    const item = raw as Record<string, unknown>;
    if (item?.type !== "right" || typeof item.symbol !== "string") continue;
    const prefix = typeof item.prefix === "string" ? item.prefix : typeof item.source_id === "string" ? item.source_id : exchange;
    const description = typeof item.description === "string" ? item.description.replace(/<[^>]*>/g, "") : "";
    lines.push({
      symbol: `${prefix}:${item.symbol.replace(/<[^>]*>/g, "")}`.toUpperCase(),
      company: rightsCompany(description),
      exchange: prefix.toUpperCase(),
      expiry: rightsExpiry(description),
      description,
    });
  }
  return lines;
}

/** Alle rechtenlijnen op één beurs. */
export async function searchRights(fetcher: Fetch, exchange: string): Promise<RightsLine[]> {
  const params = new URLSearchParams({ text: "rights", hl: "0", lang: "en", search_type: "", domain: "production", exchange });
  const response = await fetcher(`https://symbol-search.tradingview.com/symbol_search/v3/?${params}`, {
    headers: {
      Accept: "application/json",
      Origin: "https://www.tradingview.com",
      Referer: "https://www.tradingview.com/",
      "User-Agent": "Mozilla/5.0 (compatible; nieuws-alert/1.0)",
    },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`rechten ${exchange} HTTP ${response.status}`);
  return parseRightsSearch(await response.json(), exchange);
}

/** Naam vergelijkbaar maken: "UNIPOL ASSICURAZIONI SPA" en "Unipol Assicurazioni S.p.A." → "unipol assicurazioni spa". */
export function companyKey(name: string): string {
  return fold(name)
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(s p a|s a|n v|a s|a b)\b/g, (m) => m.replace(/ /g, ""))
    .trim();
}
