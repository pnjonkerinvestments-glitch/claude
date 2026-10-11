'use client';
import { useCallback, useEffect, useState } from 'react';
import { api, post } from '@/lib/client';
import { mergeProgress, type Progress } from '@/lib/learn';
import { dutchCapital } from '../../i18n/capitals-nl';
import { spanishCapital, spanishCountry } from '../../i18n/content';
import { useApp } from '../app/context';

/*
 * Learn progress on this device (1.38). Guests keep it here only; with an account it also lives on the server
 * (/api/learn) and both copies merge per card, newest wins (lib/learn.ts). Signing in takes the guest's
 * progress along. A failed save is retried with everything on the next visit.
 */
const keyOf = (owner: string) => 'roviko:learn:v1:' + owner;
const UNSYNCED = 'roviko:learn:unsynced:';
const EVENT = 'roviko:learn';
function readLocal(owner: string): Progress { try { return mergeProgress(JSON.parse(localStorage.getItem(keyOf(owner)) ?? '{}'), {}); } catch { return {}; } }
function writeLocal(owner: string, p: Progress) { try { localStorage.setItem(keyOf(owner), JSON.stringify(p)); } catch { /* storage full or blocked: progress lasts this visit */ } }
function flag(owner: string, on: boolean) { try { if (on) localStorage.setItem(UNSYNCED + owner, '1'); else localStorage.removeItem(UNSYNCED + owner); } catch { /* ignore */ } }
function flagged(owner: string) { try { return localStorage.getItem(UNSYNCED + owner) === '1'; } catch { return false; } }

const synced = new Set<string>();
export function useLearn() {
  const { boot, bootLoaded } = useApp();
  const account = bootLoaded && boot?.user?.id && !boot.user.guest ? String(boot.user.id) : null;
  const owner = account ?? 'guest';
  const [progress, setProgress] = useState<Progress>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setProgress(readLocal(owner)); setReady(bootLoaded);
    const reread = () => setProgress(readLocal(owner));
    window.addEventListener(EVENT, reread);
    return () => window.removeEventListener(EVENT, reread);
  }, [owner, bootLoaded]);

  // Once per account per page load: fetch the server copy, fold in this device (and a guest's progress from
  // before signing in), and send back anything the server did not have yet.
  useEffect(() => {
    if (!account || synced.has(account)) return;
    synced.add(account);
    let on = true;
    (async () => {
      try {
        const server: Progress = (await api('/learn')).progress ?? {};
        const guest = readLocal('guest'), mine = readLocal(account);
        const merged = mergeProgress(mergeProgress(server, mine), guest);
        const missing = Object.keys(merged).some(k => !server[k] || server[k].t !== merged[k].t);
        writeLocal(account, merged); if (Object.keys(guest).length) writeLocal('guest', {});
        if (on) setProgress(merged);
        window.dispatchEvent(new Event(EVENT));
        if (missing || flagged(account)) { const saved: Progress = (await post('/learn', { progress: merged })).progress ?? merged; writeLocal(account, mergeProgress(readLocal(account), saved)); flag(account, false); window.dispatchEvent(new Event(EVENT)); }
      } catch { synced.delete(account); }
    })();
    return () => { on = false; };
  }, [account]);

  /** Save changed cards here at once, then on the server for an account. */
  const save = useCallback((cards: Progress) => {
    const next = mergeProgress(readLocal(owner), cards);
    writeLocal(owner, next); setProgress(next); window.dispatchEvent(new Event(EVENT));
    if (account) post('/learn', { progress: cards }).then(r => { if (r?.progress) writeLocal(account, mergeProgress(readLocal(account), r.progress)); }).catch(() => flag(account, true));
  }, [owner, account]);

  return { progress, save, ready, guest: !account };
}

/** Country names, capitals and flags for the lessons, loaded once from the public data file. */
export type LearnCountry = { id: string; name: string; capital: string; flag: string };
let data: Promise<any[]> | null = null;
const loadCountries = () => data ??= fetch('/data/countries.json').then(r => { if (!r.ok) throw new Error('load'); return r.json(); }).catch(e => { data = null; throw e; });
export function useCountries() {
  const { locale } = useApp();
  const [list, setList] = useState<any[] | null>(null), [error, setError] = useState(false), [attempt, setAttempt] = useState(0);
  useEffect(() => { let on = true; setError(false); loadCountries().then(v => { if (on) setList(v); }).catch(() => { if (on) setError(true); }); return () => { on = false; }; }, [attempt]);
  const byId = new Map<string, LearnCountry>();
  for (const c of list ?? []) {
    const cap = c.capitals?.[0] ?? '';
    byId.set(c.id, { id: c.id, flag: c.flag + '?v=3', name: locale === 'nl' ? c.nl : locale === 'es' ? spanishCountry(c.name) : c.name, capital: locale === 'nl' ? dutchCapital(cap) : locale === 'es' ? spanishCapital(cap) : cap });
  }
  return { byId, loaded: !!list, error, retry: () => setAttempt(a => a + 1) };
}
