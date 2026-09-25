'use client';
import React, { useState } from 'react';
import { ArrowRight, Bot, Plus, Search, X } from 'lucide-react';
import { post } from '@/lib/client';
import { DEFAULT_SETTINGS } from '@/lib/config';
import { BOT_LEVELS, type BotLevel } from '@/lib/game-engine/bots';
import { Mascot } from '../ds/Mascot';

type T = (key: string) => string;
/** How long a quick match searches before the computer is offered (matches the server). */
export const QUICK_SEARCH_MS = 3 * 60000;
const clock = (ms: number) => { const s = Math.max(0, Math.floor(ms / 1000)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

/** Easy, medium or hard: how good the computer is, with one line on what that means. */
export function LevelPicker({ value, onChange, t, name }: { value: BotLevel; onChange: (level: BotLevel) => void; t: T; name: string }) {
  return <fieldset className="level-picker">
    <legend className="field-label">{t('computerLevel')}</legend>
    <div className="level-options">{BOT_LEVELS.map(level => <label key={level} className={'level-option level-' + level + (value === level ? ' is-selected' : '')}>
      <input type="radio" name={name} value={level} checked={value === level} onChange={() => onChange(level)}/>
      <span className="level-dots" aria-hidden="true">{BOT_LEVELS.map((l, i) => <i key={l} className={i <= BOT_LEVELS.indexOf(level) ? 'on' : ''}/>)}</span>
      <strong>{t('botLevel_' + level)}</strong>
      <small>{t('botLevelHint_' + level)}</small>
    </label>)}</div>
  </fieldset>;
}

/** The two ways to play without friends online: a random player or the computer. */
export function PlayNow({ t, go, fail }: { t: T; go: (href: string) => void; fail: (e: unknown) => void }) {
  const [level, setLevel] = useState<BotLevel>('medium'), [busy, setBusy] = useState('');
  const run = async (kind: string, task: () => Promise<string>) => { if (busy) return; setBusy(kind); try { go('/room/' + await task()); } catch (e) { fail(e); setBusy(''); } };
  const quick = () => run('quick', async () => (await post('/match/quick', {})).code);
  const computer = () => run('computer', async () => { const room = await post('/rooms', { settings: DEFAULT_SETTINGS }); await post('/rooms/' + room.code + '/computer', { level }); return room.code; });
  return <section className="play-now" aria-labelledby="play-now-title">
    <header className="section-header"><div><h2 id="play-now-title">{t('playNowTitle')}</h2><p className="muted">{t('playNowLead')}</p></div></header>
    <div className="play-now-grid">
      <article className="play-now-card play-now-quick">
        <span className="play-now-icon" aria-hidden="true"><Search size={24} strokeWidth={2.2}/></span>
        <h3>{t('quickTitle')}</h3>
        <p>{t('quickCopy')}</p>
        <p className="play-now-note">{t('quickComputerSoon')}</p>
        <button className="btn primary" disabled={!!busy} aria-busy={busy === 'quick'} onClick={quick}>{busy === 'quick' ? t('loading') : t('quickStart')}<ArrowRight size={18} aria-hidden="true"/></button>
      </article>
      <article className="play-now-card play-now-computer">
        <span className="play-now-icon" aria-hidden="true"><Bot size={24} strokeWidth={2.2}/></span>
        <h3>{t('computerTitle')}</h3>
        <p>{t('computerCopy')}</p>
        <LevelPicker value={level} onChange={setLevel} t={t} name="page-level"/>
        <button className="btn primary" disabled={!!busy} aria-busy={busy === 'computer'} onClick={computer}>{busy === 'computer' ? t('loading') : t('computerStart')}<ArrowRight size={18} aria-hidden="true"/></button>
      </article>
    </div>
  </section>;
}

/** Waiting for a random opponent. After three minutes the computer is offered; waiting on stays possible. */
export function QuickSearch({ room, now, t, code, onCancel, fail }: { room: { createdAt: number }; now: number; t: T; code: string; onCancel: () => void; fail: (e: unknown) => void }) {
  const [level, setLevel] = useState<BotLevel>('medium'), [busy, setBusy] = useState(false), [dismissed, setDismissed] = useState(false);
  const waited = now - room.createdAt, offer = waited >= QUICK_SEARCH_MS && !dismissed;
  const computer = async () => { if (busy) return; setBusy(true); try { await post('/rooms/' + code + '/computer', { level }); } catch (e) { fail(e); setBusy(false); } };
  return <section className={'quick-search' + (offer ? ' is-offer' : '')} aria-labelledby="quick-title">
    <div className="quick-radar" aria-hidden="true"><span/><span/><span/><Mascot mood={offer ? 'wink' : 'curious'} size={120}/></div>
    <h1 id="quick-title">{t('quickSearching')}</h1>
    <p className="quick-elapsed" role="timer" aria-live="off">{t('quickElapsed').replace('{time}', clock(waited))}</p>
    {!offer ? <>
      <p className="muted">{t('quickSearchingCopy')}</p>
      <p className="quick-soon">{t('quickComputerSoon')}</p>
      <button className="btn ghost" onClick={onCancel}><X size={17} aria-hidden="true"/>{t('quickCancel')}</button>
    </> : <div className="quick-offer" role="status">
      <p>{t('quickNobody')}</p>
      <h2>{t('quickComputerOffer')}</h2>
      <LevelPicker value={level} onChange={setLevel} t={t} name="quick-level"/>
      <div className="quick-offer-actions">
        <button className="btn primary btn-lg" disabled={busy} aria-busy={busy} onClick={computer}><Bot size={19} aria-hidden="true"/>{busy ? t('loading') : t('computerTitle')}</button>
        <button className="btn ghost" disabled={busy} onClick={() => setDismissed(true)}>{t('quickKeepWaiting')}</button>
      </div>
      <p className="muted small-print">{t('computerCopy')}</p>
    </div>}
  </section>;
}

/** In a normal lobby the host can add computer players of any level, and remove them again. */
export function LobbyComputer({ code, t, fail, bots, full }: { code: string; t: T; fail: (e: unknown) => void; bots: number; full: boolean }) {
  const [level, setLevel] = useState<BotLevel>('medium'), [busy, setBusy] = useState(false), [open, setOpen] = useState(false);
  const add = async () => { if (busy) return; setBusy(true); try { await post('/rooms/' + code + '/bot', { level }); setOpen(false); } catch (e) { fail(e); } finally { setBusy(false); } };
  if (full || bots >= 5) return null;
  return <div className={'lobby-computer' + (open ? ' is-open' : '')}>
    {!open ? <button className="btn secondary" onClick={() => setOpen(true)}><Bot size={17} aria-hidden="true"/>{t('addComputer')}</button> : <>
      <LevelPicker value={level} onChange={setLevel} t={t} name="lobby-level"/>
      <div className="lobby-computer-actions">
        <button className="btn primary" disabled={busy} aria-busy={busy} onClick={add}><Plus size={17} aria-hidden="true"/>{t('addComputer')}</button>
        <button className="btn ghost" onClick={() => setOpen(false)}>{t('cancel')}</button>
      </div>
      <p className="muted small-print">{t('computerNoRanking')}</p>
    </>}
  </div>;
}

export async function removeComputer(code: string, id: string, fail: (e: unknown) => void) {
  try { await post('/rooms/' + code + '/removeBot', { id }); } catch (e) { fail(e); }
}
