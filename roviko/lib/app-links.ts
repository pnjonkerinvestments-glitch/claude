// 1.51: a roviko.app link that opens the iOS/Android app (universal link / app link, e.g. from a reminder email or the
// email confirmation) arrives through Capacitor's App plugin, not as a page load. This sends the app's web view to
// that address: /api links (confirm email, unsubscribe) load fully so the server can answer and redirect, other
// pages open in place. Outside the app, or in an older app without the plugin, this does nothing.
type AppPlugin = { addListener?: (e: string, fn: (d: { url?: string }) => void) => Promise<{ remove(): void }> | { remove(): void }; getLaunchUrl?: () => Promise<{ url?: string } | undefined> };
type CapacitorGlobal = { isNativePlatform?: () => boolean; Plugins?: { App?: AppPlugin } };
const app = () => { try { const c = (window as unknown as { Capacitor?: CapacitorGlobal }).Capacitor; return c?.isNativePlatform?.() ? c.Plugins?.App : undefined; } catch { return undefined; } };

/** The path to open for a link, or null when it is not a roviko.app link. */
export function appLinkTarget(link: string | undefined): string | null {
  try {
    const u = new URL(link ?? '');
    if (u.protocol !== 'https:' || u.hostname !== 'roviko.app') return null;
    return (u.pathname || '/') + u.search + u.hash;
  } catch { return null; }
}

export function listenForAppLinks(go: (href: string) => void) {
  const plugin = app();
  if (!plugin) return () => {};
  const open = (link?: string) => {
    const target = appLinkTarget(link);
    if (!target) return;
    if (target.startsWith('/api/')) window.location.assign(target); else go(target);
  };
  // Started cold by a link: open it once (not again after a reload).
  plugin.getLaunchUrl?.().then(r => { try { if (r?.url && sessionStorage.getItem('rv_launch_url') !== r.url) { sessionStorage.setItem('rv_launch_url', r.url); open(r.url); } } catch { open(r?.url); } }).catch(() => {});
  let handle: { remove(): void } | undefined, gone = false;
  Promise.resolve(plugin.addListener?.('appUrlOpen', d => open(d.url))).then(h => { if (gone) h?.remove(); else handle = h; }).catch(() => {});
  return () => { gone = true; handle?.remove(); };
}
