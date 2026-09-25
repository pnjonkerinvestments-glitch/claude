export class HttpError extends Error {
  override name = "HttpError";
}

export interface RequestOptions {
  method?: string;
  payload?: unknown;
  headers?: Record<string, string>;
  timeoutMs?: number;
  retries?: number;
  warn?: (msg: string) => void;
  /** Te vervangen in tests. */
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
}

const USER_AGENT = "roviko-premarket-alert/1.0";

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Doe een JSON-request met exponentiële backoff bij netwerk-/5xx-/429-fouten. */
export async function requestJson(url: string, opts: RequestOptions = {}): Promise<unknown> {
  const { method = "GET", payload, timeoutMs = 30_000, retries = 3 } = opts;
  const fetchImpl = opts.fetchImpl ?? fetch;
  const sleep = opts.sleep ?? defaultSleep;
  const headers: Record<string, string> = { "User-Agent": USER_AGENT, Accept: "application/json" };
  if (payload !== undefined) headers["Content-Type"] = "application/json";
  Object.assign(headers, opts.headers);

  let lastError: Error | undefined;
  for (let attempt = 0; attempt < retries; attempt++) {
    let resp: Response | undefined;
    try {
      resp = await fetchImpl(url, {
        method,
        headers,
        body: payload === undefined ? undefined : JSON.stringify(payload),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (err) {
      lastError = new HttpError(`${method} ${redact(url)} mislukt: ${String(err)}`);
    }
    if (resp?.ok) {
      try {
        return await resp.json();
      } catch (err) {
        lastError = new HttpError(`${method} ${redact(url)} gaf geen geldige JSON: ${String(err)}`);
      }
    } else if (resp) {
      const detail = (await resp.text()).slice(0, 400);
      lastError = new HttpError(`${method} ${redact(url)} -> HTTP ${resp.status}: ${detail}`);
      if (resp.status < 500 && resp.status !== 429) throw lastError;
    }
    if (attempt < retries - 1) {
      const delay = 2 ** attempt * 1000;
      opts.warn?.(`Poging ${attempt + 1} mislukt (${lastError?.message}), opnieuw over ${delay / 1000}s`);
      await sleep(delay);
    }
  }
  throw lastError ?? new HttpError(`${method} ${redact(url)} mislukt`);
}

/** Houd API-sleutels uit logs en foutmeldingen. */
function redact(url: string): string {
  return url.replace(/(apiKey=)[^&]+/i, "$1***");
}
