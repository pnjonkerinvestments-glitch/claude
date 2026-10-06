'use client';
import React, { useState } from 'react';
import { ArrowRight, Check, Copy, Crown, LogOut, Plus, Settings2, Share2, X } from 'lucide-react';
import { BRAND } from '@/lib/config';
import { GlobeAvatar } from '../ds/GlobeAvatar';
import { RoomScene } from '../ds/RoomScene';
import { InvitePanel } from '../friends/Friends';
import { LobbyComputer, removeComputer } from './Computer';
import { PlayerActions } from './PlayerActions';

type T = (key: string) => string;
type Player = { id: string; name: string; avatar: number; bot?: boolean; level?: string; ready?: boolean; connected?: boolean };
type Room = { host: string; players: Player[]; settings: { count: number; difficulty: string } & Record<string, unknown> };
const MAX = 12, ROUNDS = [5, 10, 15, 20], LEVELS = ['easy', 'medium', 'hard', 'mixed'];

/**
 * The waiting room as one clean card (1.23, after the owner's design): the friends by the lake, "Room K7QMA",
 * rounds and difficulty as two segmented rows, the players as round globes and one big button. Every other
 * setting (game type, timer, region) sits under "More settings"; inviting friends and the computer below.
 */
export function RoomLobby({ room, code, me, connected, settingsBusy, onSettings, send, leave, copy, fail, t, moreSettings }: {
  room: Room; code: string; me: string; connected: boolean; settingsBusy: boolean; onSettings: (v: Record<string, unknown>) => void;
  send: (type: string, body?: Record<string, unknown>) => boolean; leave: () => void; copy: (text: string) => void; fail: (e: unknown) => void; t: T;
  moreSettings: React.ReactNode;
}) {
  const isHost = room.host === me, self = room.players.find(p => p.id === me), host = room.players.find(p => p.id === room.host);
  const [inviteOpen, setInviteOpen] = useState(false);
  const set = (k: string, v: unknown) => { if (isHost && !settingsBusy) onSettings({ ...room.settings, [k]: v }); };
  const link = typeof location === 'undefined' ? '' : location.origin + '/room/' + code;
  const shareCode = () => {
    const nav = typeof navigator === 'undefined' ? undefined : navigator;
    if (nav?.share) nav.share({ title: BRAND.name, text: t('togetherCopy') + ' ' + code, url: link }).catch(() => {});
    else copy(link);
  };
  const bots = room.players.filter(p => p.bot).length, full = room.players.length >= MAX;
  const empty = isHost && !full ? 1 : 0;
  const nameOf = (p: Player) => p.id === me ? t('youLabel') : p.name;

  return <div className="room-lobby">
    <section className="lobby-card" aria-labelledby="lobby-title">
      <RoomScene className="lobby-scene"/>
      <header className="lobby-head">
        <div>
          <h1 id="lobby-title">{t('roomHeading').replace('{code}', code)}</h1>
          <p>{(isHost ? t('roomHostYou') : t('roomHostOther').replace('{name}', host?.name ?? '')).replace('{n}', String(MAX))}</p>
        </div>
        <span className="lobby-count" aria-label={t('playersInRoom').replace('{n}', String(room.players.length))}>{room.players.length}/{MAX}</span>
      </header>

      <div className="lobby-settings" role="group" aria-label={t('settings')}>
        <div className="lobby-setting"><span id="lobby-rounds">{t('rounds')}</span>
          <div className="segmented-pill" role="radiogroup" aria-labelledby="lobby-rounds">{ROUNDS.map(n => <button key={n} type="button" role="radio" aria-checked={room.settings.count === n} disabled={!isHost || settingsBusy} onClick={() => set('count', n)}>{n}</button>)}</div>
        </div>
        <div className="lobby-setting"><span id="lobby-level">{t('difficulty')}</span>
          <div className="segmented-pill" role="radiogroup" aria-labelledby="lobby-level">{LEVELS.map(v => <button key={v} type="button" role="radio" aria-checked={room.settings.difficulty === v} disabled={!isHost || settingsBusy} onClick={() => set('difficulty', v)}>{t(v === 'mixed' ? 'difficultyMixed' : v)}</button>)}</div>
        </div>
        <details className="lobby-more"><summary><Settings2 size={16} aria-hidden="true"/>{t('roomMore')}</summary>{moreSettings}<p className="lobby-rules">{t('lobbyRules')}</p></details>
      </div>

      <ul className="lobby-avatars" aria-label={t('players')}>
        {room.players.map(p => <li key={p.id} className={(p.id === room.host ? 'is-host ' : '') + (p.ready ? 'is-ready ' : '') + (p.bot ? 'is-bot ' : '') + (p.id === me ? 'is-me' : '')}>
          <span className="lobby-avatar"><GlobeAvatar id={p.avatar} size={58}/>{p.id === room.host && <Crown className="lobby-crown" size={20} strokeWidth={2.4} aria-label={t('host')}/>}{p.ready && p.id !== room.host && <span className="lobby-ready" aria-label={t('ready')}><Check size={12} strokeWidth={3.4}/></span>}</span>
          <strong>{nameOf(p)}</strong>
          <small>{p.bot ? t('botLevel_' + (p.level ?? 'medium')) : p.connected === false ? t('reconnecting') : p.id === room.host ? t('host') : p.ready ? t('ready') : t('notReady')}</small>
          {p.bot && isHost && <button className="lobby-remove" onClick={() => removeComputer(code, p.id, fail)} aria-label={t('removeComputer').replace('{name}', p.name)}><X size={14}/></button>}
          {!p.bot && p.id !== me && <PlayerActions player={p} t={t} room={code}/>}
        </li>)}
        {Array.from({ length: empty }, (_, i) => <li key={'empty' + i} className="is-empty"><button type="button" className="lobby-avatar lobby-add" onClick={() => setInviteOpen(true)} aria-label={t('roomInviteSlot')}><Plus size={22}/></button><strong>{t('roomInviteSlot')}</strong></li>)}
      </ul>

      <div className="lobby-actions">
        {isHost
          ? <button className="btn primary btn-lg" disabled={!connected || settingsBusy} onClick={() => send('start')}>{t('startGame')}<ArrowRight size={19} aria-hidden="true"/></button>
          : <><button className={'btn btn-lg ' + (self?.ready ? 'ready-btn' : 'primary')} disabled={!connected} onClick={() => send('ready', { ready: !self?.ready })}><Check size={18} aria-hidden="true"/>{t(self?.ready ? 'notReadyButton' : 'setReady')}</button><p className="muted">{t('waitingHost')}</p></>}
        <div className="lobby-secondary">
          <button className="btn secondary" onClick={shareCode}><Share2 size={17} aria-hidden="true"/>{t('roomShareCode').replace('{code}', code)}</button>
          <button className="btn ghost" onClick={() => copy(code)} aria-label={t('copyCode')}><Copy size={17} aria-hidden="true"/></button>
          {isHost && <LobbyComputer code={code} t={t} fail={fail} bots={bots} full={full}/>}
        </div>
      </div>
    </section>

    <details className="lobby-invite" open={inviteOpen} onToggle={e => setInviteOpen((e.target as HTMLDetailsElement).open)}>
      <summary>{t('inviteFriendsTitle')}</summary>
      <InvitePanel code={code} inRoom={room.players.map(p => p.id)}/>
    </details>
    <p className="lobby-foot"><button className="text-link" onClick={leave}><LogOut size={15} aria-hidden="true"/>{t('leaveRoom')}</button></p>
  </div>;
}
