// Ochtendoverzicht: elke werkdag om 08:40 (OCHTEND_TIJD) één overzicht van alles wat sinds het
// vorige overzicht nieuw is, in een eigen onderwerp. Het draait als eigen aanroep met een eigen
// budget (Workers Free: 50 verzoeken per aanroep) en doet per minuut één stap:
//
// - vanaf 07:00: alle Europese noteringen langs (nieuwe beursgangen en dubbele noteringen),
//   aangekondigd dividend t.o.v. de koers, cijfers van vandaag, de IPO-kalender en koersen voor
//   speciaal-dividendnieuws;
// - vlak voor het overzicht: vroege koersen bij Lang & Schwarz en Tradegate;
// - de hele dag door: persberichten van overnames, FDA, noteringen enz. lezen en de datums
//   (deadline van het bod, PDUFA-datum, eerste handelsdag) in de agenda zetten.
//
// Om 08:40 volgt het overzicht met de agenda van de komende dagen bovenaan.

import type { Config } from "./config.ts";
import {
  addDays,
  datesForAgenda,
  fold,
  formatDay,
  localTime,
  previousWorkday,
  relativeDay,
  toUnix,
} from "./dates.ts";
import type { NewListing } from "./listings.ts";
import { LISTINGS_DONE_KEY, LISTINGS_JOB_KEY, newListings, sweepListings } from "./listings.ts";
import { capRange, countryName } from "./screener.ts";
import type { AgendaItem, EventRecord, Store } from "./store.ts";
import { escapeHtml } from "./telegram.ts";
import type { Fetch } from "./tradingview.ts";
import { fetchStory, fields, scanner } from "./tradingview.ts";

/** Soort melding (en onderwerp) van het ochtendoverzicht. */
export const DIGEST = "ochtend";
export const DAY_KEY = "ochtend_dag";
/** Wanneer het vorige overzicht verstuurd is (seconden). */
export const SENT_KEY = "ochtend_verstuurd";
export const SENT_DATE_KEY = "ochtend_datum";
export const OFF_KEY = "ochtend_uit";

/** Filters waarvan de bot het hele bericht leest, op zoek naar datums voor de agenda. */
export const DATED_FILTERS = ["overname", "fda", "notering", "ipo", "splitsing", "index", "dividend"];
/** Zo vroeg beginnen de voorbereidende stappen (minuten vóór het overzicht). */
const PREP_MINUTES = 100;
/** De vroege koersen pas vlak voor het overzicht ophalen (Tradegate loopt 15 minuten achter). */
const GAP_MINUTES = 12;
/** Tot zo lang na de geplande tijd wordt een gemist overzicht nog verstuurd. */
const LATE_MINUTES = 120;
/** Berichten lezen per run. */
const STORIES_PER_RUN = 4;
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

