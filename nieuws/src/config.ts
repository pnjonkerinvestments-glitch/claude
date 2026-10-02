export interface Env {
  DB: D1Database;
  TELEGRAM_BOT_TOKEN?: string;
  /** Optioneel: vaste chat. Zonder deze secret wordt de eerste chat die /start stuurt de eigenaar. */
  TELEGRAM_CHAT_ID?: string;
  NEWS_LANGS?: string;
  TIMEZONE?: string;
  MAX_AGE_HOURS?: string;
  MAX_REQUESTS?: string;
  MAX_ALERTS_PER_SYMBOL?: string;
  STORY_DETAILS?: string;
  WATCHLIST?: string;
}

export interface Config {
  langs: string[];
  timeZone: string;
  /** Berichten die ouder zijn dan dit worden stil als gezien gemarkeerd. */
  maxAgeSeconds: number;
  /** Bovengrens voor TradingView-verzoeken per run (Workers Free staat 50 subrequests toe). */
  maxRequests: number;
  maxAlertsPerSymbol: number;
  storyDetails: boolean;
  /** Startlijst, alleen gebruikt zolang er nog nooit een lijst is opgeslagen. */
  seedWatchlist: Array<{ symbol: string; name: string }>;
}

function number(raw: string | undefined, fallback: number): number {
  const value = Number(raw);
  return raw !== undefined && raw.trim() !== "" && Number.isFinite(value) && value > 0 ? value : fallback;
}

export function parseWatchlist(raw: string | undefined): Array<{ symbol: string; name: string }> {
  if (!raw) return [];
  return raw
    .split(/[;\n]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [symbol, ...name] = part.split("=");
      return { symbol: symbol.trim().toUpperCase(), name: name.join("=").trim() };
    })
    .filter((entry) => /^[A-Z0-9_.!-]+:[A-Z0-9_.!/-]+$/.test(entry.symbol));
}

export function loadConfig(env: Env): Config {
  const langs = (env.NEWS_LANGS ?? "de,en")
    .split(",")
    .map((lang) => lang.trim().toLowerCase())
    .filter((lang) => lang === "" || /^[a-z]{2}(-[a-z]{2})?$/.test(lang));
  return {
    langs: langs.length ? [...new Set(langs)] : ["de", "en"],
    timeZone: env.TIMEZONE?.trim() || "Europe/Amsterdam",
    maxAgeSeconds: number(env.MAX_AGE_HOURS, 24) * 3600,
    maxRequests: Math.floor(number(env.MAX_REQUESTS, 40)),
    maxAlertsPerSymbol: Math.floor(number(env.MAX_ALERTS_PER_SYMBOL, 5)),
    storyDetails: (env.STORY_DETAILS ?? "true").trim().toLowerCase() !== "false",
    seedWatchlist: parseWatchlist(env.WATCHLIST),
  };
}
