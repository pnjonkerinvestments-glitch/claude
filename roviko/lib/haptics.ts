import type { Effect } from './audio';

// Vibration in the iOS/Android app through Capacitor's Haptics plugin, which the app ships with
// (roviko-app/package.json). The website itself never vibrates: outside the app this does nothing.
type HapticsPlugin = {
  impact?: (o: { style: 'LIGHT' | 'MEDIUM' | 'HEAVY' }) => Promise<void>;
  notification?: (o: { type: 'SUCCESS' | 'WARNING' | 'ERROR' }) => Promise<void>;
};
type CapacitorGlobal = { isNativePlatform?: () => boolean; getPlatform?: () => string; Plugins?: { Haptics?: HapticsPlugin } };
const capacitor = () => (typeof window === 'undefined' ? undefined : (window as unknown as { Capacitor?: CapacitorGlobal }).Capacitor);

/** 1.49: 'ios' or 'android' inside the store apps, 'web' in a browser (for the growth dashboard). */
export const appPlatform = (): 'ios' | 'android' | 'web' => { try { const p = isNativeApp() ? capacitor()?.getPlatform?.() : 'web'; return p === 'ios' || p === 'android' ? p : 'web'; } catch { return 'web'; } };
/** True inside the App Store / Google Play app. */
export const isNativeApp = () => { try { return !!capacitor()?.isNativePlatform?.(); } catch { return false; } };

export function haptic(type: Effect) {
  try {
    const h = isNativeApp() ? capacitor()?.Plugins?.Haptics : undefined;
    if (!h) return;
    const done = type === 'correct' ? h.notification?.({ type: 'SUCCESS' })
      : type === 'incorrect' ? h.notification?.({ type: 'ERROR' })
      : type === 'win' || type === 'finish' ? h.impact?.({ style: 'HEAVY' })
      : h.impact?.({ style: 'LIGHT' });
    void done?.catch(() => {});
  } catch { /* an older app without the plugin: no vibration */ }
}
