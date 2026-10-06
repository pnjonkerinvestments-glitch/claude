'use client';
import React from 'react';
import { ArrowDown, ArrowRight, ArrowUp } from 'lucide-react';
import { plural } from '@/lib/plural';
import { Avatar } from '../app/shared';

/** The weekly league as the server sends it (server/league.ts). */
export type LeagueState = {
  joined: boolean; guest: boolean; week: string; ends: string; tier?: number; tierName?: string; group?: number; size?: number; place?: number;
  promote?: number; demote?: number; change?: 'up' | 'down' | null;
  members?: { name: string; avatar: number; score: number; place: number; me: boolean; zone: 'up' | 'down' | null }[];
};
const TIERS = ['bronze', 'silver', 'gold', 'emerald', 'diamond'];
const TIER_KEY: Record<string, string> = { bronze: 'tierBronze', silver: 'tierSilver', gold: 'tierGold', emerald: 'tierEmerald', diamond: 'tierDiamond' };
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export const tierLabel = (t: (k: string) => string, tier = 0) => t(TIER_KEY[TIERS[tier] ?? 'bronze']);
export const leagueName = (t: (k: string) => string, tier = 0) => t('leagueName').replace('{tier}', tierLabel(t, tier));

/** A shield in the tier's colour (bronze, silver, gold, emerald, diamond). The name is always written next to it. */
export function TierBadge({ tier = 0, size = 40 }: { tier?: number; size?: number }) {
  return <svg className={'tier-badge tier-' + (TIERS[tier] ?? 'bronze')} viewBox="0 0 40 44" width={size} height={size * 1.1} aria-hidden="true" focusable="false">
    <path d="M20 2 36 8v12c0 11-7 18-16 22C11 38 4 31 4 20V8Z" fill="var(--tier)" stroke="var(--tier-dark)" strokeWidth="2.5" strokeLinejoin="round"/>
    <path d="m20 13 2.6 5.4 5.9.8-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.8Z" fill="#fff" opacity=".92"/>
  </svg>;
}

/** Days until the week ends (UTC), counting today. */
export function daysLeft(ends: string, now = Date.now()) { return Math.max(0, Math.ceil((Date.parse(ends + 'T00:00:00Z') - now) / 86400000)); }

/** One line for the homepage: your league and place, or an invitation. */
export function leagueLine(t: (k: string) => string, league: LeagueState | null) {
  if (!league) return { title: t('leagueTitle'), sub: '' };
  if (league.guest) return { title: t('leagueTitle'), sub: t('leagueGuestShort') };
  if (!league.joined) return { title: leagueName(t, league.tier), sub: t('leagueJoinShort') };
  const days = daysLeft(league.ends);
  return { title: leagueName(t, league.tier), sub: t('leaguePlace').replace('{place}', String(league.place)).replace('{size}', String(league.size)) + ' · ' + (days <= 1 ? t('leagueLastDay') : plural(t, 'leagueDaysLeft', days)) };
}

/** The league card on the rankings page: tier, days left, the group with its promotion and demotion zones. */
export function LeagueCard({ league, t, locale, onSignup, onPlay }: { league: LeagueState | null; t: (k: string) => string; locale: string; onSignup: () => void; onPlay: () => void }) {
  if (!league) return <section className="league-card is-loading" aria-busy="true"><div className="league-head"><TierBadge/><div><h2>{t('leagueTitle')}</h2><p>{t('loading')}</p></div></div></section>;
  const tier = league.tier ?? 0, next = TIERS[tier + 1];
  const n = (v: number) => v.toLocaleString(locale), days = daysLeft(league.ends);
  if (league.guest || !league.joined) return <section className={'league-card tier-' + TIERS[tier]} aria-labelledby="league-title">
    <div className="league-head"><TierBadge tier={tier} size={46}/><div><h2 id="league-title">{league.guest ? t('leagueTitle') : leagueName(t, tier)}</h2><p>{t('leagueHow')}</p></div></div>
    <p className="league-invite">{league.guest ? t('leagueGuest') : t('leagueJoin').replace('{name}', leagueName(t, tier))}</p>
    {league.guest ? <button className="btn gold" onClick={onSignup}>{t('leagueGuestCta')}<ArrowRight size={17} aria-hidden="true"/></button> : <button className="btn primary" onClick={onPlay}>{t('tripStart')}<ArrowRight size={17} aria-hidden="true"/></button>}
  </section>;
  const members = league.members ?? [], up = league.promote ?? 0, down = league.demote ?? 0, size = members.length;
  return <section className={'league-card tier-' + TIERS[tier]} aria-labelledby="league-title">
    <div className="league-head">
      <TierBadge tier={tier} size={46}/>
      <div><h2 id="league-title">{leagueName(t, tier)}</h2><p>{cap(days <= 1 ? t('leagueLastDay') : plural(t, 'leagueDaysLeft', days))} · {next ? t('leagueUp').replace('{n}', String(up)).replace('{tier}', tierLabel(t, tier + 1)) : t('leagueTopTier')}</p></div>
      <span className="league-place">#{league.place}</span>
    </div>
    {league.change && <p className={'league-change is-' + league.change}>{league.change === 'up' ? t('leaguePromoted').replace('{tier}', tierLabel(t, tier)) : t('leagueDemoted').replace('{tier}', tierLabel(t, tier))}</p>}
    <ol className="league-list">{members.map((m, i) => <React.Fragment key={i}>
      {down > 0 && i === size - down && <li className="league-zone is-down" aria-hidden="true"><ArrowDown size={14}/>{t('leagueDemoZone')}</li>}
      <li className={'league-row' + (m.me ? ' is-you' : '') + (m.zone ? ' zone-' + m.zone : '')}>
        <span className="league-num">{m.place}</span><Avatar id={m.avatar}/><span className="league-name">{m.me ? t('competitionYou') : m.name}</span><strong>{n(m.score)}</strong>
      </li>
      {up > 0 && i === Math.min(up, size) - 1 && size > up && <li className="league-zone is-up" aria-hidden="true"><ArrowUp size={14}/>{t('leaguePromoZone')}</li>}
    </React.Fragment>)}</ol>
  </section>;
}
