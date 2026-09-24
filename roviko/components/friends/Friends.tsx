'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { ArrowRight, Check, Copy, DoorOpen, Plus, Send, UserPlus, Users, X } from 'lucide-react';
import { toast } from 'sonner';
import { api, post } from '@/lib/client';
import { DEFAULT_SETTINGS } from '@/lib/config';
import { useApp } from '../app/context';
import { A, Avatar } from '../app/shared';
import { EmptyState, PageHeader, SectionHeader, Skeleton } from '../ds/States';

export type Friend = { id: string; user_id: string; from_id: string; to_id: string; status: 'pending' | 'accepted' | 'blocked'; name: string; avatar: number; score: number; online: number; room_code: string | null };
export type Invite = { id: string; code: string; name: string; avatar: number; created_at: number };

/** Friends with presence, refreshed every 30 seconds while the tab is visible. Guests have no friends list. */
export function useFriends() {
  const { boot } = useApp();
  const [friends, setFriends] = useState<Friend[] | null>(null);
  const load = useCallback(() => { if (boot.user.guest || !boot.user.id) return; api('/friends').then(r => setFriends(r.friends)).catch(() => {}); }, [boot.user.guest, boot.user.id]);
  useEffect(() => {
    load();
    const id = setInterval(() => { if (document.visibilityState === 'visible') load(); }, 30000);
    return () => clearInterval(id);
  }, [load]);
  return { friends, reload: load };
}

/**
 * Heartbeat while the site is open (signed-in players only): marks you online, tells friends
 * which room you are in, and collects room invites addressed to you.
 */
export function usePresence(path: string) {
  const { boot, bootLoaded } = useApp();
  const [invites, setInvites] = useState<Invite[]>([]);
  const room = path.startsWith('/room/') ? path.split('/')[2]?.toUpperCase() ?? null : null;
  useEffect(() => {
    if (!bootLoaded || boot.user.guest || !boot.user.id) return;
    let active = true;
    const beat = () => { if (document.visibilityState !== 'visible') return; post('/presence', { room }).then(r => { if (active) setInvites(r.invites ?? []); }).catch(() => {}); };
    beat();
    const id = setInterval(beat, 40000);
    document.addEventListener('visibilitychange', beat);
    return () => { active = false; clearInterval(id); document.removeEventListener('visibilitychange', beat); };
  }, [bootLoaded, boot.user.guest, boot.user.id, room]);
  return { invites: invites.filter(i => i.code !== room), dismiss: (id: string) => setInvites(list => list.filter(i => i.id !== id)) };
}

/** Invite a friend: into the room you are in, or into a fresh room that opens for you straight away. */
export async function inviteToPlay(app: { go: (href: string) => void }, friend: Friend, currentRoom?: string | null) {
  let code = currentRoom;
  if (!code) code = (await post('/rooms', { settings: DEFAULT_SETTINGS })).code as string;
  await post('/rooms/' + code + '/invite', { friendId: friend.user_id });
  if (!currentRoom) app.go('/room/' + code);
}

function presenceLabel(f: Friend, t: (k: string) => string) {
  return f.online ? (f.room_code ? t('friendsInRoom') : t('friendsOnline')) : t('friendsOffline');
}

/** One friend row: who, online or not, and one action. */
function FriendRow({ friend, action }: { friend: Friend; action?: React.ReactNode }) {
  const { t } = useApp();
  return <li className={'friend-row' + (friend.online ? ' is-online' : '')}>
    <span className="friend-avatar"><Avatar id={friend.avatar}/><span className="presence-dot" aria-hidden="true"/></span>
    <span className="friend-info"><strong>{friend.name}</strong><small>{friend.status === 'accepted' ? presenceLabel(friend, t) : friend.status === 'pending' ? t('pending') : ''}</small></span>
    {action}
  </li>;
}

