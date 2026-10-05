// Street high / street low: elk half uur alle analistenkoersdoelen uit de TradingView-screener
// vastleggen en melden zodra het hoogste koersdoel van een aandeel stijgt (een analist zit
// boven de rest) of het laagste daalt (een analist zit onder de rest).
//
// Koppen als "street-high price target" bestaan bij Europese small caps vrijwel niet (0 van
// ruim 8.000 geteste koppen), daarom kijkt dit naar de cijfers zelf.
//
// Valkuil: TradingView rekent koersdoelen om naar dollar of euro. Dan lijkt een Brits of Zweeds
// koersdoel te bewegen als alleen de wisselkoers beweegt. We rekenen daarom terug naar de eigen
// munt van het aandeel: price_target_1y is het gemiddelde in eigen munt, price_target_average
// hetzelfde gemiddelde in euro; hun verhouding is de wisselkoers van dat moment.

import type { Config } from "./config.ts";
import { capRange, countryName, formatCap } from "./screener.ts";
import type { Store, TargetSnapshot } from "./store.ts";
import { escapeHtml } from "./telegram.ts";
import type { Fetch } from "./tradingview.ts";
import { chartUrl } from "./tradingview.ts";

export const TARGETS_OFF_KEY = "targets_off";
const JOB_KEY = "targets_job";
const DONE_KEY = "targets_done";
/** Zo vaak een volledige ronde langs alle koersdoelen. */
const SWEEP_SECONDS = 30 * 60;
const PAGE = 1000;
/** Kleinere verschuivingen zijn afronding, geen nieuwe analist. */
const TOLERANCE = 0.005;

const COLUMNS = [
  "description",
  "country",
  "market_cap_basic",
  "price_target_high",
  "price_target_low",
  "price_target_average",
  "price_target_1y",
  "recommendation_total",
  "close",
  "currency",
] as const;

export interface TargetRow extends TargetSnapshot {
  name: string;
  country: string;
  capEur: number;
  /** Gemiddeld koersdoel in eigen munt. */
  average: number;
  close: number;
}

