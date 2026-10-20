// Koersen van claimrechten en hun aandelen. De screener van TradingView kent geen rechten, maar
// de koersverbinding van de site (een websocket, zonder account) wel: per symbool de laatste
// koers met tijd, het vorige slot, bied en laat. Eén verbinding voor alle symbolen tegelijk.

import type { Fetch } from "./tradingview.ts";

export interface Quote {
  symbol: string;
  /** Laatste koers; vóór de opening is dat de slotprint van de vorige handelsdag. */
  last?: number;
  /** Unix-tijd van de laatste koers. */
  lastTime?: number;
  prevClose?: number;
  open?: number;
  bid?: number;
  ask?: number;
  volume?: number;
  currency?: string;
  description?: string;
}

/** Het stukje websocket dat hier nodig is (Cloudflare en Node hebben elk hun eigen variant). */
export interface QuoteSocket {
  send(data: string): void;
  close(): void;
  onMessage(listener: (data: string) => void): void;
  onClose(listener: () => void): void;
}

export type OpenSocket = (url: string, headers: Record<string, string>) => Promise<QuoteSocket>;

export const QUOTE_URL = "wss://data.tradingview.com/socket.io/websocket?from=chart%2F&type=chart";
const HEADERS = { Origin: "https://www.tradingview.com", "User-Agent": "Mozilla/5.0 (compatible; nieuws-alert/1.0)" };
const FIELDS = ["lp", "lp_time", "prev_close_price", "open_price", "bid", "ask", "volume", "currency_code", "description"];

export function frame(method: string, params: unknown[]): string {
  const body = JSON.stringify({ m: method, p: params });
  return `~m~${body.length}~m~${body}`;
}

/** "~m~12~m~{...}~m~5~m~~h~1" → ["{...}", "~h~1"]. */
export function splitFrames(data: string): string[] {
  const parts: string[] = [];
  let at = 0;
  while (at < data.length) {
    const match = /^~m~(\d+)~m~/.exec(data.slice(at));
    if (!match) break;
    const start = at + match[0].length;
    parts.push(data.slice(start, start + Number(match[1])));
    at = start + Number(match[1]);
  }
  return parts;
}

function num(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

/** Verwerkt één bericht; geeft het symbool terug als dat nu compleet is (of niet bestaat). */
export function applyQuoteMessage(quotes: Map<string, Quote>, raw: string): string | null {
  let message: { m?: string; p?: unknown[] };
  try {
    message = JSON.parse(raw);
  } catch {
    return null;
  }
  if (message.m === "quote_completed" && typeof message.p?.[1] === "string") return message.p[1];
  if (message.m !== "qsd") return null;
  const data = message.p?.[1] as { n?: string; s?: string; v?: Record<string, unknown> } | undefined;
  if (!data?.n) return null;
  if (data.s !== "ok") return data.n;
  const v = data.v ?? {};
  const quote = quotes.get(data.n) ?? { symbol: data.n };
  const set = <K extends keyof Quote>(key: K, value: Quote[K] | undefined) => {
    if (value !== undefined) quote[key] = value;
  };
  set("last", num(v.lp));
  set("lastTime", num(v.lp_time));
  set("prevClose", num(v.prev_close_price));
  set("open", num(v.open_price));
  set("bid", num(v.bid));
  set("ask", num(v.ask));
  set("volume", num(v.volume));
  if (typeof v.currency_code === "string") quote.currency = v.currency_code;
  if (typeof v.description === "string") quote.description = v.description;
  quotes.set(data.n, quote);
  return null;
}

/** Koersen van deze symbolen; wat binnen de tijd niet binnenkomt, ontbreekt. */
export async function fetchQuotes(open: OpenSocket, symbols: string[], timeoutMs = 8000): Promise<Map<string, Quote>> {
  const quotes = new Map<string, Quote>();
  const wanted = [...new Set(symbols)];
  if (!wanted.length) return quotes;
  const socket = await open(QUOTE_URL, HEADERS);
  const pending = new Set(wanted);
  await new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, timeoutMs);
    const finish = () => {
      clearTimeout(timer);
      resolve();
    };
    socket.onClose(finish);
    socket.onMessage((data) => {
      for (const part of splitFrames(data)) {
        // Hartslag terugsturen, anders sluit de server de verbinding.
        if (part.startsWith("~h~")) {
          socket.send(`~m~${part.length}~m~${part}`);
          continue;
        }
        const done = applyQuoteMessage(quotes, part);
        if (done) pending.delete(done);
        if (!pending.size) finish();
      }
    });
    socket.send(frame("set_auth_token", ["unauthorized_user_token"]));
    socket.send(frame("quote_create_session", ["qs_rechten"]));
    socket.send(frame("quote_set_fields", ["qs_rechten", ...FIELDS]));
    socket.send(frame("quote_add_symbols", ["qs_rechten", ...wanted]));
  });
  try {
    socket.close();
  } catch {
    // Al dicht.
  }
  return quotes;
}

/** Websocket in een Cloudflare Worker: een gewone fetch met Upgrade-kop. */
export function workerSocket(fetcher: Fetch): OpenSocket {
  return async (url, headers) => {
    const response = await fetcher(url.replace(/^wss:/, "https:"), { headers: { ...headers, Upgrade: "websocket" } });
    const ws = (response as Response & { webSocket?: WebSocket | null }).webSocket;
    if (!ws) throw new Error(`koersen: geen websocket (HTTP ${response.status})`);
    ws.accept();
    return {
      send: (data) => ws.send(data),
      close: () => ws.close(),
      onMessage: (listener) => ws.addEventListener("message", (event) => listener(String(event.data))),
      onClose: (listener) => {
        ws.addEventListener("close", () => listener());
        ws.addEventListener("error", () => listener());
      },
    };
  };
}

/** Websocket in Node (proefscripts). */
export function nodeSocket(): OpenSocket {
  return (url, headers) =>
    new Promise((resolve, reject) => {
      const ws = new (WebSocket as unknown as new (url: string, init: unknown) => WebSocket)(url, { headers });
      ws.addEventListener("open", () =>
        resolve({
          send: (data) => ws.send(data),
          close: () => ws.close(),
          onMessage: (listener) => ws.addEventListener("message", (event) => listener(String(event.data))),
          onClose: (listener) => ws.addEventListener("close", () => listener()),
        }),
      );
      ws.addEventListener("error", () => reject(new Error("koersen: websocket mislukt")));
    });
}
