// Grootte van een bedrijf, voor de minimale marktwaarde per filter (/minimum): emissies pas vanaf
// €10 mln, beursgangen, noteringen en overnames vanaf €100 mln.
//
// Een bedrijf in de selectie heeft zijn marktwaarde al. Daarbuiten vraagt de bot die op bij de
// TradingView-screener. Een bedrijf dat nog naar de beurs moet, heeft nog geen marktwaarde; dan
// telt de waardering uit de kop of het bericht ("Plans First North IPO at SEK 31, Valued at
// SEK 675M"). Lukt dat allemaal niet, dan is de grootte onbekend en blijft de treffer staan.

import { DEFAULT_MIN_CAP } from "./config.ts";
import { fold } from "./dates.ts";
import type { Store } from "./store.ts";
import type { Fetch } from "./tradingview.ts";
import { scanner } from "./tradingview.ts";

/** Minimale marktwaarde per filter (JSON {filter: euro}); 0 = geen minimum. */
export const MIN_CAP_KEY = "filters_min_cap";

export async function minCaps(store: Store): Promise<Map<string, number>> {
  const raw = await store.getSetting(MIN_CAP_KEY);
  let stored: Record<string, number> = {};
  try {
    stored = raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    // Kapotte instelling: de standaard geldt.
  }
  const caps = new Map<string, number>();
  for (const [filter, value] of Object.entries({ ...DEFAULT_MIN_CAP, ...stored })) if (value > 0) caps.set(filter, value);
  return caps;
}

export async function setMinCap(store: Store, filter: string, eur: number): Promise<void> {
  const raw = await store.getSetting(MIN_CAP_KEY);
  const stored = raw ? (JSON.parse(raw) as Record<string, number>) : {};
  stored[filter] = eur;
  await store.setSetting(MIN_CAP_KEY, JSON.stringify(stored));
}

/** Haalt een treffer weg als de grootte bekend is en onder het minimum van dat filter ligt. */
export function bigEnough(filter: string, capEur: number | undefined, caps: Map<string, number>): boolean {
  const min = caps.get(filter);
  return !min || capEur === undefined || capEur >= min;
}

/** Marktwaarde in euro per symbool, in één vraag. Onbekende symbolen ontbreken. */
export async function lookupCaps(fetcher: Fetch, symbols: string[]): Promise<Map<string, number>> {
  const caps = new Map<string, number>();
  const wanted = [...new Set(symbols)].slice(0, 200);
  if (!wanted.length) return caps;
  const { rows } = await scanner(fetcher, {
    symbols: { tickers: wanted },
    columns: ["market_cap_basic"],
    price_conversion: { to_currency: "eur" },
  });
  for (const row of rows) {
    const cap = row.d[0];
    if (typeof cap === "number" && Number.isFinite(cap) && cap > 0) caps.set(row.s, cap);
  }
  return caps;
}

/**
 * Ruwe wisselkoersen naar euro. Het gaat om een grens van €10 of €100 mln, dus een paar procent
 * verschil maakt niet uit.
 */
const TO_EUR: Record<string, number> = {
  eur: 1, euro: 1, euros: 1, "€": 1, usd: 0.9, "$": 0.9, gbp: 1.15, "£": 1.15, chf: 1.05, sek: 0.087, nok: 0.085,
  dkk: 0.134, pln: 0.23,
};
const CUR = "(eur|euros?|€|usd|\\$|gbp|£|chf|sek|nok|dkk|pln)";
const AMOUNT = "(\\d+(?:[.,]\\d+)?)";
const UNIT = "(billion|bn|mrd|milliarden?|miljarder?|mia|million|millions|millionen|milioni|millones|miljoner|millioner|mln|mio|mn|m)(?![a-z])\\.?";
const VALUATION_WORDS =
  "(?:valued at|valuing (?:it|the company|the group) at|values (?:it|the company|the group) at|valuation of|market (?:cap|capitalisation|capitalization|value) of|" +
  "bewertung von|bewertet mit|im wert von|valorisee a|valorise a|valorisation de|valutazione di|" +
  "capitalizzazione di|valoracion de|capitalizacion de|vardering pa|verdsettelse pa|vaerdiansaettelse pa)";
const VALUATION = [
  new RegExp(`${VALUATION_WORDS}\\s*(?:about|approximately|around|up to|rund|circa|ca\\.?|c\\.|ungefahr|environ|circa)?\\s*${CUR}\\s?${AMOUNT}\\s?${UNIT}`),
  new RegExp(`${VALUATION_WORDS}\\s*(?:about|approximately|around|up to|rund|circa|ca\\.?|c\\.|ungefahr|environ|circa)?\\s*${AMOUNT}\\s?${UNIT}\\s?(?:d'|de\\s+|di\\s+)?${CUR}`),
];

/** Waardering in euro uit een kop of bericht, of undefined. */
export function parseValuation(text: string): number | undefined {
  const folded = fold(text);
  for (const [index, pattern] of VALUATION.entries()) {
    const m = pattern.exec(folded);
    if (!m) continue;
    const [currency, amount, unit] = index === 0 ? [m[1], m[2], m[3]] : [m[3], m[1], m[2]];
    const value = Number(amount.replace(",", "."));
    const rate = TO_EUR[currency];
    if (!Number.isFinite(value) || !rate) continue;
    const factor = /^(billion|bn|mrd|milliard|miljard|mia)/.test(unit) ? 1e9 : 1e6;
    return value * factor * rate;
  }
  return undefined;
}

/** Aanvullende gegevens bij een bewaarde treffer (kolom extra, JSON). */
export interface EventExtra {
  /** Marktwaarde of waardering in euro, als die bekend is. */
  capEur?: number;
  /** Bedrag van een speciaal dividend. */
  amount?: number;
  currency?: string;
}

export function readExtra(raw: string | undefined): EventExtra {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as EventExtra;
  } catch {
    return {};
  }
}