/** Shown in the room lobby: invite friends in with one tap, no code or link needed. */
export function InvitePanel({ code, inRoom = [] }: { code: string; inRoom?: string[] }) {
  const { t, fail, boot, setModal } = useApp();
  const { friends } = useFriends();
  const [sent, setSent] = useState<Record<string, boolean>>({});
  const everyone = (friends ?? []).filter(f => f.status === 'accepted'), accepted = everyone.filter(f => !inRoom.includes(f.user_id));
  const invite = async (f: Friend) => { try { await inviteToPlay({ go: () => {} }, f, code); setSent(s => ({ ...s, [f.user_id]: true })); toast.success(t('inviteSent').replace('{name}', f.name)); } catch (e) { fail(e); } };
  return <section className="invite-panel" aria-labelledby="invite-panel-title">
    <h3 id="invite-panel-title"><UserPlus size={18} aria-hidden="true"/>{t('inviteFriendsTitle')}</h3>
    {boot.user.guest ? <p className="muted">{t('inviteGuest')} <button className="text-link" onClick={() => setModal('signup')}>{t('signUp')}</button></p>
      : friends === null ? <div className="sk-list"><Skeleton className="sk-block sk-list-row"/><Skeleton className="sk-block sk-list-row"/></div>
      : accepted.length ? <><p className="muted">{t('inviteFriendsCopy')}</p><ul className="friend-list-v2">{accepted.map(f => <FriendRow key={f.id} friend={f} action={sent[f.user_id]
        ? <span className="invite-sent"><Check size={16} aria-hidden="true"/>{t('invited')}</span>
        : <button className="btn secondary btn-sm" onClick={() => invite(f)} disabled={f.room_code === code}><Send size={15} aria-hidden="true"/>{t('inviteOne')}</button>}/>)}</ul></>
      : everyone.length ? <p className="muted">{t('inviteAllHere')}</p> : <p className="muted">{t('inviteNoFriends')} <A className="text-link" href="/friends">{t('friendsList')}</A></p>}
  </section>;
}

/** A friendly card when a friend invites you. One tap joins the room. */
export function InviteInbox({ invites, dismiss }: { invites: Invite[]; dismiss: (id: string) => void }) {
  const { t, go, fail } = useApp();
  const [busy, setBusy] = useState('');
  const invite = invites[0];
  if (!invite) return null;
  const answer = async (status: 'accepted' | 'dismissed') => {
    setBusy(status);
    try {
      await post('/invites/' + invite.id, { status });
      dismiss(invite.id);
      if (status === 'accepted') { await post('/rooms/' + invite.code + '/join'); go('/room/' + invite.code); }
    } catch (e) { dismiss(invite.id); fail(e); } finally { setBusy(''); }
  };
  return <aside className="invite-inbox" role="alertdialog" aria-labelledby="invite-inbox-title" aria-live="polite">
    <Avatar id={invite.avatar}/>
    <div><strong id="invite-inbox-title">{t('inviteIncoming').replace('{name}', invite.name)}</strong><small>{t('inviteIncomingCopy')}</small></div>
    <button className="btn primary btn-sm" disabled={!!busy} aria-busy={busy === 'accepted'} onClick={() => answer('accepted')}>{t('inviteJoin')}<ArrowRight size={16} aria-hidden="true"/></button>
    <button className="icon-btn" aria-label={t('inviteLater')} disabled={!!busy} onClick={() => answer('dismissed')}><X size={18}/></button>
  </aside>;
}

