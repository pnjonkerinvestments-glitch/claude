import { ConfigError, type Config } from "../config.ts";
import type { RequestOptions } from "../http.ts";
import type { Mover } from "../models.ts";
import { fetchPolygon } from "./polygon.ts";
import { fetchTradingView } from "./tradingview.ts";

export type Provider = (cfg: Config, opts?: RequestOptions) => Promise<Mover[]>;

export const PROVIDERS: Record<string, Provider> = {
  tradingview: fetchTradingView,
  polygon: fetchPolygon,
};

export function getProvider(cfg: Config): Provider {
  const provider = PROVIDERS[cfg.provider];
  if (!provider) throw new ConfigError(`Onbekende provider ${JSON.stringify(cfg.provider)}`);
  return provider;
}
