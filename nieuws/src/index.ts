// Nieuwsmelder: elke minuut (cron) twee runs naast elkaar.
// - Volglijst: Telegram-commando's verwerken en het nieuws per gevolgd aandeel checken.
// - Screener: de Europese nieuwsstromen op filterwoorden doorzoeken en zo nodig een stukje van
//   de selectie verversen. Die draait als aparte aanroep (de Worker roept zichzelf aan via de
//   SELF-binding), zodat hij een eigen budget heeft: Workers Free geeft per aanroep 10 ms
//   rekentijd, 50 uitgaande verzoeken en 50 databasevragen. Zo kan de screener de volglijst
//   nooit laten vastlopen.

import { ALERT_THREAD_KEY, AlertSender, TARGETS, WATCHLIST, alertChat } from "./alerts.ts";
import { LAST_RUN_KEY, LAST_SCREEN_KEY, processUpdates } from "./bot.ts";
import { checkNews } from "./check.ts";
import type { Env } from "./config.ts";
import { DEFAULT_FILTERS, loadConfig } from "./config.ts";
import { checkScreener, refreshUniverse } from "./screener.ts";
import { sweepTargets } from "./targets.ts";
import type { Store } from "./store.ts";
import { D1Store } from "./store.ts";
import { Telegram } from "./telegram.ts";

const SEEDED_KEY = "seeded";
/** Oude sleutel: alleen "dividend" werd toen aangemaakt. */
const LEGACY_FILTERS_SEEDED_KEY = "filters_seeded";
/** Welke standaardfilters al eens zijn aangemaakt (JSON-lijst met namen). */
const FILTERS_SEEDED_KEY = "filters_seeded_list";
const LOCK_KEY = "lock";
const SCREEN_LOCK_KEY = "screen_lock";

/** Langer dan een normale run, korter dan het cron-interval plus wat marge. */
const LOCK_SECONDS = 55;

