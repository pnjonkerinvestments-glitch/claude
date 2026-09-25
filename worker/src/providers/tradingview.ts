/**
 * TradingView-screener als databron.
 *
 * Gebruikt hetzelfde scanner-endpoint als de Stock Screener op tradingview.com.
 * Dat endpoint is niet officieel gedocumenteerd: het kan zonder aankondiging
 * wijzigen, en je hoort het niet vaker te bevragen dan de screener zelf.
 * Wil je een gegarandeerd stabiel contract, gebruik dan PROVIDER=polygon.
 */

import type { Config } from "../config.ts";
import { requestJson, type RequestOptions } from "../http.ts";
import type { Mover } from "../models.ts";

export const COLUMNS = [
  "name",
  "description",
  "exchange",
  "type",
  "close",
  "premarket_close",
  "premarket_change",
  "premarket_volume",
  "market_cap_basic",
] as const;

export function buildPayload(cfg: Config): Record<string, unknown> {
  // Vraag iets onder de drempel op, zodat het resultaat ook bruikbaar is
  // als een lokaal filter (prijs, volume) er nog iets af haalt.
  const serverSideFloor = Math.max(cfg.thresholdPct - 10, 1);
  const filter: Record<string, unknown>[] = [
    { left: "premarket_change", operation: "greater", right: serverSideFloor },
    { left: "premarket_volume", operation: "greater", right: 0 },
  ];
  if (cfg.minPrice > 0) filter.push({ left: "premarket_close", operation: "egreater", right: cfg.minPrice });
  if (cfg.maxPrice > 0) filter.push({ left: "premarket_close", operation: "eless", right: cfg.maxPrice });

  return {
    filter,
    options: { lang: "en" },
    markets: ["america"],
    symbols: { query: { types: [] }, tickers: [] },
    columns: COLUMNS,
    sort: { sortBy: "premarket_change", sortOrder: "desc" },
    range: [0, Math.max(cfg.maxResults * 4, 100)],
  };
}

export function parseRow(row: unknown): Mover | null {
  if (!row || typeof row !== "object") return null;
  const { s, d } = row as { s?: unknown; d?: unknown };
  if (!Array.isArray(d) || d.length < COLUMNS.length) return null;
  const field = Object.fromEntries(COLUMNS.map((name, i) => [name, d[i]])) as Record<string, any>;

  const changePct = field.premarket_change;
  const premarketPrice = field.premarket_close;
  const prevClose = field.close;
  if (changePct == null || premarketPrice == null || !prevClose) return null;

  const ticker = typeof s === "string" ? s : "";
  const exchange = field.exchange || (ticker.includes(":") ? ticker.split(":")[0] : "");

  return {
    symbol: field.name || ticker.split(":").at(-1) || "",
    exchange,
    name: field.description || "",
    price: Number(premarketPrice),
    prevClose: Number(prevClose),
    changePct: Number(changePct),
    volume: Math.trunc(Number(field.premarket_volume) || 0),
    marketCap: field.market_cap_basic ?? null,
    instrumentType: String(field.type || "stock").toLowerCase(),
  };
}

export async function fetchTradingView(cfg: Config, opts: RequestOptions = {}): Promise<Mover[]> {
  let url = cfg.scannerUrl;
  if (!url.includes("label-product")) url += (url.includes("?") ? "&" : "?") + "label-product=screener-stock";

  const data = await requestJson(url, {
    ...opts,
    method: "POST",
    payload: buildPayload(cfg),
    headers: { Origin: "https://www.tradingview.com", Referer: "https://www.tradingview.com/" },
    timeoutMs: cfg.httpTimeoutMs,
  });
  const rows = data && typeof data === "object" ? ((data as { data?: unknown }).data ?? []) : [];
  return (Array.isArray(rows) ? rows : []).map(parseRow).filter((m): m is Mover => m !== null);
}
