import { handleApi } from '../server/api';
import { sendReminders } from '../server/reminders';
import { pruneExpired } from '../server/retention';
import { appLinks } from '../server/app-links';
/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  APPLE_TEAM_ID?: string;
  ANDROID_CERT_SHA256?: string;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

/** 1.45: security headers on every page and API answer (static files get the same from public/_headers).
 *  The CSP only limits framing, plugins and <base>; scripts and styles stay as they are, so nothing breaks. */
const SECURITY_HEADERS: Record<string, string> = {
  'Strict-Transport-Security': 'max-age=31536000',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'Content-Security-Policy': "frame-ancestors 'none'; base-uri 'self'; object-src 'none'",
};
function secure(res: Response): Response {
  // A WebSocket upgrade (multiplayer) must be passed on untouched.
  if (res.status === 101 || (res as any).webSocket) return res;
  const out = new Response(res.body, res);
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) if (!out.headers.has(k)) out.headers.set(k, v);
  return out;
}

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return secure(await route(request, env, ctx));
  },
  /** 1.51: the Cron Trigger in wrangler.cloudflare.jsonc (17:00 UTC) sends the opt-in reminder mails (server/reminders.ts). */
  async scheduled(_event: unknown, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(sendReminders(env as any).then(r => console.log('reminders', JSON.stringify(r))).catch(e => console.error('reminders failed', e)));
    // 1.54: the housekeeping (old guests, expired sessions and rooms) runs here, four times a day at a quiet hour,
    // instead of with the first visit on every new server instance, where its big deletes held up everyone's requests.
    if (new Date().getUTCHours() % 6 === 3) ctx.waitUntil(pruneExpired(env as any, Date.now(), true).then(() => console.log('housekeeping done')).catch(e => console.error('housekeeping failed', e)));
  },
};

async function route(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // 1.55: the daily Clue Trail became Daily Crossroads; old links to it land on the new daily game.
    if (['/trail', '/clue-trail', '/daily-trail', '/daily/trail', '/daily-clue-trail'].includes(url.pathname.replace(/\/$/, ''))) return Response.redirect(new URL('/crossroads' + url.search, url).toString(), 301);
    if (url.pathname === "/sitemap.xml") {
      const paths=['/','/daily','/crossroads','/multiplayer','/leaderboard','/explore','/learn','/how-to-play','/scoring','/duel','/sources','/privacy','/terms','/support','/world-geography-quiz','/flags-quiz','/capitals-quiz','/country-map-quiz','/europe-geography-quiz','/africa-geography-quiz'];
      return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+paths.map(p=>'<url><loc>https://roviko.app'+p+'</loc></url>').join('')+'</urlset>',{headers:{'Content-Type':'application/xml; charset=utf-8','Cache-Control':'public,max-age=3600'}});
    }
    if (url.pathname.startsWith("/api/")) return handleApi(request, env as any, ctx);
    // 1.51: universal links (iPhone) and app links (Android), so roviko.app links from emails open in the app.
    // The ids come from the deploy (GitHub secrets APPLE_TEAM_ID and ANDROID_CERT_SHA256); without them: 404.
    if (url.pathname === "/.well-known/apple-app-site-association" || url.pathname === "/.well-known/assetlinks.json") return appLinks(url.pathname, env);

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    return handler.fetch(request, env, ctx);
}

export default worker;
