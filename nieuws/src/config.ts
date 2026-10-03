export interface Env {
  DB: D1Database;
  /** Binding naar deze Worker zelf, voor de screener-run met een eigen budget. */
  SELF?: Fetcher;
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
  SCREEN_MARKETS?: string;
  SCREEN_FEEDS?: string;
  SCREEN_CAP_MIN_EUR?: string;
  SCREEN_CAP_MAX_EUR?: string;
}

export interface Feed {
  lang: string;
  /** ISO-landcodes zoals TradingView ze gebruikt (GB, niet UK), gesorteerd. */
  countries: string[];
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
  /** Screener-markten van TradingView, bijvoorbeeld "germany" of "uk". */
  screenMarkets: string[];
  /** Nieuwsstromen voor de screener: per taal een set landen. */
  screenFeeds: Feed[];
  capMinEur: number;
  capMaxEur: number;
}

export const DEFAULT_MARKETS =
  "germany,france,italy,spain,portugal,netherlands,belgium,luxembourg,denmark,sweden,norway,finland,uk,switzerland,austria";
// Eén Engelse stroom voor alle landen, plus de landstalen die TradingView kent
// (Zweeds en Nederlands bestaan daar niet als nieuwstaal).
export const DEFAULT_FEEDS =
  "en:AT,BE,CH,DE,DK,ES,FI,FR,GB,IT,LU,NL,NO,PT,SE; de:AT,CH,DE; fr:BE,CH,FR,LU; it:IT; es:ES; pt:PT";

/** Standaardfilter, alleen bij de allereerste run aangemaakt. Matchen is hoofdletter- en accentongevoelig. */
export const DEFAULT_FILTERS: Record<string, string[]> = {
  dividend: [
    // Engels
    "special dividend", "extraordinary dividend", "extra dividend", "one-off dividend", "one-time dividend",
    "bonus dividend", "special distribution", "special cash dividend",
    // Duits
    "Sonderdividende", "Sonderausschüttung", "Bonusdividende", "Zusatzdividende", "Superdividende",
    // Frans
    "dividende exceptionnel", "dividendes exceptionnels", "dividende extraordinaire", "dividende spécial",
    // Italiaans
    "dividendo straordinario", "dividendi straordinari", "dividendo speciale",
    // Spaans en Portugees
    "dividendo extraordinario", "dividendos extraordinarios", "dividendo especial",
    // Nederlands en Scandinavisch (voor koppen die toch in de landstaal binnenkomen)
    "speciaal dividend", "extra utdelning", "extrautdelning", "ekstraordinært utbytte", "tilleggsutbytte",
    "ekstraordinært udbytte", "ekstraudbytte", "lisäosinko",
  ],
};

export function parseFeeds(raw: string): Feed[] {
  return raw
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [lang, list = ""] = part.split(":");
      const countries = list
        .split(",")
        .map((c) => c.trim().toUpperCase())
        .filter((c) => /^[A-Z]{2}$/.test(c))
        .sort();
      return { lang: lang.trim().toLowerCase(), countries };
    })
    .filter((feed) => /^[a-z]{2}$/.test(feed.lang) && feed.countries.length > 0);
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
    maxRequests: Math.floor(number(env.MAX_REQUESTS, 30)),
    maxAlertsPerSymbol: Math.floor(number(env.MAX_ALERTS_PER_SYMBOL, 5)),
    storyDetails: (env.STORY_DETAILS ?? "true").trim().toLowerCase() !== "false",
    seedWatchlist: parseWatchlist(env.WATCHLIST),
    screenMarkets: (env.SCREEN_MARKETS ?? DEFAULT_MARKETS)
      .split(",")
      .map((m) => m.trim().toLowerCase())
      .filter((m) => /^[a-z_]+$/.test(m)),
    screenFeeds: parseFeeds(env.SCREEN_FEEDS ?? DEFAULT_FEEDS),
    capMinEur: number(env.SCREEN_CAP_MIN_EUR, 2_500_000),
    capMaxEur: number(env.SCREEN_CAP_MAX_EUR, 500_000_000),
  };
}
