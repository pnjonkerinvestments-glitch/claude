'use client';
import React, { useState } from 'react';
import { ArrowRight, Link as LinkIcon, Plus, ShieldCheck } from 'lucide-react';
import { post } from '@/lib/client';
import { errorMessage } from '@/i18n/messages';
import { useApp } from '../app/context';
import { A } from '../app/shared';
import { EmptyState, PageHeader } from '../ds/States';
import { CoverArt } from '../home/CoverArt';
import { GameIcon } from '../atelier/GameIcon';
import { PlayNow } from '../multiplayer/Computer';

const CODE = /^[A-Z2-9]{5}$/;
const ROOM_ERRORS: Record<string, [string, string]> = {
  ROOM_NOT_FOUND: ['roomNotFoundTitle', 'roomNotFoundCopy'], INVALID_ROOM_CODE: ['roomNotFoundTitle', 'roomNotFoundCopy'], NOT_FOUND: ['roomNotFoundTitle', 'roomNotFoundCopy'],
  ROOM_FULL: ['roomFullTitle', 'roomFullCopy'], ROOM_EXPIRED: ['roomExpiredTitle', 'roomExpiredCopy'], ROOM_UNAVAILABLE: ['roomExpiredTitle', 'roomExpiredCopy'],
};
/** Human words for the room errors a player can do something about; null for everything else. */
export function roomErrorCopy(code: string) { return ROOM_ERRORS[code] ?? null; }

/** Enter a five-character room code. Validates as you type and explains what went wrong in place, not in a toast. */
export function JoinForm({ compact = false }: { compact?: boolean }) {
  const { t, go } = useApp();
  const [code, setCode] = useState(''), [busy, setBusy] = useState(false), [problem, setProblem] = useState('');
  const id = compact ? 'compact-code' : 'room-code';
  const join = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!CODE.test(code)) { setProblem(t('codeInvalid')); return; }
    setBusy(true); setProblem('');
    try { await post('/rooms/' + code + '/join'); go('/room/' + code); }
    catch (err) { const m = (err as Error)?.message ?? ''; const known = roomErrorCopy(m); setProblem(known ? t(known[0]) + ' ' + t(known[1]) : t(errorMessage(m))); }
    finally { setBusy(false); }
  };
  return <form onSubmit={join} className={'join-form ' + (compact ? 'compact' : '')} noValidate>
    <label htmlFor={id} className="field-label">{t('roomCode')}</label>
    <div className="join-row">
      <input id={id} className="code-input" placeholder="K7QMA" value={code} onChange={e => { setProblem(''); setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5)); }} maxLength={5} autoComplete="off" autoCorrect="off" autoCapitalize="characters" spellCheck={false} inputMode="text" enterKeyHint="go" aria-invalid={!!problem} aria-describedby={id + '-help'}/>
      <button className="btn primary" disabled={busy || code.length !== 5} aria-busy={busy}>{t('join')}<ArrowRight size={16} aria-hidden="true"/></button>
    </div>
    <p id={id + '-help'} className={problem ? 'field-error' : 'field-help'} role={problem ? 'alert' : undefined}>{problem || t('codeHelp')}</p>
  </form>;
}

/** Shown instead of the lobby when a room cannot be opened: what happened, and two ways on. */
export function RoomProblem({ code, onRetry }: { code: string; onRetry: () => void }) {
  const { t, go, setModal } = useApp();
  const known = roomErrorCopy(code);
  if (!known) return <EmptyState icon={LinkIcon} title={t(errorMessage(code))}><button className="btn primary" onClick={onRetry}>{t('retry')}</button><button className="btn ghost" onClick={() => go('/multiplayer')}>{t('stateBack')}</button></EmptyState>;
  return <EmptyState icon={LinkIcon} title={t(known[0])} copy={t(known[1])}><button className="btn primary" onClick={() => setModal('room')}><Plus size={18} aria-hidden="true"/>{t('createRoom')}</button><button className="btn ghost" onClick={() => go('/multiplayer')}>{t('stateBack')}</button></EmptyState>;
}

export function MultiplayerPage() {
  const { t, setModal, go, fail } = useApp();
  return <div className="page friends-lobby">
    <PageHeader art="friends-hero" kicker={t('friendsKicker')} title={t('friendsLobbyTitle')} lead={t('friendsLobbyLead')}/>
    <PlayNow t={t} go={go} fail={fail}/>
    <div className="lobby-choice">
      <section className="lobby-card lobby-create" aria-labelledby="create-title">
        <div className="lobby-card-art" aria-hidden="true"><CoverArt mode="room"/></div>
        <div className="lobby-card-body">
          <div className="lobby-title"><GameIcon mode="room"/><div><h2 id="create-title">{t('createRoom')}</h2><p>{t('friendsCreateCopy')}</p></div></div>
          <button className="btn primary btn-lg" onClick={() => setModal('room')}><Plus size={20} aria-hidden="true"/>{t('createRoom')}</button>
        </div>
      </section>
      <section className="lobby-card lobby-join" aria-labelledby="join-title">
        <img className="lobby-join-mascot" src="/art/join-mascot.webp" alt="" aria-hidden="true" width={161} height={137} decoding="async"/>
        <div className="lobby-card-body">
          <h2 id="join-title">{t('joinRoom')}</h2>
          <p>{t('friendsJoinCopy')}</p>
          <JoinForm/>
        </div>
      </section>
    </div>
    <div className="lobby-links">
      <A href="/friends" className="soft-link soft-link-art"><img className="soft-link-friends" src="/art/friends-row.webp" alt="" aria-hidden="true" width={407} height={88} decoding="async"/><span><strong>{t('friendsList')}</strong><small>{t('friendsListCopy')}</small></span><ArrowRight size={17} aria-hidden="true"/></A>
      <A href="/how-to-play" className="soft-link soft-link-help"><img className="soft-link-mascot" src="/art/howto-mascot.webp" alt="" aria-hidden="true" width={185} height={191} decoding="async"/><span><strong>{t('howToLink')}</strong><small>{t('scoringFriendsCopy')}</small></span><ArrowRight size={17} aria-hidden="true"/></A>
    </div>
    <p className="center-note"><ShieldCheck size={16} aria-hidden="true"/>{t('guestNote')}</p>
  </div>;
}
