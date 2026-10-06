// Wie de bot bedient en waar de meldingen heen gaan. Dat zijn twee verschillende dingen:
// de eigenaar is een Telegram-gebruiker (alleen die mag de bestemmingen veranderen), de
// meldingen gaan naar een chat, en in een groep met Topics per soort naar een eigen onderwerp.

import type { Store } from "./store.ts";
import type { Telegram } from "./telegram.ts";
import { TelegramError } from "./telegram.ts";

export const OWNER_USER_KEY = "owner_user";
export const ALERT_CHAT_KEY = "alert_chat";
/** Onderwerp in de meldingenchat voor alles zonder eigen bestemming (leeg = algemeen). */
export const ALERT_THREAD_KEY = "alert_thread";
/** Bestemming per soort melding: { "volglijst": {chat, thread}, "filter:emissie": {...}, ... } */
export const ROUTES_KEY = "routes";
/**
 * Oude sleutel van vóór de groepsfunctie: het chat-id van de privéchat met de eigenaar.
 * In Telegram is dat gelijk aan zijn gebruikers-id, dus het dient voor beide als terugval.
 */
export const LEGACY_OWNER_KEY = "owner_chat";

export interface Destination {
  chat: string;
  thread?: number;
}

export type Routes = Record<string, Destination>;

/** Soorten meldingen. Woordfilters heten "filter:<naam>". */
export const WATCHLIST = "volglijst";
export const TARGETS = "koersdoel";
export const filterCategory = (name: string) => `filter:${name}`;

export async function ownerUser(store: Store): Promise<string | null> {
  return (await store.getSetting(OWNER_USER_KEY)) ?? (await store.getSetting(LEGACY_OWNER_KEY));
}

export async function alertChat(store: Store, fixedChatId?: string): Promise<string | null> {
  return (
    fixedChatId?.trim() || (await store.getSetting(ALERT_CHAT_KEY)) || (await store.getSetting(LEGACY_OWNER_KEY))
  );
}

export async function loadRoutes(store: Store): Promise<Routes> {
  const raw = await store.getSetting(ROUTES_KEY);
  try {
    return raw ? (JSON.parse(raw) as Routes) : {};
  } catch {
    return {};
  }
}

export async function saveRoutes(store: Store, routes: Routes): Promise<void> {
  if (Object.keys(routes).length) await store.setSetting(ROUTES_KEY, JSON.stringify(routes));
  else await store.deleteSetting(ROUTES_KEY);
}

/** Groep is supergroep geworden (gebeurt o.a. bij het aanzetten van Topics): overal het nieuwe id. */
export async function migrateChat(store: Store, from: string, to: string): Promise<void> {
  if ((await store.getSetting(ALERT_CHAT_KEY)) === from) await store.setSetting(ALERT_CHAT_KEY, to);
  const routes = await loadRoutes(store);
  let changed = false;
  for (const destination of Object.values(routes)) {
    if (destination.chat === from) {
      destination.chat = to;
      changed = true;
    }
  }
  if (changed) await saveRoutes(store, routes);
}

/** Verstuurt meldingen naar de juiste chat en het juiste onderwerp. */
export class AlertSender {
  private readonly store: Store;
  private readonly telegram: Telegram;
  private readonly fallback: Destination;
  private routes: Routes | null = null;

  constructor(store: Store, telegram: Telegram, chatId: string, threadId?: number) {
    this.store = store;
    this.telegram = telegram;
    this.fallback = { chat: chatId, thread: threadId };
  }

  /** Bestemmingen voor deze soorten, zonder dubbele; zonder eigen bestemming naar de standaardchat. */
  async destinations(categories: string[]): Promise<Destination[]> {
    this.routes ??= await loadRoutes(this.store);
    const list = categories.length ? categories.map((c) => this.routes![c] ?? this.fallback) : [this.fallback];
    const unique = new Map(list.map((d) => [`${d.chat}#${d.thread ?? ""}`, d]));
    return [...unique.values()];
  }

  async send(html: string, categories: string[] = []): Promise<void> {
    for (const destination of await this.destinations(categories)) {
      try {
        await this.telegram.send(destination.chat, html, destination.thread);
      } catch (error) {
        if (!(error instanceof TelegramError) || !error.migrateTo) throw error;
        await migrateChat(this.store, destination.chat, error.migrateTo);
        this.routes = null;
        if (this.fallback.chat === destination.chat) this.fallback.chat = error.migrateTo;
        await this.telegram.send(error.migrateTo, html, destination.thread);
      }
    }
  }
}