/** The friends page: your code, requests, who is online, one-tap invites. */
export function FriendsPage() {
  const app = useApp(), { t, boot, setModal, fail, copy, go } = app;
  const { friends, reload } = useFriends();
  const [code, setCode] = useState(''), [busy, setBusy] = useState(false), [inviting, setInviting] = useState('');
  const act = async (id: string, status: string) => { try { await post('/friends/' + id, { status }); reload(); } catch (e) { fail(e); } };
  const add = async (e: React.FormEvent) => { e.preventDefault(); setBusy(true); try { await post('/friends', { code }); setCode(''); toast.success(t('friendSaved')); reload(); } catch (err) { fail(err); } finally { setBusy(false); } };
  const invite = async (f: Friend) => { setInviting(f.user_id); try { await inviteToPlay(app, f); toast.success(t('inviteSent').replace('{name}', f.name)); } catch (e) { fail(e); } finally { setInviting(''); } };
  const join = async (f: Friend) => { try { await post('/rooms/' + f.room_code + '/join'); go('/room/' + f.room_code); } catch (e) { fail(e); } };
  if (boot.user.guest) return <div className="page friends-v2"><PageHeader kicker={t('friendsKicker')} title={t('friendsTitle')}/><EmptyState icon={Users} title={t('accountRequired')} copy={t('guestPassport')}><button className="btn primary" onClick={() => setModal('signup')}>{t('signUp')}</button><button className="btn ghost" onClick={() => setModal('login')}>{t('signIn')}</button></EmptyState></div>;
  const visible = (friends ?? []).filter(f => f.status !== 'blocked');
  const requests = visible.filter(f => f.status === 'pending' && f.to_id === boot.user.id);
  const sentRequests = visible.filter(f => f.status === 'pending' && f.to_id !== boot.user.id);
  const accepted = visible.filter(f => f.status === 'accepted');
  const online = accepted.filter(f => f.online), offline = accepted.filter(f => !f.online);
  const playAction = (f: Friend) => f.room_code
    ? <button className="btn secondary btn-sm" onClick={() => join(f)}><DoorOpen size={15} aria-hidden="true"/>{t('joinFriend')}</button>
    : <button className="btn primary btn-sm" disabled={!!inviting} aria-busy={inviting === f.user_id} onClick={() => invite(f)}><Send size={15} aria-hidden="true"/>{t('inviteToPlay')}</button>;
  return <div className="page friends-v2">
    <PageHeader kicker={t('friendsKicker')} title={t('friendsTitle')} lead={t('friendsListCopy')}/>
    <section className="friend-add" aria-labelledby="friend-add-title">
      <div><h2 id="friend-add-title">{t('friendsAddTitle')}</h2><p className="muted">{t('friendsAddCopy')}</p></div>
      <button className="friend-code" onClick={() => copy(boot.user.friendCode)} aria-label={t('friendCode') + ' ' + boot.user.friendCode}><small>{t('friendCode')}</small><b>{boot.user.friendCode}</b><Copy size={16} aria-hidden="true"/></button>
      <form className="friend-form" onSubmit={add}><label className="sr-only" htmlFor="friend-code">{t('friendCode')}</label><input className="code-input" id="friend-code" placeholder={t('friendPlaceholder')} maxLength={8} minLength={8} value={code} onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-F0-9]/g, ''))} autoCapitalize="characters" autoComplete="off" spellCheck={false} required/><button className="btn primary" disabled={busy || code.length !== 8}><Plus size={18} aria-hidden="true"/>{t('addFriend')}</button></form>
    </section>
    {friends === null ? <div className="sk-list">{[0, 1, 2].map(i => <Skeleton key={i} className="sk-block sk-list-row"/>)}</div> : <>
      {requests.length > 0 && <section className="page-section"><SectionHeader title={t('friendsRequests')}/><ul className="friend-list-v2">{requests.map(f => <FriendRow key={f.id} friend={f} action={<span className="row-actions"><button className="btn primary btn-sm" onClick={() => act(f.id, 'accepted')}>{t('accept')}</button><button className="btn ghost btn-sm" onClick={() => act(f.id, 'rejected')}>{t('decline')}</button></span>}/>)}</ul></section>}
      <section className="page-section" aria-labelledby="friends-online"><SectionHeader id="friends-online" title={t('friendsOnlineNow')} action={<span className="muted">{t('friendsOnlineCount').replace('{n}', String(online.length))}</span>}/>
        {online.length ? <ul className="friend-list-v2">{online.map(f => <FriendRow key={f.id} friend={f} action={playAction(f)}/>)}</ul> : <div className="soft-note"><p>{accepted.length ? t('friendsNobodyOnline') : t('friendsEmptyCopy')}</p><button className="text-link" onClick={() => setModal('room')}>{t('createRoom')}<ArrowRight size={16} aria-hidden="true"/></button></div>}
      </section>
      {(offline.length > 0 || sentRequests.length > 0) && <section className="page-section"><SectionHeader title={t('friendsAll')}/><ul className="friend-list-v2">{[...offline, ...sentRequests].map(f => <FriendRow key={f.id} friend={f} action={f.status === 'accepted' ? <span className="row-actions">{playAction(f)}<button className="text-link muted" onClick={() => act(f.id, 'blocked')}>{t('block')}</button></span> : undefined}/>)}</ul></section>}
    </>}
  </div>;
}
