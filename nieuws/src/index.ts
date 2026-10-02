// Nieuwsmelder: elke minuut (cron) eerst Telegram-commando's verwerken, dan het nieuws checken.

import { LAST_RUN_KEY, ownerChat, processUpdates } from "./bot.ts";
import { checkNews } from "./check.ts";
import type { Env } from "./config.ts";
import { loadConfig } from "./config.ts";
import type { Store } from "./store.ts";
import { D1Store } from "./store.ts";
import { Telegram } from "./telegram.ts";

const SEEDED_KEY = "seeded";
const LOCK_KEY = "lock";
/** Langer dan een normale run, korter dan het cron-interval plus wat marge. */
const LOCK_SECONDS = 55;

async function seedWatchlist(store: Store, env: Env): Promise<void> {
  if (await store.getSetting(SEEDED_KEY)) return;
  for (const entry of loadConfig(env).seedWatchlist) await store.addWatch(entry);
  await store.setSetting(SEEDED_KEY, "1");
}

export async function runOnce(env: Env, now = Math.floor(Date.now() / 1000)): Promise<void> {
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
    const log = (message: string) => console.log(message);
    await seedWatchlist(store, env);

    try {
      await processUpdates({ store, telegram, fetcher, config, fixedChatId: env.TELEGRAM_CHAT_ID }, log);
    } catch (error) {
      console.error("Telegram-commando's ophalen mislukt:", error);
    }

    const chatId = await ownerChat(store, env.TELEGRAM_CHAT_ID);
    if (!chatId) {
      console.log("Nog geen eigenaar; stuur /start naar de bot.");
      return;
    }
    const result = await checkNews({ store, telegram, fetcher, chatId, config, now, log });
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

export default {
  async scheduled(controller, env, ctx) {
    ctx.waitUntil(runOnce(env, Math.floor(controller.scheduledTime / 1000)));
  },

  async fetch() {
    return new Response("Nieuwsmelder draait. Bediening gaat via Telegram.\n", {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  },
} satisfies ExportedHandler<Env>;
