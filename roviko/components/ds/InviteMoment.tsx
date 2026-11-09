'use client';
import React, { useEffect } from 'react';
import { Share2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { sharedName, sharedToday, standingFor } from '@/lib/share';
import type { DayMode } from '@/lib/daily-loop';
import { challengeLine, challengeRank } from '../home/ChallengeBanner';
import { Peek } from './Character';
import { Coin } from './Coin';

export type InviteKind = 'best' | 'top' | 'score' | 'day';
const KEY = 'roviko:invite-moment';
type Memory = { date?: string; skips?: number };
const read = (): Memory => { try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') ?? {}; } catch { return { date: '9999' }; } };
const write = (m: Memory) => { try { localStorage.setItem(KEY, JSON.stringify(m)); } catch { /* may ask again, harmless */ } };
const daysBetween = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);

/**
 * May the invite moment show today? Once a day at most, never on a day you already shared something, and after two
 * "Not now" in a row it rests for three days (any invite sent resets that).
 */
export function inviteAllowed(date: string) {
  const m = read();
  if (m.date === date || sharedToday(date)) return false;
  if ((m.skips ?? 0) >= 2 && m.date && daysBetween(m.date, date) < 3) return false;
  return true;
}
const markShown = (date: string) => write({ ...read(), date });

/**
 * 1.60: the invite moment. Instead of only a share button, at a moment worth bragging about (a new personal best, a
 * score better than most players, or a finished day) Roviko asks once, kindly, whether a friend should try to beat
 * you, and shows exactly what that friend will see: the same card as on the friend's page (ChallengeBanner).
 * Sharing is the existing share (text with the challenge link); nothing is sent by Roviko itself.
 */
export function InviteMoment({ open, date, kind, mode, points, beaten, name, t, locale, onInvite, onClose }: {
  open: boolean; date: string; kind: InviteKind; mode: DayMode | 'day'; points: number; beaten?: number | null; name?: string;
  t: (k: string) => string; locale: string; onInvite: () => void; onClose: () => void;
}) {
  useEffect(() => { if (open) markShown(date); }, [open, date]);
  const n = points.toLocaleString(locale);
  const title = kind === 'best' ? t('invTitleBest') : kind === 'top' ? t('invTitleTop').replace('{n}', String(beaten ?? 0)) : kind === 'day' ? t('invTitleDay').replace('{n}', n) : t('invTitleScore').replace('{n}', n);
  // The place of the day travels in the link too (1.26), so the friend sees it: show it here as well.
  const st = standingFor(mode, date), challenge = { mode, points, name: sharedName(name ?? null), ...(st ? { place: st.place, players: st.players } : {}) };
  const rank = challengeRank(t, locale, challenge);
  const later = () => { const m = read(); write({ ...m, date, skips: (m.skips ?? 0) + 1 }); onClose(); };
  const invite = () => { write({ ...read(), date, skips: 0 }); onClose(); onInvite(); };
  return <Dialog open={open} onOpenChange={v => { if (!v) later(); }}>
    <DialogContent className="app-modal invite-moment">
      <DialogTitle className="modal-title">{title}</DialogTitle>
      <DialogDescription>{t(kind === 'day' ? 'invCopyDay' : 'invCopy')}</DialogDescription>
      <figure className="im-ticket" aria-label={t('invPreview')}>
        <figcaption>{t('invPreview')}</figcaption>
        <div>
          <Peek mood="curious" size={64}/>
          <span>
            <span className="t-points ch-score"><Coin size={16}/>{n}</span>
            <strong>{challengeLine(t, locale, challenge)}</strong>
            {rank && <em>🏆 {rank}</em>}
            <small>{t('shareCall')}</small>
          </span>
        </div>
      </figure>
      <button className="btn primary btn-lg" onClick={invite} autoFocus><Share2 size={18} aria-hidden="true"/>{t('invSend')}</button>
      <button className="text-link im-later" onClick={later}>{t('inviteLater')}</button>
    </DialogContent>
  </Dialog>;
}
