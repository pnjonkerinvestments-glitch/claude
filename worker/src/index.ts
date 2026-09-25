/**
 * Roviko: premarket-alert als Cloudflare Worker.
 *
 * - `scheduled`: de cron-trigger uit wrangler.jsonc, elke 5 minuten op werkdagen.
 * - `fetch`: `POST /run` om hem met de hand te draaien (vervangt "Run workflow"),
 *   beveiligd met het secret RUN_TOKEN. Zonder RUN_TOKEN staat dit endpoint uit.
 */

import { connect } from "cloudflare:sockets";
import { ConfigError } from "./config.ts";
import { runScan, type RunOptions } from "./run.ts";

export interface Env {
  STATE: KVNamespace;
  RUN_TOKEN?: string;
  [name: string]: unknown;
}

async function authorized(request: Request, token: string): Promise<boolean> {
  const given = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const encoder = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(given)),
    crypto.subtle.digest("SHA-256", encoder.encode(token)),
  ]);
  return crypto.subtle.timingSafeEqual(a, b);
}

function flag(params: URLSearchParams, name: string, fallback: boolean): boolean {
  const raw = params.get(name);
  return raw === null ? fallback : ["1", "true", "yes", "on"].includes(raw.toLowerCase());
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), { status, headers: { "Content-Type": "application/json" } });

export default {
  async scheduled(_controller, env, _ctx): Promise<void> {
    // Een fout gooit door, zodat de run in het Cloudflare-dashboard als mislukt staat.
    await runScan({ env, kv: env.STATE, connect });
  },

  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname !== "/run") return new Response("roviko premarket-alert\n");
    if (!env.RUN_TOKEN) return new Response("Handmatig draaien staat uit (zet RUN_TOKEN)\n", { status: 404 });
    if (request.method !== "POST") return new Response("Gebruik POST\n", { status: 405 });
    if (!(await authorized(request, env.RUN_TOKEN))) return new Response("Niet geautoriseerd\n", { status: 401 });

    const params = url.searchParams;
    const threshold = params.get("threshold");
    const opts: RunOptions = {
      dryRun: flag(params, "dry_run", false),
      // Net als de oude "Run workflow"-knop: standaard ook buiten de premarket.
      ignoreWindow: flag(params, "ignore_window", true),
      selfTest: flag(params, "self_test", false),
      threshold: threshold ? Number(threshold) : undefined,
    };
    if (opts.threshold !== undefined && !(opts.threshold > 0)) {
      return json({ error: "threshold moet een getal groter dan 0 zijn" }, 400);
    }
    try {
      return json(await runScan({ env, kv: env.STATE, connect }, opts));
    } catch (err) {
      console.error(err);
      return json({ error: String(err) }, err instanceof ConfigError ? 400 : 500);
    }
  },
} satisfies ExportedHandler<Env>;
