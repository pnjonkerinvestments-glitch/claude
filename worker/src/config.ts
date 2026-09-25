export class ConfigError extends Error {
  override name = "ConfigError";
}

export interface Config {
  // databron
  provider: string;
  polygonApiKey: string;
  scannerUrl: string;
  httpTimeoutMs: number;

  // filters
  thresholdPct: number;
  minPrice: number;
  maxPrice: number; // 0 = geen bovengrens
  minPremarketVolume: number;
  minDollarVolume: number;
  exchanges: string[];
  instrumentTypes: string[];
  maxResults: number;

  // herhaling onderdrukken
  reAlertStepPct: number;

  // e-mail
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  mailFrom: string;
  mailTo: string[];
  subjectPrefix: string;

  // uitvoering
  dryRun: boolean;
  ignoreWindow: boolean;
}

/** Worker-vars en -secrets komen als strings binnen; alles wat geen string is negeren we. */
export type RawEnv = Record<string, unknown>;

function str(env: RawEnv, name: string, fallback = ""): string {
  const value = env[name];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function num(env: RawEnv, name: string, fallback: number): number {
  const raw = str(env, name);
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value)) throw new ConfigError(`${name} moet een getal zijn, kreeg ${JSON.stringify(raw)}`);
  return value;
}

function bool(env: RawEnv, name: string, fallback = false): boolean {
  const raw = str(env, name).toLowerCase();
  if (!raw) return fallback;
  return ["1", "true", "yes", "y", "on"].includes(raw);
}

function list(env: RawEnv, name: string, fallback: string): string[] {
  const raw = name in env && typeof env[name] === "string" ? (env[name] as string) : fallback;
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function configFromEnv(env: RawEnv): Config {
  const smtpUser = str(env, "SMTP_USER");
  return {
    provider: str(env, "PROVIDER", "tradingview").toLowerCase(),
    polygonApiKey: str(env, "POLYGON_API_KEY"),
    scannerUrl: str(env, "SCANNER_URL", "https://scanner.tradingview.com/america/scan"),
    httpTimeoutMs: num(env, "HTTP_TIMEOUT", 30) * 1000,
    thresholdPct: num(env, "THRESHOLD_PCT", 50),
    minPrice: num(env, "MIN_PRICE", 1),
    maxPrice: num(env, "MAX_PRICE", 0),
    minPremarketVolume: Math.trunc(num(env, "MIN_PREMARKET_VOLUME", 50_000)),
    minDollarVolume: num(env, "MIN_DOLLAR_VOLUME", 100_000),
    exchanges: list(env, "EXCHANGES", "NASDAQ,NYSE,AMEX"),
    instrumentTypes: list(env, "INSTRUMENT_TYPES", "stock,dr"),
    maxResults: Math.trunc(num(env, "MAX_RESULTS", 50)),
    reAlertStepPct: num(env, "RE_ALERT_STEP_PCT", 25),
    smtpHost: str(env, "SMTP_HOST"),
    smtpPort: Math.trunc(num(env, "SMTP_PORT", 587)),
    smtpUser,
    smtpPassword: str(env, "SMTP_PASSWORD"),
    mailFrom: str(env, "MAIL_FROM") || smtpUser,
    mailTo: list(env, "MAIL_TO", ""),
    subjectPrefix: str(env, "SUBJECT_PREFIX", "[Premarket]"),
    dryRun: bool(env, "DRY_RUN"),
    ignoreWindow: bool(env, "IGNORE_WINDOW"),
  };
}

export function validateConfig(cfg: Config): void {
  if (!["tradingview", "polygon"].includes(cfg.provider)) {
    throw new ConfigError(`Onbekende PROVIDER ${JSON.stringify(cfg.provider)} (kies: tradingview, polygon)`);
  }
  if (cfg.provider === "polygon" && !cfg.polygonApiKey) {
    throw new ConfigError("PROVIDER=polygon vereist POLYGON_API_KEY");
  }
  if (cfg.thresholdPct <= 0) throw new ConfigError("THRESHOLD_PCT moet groter dan 0 zijn");
  if (cfg.dryRun) return;
  const missing = (
    [
      ["SMTP_HOST", cfg.smtpHost],
      ["SMTP_USER", cfg.smtpUser],
      ["SMTP_PASSWORD", cfg.smtpPassword],
      ["MAIL_TO", cfg.mailTo.length ? "ok" : ""],
    ] as const
  )
    .filter(([, value]) => !value)
    .map(([name]) => name);
  if (missing.length) {
    throw new ConfigError(`Ontbrekende e-mailinstellingen: ${missing.join(", ")} (of zet DRY_RUN=true)`);
  }
}
