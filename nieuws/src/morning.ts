// Ochtendoverzicht: elke werkdag om 08:40 (OCHTEND_TIJD) één overzicht van alles wat sinds het
// vorige overzicht nieuw is, in een eigen onderwerp. Het draait als eigen aanroep met een eigen
// budget (Workers Free: 50 verzoeken per aanroep) en doet per minuut één stap:
//
// - vanaf 07:00: alle Europese noteringen langs (nieuwe beursgangen en dubbele noteringen),
//   aangekondigd dividend t.o.v. de koers, de IPO-kalender en koersen voor speciaal-dividendnieuws;
// - de hele dag door: persberichten van overnames, claimemissies, FDA, noteringen enz. lezen en
//   de datums (deadline van het bod, laatste handelsdag van de rechten, PDUFA-datum, eerste
//   handelsdag) in de agenda zetten.
//
// Om 08:40 volgt het overzicht met de agenda van de komende dagen bovenaan.

import type { Config } from "./config.ts";
import {
  addDays,
  datesForAgenda,
  daysBetween,
  fold,
  formatDay,
  localTime,
  previousWorkday,
  relativeDay,
  toUnix,
} from "./dates.ts";
import type { NewListing } from "./listings.ts";
import { LISTINGS_DONE_KEY, LISTINGS_JOB_KEY, MAIN_EXCHANGES, newListings, realListing, sweepListings } from "./listings.ts";
import { capRange, countryName, formatCap } from "./screener.ts";
import type { AgendaItem, EventRecord, Store } from "./store.ts";
import { escapeHtml } from "./telegram.ts";
import { RETIRED_FILTERS } from "./config.ts";
import { parseNumber } from "./amount.ts";
import { growthSymbols, isGrowthOslo, refreshGrowthOslo } from "./growth.ts";
import type { Quote, OpenSocket } from "./quotes.ts";
import { fetchQuotes } from "./quotes.ts";
import type { RightsLine, RightsTerms, RightsValue } from "./rights.ts";
import {
  RIGHTS_EXCHANGES,
  RIGHTS_LANG,
  RIGHTS_SEEN_KEY,
  RIGHTS_TERMS_KEY,
  RIGHTS_TITLE,
  companyKey,
  mergeTerms,
  parseRightsTerms,
  rightsValue,
  searchRights,
  termsComplete,
} from "./rights.ts";
import { DEFAULT_FILTERS } from "./config.ts";
import { excludedExchange, groupFilters, matchFilters } from "./screener.ts";
import { bigEnough, lookupCaps, minCaps, parseValuation, readExtra } from "./size.ts";
import type { Fetch, NewsItem } from "./tradingview.ts";
import { chartUrl, fetchNews, fetchStory, fields, scanner } from "./tradingview.ts";

/** Soort melding (en onderwerp) van het ochtendoverzicht. */
export const DIGEST = "ochtend";
export const DAY_KEY = "ochtend_dag";
/** Wanneer het vorige overzicht verstuurd is (seconden). */
export const SENT_KEY = "ochtend_verstuurd";
export const SENT_DATE_KEY = "ochtend_datum";
export const OFF_KEY = "ochtend_uit";

/** Filters waarvan de bot het hele bericht leest, op zoek naar datums voor de agenda. */
export const DATED_FILTERS = ["overname", "claim", "fda", "notering", "ipo", "splitsing", "index", "dividend", "emissie"];
/** Zo vroeg beginnen de voorbereidende stappen (minuten vóór het overzicht). */
const PREP_MINUTES = 100;
/** Tot zo lang na de geplande tijd wordt een gemist overzicht nog verstuurd. */
const LATE_MINUTES = 120;
/** Berichten lezen per run (rekentijd: Workers Free geeft 10 ms per aanroep). */
const STORIES_PER_RUN = 3;
/** Zoveel rechtenlijnen per minuut naar hun voorwaarden zoeken (elk tot 6 verzoeken). */
const TERMS_PER_RUN = 3;
/** Hoe oud een bericht over een claimemissie mag zijn om er de voorwaarden uit te halen. */
const TERMS_MAX_AGE_DAYS = 120;
/** Melding als meedoen via de rechten zoveel goedkoper is dan het aandeel (/rechtenalarm). */
export const RIGHTS_ALERT_KEY = "rights_alert_pct";
const DEFAULT_RIGHTS_ALERT = 0.02;
/** Wat er vandaag al gemeld is: {date, edges: {symbool: voordeel}}. */
const RIGHTS_ALERTED_KEY = "rights_alerted";
/** Laatste ronde van de rechtenwacht, voor /status en controle. */
export const RIGHTS_WATCH_KEY = "rights_watch";
/** De rechtenwacht kijkt tijdens de beurs: de eerste half uur elke minuut, daarna om de 5 minuten. */
const WATCH_FROM = 9 * 60;
const WATCH_TO = 17 * 60 + 30;
const KEEP_EVENTS_SECONDS = 45 * 24 * 3600;
const MAX_LINES = 12;
const MAX_MESSAGE = 3900;

// ---------------------------------------------------------------- dagstand

export interface DividendRow {
  symbol: string;
  name: string;
  country: string;
  amount: number;
  close: number;
  currency: string;
  exDate: string;
  payDate?: string;
}

export interface IpoRow {
  symbol: string;
  name: string;
  exchange: string;
  country: string;
  status: string;
  /** "2026-10-14" of leeg als de datum nog niet bekend is. */
  date: string;
  priceUsd?: number;
  capUsd?: number;
}

export interface Price {
  close: number;
  currency: string;
  name: string;
}

export interface ListingInfo {
  capEur?: number;
  /** "2026-10-01", als TradingView een IPO-datum heeft. */
  ipoDate?: string;
}

/** Een beursgang die langer geleden is, is een oud aandeel dat even uit de lijst was. */
const IPO_MAX_AGE_DAYS = 60;
/** Ruwe koers voor de IPO-kalender (die geeft dollars); voor een grens van €100 mln is dat genoeg. */
const EUR_PER_USD = 0.9;

export interface DayState {
  date: string;
  done: string[];
  errors: string[];
  dividends?: DividendRow[];
  ipos?: IpoRow[];
  prices?: Record<string, Price>;
  /** Lopende claimrechten (rechtenkalender). */
  rights?: RightsLine[];
  /** Slotkoersen van de rechten en hun aandelen. */
  quotes?: Record<string, Quote>;
  /** Marktwaarde en IPO-datum van de nieuwe noteringen van vandaag. */
  listings?: Record<string, ListingInfo>;
}