export interface EarningsRow {
  symbol: string;
  name: string;
  country: string;
  /** -1 voorbeurs, 1 nabeurs, 0 onbekend. */
  time: number;
  /** Al gepubliceerd (vandaag)? */
  done: boolean;
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

export interface GapRow {
  symbol: string;
  name: string;
  exchange: string;
  country: string;
  close: number;
  currency: string;
  change: number;
  volume: number;
}

export interface Price {
  close: number;
  currency: string;
  name: string;
}

export interface DayState {
  date: string;
  done: string[];
  errors: string[];
  dividends?: DividendRow[];
  earnings?: EarningsRow[];
  ipos?: IpoRow[];
  gaps?: GapRow[];
  prices?: Record<string, Price>;
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

const EARNINGS_COLUMNS = ["description", "country", "earnings_release_next_time", "earnings_release_time"] as const;

export function earningsPayload(config: Config, range: { min: number; max: number }, field: string, from: number, to: number): unknown {
  return {
    filter: [
      ...PRIMARY_STOCKS,
      { left: "market_cap_basic", operation: "in_range", right: [range.min, range.max] },
      { left: field, operation: "in_range", right: [from, to] },
    ],
    options: { lang: "en" },
    markets: config.screenMarkets,
    columns: EARNINGS_COLUMNS,
    sort: { sortBy: "market_cap_basic", sortOrder: "desc" },
    range: [0, 300],
    price_conversion: { to_currency: "eur" },
  };
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

const GAP_COLUMNS = ["description", "exchange", "country", "close", "currency", "change", "volume", "isin"] as const;

export function gapPayload(config: Config, capMin: number): unknown {
  return {
    filter: [
      { left: "exchange", operation: "in_range", right: ["LS", "TRADEGATE"] },
      { left: "type", operation: "equal", right: "stock" },
      { left: "country", operation: "in_range", right: config.screenCountries },
      { left: "market_cap_basic", operation: "greater", right: capMin },
      { left: "volume", operation: "greater", right: 0 },
      { left: "change", operation: "not_in_range", right: [-config.gapPercent, config.gapPercent] },
    ],
    options: { lang: "en" },
    markets: config.screenMarkets,
    columns: GAP_COLUMNS,
    sort: { sortBy: "volume", sortOrder: "desc" },
    range: [0, 200],
    price_conversion: { to_currency: "eur" },
  };
}

/** Eén regel per bedrijf (ISIN), de beurs met het meeste volume, grootste bewegingen eerst. */
export function parseGaps(rows: Array<{ s: string; d: unknown[] }>): GapRow[] {
  const byIsin = new Map<string, GapRow>();
  for (const row of rows) {
    const f = fields(GAP_COLUMNS, row);
    const change = num(f.change);
    const close = num(f.close);
    if (change === null || !close) continue;
    const gap: GapRow = {
      symbol: row.s,
      name: text(f.description),
      exchange: text(f.exchange),
      country: text(f.country),
      close,
      currency: text(f.currency),
      change,
      volume: num(f.volume) ?? 0,
    };
    const key = text(f.isin) || row.s;
    const existing = byIsin.get(key);
    if (!existing || gap.volume > existing.volume) byIsin.set(key, gap);
  }
  return [...byIsin.values()].sort((a, b) => Math.abs(b.change) - Math.abs(a.change)).slice(0, 15);
}

interface Step {
  name: string;
  /** Vanaf zoveel minuten vóór het overzicht. */
  from: number;
  run: (deps: MorningDeps, state: DayState, today: string) => Promise<void>;
}

const STEPS: Step[] = [
  {
    name: "dividend",
    from: PREP_MINUTES,
    async run({ store, config, fetcher, now }, state, today) {
      const start = toUnix(today, 0, config.timeZone);
      const { rows } = await scanner(fetcher, dividendPayload(config, start));
      state.dividends = parseDividends(rows, config);
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
    name: "cijfers",
    from: PREP_MINUTES,
    async run({ store, config, fetcher }, state, today) {
      const start = toUnix(today, 0, config.timeZone);
      const end = toUnix(addDays(today, 1), 0, config.timeZone) - 1;
      const range = await capRange(store, config);
      const countries = new Set(config.screenCountries);
      const rows = new Map<string, EarningsRow>();
      for (const [field, done] of [
        ["earnings_release_next_date", false],
        ["earnings_release_date", true],
      ] as const) {
        const result = await scanner(fetcher, earningsPayload(config, range, field, start, end));
        for (const row of result.rows) {
          const f = fields(EARNINGS_COLUMNS, row);
          if (!countries.has(text(f.country))) continue;
          rows.set(row.s, {
            symbol: row.s,
            name: text(f.description),
            country: text(f.country),
            time: num(done ? f.earnings_release_time : f.earnings_release_next_time) ?? 0,
            done,
          });
        }
      }
      state.earnings = [...rows.values()];
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
      const unique = new Map(rows.map((row) => [row.s, row]));
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
    // Koersen van aandelen met speciaal-dividendnieuws, om het bedrag naast de koers te leggen.
    name: "prijzen",
    from: 40,
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
    name: "koersen",
    from: GAP_MINUTES,
    async run({ store, config, fetcher }, state) {
      const range = await capRange(store, config);
      const { rows } = await scanner(fetcher, gapPayload(config, range.min));
      state.gaps = parseGaps(rows);
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
    const reference = event.published ? localTime(event.published, config.timeZone).date : today;
    // Het filter dat het meest over de datum zegt (een overname gaat voor een notering).
    const kind = DATED_FILTERS.find((f) => events.some((e) => e.filter === f)) ?? event.filter;
    for (const found of datesForAgenda(full, reference, today)) {
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
    if (events.some((e) => e.filter === "dividend")) {
      const amount = parseDividendAmount(full);
      if (amount) extra[id] = JSON.stringify(amount);
    }
  }
  await store.addAgenda(items, now);
  await store.markEventsChecked(ids, extra);
  return ids.length;
}

export interface RunResult {
  step?: string;
  sent?: number;
  stories: number;
  errors: string[];
}

/** Eén minuut ochtendwerk. `send` verstuurt een bericht naar het onderwerp van het overzicht. */
export async function runMorningStep(deps: MorningDeps, send: (html: string) => Promise<void>): Promise<RunResult> {
  const { store, config, now } = deps;
  const result: RunResult = { stories: 0, errors: [] };
  const local = localTime(now, config.timeZone);
  const today = local.date;
  const workday = local.weekday <= 5;
  const untilDigest = config.digestMinutes - local.minutes;
  const off = !!(await store.getSetting(OFF_KEY));

  // Noteringen: elke dag één ronde, vanaf de voorbereidingstijd (of meteen bij een nieuwe installatie).
  const sweeping = !!(await store.getSetting(LISTINGS_JOB_KEY));
  const listingsDue = (await store.getSetting(LISTINGS_DONE_KEY)) !== today && (untilDigest <= PREP_MINUTES || !(await store.getSetting(LISTINGS_DONE_KEY)));
  if (sweeping || listingsDue) {
    try {
      if (await sweepListings(store, config, deps.fetcher, now, today)) result.step = "noteringen";
    } catch (error) {
      result.errors.push(`noteringen: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const state = await loadDay(store, today);
  const sentToday = (await store.getSetting(SENT_DATE_KEY)) === today;
  if (!result.step && workday && !off && !sentToday) {
    // Alleen vóór het overzicht: om 08:40 gaat het overzicht voor, ook als er een stap mislukt of blijft liggen.
    const step = STEPS.find((s) => !state.done.includes(s.name) && untilDigest <= s.from && untilDigest > 0);
    if (step) {
      result.step = step.name;
      try {
        await step.run(deps, state, today);
      } catch (error) {
        state.errors.push(`${step.name}: ${error instanceof Error ? error.message : String(error)}`);
      }
      state.done.push(step.name);
      await store.setSetting(DAY_KEY, JSON.stringify(state));
    }
  }

  if (workday && !off && !sentToday && untilDigest <= 0 && untilDigest > -LATE_MINUTES && !result.step) {
    const messages = await composeDigest(deps, state);
    for (const message of messages) await send(message);
    await store.setSetting(SENT_KEY, String(now));
    await store.setSetting(SENT_DATE_KEY, today);
    result.sent = messages.length;
    await store.pruneEvents(now - KEEP_EVENTS_SECONDS);
    await store.pruneAgenda(addDays(today, -7));
    return result;
  }

  // Tijd over: persberichten lezen.
  try {
    result.stories = await checkStories(deps, today);
  } catch (error) {
    result.errors.push(`berichten lezen: ${error instanceof Error ? error.message : String(error)}`);
  }
  return result;
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

function parseNumber(raw: string): number {
  let value = raw.replace(/\s/g, "");
  if (/[.,]\d{3}[.,]\d{1,4}$/.test(value) || /^\d{1,3}([.,]\d{3})+$/.test(value) && !/[.,]\d{3}$/.test(value)) {
    value = value.replace(/[.,](?=\d{3}(?:[.,]|$))/g, "");
  }
  return Number(value.replace(",", "."));
}

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
  if (!symbol) return escapeHtml(name || "?");
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
    return `• ${who(first.symbol, first.name)}: ${link(first.title, first.url)}${more}${suffix?.(first) ?? ""}`;
  });
}

export const NEWS_SECTIONS: Array<[string, string]> = [
  ["overname", "🤝 <b>Overnames, squeeze-outs en delistings</b>"],
  ["handelsstop", "⛔ <b>Handelsstops</b>"],
  ["adhoc", "📣 <b>Ad-hoc meldingen sinds het slot</b>"],
  ["fda", "💊 <b>FDA, EMA en studies</b>"],
  ["splitsing", "✂️ <b>Spin-offs en splits</b>"],
  ["index", "📊 <b>Indexwijzigingen</b>"],
  ["ipo", "🚀 <b>Beursgangen in het nieuws</b>"],
  ["notering", "🔁 <b>Noteringen in het nieuws</b>"],
  ["emissie", "💶 <b>Emissies</b>"],
  ["insolventie", "⚠️ <b>Insolventie</b>"],
];

const BUY = /(?<![a-z])(kauf|erwerb|buy|buys|bought|purchase|purchases|raises stake|achat|acquisto|compra|kop|kjop|kob|osto)(?![a-z])/;
const SELL = /(?<![a-z])(verkauf|verausserung|sell|sells|sold|sale|disposal|vente|cessione|venta|salg|myynti)(?![a-z])/;

function listingLine(listing: NewListing): string {
  const where = `${escapeHtml(listing.exchange)}${listing.country ? `, ${escapeHtml(countryName(listing.country))}` : ""}`;
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
  const events = await store.eventsSince(since);
  const byFilter = new Map<string, EventRecord[]>();
  for (const event of events) byFilter.set(event.filter, [...(byFilter.get(event.filter) ?? []), event]);
  const blocks: string[][] = [];

  // Agenda: wat er de komende dagen gebeurt.
  const agenda = await store.listAgenda(today, addDays(today, config.agendaDays));
  const agendaLines = agenda.map((item) => {
    const when = `<b>${escapeHtml(formatDay(item.date, today))}</b> (${relativeDay(item.date, today)})`;
    const subject = item.symbol || item.name ? who(item.symbol, item.name) : "";
    const about = item.title && item.url ? ` · ${link(item.title, item.url)}` : item.title ? ` · ${escapeHtml(item.title)}` : "";
    return `• ${when} ${subject}${subject ? " · " : ""}${escapeHtml(item.label)}${about}`;
  });
  blocks.push(section(`⏰ <b>Agenda komende ${config.agendaDays} dagen</b>`, agendaLines, 20));

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
    const amount = event.extra ? (JSON.parse(event.extra) as Amount) : parseDividendAmount(event.title);
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

  // Nieuwe noteringen en de IPO-kalender.
  const fresh = (await newListings(store, since)).filter((l) => l.kind !== "verhuisd" || l.others.some((o) => o.exchange !== l.exchange));
  blocks.push(section("🆕 <b>Nieuw op de beurs</b>", fresh.filter((l) => l.kind === "ipo").map(listingLine)));
  blocks.push(section("🔁 <b>Nieuwe en dubbele noteringen</b>", fresh.filter((l) => l.kind !== "ipo").map(listingLine)));
  const ipoLines = (state.ipos ?? [])
    .filter((i) => i.status !== "closed" || (i.date && i.date >= today))
    .map((i) => {
      const date = i.date ? `${escapeHtml(formatDay(i.date, today))}` : "datum nog niet bekend";
      const size = i.capUsd ? ` · marktwaarde ±$${Math.round(i.capUsd / 1e6)} mln` : "";
      return `• <b>${escapeHtml(ticker(i.symbol))}</b> ${escapeHtml(i.name)} (${escapeHtml(i.exchange)}) · ${date}${size}`;
    });
  blocks.push(section("📅 <b>Beursgangen op komst</b>", ipoLines));

  // Nieuws per filter. Bij overnames de deadline uit de agenda erbij.
  const deadlines = new Map<string, AgendaItem>();
  for (const item of await store.listAgenda(today, addDays(today, 400))) {
    if (item.kind === "overname" && item.symbol && !deadlines.has(item.symbol)) deadlines.set(item.symbol, item);
  }
  const closeYesterday = toUnix(previousWorkday(today), 17 * 60 + 30, tz);
  const known = new Set(["dividend", "insider", ...NEWS_SECTIONS.map(([f]) => f)]);
  const extra = [...byFilter.keys()].filter((f) => !known.has(f)).map((f): [string, string] => [f, `🔎 <b>Filter ${escapeHtml(f)}</b>`]);
  for (const [filter, title] of [...NEWS_SECTIONS, ...extra]) {
    let list = byFilter.get(filter) ?? [];
    if (filter === "adhoc") list = list.filter((e) => !e.published || e.published >= closeYesterday);
    const suffix =
      filter === "overname"
        ? (event: EventRecord) => {
            const deadline = deadlines.get(event.symbol);
            return deadline ? `\n   ⏰ ${escapeHtml(deadline.label)}: <b>${escapeHtml(formatDay(deadline.date, today))}</b> (${relativeDay(deadline.date, today)})` : "";
          }
        : undefined;
    blocks.push(section(title, newsLines(list, suffix)));
  }

  // Insiders: per aandeel, met clusters van aankopen in de afgelopen twee weken.
  const insiders = byFilter.get("insider") ?? [];
  if (insiders.length) {
    const symbols = [...new Set(insiders.map((e) => e.symbol).filter(Boolean))];
    const history = await store.eventsForSymbols("insider", symbols, now - 14 * 86400);
    const lines = new Map<string, string>();
    const sorted = [...insiders].sort((a, b) => Number(BUY.test(fold(b.title))) - Number(BUY.test(fold(a.title))));
    for (const event of sorted) {
      const key = event.symbol || event.id;
      if (lines.has(key)) continue;
      const own = insiders.filter((e) => (e.symbol || e.id) === key);
      const buys = own.filter((e) => BUY.test(fold(e.title)) && !SELL.test(fold(e.title))).length;
      const sells = own.filter((e) => SELL.test(fold(e.title))).length;
      const recentBuys = new Set(
        history.filter((e) => e.symbol === event.symbol && BUY.test(fold(e.title)) && !SELL.test(fold(e.title))).map((e) => e.id),
      ).size;
      const what = [buys ? `${buys}× aankoop` : "", sells ? `${sells}× verkoop` : ""].filter(Boolean).join(", ") || `${own.length}× transactie`;
      const cluster = recentBuys >= 2 ? ` · 🟢 <b>cluster: ${recentBuys} aankopen in 14 dagen</b>` : "";
      lines.set(key, `• ${who(event.symbol, event.name)}: ${what}${cluster} · ${link(event.title, event.url)}`);
    }
    blocks.push(section("👔 <b>Insiders (directors' dealings)</b>", [...lines.values()]));
  }

  // Vroege koersen en cijfers.
  blocks.push(
    section(
      `📈 <b>Vroege koersen (L&amp;S, Tradegate) t.o.v. gisteravond, ≥ ${config.gapPercent}%</b>`,
      (state.gaps ?? []).map(
        (g) =>
          `• ${who(g.symbol, g.name)}: <b>${g.change > 0 ? "+" : ""}${g.change.toFixed(1).replace(".", ",")}%</b> naar ${escapeHtml(money(g.close, g.currency))} (${escapeHtml(g.exchange === "LS" ? "L&S" : "Tradegate")})`,
      ),
    ),
  );
  const earnings = (state.earnings ?? []).map((e) => {
    const when = e.done ? "al gepubliceerd" : e.time < 0 ? "voorbeurs" : e.time > 0 ? "nabeurs" : "tijd onbekend";
    return `• ${who(e.symbol, e.name)} · ${when}`;
  });
  blocks.push(section("🗓️ <b>Cijfers vandaag</b>", earnings, 25));

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

