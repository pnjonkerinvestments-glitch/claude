'use client';
import React, { useEffect, useState } from 'react';
import { ArrowRight, Bell, Check, Maximize2, Smartphone } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { APP_STORE_URL } from '@/lib/config';
import { Mascot } from '../ds/Mascot';

const KEY = 'roviko:app-prompt';
const QUIET_FOR = 14 * 86400000;

/** True inside the native app (Capacitor), an installed web app, or the ?app=1 preview. */
export function inApp() {
  try {
    if (sessionStorage.getItem('rv_app') === '1') return true;
    const w = window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } };
    if (w.Capacitor?.isNativePlatform?.()) return true;
    return !!window.matchMedia?.('(display-mode: standalone)').matches;
  } catch { return false; }
}
/** iPhone and iPad in a browser (iPadOS reports itself as a Mac with touch). */
export function iosBrowser() {
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}
function quiet() { try { return Date.now() - Number(localStorage.getItem(KEY) ?? 0) < QUIET_FOR; } catch { return true; } }
function remember() { try { localStorage.setItem(KEY, String(Date.now())); } catch { /* shows again next visit */ } }

/** Whether the get-the-app screen should open on this visit. Decided after mount (it needs the browser). */
export function useAppPrompt() {
  const [open, setOpen] = useState(false), [decided, setDecided] = useState(false);
  useEffect(() => { if (APP_STORE_URL && !inApp() && iosBrowser() && !quiet()) setOpen(true); setDecided(true); }, []);
  return { open, decided, close: () => { remember(); setOpen(false); } };
}

/** Straight away on the homepage for iPhone visitors in the browser: the app, or carry on here. */
export function AppPrompt({ open, onClose, t }: { open: boolean; onClose: () => void; t: (k: string) => string }) {
  return <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
    <DialogContent className="app-modal app-prompt">
      <div className="app-prompt-art" aria-hidden="true"><Mascot mood="cheer" size={120}/><span className="app-prompt-phone"><Smartphone size={30}/></span></div>
      <DialogTitle className="modal-title">{t('appPromptTitle')}</DialogTitle>
      <DialogDescription>{t('appPromptCopy')}</DialogDescription>
      <ul className="tour-perks">
        <li><Maximize2 size={16} aria-hidden="true"/>{t('appPromptPerk1')}</li>
        <li><Bell size={16} aria-hidden="true"/>{t('appPromptPerk2')}</li>
        <li><Check size={16} strokeWidth={3} aria-hidden="true"/>{t('appPromptPerk3')}</li>
      </ul>
      <div className="tour-actions is-final">
        <a className="btn app-store-btn btn-lg" href={APP_STORE_URL} onClick={onClose} rel="noopener">{t('appPromptCta')}<ArrowRight size={18} aria-hidden="true"/></a>
        <button className="btn ghost" onClick={onClose}>{t('appPromptLater')}</button>
      </div>
    </DialogContent>
  </Dialog>;
}
