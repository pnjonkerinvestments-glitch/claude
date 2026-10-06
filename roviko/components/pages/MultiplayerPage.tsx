'use client';
import React, { useState } from 'react';
import { ArrowRight, Bot, ChevronDown, Globe2, Link as LinkIcon, Plus, Users } from 'lucide-react';
import { post } from '@/lib/client';
import { DEFAULT_SETTINGS } from '@/lib/config';
import { BOT_LEVELS, type BotLevel } from '@/lib/game-engine/bots';
import { RoomScene } from '../ds/RoomScene';
import { errorMessage } from '@/i18n/messages';
import { useApp } from '../app/context';
import { EmptyState } from '../ds/States';
import { FriendsOnlinePanel } from '../friends/Friends';

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

/**
 * The Multiplayer tab (1.23): one clean card in the style of the room, with the three ways to play and the
 * room code. Opening "Play with friends" creates the room straight away; its waiting room is `RoomLobby`.
 */
export function MultiplayerPage() {
  const { t, go, fail, boot } = useApp();
  const [level, setLevel] = useState<BotLevel>('medium'), [busy, setBusy] = useState(''), [computerOpen, setComputerOpen] = useState(false);
  const run = async (kind: string, task: () => Promise<string>) => { if (busy) return; setBusy(kind); try { go('/room/' + await task()); } catch (e) { fail(e); setBusy(''); } };
  const friends = () => run('friends', async () => (await post('/rooms', { settings: DEFAULT_SETTINGS })).code);
  const quick = () => run('quick', async () => (await post('/match/quick', {})).code);
  const computer = () => run('computer', async () => { const room = await post('/rooms', { settings: DEFAULT_SETTINGS }); await post('/rooms/' + room.code + '/computer', { level }); return room.code; });
  return <div className="page mp-calm">
    <section className="mp-card" aria-labelledby="mp-title">
      <RoomScene className="mp-scene"/>
      <header className="mp-head"><h1 id="mp-title">{t('mpTitle')}</h1><p>{t('mpLeadShort')}</p></header>
      <div className="mp-choices">
        <button type="button" className="mp-choice" disabled={!!busy} aria-busy={busy === 'friends'} onClick={friends}><span className="mp-choice-icon" aria-hidden="true"><Users size={22}/></span><span className="mp-choice-copy"><strong>{t('mpFriends')}</strong><small>{busy === 'friends' ? t('loading') : t('mpFriendsSub')}</small></span><ArrowRight size={18} aria-hidden="true"/></button>
        <button type="button" className="mp-choice" disabled={!!busy} aria-busy={busy === 'quick'} onClick={quick}><span className="mp-choice-icon is-blue" aria-hidden="true"><Globe2 size={22}/></span><span className="mp-choice-copy"><strong>{t('mpRandom')}</strong><small>{busy === 'quick' ? t('loading') : t('mpRandomSub')}</small></span><ArrowRight size={18} aria-hidden="true"/></button>
        <div className={'mp-choice-wrap' + (computerOpen ? ' is-open' : '')}>
          <button type="button" className="mp-choice" disabled={!!busy} aria-expanded={computerOpen} aria-controls="mp-computer" onClick={() => setComputerOpen(v => !v)}><span className="mp-choice-icon is-gold" aria-hidden="true"><Bot size={22}/></span><span className="mp-choice-copy"><strong>{t('mpComputer')}</strong><small>{t('mpComputerSub')}</small></span><ChevronDown size={18} className="mp-chevron" aria-hidden="true"/></button>
          {computerOpen && <div className="mp-computer" id="mp-computer">
            <div className="segmented-pill" role="radiogroup" aria-label={t('computerLevel')}>{BOT_LEVELS.map(l => <button key={l} type="button" role="radio" aria-checked={level === l} onClick={() => setLevel(l)}>{t('botLevel_' + l)}</button>)}</div>
            <button className="btn primary" disabled={!!busy} aria-busy={busy === 'computer'} onClick={computer}>{busy === 'computer' ? t('loading') : t('computerStart')}<ArrowRight size={18} aria-hidden="true"/></button>
          </div>}
        </div>
      </div>
      <div className="mp-code"><JoinForm compact/></div>
    </section>
    {!boot.user.guest && <FriendsOnlinePanel/>}
  </div>;
}