export async function seed(store: Store, env: Env): Promise<void> {
  if (!(await store.getSetting(SEEDED_KEY))) {
    for (const entry of loadConfig(env).seedWatchlist) await store.addWatch(entry);
    await store.setSetting(SEEDED_KEY, "1");
  }
  // Per filter bijhouden of het al eens is aangemaakt: een nieuw standaardfilter komt er zo ook
  // bij een bestaande installatie bij, en een filter dat de groep heeft weggehaald komt niet terug.
  const raw = await store.getSetting(FILTERS_SEEDED_KEY);
  const seeded = new Set<string>(raw ? (JSON.parse(raw) as string[]) : []);
  if (!raw && (await store.getSetting(LEGACY_FILTERS_SEEDED_KEY))) seeded.add("dividend");
  const missing = Object.entries(DEFAULT_FILTERS).filter(([filter]) => !seeded.has(filter));
  if (missing.length || !raw) {
    for (const [filter, words] of missing) {
      await store.addFilterWords(filter, words);
      seeded.add(filter);
    }
    await store.setSetting(FILTERS_SEEDED_KEY, JSON.stringify([...seeded]));
  }
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function runWatch(env: Env, now = Math.floor(Date.now() / 1000)): Promise<void> {
  if (!env.TELEGRAM_BOT_TOKEN) {
    console.error("TELEGRAM_BOT_TOKEN ontbreekt; zet hem als secret (zie nieuws/README.md).");
    return;
  }
  const store = new D1Store(env.DB);
  // Loopt een vorige run nog (trage TradingView)? Dan deze overslaan, anders dubbele meldingen.
  if (!(await store.tryLock(LOCK_KEY, now, LOCK_SECONDS))) {
    console.log("Vorige run loopt nog; overgeslagen.");
    return;
  }
  try {
    const config = loadConfig(env);
    const fetcher = fetch.bind(globalThis);
    const telegram = new Telegram(env.TELEGRAM_BOT_TOKEN, fetcher);
    const log = (text: string) => console.log(text);
    await seed(store, env);

    try {
      await processUpdates({ store, telegram, fetcher, config, fixedChatId: env.TELEGRAM_CHAT_ID }, log);
    } catch (error) {
      console.error("Telegram-commando's ophalen mislukt:", error);
    }

    const chatId = await alertChat(store, env.TELEGRAM_CHAT_ID);
    if (!chatId) {
      console.log("Nog geen eigenaar; stuur /start naar de bot.");
      return;
    }
    const sender = new AlertSender(store, telegram, chatId, Number(await store.getSetting(ALERT_THREAD_KEY)) || undefined);
    const result = await checkNews({ store, fetcher, send: (html) => sender.send(html, [WATCHLIST]), config, now, log });
    for (const error of result.errors) console.error(error);
    if (result.alerted) console.log(`${result.alerted} melding(en) verstuurd.`);
    await store.setSetting(
      LAST_RUN_KEY,
      JSON.stringify({ at: now, checked: result.checked.length, alerted: result.alerted, errors: result.errors }),
    );
  } finally {
    await store.deleteSetting(LOCK_KEY);
  }
}

export async function runScreen(env: Env, now = Math.floor(Date.now() / 1000)): Promise<void> {
  if (!env.TELEGRAM_BOT_TOKEN) return;
  const store = new D1Store(env.DB);
  if (!(await store.tryLock(SCREEN_LOCK_KEY, now, LOCK_SECONDS))) {
    console.log("Vorige screener-run loopt nog; overgeslagen.");
    return;
  }
  try {
    const chatId = await alertChat(store, env.TELEGRAM_CHAT_ID);
    // Zonder eigenaar is er nog geen chat om naartoe te sturen; de volglijst-run regelt /start.
    if (!chatId) return;
    const config = loadConfig(env);
    const fetcher = fetch.bind(globalThis);
    const thread = Number(await store.getSetting(ALERT_THREAD_KEY)) || undefined;
    const sender = new AlertSender(store, new Telegram(env.TELEGRAM_BOT_TOKEN, fetcher), chatId, thread);
    const log = (text: string) => console.log(text);
    const errors: string[] = [];
    let scanned = 0;
    let alerted = 0;
    try {
      const send = (html: string, categories?: string[]) => sender.send(html, categories);
      const screen = await checkScreener({ store, fetcher, config, send, now, log });
      scanned = screen.scanned;
      alerted = screen.alerted;
      errors.push(...screen.errors);
    } catch (error) {
      errors.push(`screener: ${message(error)}`);
    }
    // Per run hoogstens één zware screener-vraag: eerst de selectie, anders de koersdoelen.
    let refreshed = false;
    try {
      refreshed = await refreshUniverse(store, config, fetcher, now);
    } catch (error) {
      errors.push(`selectie verversen: ${message(error)}`);
    }
    if (!refreshed) {
      try {
        alerted += (await sweepTargets({ store, config, fetcher, send: (html) => sender.send(html, [TARGETS]), now })) ?? 0;
      } catch (error) {
        errors.push(`koersdoelen: ${message(error)}`);
      }
    }
    for (const error of errors) console.error(error);
    if (alerted) console.log(`screener: ${alerted} melding(en) verstuurd.`);
    await store.setSetting(LAST_SCREEN_KEY, JSON.stringify({ at: now, scanned, alerted, errors }));
  } finally {
    await store.deleteSetting(SCREEN_LOCK_KEY);
  }
}

const SCREEN_PATH = "/intern/screener";

export default {
  async scheduled(controller, env, ctx) {
    const now = Math.floor(controller.scheduledTime / 1000);
    ctx.waitUntil(runWatch(env, now));
    if (env.SELF && env.TELEGRAM_BOT_TOKEN) {
      // Aparte aanroep met een eigen budget; zie bovenaan dit bestand.
      ctx.waitUntil(
        env.SELF.fetch(`https://nieuws-alert${SCREEN_PATH}?now=${now}`, {
          method: "POST",
          headers: { "X-Intern": env.TELEGRAM_BOT_TOKEN },
        })
          .then((response) => response.arrayBuffer())
          .catch((error) => console.error("screener-aanroep mislukt:", error)),
      );
    } else {
      ctx.waitUntil(runScreen(env, now));
    }
  },

  async fetch(request, env) {
    const url = new URL(request.url);
    // Alleen bereikbaar via de SELF-binding: de Worker heeft geen publiek adres, en het
    // bot-token dient als extra controle dat de aanroep van onszelf komt.
    if (url.pathname === SCREEN_PATH && request.method === "POST") {
      if (!env.TELEGRAM_BOT_TOKEN || request.headers.get("X-Intern") !== env.TELEGRAM_BOT_TOKEN) {
        return new Response("nee", { status: 403 });
      }
      const now = Number(url.searchParams.get("now")) || Math.floor(Date.now() / 1000);
      await runScreen(env, now);
      return new Response(null, { status: 204 });
    }
    return new Response("Nieuwsmelder draait. Bediening gaat via Telegram.\n", {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  },
} satisfies ExportedHandler<Env>;