export function targetsPayload(config: Config, range: { min: number; max: number }, offset: number, size = PAGE): unknown {
  return {
    filter: [
      { left: "market_cap_basic", operation: "in_range", right: [range.min, range.max] },
      { left: "type", operation: "equal", right: "stock" },
      { left: "is_primary", operation: "equal", right: true },
      { left: "price_target_high", operation: "nempty" },
    ],
    options: { lang: "en" },
    markets: config.screenMarkets,
    columns: COLUMNS,
    sort: { sortBy: "name", sortOrder: "asc" },
    range: [offset, offset + size],
    price_conversion: { to_currency: "eur" },
  };
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function parseTargetRows(
  body: unknown,
  countries: string[],
): { rows: TargetRow[]; total: number; raw: number } {
  const record = (body && typeof body === "object" ? body : {}) as { data?: unknown; totalCount?: unknown };
  const allowed = new Set(countries);
  const rows: TargetRow[] = [];
  for (const raw of Array.isArray(record.data) ? record.data : []) {
    const row = raw as { s?: unknown; d?: unknown[] };
    if (typeof row?.s !== "string" || !Array.isArray(row.d)) continue;
    const field = Object.fromEntries(COLUMNS.map((c, i) => [c, row.d![i]])) as Record<(typeof COLUMNS)[number], unknown>;
    const country = typeof field.country === "string" ? field.country : "";
    const highEur = num(field.price_target_high);
    const lowEur = num(field.price_target_low);
    const avgEur = num(field.price_target_average);
    const avgNative = num(field.price_target_1y);
    if (!allowed.has(country) || highEur === null || lowEur === null || !avgEur || !avgNative) continue;
    const toNative = avgNative / avgEur;
    rows.push({
      symbol: row.s.toUpperCase(),
      name: typeof field.description === "string" ? field.description : "",
      country,
      capEur: num(field.market_cap_basic) ?? 0,
      high: highEur * toNative,
      low: lowEur * toNative,
      average: avgNative,
      analysts: num(field.recommendation_total) ?? 0,
      close: num(field.close) ?? 0,
      currency: typeof field.currency === "string" ? field.currency : "",
    });
  }
  const raw = Array.isArray(record.data) ? record.data.length : 0;
  return { rows, total: typeof record.totalCount === "number" ? record.totalCount : raw, raw };
}

export interface TargetEvent {
  kind: "high" | "low";
  row: TargetRow;
  previous: number;
}

/** Vergelijkt met de vorige stand. Een aandeel zonder vorige stand geeft (nog) geen melding. */
export function detectEvents(rows: TargetRow[], previous: Map<string, TargetSnapshot>): TargetEvent[] {
  const events: TargetEvent[] = [];
  for (const row of rows) {
    const old = previous.get(row.symbol);
    // Andere munt (bijv. notering verhuisd) is geen vergelijking.
    if (!old || old.currency !== row.currency) continue;
    if (row.high > old.high * (1 + TOLERANCE)) events.push({ kind: "high", row, previous: old.high });
    if (row.low < old.low * (1 - TOLERANCE)) events.push({ kind: "low", row, previous: old.low });
  }
  return events;
}

export function formatMoney(value: number, currency: string): string {
  const digits = value >= 100 ? 0 : 2;
  const text = value.toLocaleString("nl-NL", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  if (currency === "EUR") return `€${text}`;
  if (currency === "USD") return `$${text}`;
  if (currency === "GBP") return `£${text}`;
  return `${text} ${currency}`;
}

function percent(value: number): string {
  const rounded = Math.round(value * 100);
  return `${rounded >= 0 ? "+" : ""}${rounded}%`;
}

export function formatTargetMessage({ kind, row, previous }: TargetEvent): string {
  const ticker = row.symbol.split(":").pop() ?? row.symbol;
  const money = (value: number) => escapeHtml(formatMoney(value, row.currency));
  const target = kind === "high" ? row.high : row.low;
  const lines = [
    kind === "high" ? "🎯 <b>Nieuw hoogste koersdoel (street high)</b>" : "🎯 <b>Nieuw laagste koersdoel (street low)</b>",
    `📰 <b>${escapeHtml(ticker)} · ${escapeHtml(row.name)}</b>`,
    `${escapeHtml(countryName(row.country))} · marktwaarde ${formatCap(row.capEur)}`,
    "",
    `${kind === "high" ? "Hoogste" : "Laagste"} koersdoel: <b>${money(target)}</b> (was ${money(previous)})`,
    `Gemiddeld ${money(row.average)} · hoogste ${money(row.high)} · laagste ${money(row.low)}` +
      (row.analysts ? ` · ${row.analysts} analist${row.analysts === 1 ? "" : "en"}` : ""),
  ];
  if (row.close > 0) lines.push(`Koers ${money(row.close)} → ${percent(target / row.close - 1)} tot dit doel`);
  const forecast = `https://www.tradingview.com/symbols/${row.symbol.replace(":", "-")}/forecast/`;
  lines.push("", `<a href="${escapeHtml(chartUrl(row.symbol))}">Grafiek</a> · <a href="${escapeHtml(forecast)}">Analisten op TradingView</a>`);
  return lines.join("\n");
}

interface Job {
  offset: number;
}

export interface SweepDeps {
  store: Store;
  config: Config;
  fetcher: Fetch;
  send: (html: string) => Promise<void>;
  now: number;
}

/**
 * Eén pagina van de koersdoelronde, als die aan de beurt is. Geeft het aantal meldingen terug,
 * of null als er niets te doen was.
 */
export async function sweepTargets(deps: SweepDeps): Promise<number | null> {
  const { store, config, now } = deps;
  if (await store.getSetting(TARGETS_OFF_KEY)) return null;
  const rawJob = await store.getSetting(JOB_KEY);
  let job: Job | null = rawJob ? (JSON.parse(rawJob) as Job) : null;
  if (!job) {
    const done = Number(await store.getSetting(DONE_KEY)) || 0;
    if (now - done < SWEEP_SECONDS) return null;
    job = { offset: 0 };
  }

  const response = await deps.fetcher("https://scanner.tradingview.com/global/scan?label-product=screener-stock", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Origin: "https://www.tradingview.com",
      Referer: "https://www.tradingview.com/",
      "User-Agent": "Mozilla/5.0 (compatible; nieuws-alert/1.0)",
    },
    body: JSON.stringify(targetsPayload(config, await capRange(store, config), job.offset)),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`koersdoelen HTTP ${response.status}`);
  const { rows, total, raw } = parseTargetRows(await response.json(), config.screenCountries);

  const previous = new Map((await store.getTargets(rows.map((r) => r.symbol))).map((t) => [t.symbol, t]));
  const events = detectEvents(rows, previous);
  // Eerst melden, dan pas de nieuwe stand opslaan: een mislukte melding komt de volgende ronde terug.
  let sent = 0;
  for (const event of events.slice(0, 10)) {
    await deps.send(formatTargetMessage(event));
    sent++;
  }
  await store.putTargets(
    rows.map(({ symbol, high, low, analysts, currency }) => ({ symbol, high, low, analysts, currency })),
    now,
  );

  job.offset += PAGE;
  if (job.offset >= total || raw === 0) {
    await store.setSetting(DONE_KEY, String(now));
    await store.deleteSetting(JOB_KEY);
  } else {
    await store.setSetting(JOB_KEY, JSON.stringify(job));
  }
  return sent;
}
