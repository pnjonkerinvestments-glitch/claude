import type { Config } from "./config.ts";
import { dollarVolume, type Mover } from "./models.ts";

/** Voldoet deze mover aan de drempels? Bij afwijzing de reden, anders null. */
export function rejectReason(m: Mover, cfg: Config): string | null {
  if (m.changePct < cfg.thresholdPct) return `stijging ${m.changePct.toFixed(1)}% < ${cfg.thresholdPct.toFixed(1)}%`;
  if (m.price < cfg.minPrice) return `koers ${m.price.toFixed(2)} < ${cfg.minPrice.toFixed(2)}`;
  if (cfg.maxPrice > 0 && m.price > cfg.maxPrice) return `koers ${m.price.toFixed(2)} > ${cfg.maxPrice.toFixed(2)}`;
  if (m.volume < cfg.minPremarketVolume) return `volume ${m.volume} < ${cfg.minPremarketVolume}`;
  if (dollarVolume(m) < cfg.minDollarVolume) {
    return `omzet $${Math.round(dollarVolume(m))} < $${Math.round(cfg.minDollarVolume)}`;
  }
  const exchanges = cfg.exchanges.map((e) => e.toUpperCase());
  if (exchanges.length && m.exchange && !exchanges.includes(m.exchange.toUpperCase())) {
    return `beurs ${m.exchange} niet in selectie`;
  }
  if (cfg.instrumentTypes.length && !cfg.instrumentTypes.includes(m.instrumentType)) {
    return `type ${m.instrumentType} niet in selectie`;
  }
  return null;
}

/** Filter op de drempels en sorteer van hardste stijger naar minste. */
export function select(movers: Mover[], cfg: Config, debug: (msg: string) => void = () => {}): Mover[] {
  const hits: Mover[] = [];
  for (const m of movers) {
    const reason = rejectReason(m, cfg);
    if (reason === null) hits.push(m);
    else if (m.changePct >= cfg.thresholdPct) debug(`${m.symbol} afgewezen: ${reason}`);
  }
  hits.sort((a, b) => b.changePct - a.changePct);
  return hits.slice(0, cfg.maxResults);
}
