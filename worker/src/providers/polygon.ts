/**
 * Polygon.io als databron (officieel gedocumenteerde API, betaald abonnement).
 *
 * Eén snapshot-call levert alle Amerikaanse tickers tegelijk. Tijdens de premarket
 * staat de reguliere dagbar nog op nul; de laatste koers komt dan uit de minuutbar
 * of de laatste trade.
 */

import type { Config } from "../config.ts";
import { requestJson, type RequestOptions } from "../http.ts";
import type { Mover } from "../models.ts";

const SNAPSHOT_URL = "https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers";

export function parseTicker(entry: any): Mover | null {
  if (!entry || typeof entry !== "object") return null;
  const prevClose = entry.prevDay?.c || 0;
  if (!prevClose) return null;

  // Volgorde van vers naar oud; day.c is 0 tot de reguliere sessie begint.
  const price = entry.min?.c || entry.lastTrade?.p || entry.day?.c || 0;
  if (!price) return null;

  return {
    symbol: entry.ticker ?? "",
    exchange: "",
    name: "",
    price: Number(price),
    prevClose: Number(prevClose),
    changePct: (Number(price) / Number(prevClose) - 1) * 100,
    volume: Math.trunc(Number(entry.day?.v || entry.min?.av || 0)),
    marketCap: null,
    instrumentType: "stock",
  };
}

export async function fetchPolygon(cfg: Config, opts: RequestOptions = {}): Promise<Mover[]> {
  const data = await requestJson(`${SNAPSHOT_URL}?apiKey=${encodeURIComponent(cfg.polygonApiKey)}`, {
    ...opts,
    timeoutMs: cfg.httpTimeoutMs,
  });
  const tickers = data && typeof data === "object" ? ((data as { tickers?: unknown }).tickers ?? []) : [];
  return (Array.isArray(tickers) ? tickers : []).map(parseTicker).filter((m): m is Mover => m !== null);
}
