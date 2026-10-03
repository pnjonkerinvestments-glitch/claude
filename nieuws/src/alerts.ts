// Wie de bot bedient en waar de meldingen heen gaan. Dat zijn twee verschillende dingen:
// de eigenaar is een Telegram-gebruiker (alleen die mag instellingen veranderen), de
// meldingen gaan naar één chat (de eigen chat met de bot, of een groep na /hier).

import type { Store } from "./store.ts";
import type { Telegram } from "./telegram.ts";
import { TelegramError } from "./telegram.ts";

export const OWNER_USER_KEY = "owner_user";
export const ALERT_CHAT_KEY = "alert_chat";
/**
 * Oude sleutel van vóór de groepsfunctie: het chat-id van de privéchat met de eigenaar.
 * In Telegram is dat gelijk aan zijn gebruikers-id, dus het dient voor beide als terugval.
 */
export const LEGACY_OWNER_KEY = "owner_chat";

export async function ownerUser(store: Store): Promise<string | null> {
  return (await store.getSetting(OWNER_USER_KEY)) ?? (await store.getSetting(LEGACY_OWNER_KEY));
}

export async function alertChat(store: Store, fixedChatId?: string): Promise<string | null> {
  return (
    fixedChatId?.trim() || (await store.getSetting(ALERT_CHAT_KEY)) || (await store.getSetting(LEGACY_OWNER_KEY))
  );
}

/** Verstuurt meldingen naar de meldingenchat en volgt een groep die een supergroep wordt. */
export class AlertSender {
  private readonly store: Store;
  private readonly telegram: Telegram;
  chatId: string;

  constructor(store: Store, telegram: Telegram, chatId: string) {
    this.store = store;
    this.telegram = telegram;
    this.chatId = chatId;
  }

  async send(html: string): Promise<void> {
    try {
      await this.telegram.send(this.chatId, html);
    } catch (error) {
      if (!(error instanceof TelegramError) || !error.migrateTo) throw error;
      this.chatId = error.migrateTo;
      await this.store.setSetting(ALERT_CHAT_KEY, this.chatId);
      await this.telegram.send(this.chatId, html);
    }
  }
}