async function loadDay(store: Store, today: string): Promise<DayState> {
  const raw = await store.getSetting(DAY_KEY);
  try {
    const state = raw ? (JSON.parse(raw) as DayState) : null;
    if (state?.date === today) return state;
  } catch {
    // Kapotte stand: opnieuw beginnen.
  }
  return { date: today, done: [], errors: [] };
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** Begin van het venster: het vorige overzicht, hoogstens vier dagen terug. */
export async function windowStart(store: Store, now: number): Promise<number> {
  const sent = Number(await store.getSetting(SENT_KEY)) || 0;
  return Math.max(sent || now - 24 * 3600, now - 4 * 24 * 3600);
}

// ---------------------------------------------------------------- stappen

export interface MorningDeps {
  store: Store;
  config: Config;
  fetcher: Fetch;
  now: number;
  log?: (message: string) => void;
  /** Koersverbinding voor rechten; zonder deze geen koersen en geen rechtenwacht. */
  openSocket?: OpenSocket;
  /** Directe melding (rechtenwacht), naar het onderwerp van claimemissies. */
  alert?: (html: string) => Promise<void>;
}

const PRIMARY_STOCKS = [
  { left: "is_primary", operation: "equal", right: true },
  { left: "type", operation: "equal", right: "stock" },
];

const DIVIDEND_COLUMNS = [
  "description", "country", "close", "currency", "dividend_amount_upcoming", "dividend_ex_date_upcoming",
  "dividend_payment_date_upcoming",
] as const;

export function dividendPayload(config: Config, todayStart: number): unknown {
  return {
    filter: [
      ...PRIMARY_STOCKS,
      { left: "dividend_amount_upcoming", operation: "greater", right: 0 },
      { left: "dividend_ex_date_upcoming", operation: "greater", right: todayStart - 1 },
    ],
    options: { lang: "en" },
    markets: config.screenMarkets,
    columns: DIVIDEND_COLUMNS,
    sort: { sortBy: "dividend_ex_date_upcoming", sortOrder: "asc" },
    range: [0, 1000],
    // Bedragen in de munt van het aandeel (zonder dit: dollars).
    price_conversion: { to_symbol: true },
  };
}

function isoDate(unix: unknown, timeZone: string): string {
  const value = num(unix);
  return value ? localTime(value, timeZone).date : "";
}

/** Aangekondigde dividenden van minstens `ratio` van de koers. */
export function parseDividends(rows: Array<{ s: string; d: unknown[] }>, config: Config): DividendRow[] {
  const countries = new Set(config.screenCountries);
  const result: DividendRow[] = [];
  for (const row of rows) {
    const f = fields(DIVIDEND_COLUMNS, row);
    const amount = num(f.dividend_amount_upcoming);
    const close = num(f.close);
    if (!amount || !close || amount / close < config.dividendRatio) continue;
    if (!countries.has(text(f.country))) continue;
    result.push({
      symbol: row.s,
      name: text(f.description),
      country: text(f.country),
      amount,
      close,
      currency: text(f.currency),
      exDate: isoDate(f.dividend_ex_date_upcoming, config.timeZone),
      payDate: isoDate(f.dividend_payment_date_upcoming, config.timeZone) || undefined,
    });
  }
  return result.sort((a, b) => b.amount / b.close - a.amount / a.close);
}

const IPO_COLUMNS = [
  "description", "exchange", "country", "ipo_offer_status", "ipo_offer_date", "ipo_offer_price_usd", "ipo_market_cap_usd",
] as const;

/** Nog niet genoteerd ("pending"), of de afgelopen week voor het eerst verhandeld ("recent"). */
export function ipoPayload(config: Config, which: "pending" | "recent", todayStart: number): unknown {
  const filter =
    which === "pending"
      ? [
          { left: "ipo_offer_status", operation: "nempty" },
          { left: "ipo_offer_status", operation: "not_in_range", right: ["closed", "withdrawn", "postponed"] },
        ]
      : [{ left: "ipo_offer_date", operation: "greater", right: todayStart - 7 * 86400 }];
  return {
    filter,
    options: { lang: "en" },
    markets: config.screenMarkets,
    columns: IPO_COLUMNS,
    sort: { sortBy: "ipo_offer_date", sortOrder: "asc" },
    range: [0, 200],
  };
}

interface Step {
  name: string;
  /** Vanaf zoveel minuten vóór het overzicht. */
  from: number;
  /** Geeft true als er nog werk over is; dan komt de stap de volgende minuut terug. */
  run: (deps: MorningDeps, state: DayState, today: string) => Promise<void | boolean>;
}

const STEPS: Step[] = [
  {
    name: "dividend",
    from: PREP_MINUTES,
    async run({ store, config, fetcher, now }, state, today) {
      const start = toUnix(today, 0, config.timeZone);
      const { rows } = await scanner(fetcher, dividendPayload(config, start));
      const growth = await growthSymbols(store);
      state.dividends = parseDividends(rows, config).filter((d) => !growth.has(d.symbol));
      await store.addAgenda(
        state.dividends
          .filter((d) => d.exDate)
          .map((d) => ({
            key: `div:${d.symbol}:${d.exDate}`,
            date: d.exDate,
            kind: "dividend",
            label: `ex-dividend ${money(d.amount, d.currency)} (${Math.round((d.amount / d.close) * 100)}% van de koers)`,
            symbol: d.symbol,
            name: d.name,
            title: "",
            url: "",
          })),
        now,
      );
    },
  },
  {
    name: "ipo",
    from: PREP_MINUTES,
    async run({ store, config, fetcher, now }, state, today) {
      const start = toUnix(today, 0, config.timeZone);
      const rows = [
        ...(await scanner(fetcher, ipoPayload(config, "pending", start))).rows,
        ...(await scanner(fetcher, ipoPayload(config, "recent", start))).rows,
      ];
      // Alleen de hoofdbeurzen: op Frankfurt en dergelijke staan ook "pending" regels van bestaande aandelen.
      const growth = await growthSymbols(store);
      const unique = new Map(
        rows.filter((row) => MAIN_EXCHANGES.includes(row.s.split(":")[0]) && !growth.has(row.s)).map((row) => [row.s, row]),
      );
      state.ipos = [...unique.values()].map((row) => {
        const f = fields(IPO_COLUMNS, row);
        return {
          symbol: row.s,
          name: text(f.description),
          exchange: text(f.exchange),
          country: text(f.country),
          status: text(f.ipo_offer_status),
          date: isoDate(f.ipo_offer_date, config.timeZone),
          priceUsd: num(f.ipo_offer_price_usd) ?? undefined,
          capUsd: num(f.ipo_market_cap_usd) ?? undefined,
        };
      });
      await store.addAgenda(
        state.ipos
          .filter((i) => i.date && i.date >= today)
          .map((i) => ({
            key: `ipo:${i.symbol}:${i.date}`,
            date: i.date,
            kind: "ipo",
            label: `IPO, eerste handelsdag (${i.exchange})`,
            symbol: i.symbol,
            name: i.name,
            title: "",
            url: "",
          })),
        now,
      );
    },
  },
  {
    // Rechtenkalender: alle claimrechten op de Europese beurzen, gekoppeld aan hun bedrijf.
    name: "rechten",
    from: PREP_MINUTES,
    async run({ store, fetcher, now }, state, today) {
      const lines: RightsLine[] = [];
      for (const exchange of RIGHTS_EXCHANGES) {
        try {
          lines.push(...(await searchRights(fetcher, exchange)));
        } catch (error) {
          state.errors.push(error instanceof Error ? error.message : String(error));
        }
      }
      // Dezelfde lijn kan bij meer dan één beurs opduiken; verlopen rechten tellen niet meer.
      const unique = new Map(lines.filter((l) => !l.expiry || l.expiry >= today).map((l) => [l.symbol, l]));
      const seenRaw = await store.getSetting(RIGHTS_SEEN_KEY);
      const seen: Record<string, string> = seenRaw ? (JSON.parse(seenRaw) as Record<string, string>) : {};
      const companies = new Map(
        (await store.primaryListings([...new Set([...unique.values()].map((l) => l.exchange))])).map((l) => [companyKey(l.name), l]),
      );
      const growth = await growthSymbols(store);
      const current: RightsLine[] = [];
      for (const line of unique.values()) {
        const company = companies.get(companyKey(line.company));
        if (company && (growth.has(company.symbol) || growth.has(company.isin))) continue;
        // Zonder vervaldatum alleen zolang de lijn nieuw is (sommige lijnen blijven na afloop staan).
        // De allereerste keer is niets nieuw: dan bestonden de lijnen al.
        const firstSeen = seen[line.symbol] ?? (seenRaw ? today : "2000-01-01");
        if (!line.expiry && daysBetween(firstSeen, today) > 21) continue;
        current.push({ ...line, companySymbol: company?.symbol, firstSeen });
      }
      const caps = await lookupCaps(fetcher, current.flatMap((l) => (l.companySymbol ? [l.companySymbol] : [])));
      const min = await minCaps(store);
      state.rights = current
        .map((l) => ({ ...l, capEur: l.companySymbol ? caps.get(l.companySymbol) : undefined }))
        .filter((l) => bigEnough("claim", l.capEur, min));
      await store.setSetting(RIGHTS_SEEN_KEY, JSON.stringify(Object.fromEntries(current.map((l) => [l.symbol, l.firstSeen!]))));
      await store.addAgenda(
        state.rights
          .filter((l) => l.expiry)
          .map((l) => ({
            key: `rights:${l.symbol}:${l.expiry}`,
            date: l.expiry,
            kind: "claim",
            label: `claimrechten ${ticker(l.symbol)} vervallen (einde inschrijving)`,
            symbol: l.companySymbol ?? l.symbol,
            name: l.company,
            title: "",
            url: "",
          })),
        now,
      );
    },
  },
  {
    // Uitgifteprijs en verhouding van elke claimemissie, uit de persberichten (eenmaal gevonden blijft het staan).
    name: "rechtenvoorwaarden",
    from: PREP_MINUTES,
    async run({ store, fetcher, now }, state, today) {
      const cache = await loadTerms(store);
      const todo = (state.rights ?? []).filter(
        (l) => l.companySymbol && !cache[l.symbol]?.manual && !termsComplete(cache[l.symbol]) && cache[l.symbol]?.checked !== today,
      );
      for (const line of todo.slice(0, TERMS_PER_RUN)) {
        try {
          cache[line.symbol] = { ...(await findTerms(fetcher, line, now)), checked: today };
        } catch (error) {
          state.errors.push(`voorwaarden ${line.symbol}: ${error instanceof Error ? error.message : String(error)}`);
          cache[line.symbol] = { ...cache[line.symbol], checked: today };
        }
      }
      const current = new Set((state.rights ?? []).map((l) => l.symbol));
      await saveTerms(
        store,
        Object.fromEntries(Object.entries(cache).filter(([symbol, t]) => current.has(symbol) || (t.checked && daysBetween(t.checked, today) < 30))),
      );
      return todo.length > TERMS_PER_RUN;
    },
  },
  {
    // Slotkoersen van de rechten en hun aandelen, om uit te rekenen of meedoen loont.
    name: "rechtenkoersen",
    from: 20,
    async run({ openSocket }, state) {
      if (!openSocket || !state.rights?.length) return;
      const symbols = state.rights.flatMap((l) => [l.symbol, ...(l.companySymbol ? [l.companySymbol] : [])]);
      state.quotes = Object.fromEntries(await fetchQuotes(openSocket, symbols));
    },
  },
  {
    // Koersen van aandelen met speciaal-dividendnieuws, om het bedrag naast de koers te leggen.
    name: "prijzen",
    from: 15,
    async run({ store, fetcher, now }, state) {
      const since = await windowStart(store, now);
      const symbols = [
        ...new Set((await store.eventsSince(since)).filter((e) => e.filter === "dividend" && e.symbol).map((e) => e.symbol)),
      ].slice(0, 100);
      if (!symbols.length) return;
      const { rows } = await scanner(fetcher, { symbols: { tickers: symbols }, columns: ["close", "currency", "description"] });
      state.prices = {};
      for (const row of rows) {
        const close = num(row.d[0]);
        if (close) state.prices[row.s] = { close, currency: text(row.d[1]), name: text(row.d[2]) };
      }
    },
  },
  {
    // Marktwaarde en IPO-datum van de nieuwe noteringen, voor het minimum per filter.
    name: "noteringinfo",
    from: 30,
    async run({ store, config, fetcher, now }, state) {
      const fresh = (await newListings(store, await windowStart(store, now))).filter(realListing);
      if (!fresh.length) return;
      const { rows } = await scanner(fetcher, {
        symbols: { tickers: fresh.map((l) => l.symbol).slice(0, 200) },
        columns: ["market_cap_basic", "ipo_offer_date"],
        price_conversion: { to_currency: "eur" },
      });
      state.listings = {};
      for (const row of rows) {
        state.listings[row.s] = {
          capEur: num(row.d[0]) ?? undefined,
          ipoDate: isoDate(row.d[1], config.timeZone) || undefined,
        };
      }
    },
  },
];

/** Persberichten lezen: datums naar de agenda, dividendbedragen bij het bericht. */
export async function checkStories(deps: MorningDeps, today: string, limit = STORIES_PER_RUN): Promise<number> {
  const { store, config, fetcher, now } = deps;
  const pending = await store.uncheckedEvents(DATED_FILTERS, limit * 4);
  const byId = new Map<string, EventRecord[]>();
  for (const event of pending) byId.set(event.id, [...(byId.get(event.id) ?? []), event]);
  const ids = [...byId.keys()].slice(0, limit);
  const items: AgendaItem[] = [];
  const extra: Record<string, string> = {};
  const caps = await minCaps(store);
  const promoted: EventRecord[] = [];
  for (const id of ids) {
    const events = byId.get(id)!;
    const event = events[0];
    let body = "";
    try {
      const story = await fetchStory(fetcher, id, event.lang);
      body = story.text ?? story.summary ?? "";
    } catch (error) {
      deps.log?.(`${id}: bericht niet gelezen (${error instanceof Error ? error.message : error})`);
    }
    const full = `${event.title}\n${body}`;
    // Grootte en dividendbedrag uit het bericht, bij wat de screener al wist.
    const base = readExtra(event.extra);
    const next = { ...base };
    if (next.capEur === undefined) {
      const valuation = parseValuation(full);
      if (valuation) next.capEur = Math.round(valuation);
    }
    if (events.some((e) => e.filter === "dividend")) {
      const amount = parseDividendAmount(full);
      if (amount) Object.assign(next, amount);
    }
    if (JSON.stringify(next) !== JSON.stringify(base)) extra[id] = JSON.stringify(next);
    // Een emissie waarvan het bericht over verhandelbare rechten gaat, is een claimemissie
    // ("Unipol, prezzo aumento capitale fissato": de rechten staan pas in de tekst).
    if (!events.some((e) => e.filter === "claim") && events.some((e) => e.filter === "emissie") && matchFilters(full, CLAIM_WORDS).length) {
      promoted.push({ ...event, filter: "claim", extra: extra[id] ?? event.extra });
      events.push({ ...event, filter: "claim" });
    }
    // Blijkt het bedrijf te klein (waardering in het bericht), dan ook geen agendapunt.
    if (!events.some((e) => bigEnough(e.filter, next.capEur, caps))) continue;
    const reference = event.published ? localTime(event.published, config.timeZone).date : today;
    // Het filter dat het meest over de datum zegt (een overname gaat voor een notering).
    const kind = DATED_FILTERS.find((f) => events.some((e) => e.filter === f)) ?? event.filter;
    // Bij een gewone emissie (placing, ABB) zijn de datums afwikkeling en notering: geen agenda.
    if (kind === "emissie") continue;
    for (const found of datesForAgenda(full, reference, today)) {
      // Een losse datum zonder duidelijk soort ("datum uit bericht") is in de agenda alleen ruis.
      if (found.label === "datum uit bericht") continue;
      items.push({
        key: `${kind}:${event.symbol || fold(event.title).slice(0, 40)}:${found.date}:${found.label}`,
        date: found.date,
        kind,
        label: found.label,
        symbol: event.symbol,
        name: event.name,
        title: event.title,
        url: event.url,
      });
    }
  }
  await store.recordEvents(promoted, now);
  await store.addAgenda(items, now);
  await store.markEventsChecked(ids, extra);
  return ids.length;
}

export interface RunResult {
  step?: string;
  sent?: number;
  /** Meldingen van de rechtenwacht. */
  alerts?: number;
  stories: number;
  errors: string[];
}

/** Eén minuut ochtendwerk. `send` verstuurt een bericht naar het onderwerp van het overzicht. */
export async function runMorningStep(deps: MorningDeps, send: (html: string) => Promise<void>): Promise<RunResult> {
  const { store, config, now } = deps;
  const result: RunResult = { stories: 0, errors: [] };
  const local = localTime(now, config.timeZone);
  const today = local.date;
  const untilDigest = config.digestMinutes - local.minutes;
  const active = local.weekday <= 5 && !(await store.getSetting(OFF_KEY)) && (await store.getSetting(SENT_DATE_KEY)) !== today;
  const state = await loadDay(store, today);

  // Om 08:40 gaat het overzicht voor alles, ook als een stap mislukte of nog niet aan de beurt kwam.
  if (active && untilDigest <= 0 && untilDigest > -LATE_MINUTES) {
    const messages = await composeDigest(deps, state);
    let delivered = 0;
    for (const message of messages) {
      try {
        await send(message);
        delivered++;
      } catch (error) {
        // Niets verstuurd: volgende minuut opnieuw. Deels verstuurd: niet alles nog eens sturen.
        if (!delivered) throw error;
        result.errors.push(`overzicht deels verstuurd: ${error instanceof Error ? error.message : String(error)}`);
        break;
      }
    }
    await store.setSetting(SENT_KEY, String(now));
    await store.setSetting(SENT_DATE_KEY, today);
    result.sent = delivered;
    await store.pruneEvents(now - KEEP_EVENTS_SECONDS);
    await store.pruneAgenda(addDays(today, -7));
    return result;
  }

  // Lijst van Euronext Growth Oslo: elke dag één keer.
  try {
    if (await refreshGrowthOslo(store, deps.fetcher, today)) result.step = "growth-oslo";
  } catch (error) {
    result.errors.push(`Euronext Growth Oslo: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Noteringen: elke dag één ronde, vanaf de voorbereidingstijd (of meteen bij een nieuwe installatie).
  const listingsDone = await store.getSetting(LISTINGS_DONE_KEY);
  const sweeping = !!(await store.getSetting(LISTINGS_JOB_KEY));
  if (!result.step && (sweeping || (listingsDone !== today && (untilDigest <= PREP_MINUTES || !listingsDone)))) {
    try {
      if (await sweepListings(store, config, deps.fetcher, now, today)) result.step = "noteringen";
    } catch (error) {
      result.errors.push(`noteringen: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const runStep = async (step: Step) => {
    result.step = step.name;
    let more = false;
    try {
      more = (await step.run(deps, state, today)) === true;
    } catch (error) {
      state.errors.push(`${step.name}: ${error instanceof Error ? error.message : String(error)}`);
    }
    if (!more) state.done.push(step.name);
    await store.setSetting(DAY_KEY, JSON.stringify(state));
  };

  // De voorbereidende stappen, één per minuut, alleen vóór het overzicht.
  if (!result.step && active) {
    const step = STEPS.find((s) => !state.done.includes(s.name) && untilDigest <= s.from && untilDigest > 0);
    if (step) await runStep(step);
  }

  // Tijdens de beurs: rechten die ver onder hun waarde noteren. Was er vanochtend geen
  // rechtenkalender (storing, of net live gezet), dan eerst die.
  const watching = local.weekday <= 5 && local.minutes > WATCH_FROM && local.minutes <= WATCH_TO;
  if (!result.step && watching && deps.openSocket) {
    const missing = ["rechten", "rechtenvoorwaarden"].find((name) => !state.done.includes(name));
    if (missing) await runStep(STEPS.find((s) => s.name === missing)!);
    else if (local.minutes - WATCH_FROM <= 30 || local.minutes % 5 === 0) {
      try {
        result.alerts = await watchRights(deps, state, today);
      } catch (error) {
        result.errors.push(`rechtenwacht: ${error instanceof Error ? error.message : String(error)}`);
        await store.setSetting(RIGHTS_WATCH_KEY, JSON.stringify({ at: now, error: error instanceof Error ? error.message : String(error) }));
      }
    }
  }

  // Tijd over: persberichten lezen.
  try {
    result.stories = await checkStories(deps, today);
  } catch (error) {
    result.errors.push(`berichten lezen: ${error instanceof Error ? error.message : String(error)}`);
  }
  return result;
}

// ---------------------------------------------------------------- claimrechten: voorwaarden en waarde

export async function loadTerms(store: Store): Promise<Record<string, RightsTerms>> {
  try {
    return JSON.parse((await store.getSetting(RIGHTS_TERMS_KEY)) ?? "{}") as Record<string, RightsTerms>;
  } catch {
    return {};
  }
}

export async function saveTerms(store: Store, terms: Record<string, RightsTerms>): Promise<void> {
  await store.setSetting(RIGHTS_TERMS_KEY, JSON.stringify(terms));
}

/**
 * Uitgifteprijs en verhouding uit het nieuws over het bedrijf, in de eigen taal en in het Engels:
 * de nieuwste berichten over de claimemissie, tot prijs en verhouding allebei bekend zijn.
 */
export async function findTerms(fetcher: Fetch, line: RightsLine, now: number): Promise<RightsTerms> {
  const symbol = line.companySymbol;
  if (!symbol) return {};
  const items = new Map<string, NewsItem & { lang: string }>();
  for (const lang of new Set([RIGHTS_LANG[line.exchange] ?? "en", "en"])) {
    try {
      for (const item of await fetchNews(fetcher, symbol, lang)) if (!items.has(item.id)) items.set(item.id, { ...item, lang });
    } catch {
      // Taal niet beschikbaar: dan alleen de andere.
    }
  }
  const recent = [...items.values()]
    .filter((item) => item.published > now - TERMS_MAX_AGE_DAYS * 86400 && RIGHTS_TITLE.test(fold(item.title)))
    .sort((a, b) => b.published - a.published);
  const found: RightsTerms[] = [];
  for (const item of recent.slice(0, 4)) {
    let story = "";
    try {
      const details = await fetchStory(fetcher, item.id, item.lang);
      story = details.text ?? details.summary ?? "";
    } catch {
      // Alleen de kop dan.
    }
    const terms = parseRightsTerms(`${item.title}\n${story}`);
    if (terms.price || terms.newShares) found.push({ ...terms, source: item.title, url: item.storyUrl ?? item.link ?? "" });
    if (termsComplete(mergeTerms(found))) break;
  }
  const terms = mergeTerms(found);
  // In Noorwegen krijg je een aantal rechten naar rato, en geeft elk recht één nieuw aandeel.
  if (terms.price && !terms.newShares && line.exchange === "OSL" && !terms.units) {
    terms.newShares = 1;
    terms.perRights = 1;
    terms.assumed = "1 recht = 1 nieuw aandeel, zoals gebruikelijk in Noorwegen";
  }
  return terms;
}

/** Koers met genoeg decimalen voor rechten van een paar cent. */
function quotePrice(value: number, currency: string | undefined): string {
  const digits = value >= 10 ? 2 : value >= 1 ? 3 : value >= 0.1 ? 3 : 4;
  const shown = value.toLocaleString("nl-NL", { minimumFractionDigits: Math.min(digits, 2), maximumFractionDigits: digits });
  const cur = (currency ?? "").toUpperCase();
  if (cur === "EUR") return `€${shown}`;
  if (cur === "GBP") return `£${shown}`;
  return cur ? `${shown} ${cur}` : shown;
}

function pct1(ratio: number): string {
  return `${(Math.abs(ratio) * 100).toLocaleString("nl-NL", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

function ratioText(terms: RightsTerms): string {
  const what = terms.units ? (terms.newShares === 1 ? "unit" : "units") : terms.newShares === 1 ? "nieuw aandeel" : "nieuwe aandelen";
  const unit = terms.units && terms.sharesPerUnit ? ` (${terms.sharesPerUnit} ${terms.sharesPerUnit === 1 ? "aandeel" : "aandelen"} per unit)` : "";
  return `${formatCount(terms.newShares!)} ${what} per ${formatCount(terms.perRights!)} ${terms.perRights === 1 ? "recht" : "rechten"}${unit}`;
}

function formatCount(value: number): string {
  return value.toLocaleString("nl-NL", { maximumFractionDigits: 4 });
}

/** "via rechten €24,69 per aandeel = 0,7% goedkoper dan het aandeel (recht 4% onder z'n waarde €0,729)". */
export function verdict(value: RightsValue, currency: string | undefined): string {
  const via = `via rechten ${quotePrice(value.viaRights, currency)} per aandeel`;
  const under = value.discount !== null && value.discount > 0 ? `, recht ${pct1(value.discount)} onder z'n waarde ${quotePrice(value.value, currency)}` : "";
  if (value.edge >= 0.01) return `✅ <b>winstgevend</b>: ${via} = <b>${pct1(value.edge)} goedkoper</b> dan het aandeel${under}`;
  if (value.edge >= 0) return `➖ nauwelijks marge: ${via} = ${pct1(value.edge)} goedkoper dan het aandeel${under}`;
  return `❌ niet winstgevend: ${via} = ${pct1(value.edge)} duurder dan het aandeel; het aandeel kopen is goedkoper`;
}

/** De regels onder een rechtenlijn in het overzicht: slotkoersen, voorwaarden en de rekensom. */
export function rightsCalcLines(line: RightsLine, terms: RightsTerms | undefined, quotes: Record<string, Quote> | undefined, today: string, tz: string): string[] {
  const right = quotes?.[line.symbol];
  const share = line.companySymbol ? quotes?.[line.companySymbol] : undefined;
  const parts: string[] = [];
  const printed = (q: Quote | undefined, label: string) => {
    if (q?.last === undefined) return;
    const day = q.lastTime ? localTime(q.lastTime, tz).date : "";
    const old = day && daysBetween(day, today) > 4 ? ` (laatst verhandeld ${escapeHtml(formatDay(day, today))})` : "";
    parts.push(`${label} ${escapeHtml(quotePrice(q.last, q.currency))}${old}`);
  };
  printed(right, "slot recht");
  printed(share, "aandeel");
  if (terms?.price) parts.push(`uitgifte ${escapeHtml(quotePrice(terms.price, terms.currency === "KR" ? share?.currency : terms.currency))}`);
  if (terms?.newShares && terms.perRights) parts.push(escapeHtml(ratioText(terms)));
  const source = terms?.manual ? " (zelf ingevoerd)" : terms?.url ? ` · <a href="${escapeHtml(terms.url)}">bron</a>` : "";
  const lines: string[] = [];
  if (parts.length) lines.push(`   💹 ${parts.join(" · ")}${source}`);
  const value = right?.last !== undefined && share?.last !== undefined ? rightsValue(terms, share.last, right.last, share.currency) : null;
  if (value) {
    lines.push(`   ${verdict(value, share?.currency)}${terms?.assumed ? ` (aanname: ${escapeHtml(terms.assumed)})` : ""}`);
  } else if (!termsComplete(terms)) {
    const missing = !terms?.price ? (terms?.newShares ? "uitgifteprijs" : "uitgifteprijs en verhouding") : terms.units && terms.newShares ? "samenstelling van de unit" : "verhouding";
    lines.push(`   ❔ ${missing} niet gevonden · zelf invullen: /rechten ${escapeHtml(ticker(line.symbol))} &lt;prijs&gt; &lt;nieuw&gt;/&lt;rechten&gt;`);
  }
  return lines;
}

/** Hoeveel voordeel (0,02 = 2%) een melding waard is; 0 = uit. */
export async function rightsAlertThreshold(store: Store): Promise<number> {
  const raw = await store.getSetting(RIGHTS_ALERT_KEY);
  const value = raw === null ? NaN : Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : DEFAULT_RIGHTS_ALERT;
}

/**
 * Rechtenwacht: koopt je nu de rechten (tegen de laatprijs) en schrijf je in, hoeveel goedkoper
 * is dat dan dan het aandeel verkopen (tegen de biedprijs)? Boven de drempel een melding, en
 * opnieuw als het voordeel nog een procentpunt groter wordt.
 */
export async function watchRights(deps: MorningDeps, state: DayState, today: string): Promise<number> {
  const { store, now, openSocket, alert, config } = deps;
  if (!openSocket || !alert) return 0;
  const threshold = await rightsAlertThreshold(store);
  if (!threshold) return 0;
  const cache = await loadTerms(store);
  const lines = (state.rights ?? []).filter((l) => l.companySymbol && termsComplete(cache[l.symbol]));
  if (!lines.length) {
    await store.setSetting(RIGHTS_WATCH_KEY, JSON.stringify({ at: now, lines: 0 }));
    return 0;
  }
  const quotes = await fetchQuotes(openSocket, lines.flatMap((l) => [l.symbol, l.companySymbol!]));
  let raw: { date?: string; edges?: Record<string, number> } = {};
  try {
    raw = JSON.parse((await store.getSetting(RIGHTS_ALERTED_KEY)) ?? "{}");
  } catch {
    // Opnieuw beginnen.
  }
  const edges = raw.date === today ? (raw.edges ?? {}) : {};
  const tradedToday = (q: Quote | undefined) => !!q?.lastTime && localTime(q.lastTime, config.timeZone).date === today;
  const later = await store.listAgenda(today, addDays(today, 60));
  let sent = 0;
  const seen: Record<string, number> = {};
  for (const line of lines) {
    const rq = quotes.get(line.symbol);
    const sq = quotes.get(line.companySymbol!);
    // Alleen als allebei vandaag verhandeld zijn; anders is de koers van gisteren.
    if (!rq || !sq || !tradedToday(rq) || !tradedToday(sq)) continue;
    const rightPrice = rq.ask ?? rq.last;
    const sharePrice = sq.bid ?? sq.last;
    if (rightPrice === undefined || sharePrice === undefined) continue;
    const terms = cache[line.symbol];
    const value = rightsValue(terms, sharePrice, rightPrice, sq.currency);
    if (!value) continue;
    seen[line.symbol] = Math.round(value.edge * 1000) / 1000;
    const before = edges[line.symbol];
    if (value.edge < threshold || (before !== undefined && value.edge < before + 0.01)) continue;
    const lastDay = later.find((item) => item.symbol === line.companySymbol && /laatste handelsdag rechten/.test(item.label));
    const warn = lastDay?.date === today ? "\n⚠️ <b>vandaag laatste handelsdag van de rechten</b>" : "";
    const subscribe = line.expiry ? ` (inschrijven kan tot ${escapeHtml(formatDay(line.expiry, today))})` : "";
    await alert(
      [
        `🧾💰 <b>${escapeHtml(ticker(line.symbol))}</b> rechten ${escapeHtml(line.company)}: meedoen is nu <b>${pct1(value.edge)} goedkoper</b> dan het aandeel`,
        `recht ${escapeHtml(quotePrice(rightPrice, rq.currency))}${rq.ask !== undefined ? " (laat)" : ""} · aandeel ${escapeHtml(quotePrice(sharePrice, sq.currency))}${sq.bid !== undefined ? " (bied)" : ""} · uitgifte ${escapeHtml(quotePrice(terms.price!, sq.currency))} · ${escapeHtml(ratioText(terms))}`,
        `via rechten ${escapeHtml(quotePrice(value.viaRights, sq.currency))} per aandeel${value.discount !== null ? ` · recht ${pct1(value.discount)} onder z'n waarde ${escapeHtml(quotePrice(value.value, sq.currency))}` : ""}${warn}`,
        ...(terms.assumed ? [`Aanname: ${escapeHtml(terms.assumed)}; check het prospectus.`] : []),
        `De nieuwe aandelen komen pas na de inschrijving${subscribe}: wie het verschil wil vastzetten, verkoopt het aandeel short. Vóór kosten.`,
        `<a href="${escapeHtml(chartUrl(line.symbol))}">grafiek recht</a> · <a href="${escapeHtml(chartUrl(line.companySymbol!))}">grafiek aandeel</a>`,
      ].join("\n"),
    );
    edges[line.symbol] = value.edge;
    sent++;
  }
  await store.setSetting(RIGHTS_ALERTED_KEY, JSON.stringify({ date: today, edges }));
  await store.setSetting(RIGHTS_WATCH_KEY, JSON.stringify({ at: now, lines: lines.length, quotes: quotes.size, edges: seen, sent }));
  return sent;
}

// ---------------------------------------------------------------- bedragen

export interface Amount {
  amount: number;
  /** ISO-munt, "GBX" voor pence, "KR" als onduidelijk is welke kroon, "ORE" voor öre/øre. */
  currency: string;
}

const CURRENCY: Record<string, string> = {
  eur: "EUR", euro: "EUR", euros: "EUR", "€": "EUR", chf: "CHF", sek: "SEK", nok: "NOK", dkk: "DKK", gbp: "GBP",
  "£": "GBP", usd: "USD", "$": "USD", p: "GBX", pence: "GBX", gbx: "GBX", kr: "KR", kronor: "SEK", kroner: "KR",
  ore: "ORE", cents: "CENT", cent: "CENT", rappen: "CENT", pln: "PLN",
};
const CUR = "(eur|euros?|€|chf|sek|nok|dkk|gbp|£|usd|\\$|pence|gbx|kr|kronor|kroner|ore|cents?|rappen|p)";
const NUMBER = "(\\d{1,3}(?:[.,\\s]\\d{3})*(?:[.,]\\d{1,4})?|\\d+(?:[.,]\\d{1,4})?)";
const SPECIAL = "(?:special|extraordinary|extra|one-off|one-time|bonus|sonder|zusatz|super|exceptionnel|extraordinaire|straordinari|extraordinari|especial|speciale|speciaal|ekstraordin|tilleggs|lisa)\\w*";
const DIVIDEND = "(?:dividend|dividende|dividendo|distribution|ausschuttung|utdelning|utbytte|udbytte|osinko)\\w*";
/** "special dividend", "Sonderdividende", maar ook "dividende exceptionnel", "dividendo straordinario". */
const DIVIDEND_WORDS = new RegExp(`${SPECIAL}\\s*(?:cash\\s+)?${DIVIDEND}|${DIVIDEND}\\s+${SPECIAL}`);

/**
 * Het bedrag van een speciaal dividend uit kop of tekst: het eerste bedrag met munt binnen
 * 120 tekens na de woorden "special dividend", "Sonderdividende", ... ("Sonderdividende von
 * 1,50 EUR je Aktie", "special dividend of 25p", "dividende exceptionnel de 2 €").
 */
export function parseDividendAmount(raw: string): Amount | null {
  const folded = fold(raw);
  const anchor = DIVIDEND_WORDS.exec(folded);
  if (!anchor) return null;
  const window = folded.slice(anchor.index, anchor.index + anchor[0].length + 120);
  const before = new RegExp(`(?:^|[^a-z])${CUR}\\s?${NUMBER}(?![\\d])`, "g");
  const after = new RegExp(`${NUMBER}\\s?${CUR}(?![a-z])`, "g");
  const candidates: Array<{ index: number; amount: number; currency: string }> = [];
  for (const m of window.matchAll(before)) candidates.push({ index: m.index, amount: parseNumber(m[2]), currency: m[1] });
  for (const m of window.matchAll(after)) candidates.push({ index: m.index, amount: parseNumber(m[1]), currency: m[2] });
  const first = candidates
    .filter((c) => Number.isFinite(c.amount) && c.amount > 0 && CURRENCY[c.currency])
    .sort((a, b) => a.index - b.index)[0];
  return first ? { amount: first.amount, currency: CURRENCY[first.currency] } : null;
}

/** Dividend als deel van de koers, of null als de munten niet te vergelijken zijn. */
export function dividendRatio(amount: Amount, price: Price): number | null {
  let value = amount.amount;
  const cur = price.currency.toUpperCase();
  if (amount.currency === cur) return value / price.close;
  if (amount.currency === "GBP" && cur === "GBX") return (value * 100) / price.close;
  if (amount.currency === "GBX" && cur === "GBP") return value / 100 / price.close;
  if (amount.currency === "KR" && ["SEK", "NOK", "DKK"].includes(cur)) return value / price.close;
  if (amount.currency === "ORE" && ["SEK", "NOK", "DKK"].includes(cur)) return value / 100 / price.close;
  if (amount.currency === "CENT" && ["EUR", "CHF", "USD"].includes(cur)) return value / 100 / price.close;
  return null;
}

// ---------------------------------------------------------------- overzicht

function ticker(symbol: string): string {
  return symbol.split(":").pop() ?? symbol;
}

export function money(value: number, currency: string): string {
  const digits = value >= 1000 ? 0 : value >= 1 ? 2 : 3;
  const shown = value.toLocaleString("nl-NL", { minimumFractionDigits: Math.min(digits, 2), maximumFractionDigits: digits });
  if (currency === "EUR") return `€${shown}`;
  if (currency === "GBP") return `£${shown}`;
  if (currency === "USD") return `$${shown}`;
  if (currency === "GBX") return `${shown}p`;
  return `${shown} ${currency}`;
}

function percent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

function who(symbol: string, name: string): string {
  if (!symbol) return escapeHtml(name);
  return `<b>${escapeHtml(ticker(symbol))}</b>${name ? ` ${escapeHtml(name)}` : ` (${escapeHtml(symbol.split(":")[0])})`}`;
}

function link(title: string, url: string): string {
  const short = title.length > 150 ? `${title.slice(0, 149).trimEnd()}…` : title;
  return url ? `<a href="${escapeHtml(url)}">${escapeHtml(short)}</a>` : escapeHtml(short);
}

function section(title: string, lines: string[], max = MAX_LINES): string[] {
  if (!lines.length) return [];
  const shown = lines.slice(0, max);
  if (lines.length > max) shown.push(`… en nog ${lines.length - max}`);
  return [`${title}`, ...shown];
}

/** Nieuwsregels per filter: één regel per aandeel (nieuwste kop), met het aantal extra berichten. */
function newsLines(events: EventRecord[], suffix?: (event: EventRecord) => string): string[] {
  const groups = new Map<string, EventRecord[]>();
  for (const event of events) {
    const key = event.symbol || fold(event.title).slice(0, 60);
    groups.set(key, [...(groups.get(key) ?? []), event]);
  }
  return [...groups.values()].map((group) => {
    const [first] = group;
    const more = group.length > 1 ? ` (+${group.length - 1})` : "";
    const subject = who(first.symbol, first.name);
    return `• ${subject ? `${subject}: ` : ""}${link(first.title, first.url)}${more}${suffix?.(first) ?? ""}`;
  });
}

/** Nieuwsblokken onder de vaste blokken, in deze volgorde. Claim, emissie en overname hebben een eigen blok. */
export const NEWS_SECTIONS: Array<[string, string]> = [
  ["handelsstop", "⛔ <b>Handelsstops</b>"],
  ["adhoc", "📣 <b>Ad-hoc meldingen sinds het slot</b>"],
  ["fda", "💊 <b>FDA, EMA en studies</b>"],
  ["splitsing", "✂️ <b>Spin-offs en splits</b>"],
  ["index", "📊 <b>Indexwijzigingen</b>"],
  ["insolventie", "⚠️ <b>Insolventie</b>"],
];
/** Filters met een eigen blok of die in het overzicht niet (meer) meedoen. */
const OWN_BLOCK = new Set(["dividend", "claim", "emissie", "overname", "ipo", "notering", ...RETIRED_FILTERS]);
/** Woorden van een claimemissie, om een gewone emissie na het lezen van het bericht op te waarderen. */
const CLAIM_WORDS = groupFilters(DEFAULT_FILTERS.claim.map((word) => ({ filter: "claim", word })));
/** Soorten agendapunten die bij een claimemissie horen. */
const RIGHTS_LABELS = /rechten|inschrijving|ex-claim/;

function listingLine(listing: NewListing, capEur?: number): string {
  const size = capEur ? `, ${formatCap(capEur)}` : "";
  const where = `${escapeHtml(listing.exchange)}${listing.country ? `, ${escapeHtml(countryName(listing.country))}` : ""}${size}`;
  const head = `• <b>${escapeHtml(ticker(listing.symbol))}</b> ${escapeHtml(listing.name)} (${where})`;
  const others = listing.others.map((o) => escapeHtml(o.symbol)).slice(0, 3).join(", ");
  if (listing.kind === "dubbel") return `${head} · tweede notering, al genoteerd als ${others}`;
  if (listing.kind === "verhuisd") return `${head} · nieuwe hoofdnotering, eerder ${others}`;
  if (listing.kind === "notering") return `${head} · nieuwe notering`;
  return `${head} · nieuw op de beurs`;
}

/** Het hele overzicht, in berichten van hoogstens ~3.900 tekens. */
export async function composeDigest(deps: MorningDeps, state: DayState): Promise<string[]> {
  const { store, config, now } = deps;
  const tz = config.timeZone;
  const today = localTime(now, tz).date;
  const since = await windowStart(store, now);
  const caps = await minCaps(store);
  const growth = await growthSymbols(store);
  // Te kleine bedrijven (/minimum), Euronext Growth Oslo en emissies in Londen vallen af.
  const events = (await store.eventsSince(since)).filter(
    (e) =>
      !RETIRED_FILTERS.includes(e.filter) &&
      bigEnough(e.filter, readExtra(e.extra).capEur, caps) &&
      !isGrowthOslo(e.title, e.symbol ? [e.symbol] : [], growth) &&
      !excludedExchange(e.filter, e.symbol ? [e.symbol] : [], e.title),
  );
  const byFilter = new Map<string, EventRecord[]>();
  for (const event of events) byFilter.set(event.filter, [...(byFilter.get(event.filter) ?? []), event]);
  const blocks: string[][] = [];
  const when = (date: string) => `<b>${escapeHtml(formatDay(date, today))}</b> (${relativeDay(date, today)})`;
  const later = await store.listAgenda(today, addDays(today, 400));
  const agendaFor = (symbol: string, test: (item: AgendaItem) => boolean) =>
    symbol ? later.filter((item) => item.symbol === symbol && test(item)) : [];

  // Agenda: wat er de komende dagen gebeurt.
  const agenda = later.filter((item) => daysBetween(today, item.date) <= config.agendaDays);
  const agendaLines = agenda.map((item) => {
    const subject = item.symbol || item.name ? who(item.symbol, item.name) : "";
    const about = item.title && item.url ? ` · ${link(item.title, item.url)}` : item.title ? ` · ${escapeHtml(item.title)}` : "";
    return `• ${when(item.date)} ${subject}${subject ? " · " : ""}${escapeHtml(item.label)}${about}`;
  });
  blocks.push(section(`⏰ <b>Agenda komende ${config.agendaDays} dagen</b>`, agendaLines, 20));

  // Claimemissies: lopende rechtenlijnen met hun data, en nieuws over claimemissies.
  const claimLines: string[] = [];
  const withRights = new Set<string>();
  const terms = state.rights?.length ? await loadTerms(store) : {};
  for (const r of [...(state.rights ?? [])].sort((a, b) => (a.expiry || "9").localeCompare(b.expiry || "9"))) {
    if (r.companySymbol) withRights.add(r.companySymbol);
    const fresh = r.firstSeen && r.firstSeen >= localTime(since, tz).date ? " · 🆕 <b>rechtenhandel net begonnen</b>" : "";
    const size = r.capEur ? `, ${formatCap(r.capEur)}` : "";
    const dates = agendaFor(r.companySymbol ?? "", (item) => RIGHTS_LABELS.test(item.label) && !item.key.startsWith("rights:"))
      .map((item) => `${escapeHtml(item.label)} ${when(item.date)}`);
    if (r.expiry) dates.push(`rechten vervallen ${when(r.expiry)}`);
    claimLines.push(
      [
        `• <b>${escapeHtml(ticker(r.symbol))}</b> rechten ${escapeHtml(r.company)} (${escapeHtml(r.exchange)}${size})${fresh}`,
        ...(dates.length ? [`   ${dates.join(" · ")}`] : []),
        ...rightsCalcLines(r, terms[r.symbol], state.quotes, today, tz),
      ].join("\n"),
    );
  }
  claimLines.push(...newsLines((byFilter.get("claim") ?? []).filter((e) => !withRights.has(e.symbol))));
  blocks.push(section("🧾 <b>Claimemissies en rechtenhandel</b>", claimLines));

  // Speciaal dividend: uit de screener en uit het nieuws.
  const dividendLines: string[] = [];
  const listed = new Set<string>();
  for (const d of state.dividends ?? []) {
    listed.add(d.symbol);
    const ex = d.exDate ? ` · ex ${escapeHtml(formatDay(d.exDate, today))}` : "";
    dividendLines.push(
      `• ${who(d.symbol, d.name)}: ${escapeHtml(money(d.amount, d.currency))} bij koers ${escapeHtml(money(d.close, d.currency))} = <b>${percent(d.amount / d.close)}</b>${ex}`,
    );
  }
  let smaller = 0;
  const dividendNews = new Map<string, EventRecord>();
  for (const event of byFilter.get("dividend") ?? []) if (!dividendNews.has(event.symbol || event.id)) dividendNews.set(event.symbol || event.id, event);
  for (const event of dividendNews.values()) {
    if (event.symbol && listed.has(event.symbol)) continue;
    const stored = readExtra(event.extra);
    const amount: Amount | null =
      stored.amount !== undefined && stored.currency ? { amount: stored.amount, currency: stored.currency } : parseDividendAmount(event.title);
    const price = event.symbol ? state.prices?.[event.symbol] : undefined;
    const ratio = amount && price ? dividendRatio(amount, price) : null;
    if (ratio !== null && ratio < config.dividendRatio) {
      smaller++;
      continue;
    }
    const detail =
      ratio !== null && amount && price
        ? `${escapeHtml(money(amount.amount, amount.currency === "KR" ? price.currency : amount.currency))} bij koers ${escapeHtml(money(price.close, price.currency))} = <b>${percent(ratio)}</b>`
        : amount
          ? `${escapeHtml(money(amount.amount, amount.currency))}, koers onbekend`
          : "bedrag niet gevonden";
    dividendLines.push(`• ${who(event.symbol, event.name)}: ${detail} · ${link(event.title, event.url)}`);
  }
  if (smaller) dividendLines.push(`<i>${smaller} speciaal dividend${smaller === 1 ? "" : "en"} onder ${percent(config.dividendRatio)} weggelaten</i>`);
  blocks.push(section(`💰 <b>Speciaal dividend ≥ ${percent(config.dividendRatio)} van de koers</b>`, dividendLines));

  // Overnames, met de eerstvolgende deadline (PUSU, einde aanmeldtermijn, vergadering, ...).
  const deadline = (event: EventRecord) => {
    const next = agendaFor(event.symbol, (item) => item.kind === "overname")[0];
    return next ? `\n   ⏰ ${escapeHtml(next.label)}: ${when(next.date)}` : "";
  };
  blocks.push(section("🤝 <b>Overnames, squeeze-outs en delistings</b>", newsLines(byFilter.get("overname") ?? [], deadline)));

  // Emissies (placings, ABB's), zonder wat al bij de claimemissies staat.
  const claimIds = new Set((byFilter.get("claim") ?? []).map((e) => e.id));
  const emissions = (byFilter.get("emissie") ?? []).filter((e) => !claimIds.has(e.id) && !withRights.has(e.symbol));
  blocks.push(section("💶 <b>Emissies</b>", newsLines(emissions)));

  // Nieuwe noteringen (vanaf het minimum voor noteringen, standaard €1 mld) en de IPO-kalender.
  const info = state.listings ?? {};
  const fresh = (await newListings(store, since)).filter((l) => {
    const known = info[l.symbol];
    if (!realListing(l) || known?.capEur === undefined || growth.has(l.symbol) || growth.has(l.isin)) return false;
    if (!bigEnough("notering", known.capEur, caps)) return false;
    return !(l.kind === "ipo" && known.ipoDate && daysBetween(known.ipoDate, today) > IPO_MAX_AGE_DAYS);
  });
  const line = (l: NewListing) => listingLine(l, info[l.symbol]?.capEur);
  blocks.push(section("🆕 <b>Nieuw op de beurs</b>", fresh.filter((l) => l.kind === "ipo").map(line)));
  blocks.push(section("🔁 <b>Nieuwe en dubbele noteringen</b>", fresh.filter((l) => l.kind !== "ipo").map(line)));
  const ipoLines = (state.ipos ?? [])
    .filter((i) => i.status !== "closed" || (i.date && i.date >= today))
    .filter((i) => !growth.has(i.symbol))
    .filter((i) => i.capUsd === undefined || bigEnough("ipo", i.capUsd * EUR_PER_USD, caps))
    .map((i) => {
      const date = i.date ? `${escapeHtml(formatDay(i.date, today))}` : "datum nog niet bekend";
      const size = i.capUsd ? ` · marktwaarde ±$${Math.round(i.capUsd / 1e6)} mln` : "";
      return `• <b>${escapeHtml(ticker(i.symbol))}</b> ${escapeHtml(i.name)} (${escapeHtml(i.exchange)}) · ${date}${size}`;
    });
  ipoLines.push(...newsLines([...(byFilter.get("ipo") ?? []), ...(byFilter.get("notering") ?? [])]));
  blocks.push(section("📅 <b>Beursgangen en noteringen op komst</b>", ipoLines));

  // De overige nieuwsblokken.
  const closeYesterday = toUnix(previousWorkday(today), 17 * 60 + 30, tz);
  const known = new Set([...OWN_BLOCK, ...NEWS_SECTIONS.map(([f]) => f)]);
  const extra = [...byFilter.keys()].filter((f) => !known.has(f)).map((f): [string, string] => [f, `🔎 <b>Filter ${escapeHtml(f)}</b>`]);
  for (const [filter, title] of [...NEWS_SECTIONS, ...extra]) {
    let list = byFilter.get(filter) ?? [];
    if (filter === "adhoc") list = list.filter((e) => !e.published || e.published >= closeYesterday);
    blocks.push(section(title, newsLines(list)));
  }

  if (state.errors.length) blocks.push(["⚠️ <i>Niet gelukt: " + escapeHtml(state.errors.join("; ")).slice(0, 400) + "</i>"]);

  const header = [
    `☀️ <b>Ochtendoverzicht ${escapeHtml(formatDay(today))}</b>`,
    `<i>Alles sinds ${escapeHtml(new Intl.DateTimeFormat("nl-NL", { timeZone: tz, weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(since * 1000)))}</i>`,
  ];
  const filled = blocks.filter((b) => b.length);
  if (!filled.length) filled.push(["Niets bijzonders sinds het vorige overzicht."]);
  filled.push(["<i>/agenda voor alles wat gepland staat · geen handelsadvies</i>"]);
  return pack([header, ...filled]);
}

/** Blokken samenvoegen tot berichten onder de Telegram-grens; een te lang blok wordt ingekort. */
export function pack(blocks: string[][]): string[] {
  const messages: string[] = [];
  let current = "";
  for (const block of blocks) {
    let text = block.join("\n");
    if (text.length > MAX_MESSAGE) {
      const lines: string[] = [];
      for (const line of block) {
        if ([...lines, line].join("\n").length > MAX_MESSAGE - 40) break;
        lines.push(line);
      }
      text = `${lines.join("\n")}\n… (ingekort)`;
    }
    if (current && current.length + text.length + 2 > MAX_MESSAGE) {
      messages.push(current);
      current = "";
    }
    current = current ? `${current}\n\n${text}` : text;
  }
  if (current) messages.push(current);
  return messages;
}

/** Het overzicht zoals het nu zou zijn, met de gegevens van vanochtend (voor /ochtend). */
export async function previewDigest(deps: MorningDeps): Promise<string[]> {
  const state = await loadDay(deps.store, localTime(deps.now, deps.config.timeZone).date);
  return composeDigest(deps, state);
}

/** Hoe lang tot het volgende overzicht, voor /ochtend. */
export function nextDigest(config: Config, now: number, sentToday: boolean): string {
  const local = localTime(now, config.timeZone);
  let date = local.date;
  if (sentToday || local.minutes >= config.digestMinutes + LATE_MINUTES || local.weekday > 5) {
    date = addDays(date, 1);
    while (localTime(toUnix(date, 12 * 60, config.timeZone), config.timeZone).weekday > 5) date = addDays(date, 1);
  }
  const hh = String(Math.floor(config.digestMinutes / 60)).padStart(2, "0");
  const mm = String(config.digestMinutes % 60).padStart(2, "0");
  return `${formatDay(date)} om ${hh}:${mm} (${relativeDay(date, local.date)})`;
}

