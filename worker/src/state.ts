/** Onthoudt in Workers KV welke tickers al gemeld zijn, zodat elke run niet dezelfde mail stuurt. */

import { moverKey, type Mover } from "./models.ts";

const KEEP_SECONDS = 7 * 24 * 3600;

/** Het deel van KVNamespace dat we gebruiken; maakt testen zonder Cloudflare mogelijk. */
export interface KvLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

export class AlertState {
  private alerts: Record<string, number> = {};
  private readonly kv: KvLike;
  private readonly key: string;

  private constructor(kv: KvLike, sessionDay: string) {
    this.kv = kv;
    this.key = `alerts:${sessionDay}`;
  }

  static async load(kv: KvLike, sessionDay: string, warn: (msg: string) => void = () => {}): Promise<AlertState> {
    const state = new AlertState(kv, sessionDay);
    try {
      const raw = await kv.get(state.key);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          for (const [symbol, pct] of Object.entries(parsed)) {
            if (typeof pct === "number") state.alerts[symbol] = pct;
          }
        }
      }
    } catch (err) {
      // Een kapotte status mag nooit de alert tegenhouden.
      warn(`Kon ${state.key} niet lezen (${String(err)}); begin met lege status`);
      state.alerts = {};
    }
    return state;
  }

  /** Nieuw als de ticker vandaag nog niet gemeld is, of sindsdien flink verder steeg. */
  isNew(m: Mover, stepPct: number): boolean {
    const previous = this.alerts[moverKey(m)];
    return previous === undefined || m.changePct >= previous + stepPct;
  }

  filterNew(movers: Mover[], stepPct: number): Mover[] {
    return movers.filter((m) => this.isNew(m, stepPct));
  }

  record(m: Mover): void {
    const key = moverKey(m);
    this.alerts[key] = Math.max(this.alerts[key] ?? 0, m.changePct);
  }

  async save(): Promise<void> {
    await this.kv.put(this.key, JSON.stringify(this.alerts), { expirationTtl: KEEP_SECONDS });
  }
}
