import { handleApi } from '../server/api';
import { BRAND } from '../lib/config';
/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
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
};

async function route(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/sitemap.xml") {
      const paths=['/','/daily','/multiplayer','/leaderboard','/explore','/learn','/how-to-play','/scoring','/duel','/sources','/privacy','/terms','/support','/world-geography-quiz','/flags-quiz','/capitals-quiz','/country-map-quiz','/europe-geography-quiz','/africa-geography-quiz'];
      return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+paths.map(p=>'<url><loc>https://roviko.app'+p+'</loc></url>').join('')+'</urlset>',{headers:{'Content-Type':'application/xml; charset=utf-8','Cache-Control':'public,max-age=3600'}});
    }
    if (url.pathname.startsWith("/api/")) return handleApi(request, env as any, ctx);

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

    return cachedPage(request, () => handler.fetch(request, env, ctx), ctx);
}

/**
 * 1.50: the HTML of a plain page visit is the same for everyone (the player's own data comes from /api afterwards),
 * so it is kept at the edge for 5 minutes per version, which spares new visitors the render wait. Only a GET for
 * HTML without a query string (challenge and share links keep their own metadata) and without router headers; a
 * response that sets a cookie is never kept. The browser still gets "no-store", as before.
 */
const PAGE_TTL = 300;
async function cachedPage(request: Request, render: () => Promise<Response>, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const cache = (globalThis as any).caches?.default as Cache | undefined;
    const plain = request.method === 'GET' && !url.search && (request.headers.get('Accept') ?? '').includes('text/html')
        && !['RSC', 'Next-Router-State-Tree', 'Next-Router-Prefetch', 'Next-Url'].some(h => request.headers.has(h));
    if (!cache || !plain) return render();
    const key = new Request(url.origin + url.pathname + '?v=' + BRAND.version, { method: 'GET' });
    const hit = await cache.match(key).catch(() => undefined);
    if (hit) { const out = new Response(hit.body, hit); out.headers.set('Cache-Control', 'no-store, must-revalidate'); return out; }
    const res = await render();
    if (res.status === 200 && !res.headers.has('Set-Cookie') && (res.headers.get('Content-Type') ?? '').includes('text/html')) {
        const copy = new Response(res.clone().body, res);
        copy.headers.set('Cache-Control', 'public, max-age=' + PAGE_TTL);
        ctx.waitUntil(cache.put(key, copy).catch(() => { /* rendered again next time */ }));
    }
    return res;
}

export default worker;
