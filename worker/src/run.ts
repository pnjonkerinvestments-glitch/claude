/** De eigenlijke scan: venster bepalen, databron bevragen, filteren, dedupen, mailen. */

import * as clock from "./clock.ts";
import { configFromEnv, validateConfig, type RawEnv } from "./config.ts";
import type { Mover } from "./models.ts";
import { sendEmail } from "./notifier.ts";
import { getProvider, type Provider } from "./providers/index.ts";
import { select } from "./scanner.ts";
import type { Connect } from "./smtp.ts";
import { AlertState, type KvLike } from "./state.ts";

export interface RunOptions {
  dryRun?: boolean;
  ignoreWindow?: boolean;
  threshold?: number;
  selfTest?: boolean;
  now?: Date;
  /** Te vervangen in tests. */
  provider?: Provider;
}

export interface RunDeps {
  env: RawEnv;
  kv: KvLike;
  connect: Connect;
  log?: (msg: string) => void;
}

export interface RunResult {
  status: "outside-window" | "no-hits" | "already-sent" | "sent" | "self-test";
  sent: string[];
  logs: string[];
}

export const SAMPLE: Mover = {
  symbol: "TEST",
  exchange: "NASDAQ",
  name: "Voorbeeldmelding - dit is geen echte beweging",
  price: 7.5,
  prevClose: 4.0,
  changePct: 87.5,
  volume: 1_250_000,
  marketCap: 180_000_000,
  instrumentType: "stock",
};

export async function runScan(deps: RunDeps, opts: RunOptions = {}): Promise<RunResult> {
  const logs: string[] = [];
  const log = (msg: string) => {
    logs.push(msg);
    (deps.log ?? console.log)(msg);
  };
  const done = (status: RunResult["status"], sent: Mover[] = []): RunResult => ({
    status,
    sent: sent.map((m) => m.symbol),
    logs,
  });

  const cfg = configFromEnv(deps.env);
  if (opts.dryRun) cfg.dryRun = true;
  if (opts.ignoreWindow) cfg.ignoreWindow = true;
  if (opts.threshold !== undefined) cfg.thresholdPct = opts.threshold;
  validateConfig(cfg);

  const now = opts.now ?? new Date();
  const when = clock.stamp(now);

  if (opts.selfTest) {
    await sendEmail([SAMPLE], cfg, when, deps.connect, log);
    log("Testmail afgehandeld");
    return done("self-test", [SAMPLE]);
  }

  if (!cfg.ignoreWindow && !clock.inPremarketWindow(now)) {
    log(`Buiten de premarket (${when} ET) - niets te doen`);
    return done("outside-window");
  }
  if (!clock.holidaysKnown(now)) {
    log(`Geen feestdagenlijst voor ${clock.toEt(now).year}; alleen weekenden worden overgeslagen`);
  }

  const provider = opts.provider ?? getProvider(cfg);
  log(`Databron ${cfg.provider} bevragen (drempel ${cfg.thresholdPct.toFixed(0)}%)`);
  const movers = await provider(cfg, { warn: log });
  log(`${movers.length} rij(en) van de databron`);

  const hits = select(movers, cfg, log);
  log(`${hits.length} ticker(s) boven de drempel`);
  if (!hits.length) return done("no-hits");

  const state = await AlertState.load(deps.kv, clock.sessionDate(now), log);
  const fresh = state.filterNew(hits, cfg.reAlertStepPct);
  if (!fresh.length) {
    log("Alles al gemeld vandaag - geen mail");
    return done("already-sent");
  }

  await sendEmail(fresh, cfg, when, deps.connect, log);
  if (!cfg.dryRun) {
    for (const m of fresh) state.record(m);
    await state.save();
  }
  return done("sent", fresh);
}
