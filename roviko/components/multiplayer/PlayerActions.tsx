'use client';
import React, { useState } from 'react';
import { Ban, Flag, MoreHorizontal } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { api, post } from '@/lib/client';
import { toast } from 'sonner';

type T = (key: string) => string;
const REASONS = ['name', 'cheating', 'behaviour', 'other'] as const;

/**
 * Report or block another player, from a room, a result list or the friends page.
 * Blocking works on the server: you are never matched, invited or shown online to each other again.
 */
export function PlayerActions({ player, t, room, onBlocked }: { player: { id: string; name: string; bot?: boolean }; t: T; room?: string; onBlocked?: () => void }) {
  const [open, setOpen] = useState(false), [reason, setReason] = useState<typeof REASONS[number]>('name'), [busy, setBusy] = useState(''), [done, setDone] = useState('');
  if (player.bot) return null;
  const run = async (kind: 'report' | 'block') => {
    if (busy) return; setBusy(kind);
    try {
      if (kind === 'report') await post('/players/' + encodeURIComponent(player.id) + '/report', { reason, room: room ?? null });
      else { await post('/players/' + encodeURIComponent(player.id) + '/block', {}); onBlocked?.(); }
      setDone(kind);
      toast.success(t(kind === 'report' ? 'reportSent' : 'playerBlocked').replace('{name}', player.name));
    } catch { toast.error(t('actionFailed')); }
    finally { setBusy(''); }
  };
  return <>
    <button type="button" className="icon-button player-actions-btn" aria-label={t('playerActions').replace('{name}', player.name)} onClick={() => { setDone(''); setOpen(true); }}><MoreHorizontal size={18}/></button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="app-modal player-actions">
        <DialogTitle className="modal-title">{player.name}</DialogTitle>
        <DialogDescription>{t('playerActionsCopy')}</DialogDescription>
        <fieldset className="report-reasons" disabled={!!busy || done === 'report'}>
          <legend className="field-label"><Flag size={15} aria-hidden="true"/>{t('reportPlayer')}</legend>
          {REASONS.map(r => <label key={r} className={'report-reason' + (reason === r ? ' is-selected' : '')}><input type="radio" name="report-reason" value={r} checked={reason === r} onChange={() => setReason(r)}/>{t('reportReason_' + r)}</label>)}
          <button type="button" className="btn secondary wide" onClick={() => run('report')}>{done === 'report' ? t('reportSentShort') : busy === 'report' ? t('loading') : t('reportPlayer')}</button>
        </fieldset>
        <div className="block-box">
          <p><Ban size={15} aria-hidden="true"/>{t('blockCopy')}</p>
          <button type="button" className="btn wide delete-button" disabled={!!busy || done === 'block'} onClick={() => run('block')}>{done === 'block' ? t('blockedShort') : busy === 'block' ? t('loading') : t('blockPlayer')}</button>
        </div>
      </DialogContent>
    </Dialog>
  </>;
}

/** The players you blocked, with a way to undo it. Shown in the passport. */
export function BlockedPlayers({ t }: { t: T }) {
  const [list, setList] = useState<{ id: string; name: string }[] | null>(null);
  React.useEffect(() => { api('/blocks').then(r => setList(r.blocked ?? [])).catch(() => setList([])); }, []);
  if (!list?.length) return null;
  const unblock = async (id: string) => { try { await api('/players/' + encodeURIComponent(id) + '/block', { method: 'DELETE' }); setList(l => (l ?? []).filter(x => x.id !== id)); } catch { toast.error(t('actionFailed')); } };
  return <section className="page-section" aria-labelledby="blocked-title">
    <h2 id="blocked-title" className="section-title-small">{t('blockedPlayers')}</h2>
    <ul className="blocked-list">{list.map(p => <li key={p.id}><span>{p.name}</span><button type="button" className="btn ghost" onClick={() => unblock(p.id)}>{t('unblock')}</button></li>)}</ul>
  </section>;
}
