// Nieuwsmelder: elke minuut (cron) drie runs naast elkaar.
// - Volglijst: Telegram-commando's verwerken en het nieuws per gevolgd aandeel checken.
// - Screener: de Europese nieuwsstromen op filterwoorden doorzoeken en zo nodig een stukje van
//   de selectie verversen.
// - Ochtend: het ochtendoverzicht voorbereiden en om 08:40 versturen, en persberichten lezen
//   voor de agenda.
// Screener en ochtend draaien als aparte aanroep (de Worker roept zichzelf aan via de
// SELF-binding), zodat elk een eigen budget heeft: Workers Free geeft per aanroep 10 ms
// rekentijd, 50 uitgaande verzoeken en 50 databasevragen. Zo kan geen van beide de volglijst
// laten vastlopen.

import { ALERT_THREAD_KEY, AlertSender, TARGETS, WATCHLIST, alertChat } from "./alerts.ts";
import { LAST_MORNING_KEY, LAST_RUN_KEY, LAST_SCREEN_KEY, processUpdates } from "./bot.ts";
import { checkNews } from "./check.ts";
import type { Env } from "./config.ts";
import { DEFAULT_DIGEST_ONLY, DEFAULT_EUROPE_FILTERS, DEFAULT_FILTERS, loadConfig } from "./config.ts";
import { DIGEST_ONLY_KEY, EUROPE_FILTERS_KEY, checkScreener, refreshUniverse } from "./screener.ts";
import { DIGEST, runMorningStep } from "./morning.ts";
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
const MORNING_LOCK_KEY = "morning_lock";

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
    // Heeft de groep het bereik of de ochtend-only-lijst al eens aangepast, dan krijgt een nieuw
    // standaardfilter daar toch zijn standaardinstelling (zonder aanpassing geldt die al vanzelf).
    for (const [key, defaults] of [
      [EUROPE_FILTERS_KEY, DEFAULT_EUROPE_FILTERS],
      [DIGEST_ONLY_KEY, DEFAULT_DIGEST_ONLY],
    ] as const) {
      const stored = await store.getSetting(key);
      const add = missing.map(([filter]) => filter).filter((filter) => defaults.includes(filter));
      if (!stored || !add.length) continue;
      const list = new Set(JSON.parse(stored) as string[]);
      for (const filter of add) list.add(filter);
      await store.setSetting(key, JSON.stringify([...list]));
    }
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

export async function runMorning(env: Env, now = Math.floor(Date.now() / 1000)): Promise<void> {
  if (!env.TELEGRAM_BOT_TOKEN) return;
  const store = new D1Store(env.DB);
  if (!(await store.tryLock(MORNING_LOCK_KEY, now, LOCK_SECONDS))) {
    console.log("Vorige ochtend-run loopt nog; overgeslagen.");
    return;
  }
  try {
    const chatId = await alertChat(store, env.TELEGRAM_CHAT_ID);
    if (!chatId) return;
    const config = loadConfig(env);
    const fetcher = fetch.bind(globalThis);
    const thread = Number(await store.getSetting(ALERT_THREAD_KEY)) || undefined;
    const sender = new AlertSender(store, new Telegram(env.TELEGRAM_BOT_TOKEN, fetcher), chatId, thread);
    const log = (text: string) => console.log(text);
    const result = await runMorningStep({ store, config, fetcher, now, log }, (html) => sender.send(html, [DIGEST]));
    for (const error of result.errors) console.error(error);
    if (result.sent) console.log(`ochtendoverzicht verstuurd (${result.sent} bericht(en)).`);
    if (result.step || result.sent || result.errors.length) {
      await store.setSetting(LAST_MORNING_KEY, JSON.stringify({ at: now, step: result.step ?? null, sent: result.sent ?? 0, errors: result.errors }));
    }
  } catch (error) {
    console.error("ochtend:", error);
  } finally {
    await store.deleteSetting(MORNING_LOCK_KEY);
  }
}

const SCREEN_PATH = "/intern/screener";
const MORNING_PATH = "/intern/ochtend";
const INTERNAL: Record<string, (env: Env, now: number) => Promise<void>> = {
  [SCREEN_PATH]: runScreen,
  [MORNING_PATH]: runMorning,
};

export default {
  async scheduled(controller, env, ctx) {
    const now = Math.floor(controller.scheduledTime / 1000);
    ctx.waitUntil(runWatch(env, now));
    for (const [path, run] of Object.entries(INTERNAL)) {
      if (env.SELF && env.TELEGRAM_BOT_TOKEN) {
        // Aparte aanroep met een eigen budget; zie bovenaan dit bestand.
        ctx.waitUntil(
          env.SELF.fetch(`https://nieuws-alert${path}?now=${now}`, {
            method: "POST",
            headers: { "X-Intern": env.TELEGRAM_BOT_TOKEN },
          })
            .then((response) => response.arrayBuffer())
            .catch((error) => console.error(`${path}-aanroep mislukt:`, error)),
        );
      } else {
        ctx.waitUntil(run(env, now));
      }
    }
  },

  async fetch(request, env) {
    const url = new URL(request.url);
    // Alleen bereikbaar via de SELF-binding: de Worker heeft geen publiek adres, en het
    // bot-token dient als extra controle dat de aanroep van onszelf komt.
    const run = INTERNAL[url.pathname];
    if (run && request.method === "POST") {
      if (!env.TELEGRAM_BOT_TOKEN || request.headers.get("X-Intern") !== env.TELEGRAM_BOT_TOKEN) {
        return new Response("nee", { status: 403 });
      }
      const now = Number(url.searchParams.get("now")) || Math.floor(Date.now() / 1000);
      await run(env, now);
      return new Response(null, { status: 204 });
    }
    return new Response("Nieuwsmelder draait. Bediening gaat via Telegram.\n", {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  },
} satisfies ExportedHandler<Env>;
