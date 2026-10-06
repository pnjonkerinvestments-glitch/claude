// Noteringen: elke ochtend alle aandelen op de Europese beurzen langs (primaire noteringen en
// tweede noteringen op de hoofdbeurzen) en onthouden wat er nieuw bij is gekomen. Een nieuwe
// primaire notering met een onbekend ISIN is een beursgang; een nieuwe tweede notering van een
// bekend ISIN is een dubbele notering (zoals DSM-Firmenich destijds op SIX).
//
// De eerste volledige ronde legt alleen vast wat er al is; pas daarna telt iets als nieuw.

import type { Config } from "./config.ts";
import type { Listing, Store } from "./store.ts";
import type { Fetch } from "./tradingview.ts";
import { fields, scanner } from "./tradingview.ts";

export const LISTINGS_JOB_KEY = "listings_job";
/** Lokale datum van de laatste volledige ronde. */
export const LISTINGS_DONE_KEY = "listings_done";
/** Wanneer de eerste volledige ronde klaar was; wat daarvoor gezien is, is niet nieuw. */
export const LISTINGS_PRIMED_KEY = "listings_primed";

const PAGE = 1000;
/**
 * Beurzen waar een tweede notering iets betekent. Duitse regionale beurzen, gettex, L&S en
 * Tradegate noteren vrijwel alles en tellen niet mee.
 */
export const MAIN_EXCHANGES = [
  "LSE", "XETR", "SIX", "EURONEXT", "MIL", "BME", "OMXSTO", "OMXCOP", "OMXHEX", "OSL", "VIE", "BX", "AQUIS", "NGM", "LUXSE",
];
const COLUMNS = ["description", "exchange", "country", "isin"] as const;
/** Tijdelijke lijnen bij een emissie, claimrechten en dergelijke zijn geen nieuwe notering. */
const NOT_A_LISTING = /\b(temp|rights?|nil paid|fully paid|bezugsrechte?|droits?|diritti|derechos|teckningsr[aä]tt|bta|interim)\b/i;

type Kind = "primary" | "other";

export function listingsPayload(config: Config, kind: Kind, offset: number): unknown {
  const filter: unknown[] = [
    { left: "is_primary", operation: "equal", right: kind === "primary" },
    { left: "type", operation: "equal", right: "stock" },
  ];
  if (kind === "other") {
    filter.push(
      { left: "exchange", operation: "in_range", right: MAIN_EXCHANGES },
      { left: "country", operation: "in_range", right: config.screenCountries },
    );
  }
  return {
    filter,
    options: { lang: "en" },
    markets: config.screenMarkets,
    columns: COLUMNS,
    sort: { sortBy: "name", sortOrder: "asc" },
    range: [offset, offset + PAGE],
  };
}

export function parseListings(rows: Array<{ s: string; d: unknown[] }>, primary: boolean): Listing[] {
  return rows.map((row) => {
    const f = fields(COLUMNS, row);
    return {
      symbol: row.s,
      name: typeof f.description === "string" ? f.description : "",
      exchange: typeof f.exchange === "string" ? f.exchange : row.s.split(":")[0],
      country: typeof f.country === "string" ? f.country : "",
      isin: typeof f.isin === "string" ? f.isin : "",
      primary,
    };
  });
}

interface Job {
  kind: Kind;
  offset: number;
}

/** Eén pagina van de ronde, als die vandaag nog niet gedaan is. Geeft terug of er iets gedaan is. */
export async function sweepListings(store: Store, config: Config, fetcher: Fetch, now: number, today: string): Promise<boolean> {
  const rawJob = await store.getSetting(LISTINGS_JOB_KEY);
  let job: Job | null = rawJob ? (JSON.parse(rawJob) as Job) : null;
  if (!job) {
    if ((await store.getSetting(LISTINGS_DONE_KEY)) === today) return false;
    job = { kind: "primary", offset: 0 };
  }
  const { rows, total } = await scanner(fetcher, listingsPayload(config, job.kind, job.offset));
  await store.putListings(parseListings(rows, job.kind === "primary"), now);
  job.offset += PAGE;
  if (job.offset < total && rows.length) {
    await store.setSetting(LISTINGS_JOB_KEY, JSON.stringify(job));
  } else if (job.kind === "primary") {
    await store.setSetting(LISTINGS_JOB_KEY, JSON.stringify({ kind: "other", offset: 0 }));
  } else {
    await store.deleteSetting(LISTINGS_JOB_KEY);
    await store.setSetting(LISTINGS_DONE_KEY, today);
    if (!(await store.getSetting(LISTINGS_PRIMED_KEY))) await store.setSetting(LISTINGS_PRIMED_KEY, String(now));
  }
  return true;
}

export interface NewListing extends Listing {
  /** "ipo": nieuw bedrijf; "dubbel": tweede notering van een bekend bedrijf; "verhuisd": nieuwe hoofdnotering. */
  kind: "ipo" | "dubbel" | "verhuisd" | "notering";
  /** Andere noteringen van hetzelfde ISIN die er al waren. */
  others: Listing[];
}

/** Noteringen die sinds dit moment zijn bijgekomen, met wat voor notering het is. */
export async function newListings(store: Store, since: number): Promise<NewListing[]> {
  const primed = Number(await store.getSetting(LISTINGS_PRIMED_KEY));
  if (!primed) return [];
  const fresh = (await store.listingsSince(Math.max(since, primed + 1))).filter((l) => !NOT_A_LISTING.test(l.name));
  if (!fresh.length) return [];
  const known = await store.listingsByIsin([...new Set(fresh.map((l) => l.isin))]);
  return fresh.map((listing) => {
    const others = known.filter((k) => k.isin === listing.isin && k.symbol !== listing.symbol && (k.firstSeen ?? 0) < (listing.firstSeen ?? 0));
    let kind: NewListing["kind"];
    if (listing.primary) kind = others.length ? "verhuisd" : "ipo";
    else kind = others.length ? "dubbel" : "notering";
    return { ...listing, kind, others };
  });
}
