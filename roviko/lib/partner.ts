// 1.59: where a visitor came from, for a friendlier first card (e.g. players sent by the Sussydle daily-games hub).
// Read once from the referrer or ?ref= / ?utm_source= and kept for this browser session only. No tracking: nothing
// is sent anywhere, it only changes a line of text.
export type Partner = 'sussydle';
const KEY = 'rv_from';
const known = (v?: string | null): Partner | null => /sussydle/i.test(v ?? '') ? 'sussydle' : null;

/** Call once when the app starts. */
export function rememberPartner() {
  if (typeof window === 'undefined') return;
  try {
    const q = new URLSearchParams(location.search);
    let ref: string | null = null;
    try { ref = document.referrer ? new URL(document.referrer).hostname : null; } catch { ref = null; }
    const found = known(q.get('ref')) ?? known(q.get('utm_source')) ?? known(ref);
    if (found) sessionStorage.setItem(KEY, found);
  } catch { /* private mode: the normal card shows */ }
}
/** The partner this visit came from; reads the URL too, since a first card can render before the app's effect runs. */
export function partner(): Partner | null {
  rememberPartner();
  try { return known(sessionStorage.getItem(KEY)); } catch { return null; }
}
